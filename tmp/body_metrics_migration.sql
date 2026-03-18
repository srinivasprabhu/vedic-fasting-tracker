-- ─────────────────────────────────────────────────────────────────────────────
-- Aayu — Body Metrics Migration
-- Run in: Supabase Dashboard → SQL Editor
-- All ADD COLUMN IF NOT EXISTS — safe to run on live table
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS sex               text
    CHECK (sex IN ('male', 'female', 'prefer_not_to_say')),

  ADD COLUMN IF NOT EXISTS dob               date,

  ADD COLUMN IF NOT EXISTS height_cm         numeric(5,1),

  ADD COLUMN IF NOT EXISTS current_weight_kg numeric(5,2),

  ADD COLUMN IF NOT EXISTS goal_weight_kg    numeric(5,2),

  ADD COLUMN IF NOT EXISTS weight_unit       text
    DEFAULT 'kg'
    CHECK (weight_unit IN ('kg', 'lbs')),

  ADD COLUMN IF NOT EXISTS fasting_purpose   text
    CHECK (fasting_purpose IN ('weight_loss', 'energy', 'metabolic', 'spiritual')),

  ADD COLUMN IF NOT EXISTS plan              jsonb,

  ADD COLUMN IF NOT EXISTS updated_at        timestamptz DEFAULT now();

-- updated_at trigger
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
