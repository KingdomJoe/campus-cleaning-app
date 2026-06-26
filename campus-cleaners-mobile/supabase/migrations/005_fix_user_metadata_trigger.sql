-- ============================================================
-- Fix: handle_new_user trigger to use user_metadata instead of raw_user_meta_data
-- For email/password signup, role is passed in user_metadata (via data param in signUp)
-- raw_user_meta_data is only populated for OAuth providers
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Use user_metadata for email/password signup, raw_user_meta_data for OAuth
  -- COALESCE checks both, preferring user_metadata
  INSERT INTO public.profiles (id, full_name, phone, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.user_metadata->>'full_name', NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(COALESCE(NEW.phone, NEW.user_metadata->>'phone', NEW.raw_user_meta_data->>'phone', ''), ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.user_metadata->>'role', NEW.raw_user_meta_data->>'role', 'client')
  );

  -- If registering as a cleaner, also create cleaner_profiles row
  IF COALESCE(NEW.user_metadata->>'role', NEW.raw_user_meta_data->>'role') = 'cleaner' THEN
    INSERT INTO public.cleaner_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;