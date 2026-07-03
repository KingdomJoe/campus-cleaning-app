-- Migration: Insert missing profiles and cleaner_profiles for seeded test accounts
-- This ensures they have proper database records even if the trigger wasn't created yet during the initial seed.

INSERT INTO public.profiles (id, full_name, phone, email, role, location, room_number, status)
VALUES
  ('c01a0000-0000-0000-0000-000000000001', 'Kwame Mensah', '+233241111111', 'client1@gmail.com', 'client', 'Balme Library, Legon', 'Room 12', 'active'),
  ('c01a0000-0000-0000-0000-000000000002', 'Abena Osei', '+233242222222', 'client2@gmail.com', 'client', 'Limann Hall, Legon', 'Block B, Room 45', 'active'),
  ('c01a0000-0000-0000-0000-000000000003', 'Kofi Bako', '+233243333333', 'client3@gmail.com', 'client', 'Sarbah Hall, Legon', 'Annex A, Room 8', 'active'),
  ('c01a0000-0000-0000-0000-000000000004', 'Emmanuel Appiah', '+233244444444', 'cleaner1@gmail.com', 'cleaner', 'Commonwealth Hall, Legon', NULL, 'active'),
  ('c01a0000-0000-0000-0000-000000000005', 'Ama Serwaa', '+233245555555', 'cleaner2@gmail.com', 'cleaner', 'Volta Hall, Legon', NULL, 'active'),
  ('c01a0000-0000-0000-0000-000000000006', 'Yaw Boakye', '+233246666666', 'cleaner3@gmail.com', 'cleaner', 'Pentagon Hall, Legon', NULL, 'active')
ON CONFLICT (id) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  location = EXCLUDED.location,
  room_number = EXCLUDED.room_number,
  status = EXCLUDED.status;

-- Insert cleaner profiles
INSERT INTO public.cleaner_profiles (user_id, bio, skills, availability, verification_status, avg_rating, total_jobs)
VALUES
  ('c01a0000-0000-0000-0000-000000000004', 'Professional cleaner with 2 years of experience. Specializes in deep scrubbing and move-out cleaning.', ARRAY['Deep scrubbing', 'Mopping', 'Bathroom cleaning', 'Window washing'], 'available', 'approved', 4.8, 24),
  ('c01a0000-0000-0000-0000-000000000005', 'Fast and efficient. I do laundry and room cleaning. Always punctual and polite.', ARRAY['Wash & Iron', 'Express clean', 'Folding laundry'], 'available', 'approved', 4.9, 42),
  ('c01a0000-0000-0000-0000-000000000006', 'Detail-oriented student cleaner. Available on weekends for deep cleaning and iron only.', ARRAY['Ironing', 'Dusting', 'Deep scrubbing'], 'available', 'approved', 4.7, 15)
ON CONFLICT (user_id) DO UPDATE
SET
  bio = EXCLUDED.bio,
  skills = EXCLUDED.skills,
  availability = EXCLUDED.availability,
  verification_status = EXCLUDED.verification_status,
  avg_rating = EXCLUDED.avg_rating,
  total_jobs = EXCLUDED.total_jobs;
