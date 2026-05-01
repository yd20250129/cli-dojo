import { resolveVerifiedEmailLinkCandidate } from "@/lib/server/accounts-repository";
import { getSql } from "@/lib/server/db";
import type { AuthenticatedUser } from "@/types";

type UserRow = {
  id: string;
  clerk_user_id: string;
  canonical_email: string | null;
  canonical_email_verified: boolean;
  created_at: Date | string;
  updated_at: Date | string;
};

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function mapAuthenticatedUser(row: UserRow): AuthenticatedUser {
  return {
    userId: row.id,
    clerkUserId: row.clerk_user_id,
    canonicalEmail: row.canonical_email,
    canonicalEmailVerified: row.canonical_email_verified,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function isUniqueViolation(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505",
  );
}

function normalizeEmail(email: string | null | undefined) {
  const value = email?.trim().toLowerCase();
  return value ? value : null;
}

async function getUserByIdentity(clerkUserId: string) {
  const sql = getSql();
  const rows = await sql`
    SELECT
      users.*,
      user_identities.provider_user_id AS clerk_user_id
    FROM users
    INNER JOIN user_identities
      ON user_identities.user_id = users.id
    WHERE user_identities.provider = 'clerk'
      AND user_identities.provider_user_id = ${clerkUserId}
    LIMIT 1
  `;

  return rows[0] ? mapAuthenticatedUser(rows[0] as UserRow) : null;
}

async function getUserByLegacyAccount(clerkUserId: string) {
  const sql = getSql();
  const rows = await sql`
    SELECT
      users.*,
      accounts.clerk_user_id
    FROM users
    INNER JOIN accounts
      ON accounts.user_id = users.id
    WHERE accounts.clerk_user_id = ${clerkUserId}
    LIMIT 1
  `;

  return rows[0] ? mapAuthenticatedUser(rows[0] as UserRow) : null;
}

async function getUserById(userId: string, clerkUserId: string) {
  const sql = getSql();
  const rows = await sql`
    SELECT
      users.*,
      ${clerkUserId}::text AS clerk_user_id
    FROM users
    WHERE users.id = ${userId}
    LIMIT 1
  `;

  return rows[0] ? mapAuthenticatedUser(rows[0] as UserRow) : null;
}

async function syncCanonicalEmail(userId: string, verifiedEmail?: string | null) {
  const email = normalizeEmail(verifiedEmail);

  if (!email) {
    return;
  }

  const sql = getSql();
  await sql`
    UPDATE users
    SET
      canonical_email = ${email},
      canonical_email_verified = true,
      updated_at = now()
    WHERE id = ${userId}
      AND (
        canonical_email IS DISTINCT FROM ${email}
        OR canonical_email_verified = false
      )
  `;
}

async function ensureUserIdentity(params: {
  userId: string;
  clerkUserId: string;
  verifiedEmail?: string | null;
}) {
  const sql = getSql();
  const email = normalizeEmail(params.verifiedEmail);

  await sql`
    INSERT INTO user_identities (
      user_id,
      provider,
      provider_user_id,
      email,
      email_verified
    )
    VALUES (
      ${params.userId},
      'clerk',
      ${params.clerkUserId},
      ${email},
      ${Boolean(email)}
    )
    ON CONFLICT (provider, provider_user_id)
    DO UPDATE SET
      email = COALESCE(EXCLUDED.email, user_identities.email),
      email_verified = user_identities.email_verified OR EXCLUDED.email_verified,
      updated_at = now()
  `;

  await syncCanonicalEmail(params.userId, email);
}

async function ensureLegacyAccount(user: AuthenticatedUser) {
  const sql = getSql();
  await sql`
    INSERT INTO accounts (
      user_id,
      clerk_user_id
    )
    VALUES (
      ${user.userId},
      ${user.clerkUserId}
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      clerk_user_id = EXCLUDED.clerk_user_id,
      updated_at = now()
  `;
}

async function findLinkedUserIdByVerifiedEmail(email: string) {
  const sql = getSql();
  const rows = await sql`
    SELECT DISTINCT user_id
    FROM user_identities
    WHERE email_verified = true
      AND LOWER(email) = ${email}
    LIMIT 2
  `;

  return resolveVerifiedEmailLinkCandidate(
    rows as Array<{ user_id: string | number }>,
  );
}

async function createUser(params: {
  clerkUserId: string;
  verifiedEmail?: string | null;
}) {
  const sql = getSql();
  const email = normalizeEmail(params.verifiedEmail);
  const rows = await sql`
    WITH new_user AS (
      INSERT INTO users (
        canonical_email,
        canonical_email_verified
      )
      VALUES (
        ${email},
        ${Boolean(email)}
      )
      RETURNING *
    ),
    new_identity AS (
      INSERT INTO user_identities (
        user_id,
        provider,
        provider_user_id,
        email,
        email_verified
      )
      SELECT
        new_user.id,
        'clerk',
        ${params.clerkUserId},
        ${email},
        ${Boolean(email)}
      FROM new_user
    ),
    new_account AS (
      INSERT INTO accounts (
        user_id,
        clerk_user_id
      )
      SELECT
        new_user.id,
        ${params.clerkUserId}
      FROM new_user
    )
    SELECT
      new_user.*,
      ${params.clerkUserId}::text AS clerk_user_id
    FROM new_user
  `;

  return mapAuthenticatedUser(rows[0] as UserRow);
}

export async function getOrCreateAuthenticatedUser(params: {
  clerkUserId: string;
  verifiedEmail?: string | null;
}): Promise<AuthenticatedUser> {
  const email = normalizeEmail(params.verifiedEmail);
  const existingIdentityUser = await getUserByIdentity(params.clerkUserId);

  if (existingIdentityUser) {
    await ensureUserIdentity({
      userId: existingIdentityUser.userId,
      clerkUserId: params.clerkUserId,
      verifiedEmail: email,
    });

    const syncedUser =
      (await getUserById(existingIdentityUser.userId, params.clerkUserId)) ??
      existingIdentityUser;
    await ensureLegacyAccount(syncedUser);
    return syncedUser;
  }

  const existingLegacyUser = await getUserByLegacyAccount(params.clerkUserId);

  if (existingLegacyUser) {
    await ensureUserIdentity({
      userId: existingLegacyUser.userId,
      clerkUserId: params.clerkUserId,
      verifiedEmail: email,
    });

    const syncedUser =
      (await getUserById(existingLegacyUser.userId, params.clerkUserId)) ??
      existingLegacyUser;
    await ensureLegacyAccount(syncedUser);
    return syncedUser;
  }

  if (email) {
    const linkedUserId = await findLinkedUserIdByVerifiedEmail(email);

    if (linkedUserId) {
      await ensureUserIdentity({
        userId: linkedUserId,
        clerkUserId: params.clerkUserId,
        verifiedEmail: email,
      });

      const linkedUser = await getUserById(linkedUserId, params.clerkUserId);

      if (linkedUser) {
        await ensureLegacyAccount(linkedUser);
        return linkedUser;
      }
    }
  }

  try {
    return await createUser({
      clerkUserId: params.clerkUserId,
      verifiedEmail: email,
    });
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }

    const user =
      (await getUserByIdentity(params.clerkUserId)) ??
      (await getUserByLegacyAccount(params.clerkUserId));

    if (!user) {
      throw error;
    }

    await ensureUserIdentity({
      userId: user.userId,
      clerkUserId: params.clerkUserId,
      verifiedEmail: email,
    });

    const syncedUser = (await getUserById(user.userId, params.clerkUserId)) ?? user;
    await ensureLegacyAccount(syncedUser);
    return syncedUser;
  }
}
