-- ============================================================
-- Migration 020: Restore Ama Serwaa's cleaner role
-- ============================================================
-- Ama Serwaa (test cleaner 2, id ...005) was inadvertently switched to
-- role 'client' during mobile testing, which hid her from the admin
-- verifications page even though her cleaner_profiles row is 'approved'.
-- Restore her cleaner role so the portal correctly shows 2 approved cleaners.
-- ============================================================

UPDATE public.profiles
SET role = 'cleaner'
WHERE id = 'c01a0000-0000-0000-0000-000000000005';

UPDATE public.cleaner_profiles
SET verification_status = 'approved'
WHERE user_id = 'c01a0000-0000-0000-0000-000000000005';
