-- ============================================================
-- Migration 015: Admin role + Admin RLS policies
-- ============================================================

-- 1. Allow admin roles on profiles.role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('client', 'cleaner', 'admin', 'super_admin'));

-- 2. SECURITY DEFINER helper to detect admins (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 3. Admin SELECT/WRITE policies on participant-scoped tables
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
CREATE POLICY "Admins can view all bookings"
  ON bookings FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update bookings" ON bookings;
CREATE POLICY "Admins can update bookings"
  ON bookings FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete bookings" ON bookings;
CREATE POLICY "Admins can delete bookings"
  ON bookings FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update payments" ON payments;
CREATE POLICY "Admins can update payments"
  ON payments FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete payments" ON payments;
CREATE POLICY "Admins can delete payments"
  ON payments FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all disputes" ON disputes;
CREATE POLICY "Admins can view all disputes"
  ON disputes FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update disputes" ON disputes;
CREATE POLICY "Admins can update disputes"
  ON disputes FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete disputes" ON disputes;
CREATE POLICY "Admins can delete disputes"
  ON disputes FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update reviews" ON reviews;
CREATE POLICY "Admins can update reviews"
  ON reviews FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete reviews" ON reviews;
CREATE POLICY "Admins can delete reviews"
  ON reviews FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update cleaner profiles" ON cleaner_profiles;
CREATE POLICY "Admins can update cleaner profiles"
  ON cleaner_profiles FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete cleaner profiles" ON cleaner_profiles;
CREATE POLICY "Admins can delete cleaner profiles"
  ON cleaner_profiles FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage service types" ON service_types;
CREATE POLICY "Admins can manage service types"
  ON service_types FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage booking applications" ON booking_applications;
CREATE POLICY "Admins can manage booking applications"
  ON booking_applications FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT TO authenticated USING (public.is_admin());
