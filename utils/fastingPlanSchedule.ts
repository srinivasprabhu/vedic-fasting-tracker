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
      return 20;
  }
}

/** Hour (0–23) when the daily fast typically starts = last meal ends. */
export function getPlannedFastStartHour(profile: UserProfile | null | undefined): number {
  if (!profile) return 20;
  return lastMealTimeToHour(profile.lastMealTime ?? null);
}

/** Clock hour (0–23) when the fast ends, given same-day start hour and fast length. */
export function getPlannedFastEndHour(startHour: number, fastHours: number): number {
  return (startHour + fastHours) % 24;
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
  const startH = getPlannedFastStartHour(profile);
  const beforeStartH = getReminderHourBeforeFastStart(startH);
  const beforeEndH = getReminderHourBeforeFastEnd(startH, plan.fastHours);
  const weeklyDaysNote =
    isWeeklyPlanTemplateId(plan.planTemplateId) && plan.weeklyFastDays?.length
      ? `Fasting days: ${formatWeeklyFastDaysShort(plan.weeklyFastDays)}`
      : isWeeklyPlanTemplateId(plan.planTemplateId)
        ? 'Pick fasting days in plan settings'
        : undefined;
  return {
    fastLabel: plan.fastLabel,
    beforeStartLabel: formatReminderTimeLabel(beforeStartH),
    beforeEndLabel: formatReminderTimeLabel(beforeEndH),
    ...(weeklyDaysNote ? { weeklyDaysNote } : {}),
  };
}

export type PlanScheduleInput = {
  lastMealHour: number;
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
    lastMealHour: getPlannedFastStartHour(profile),
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
