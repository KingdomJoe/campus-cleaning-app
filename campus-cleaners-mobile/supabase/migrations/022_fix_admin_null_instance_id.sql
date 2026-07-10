-- ============================================================
-- Migration 022: Fix NULL instance_id for seeded super-admin
-- ============================================================
-- The seeded super-admin (migration 017) got instance_id = NULL because it
-- used "SELECT instance_id FROM auth.instances LIMIT 1" and auth.instances is
-- empty on hosted Supabase. GoTrue filters users by instance_id during
-- password login, so a NULL value makes the account invisible and returns
-- HTTP 400 "Invalid login credentials" despite a valid password.
--
-- This was the true root cause of the admin portal login failure (the earlier
-- token-null fix in 021 was necessary but not sufficient). Align all rows with
-- the standard zero-UUID instance_id used by every other seeded user.
-- ============================================================

UPDATE auth.users
SET instance_id = '00000000-0000-0000-0000-000000000000'
WHERE instance_id IS NULL;
