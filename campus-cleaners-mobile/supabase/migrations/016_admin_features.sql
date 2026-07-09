-- ============================================================
-- Migration 016: Admin feature tables + schema extensions
-- ============================================================

-- 1. Extend disputes with priority + extra statuses/types
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium'
  CHECK (priority IN ('high', 'medium', 'low'));

ALTER TABLE disputes DROP CONSTRAINT IF EXISTS disputes_status_check;
ALTER TABLE disputes ADD CONSTRAINT disputes_status_check
  CHECK (status IN ('open', 'in_progress', 'under_review', 'escalated', 'resolved'));

ALTER TABLE disputes DROP CONSTRAINT IF EXISTS disputes_type_check;
ALTER TABLE disputes ADD CONSTRAINT disputes_type_check
  CHECK (type IN ('no_show', 'poor_quality', 'property_damage', 'theft', 'overcharge'));

-- 2. Review moderation flags
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS flagged BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT false;

-- 3. Service areas (admin-managed zones)
CREATE TABLE IF NOT EXISTS public.service_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  radius_km NUMERIC(4, 1) NOT NULL DEFAULT 2,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view service areas" ON public.service_areas;
CREATE POLICY "Anyone can view service areas"
  ON public.service_areas FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage service areas" ON public.service_areas;
CREATE POLICY "Admins manage service areas"
  ON public.service_areas FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4. Admin broadcast notifications (platform-wide announcements)
CREATE TABLE IF NOT EXISTS public.admin_broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('booking', 'payment', 'system', 'dispute')),
  recipient TEXT NOT NULL CHECK (recipient IN ('all', 'clients', 'cleaners', 'specific')),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

ALTER TABLE public.admin_broadcasts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view broadcasts" ON public.admin_broadcasts;
CREATE POLICY "Admins view broadcasts"
  ON public.admin_broadcasts FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Admins manage broadcasts" ON public.admin_broadcasts;
CREATE POLICY "Admins manage broadcasts"
  ON public.admin_broadcasts FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 5. Seed service areas
INSERT INTO public.service_areas (name, active, radius_km, description) VALUES
  ('UCC Campus', true, 2, 'University of Cape Coast main campus and student hostels'),
  ('Amamoma', true, 3, 'Amamoma residential area near UCC'),
  ('Kwaprow', true, 2.5, 'Kwaprow community, Cape Coast'),
  ('Ayensu', true, 2, 'Ayensu Estate residential area'),
  ('Cape Coast Central', false, 4, 'Cape Coast central business district')
ON CONFLICT (name) DO NOTHING;

-- 6. Enable realtime for new/admin tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'disputes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.disputes;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'service_types'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.service_types;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'admin_broadcasts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_broadcasts;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'service_areas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.service_areas;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'cleaner_documents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cleaner_documents;
  END IF;
END $$;
