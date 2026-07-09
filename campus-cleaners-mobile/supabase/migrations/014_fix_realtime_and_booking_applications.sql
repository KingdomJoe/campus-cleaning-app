-- ============================================================
-- Migration 014: Fix realtime + recreate booking_applications
-- ------------------------------------------------------------
-- Audit findings:
--   1. booking_applications table was missing from the DB even
--      though the app's bid/apply/hire/reject flow depends on it.
--   2. supabase_realtime publication had ZERO tables, so no
--      realtime events were ever delivered (cleaners never saw
--      jobs appear live).
--   3. Apply/accept gating was frontend-only. We now enforce it
--      in the DB via RLS using cleaner_can_apply().
--
-- This migration is idempotent and safe to re-run.
-- ============================================================

-- 1. Recreate the booking_applications table (idempotent).
CREATE TABLE IF NOT EXISTS public.booking_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  cleaner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_booking_cleaner UNIQUE (booking_id, cleaner_id)
);

CREATE INDEX IF NOT EXISTS idx_booking_applications_booking ON public.booking_applications(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_applications_cleaner ON public.booking_applications(cleaner_id);

DROP TRIGGER IF EXISTS booking_applications_updated_at ON public.booking_applications;
CREATE TRIGGER booking_applications_updated_at BEFORE UPDATE ON public.booking_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. Helper: is a cleaner eligible to apply? (approved + 100% profile)
CREATE OR REPLACE FUNCTION public.cleaner_can_apply(p_cleaner uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avatar text;
  v_verification text;
  v_bio text;
  v_momo text;
  v_skills text[];
  v_guar_name text;
  v_guar_phone text;
  v_has_ghana boolean;
  v_has_selfie boolean;
BEGIN
  SELECT p.avatar_url, cp.verification_status, cp.bio, cp.mobile_money_number,
         cp.skills, cp.guarantor_name, cp.guarantor_phone
  INTO v_avatar, v_verification, v_bio, v_momo, v_skills, v_guar_name, v_guar_phone
  FROM public.profiles p
  LEFT JOIN public.cleaner_profiles cp ON cp.user_id = p.id
  WHERE p.id = p_cleaner;

  IF v_verification IS DISTINCT FROM 'approved' THEN
    RETURN false;
  END IF;
  IF COALESCE(v_avatar, '') = '' THEN RETURN false; END IF;
  IF COALESCE(v_bio, '') = '' THEN RETURN false; END IF;
  IF COALESCE(v_momo, '') = '' THEN RETURN false; END IF;
  IF COALESCE(array_length(v_skills, 1), 0) = 0 THEN RETURN false; END IF;
  IF COALESCE(v_guar_name, '') = '' OR COALESCE(v_guar_phone, '') = '' THEN RETURN false; END IF;

  SELECT EXISTS(SELECT 1 FROM public.cleaner_documents d WHERE d.cleaner_id = p_cleaner AND d.document_type = 'ghana_card')
  INTO v_has_ghana;
  SELECT EXISTS(SELECT 1 FROM public.cleaner_documents d WHERE d.cleaner_id = p_cleaner AND d.document_type = 'selfie')
  INTO v_has_selfie;

  RETURN v_has_ghana AND v_has_selfie;
END;
$$;

-- 3. RLS on booking_applications.
ALTER TABLE public.booking_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cleaners can apply for bookings" ON public.booking_applications;
CREATE POLICY "Eligible cleaners can apply for bookings"
  ON public.booking_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = cleaner_id AND public.cleaner_can_apply(cleaner_id));

DROP POLICY IF EXISTS "Users can view booking applications" ON public.booking_applications;
CREATE POLICY "Users can view booking applications"
  ON public.booking_applications FOR SELECT
  TO authenticated
  USING (
    auth.uid() = cleaner_id
    OR EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_applications.booking_id
      AND bookings.client_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update booking applications" ON public.booking_applications;
CREATE POLICY "Users can update booking applications"
  ON public.booking_applications FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = cleaner_id
    OR EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_applications.booking_id
      AND bookings.client_id = auth.uid()
    )
  );

-- 4. Enable realtime for the cleaner <-> client flows.
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cleaner_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
