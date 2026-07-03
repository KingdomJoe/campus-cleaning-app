-- Migration: Update seeded test users with unique dummy phone numbers
-- This ensures they bypass the profile completion guard on login

UPDATE public.profiles
SET phone = '+233240000001'
WHERE id = 'c01a0000-0000-0000-0000-000000000001';

UPDATE public.profiles
SET phone = '+233240000002'
WHERE id = 'c01a0000-0000-0000-0000-000000000002';

UPDATE public.profiles
SET phone = '+233240000003'
WHERE id = 'c01a0000-0000-0000-0000-000000000003';

UPDATE public.profiles
SET phone = '+233240000004'
WHERE id = 'c01a0000-0000-0000-0000-000000000004';

UPDATE public.profiles
SET phone = '+233240000005'
WHERE id = 'c01a0000-0000-0000-0000-000000000005';

UPDATE public.profiles
SET phone = '+233240000006'
WHERE id = 'c01a0000-0000-0000-0000-000000000006';
