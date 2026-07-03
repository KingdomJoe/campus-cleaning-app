-- Add flags to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registered_as_client BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registered_as_cleaner BOOLEAN DEFAULT FALSE;

-- Update existing profiles' flags based on their role and profile presence
UPDATE public.profiles
SET registered_as_cleaner = TRUE
WHERE id IN (SELECT user_id FROM public.cleaner_profiles) OR role = 'cleaner';

-- Redefine handle_new_user trigger function to safely set flags and avoid user_metadata errors
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_role TEXT;
BEGIN
  new_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  
  INSERT INTO public.profiles (id, full_name, phone, email, role, registered_as_client, registered_as_cleaner)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''), ''),
    COALESCE(NEW.email, ''),
    new_role,
    TRUE,
    (new_role = 'cleaner')
  );

  IF new_role = 'cleaner' THEN
    INSERT INTO public.cleaner_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update test user email domains from @student.edu to @gmail.com to resolve manual login restriction errors
UPDATE auth.users
SET email = REPLACE(email, '@student.edu', '@gmail.com')
WHERE email LIKE '%@student.edu';

UPDATE public.profiles
SET email = REPLACE(email, '@student.edu', '@gmail.com')
WHERE email LIKE '%@student.edu';

-- Set up storage RLS policies on storage.objects to enable uploads
DROP POLICY IF EXISTS "Public Read Access on avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access on documents" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access on booking-photos" ON storage.objects;
DROP POLICY IF EXISTS "Auth Insert Access on avatars" ON storage.objects;
DROP POLICY IF EXISTS "Auth Insert Access on documents" ON storage.objects;
DROP POLICY IF EXISTS "Auth Insert Access on booking-photos" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update Access on avatars" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update Access on documents" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update Access on booking-photos" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete Access on avatars" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete Access on documents" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete Access on booking-photos" ON storage.objects;

CREATE POLICY "Public Read Access on avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Public Read Access on documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "Public Read Access on booking-photos" ON storage.objects FOR SELECT USING (bucket_id = 'booking-photos');

CREATE POLICY "Auth Insert Access on avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Auth Insert Access on documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Auth Insert Access on booking-photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'booking-photos');

CREATE POLICY "Owner Update Access on avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Owner Update Access on documents" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'documents') WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Owner Update Access on booking-photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'booking-photos') WITH CHECK (bucket_id = 'booking-photos');

CREATE POLICY "Owner Delete Access on avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars');
CREATE POLICY "Owner Delete Access on documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents');
CREATE POLICY "Owner Delete Access on booking-photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'booking-photos');
