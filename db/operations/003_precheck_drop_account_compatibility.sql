-- Precheck for `009_drop_account_compatibility_columns.sql`.
-- Run this before applying Phase 2-C on the shared DB.

-- 1. Rows that would make `009` fail.
SELECT
  'section_attempts_missing_user_id' AS check_name,
  COUNT(*)::int AS row_count
FROM section_attempts
WHERE account_id IS NOT NULL
  AND user_id IS NULL

UNION ALL

SELECT
  'answer_records_missing_user_id' AS check_name,
  COUNT(*)::int AS row_count
FROM answer_records
WHERE account_id IS NOT NULL
  AND user_id IS NULL;

-- 2. Compatibility column population summary.
SELECT
  'section_attempts_account_id_remaining' AS check_name,
  COUNT(*)::int AS row_count
FROM section_attempts
WHERE account_id IS NOT NULL

UNION ALL

SELECT
  'answer_records_account_id_remaining' AS check_name,
  COUNT(*)::int AS row_count
FROM answer_records
WHERE account_id IS NOT NULL

UNION ALL

SELECT
  'section_attempts_legacy_learner_only' AS check_name,
  COUNT(*)::int AS row_count
FROM section_attempts
WHERE learner_id IS NOT NULL
  AND user_id IS NULL

UNION ALL

SELECT
  'answer_records_legacy_learner_only' AS check_name,
  COUNT(*)::int AS row_count
FROM answer_records
WHERE learner_id IS NOT NULL
  AND user_id IS NULL;

-- 3. Runtime ownership sanity checks.
SELECT
  'users_without_identity' AS check_name,
  COUNT(*)::int AS row_count
FROM users u
WHERE NOT EXISTS (
  SELECT 1
  FROM user_identities ui
  WHERE ui.user_id = u.id
)

UNION ALL

SELECT
  'duplicate_verified_canonical_email' AS check_name,
  COUNT(*)::int AS row_count
FROM (
  SELECT LOWER(canonical_email)
  FROM users
  WHERE canonical_email_verified = true
    AND canonical_email IS NOT NULL
  GROUP BY LOWER(canonical_email)
  HAVING COUNT(*) > 1
) duplicates;

-- 4. Manual inspection list for anonymous legacy rows that block learner_id removal.
SELECT
  sa.id,
  sa.section_id,
  sa.attempt_no,
  sa.learner_id,
  sa.started_at,
  sa.completed_at,
  (
    SELECT COUNT(*)::int
    FROM answer_records ar
    WHERE ar.attempt_id = sa.id
  ) AS answer_count
FROM section_attempts sa
WHERE sa.learner_id IS NOT NULL
  AND sa.user_id IS NULL
ORDER BY sa.started_at ASC;
