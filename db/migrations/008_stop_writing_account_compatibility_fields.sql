-- Phase 2-B checkpoint:
-- keep compatibility columns in place, but ensure every row that can be
-- resolved through `accounts.user_id` is backfilled before the app stops
-- writing `account_id` on new authenticated progress rows.

UPDATE section_attempts
SET user_id = accounts.user_id
FROM accounts
WHERE section_attempts.user_id IS NULL
  AND section_attempts.account_id = accounts.id;

UPDATE answer_records
SET user_id = accounts.user_id
FROM accounts
WHERE answer_records.user_id IS NULL
  AND answer_records.account_id = accounts.id;
