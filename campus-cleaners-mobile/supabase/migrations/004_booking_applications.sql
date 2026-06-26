-- ============================================================
-- Booking Applications (Cleaner Bids)
-- ============================================================

CREATE TABLE IF NOT EXISTS booking_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  cleaner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_booking_cleaner UNIQUE (booking_id, cleaner_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_applications_booking ON booking_applications(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_applications_cleaner ON booking_applications(cleaner_id);

-- Enable RLS
ALTER TABLE booking_applications ENABLE ROW LEVEL SECURITY;

-- Policies:
-- 1. Cleaners can insert their own applications
CREATE POLICY "Cleaners can apply for bookings"
  ON booking_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = cleaner_id);

-- 2. Anyone (cleaners and clients) involved can view booking applications
CREATE POLICY "Users can view booking applications"
  ON booking_applications FOR SELECT
  TO authenticated
  USING (
    auth.uid() = cleaner_id
    OR EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_applications.booking_id
      AND bookings.client_id = auth.uid()
    )
  );

-- 3. Clients can update booking applications (accept/decline) for their bookings.
CREATE POLICY "Users can update booking applications"
  ON booking_applications FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = cleaner_id
    OR EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_applications.booking_id
      AND bookings.client_id = auth.uid()
    )
  );

-- Trigger: update_updated_at
CREATE TRIGGER booking_applications_updated_at BEFORE UPDATE ON booking_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
