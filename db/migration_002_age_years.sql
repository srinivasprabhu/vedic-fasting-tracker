-- ─────────────────────────────────────────────────────────────────────────────
-- Aayu — Migration: add age_years to profiles (explicit age from onboarding)
-- Run AFTER schema.sql / migration_001. Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'age_years'
  ) THEN
    ALTER TABLE profiles ADD COLUMN age_years integer
      CHECK (age_years IS NULL OR (age_years >= 14 AND age_years <= 120));
  END IF;
END $$;
