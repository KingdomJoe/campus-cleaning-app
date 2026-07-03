-- Migration: Fix NULL tokens in auth.users causing GoTrue scan errors
-- When users are inserted directly via SQL seeds, unpopulated token columns default to NULL.
-- GoTrue's Go code expects these to be scanned as strings, causing HTTP 500 errors on login/list.

UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change_token = COALESCE(phone_change_token, '');
