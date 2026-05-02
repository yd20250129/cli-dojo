-- Phase 2-C:
-- remove `accounts` and `account_id` compatibility columns after the app no
-- longer reads or writes them. `learner_id` is intentionally retained for now
-- because legacy anonymous progress migration still depends on it.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM section_attempts
    WHERE account_id IS NOT NULL
      AND user_id IS NULL
  ) THEN
    RAISE EXCEPTION
      'Cannot drop account compatibility columns: section_attempts has rows with account_id but no user_id.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM answer_records
    WHERE account_id IS NOT NULL
      AND user_id IS NULL
  ) THEN
    RAISE EXCEPTION
      'Cannot drop account compatibility columns: answer_records has rows with account_id but no user_id.';
  END IF;
END $$;

DROP INDEX IF EXISTS idx_section_attempts_account_attempt_unique;
DROP INDEX IF EXISTS idx_section_attempts_account_section;
DROP INDEX IF EXISTS idx_section_attempts_account_id;
DROP INDEX IF EXISTS idx_answer_records_account_section;
DROP INDEX IF EXISTS idx_answer_records_account_id;
DROP INDEX IF EXISTS idx_accounts_clerk_user_id;
DROP INDEX IF EXISTS idx_accounts_user_id;

ALTER TABLE section_attempts
  DROP COLUMN IF EXISTS account_id;

ALTER TABLE answer_records
  DROP COLUMN IF EXISTS account_id;

DROP TABLE IF EXISTS accounts;
