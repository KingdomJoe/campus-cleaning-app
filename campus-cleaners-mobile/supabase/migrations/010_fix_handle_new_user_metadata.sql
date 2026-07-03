-- Migration: Fix handle_new_user trigger function to parse user_metadata as well as raw_user_meta_data
-- Prefer user_metadata (used for email/password signup) over raw_user_meta_data (used for OAuth)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_role TEXT;
BEGIN
  new_role := COALESCE(NEW.user_metadata->>'role', NEW.raw_user_meta_data->>'role', 'client');
  
  INSERT INTO public.profiles (id, full_name, phone, email, role, registered_as_client, registered_as_cleaner)
  VALUES (
    NEW.id,
    COALESCE(NEW.user_metadata->>'full_name', NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(COALESCE(NEW.phone, NEW.user_metadata->>'phone', NEW.raw_user_meta_data->>'phone', ''), ''),
    COALESCE(NEW.email, ''),
    new_role,
    TRUE,
    (new_role = 'cleaner')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    phone = COALESCE(profiles.phone, EXCLUDED.phone),
    role = EXCLUDED.role,
    registered_as_cleaner = EXCLUDED.registered_as_cleaner;

  IF new_role = 'cleaner' THEN
    INSERT INTO public.cleaner_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
