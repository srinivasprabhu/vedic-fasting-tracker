/**
 * Single source of truth for daily step totals (auto + manual) per calendar day.
 * Keys: aayu_steps_day_<y>_<m>_<d>
 * Legacy fallback: aayu_steps_manual_* (manual-only history), aayu_steps_* (old steps screen).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/** Last calendar day (YYYY-MM-DD) the user opened the app — used to seal prior days’ totals. */
const STEPS_LAST_OPEN_YMD_KEY = 'aayu_steps_last_open_ymd';

export function stepsDayKey(d: Date): string {
  return `aayu_steps_day_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
}

/** Manual top-ups only — still used by usePedometer for today's breakdown. */
export function manualStepsKey(d: Date): string {
  return `aayu_steps_manual_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
}

/** Legacy key from older steps screen (unused writer; read for migration). */
function legacyStepsKey(d: Date): string {
  return `aayu_steps_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
}

export function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function formatLocalDateYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseYmdLocal(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return startOfLocalDay(new Date(y, m - 1, d));
}

function addCalendarDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return startOfLocalDay(x);
}

export async function saveDayTotal(d: Date, total: number): Promise<void> {
  const n = Math.max(0, Math.round(total));
  try {
    await AsyncStorage.setItem(stepsDayKey(d), String(n));
  } catch {}
}

/**
 * Read persisted total for a calendar day.
 * Order: unified day key → legacy manual-only → legacy steps screen key.
 */
export async function loadDayTotal(d: Date): Promise<number> {
  try {
    const unified = await AsyncStorage.getItem(stepsDayKey(d));
    if (unified) {
      const v = parseInt(unified, 10);
      if (!Number.isNaN(v)) return v;
    }
    const manual = await AsyncStorage.getItem(manualStepsKey(d));
    if (manual) {
      const v = parseInt(manual, 10);
      if (!Number.isNaN(v)) return v;
    }
    const leg = await AsyncStorage.getItem(legacyStepsKey(d));
    if (leg) {
      const v = parseInt(leg, 10);
      if (!Number.isNaN(v)) return v;
    }
  } catch {}
  return 0;
}

export type WeekStepBar = { label: string; steps: number; isToday: boolean };

/** 7-day row Mon–Sun aligned to current week (same logic as Home / Daily). */
export async function loadWeekStepBars(): Promise<WeekStepBar[]> {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const now = new Date();
  const fromMon = now.getDay() === 0 ? 6 : now.getDay() - 1;
  return Promise.all(
    labels.map(async (label, i) => {
      const diff = i - fromMon;
      const d = new Date(now);
      d.setDate(d.getDate() + diff);
      const steps = await loadDayTotal(d);
      return { label, steps, isToday: diff === 0 };
    }),
  );
}

/**
 * On first open of a new calendar day: seal totals for each completed day since last open
 * (from `lastOpen` through yesterday) using OS step count + manual, merged with unified key.
 */
export async function finalizePastStepDaysSinceLastOpen(
  getStepCountInRange: (start: Date, end: Date) => Promise<number>,
): Promise<void> {
  const todayStr = formatLocalDateYmd(new Date());
  let lastOpen: string | null = null;
  try {
    lastOpen = await AsyncStorage.getItem(STEPS_LAST_OPEN_YMD_KEY);
  } catch {}

  if (!lastOpen) {
    try {
      await AsyncStorage.setItem(STEPS_LAST_OPEN_YMD_KEY, todayStr);
    } catch {}
    return;
  }

  if (lastOpen > todayStr) {
    try {
      await AsyncStorage.setItem(STEPS_LAST_OPEN_YMD_KEY, todayStr);
    } catch {}
    return;
  }

  const yesterdayStart = addCalendarDays(startOfLocalDay(new Date()), -1);
  const startFinalize = startOfLocalDay(parseYmdLocal(lastOpen));
  const endFinalize = yesterdayStart;

  if (startFinalize.getTime() <= endFinalize.getTime()) {
    let d = new Date(startFinalize);
    while (d.getTime() <= endFinalize.getTime()) {
      const dayStart = startOfLocalDay(d);
      const dayEnd = endOfLocalDay(d);

      let auto = 0;
      try {
        auto = await getStepCountInRange(dayStart, dayEnd);
      } catch {
        auto = 0;
      }

      let manual = 0;
      try {
        const raw = await AsyncStorage.getItem(manualStepsKey(dayStart));
        manual = raw ? parseInt(raw, 10) || 0 : 0;
      } catch {
        manual = 0;
      }

      const fromOs = auto + manual;
      const existing = await loadDayTotal(dayStart);
      const merged = Math.max(existing, fromOs);
      if (merged > 0) {
        await saveDayTotal(dayStart, merged);
      }

      d = addCalendarDays(d, 1);
    }
  }

  try {
    await AsyncStorage.setItem(STEPS_LAST_OPEN_YMD_KEY, todayStr);
  } catch {}
}
