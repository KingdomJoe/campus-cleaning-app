-- ============================================================
-- Fix: Ensure all service_types have is_active = TRUE
-- This fixes the issue where seed data may have is_active as NULL
-- due to the DEFAULT TRUE not being applied in some Postgres versions.
-- ============================================================

-- Set is_active to TRUE for all existing rows where it might be NULL or false
UPDATE service_types SET is_active = TRUE WHERE is_active IS NULL OR is_active = FALSE;

-- Ensure the column has a NOT NULL constraint with DEFAULT TRUE
ALTER TABLE service_types ALTER COLUMN is_active SET DEFAULT TRUE;
ALTER TABLE service_types ALTER COLUMN is_active SET NOT NULL;
