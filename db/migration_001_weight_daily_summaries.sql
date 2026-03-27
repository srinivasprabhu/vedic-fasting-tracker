-- ─────────────────────────────────────────────────────────────────────────────
-- Aayu — Migration: add weight_logs, daily_summaries, and missing profile fields
-- Run AFTER schema.sql (which creates fasting_records + profiles)
-- Run in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Add missing columns to profiles ──────────────────────────────────────────
-- These columns exist in the CREATE TABLE but sync.ts wasn't sending them.
-- This is safe to run even if columns already exist (IF NOT EXISTS).

DO $$
BEGIN
  -- Activity level
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='activity_level') THEN
    ALTER TABLE profiles ADD COLUMN activity_level text CHECK (activity_level IN ('sedentary','lightly_active','moderately_active','very_active'));
  END IF;
  -- Starting weight (set once during onboarding)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='starting_weight_kg') THEN
    ALTER TABLE profiles ADD COLUMN starting_weight_kg numeric(5,2);
  END IF;
  -- Last meal time (for notification scheduling)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_meal_time') THEN
    ALTER TABLE profiles ADD COLUMN last_meal_time text CHECK (last_meal_time IN ('7pm','8pm','9pm','10pm','later'));
  END IF;
  -- Health concerns (stored as JSONB array)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='health_concerns') THEN
    ALTER TABLE profiles ADD COLUMN health_concerns jsonb DEFAULT '[]'::jsonb;
  END IF;
  -- Safety flags (stored as JSONB object)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='safety_flags') THEN
    ALTER TABLE profiles ADD COLUMN safety_flags jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- ─── weight_logs ──────────────────────────────────────────────────────────────
-- One row per weight measurement. Users typically log 1-2x/week.
-- ~100 rows/user/year, ~80 bytes each = ~8 KB/user/year.

CREATE TABLE IF NOT EXISTS weight_logs (
  id         text NOT NULL,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kg         numeric(5,2) NOT NULL,
  date       date NOT NULL,                -- YYYY-MM-DD (local date user logged)
  logged_at  bigint NOT NULL,              -- ms timestamp (for ordering and sync)
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (user_id, id)
);

-- Index for fetching user's logs in date order
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date
  ON weight_logs (user_id, date DESC);

-- Prevent duplicate logs on the same date (one weight per day)
CREATE UNIQUE INDEX IF NOT EXISTS idx_weight_logs_user_date_unique
  ON weight_logs (user_id, date);

ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own weight logs"
  ON weight_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── daily_summaries ──────────────────────────────────────────────────────────
-- End-of-day snapshot of water and steps. One row per user per day.
-- ~365 rows/user/year, ~100 bytes each = ~36 KB/user/year.

CREATE TABLE IF NOT EXISTS daily_summaries (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       date NOT NULL,                -- YYYY-MM-DD (local date)
  water_ml   integer NOT NULL DEFAULT 0,   -- total water consumed (ml)
  steps      integer NOT NULL DEFAULT 0,   -- total steps (auto + manual)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, date)
);

-- Index for fetching summaries in date order
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date
  ON daily_summaries (user_id, date DESC);

ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own daily summaries"
  ON daily_summaries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_daily_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS daily_summaries_updated_at ON daily_summaries;
CREATE TRIGGER daily_summaries_updated_at
  BEFORE UPDATE ON daily_summaries
  FOR EACH ROW EXECUTE FUNCTION update_daily_summaries_updated_at();
