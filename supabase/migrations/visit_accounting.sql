-- Visit Accounting Layer — Phase 1
-- Run in Supabase SQL Editor

-- Add new columns to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS service_name   text,
  ADD COLUMN IF NOT EXISTS service_price  numeric(10,2),
  ADD COLUMN IF NOT EXISTS next_visit_date date,
  ADD COLUMN IF NOT EXISTS updated_at     timestamptz DEFAULT now();

-- Service catalogue (MVP — name + price + duration per master)
CREATE TABLE IF NOT EXISTS services (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  master_id    uuid NOT NULL,
  salon_id     uuid NOT NULL,
  name         text NOT NULL,
  duration_min integer DEFAULT 60,
  price        numeric(10,2),
  active       boolean DEFAULT true,
  sort_order   integer DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_master ON services (master_id);
CREATE INDEX IF NOT EXISTS idx_services_salon  ON services (salon_id);
