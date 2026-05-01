-- Inspect app-user ownership and progress for a single email address.
-- Replace the email literal before execution.

-- 1. Identity rows that match the email exactly.
SELECT
  u.id AS user_id,
  ui.provider,
  ui.provider_user_id,
  ui.email,
  ui.email_verified,
  ui.created_at AS identity_created_at,
  ui.updated_at AS identity_updated_at,
  a.id AS account_id,
  a.clerk_user_id,
  a.created_at AS account_created_at,
  a.updated_at AS account_updated_at
FROM users u
LEFT JOIN user_identities ui
  ON ui.user_id = u.id
LEFT JOIN accounts a
  ON a.user_id = u.id
WHERE LOWER(ui.email) = LOWER('replace-me@example.com')
ORDER BY ui.created_at ASC;

-- 2. Progress counts for those matching user_ids.
WITH matched_users AS (
  SELECT DISTINCT user_id
  FROM user_identities
  WHERE LOWER(email) = LOWER('replace-me@example.com')
)
SELECT
  u.id AS user_id,
  a.clerk_user_id,
  COALESCE(ui.email, '') AS email,
  COALESCE(ui.email_verified, false) AS email_verified,
  (
    SELECT COUNT(*)
    FROM section_attempts sa
    WHERE sa.user_id = u.id
  )::int AS attempt_count,
  (
    SELECT COUNT(*)
    FROM answer_records ar
    WHERE ar.user_id = u.id
  )::int AS answer_count
FROM users u
LEFT JOIN accounts a
  ON a.user_id = u.id
LEFT JOIN user_identities ui
  ON ui.user_id = u.id
WHERE u.id IN (SELECT user_id FROM matched_users)
ORDER BY u.created_at ASC;

-- 3. Per-section answer counts for the matching user_ids.
WITH matched_users AS (
  SELECT DISTINCT user_id
  FROM user_identities
  WHERE LOWER(email) = LOWER('replace-me@example.com')
)
SELECT
  ar.user_id,
  ar.section_id,
  COUNT(*)::int AS answer_count,
  MAX(ar.answered_at) AS latest_answered_at
FROM answer_records ar
WHERE ar.user_id IN (SELECT user_id FROM matched_users)
GROUP BY ar.user_id, ar.section_id
ORDER BY ar.user_id, ar.section_id;

-- 4. Legacy candidate rows that may belong to the same person but still have no verified email.
SELECT
  u.id AS user_id,
  a.clerk_user_id,
  COALESCE(ui.email, '') AS email,
  COALESCE(ui.email_verified, false) AS email_verified,
  (
    SELECT COUNT(*)
    FROM section_attempts sa
    WHERE sa.user_id = u.id
  )::int AS attempt_count,
  (
    SELECT COUNT(*)
    FROM answer_records ar
    WHERE ar.user_id = u.id
  )::int AS answer_count
FROM users u
LEFT JOIN accounts a
  ON a.user_id = u.id
LEFT JOIN user_identities ui
  ON ui.user_id = u.id
WHERE COALESCE(ui.email, '') = ''
ORDER BY answer_count DESC, attempt_count DESC, u.created_at ASC;
