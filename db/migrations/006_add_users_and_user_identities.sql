CREATE TABLE IF NOT EXISTS users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_identities (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider         text NOT NULL,
  provider_user_id text NOT NULL,
  email            text,
  email_verified   boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_identities_user_id
  ON user_identities(user_id);

CREATE INDEX IF NOT EXISTS idx_user_identities_verified_email
  ON user_identities(LOWER(email))
  WHERE email_verified = true AND email IS NOT NULL;

INSERT INTO users (id, created_at, updated_at)
SELECT accounts.id, accounts.created_at, accounts.updated_at
FROM accounts
ON CONFLICT (id) DO NOTHING;

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id);

UPDATE accounts
SET user_id = id
WHERE user_id IS NULL;

ALTER TABLE accounts
  ALTER COLUMN user_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_user_id
  ON accounts(user_id);

INSERT INTO user_identities (
  user_id,
  provider,
  provider_user_id,
  email,
  email_verified,
  created_at,
  updated_at
)
SELECT
  accounts.user_id,
  'clerk',
  accounts.clerk_user_id,
  null,
  false,
  accounts.created_at,
  accounts.updated_at
FROM accounts
ON CONFLICT (provider, provider_user_id) DO NOTHING;

ALTER TABLE section_attempts
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id);

ALTER TABLE answer_records
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id);

UPDATE section_attempts
SET user_id = accounts.user_id
FROM accounts
WHERE section_attempts.account_id = accounts.id
  AND section_attempts.user_id IS NULL;

UPDATE answer_records
SET user_id = accounts.user_id
FROM accounts
WHERE answer_records.account_id = accounts.id
  AND answer_records.user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_section_attempts_user_id
  ON section_attempts(user_id);

CREATE INDEX IF NOT EXISTS idx_section_attempts_user_section
  ON section_attempts(user_id, section_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_section_attempts_user_attempt_unique
  ON section_attempts(user_id, section_id, attempt_no)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_answer_records_user_id
  ON answer_records(user_id);

CREATE INDEX IF NOT EXISTS idx_answer_records_user_section
  ON answer_records(user_id, section_id);
