import { getSql } from "@/lib/server/db";
import {
  defaultUserPreferences,
  isCurrency,
  isLocale,
  isRegion,
} from "@/lib/i18n/config";
import type { Account } from "@/types";

type AccountRow = {
  id: string;
  user_id: string;
  clerk_user_id: string;
  locale: string;
  region: string;
  timezone: string;
  currency: string;
  created_at: Date | string;
  updated_at: Date | string;
};

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function mapAccount(row: AccountRow): Account {
  return {
    id: row.id,
    userId: row.user_id,
    clerkUserId: row.clerk_user_id,
    locale: isLocale(row.locale) ? row.locale : defaultUserPreferences.locale,
    region: isRegion(row.region) ? row.region : defaultUserPreferences.region,
    timezone: row.timezone ?? defaultUserPreferences.timezone,
    currency: isCurrency(row.currency) ? row.currency : defaultUserPreferences.currency,
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

export function resolveVerifiedEmailLinkCandidate(
  rows: Array<{ user_id: string | number }>,
) {
  return rows.length === 1 ? String(rows[0].user_id) : null;
}

async function getAccountByClerkUserId(clerkUserId: string) {
  const sql = getSql();
  const rows = await sql`
    SELECT *
    FROM accounts
    WHERE clerk_user_id = ${clerkUserId}
    LIMIT 1
  `;

  return rows[0] ? mapAccount(rows[0] as AccountRow) : null;
}

async function getAccountByIdentity(clerkUserId: string) {
  const sql = getSql();
  const rows = await sql`
    SELECT accounts.*
    FROM accounts
    INNER JOIN user_identities
      ON user_identities.user_id = accounts.user_id
    WHERE user_identities.provider = 'clerk'
      AND user_identities.provider_user_id = ${clerkUserId}
    LIMIT 1
  `;

  return rows[0] ? mapAccount(rows[0] as AccountRow) : null;
}

async function getAccountByUserId(userId: string) {
  const sql = getSql();
  const rows = await sql`
    SELECT *
    FROM accounts
    WHERE user_id = ${userId}
    LIMIT 1
  `;

  return rows[0] ? mapAccount(rows[0] as AccountRow) : null;
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

async function createAccount(params: {
  clerkUserId: string;
  verifiedEmail?: string | null;
}) {
  const sql = getSql();
  const email = normalizeEmail(params.verifiedEmail);
  const rows = await sql`
    WITH new_user AS (
      INSERT INTO users DEFAULT VALUES
      RETURNING id
    ),
    new_account AS (
      INSERT INTO accounts (
        user_id,
        clerk_user_id,
        locale,
        region,
        timezone,
        currency
      )
      SELECT
        new_user.id,
        ${params.clerkUserId},
        ${defaultUserPreferences.locale},
        ${defaultUserPreferences.region},
        ${defaultUserPreferences.timezone},
        ${defaultUserPreferences.currency}
      FROM new_user
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
    )
    SELECT *
    FROM new_account
  `;

  return mapAccount(rows[0] as AccountRow);
}

export async function getOrCreateAccount(params: {
  clerkUserId: string;
  verifiedEmail?: string | null;
}): Promise<Account> {
  const email = normalizeEmail(params.verifiedEmail);
  const existingIdentityAccount = await getAccountByIdentity(params.clerkUserId);

  if (existingIdentityAccount) {
    await ensureUserIdentity({
      userId: existingIdentityAccount.userId,
      clerkUserId: params.clerkUserId,
      verifiedEmail: email,
    });

    return existingIdentityAccount;
  }

  const existingLegacyAccount = await getAccountByClerkUserId(params.clerkUserId);

  if (existingLegacyAccount) {
    await ensureUserIdentity({
      userId: existingLegacyAccount.userId,
      clerkUserId: params.clerkUserId,
      verifiedEmail: email,
    });

    return existingLegacyAccount;
  }

  if (email) {
    const linkedUserId = await findLinkedUserIdByVerifiedEmail(email);

    if (linkedUserId) {
      await ensureUserIdentity({
        userId: linkedUserId,
        clerkUserId: params.clerkUserId,
        verifiedEmail: email,
      });

      const linkedAccount = await getAccountByUserId(linkedUserId);

      if (linkedAccount) {
        return linkedAccount;
      }
    }
  }

  try {
    return await createAccount({
      clerkUserId: params.clerkUserId,
      verifiedEmail: email,
    });
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }

    const account =
      (await getAccountByIdentity(params.clerkUserId)) ??
      (await getAccountByClerkUserId(params.clerkUserId));

    if (!account) {
      throw error;
    }

    await ensureUserIdentity({
      userId: account.userId,
      clerkUserId: params.clerkUserId,
      verifiedEmail: email,
    });

    return account;
  }
}
