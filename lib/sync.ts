import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import type { FastRecord } from '@/types/fasting';
import type { UserProfile } from '@/types/user';

const STORAGE_KEY_RECORDS = 'vedic_fasting_records';
const STORAGE_KEY_PROFILE = 'vedic_user_profile';

type DbFastingRecord = {
  id: string;
  user_id: string;
  type: string;
  label: string;
  start_time: number;
  end_time: number | null;
  target_duration: number;
  completed: boolean;
  notes: string;
};

function toDbRecord(r: FastRecord, userId: string): DbFastingRecord {
  return {
    id: r.id,
    user_id: userId,
    type: r.type,
    label: r.label,
    start_time: r.startTime,
    end_time: r.endTime,
    target_duration: r.targetDuration,
    completed: r.completed,
    notes: r.notes || '',
  };
}

function fromDbRecord(row: DbFastingRecord): FastRecord {
  return {
    id: row.id,
    type: row.type as FastRecord['type'],
    label: row.label,
    startTime: row.start_time,
    endTime: row.end_time,
    targetDuration: row.target_duration,
    completed: row.completed,
    notes: row.notes || '',
  };
}

/** Upload local AsyncStorage fasting records to Supabase. Skips duplicates by id. */
export async function uploadLocalRecords(userId: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY_RECORDS);
    const records: FastRecord[] = stored ? JSON.parse(stored) : [];
    if (records.length === 0) return;

    const rows = records
      .filter(r => r.endTime !== null)
      .map(r => toDbRecord(r, userId));

    if (rows.length === 0) return;

    const { error } = await supabase.from('fasting_records').upsert(rows, {
      onConflict: 'user_id,id',
    });
    if (error) console.warn('uploadLocalRecords failed:', error);
  } catch (e) {
    console.warn('uploadLocalRecords error:', e);
  }
}

/** Upload local profile to Supabase profiles table. */
export async function uploadLocalProfile(userId: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY_PROFILE);
    const profile: UserProfile | null = stored ? JSON.parse(stored) : null;
    if (!profile) return;

    const { error } = await supabase.from('profiles').upsert(
      {
        id: userId,
        name: profile.name,
        age_group: profile.ageGroup ?? null,
        fasting_level: profile.fastingLevel ?? null,
        fasting_path: profile.fastingPath ?? 'if',
        currency: profile.currency ?? null,
      },
      { onConflict: 'id' }
    );
    if (error) console.warn('uploadLocalProfile failed:', error);
  } catch (e) {
    console.warn('uploadLocalProfile error:', e);
  }
}

/** Fetch fasting records from Supabase and merge with local. Returns merged list. */
export async function fetchCloudRecords(
  userId: string
): Promise<FastRecord[]> {
  try {
    const { data, error } = await supabase
      .from('fasting_records')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (error) {
      console.warn('fetchCloudRecords failed:', error);
      return [];
    }

    const cloudRecords = (data ?? []).map(fromDbRecord);

    const stored = await AsyncStorage.getItem(STORAGE_KEY_RECORDS);
    const localRecords: FastRecord[] = stored ? JSON.parse(stored) : [];

    const cloudIds = new Set(cloudRecords.map(r => r.id));
    const localOnly = localRecords.filter(r => !cloudIds.has(r.id));
    const merged = [...cloudRecords, ...localOnly].sort(
      (a, b) => b.startTime - a.startTime
    );

    await AsyncStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.warn('fetchCloudRecords error:', e);
    return [];
  }
}

/** Fetch profile from Supabase. Returns merged profile (cloud overrides local if both exist). */
export async function fetchCloudProfile(
  userId: string
): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('name, age_group, fasting_level, fasting_path, currency')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') console.warn('fetchCloudProfile failed:', error);
      return null;
    }

    if (!data) return null;

    const profile: UserProfile = {
      name: data.name ?? '',
      ageGroup: (data.age_group as UserProfile['ageGroup']) ?? null,
      fastingLevel: (data.fasting_level as UserProfile['fastingLevel']) ?? null,
      fastingPath: (data.fasting_path as UserProfile['fastingPath']) ?? 'if',
      currency: data.currency ?? undefined,
      createdAt: Date.now(),
    };

    await AsyncStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    return profile;
  } catch (e) {
    console.warn('fetchCloudProfile error:', e);
    return null;
  }
}

/** Run initial sync on sign-in: upload local first, then fetch and merge cloud. */
export async function syncOnSignIn(userId: string): Promise<void> {
  await uploadLocalRecords(userId);
  await uploadLocalProfile(userId);
  await fetchCloudRecords(userId);
  await fetchCloudProfile(userId);
}
