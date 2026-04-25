import { getSql } from "@/lib/server/db";
import type { Account } from "@/types";

type AccountRow = {
  id: string;
  clerk_user_id: string;
  created_at: Date | string;
  updated_at: Date | string;
};

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function mapAccount(row: AccountRow): Account {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
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

export async function getOrCreateAccount(clerkUserId: string): Promise<Account> {
  const sql = getSql();
  const existing = await sql`
    SELECT *
    FROM accounts
    WHERE clerk_user_id = ${clerkUserId}
    LIMIT 1
  `;

  if (existing[0]) {
    return mapAccount(existing[0] as AccountRow);
  }

  try {
    const inserted = await sql`
      INSERT INTO accounts (clerk_user_id)
      VALUES (${clerkUserId})
      RETURNING *
    `;

    return mapAccount(inserted[0] as AccountRow);
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }

    const rows = await sql`
      SELECT *
      FROM accounts
      WHERE clerk_user_id = ${clerkUserId}
      LIMIT 1
    `;

    return mapAccount(rows[0] as AccountRow);
  }
}
