# Database schema

The app uses **Supabase** for auth and persistence. The schema lives in Supabase — this folder documents it so you don’t have to open the dashboard.

## Tables

| Table             | Purpose                                                |
|-------------------|--------------------------------------------------------|
| `fasting_records` | Individual fasting sessions (start/end, type, notes)   |
| `profiles`        | User settings, body metrics, and generated plan (JSONB)|

Both tables reference `auth.users.id`. See `schema.sql` for full definitions.

## Column mapping

### fasting_records → `FastRecord` (`types/fasting.ts`)

| DB column       | TypeScript field   |
|-----------------|--------------------|
| `id`            | `id`               |
| `user_id`       | (auth only)        |
| `type`          | `type`             |
| `label`         | `label`            |
| `start_time`    | `startTime` (ms)   |
| `end_time`      | `endTime` (ms)     |
| `target_duration` | `targetDuration` |
| `completed`     | `completed`        |
| `notes`         | `notes`            |

### profiles → `UserProfile` (`types/user.ts`)

| DB column         | TypeScript field   |
|-------------------|--------------------|
| `id`              | (auth user id)     |
| `name`            | `name`             |
| `age_group`       | `ageGroup`         |
| `fasting_level`   | `fastingLevel`     |
| `fasting_path`    | `fastingPath`      |
| `currency`        | `currency`         |
| `sex`             | `sex`              |
| `dob`             | `dob`              |
| `height_cm`       | `heightCm`         |
| `current_weight_kg` | `currentWeightKg` |
| `goal_weight_kg`  | `goalWeightKg`     |
| `weight_unit`     | `weightUnit`       |
| `fasting_purpose` | `fastingPurpose`   |
| `plan`            | `plan` (JSONB) — includes optional `weeklyFastDays` (0–6 Sun–Sat) and `planTemplateId` for 5:2 / 4:3 |

## Sync behavior

- **Fasting records**: `lib/sync.ts` — uploads local records on sign-in, fetches cloud and merges with local.
- **Profiles**: `contexts/UserProfileContext.ts` — upserts full profile (including body metrics) on every update.

## Setting up a new project

1. Create a Supabase project.
2. In **SQL Editor**, run `schema.sql`.
3. Configure `lib/supabase.ts` with your project URL and anon key.

If your Supabase project already has older tables, use `tmp/body_metrics_migration.sql` to add body-metrics columns to `profiles` instead of running the full schema.
