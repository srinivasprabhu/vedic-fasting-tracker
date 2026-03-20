-- ─────────────────────────────────────────────────────────────────────────────
-- Aayu — Supabase database schema
-- Use this as the source of truth for table definitions.
-- Run in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── fasting_records ─────────────────────────────────────────────────────────
-- Stores individual fasting sessions, synced from the app.
-- Sync: lib/sync.ts | Types: types/fasting.ts (FastRecord)

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
-- User settings and body metrics. One row per auth.users.id.
-- Sync: contexts/UserProfileContext.ts | Types: types/user.ts (UserProfile)

CREATE TABLE IF NOT EXISTS profiles (
  id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name              text,
  currency          text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  -- Onboarding
  fasting_level     text CHECK (fasting_level IN ('beginner', 'intermediate', 'experienced')),
  fasting_path      text CHECK (fasting_path IN ('if', 'vedic', 'both')),
  age_group         text CHECK (age_group IN (
    'under_18', '18_25', '26_35', '36_45', '46_55', '56_65', '65_plus'
  )),
  -- Body metrics
  sex               text CHECK (sex IN ('male', 'female', 'prefer_not_to_say')),
  dob               date,
  height_cm         numeric(5,1),
  current_weight_kg numeric(5,2),
  goal_weight_kg    numeric(5,2),
  weight_unit       text DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs')),
  fasting_purpose   text CHECK (fasting_purpose IN ('weight_loss', 'energy', 'metabolic', 'spiritual')),
  plan              jsonb
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

-- ─── RLS (Row Level Security) ──────────────────────────────────────────────────
-- Enable RLS and policies so users can only access their own data.
-- Supabase enables RLS by default on new tables; adjust as needed.

ALTER TABLE fasting_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- fasting_records: user can only access own rows
CREATE POLICY "Users can manage own fasting records"
  ON fasting_records FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- profiles: user can only access own row
CREATE POLICY "Users can manage own profile"
  ON profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
