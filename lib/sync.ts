// lib/sync.ts
// Supabase sync layer — handles bidirectional sync for all persisted data.
//
// Tables synced:
//   1. profiles        — user profile, body metrics, plan (JSONB)
//   2. fasting_records — individual fasting sessions
//   3. weight_logs     — weight measurements (one per day)
//   4. daily_summaries — end-of-day water + steps snapshot
//
// Sync strategy:
//   - On sign-in: upload local → fetch cloud → merge (cloud wins for conflicts)
//   - On data change: upsert to Supabase in background (fire-and-forget)
//   - Offline: works from AsyncStorage, syncs when connection returns

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import type { FastRecord } from '@/types/fasting';
import type { UserProfile } from '@/types/user';
import { FASTING_RECORDS_STORAGE_KEY, PROFILE_STORAGE_KEY } from '@/constants/storageKeys';

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEY_RECORDS = FASTING_RECORDS_STORAGE_KEY;
const KEY_WEIGHT  = 'aayu_weight_log';

// ─── Type helpers ─────────────────────────────────────────────────────────────

interface DbFastingRecord {
  id: string;
  user_id: string;
  type: string;
  label: string;
  start_time: number;
  end_time: number | null;
  target_duration: number;
  completed: boolean;
  notes: string;
}

interface WeightEntry {
  id:   string;
  kg:   number;
  date: string;
  time: number;
}

interface DbWeightLog {
  id:        string;
  user_id:   string;
  kg:        number;
  date:      string;
  logged_at: number;
}

interface DbDailySummary {
  user_id:  string;
  date:     string;
  water_ml: number;
  steps:    number;
}

// ─── Fasting records ──────────────────────────────────────────────────────────

function toDbRecord(r: FastRecord, userId: string): DbFastingRecord {
  return {
    id: r.id, user_id: userId, type: r.type, label: r.label,
    start_time: r.startTime, end_time: r.endTime,
    target_duration: r.targetDuration, completed: r.completed,
    notes: r.notes || '',
  };
}

function fromDbRecord(row: DbFastingRecord): FastRecord {
  return {
    id: row.id, type: row.type as FastRecord['type'], label: row.label,
    startTime: row.start_time, endTime: row.end_time,
    targetDuration: row.target_duration, completed: row.completed,
    notes: row.notes || '',
  };
}

export async function uploadLocalRecords(userId: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(KEY_RECORDS);
    const records: FastRecord[] = stored ? JSON.parse(stored) : [];
    const rows = records.filter(r => r.endTime !== null).map(r => toDbRecord(r, userId));
    if (rows.length === 0) return;

    const { error } = await supabase.from('fasting_records').upsert(rows, { onConflict: 'user_id,id' });
    if (error) console.warn('uploadLocalRecords failed:', error);
  } catch (e) {
    console.warn('uploadLocalRecords error:', e);
  }
}

export async function fetchCloudRecords(userId: string): Promise<FastRecord[]> {
  try {
    const { data, error } = await supabase
      .from('fasting_records')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (error) { console.warn('fetchCloudRecords failed:', error); return []; }

    const cloudRecords = (data ?? []).map(fromDbRecord);
    const stored = await AsyncStorage.getItem(KEY_RECORDS);
    const localRecords: FastRecord[] = stored ? JSON.parse(stored) : [];

    // Merge: cloud wins for duplicates
    const cloudIds = new Set(cloudRecords.map(r => r.id));
    const localOnly = localRecords.filter(r => !cloudIds.has(r.id));
    const merged = [...cloudRecords, ...localOnly].sort((a, b) => b.startTime - a.startTime);

    await AsyncStorage.setItem(KEY_RECORDS, JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.warn('fetchCloudRecords error:', e);
    return [];
  }
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function uploadLocalProfile(userId: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
    const p: UserProfile | null = stored ? JSON.parse(stored) : null;
    if (!p) return;

    const { error } = await supabase.from('profiles').upsert(
      {
        id:                   userId,
        name:                 p.name,
        age_group:            p.ageGroup ?? null,
        fasting_level:        p.fastingLevel ?? null,
        fasting_path:         p.fastingPath ?? 'if',
        currency:             p.currency ?? null,
        sex:                  p.sex ?? null,
        dob:                  p.dob ?? null,
        age_years:            p.ageYears ?? null,
        height_cm:            p.heightCm ?? null,
        current_weight_kg:    p.currentWeightKg ?? null,
        starting_weight_kg:   p.startingWeightKg ?? null,
        goal_weight_kg:       p.goalWeightKg ?? null,
        weight_unit:          p.weightUnit ?? 'kg',
        fasting_purpose:      p.fastingPurpose ?? null,
        activity_level:       p.activityLevel ?? null,
        last_meal_time:            p.lastMealTime ?? null,
        fast_window_start_minutes: p.fastWindowStartMinutes ?? null,
        health_concerns:      p.healthConcerns ?? [],
        safety_flags:         p.safetyFlags ?? {},
        plan:                 p.plan ?? null,
      },
      { onConflict: 'id' }
    );
    if (error) console.warn('uploadLocalProfile failed:', error);
  } catch (e) {
    console.warn('uploadLocalProfile error:', e);
  }
}

export async function fetchCloudProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') console.warn('fetchCloudProfile failed:', error);
      return null;
    }
    if (!data) return null;

    // Map DB columns → UserProfile
    const profile: UserProfile = {
      name:             data.name ?? '',
      ageGroup:         data.age_group ?? null,
      fastingLevel:     data.fasting_level ?? null,
      fastingPath:      data.fasting_path ?? 'if',
      currency:         data.currency ?? undefined,
      createdAt:        data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      sex:              data.sex ?? undefined,
      dob:              data.dob ?? undefined,
      ageYears:
        data.age_years != null && data.age_years !== ''
          ? Number(data.age_years)
          : undefined,
      heightCm:         data.height_cm ? Number(data.height_cm) : undefined,
      currentWeightKg:  data.current_weight_kg ? Number(data.current_weight_kg) : undefined,
      startingWeightKg: data.starting_weight_kg ? Number(data.starting_weight_kg) : undefined,
      goalWeightKg:     data.goal_weight_kg ? Number(data.goal_weight_kg) : undefined,
      weightUnit:       data.weight_unit ?? 'kg',
      fastingPurpose:   data.fasting_purpose ?? undefined,
      activityLevel:    data.activity_level ?? undefined,
      lastMealTime:           data.last_meal_time ?? undefined,
      fastWindowStartMinutes:
        data.fast_window_start_minutes != null ? Number(data.fast_window_start_minutes) : undefined,
      healthConcerns:   data.health_concerns ?? undefined,
      safetyFlags:      data.safety_flags ?? undefined,
      plan:             data.plan ?? undefined,
    };

    // Merge with local: cloud profile wins, but preserve local-only fields
    const localStored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
    const localProfile: UserProfile | null = localStored ? JSON.parse(localStored) : null;
    const merged = localProfile ? { ...localProfile, ...profile } : profile;

    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.warn('fetchCloudProfile error:', e);
    return null;
  }
}

// ─── Weight logs ──────────────────────────────────────────────────────────────

export async function uploadLocalWeightLogs(userId: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(KEY_WEIGHT);
    const entries: WeightEntry[] = stored ? JSON.parse(stored) : [];
    if (entries.length === 0) return;

    const rows: DbWeightLog[] = entries.map(e => ({
      id: e.id, user_id: userId, kg: e.kg, date: e.date, logged_at: e.time,
    }));

    // Upsert — if same user+date exists, update the kg and logged_at
    const { error } = await supabase.from('weight_logs').upsert(rows, {
      onConflict: 'user_id,id',
      ignoreDuplicates: false,
    });
    if (error) console.warn('uploadLocalWeightLogs failed:', error);
  } catch (e) {
    console.warn('uploadLocalWeightLogs error:', e);
  }
}

export async function fetchCloudWeightLogs(userId: string): Promise<WeightEntry[]> {
  try {
    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) { console.warn('fetchCloudWeightLogs failed:', error); return []; }

    const cloudEntries: WeightEntry[] = (data ?? []).map(row => ({
      id: row.id, kg: Number(row.kg), date: row.date, time: row.logged_at,
    }));

    // Merge with local
    const stored = await AsyncStorage.getItem(KEY_WEIGHT);
    const localEntries: WeightEntry[] = stored ? JSON.parse(stored) : [];
    const cloudDates = new Set(cloudEntries.map(e => e.date));
    const localOnly = localEntries.filter(e => !cloudDates.has(e.date));
    const merged = [...cloudEntries, ...localOnly].sort((a, b) => b.time - a.time);

    await AsyncStorage.setItem(KEY_WEIGHT, JSON.stringify(merged.slice(0, 90)));
    return merged;
  } catch (e) {
    console.warn('fetchCloudWeightLogs error:', e);
    return [];
  }
}

/** Sync a single weight entry immediately (call after user logs weight) */
export async function syncWeightEntry(userId: string, entry: WeightEntry): Promise<void> {
  try {
    const { error } = await supabase.from('weight_logs').upsert(
      { id: entry.id, user_id: userId, kg: entry.kg, date: entry.date, logged_at: entry.time },
      { onConflict: 'user_id,id' }
    );
    if (error) console.warn('syncWeightEntry failed:', error);
  } catch (e) {
    console.warn('syncWeightEntry error:', e);
  }
}

// ─── Daily summaries (water + steps) ──────────────────────────────────────────

/** Sync today's water + steps to Supabase. Call at end of day or on app background. */
export async function syncDailySummary(
  userId: string,
  date: string,
  waterMl: number,
  steps: number,
): Promise<void> {
  try {
    const { error } = await supabase.from('daily_summaries').upsert(
      { user_id: userId, date, water_ml: waterMl, steps },
      { onConflict: 'user_id,date' }
    );
    if (error) console.warn('syncDailySummary failed:', error);
  } catch (e) {
    console.warn('syncDailySummary error:', e);
  }
}

/** Upload local daily summaries for the past N days (catch-up on sign-in) */
export async function uploadLocalDailySummaries(userId: string, days: number = 30): Promise<void> {
  try {
    const rows: DbDailySummary[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      // Read water for this day
      const waterKey = `aayu_water_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
      let waterMl = 0;
      try {
        const raw = await AsyncStorage.getItem(waterKey);
        if (raw) {
          const entries: { ml: number }[] = JSON.parse(raw);
          waterMl = entries.reduce((s, e) => s + e.ml, 0);
        }
      } catch {}

      // Read steps for this day (unified key first, then legacy)
      const stepsKey = `aayu_steps_day_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
      const stepsManualKey = `aayu_steps_manual_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
      let steps = 0;
      try {
        const raw = await AsyncStorage.getItem(stepsKey);
        if (raw) { steps = parseInt(raw, 10) || 0; }
        else {
          const manualRaw = await AsyncStorage.getItem(stepsManualKey);
          if (manualRaw) { steps = parseInt(manualRaw, 10) || 0; }
        }
      } catch {}

      // Only sync if there's data
      if (waterMl > 0 || steps > 0) {
        rows.push({ user_id: userId, date: dateStr, water_ml: waterMl, steps });
      }
    }

    if (rows.length === 0) return;

    const { error } = await supabase.from('daily_summaries').upsert(rows, {
      onConflict: 'user_id,date',
    });
    if (error) console.warn('uploadLocalDailySummaries failed:', error);
  } catch (e) {
    console.warn('uploadLocalDailySummaries error:', e);
  }
}

export async function fetchCloudDailySummaries(userId: string, days: number = 90): Promise<void> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', userId)
      .gte('date', cutoffStr)
      .order('date', { ascending: false });

    if (error) { console.warn('fetchCloudDailySummaries failed:', error); return; }

    // Write cloud summaries back to local AsyncStorage keys
    for (const row of data ?? []) {
      const d = new Date(row.date + 'T00:00:00');

      // Water
      if (row.water_ml > 0) {
        const waterKey = `aayu_water_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
        const existing = await AsyncStorage.getItem(waterKey);
        if (!existing) {
          // Only backfill if no local data (local is more granular)
          await AsyncStorage.setItem(waterKey, JSON.stringify([
            { id: `w_cloud_${row.date}`, ml: row.water_ml, label: 'Synced', time: d.getTime() },
          ]));
        }
      }

      // Steps
      if (row.steps > 0) {
        const stepsKey = `aayu_steps_day_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
        const existing = await AsyncStorage.getItem(stepsKey);
        if (!existing) {
          await AsyncStorage.setItem(stepsKey, String(row.steps));
        }
      }
    }
  } catch (e) {
    console.warn('fetchCloudDailySummaries error:', e);
  }
}

// ─── Master sync on sign-in ───────────────────────────────────────────────────

export async function syncOnSignIn(userId: string): Promise<void> {
  // Upload ALL local data first (user's device is source of truth)
  // Use 365 days for daily summaries to catch long-time guest users
  await Promise.all([
    uploadLocalRecords(userId),
    uploadLocalProfile(userId),
    uploadLocalWeightLogs(userId),
    uploadLocalDailySummaries(userId, 365),
  ]);

  // Then fetch cloud data and merge (cloud wins for conflicts)
  // Use 365 days for daily summaries to restore full history on new device
  await Promise.all([
    fetchCloudRecords(userId),
    fetchCloudProfile(userId),
    fetchCloudWeightLogs(userId),
    fetchCloudDailySummaries(userId, 365),
  ]);
}
