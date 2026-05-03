-- Delete legacy anonymous test data before dropping `learner_id`.
-- `answer_records` rows are removed via ON DELETE CASCADE from `section_attempts`.

SELECT
  'section_attempts_legacy_rows_before_delete' AS check_name,
  COUNT(*)::int AS row_count
FROM section_attempts
WHERE user_id IS NULL
  AND learner_id IS NOT NULL;

DELETE FROM section_attempts
WHERE user_id IS NULL
  AND learner_id IS NOT NULL;

SELECT
  'section_attempts_legacy_rows_after_delete' AS check_name,
  COUNT(*)::int AS row_count
FROM section_attempts
WHERE user_id IS NULL
  AND learner_id IS NOT NULL

UNION ALL

SELECT
  'answer_records_legacy_rows_after_delete' AS check_name,
  COUNT(*)::int AS row_count
FROM answer_records
WHERE user_id IS NULL
  AND learner_id IS NOT NULL;
