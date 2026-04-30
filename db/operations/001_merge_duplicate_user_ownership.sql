-- Manual merge helper for duplicate app users that represent the same person.
-- Replace the two UUID literals before execution.
-- target_user_id: canonical app user to keep
-- source_user_id: app user to merge into target

BEGIN;

-- 1. Dry-run summary
SELECT
  'source_user' AS kind,
  id,
  created_at,
  updated_at
FROM users
WHERE id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT
  'target_user' AS kind,
  id,
  created_at,
  updated_at
FROM users
WHERE id = '00000000-0000-0000-0000-000000000002';

SELECT
  'identities' AS bucket,
  user_id,
  COUNT(*)::int AS row_count
FROM user_identities
WHERE user_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
)
GROUP BY user_id
ORDER BY user_id;

SELECT
  'attempts' AS bucket,
  user_id,
  COUNT(*)::int AS row_count
FROM section_attempts
WHERE user_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
)
GROUP BY user_id
ORDER BY user_id;

SELECT
  'answers' AS bucket,
  user_id,
  COUNT(*)::int AS row_count
FROM answer_records
WHERE user_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
)
GROUP BY user_id
ORDER BY user_id;

-- 2. Move ownership to the canonical target user.
UPDATE section_attempts
SET user_id = '00000000-0000-0000-0000-000000000002'
WHERE user_id = '00000000-0000-0000-0000-000000000001';

UPDATE answer_records
SET user_id = '00000000-0000-0000-0000-000000000002'
WHERE user_id = '00000000-0000-0000-0000-000000000001';

UPDATE accounts
SET user_id = '00000000-0000-0000-0000-000000000002'
WHERE user_id = '00000000-0000-0000-0000-000000000001';

UPDATE user_identities
SET user_id = '00000000-0000-0000-0000-000000000002'
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- 3. Verify that nothing still points to the source user.
SELECT
  (SELECT COUNT(*) FROM accounts WHERE user_id = '00000000-0000-0000-0000-000000000001') AS source_accounts,
  (SELECT COUNT(*) FROM user_identities WHERE user_id = '00000000-0000-0000-0000-000000000001') AS source_identities,
  (SELECT COUNT(*) FROM section_attempts WHERE user_id = '00000000-0000-0000-0000-000000000001') AS source_attempts,
  (SELECT COUNT(*) FROM answer_records WHERE user_id = '00000000-0000-0000-0000-000000000001') AS source_answers;

-- 4. Delete the now-orphaned source user only when all counts above are zero.
-- DELETE FROM users
-- WHERE id = '00000000-0000-0000-0000-000000000001';

COMMIT;
