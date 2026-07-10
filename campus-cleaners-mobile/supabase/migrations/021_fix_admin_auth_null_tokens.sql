-- ============================================================
-- Migration 021: Fix NULL auth token columns for seeded users
-- ============================================================
-- Manually-seeded auth.users rows (e.g. the super-admin from migration 017)
-- have NULL string token columns. GoTrue cannot scan NULL into Go strings
-- during password login, which surfaces as HTTP 400 "Invalid login
-- credentials" even when the password is correct. Coalesce all affected
-- token columns to empty strings. (Same class of fix as migrations 009/013.)
-- ============================================================

UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE
  confirmation_token IS NULL
  OR recovery_token IS NULL
  OR email_change IS NULL
  OR email_change_token_new IS NULL
  OR email_change_token_current IS NULL
  OR phone_change IS NULL
  OR phone_change_token IS NULL
  OR reauthentication_token IS NULL;
