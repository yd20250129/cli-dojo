-- Phase 2-D:
-- remove legacy anonymous ownership compatibility after deleting test data.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM section_attempts
    WHERE learner_id IS NOT NULL
      AND user_id IS NULL
  ) THEN
    RAISE EXCEPTION
      'Cannot drop learner compatibility columns: section_attempts still has legacy anonymous rows.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM answer_records
    WHERE learner_id IS NOT NULL
      AND user_id IS NULL
  ) THEN
    RAISE EXCEPTION
      'Cannot drop learner compatibility columns: answer_records still has legacy anonymous rows.';
  END IF;
END $$;

DROP INDEX IF EXISTS idx_section_attempts_learner_section;
DROP INDEX IF EXISTS idx_section_attempts_learner_id;
DROP INDEX IF EXISTS idx_answer_records_learner_section;
DROP INDEX IF EXISTS idx_answer_records_learner_id;

ALTER TABLE section_attempts
  DROP CONSTRAINT IF EXISTS section_attempts_learner_id_section_id_attempt_no_key;

ALTER TABLE section_attempts
  DROP COLUMN IF EXISTS learner_id;

ALTER TABLE answer_records
  DROP COLUMN IF EXISTS learner_id;
