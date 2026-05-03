-- Postcheck for `010_drop_legacy_learner_support.sql`.

SELECT
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'section_attempts'
      AND column_name = 'learner_id'
  ) AS section_attempts_has_learner_id,
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'answer_records'
      AND column_name = 'learner_id'
  ) AS answer_records_has_learner_id;

SELECT
  to_regclass('public.idx_section_attempts_learner_id') AS idx_section_attempts_learner_id,
  to_regclass('public.idx_section_attempts_learner_section') AS idx_section_attempts_learner_section,
  to_regclass('public.idx_answer_records_learner_id') AS idx_answer_records_learner_id,
  to_regclass('public.idx_answer_records_learner_section') AS idx_answer_records_learner_section;
