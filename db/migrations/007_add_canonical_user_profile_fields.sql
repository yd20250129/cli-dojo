ALTER TABLE users
  ADD COLUMN IF NOT EXISTS canonical_email text;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS canonical_email_verified boolean NOT NULL DEFAULT false;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS locale text;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS region text;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS timezone text;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS currency text;

UPDATE users
SET
  locale = COALESCE(users.locale, accounts.locale, 'ja'),
  region = COALESCE(users.region, accounts.region, 'JP'),
  timezone = COALESCE(users.timezone, accounts.timezone, 'Asia/Tokyo'),
  currency = COALESCE(users.currency, accounts.currency, 'JPY')
FROM accounts
WHERE accounts.user_id = users.id
  AND (
    users.locale IS NULL
    OR users.region IS NULL
    OR users.timezone IS NULL
    OR users.currency IS NULL
  );

UPDATE users
SET
  locale = COALESCE(locale, 'ja'),
  region = COALESCE(region, 'JP'),
  timezone = COALESCE(timezone, 'Asia/Tokyo'),
  currency = COALESCE(currency, 'JPY')
WHERE locale IS NULL
   OR region IS NULL
   OR timezone IS NULL
   OR currency IS NULL;

ALTER TABLE users
  ALTER COLUMN locale SET DEFAULT 'ja';

ALTER TABLE users
  ALTER COLUMN region SET DEFAULT 'JP';

ALTER TABLE users
  ALTER COLUMN timezone SET DEFAULT 'Asia/Tokyo';

ALTER TABLE users
  ALTER COLUMN currency SET DEFAULT 'JPY';

ALTER TABLE users
  ALTER COLUMN locale SET NOT NULL;

ALTER TABLE users
  ALTER COLUMN region SET NOT NULL;

ALTER TABLE users
  ALTER COLUMN timezone SET NOT NULL;

ALTER TABLE users
  ALTER COLUMN currency SET NOT NULL;

WITH unique_verified_emails AS (
  SELECT
    user_id,
    MIN(LOWER(email)) AS canonical_email
  FROM user_identities
  WHERE email_verified = true
    AND email IS NOT NULL
  GROUP BY user_id
  HAVING COUNT(DISTINCT LOWER(email)) = 1
)
UPDATE users
SET
  canonical_email = unique_verified_emails.canonical_email,
  canonical_email_verified = true
FROM unique_verified_emails
WHERE unique_verified_emails.user_id = users.id
  AND (
    users.canonical_email IS NULL
    OR LOWER(users.canonical_email) <> unique_verified_emails.canonical_email
    OR users.canonical_email_verified = false
  );

UPDATE users
SET canonical_email = LOWER(canonical_email)
WHERE canonical_email IS NOT NULL
  AND canonical_email <> LOWER(canonical_email);

CREATE INDEX IF NOT EXISTS idx_users_canonical_email
  ON users(LOWER(canonical_email))
  WHERE canonical_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_canonical_email_verified
  ON users(canonical_email_verified);
