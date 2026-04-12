/**
 * Journey / Calendar domain: streakDay, fast classification, extended credits, streak rules.
 * All times use local timezone of the Date methods passed via `now` anchor where needed.
 */

import type { FastRecord } from '@/types/fasting';
import type { UserPlan } from '@/types/user';

export type JourneyFastType = 'completed' | 'partial' | 'missed' | 'active';
export type BubbleKind = 'completed' | 'partial' | 'missed' | 'active';

export interface JourneyCredit {
  /** Majority-hours local day (streak + Rule 1). */
  streakDayKey: string;
  /** Calendar grid + Journey bar chart: single-segment fasts use fast **end** local day. */
  calendarDayKey: string;
  kind: 'completed' | 'partial';
  /** Hours label for bubble e.g. 16, 24, 36 */
  bubbleHoursLabel: string;
  /** Underlying fast */
  fastId: string;
  durationHours: number;
  planLabel: string;
  planTargetHours: number;
}

const MS_HOUR = 3600000;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Local calendar key YYYY-MM-DD */
export function localDayKeyFromMs(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Hours of fast falling on each local calendar day */
export function hoursPerLocalDay(startMs: number, endMs: number): Map<string, number> {
  const map = new Map<string, number>();
  let t = startMs;
  while (t < endMs) {
    const d = new Date(t);
    const dayKey = localDayKeyFromMs(t);
    const nextMid = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0).getTime();
    const chunkEnd = Math.min(endMs, nextMid);
    const h = (chunkEnd - t) / MS_HOUR;
    map.set(dayKey, (map.get(dayKey) ?? 0) + h);
    t = chunkEnd;
  }
  return map;
}

/** Rule 1: majority hours; tie → later calendar day */
export function computeStreakDayKey(startMs: number, endMs: number): string {
  const per = hoursPerLocalDay(startMs, endMs);
  let bestDay = '';
  let bestH = -1;
  for (const [day, h] of per) {
    if (h > bestH) {
      bestH = h;
      bestDay = day;
    } else if (h === bestH && day > bestDay) {
      bestDay = day;
    }
  }
  return bestDay;
}

export function recordIsWeekly52(r: FastRecord): boolean {
  const t = String(r.type);
  return t === 'if_5_2' || t === 'if_4_3' || r.label === '5:2' || r.label === '4:3';
}

export function planIsWeekly52(plan: UserPlan | null | undefined): boolean {
  const id = plan?.planTemplateId;
  return id === 'if_5_2' || id === 'if_4_3';
}

/** Target fast length in hours from stored targetDuration (ms) */
export function planTargetHoursFromRecord(r: FastRecord): number {
  return Math.max(0.5, r.targetDuration / MS_HOUR);
}

export function planLabelFromRecord(r: FastRecord): string {
  if (r.label && /^\d+:\d+$/.test(r.label)) return r.label;
  const m = String(r.type).match(/^if_(\d+)_(\d+)$/);
  if (m) return `${m[1]}:${m[2]}`;
  return r.label || '—';
}

/** Min hours to count as partial / qualifying */
export function minPartialHours(isWeekly52: boolean): number {
  return isWeekly52 ? 16 : 12;
}

/**
 * Grace: end within 1h after planned end still eligible for "met target" path.
 * completed if duration >= target OR (end within grace and duration >= target * 0.99) — use strict:
 * completed when actual duration >= planTargetHours OR (endTime <= start + target + 1h AND recorded completed from app with duration >= 0.8*target)
 */
export function classifyEndedFast(r: FastRecord): 'completed' | 'partial' | 'none' {
  if (r.endTime === null) return 'none';
  const start = r.startTime;
  const end = r.endTime;
  const durMs = end - start;
  const durH = durMs / MS_HOUR;
  const targetMs = r.targetDuration;
  const targetH = targetMs / MS_HOUR;
  const targetEnd = start + targetMs;
  const withinGraceEnd = end <= targetEnd + MS_HOUR;
  const weekly = recordIsWeekly52(r);
  const minP = minPartialHours(weekly);

  const meetsDurationTarget = durMs >= targetMs - 1e-6;
  const meetsGraceCompletion = withinGraceEnd && r.completed && durMs >= targetMs * 0.8;

  if (meetsDurationTarget || meetsGraceCompletion) {
    return 'completed';
  }
  if (durH >= minP && durH < targetH) {
    return 'partial';
  }
  return 'none';
}

function roundHoursLabel(h: number): string {
  const rounded = Math.round(h);
  return `${rounded}h`;
}

/** Rule 2 + remainder: expand one ended fast into JourneyCredit[] */
export function creditsFromEndedFast(r: FastRecord): JourneyCredit[] {
  if (r.endTime === null) return [];
  const cls = classifyEndedFast(r);
  if (cls === 'none') return [];

  const start = r.startTime;
  const end = r.endTime;
  const durH = (end - start) / MS_HOUR;
  const targetH = planTargetHoursFromRecord(r);
  const planLabel = planLabelFromRecord(r);
  const weekly = recordIsWeekly52(r);
  const credits: JourneyCredit[] = [];

  if (durH >= 36) {
    const fullBlocks = Math.floor(durH / 24);
    let cursor = start;
    for (let i = 0; i < fullBlocks; i++) {
      const segEnd = cursor + 24 * MS_HOUR;
      const dayKey = localDayKeyFromMs(segEnd - 1);
      credits.push({
        streakDayKey: dayKey,
        calendarDayKey: dayKey,
        kind: cls === 'completed' ? 'completed' : 'partial',
        bubbleHoursLabel: '24h',
        fastId: r.id,
        durationHours: 24,
        planLabel,
        planTargetHours: targetH,
      });
      cursor = segEnd;
    }
    if (end > cursor + 1e-6) {
      const remH = (end - cursor) / MS_HOUR;
      const minP = minPartialHours(weekly);
      if (remH >= minP) {
        credits.push({
          streakDayKey: computeStreakDayKey(cursor, end),
          calendarDayKey: localDayKeyFromMs(end),
          kind: cls,
          bubbleHoursLabel: roundHoursLabel(remH),
          fastId: r.id,
          durationHours: remH,
          planLabel,
          planTargetHours: targetH,
        });
      }
    }
    if (credits.length === 0) {
      credits.push({
        streakDayKey: computeStreakDayKey(start, end),
        calendarDayKey: localDayKeyFromMs(end),
        kind: cls,
        bubbleHoursLabel: roundHoursLabel(durH),
        fastId: r.id,
        durationHours: durH,
        planLabel,
        planTargetHours: targetH,
      });
    }
  } else {
    credits.push({
      streakDayKey: computeStreakDayKey(start, end),
      calendarDayKey: localDayKeyFromMs(end),
      kind: cls,
      bubbleHoursLabel: roundHoursLabel(durH),
      fastId: r.id,
      durationHours: durH,
      planLabel,
      planTargetHours: targetH,
    });
  }

  return credits;
}

/** All qualifying calendar days (partial or completed credit) */
export function qualifyingDateKeysFromRecords(records: FastRecord[]): Set<string> {
  const s = new Set<string>();
  for (const r of records) {
    if (r.endTime === null) continue;
    for (const c of creditsFromEndedFast(r)) {
      if (c.kind === 'completed' || c.kind === 'partial') s.add(c.streakDayKey);
    }
  }
  return s;
}

/**
 * Current streak: count qualifying days walking backward from today.
 * Rule 4: one calendar day without a qualifying fast does not break; two consecutive gap days break.
 */
export function computeJourneyStreak(records: FastRecord[], nowMs: number = Date.now()): number {
  const Q = qualifyingDateKeysFromRecords(records);
  let streak = 0;
  let gaps = 0;
  for (let offset = 0; offset < 730; offset++) {
    const d = new Date(nowMs);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - offset);
    const key = localDayKeyFromMs(d.getTime());
    if (Q.has(key)) {
      streak++;
      gaps = 0;
    } else {
      gaps++;
      if (gaps >= 2) break;
    }
  }
  return streak;
}

export interface MonthSummary {
  completedFasts: number;
  streak: number;
  avgFastHoursRounded: number;
  bestHoursRounded: number;
  vsPrevMonthCompleted: 'up' | 'down' | 'same' | null;
  bestIsPersonalRecord: boolean;
}

function parseDayKey(key: string): { y: number; m: number; d: number } {
  const [y, m, d] = key.split('-').map(Number);
  return { y, m: m - 1, d };
}

export function dayKeyInMonth(key: string, year: number, month0: number): boolean {
  const { y, m } = parseDayKey(key);
  return y === year && m === month0;
}

export function computeMonthSummary(
  records: FastRecord[],
  year: number,
  month0: number,
  nowMs: number = Date.now(),
): MonthSummary {
  const creditsInMonth = (): JourneyCredit[] => {
    const out: JourneyCredit[] = [];
    for (const r of records) {
      if (r.endTime === null) continue;
      for (const c of creditsFromEndedFast(r)) {
        if (dayKeyInMonth(c.calendarDayKey, year, month0)) out.push(c);
      }
    }
    return out;
  };

  const credits = creditsInMonth();
  const completedFasts = records.filter(r => {
    if (r.endTime === null) return false;
    if (classifyEndedFast(r) !== 'completed') return false;
    return creditsFromEndedFast(r).some(
      c => c.kind === 'completed' && dayKeyInMonth(c.calendarDayKey, year, month0),
    );
  }).length;

  const completedRecordsInMonth = records.filter(r => {
    if (r.endTime === null) return false;
    if (classifyEndedFast(r) !== 'completed') return false;
    const k = localDayKeyFromMs(r.endTime);
    return dayKeyInMonth(k, year, month0);
  });

  const avgFastHoursRounded =
    completedRecordsInMonth.length === 0
      ? 0
      : Math.round(
          completedRecordsInMonth.reduce((s, r) => s + (r.endTime! - r.startTime) / MS_HOUR, 0) /
            completedRecordsInMonth.length,
        );

  const bestHoursRounded =
    completedRecordsInMonth.length === 0
      ? 0
      : Math.round(
          Math.max(...completedRecordsInMonth.map(r => (r.endTime! - r.startTime) / MS_HOUR)),
        );

  const prevMonth = month0 === 0 ? { y: year - 1, m: 11 } : { y: year, m: month0 - 1 };
  const prevCredits = (() => {
    const out: JourneyCredit[] = [];
    for (const r of records) {
      if (r.endTime === null) continue;
      for (const c of creditsFromEndedFast(r)) {
        if (dayKeyInMonth(c.calendarDayKey, prevMonth.y, prevMonth.m)) out.push(c);
      }
    }
    return out;
  })();
  const prevCompleted = prevCredits.filter(c => c.kind === 'completed').length;
  let vsPrevMonthCompleted: 'up' | 'down' | 'same' | null = null;
  if (prevCredits.length > 0 || completedFasts > 0) {
    if (completedFasts > prevCompleted) vsPrevMonthCompleted = 'up';
    else if (completedFasts < prevCompleted) vsPrevMonthCompleted = 'down';
    else vsPrevMonthCompleted = 'same';
  }

  const hrs = records
    .filter(r => r.endTime !== null && classifyEndedFast(r) === 'completed')
    .map(r => (r.endTime! - r.startTime) / MS_HOUR);
  const allTimeBest = hrs.length ? Math.round(Math.max(...hrs)) : 0;
  const bestIsPersonalRecord = bestHoursRounded > 0 && bestHoursRounded >= allTimeBest;

  return {
    completedFasts,
    streak: computeJourneyStreak(records, nowMs),
    avgFastHoursRounded,
    bestHoursRounded,
    vsPrevMonthCompleted,
    bestIsPersonalRecord,
  };
}

/** Map calendar day -> credits (ended fasts); active fast handled separately in UI */
export function creditsByDayKey(records: FastRecord[]): Map<string, JourneyCredit[]> {
  const m = new Map<string, JourneyCredit[]>();
  for (const r of records) {
    if (r.endTime === null) continue;
    for (const c of creditsFromEndedFast(r)) {
      const arr = m.get(c.calendarDayKey) ?? [];
      arr.push(c);
      m.set(c.calendarDayKey, arr);
    }
  }
  return m;
}

export interface DayCellModel {
  dayKey: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  bubble: {
    kind: BubbleKind;
    label: string;
  } | null;
  primaryFastId: string | null;
}

export interface JourneyDayDrawer {
  dateLabel: string;
  badge: 'completed' | 'partial' | 'rest';
  durationLine: string;
  planLine: string;
  targetSub: string;
  sublineGoal: string;
  showGrid: boolean;
  fastId: string | null;
}

export function buildDayDrawerForDay(
  dayKey: string,
  credits: JourneyCredit[],
  recordsById: Map<string, FastRecord>,
): JourneyDayDrawer {
  const { y, m, d } = parseDayKey(dayKey);
  const anchorDate = new Date(y, m, d, 12, 0, 0, 0);
  const headerFmt = anchorDate.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  const primary = credits[0];
  if (!primary) {
    return {
      dateLabel: headerFmt,
      badge: 'rest',
      durationLine: '',
      planLine: '',
      targetSub: '',
      sublineGoal: 'Rest day',
      showGrid: false,
      fastId: null,
    };
  }
  const r = recordsById.get(primary.fastId);
  if (!r || r.endTime === null) {
    return {
      dateLabel: headerFmt,
      badge: 'rest',
      durationLine: '',
      planLine: '',
      targetSub: '',
      sublineGoal: 'Rest day',
      showGrid: false,
      fastId: null,
    };
  }
  const durH = (r.endTime - r.startTime) / MS_HOUR;
  const h = Math.floor(durH);
  const mi = Math.round((durH - h) * 60);
  const durationLine = mi > 0 ? `${h}h ${mi}m` : `${h}h`;
  const targetH = primary.planTargetHours;
  const cls = classifyEndedFast(r);
  const badge: 'completed' | 'partial' | 'rest' =
    cls === 'completed' ? 'completed' : cls === 'partial' ? 'partial' : 'rest';
  const sublineGoal =
    cls === 'completed' ? '✓ Goal met' : cls === 'partial' ? '⚡ Below target' : 'Rest day';
  return {
    dateLabel: headerFmt,
    badge,
    durationLine,
    planLine: primary.planLabel,
    targetSub: `${Math.round(targetH)}h target`,
    sublineGoal,
    showGrid: cls === 'completed' || cls === 'partial',
    fastId: r.id,
  };
}