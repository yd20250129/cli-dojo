ALTER TABLE users
  ADD COLUMN IF NOT EXISTS display_name text;

UPDATE users
SET display_name = SPLIT_PART(canonical_email, '@', 1)
WHERE display_name IS NULL
  AND canonical_email IS NOT NULL;
