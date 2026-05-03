-- Postcheck for `009_drop_account_compatibility_columns.sql`.
-- Run this after applying Phase 2-C on the shared DB.

SELECT
  to_regclass('public.accounts') AS accounts_table,
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'section_attempts'
      AND column_name = 'account_id'
  ) AS section_attempts_has_account_id,
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'answer_records'
      AND column_name = 'account_id'
  ) AS answer_records_has_account_id;

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
