-- ============================================================
-- Migration: Fix handle_new_user trigger & seed default users
-- ============================================================

-- 1. Fix the trigger function to use the correct raw_user_meta_data column
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Use raw_user_meta_data which is the correct column name in auth.users
  INSERT INTO public.profiles (id, full_name, phone, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''), ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );

  -- If registering as a cleaner, also create cleaner_profiles row
  IF COALESCE(NEW.raw_user_meta_data->>'role', '') = 'cleaner' THEN
    INSERT INTO public.cleaner_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Seed Default Clients and Cleaners into auth.users (and by trigger, profiles/cleaner_profiles)

-- Client 1
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
VALUES (
  'c01a0000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'client1@student.edu',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Kwame Mensah","role":"client"}'::jsonb,
  'authenticated',
  'authenticated',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Client 2
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
VALUES (
  'c01a0000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'client2@student.edu',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Abena Osei","role":"client"}'::jsonb,
  'authenticated',
  'authenticated',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Client 3
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
VALUES (
  'c01a0000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'client3@student.edu',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Kofi Bako","role":"client"}'::jsonb,
  'authenticated',
  'authenticated',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Cleaner 1
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
VALUES (
  'c01a0000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'cleaner1@student.edu',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Emmanuel Appiah","role":"cleaner"}'::jsonb,
  'authenticated',
  'authenticated',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Cleaner 2
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
VALUES (
  'c01a0000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000000',
  'cleaner2@student.edu',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Ama Serwaa","role":"cleaner"}'::jsonb,
  'authenticated',
  'authenticated',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Cleaner 3
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
VALUES (
  'c01a0000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000000',
  'cleaner3@student.edu',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Yaw Boakye","role":"cleaner"}'::jsonb,
  'authenticated',
  'authenticated',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- 3. Update public.profiles table with additional client and cleaner details
-- (The rows themselves are automatically created by the handle_new_user() trigger above)
UPDATE public.profiles SET phone = '+233241111111', location = 'Balme Library, Legon', room_number = 'Room 12', status = 'active' WHERE id = 'c01a0000-0000-0000-0000-000000000001';
UPDATE public.profiles SET phone = '+233242222222', location = 'Limann Hall, Legon', room_number = 'Block B, Room 45', status = 'active' WHERE id = 'c01a0000-0000-0000-0000-000000000002';
UPDATE public.profiles SET phone = '+233243333333', location = 'Sarbah Hall, Legon', room_number = 'Annex A, Room 8', status = 'active' WHERE id = 'c01a0000-0000-0000-0000-000000000003';
UPDATE public.profiles SET phone = '+233244444444', location = 'Commonwealth Hall, Legon', status = 'active' WHERE id = 'c01a0000-0000-0000-0000-000000000004';
UPDATE public.profiles SET phone = '+233245555555', location = 'Volta Hall, Legon', status = 'active' WHERE id = 'c01a0000-0000-0000-0000-000000000005';
UPDATE public.profiles SET phone = '+233246666666', location = 'Pentagon Hall, Legon', status = 'active' WHERE id = 'c01a0000-0000-0000-0000-000000000006';

-- 4. Update public.cleaner_profiles table with cleaner specific details
-- (The rows are automatically created by the trigger if the user's role metadata is 'cleaner')
UPDATE public.cleaner_profiles SET
  bio = 'Professional cleaner with 2 years of experience. Specializes in deep scrubbing and move-out cleaning.',
  skills = ARRAY['Deep scrubbing', 'Mopping', 'Bathroom cleaning', 'Window washing'],
  availability = 'available',
  verification_status = 'approved',
  avg_rating = 4.8,
  total_jobs = 24
WHERE user_id = 'c01a0000-0000-0000-0000-000000000004';

UPDATE public.cleaner_profiles SET
  bio = 'Fast and efficient. I do laundry and room cleaning. Always punctual and polite.',
  skills = ARRAY['Wash & Iron', 'Express clean', 'Folding laundry'],
  availability = 'available',
  verification_status = 'approved',
  avg_rating = 4.9,
  total_jobs = 42
WHERE user_id = 'c01a0000-0000-0000-0000-000000000005';

UPDATE public.cleaner_profiles SET
  bio = 'Detail-oriented student cleaner. Available on weekends for deep cleaning and iron only.',
  skills = ARRAY['Ironing', 'Dusting', 'Deep scrubbing'],
  availability = 'available',
  verification_status = 'approved',
  avg_rating = 4.7,
  total_jobs = 15
WHERE user_id = 'c01a0000-0000-0000-0000-000000000006';
