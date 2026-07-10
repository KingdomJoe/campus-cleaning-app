-- ============================================================
-- Migration 019: Complete test cleaner profiles & demo verification states
-- ============================================================
-- Purpose:
--   1. Bring all 3 seeded cleaner test accounts to 100% profile completion
--      (avatar, bio, mobile money, skills, guarantor, ghana_card, selfie).
--   2. Update their locations to UCC (Cape Coast) areas to match the app.
--   3. Set verification_status so that:
--        - Emmanuel Appiah (...004) => approved  (verified cleaner)
--        - Ama Serwaa     (...005) => approved  (verified cleaner)
--        - Yaw Boakye     (...006) => pending   (awaiting admin verification)
--
-- NOTE: Run this in the Supabase SQL Editor against the LIVE database.
--       It is data-only and idempotent (safe to re-run).
-- ============================================================

-- 1. Update locations to UCC (Cape Coast) areas
UPDATE public.profiles
  SET location = 'Amamoma'
  WHERE id = 'c01a0000-0000-0000-0000-000000000004';

UPDATE public.profiles
  SET location = 'Kwaprow'
  WHERE id = 'c01a0000-0000-0000-0000-000000000005';

UPDATE public.profiles
  SET location = 'Apewosika'
  WHERE id = 'c01a0000-0000-0000-0000-000000000006';

-- 2. Placeholder avatars on profiles (generic placeholder image URLs)
UPDATE public.profiles
  SET avatar_url = 'https://placehold.co/200x200.png?text=EA'
  WHERE id = 'c01a0000-0000-0000-0000-000000000004';

UPDATE public.profiles
  SET avatar_url = 'https://placehold.co/200x200.png?text=AS'
  WHERE id = 'c01a0000-0000-0000-0000-000000000005';

UPDATE public.profiles
  SET avatar_url = 'https://placehold.co/200x200.png?text=YB'
  WHERE id = 'c01a0000-0000-0000-0000-000000000006';

-- 3. Complete cleaner_profiles (mobile money, guarantor, skills already present)
UPDATE public.cleaner_profiles
  SET
    mobile_money_number = '+233244444444',
    guarantor_name = 'Kwame Mensah',
    guarantor_phone = '+233241111111',
    verification_status = 'approved'
  WHERE user_id = 'c01a0000-0000-0000-0000-000000000004';

UPDATE public.cleaner_profiles
  SET
    mobile_money_number = '+233245555555',
    guarantor_name = 'Abena Osei',
    guarantor_phone = '+233242222222',
    verification_status = 'approved'
  WHERE user_id = 'c01a0000-0000-0000-0000-000000000005';

UPDATE public.cleaner_profiles
  SET
    mobile_money_number = '+233246666666',
    guarantor_name = 'Kofi Bako',
    guarantor_phone = '+233243333333',
    verification_status = 'pending'
  WHERE user_id = 'c01a0000-0000-0000-0000-000000000006';

-- 4. Insert verification documents (ghana_card + selfie) for all 3 cleaners.
--    Use ON CONFLICT DO NOTHING so re-running is safe (documents have no
--    natural unique key, so we only insert when none exist for that type).
INSERT INTO public.cleaner_documents (cleaner_id, document_type, file_url)
SELECT 'c01a0000-0000-0000-0000-000000000004', 'ghana_card',
       'https://placehold.co/800x600.png?text=Ghana+Card+EA'
WHERE NOT EXISTS (
  SELECT 1 FROM public.cleaner_documents
  WHERE cleaner_id = 'c01a0000-0000-0000-0000-000000000004' AND document_type = 'ghana_card'
);

INSERT INTO public.cleaner_documents (cleaner_id, document_type, file_url)
SELECT 'c01a0000-0000-0000-0000-000000000004', 'selfie',
       'https://placehold.co/800x600.png?text=Selfie+EA'
WHERE NOT EXISTS (
  SELECT 1 FROM public.cleaner_documents
  WHERE cleaner_id = 'c01a0000-0000-0000-0000-000000000004' AND document_type = 'selfie'
);

INSERT INTO public.cleaner_documents (cleaner_id, document_type, file_url)
SELECT 'c01a0000-0000-0000-0000-000000000005', 'ghana_card',
       'https://placehold.co/800x600.png?text=Ghana+Card+AS'
WHERE NOT EXISTS (
  SELECT 1 FROM public.cleaner_documents
  WHERE cleaner_id = 'c01a0000-0000-0000-0000-000000000005' AND document_type = 'ghana_card'
);

INSERT INTO public.cleaner_documents (cleaner_id, document_type, file_url)
SELECT 'c01a0000-0000-0000-0000-000000000005', 'selfie',
       'https://placehold.co/800x600.png?text=Selfie+AS'
WHERE NOT EXISTS (
  SELECT 1 FROM public.cleaner_documents
  WHERE cleaner_id = 'c01a0000-0000-0000-0000-000000000005' AND document_type = 'selfie'
);

INSERT INTO public.cleaner_documents (cleaner_id, document_type, file_url)
SELECT 'c01a0000-0000-0000-0000-000000000006', 'ghana_card',
       'https://placehold.co/800x600.png?text=Ghana+Card+YB'
WHERE NOT EXISTS (
  SELECT 1 FROM public.cleaner_documents
  WHERE cleaner_id = 'c01a0000-0000-0000-0000-000000000006' AND document_type = 'ghana_card'
);

INSERT INTO public.cleaner_documents (cleaner_id, document_type, file_url)
SELECT 'c01a0000-0000-0000-0000-000000000006', 'selfie',
       'https://placehold.co/800x600.png?text=Selfie+YB'
WHERE NOT EXISTS (
  SELECT 1 FROM public.cleaner_documents
  WHERE cleaner_id = 'c01a0000-0000-0000-0000-000000000006' AND document_type = 'selfie'
);
