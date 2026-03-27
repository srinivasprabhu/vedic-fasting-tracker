-- ─────────────────────────────────────────────────────────────────────────────
-- Aayu — Supabase database schema (complete)
-- Use this as the source of truth for table definitions.
-- Run in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── fasting_records ─────────────────────────────────────────────────────────
-- Stores individual fasting sessions, synced from the app.
-- Sync: lib/sync.ts | Types: types/fasting.ts (FastRecord)
-- ~300 rows/user/year, ~200 bytes each = ~60 KB/user/year.

CREATE TABLE IF NOT EXISTS fasting_records (
  id              text NOT NULL,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            text NOT NULL,
  label           text NOT NULL,
  start_time      bigint NOT NULL,
  end_time        bigint,
  target_duration bigint NOT NULL,
  completed       boolean NOT NULL DEFAULT false,
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (user_id, id)
);

-- ─── profiles ─────────────────────────────────────────────────────────────────
-- User settings, body metrics, and generated plan. One row per auth.users.id.
-- Sync: lib/sync.ts + contexts/UserProfileContext.ts | Types: types/user.ts
-- ~2 KB/user (with JSONB plan).

CREATE TABLE IF NOT EXISTS profiles (
  id                   uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                 text,
  currency             text,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now(),
  -- Onboarding
  fasting_level        text CHECK (fasting_level IN ('beginner', 'intermediate', 'experienced')),
  fasting_path         text CHECK (fasting_path IN ('if', 'vedic', 'both')),
  age_group            text CHECK (age_group IN (
    'under_18', '18_25', '26_35', '36_45', '46_55', '56_65', '65_plus'
  )),
  -- Body metrics
  sex                  text CHECK (sex IN ('male', 'female', 'prefer_not_to_say')),
  dob                  date,
  height_cm            numeric(5,1),
  current_weight_kg    numeric(5,2),
  starting_weight_kg   numeric(5,2),
  goal_weight_kg       numeric(5,2),
  weight_unit          text DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs')),
  fasting_purpose      text CHECK (fasting_purpose IN ('weight_loss', 'energy', 'metabolic', 'spiritual')),
  activity_level       text CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active')),
  last_meal_time       text CHECK (last_meal_time IN ('7pm', '8pm', '9pm', '10pm', 'later')),
  health_concerns      jsonb DEFAULT '[]'::jsonb,
  safety_flags         jsonb DEFAULT '{}'::jsonb,
  -- Generated plan (includes fastHours, dailySteps, dailyCalories, weeksToGoal, etc.)
  plan                 jsonb
);

-- Auto-update updated_at on profiles
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profiles_updated_at();

-- ─── weight_logs ──────────────────────────────────────────────────────────────
-- One row per weight measurement. Users typically log 1-2x/week.
-- ~100 rows/user/year, ~80 bytes each = ~8 KB/user/year.
-- Sync: lib/sync.ts | Local: AsyncStorage 'aayu_weight_log'

CREATE TABLE IF NOT EXISTS weight_logs (
  id         text NOT NULL,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kg         numeric(5,2) NOT NULL,
  date       date NOT NULL,
  logged_at  bigint NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date
  ON weight_logs (user_id, date DESC);

-- One weight per user per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_weight_logs_user_date_unique
  ON weight_logs (user_id, date);

-- ─── daily_summaries ──────────────────────────────────────────────────────────
-- End-of-day snapshot of water intake and step count. One row per user per day.
-- ~365 rows/user/year, ~100 bytes each = ~36 KB/user/year.
-- Sync: lib/sync.ts | Local: AsyncStorage per-day keys

CREATE TABLE IF NOT EXISTS daily_summaries (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       date NOT NULL,
  water_ml   integer NOT NULL DEFAULT 0,
  steps      integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date
  ON daily_summaries (user_id, date DESC);

-- Auto-update updated_at on daily_summaries
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

-- ─── RLS (Row Level Security) ──────────────────────────────────────────────────

ALTER TABLE fasting_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own fasting records"
  ON fasting_records FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own profile"
  ON profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage own weight logs"
  ON weight_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own daily summaries"
  ON daily_summaries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
