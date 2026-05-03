import { Client } from "@neondatabase/serverless";
import { createClerkClient } from "@clerk/backend";
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = {
    email: "",
    envFile: "/private/tmp/cli-dojo-prod.env",
    clerkEnvFile: path.resolve(".env.local"),
    dryRun: false,
    yes: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith("--") && !args.email) {
      args.email = token;
      continue;
    }

    if (token === "--env-file") {
      args.envFile = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (token === "--clerk-env-file") {
      args.clerkEnvFile = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (token === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (token === "--yes") {
      args.yes = true;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return args;
}

function readEnvFile(filePath) {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    return {};
  }

  const content = fs.readFileSync(absolutePath, "utf8");
  const entries = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const separatorIndex = line.indexOf("=");
      const key = line.slice(0, separatorIndex);
      const rawValue = line.slice(separatorIndex + 1);
      const value = rawValue.replace(/^"/, "").replace(/"$/, "");

      return [key, value];
    });

  return Object.fromEntries(entries);
}

function requireValue(value, message) {
  if (!value) {
    throw new Error(message);
  }

  return value;
}

async function loadTargets({ email, databaseUrl }) {
  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();

    const result = await client.query(
      `
        SELECT
          u.id AS user_id,
          u.canonical_email,
          ui.provider_user_id AS clerk_user_id,
          (
            SELECT COUNT(*)
            FROM section_attempts sa
            WHERE sa.user_id = u.id
          ) AS attempts,
          (
            SELECT COUNT(*)
            FROM answer_records ar
            WHERE ar.user_id = u.id
          ) AS answers
        FROM users u
        LEFT JOIN user_identities ui
          ON ui.user_id = u.id
         AND ui.provider = 'clerk'
        WHERE lower(coalesce(u.canonical_email, ui.email, '')) = lower($1)
        ORDER BY u.created_at
      `,
      [email],
    );

    return result.rows.map((row) => ({
      userId: row.user_id,
      canonicalEmail: row.canonical_email,
      clerkUserId: row.clerk_user_id,
      attempts: Number(row.attempts),
      answers: Number(row.answers),
    }));
  } finally {
    await client.end();
  }
}

async function deleteDatabaseRecords({ userIds, databaseUrl }) {
  if (userIds.length === 0) {
    return {
      answerRecordsDeleted: 0,
      sectionAttemptsDeleted: 0,
      identitiesDeleted: 0,
      usersDeleted: 0,
    };
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    await client.query("BEGIN");

    const answerRecordsDeleted = await client.query(
      "DELETE FROM answer_records WHERE user_id = ANY($1::uuid[])",
      [userIds],
    );
    const sectionAttemptsDeleted = await client.query(
      "DELETE FROM section_attempts WHERE user_id = ANY($1::uuid[])",
      [userIds],
    );
    const identitiesDeleted = await client.query(
      "DELETE FROM user_identities WHERE user_id = ANY($1::uuid[])",
      [userIds],
    );
    const usersDeleted = await client.query(
      "DELETE FROM users WHERE id = ANY($1::uuid[])",
      [userIds],
    );

    await client.query("COMMIT");

    return {
      answerRecordsDeleted: answerRecordsDeleted.rowCount ?? 0,
      sectionAttemptsDeleted: sectionAttemptsDeleted.rowCount ?? 0,
      identitiesDeleted: identitiesDeleted.rowCount ?? 0,
      usersDeleted: usersDeleted.rowCount ?? 0,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

async function loadClerkUsers({ email, clerkSecretKey }) {
  const clerkClient = createClerkClient({ secretKey: clerkSecretKey });
  const users = await clerkClient.users.getUserList({
    emailAddress: [email],
  });

  return users.map((user) => ({
    id: user.id,
    emails: (user.emailAddresses ?? []).map((entry) => entry.emailAddress),
  }));
}

async function deleteClerkUsers({ clerkUserIds, clerkSecretKey }) {
  if (clerkUserIds.length === 0) {
    return [];
  }

  const clerkClient = createClerkClient({ secretKey: clerkSecretKey });
  const deleted = [];

  for (const clerkUserId of clerkUserIds) {
    await clerkClient.users.deleteUser(clerkUserId);
    deleted.push(clerkUserId);
  }

  return deleted;
}

function printUsage() {
  console.log(
    [
      "Usage:",
      "  npm run reset:test-user -- <email> --yes [--dry-run] [--env-file <path>] [--clerk-env-file <path>]",
      "",
      "Defaults:",
      "  --env-file /private/tmp/cli-dojo-prod.env",
      "  --clerk-env-file .env.local",
    ].join("\n"),
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.email) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (!args.yes) {
    throw new Error("Refusing to delete without --yes");
  }

  const targetEnv = readEnvFile(args.envFile);
  const clerkEnv = readEnvFile(args.clerkEnvFile);

  const databaseUrl = requireValue(
    targetEnv.DATABASE_URL,
    `DATABASE_URL is missing in ${path.resolve(args.envFile)}`,
  );
  const clerkSecretKey = requireValue(
    targetEnv.CLERK_SECRET_KEY || clerkEnv.CLERK_SECRET_KEY,
    `CLERK_SECRET_KEY is missing in ${path.resolve(args.envFile)} and ${path.resolve(args.clerkEnvFile)}`,
  );

  const dbTargets = await loadTargets({
    email: args.email,
    databaseUrl,
  });
  const clerkTargets = await loadClerkUsers({
    email: args.email,
    clerkSecretKey,
  });

  const dbUserIds = [...new Set(dbTargets.map((target) => target.userId).filter(Boolean))];
  const dbClerkUserIds = dbTargets.map((target) => target.clerkUserId).filter(Boolean);
  const clerkUserIds = [...new Set([...dbClerkUserIds, ...clerkTargets.map((target) => target.id)])];

  console.log(
    JSON.stringify(
      {
        email: args.email,
        dryRun: args.dryRun,
        databaseTargets: dbTargets,
        clerkTargets,
      },
      null,
      2,
    ),
  );

  if (args.dryRun) {
    return;
  }

  const deletedClerkUserIds = await deleteClerkUsers({
    clerkUserIds,
    clerkSecretKey,
  });
  const deletedDatabaseCounts = await deleteDatabaseRecords({
    userIds: dbUserIds,
    databaseUrl,
  });

  console.log(
    JSON.stringify(
      {
        deletedClerkUserIds,
        deletedDatabaseCounts,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
