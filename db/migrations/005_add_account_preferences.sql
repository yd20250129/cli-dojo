ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS locale text;

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS region text;

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS timezone text;

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS currency text;

UPDATE accounts
SET
  locale = COALESCE(locale, 'ja'),
  region = COALESCE(region, 'JP'),
  timezone = COALESCE(timezone, 'Asia/Tokyo'),
  currency = COALESCE(currency, 'JPY')
WHERE locale IS NULL
   OR region IS NULL
   OR timezone IS NULL
   OR currency IS NULL;

ALTER TABLE accounts
  ALTER COLUMN locale SET DEFAULT 'ja';

ALTER TABLE accounts
  ALTER COLUMN region SET DEFAULT 'JP';

ALTER TABLE accounts
  ALTER COLUMN timezone SET DEFAULT 'Asia/Tokyo';

ALTER TABLE accounts
  ALTER COLUMN currency SET DEFAULT 'JPY';

ALTER TABLE accounts
  ALTER COLUMN locale SET NOT NULL;

ALTER TABLE accounts
  ALTER COLUMN region SET NOT NULL;

ALTER TABLE accounts
  ALTER COLUMN timezone SET NOT NULL;

ALTER TABLE accounts
  ALTER COLUMN currency SET NOT NULL;
