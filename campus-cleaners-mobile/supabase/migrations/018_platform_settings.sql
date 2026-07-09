-- ============================================================
-- Migration 018: Platform Settings Table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id INT PRIMARY KEY CHECK (id = 1),
  auto_accept_bookings BOOLEAN NOT NULL DEFAULT true,
  guest_bookings BOOLEAN NOT NULL DEFAULT false,
  booking_reminders BOOLEAN NOT NULL DEFAULT true,
  real_time_tracking BOOLEAN NOT NULL DEFAULT false,
  auto_release_payments BOOLEAN NOT NULL DEFAULT true,
  instant_payouts BOOLEAN NOT NULL DEFAULT false,
  refund_policy_enforcement BOOLEAN NOT NULL DEFAULT true,
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  new_registrations BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 20.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Select policy: Anyone who is authenticated can view settings
DROP POLICY IF EXISTS "Anyone can view platform settings" ON public.platform_settings;
CREATE POLICY "Anyone can view platform settings"
  ON public.platform_settings FOR SELECT TO authenticated USING (true);

-- Admin update/write policy
DROP POLICY IF EXISTS "Admins can manage platform settings" ON public.platform_settings;
CREATE POLICY "Admins can manage platform settings"
  ON public.platform_settings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Pre-seed default settings
INSERT INTO public.platform_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Enable Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'platform_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_settings;
  END IF;
END $$;
