import { getSql } from "@/lib/server/db";
import {
  defaultUserPreferences,
  isCurrency,
  isLocale,
  isRegion,
} from "@/lib/i18n/config";
import type { AuthenticatedUser } from "@/types";

type UserRow = {
  id: string;
  clerk_user_id: string;
  display_name: string | null;
  canonical_email: string | null;
  canonical_email_verified: boolean;
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

function mapAuthenticatedUser(row: UserRow): AuthenticatedUser {
  return {
    userId: row.id,
    clerkUserId: row.clerk_user_id,
    displayName: row.display_name,
    canonicalEmail: row.canonical_email,
    canonicalEmailVerified: row.canonical_email_verified,
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

function normalizeDisplayName(displayName: string | null | undefined) {
  const value = displayName?.trim().replace(/\s+/g, " ");
  return value ? value : null;
}

export function resolveVerifiedEmailLinkCandidate(
  rows: Array<{ user_id: string | number }>,
) {
  return rows.length === 1 ? String(rows[0].user_id) : null;
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

async function syncDisplayName(userId: string, displayName?: string | null) {
  const normalizedDisplayName = normalizeDisplayName(displayName);

  if (!normalizedDisplayName) {
    return;
  }

  const sql = getSql();
  await sql`
    UPDATE users
    SET
      display_name = ${normalizedDisplayName},
      updated_at = now()
    WHERE id = ${userId}
      AND display_name IS DISTINCT FROM ${normalizedDisplayName}
  `;
}

async function ensureUserIdentity(params: {
  userId: string;
  clerkUserId: string;
  verifiedEmail?: string | null;
  displayName?: string | null;
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
  await syncDisplayName(params.userId, params.displayName);
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
  displayName?: string | null;
}) {
  const sql = getSql();
  const email = normalizeEmail(params.verifiedEmail);
  const displayName = normalizeDisplayName(params.displayName);
  const rows = await sql`
    WITH new_user AS (
      INSERT INTO users (
        display_name,
        canonical_email,
        canonical_email_verified,
        locale,
        region,
        timezone,
        currency
      )
      VALUES (
        ${displayName},
        ${email},
        ${Boolean(email)},
        ${defaultUserPreferences.locale},
        ${defaultUserPreferences.region},
        ${defaultUserPreferences.timezone},
        ${defaultUserPreferences.currency}
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
  displayName?: string | null;
}): Promise<AuthenticatedUser> {
  const email = normalizeEmail(params.verifiedEmail);
  const displayName = normalizeDisplayName(params.displayName);
  const existingIdentityUser = await getUserByIdentity(params.clerkUserId);

  if (existingIdentityUser) {
    await ensureUserIdentity({
      userId: existingIdentityUser.userId,
      clerkUserId: params.clerkUserId,
      verifiedEmail: email,
      displayName,
    });

    const syncedUser =
      (await getUserById(existingIdentityUser.userId, params.clerkUserId)) ??
      existingIdentityUser;
    return syncedUser;
  }

  if (email) {
    const linkedUserId = await findLinkedUserIdByVerifiedEmail(email);

    if (linkedUserId) {
      await ensureUserIdentity({
        userId: linkedUserId,
        clerkUserId: params.clerkUserId,
        verifiedEmail: email,
        displayName,
      });

      const linkedUser = await getUserById(linkedUserId, params.clerkUserId);

      if (linkedUser) {
        return linkedUser;
      }
    }
  }

  try {
    return await createUser({
      clerkUserId: params.clerkUserId,
      verifiedEmail: email,
      displayName,
    });
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }

    const user =
      await getUserByIdentity(params.clerkUserId);

    if (!user) {
      throw error;
    }

    await ensureUserIdentity({
      userId: user.userId,
      clerkUserId: params.clerkUserId,
      verifiedEmail: email,
      displayName,
    });

    const syncedUser = (await getUserById(user.userId, params.clerkUserId)) ?? user;
    return syncedUser;
  }
}

export async function updateUserDisplayName(params: {
  userId: string;
  clerkUserId: string;
  displayName: string;
}) {
  const normalizedDisplayName = normalizeDisplayName(params.displayName);

  if (!normalizedDisplayName) {
    throw new Error("displayName is required");
  }

  const sql = getSql();
  const rows = await sql`
    UPDATE users
    SET
      display_name = ${normalizedDisplayName},
      updated_at = now()
    WHERE id = ${params.userId}
    RETURNING
      users.*,
      ${params.clerkUserId}::text AS clerk_user_id
  `;

  return mapAuthenticatedUser(rows[0] as UserRow);
}
