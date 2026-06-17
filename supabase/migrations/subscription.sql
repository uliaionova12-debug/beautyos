-- Subscription System — Phase 1
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS subscriptions (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id         uuid NOT NULL UNIQUE,
  plan_name        text NOT NULL DEFAULT 'starter',
  status           text NOT NULL DEFAULT 'trial',  -- trial | active | expired | cancelled
  trial_started_at timestamptz NOT NULL DEFAULT now(),
  trial_ends_at    timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  active_until     timestamptz,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_salon ON subscriptions (salon_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions (status);

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscriptions_updated_at();
