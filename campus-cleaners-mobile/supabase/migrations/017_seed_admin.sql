-- ============================================================
-- Migration 017: Seed an initial super-admin account
-- Best-effort: failures are swallowed so the schema migrations
-- above still apply. If the user is not created, create one
-- manually in the Supabase dashboard (Auth > Add user) with
-- metadata role = "super_admin".
-- ============================================================

DO $$
DECLARE
  admin_id UUID := '11111111-1111-1111-1111-111111111111';
  inst UUID;
BEGIN
  SELECT instance_id INTO inst FROM auth.instances LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'kwame.admin@uberforclean.gh') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_current,
      email_change_token_new,
      is_super_admin
    ) VALUES (
      admin_id,
      inst,
      'kwame.admin@uberforclean.gh',
      crypt('Admin1234!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Kwame Admin","role":"super_admin"}'::jsonb,
      'authenticated',
      'authenticated',
      now(),
      now(),
      '',
      '',
      '',
      '',
      false
    );
    RAISE NOTICE 'Created super-admin kwame.admin@uberforclean.gh';
  ELSE
    RAISE NOTICE 'Super-admin already exists';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Admin seed skipped (%). Create the admin manually in the dashboard.', SQLERRM;
END $$;
