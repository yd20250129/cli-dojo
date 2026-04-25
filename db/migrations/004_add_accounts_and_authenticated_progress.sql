CREATE TABLE IF NOT EXISTS accounts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text NOT NULL UNIQUE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounts_clerk_user_id
  ON accounts(clerk_user_id);

ALTER TABLE section_attempts
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);

ALTER TABLE answer_records
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);

ALTER TABLE section_attempts
  ALTER COLUMN learner_id DROP NOT NULL;

ALTER TABLE answer_records
  ALTER COLUMN learner_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_section_attempts_account_id
  ON section_attempts(account_id);

CREATE INDEX IF NOT EXISTS idx_section_attempts_account_section
  ON section_attempts(account_id, section_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_section_attempts_account_attempt_unique
  ON section_attempts(account_id, section_id, attempt_no)
  WHERE account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_answer_records_account_id
  ON answer_records(account_id);

CREATE INDEX IF NOT EXISTS idx_answer_records_account_section
  ON answer_records(account_id, section_id);
