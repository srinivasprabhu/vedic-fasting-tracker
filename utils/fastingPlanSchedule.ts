/**
 * Pure helpers: derive local clock hours for plan-based reminders.
 * Fast starts when the user finishes eating (last meal hour).
 * Fast ends at lastMealHour + fastHours (wraps within the day for display).
 */

import type { LastMealTime, PlanTemplateId, UserProfile } from '@/types/user';

export const WEEKLY_PLAN_TEMPLATE_IDS: PlanTemplateId[] = ['if_5_2', 'if_4_3'];

export function isWeeklyPlanTemplateId(id: string | undefined | null): id is PlanTemplateId {
  return id === 'if_5_2' || id === 'if_4_3';
}

export function requiredWeeklyFastDayCount(planTemplateId: string | undefined | null): 2 | 3 | null {
  if (planTemplateId === 'if_5_2') return 2;
  if (planTemplateId === 'if_4_3') return 3;
  return null;
}

/** Sensible defaults: 5:2 Mon+Thu, 4:3 Mon+Wed+Fri (JS weekday). */
export function defaultWeeklyFastDays(planTemplateId: 'if_5_2' | 'if_4_3'): number[] {
  if (planTemplateId === 'if_5_2') return [1, 4];
  return [1, 3, 5];
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function formatWeeklyFastDaysShort(days: number[] | undefined | null): string {
  if (!days?.length) return '';
  return [...days]
    .sort((a, b) => a - b)
    .map(d => DAY_SHORT[d] ?? '?')
    .join(', ');
}

/** Map onboarding last-meal choice to hour-of-day (0–23), local time. */
export function lastMealTimeToHour(last: LastMealTime | null | undefined): number {
  switch (last) {
    case '7pm':
      return 19;
    case '8pm':
      return 20;
    case '9pm':
      return 21;
    case '10pm':
      return 22;
    case 'later':
      return 22;
    default:
      return 19;
  }
}

/** Map a concrete start time to the closest onboarding bucket (for optional lastMealTime sync). */
export function nearestLastMealTimeFromMinutes(totalMinutes: number): LastMealTime {
  const m = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const buckets: { id: LastMealTime; min: number }[] = [
    { id: '7pm', min: 19 * 60 },
    { id: '8pm', min: 20 * 60 },
    { id: '9pm', min: 21 * 60 },
    { id: '10pm', min: 22 * 60 },
    { id: 'later', min: 23 * 60 },
  ];
  let best = buckets[0]!;
  let bestD = Math.abs(m - best.min);
  for (const b of buckets) {
    const d = Math.abs(m - b.min);
    if (d < bestD) {
      best = b;
      bestD = d;
    }
  }
  return best.id;
}

const DEFAULT_FAST_START_MINUTES = 19 * 60;

/** Minutes from local midnight (0–1439) when the fast starts (last meal ends). */
export function getPlannedFastStartMinutes(profile: UserProfile | null | undefined): number {
  if (!profile) return DEFAULT_FAST_START_MINUTES;
  const m = profile.fastWindowStartMinutes;
  if (typeof m === 'number' && Number.isFinite(m) && m >= 0 && m < 1440) {
    return Math.floor(m);
  }
  return lastMealTimeToHour(profile.lastMealTime ?? null) * 60;
}

/** Hour (0–23) when the daily fast typically starts — floor of minute-based start. */
export function getPlannedFastStartHour(profile: UserProfile | null | undefined): number {
  return Math.floor(getPlannedFastStartMinutes(profile) / 60);
}

/** End time in minutes from midnight (wraps within the day). */
export function getPlannedFastEndMinutes(startMinutes: number, fastHours: number): number {
  return (startMinutes + fastHours * 60) % 1440;
}

/** Clock hour (0–23) when the fast ends; use `getPlannedFastEndMinutes` when minutes matter. */
export function getPlannedFastEndHour(startHour: number, fastHours: number): number {
  return (startHour + fastHours) % 24;
}

/** “7:00 PM → 3:00 PM” style range for Settings / summaries. */
export function formatFastingWindowSummary(profile: UserProfile | null | undefined): string | null {
  const plan = profile?.plan;
  if (!plan?.fastHours) return null;
  const sm = getPlannedFastStartMinutes(profile);
  const em = getPlannedFastEndMinutes(sm, plan.fastHours);
  return `${formatReminderTimeLabel(Math.floor(sm / 60), sm % 60)} → ${formatReminderTimeLabel(Math.floor(em / 60), em % 60)}`;
}

/** 1 hour before fast starts — reminder hour (0–23). */
export function getReminderHourBeforeFastStart(startHour: number): number {
  return (startHour - 1 + 24) % 24;
}

/** 1 hour before fast ends — reminder hour (0–23). */
export function getReminderHourBeforeFastEnd(startHour: number, fastHours: number): number {
  const endHour = getPlannedFastEndHour(startHour, fastHours);
  return (endHour - 1 + 24) % 24;
}

/** Whether profile has enough data to schedule plan-based daily reminders. */
export function canSchedulePlanReminders(profile: UserProfile | null | undefined): profile is UserProfile {
  if (!profile?.plan?.fastHours) return false;
  return true;
}

export function formatReminderTimeLabel(hour: number, minute: number = 0): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** Summary for UI: planned windows from profile + plan. */
export function describePlanReminderSchedule(profile: UserProfile): {
  fastLabel: string;
  beforeStartLabel: string;
  beforeEndLabel: string;
  weeklyDaysNote?: string;
} | null {
  const plan = profile.plan;
  if (!plan?.fastHours) return null;
  const startM = getPlannedFastStartMinutes(profile);
  const beforeStartM = (startM - 60 + 1440) % 1440;
  const endM = getPlannedFastEndMinutes(startM, plan.fastHours);
  const beforeEndM = (endM - 60 + 1440) % 1440;
  const weeklyDaysNote =
    isWeeklyPlanTemplateId(plan.planTemplateId) && plan.weeklyFastDays?.length
      ? `Fasting days: ${formatWeeklyFastDaysShort(plan.weeklyFastDays)}`
      : isWeeklyPlanTemplateId(plan.planTemplateId)
        ? 'Pick fasting days in plan settings'
        : undefined;
  return {
    fastLabel: plan.fastLabel,
    beforeStartLabel: formatReminderTimeLabel(Math.floor(beforeStartM / 60), beforeStartM % 60),
    beforeEndLabel: formatReminderTimeLabel(Math.floor(beforeEndM / 60), beforeEndM % 60),
    ...(weeklyDaysNote ? { weeklyDaysNote } : {}),
  };
}

export type PlanScheduleInput = {
  /** Minutes from midnight when fast starts. */
  fastStartMinutes: number;
  fastHours: number;
  fastLabel: string;
  mode: 'daily' | 'weekly';
  /** Present when mode === 'weekly' (validated count). */
  weeklyFastDays?: number[];
};

function normalizeWeeklyDays(days: number[] | undefined, templateId: 'if_5_2' | 'if_4_3'): number[] {
  const need = templateId === 'if_5_2' ? 2 : 3;
  const uniq = [...new Set(days ?? [])].filter(d => d >= 0 && d <= 6);
  if (uniq.length === need) return uniq.sort((a, b) => a - b);
  return defaultWeeklyFastDays(templateId);
}

export function buildPlanScheduleInput(profile: UserProfile | null | undefined): PlanScheduleInput | null {
  if (!profile?.plan?.fastHours) return null;
  const base = {
    fastStartMinutes: getPlannedFastStartMinutes(profile),
    fastHours: profile.plan.fastHours,
    fastLabel: profile.plan.fastLabel,
  };
  const tid = profile.plan.planTemplateId;
  if (tid === 'if_5_2' || tid === 'if_4_3') {
    const weeklyFastDays = normalizeWeeklyDays(profile.plan.weeklyFastDays, tid);
    return { ...base, mode: 'weekly', weeklyFastDays };
  }
  return { ...base, mode: 'daily' };
}

/** Home timer eyebrow (third clause): when the next planned fast typically starts, local time. */
export function formatNextFastTimingPhrase(
  profile: UserProfile | null | undefined,
  now: Date = new Date(),
): string {
  const input = buildPlanScheduleInput(profile);
  if (!input) return 'starts tonight';

  const todayDow = now.getDay();
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const startMinutes = input.fastStartMinutes;
  const startHour = Math.floor(startMinutes / 60);

  const beforeFastStartToday = (): string => {
    if (startHour >= 17) {
      return 'starts tonight';
    }
    return `starts today · ${formatReminderTimeLabel(Math.floor(startMinutes / 60), startMinutes % 60)}`;
  };

  if (input.mode === 'daily') {
    if (minutesNow < startMinutes) return beforeFastStartToday();
    return 'tomorrow evening';
  }

  const days = input.weeklyFastDays;
  if (!days?.length) return 'pick fasting days';

  const daySet = new Set(days);
  if (daySet.has(todayDow)) {
    if (minutesNow < startMinutes) return beforeFastStartToday();
    return 'fast day — begin when ready';
  }

  for (let offset = 1; offset <= 7; offset++) {
    const d = (todayDow + offset) % 7;
    if (!daySet.has(d)) continue;
    if (offset === 1) return `tomorrow (${DAY_SHORT[d]})`;
    return `next: ${DAY_SHORT[d]}`;
  }

  return 'pick fasting days';
}

/**
 * Short label for the Today timer row (e.g. Tonight, Tomorrow, Mon).
 * Weekly (5:2 / 4:3): weekday until the calendar day before the next fast, then "Tonight".
 */
export function formatNextFastHomeLabel(
  profile: UserProfile | null | undefined,
  now: Date = new Date(),
): string {
  const input = buildPlanScheduleInput(profile);
  if (!input) return 'Tonight';

  const todayDow = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  const sm = input.fastStartMinutes;
  const startH = Math.floor(sm / 60);
  const startEvening = startH >= 17;

  if (input.mode === 'daily') {
    if (mins < sm) return startEvening ? 'Tonight' : 'Today';
    return 'Tomorrow';
  }

  const days = input.weeklyFastDays;
  if (!days?.length) return 'Pick days';

  const set = new Set(days);

  for (let offset = 0; offset <= 7; offset++) {
    const dow = (todayDow + offset) % 7;
    if (!set.has(dow)) continue;
    const isToday = offset === 0;
    if (isToday && mins >= sm) continue;
    if (offset === 0) return startEvening ? 'Tonight' : 'Today';
    if (offset === 1) return 'Tonight';
    return DAY_SHORT[dow] ?? '?';
  }

  return 'Tonight';
}

export function profileUsesWeeklyFastDays(profile: UserProfile | null | undefined): boolean {
  return isWeeklyPlanTemplateId(profile?.plan?.planTemplateId ?? null);
}

/**
 * Expo `WEEKLY` trigger weekday (same as scheduleWeeklySummary in notifications: 1 = Sunday … 7 = Saturday).
 * JS `Date.getDay()`: 0 = Sunday … 6 = Saturday.
 */
export function jsWeekdayToExpoCalendarWeekday(jsWeekday: number): number {
  return jsWeekday + 1;
}

/** Calendar day when a ~24h fast that started on `fastJsWeekday` ends (next day). */
export function nextJsWeekday(fastJsWeekday: number): number {
  return (fastJsWeekday + 1) % 7;
}
