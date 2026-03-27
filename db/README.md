# Database schema

The app uses **Supabase** for auth and persistence. The schema lives in Supabase — this folder documents it so you don't have to open the dashboard.

## Tables

| Table              | Purpose                                               | Est. size/user/year |
|--------------------|-------------------------------------------------------|---------------------|
| `profiles`         | User settings, body metrics, and generated plan (JSONB) | ~2 KB             |
| `fasting_records`  | Individual fasting sessions (start/end, type, notes)   | ~60 KB              |
| `weight_logs`      | Weight measurements (one per day max)                  | ~8 KB               |
| `daily_summaries`  | End-of-day water (ml) and steps snapshot               | ~36 KB              |
| **Total**          |                                                        | **~106 KB**         |

All tables reference `auth.users.id` and have RLS (Row Level Security) enabled.

## Cost estimate

| Users       | Storage    | Supabase tier | Monthly cost |
|-------------|-----------|---------------|--------------|
| 1–5,000     | < 500 MB  | Free          | $0           |
| 5K–75K      | < 8 GB    | Pro           | $25/mo       |
| 75K–500K    | 8–50 GB   | Pro + storage | $26–30/mo    |

## Column mapping

### fasting_records → `FastRecord` (`types/fasting.ts`)

| DB column        | TypeScript field   |
|------------------|--------------------|
| `id`             | `id`               |
| `user_id`        | (auth only)        |
| `type`           | `type`             |
| `label`          | `label`            |
| `start_time`     | `startTime` (ms)   |
| `end_time`       | `endTime` (ms)     |
| `target_duration`| `targetDuration`   |
| `completed`      | `completed`        |
| `notes`          | `notes`            |

### profiles → `UserProfile` (`types/user.ts`)

| DB column            | TypeScript field     | Notes |
|----------------------|----------------------|-------|
| `id`                 | (auth user id)       |       |
| `name`               | `name`               |       |
| `age_group`          | `ageGroup`           |       |
| `fasting_level`      | `fastingLevel`       |       |
| `fasting_path`       | `fastingPath`        |       |
| `currency`           | `currency`           |       |
| `sex`                | `sex`                |       |
| `dob`                | `dob`                |       |
| `height_cm`          | `heightCm`           |       |
| `current_weight_kg`  | `currentWeightKg`    |       |
| `starting_weight_kg` | `startingWeightKg`   | Set once during onboarding |
| `goal_weight_kg`     | `goalWeightKg`       |       |
| `weight_unit`        | `weightUnit`         |       |
| `fasting_purpose`    | `fastingPurpose`     |       |
| `activity_level`     | `activityLevel`      |       |
| `last_meal_time`     | `lastMealTime`       | For notification scheduling |
| `health_concerns`    | `healthConcerns`     | JSONB array |
| `safety_flags`       | `safetyFlags`        | JSONB object |
| `plan`               | `plan`               | JSONB — includes `weeklyFastDays`, `planTemplateId`, all calculated fields |

### weight_logs

| DB column   | Local field | Notes |
|-------------|-------------|-------|
| `id`        | `id`        | `wt_<timestamp>` |
| `user_id`   | (auth only) |       |
| `kg`        | `kg`        |       |
| `date`      | `date`      | YYYY-MM-DD, one per user per day |
| `logged_at` | `time`      | ms timestamp |

### daily_summaries

| DB column   | Local source | Notes |
|-------------|-------------|-------|
| `user_id`   | (auth only) |       |
| `date`      | derived     | YYYY-MM-DD |
| `water_ml`  | `aayu_water_Y_M_D` keys | Sum of all entries for the day |
| `steps`     | `aayu_steps_day_Y_M_D` or `aayu_steps_manual_Y_M_D` | Auto + manual |

## Sync behavior

### On sign-in (`syncOnSignIn` in `lib/sync.ts`)
1. **Upload local** → Supabase (all 4 tables, parallel)
2. **Fetch cloud** → merge with local (cloud wins for conflicts, parallel)

### On data change (real-time)
- **Fasting records**: upserted on start/end via FastingContext
- **Profile**: upserted on every profile update via UserProfileContext
- **Weight logs**: upserted immediately when user logs weight
- **Daily summaries**: synced at end of day or on app background

### Conflict resolution
- **Profiles**: cloud wins (most recent upsert)
- **Fasting records**: merge by ID (cloud wins for duplicates)
- **Weight logs**: merge by date (cloud wins, one entry per day)
- **Daily summaries**: upsert by (user_id, date) — latest value wins

## Setting up

### New project
1. Create a Supabase project
2. Run `schema.sql` in SQL Editor
3. Configure `lib/supabase.ts` with your project URL and anon key

### Existing project (migration)
1. Run `migration_001_weight_daily_summaries.sql` in SQL Editor
2. This adds `weight_logs`, `daily_summaries` tables and missing profile columns
3. Safe to run multiple times (uses IF NOT EXISTS)

## Files

| File | Purpose |
|------|---------|
| `schema.sql` | Complete schema — use for fresh projects |
| `migration_001_weight_daily_summaries.sql` | Incremental migration — adds new tables to existing DB |
