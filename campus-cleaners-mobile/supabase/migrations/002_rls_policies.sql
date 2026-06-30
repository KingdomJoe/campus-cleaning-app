-- ============================================================
-- Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaner_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- CLEANER PROFILES
-- ============================================================
CREATE POLICY "Anyone can view cleaner profiles"
  ON cleaner_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Cleaners can update their own cleaner profile"
  ON cleaner_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Cleaners can insert their own cleaner profile"
  ON cleaner_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- CLEANER DOCUMENTS
-- ============================================================
CREATE POLICY "Cleaners can view their own documents"
  ON cleaner_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = cleaner_id);

CREATE POLICY "Cleaners can upload documents"
  ON cleaner_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = cleaner_id);

-- ============================================================
-- SERVICE TYPES (public read)
-- ============================================================
CREATE POLICY "Anyone can view service types"
  ON service_types FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE POLICY "Clients can view their own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    auth.uid() = client_id
    OR auth.uid() = cleaner_id
    OR (status = 'requested' AND cleaner_id IS NULL)
  );

CREATE POLICY "Clients can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Booking participants can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_id OR auth.uid() = cleaner_id)
  WITH CHECK (auth.uid() = client_id OR auth.uid() = cleaner_id);

-- ============================================================
-- BOOKING PHOTOS
-- ============================================================
CREATE POLICY "Booking participants can view photos"
  ON booking_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_photos.booking_id
      AND (bookings.client_id = auth.uid() OR bookings.cleaner_id = auth.uid())
    )
  );

CREATE POLICY "Booking participants can upload photos"
  ON booking_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_photos.booking_id
      AND (bookings.client_id = auth.uid() OR bookings.cleaner_id = auth.uid())
    )
  );

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE POLICY "Booking participants can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = messages.booking_id
      AND (bookings.client_id = auth.uid() OR bookings.cleaner_id = auth.uid())
    )
  );

CREATE POLICY "Booking participants can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = messages.booking_id
      AND (bookings.client_id = auth.uid() OR bookings.cleaner_id = auth.uid())
    )
  );

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Clients can submit reviews for their bookings"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = client_id
    AND EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = reviews.booking_id
      AND bookings.client_id = auth.uid()
      AND bookings.status IN ('completed', 'verified', 'closed')
    )
  );

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE POLICY "Payment participants can view payments"
  ON payments FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id OR auth.uid() = cleaner_id);

CREATE POLICY "System can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Payment participants can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_id OR auth.uid() = cleaner_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- DISPUTES
-- ============================================================
CREATE POLICY "Dispute participants can view disputes"
  ON disputes FOR SELECT
  TO authenticated
  USING (
    auth.uid() = raised_by
    OR EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = disputes.booking_id
      AND (bookings.client_id = auth.uid() OR bookings.cleaner_id = auth.uid())
    )
  );

CREATE POLICY "Users can create disputes for their bookings"
  ON disputes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = raised_by);

-- ============================================================
-- AUDIT LOGS (insert only, no read for regular users)
-- ============================================================
CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
