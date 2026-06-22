-- ============================================================
-- Seed Data: Service Types
-- ============================================================

-- Cleaning Services
INSERT INTO service_types (id, category, name, description, base_price) VALUES
  (uuid_generate_v4(), 'cleaning', 'Express Touch-Up', 'Quick clean for tidy rooms. Dusting, sweeping, mopping, and surface wipe-down.', 30.00),
  (uuid_generate_v4(), 'cleaning', 'Deep Scrub', 'Thorough deep clean including scrubbing, bathroom deep clean, and behind-furniture cleaning.', 60.00),
  (uuid_generate_v4(), 'cleaning', 'Move-In / Move-Out', 'Complete room restoration for moving in or out. Includes walls, windows, floors, and fixtures.', 100.00);

-- Laundry Services
INSERT INTO service_types (id, category, name, description, base_price) VALUES
  (uuid_generate_v4(), 'laundry', 'Wash Only', 'Machine wash with detergent. Folded and returned.', 2.00),
  (uuid_generate_v4(), 'laundry', 'Wash & Iron', 'Machine wash, dried, and professionally ironed.', 4.00),
  (uuid_generate_v4(), 'laundry', 'Iron Only', 'Professional ironing for pre-washed clothes.', 2.50);
