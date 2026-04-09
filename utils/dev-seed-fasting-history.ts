/**
 * __DEV__ helper — synthetic fasting history for charts / analytics testing.
 * Uses distinct ids prefixed with dev-seed- so re-runs can replace prior seed rows.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FastRecord } from '@/types/fasting';
import { FASTING_RECORDS_STORAGE_KEY } from '@/constants/storageKeys';

const SEED_ID_PREFIX = 'dev-seed-';
const MS_HOUR = 3600000;

/** JS weekdays Mon & Thu — aligns with 5:2 defaults in fastingPlanSchedule */
const FIVE_TWO_WEEKDAYS = new Set([1, 4]);

type Phase = '5:2' | '16:8' | '18:6';

function phaseForBucket(bucket: number): Phase {
  if (bucket < 14) return '5:2';
  if (bucket < 28) return '16:8';
  return '18:6';
}

function atLocalTimeDaysAgo(daysAgo: number, hour: number, minute = 0): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  d.setSeconds(0, 0);
  return d.getTime();
}

function weekdayForDaysAgo(daysAgo: number): number {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.getDay();
}

function buildSyntheticRecords(totalDays: number): FastRecord[] {
  const out: FastRecord[] = [];

  for (let daysAgo = totalDays; daysAgo >= 1; daysAgo--) {
    const bucket = totalDays - daysAgo;
    const phase = phaseForBucket(bucket);

    if (phase === '5:2') {
      if (!FIVE_TWO_WEEKDAYS.has(weekdayForDaysAgo(daysAgo))) continue;
      const startTime = atLocalTimeDaysAgo(daysAgo, 20, 0);
      const targetDuration = 24 * MS_HOUR;
      out.push({
        id: `${SEED_ID_PREFIX}52-${startTime}`,
        type: 'if_custom',
        label: '5:2 Fast',
        startTime,
        endTime: startTime + targetDuration,
        targetDuration,
        completed: true,
        notes: '',
      });
      continue;
    }

    const startTime = atLocalTimeDaysAgo(daysAgo, 20, 0);
    if (phase === '16:8') {
      const targetDuration = 16 * MS_HOUR;
      out.push({
        id: `${SEED_ID_PREFIX}168-${startTime}`,
        type: 'if_16_8',
        label: '16:8 Fast',
        startTime,
        endTime: startTime + targetDuration,
        targetDuration,
        completed: true,
        notes: '',
      });
    } else {
      const targetDuration = 18 * MS_HOUR;
      out.push({
        id: `${SEED_ID_PREFIX}186-${startTime}`,
        type: 'if_18_6',
        label: '18:6 Fast',
        startTime,
        endTime: startTime + targetDuration,
        targetDuration,
        completed: true,
        notes: '',
      });
    }
  }

  return out.sort((a, b) => b.startTime - a.startTime);
}

/**
 Merges synthetic fasts into AsyncStorage: removes prior dev-seed rows, keeps active fast and other user data.
 @returns number of newly written synthetic rows
 */
export async function applyDevFastingSeed(options?: { totalDays?: number }): Promise<number> {
  const totalDays = options?.totalDays ?? 120;
  const stored = await AsyncStorage.getItem(FASTING_RECORDS_STORAGE_KEY);
  const existing: FastRecord[] = stored ? JSON.parse(stored) : [];
  const withoutDev = existing.filter((r) => !r.id.startsWith(SEED_ID_PREFIX));
  const synthetic = buildSyntheticRecords(totalDays);
  const merged = [...synthetic, ...withoutDev].sort((a, b) => b.startTime - a.startTime);
  await AsyncStorage.setItem(FASTING_RECORDS_STORAGE_KEY, JSON.stringify(merged));
  return synthetic.length;
}
