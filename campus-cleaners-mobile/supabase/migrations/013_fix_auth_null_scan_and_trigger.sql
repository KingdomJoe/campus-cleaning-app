-- ============================================================
-- Migration 013: Fix auth.users NULL scan errors + correct trigger
-- ------------------------------------------------------------
-- Root cause of sign-in (grant_type=password) 500 errors:
--   Seeded users had NULL values in auth.users text columns
--   (notably `email_change`). GoTrue scans these as Go strings,
--   and `converting NULL to string is unsupported` -> HTTP 500
--   on /token, /admin/users, etc.
--
-- Also corrects public.handle_new_user() which referenced the
-- non-existent NEW.user_metadata column (the auth.users column
-- is raw_user_meta_data). The live function had been patched with
-- a blanket EXCEPTION handler that silently swallowed errors;
-- we replace it with a correct, deterministic definition.
-- ============================================================

-- 1. Backfill any NULL values in the text columns GoTrue scans.
UPDATE auth.users
SET email_change = COALESCE(email_change, '');

UPDATE auth.users
SET confirmation_token = COALESCE(confirmation_token, '');

UPDATE auth.users
SET recovery_token = COALESCE(recovery_token, '');

UPDATE auth.users
SET email_change_token_new = COALESCE(email_change_token_new, '');

UPDATE auth.users
SET email_change_token_current = COALESCE(email_change_token_current, '');

UPDATE auth.users
SET phone_change_token = COALESCE(phone_change_token, '');

UPDATE auth.users
SET phone_change = COALESCE(phone_change, '');

UPDATE auth.users
SET reauthentication_token = COALESCE(reauthentication_token, '');

-- 2. Align these columns with GoTrue's canonical schema
--    (NOT NULL DEFAULT '') so future inserts never produce NULLs.
ALTER TABLE auth.users
  ALTER COLUMN email_change SET DEFAULT '',
  ALTER COLUMN confirmation_token SET DEFAULT '',
  ALTER COLUMN recovery_token SET DEFAULT '',
  ALTER COLUMN email_change_token_new SET DEFAULT '',
  ALTER COLUMN email_change_token_current SET DEFAULT '',
  ALTER COLUMN phone_change_token SET DEFAULT '',
  ALTER COLUMN phone_change SET DEFAULT '',
  ALTER COLUMN reauthentication_token SET DEFAULT '';

ALTER TABLE auth.users
  ALTER COLUMN email_change SET NOT NULL,
  ALTER COLUMN confirmation_token SET NOT NULL,
  ALTER COLUMN recovery_token SET NOT NULL,
  ALTER COLUMN email_change_token_new SET NOT NULL,
  ALTER COLUMN email_change_token_current SET NOT NULL,
  ALTER COLUMN phone_change_token SET NOT NULL,
  ALTER COLUMN phone_change SET NOT NULL,
  ALTER COLUMN reauthentication_token SET NOT NULL;

-- 3. Recreate handle_new_user() correctly (raw_user_meta_data, no
--    silent exception swallowing).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_role TEXT;
BEGIN
  new_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');

  INSERT INTO public.profiles (
    id, full_name, phone, email, role, status,
    registered_as_client, registered_as_cleaner
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''), ''),
    COALESCE(NEW.email, ''),
    new_role,
    'active',
    TRUE,
    (new_role = 'cleaner')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    registered_as_cleaner = EXCLUDED.registered_as_cleaner;

  IF new_role = 'cleaner' THEN
    INSERT INTO public.cleaner_profiles (user_id, verification_status, availability)
    VALUES (NEW.id, 'pending', 'offline')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
