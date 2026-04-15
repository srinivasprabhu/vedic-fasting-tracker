import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadDayTotal } from '@/utils/stepsDayStorage';
import type { FastRecord } from '@/types/fasting';

export interface YesterdayData {
  /** e.g. "Sun, Apr 13" for the summary row */
  dateLabel: string;
  fastHours: number;
  fastCompleted: boolean;
  didFast: boolean;
  waterMl: number;
  steps: number;
  waterTarget: number;
  stepsTarget: number;
  fastTargetHours: number;
  streak: number;
}

export function yesterdayDateRange(): { start: number; end: number; date: Date } {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const end = new Date(yesterday);
  end.setHours(23, 59, 59, 999);
  return { start: yesterday.getTime(), end: end.getTime(), date: yesterday };
}

export function waterKeyForDate(d: Date): string {
  return `aayu_water_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
}

function metFastTarget(r: FastRecord): boolean {
  if (!r.endTime) return false;
  const duration = r.endTime - r.startTime;
  return r.completed || duration >= r.targetDuration * 0.8;
}

export async function loadYesterdayData(
  completedRecords: FastRecord[],
  opts: {
    waterTarget: number;
    stepsTarget: number;
    fastTargetHours: number;
    streak: number;
  },
): Promise<YesterdayData> {
  const { start, end, date } = yesterdayDateRange();

  const yesterdayFasts = completedRecords.filter((r) => {
    if (!r.endTime) return false;
    return r.endTime >= start && r.endTime <= end;
  });

  const didFast = yesterdayFasts.length > 0;
  const fastHours = yesterdayFasts.reduce((sum, r) => {
    const duration = (r.endTime! - r.startTime) / 3_600_000;
    return sum + Math.max(0, duration);
  }, 0);
  const fastCompleted = yesterdayFasts.some((r) => metFastTarget(r));

  let waterMl = 0;
  try {
    const raw = await AsyncStorage.getItem(waterKeyForDate(date));
    if (raw) {
      const entries: { ml: number }[] = JSON.parse(raw);
      waterMl = entries.reduce((s, e) => s + (e.ml ?? 0), 0);
    }
  } catch {
    /* ignore */
  }

  let steps = 0;
  try {
    steps = await loadDayTotal(date);
  } catch {
    /* ignore */
  }

  const dateLabel = date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

  return {
    dateLabel,
    fastHours,
    fastCompleted,
    didFast,
    waterMl,
    steps,
    waterTarget: opts.waterTarget,
    stepsTarget: opts.stepsTarget,
    fastTargetHours: opts.fastTargetHours,
    streak: opts.streak,
  };
}
