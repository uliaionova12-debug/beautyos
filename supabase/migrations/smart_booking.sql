-- Smart Booking Layer — MVP 1.0
-- Run this in Supabase SQL Editor

-- ── Availability: master's weekly recurring schedule ─────────────────────────
CREATE TABLE IF NOT EXISTS availability (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  master_id      uuid NOT NULL,
  salon_id       uuid NOT NULL,
  day_of_week    integer NOT NULL,        -- 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
  start_time     time NOT NULL,
  end_time       time NOT NULL,
  slot_duration  integer NOT NULL DEFAULT 60,  -- minutes per slot
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz DEFAULT now(),
  UNIQUE (master_id, day_of_week)
);

-- ── Bookings: individual appointments ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  master_id      uuid NOT NULL,
  salon_id       uuid NOT NULL,
  client_id      uuid,                    -- null = new / unlinked client
  client_name    text NOT NULL,
  client_phone   text,
  booking_date   date NOT NULL,
  booking_time   time NOT NULL,
  duration       integer NOT NULL DEFAULT 60,
  status         text NOT NULL DEFAULT 'booked',  -- booked | completed | cancelled
  notes          text,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_master_date ON bookings (master_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_client      ON bookings (client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_salon       ON bookings (salon_id);
