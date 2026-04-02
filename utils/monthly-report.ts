// utils/monthly-report.ts
// Aggregates all user data for a given month into a structured report object.
// Used by the PDF report generator and the report preview card.
//
// Data sources:
//   - Fasting records (FastingContext / AsyncStorage)
//   - Weight logs (AsyncStorage 'aayu_weight_log')
//   - Daily summaries (AsyncStorage per-day keys for water + steps)
//   - User profile (plan, body metrics)
//   - Metabolic score calculator

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FastRecord } from '@/types/fasting';
import type { UserProfile } from '@/types/user';
import {
  calculateMetabolicScore,
  getScoreLevel,
  MetabolicScoreBreakdown,
} from '@/utils/metabolic-score';
import {
  getAutophagyScore,
  calculateFatBurned,
  AUTOPHAGY_THRESHOLD_HOURS,
} from '@/utils/analytics-helpers';
import { calcBMI, getBMICategory, getAge } from '@/utils/calculatePlan';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MonthlyReportData {
  // Meta
  month: number;           // 0-11
  year: number;
  monthLabel: string;      // "March 2026"
  userName: string;
  planLabel: string;       // "16:8 IF"
  monthNumber: number;     // "Month 3 with Aayu" — months since createdAt
  isBaseline: boolean;     // true for month 1 — changes report framing
  generatedAt: number;     // ms timestamp

  // Fasting
  totalFasts: number;
  completedFasts: number;
  completionRate: number;  // 0-100
  totalFastingHours: number;
  avgFastDuration: number; // hours
  longestFast: number;     // hours
  deepFasts16h: number;    // count of 16h+ fasts
  bestStreak: number;      // longest consecutive days in the month

  // Weekly breakdown (4-5 entries, one per week)
  weeklyBreakdown: { week: number; fasts: number; hours: number }[];

  // Daily heatmap: array of 28-31 entries, one per day of month
  dailyHeatmap: { date: string; fasted: boolean; hours: number }[];

  // Metabolic Score
  metabolicScore: number;  // 0-100
  metabolicLabel: string;
  durationGrade: string;
  consistencyPct: number;
  circadianPct: number;
  deepFastCount: number;

  // Score breakdown (raw component scores for comparison)
  scoreBreakdown: {
    duration: number;       // 0-30
    consistency: number;    // 0-25
    circadian: number;      // 0-20
    deepFast: number;       // 0-25
  };

  // Projected next month score (conservative estimate)
  projectedScore: number | null;

  // Timing intelligence
  timing: {
    mostCommonStartHour: string | null;     // "7:05 PM"
    mostCommonBreakHour: string | null;     // "11:20 AM"
    overnightAlignmentPct: number;          // 0-100
    bestWindow: string | null;              // "7 PM → 11 AM"
  };

  // Behaviour intelligence (month 2+)
  behaviour: {
    weekdayAdherencePct: number;  // Mon-Thu adherence %
    weekendDropPct: number;       // Fri-Sun drop-off %
    recoveryRate: number;         // % of times user resumed after missed day
    bestDays: string[];           // e.g. ["Mon", "Tue", "Thu"]
  } | null;

  // Body
  weightStart: number | null;
  weightEnd: number | null;
  weightChange: number | null;
  weightLogs: { date: string; kg: number }[];
  bmiStart: number | null;
  bmiEnd: number | null;
  heightCm: number | null;

  // Daily averages
  avgWaterMl: number;
  avgSteps: number;
  waterTarget: number;
  stepsTarget: number;
  waterDaysOnTarget: number;
  stepsDaysOnTarget: number;
  hasWaterData: boolean;    // false → show "not available" instead of 0
  hasStepsData: boolean;    // false → show "not available" instead of 0

  // Health estimates
  fatBurnedGrams: number;
  autophagyHours: number;
  insulinSensitivity: number;

  // Baseline comparison (always compared to month 1, null if IS month 1)
  baseline: {
    metabolicScore: number;
    totalFasts: number;
    avgFastDuration: number;
    completionRate: number;
    bestStreak: number;
    weightEnd: number | null;
    scoreBreakdown: {
      duration: number;
      consistency: number;
      circadian: number;
      deepFast: number;
    };
  } | null;

  // Previous month comparison (null if first month)
  prevMonth: {
    metabolicScore: number;
    totalFasts: number;
    avgFastDuration: number;
    weightEnd: number | null;
    avgWaterMl: number;
    avgSteps: number;
    completionRate: number;
    bestStreak: number;
  } | null;

  // Since inception (null if first month)
  sinceStart: {
    totalMonths: number;
    totalFasts: number;
    totalHours: number;
    weightStart: number | null;
    weightNow: number | null;
    totalWeightLost: number | null;
  } | null;

  // Insights (personalised text)
  insights: string[];
  dataGaps: string[];         // e.g. ["Hydration data not available", "Steps not synced"]
  recommendation: string;

  // Next month targets (actionable)
  nextMonthTargets: {
    targetFasts: number;       // e.g. 12
    targetLongFast: string;    // e.g. "1 weekly 20h+ fast"
    focusArea: string;         // e.g. "Timing — restore overnight rhythm"
    retentionHook: string;     // e.g. "Fix weekend drop-off"
  };
}

export interface ReportAvailability {
  available: boolean;
  reason?: string;
  month?: number;
  year?: number;
  monthLabel?: string;
  lastGeneratedAt?: number;  // null if never generated for this month
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function monthLabel(month: number, year: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function daysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthStart(month: number, year: number): number {
  return new Date(year, month, 1).getTime();
}

function monthEnd(month: number, year: number): number {
  return new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
}

// ─── Check if report is available ─────────────────────────────────────────────

const REPORT_GEN_KEY_PREFIX = 'aayu_report_gen_';

export function getReportAvailability(
  profile: UserProfile | null,
  completedRecords: FastRecord[],
): ReportAvailability {
  const now = new Date();
  // Report is for the PREVIOUS month
  const reportMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const reportYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  if (!profile) {
    return { available: false, reason: 'Set up your profile to generate reports.' };
  }

  // Check if there are any fasts in the report month
  const start = monthStart(reportMonth, reportYear);
  const end = monthEnd(reportMonth, reportYear);
  const monthFasts = completedRecords.filter(r => {
    const t = r.endTime ?? r.startTime;
    return t >= start && t <= end && r.completed;
  });

  if (monthFasts.length < 3) {
    return {
      available: false,
      reason: `You need at least 3 completed fasts in ${monthLabel(reportMonth, reportYear)} to generate a report. You had ${monthFasts.length}.`,
      month: reportMonth,
      year: reportYear,
      monthLabel: monthLabel(reportMonth, reportYear),
    };
  }

  return {
    available: true,
    month: reportMonth,
    year: reportYear,
    monthLabel: monthLabel(reportMonth, reportYear),
  };
}

/** Check if report was already generated this month (free users: once per month) */
export async function wasReportGeneratedThisMonth(month: number, year: number): Promise<boolean> {
  try {
    const key = `${REPORT_GEN_KEY_PREFIX}${year}_${month}`;
    const val = await AsyncStorage.getItem(key);
    return val !== null;
  } catch { return false; }
}

export async function markReportGenerated(month: number, year: number): Promise<void> {
  try {
    const key = `${REPORT_GEN_KEY_PREFIX}${year}_${month}`;
    await AsyncStorage.setItem(key, String(Date.now()));
  } catch {}
}

// ─── Load weight logs for a month ─────────────────────────────────────────────

interface WeightEntry {
  id: string;
  kg: number;
  date: string;
  time: number;
}

async function loadWeightLogs(): Promise<WeightEntry[]> {
  try {
    const raw = await AsyncStorage.getItem('aayu_weight_log');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ─── Load daily water + steps for a month ─────────────────────────────────────

async function loadDailySummariesForMonth(month: number, year: number): Promise<{
  waterByDay: Map<string, number>;
  stepsByDay: Map<string, number>;
}> {
  const days = daysInMonth(month, year);
  const waterByDay = new Map<string, number>();
  const stepsByDay = new Map<string, number>();

  for (let day = 1; day <= days; day++) {
    const d = new Date(year, month, day);
    const ds = dateStr(d);

    // Water
    const waterKey = `aayu_water_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
    try {
      const raw = await AsyncStorage.getItem(waterKey);
      if (raw) {
        const entries: { ml: number }[] = JSON.parse(raw);
        waterByDay.set(ds, entries.reduce((s, e) => s + e.ml, 0));
      }
    } catch {}

    // Steps
    const stepsKey = `aayu_steps_day_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
    const stepsManualKey = `aayu_steps_manual_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
    try {
      const raw = await AsyncStorage.getItem(stepsKey);
      if (raw) {
        stepsByDay.set(ds, parseInt(raw, 10) || 0);
      } else {
        const manual = await AsyncStorage.getItem(stepsManualKey);
        if (manual) stepsByDay.set(ds, parseInt(manual, 10) || 0);
      }
    } catch {}
  }

  return { waterByDay, stepsByDay };
}

// ─── Compute best streak within a month ───────────────────────────────────────

function computeBestStreak(dailyHeatmap: { fasted: boolean }[]): number {
  let best = 0, current = 0;
  for (const day of dailyHeatmap) {
    if (day.fasted) { current++; best = Math.max(best, current); }
    else { current = 0; }
  }
  return best;
}

// ─── Generate personalised insights ───────────────────────────────────────────

function generateInsights(data: Partial<MonthlyReportData>): string[] {
  const insights: string[] = [];

  if (data.completionRate && data.completionRate >= 90) {
    insights.push(`Exceptional consistency — you completed ${data.completionRate}% of your fasts this month.`);
  } else if (data.completionRate && data.completionRate >= 70) {
    insights.push(`Solid consistency at ${data.completionRate}%. Aim for 90%+ next month to maximise metabolic benefits.`);
  }

  if (data.avgFastDuration && data.avgFastDuration >= 17) {
    insights.push(`Your average fast of ${data.avgFastDuration.toFixed(1)}h consistently hits the deep autophagy zone.`);
  }

  if (data.deepFasts16h && data.deepFasts16h >= 15) {
    insights.push(`${data.deepFasts16h} deep fasts (16h+) this month — your cells are getting serious renewal time.`);
  }

  if (data.weightChange && data.weightChange > 0) {
    insights.push(`You lost ${data.weightChange.toFixed(1)}kg this month — steady, sustainable progress.`);
  }

  if (data.circadianPct && data.circadianPct >= 80) {
    insights.push(`${data.circadianPct}% circadian alignment — your fasting is well-timed with your sleep cycle.`);
  }

  if (data.waterDaysOnTarget && data.waterTarget && data.waterDaysOnTarget >= 20) {
    insights.push(`You hit your water target on ${data.waterDaysOnTarget} days — great hydration discipline.`);
  }

  if (data.bestStreak && data.bestStreak >= 7) {
    insights.push(`Your best streak was ${data.bestStreak} consecutive days of fasting.`);
  }

  // Cap at 5 insights
  return insights.slice(0, 5);
}

function generateRecommendation(data: Partial<MonthlyReportData>): string {
  if (data.avgFastDuration && data.avgFastDuration < 14) {
    return 'Try gradually extending your fasting window by 30 minutes each week. Moving from 12h to 14h unlocks significant metabolic benefits.';
  }
  if (data.completionRate && data.completionRate < 60) {
    return 'Focus on consistency over duration. It\'s better to complete a 12h fast every day than to attempt 18h and break early. Build the habit first.';
  }
  if (data.avgFastDuration && data.avgFastDuration >= 16 && data.completionRate && data.completionRate >= 80) {
    return 'You\'re in a great rhythm. Consider trying one 20h+ fast per week to deepen autophagy, or focus on circadian alignment by eating earlier in the day.';
  }
  if (data.circadianPct && data.circadianPct < 50) {
    return 'Your fasting window could be better aligned with your sleep. Try starting your fast by 8pm and breaking it after 10am for maximum circadian benefit.';
  }
  return 'Keep going — consistency is the most powerful factor in intermittent fasting. Every completed fast is building your metabolic health.';
}

// ─── Main report generator ────────────────────────────────────────────────────

export async function generateMonthlyReport(
  month: number,
  year: number,
  profile: UserProfile,
  allCompletedRecords: FastRecord[],
): Promise<MonthlyReportData> {
  const start = monthStart(month, year);
  const end = monthEnd(month, year);
  const days = daysInMonth(month, year);

  // ── Filter records for this month ─────────────────────────────────────────
  const monthRecords = allCompletedRecords.filter(r => {
    const t = r.endTime ?? r.startTime;
    return t >= start && t <= end;
  });
  const completedMonthRecords = monthRecords.filter(r => r.completed);

  // ── Fasting stats ─────────────────────────────────────────────────────────
  const totalFasts = monthRecords.length;
  const completedFasts = completedMonthRecords.length;
  const completionRate = totalFasts > 0 ? Math.round((completedFasts / totalFasts) * 100) : 0;

  const durations = completedMonthRecords.map(r => ((r.endTime ?? 0) - r.startTime) / 3600000);
  const totalFastingHours = durations.reduce((s, h) => s + h, 0);
  const avgFastDuration = durations.length > 0 ? totalFastingHours / durations.length : 0;
  const longestFast = durations.length > 0 ? Math.max(...durations) : 0;
  const deepFasts16h = durations.filter(h => h >= 16).length;

  // ── Daily heatmap ─────────────────────────────────────────────────────────
  const dailyHeatmap: MonthlyReportData['dailyHeatmap'] = [];
  for (let day = 1; day <= days; day++) {
    const d = new Date(year, month, day);
    const ds = dateStr(d);
    const dayStart = d.getTime();
    const dayEnd = new Date(year, month, day, 23, 59, 59, 999).getTime();

    // Find fasts that overlap with this day
    const dayFasts = completedMonthRecords.filter(r => {
      const fStart = r.startTime;
      const fEnd = r.endTime ?? 0;
      return fStart <= dayEnd && fEnd >= dayStart;
    });

    const dayHours = dayFasts.reduce((s, r) => {
      const overlap = Math.min(r.endTime ?? 0, dayEnd) - Math.max(r.startTime, dayStart);
      return s + Math.max(0, overlap / 3600000);
    }, 0);

    dailyHeatmap.push({ date: ds, fasted: dayFasts.length > 0, hours: Math.round(dayHours * 10) / 10 });
  }

  const bestStreak = computeBestStreak(dailyHeatmap);

  // ── Metabolic Score ───────────────────────────────────────────────────────
  const targetFastHours = profile.plan?.fastHours ?? 16;
  const mScore = calculateMetabolicScore({
    completedRecords: allCompletedRecords,
    thisWeekRecords: completedMonthRecords,
    lastWeekRecords: [],
    streak: bestStreak,
    targetFastHours,
    targetFastsPerWeek: 5,
    periodDays: days,
  });

  // ── Weight ────────────────────────────────────────────────────────────────
  const allWeightLogs = await loadWeightLogs();
  const monthWeightLogs = allWeightLogs
    .filter(w => w.time >= start && w.time <= end)
    .sort((a, b) => a.time - b.time);

  const weightStart = monthWeightLogs.length > 0 ? monthWeightLogs[0].kg : null;
  const weightEnd = monthWeightLogs.length > 0 ? monthWeightLogs[monthWeightLogs.length - 1].kg : null;
  const weightChange = (weightStart !== null && weightEnd !== null) ? weightStart - weightEnd : null;

  const heightCm = profile.heightCm ?? null;
  const bmiStart = (weightStart && heightCm) ? calcBMI(weightStart, heightCm) : null;
  const bmiEnd = (weightEnd && heightCm) ? calcBMI(weightEnd, heightCm) : null;

  // ── Water + Steps ─────────────────────────────────────────────────────────
  const { waterByDay, stepsByDay } = await loadDailySummariesForMonth(month, year);
  const waterValues = Array.from(waterByDay.values());
  const stepsValues = Array.from(stepsByDay.values());
  const waterTarget = profile.plan?.dailyWaterMl ?? 2500;
  const stepsTarget = profile.plan?.dailySteps ?? 8000;
  const avgWaterMl = waterValues.length > 0 ? Math.round(waterValues.reduce((s, v) => s + v, 0) / waterValues.length) : 0;
  const avgSteps = stepsValues.length > 0 ? Math.round(stepsValues.reduce((s, v) => s + v, 0) / stepsValues.length) : 0;
  const waterDaysOnTarget = waterValues.filter(v => v >= waterTarget).length;
  const stepsDaysOnTarget = stepsValues.filter(v => v >= stepsTarget).length;

  // ── Health estimates ──────────────────────────────────────────────────────
  const fatBurnedGrams = completedMonthRecords.reduce((s, r) => {
    const h = ((r.endTime ?? 0) - r.startTime) / 3600000;
    return s + calculateFatBurned(h);
  }, 0);

  let autophagyHours = 0;
  completedMonthRecords.forEach(r => {
    const h = ((r.endTime ?? 0) - r.startTime) / 3600000;
    if (h > AUTOPHAGY_THRESHOLD_HOURS) autophagyHours += h - AUTOPHAGY_THRESHOLD_HOURS;
  });

  const age = getAge(profile);
  const insulinSensitivity = Math.min(100, Math.round(
    Math.min(35, (avgFastDuration / 16) * 35) +
    Math.min(25, (bestStreak / 30) * 25) +
    (completionRate / 100) * 30 +
    Math.min(10, (completedFasts / 50) * 10)
  ));

  // ── Month-over-month ──────────────────────────────────────────────────────
  const prevM = month === 0 ? 11 : month - 1;
  const prevY = month === 0 ? year - 1 : year;
  const prevStart = monthStart(prevM, prevY);
  const prevEnd = monthEnd(prevM, prevY);
  const prevRecords = allCompletedRecords.filter(r => {
    const t = r.endTime ?? r.startTime;
    return t >= prevStart && t <= prevEnd && r.completed;
  });

  let prevMonth: MonthlyReportData['prevMonth'] = null;
  if (prevRecords.length >= 1) {
    const prevDurations = prevRecords.map(r => ((r.endTime ?? 0) - r.startTime) / 3600000);
    const prevWeights = allWeightLogs.filter(w => w.time >= prevStart && w.time <= prevEnd).sort((a, b) => a.time - b.time);
    const prevMScore = calculateMetabolicScore({
      completedRecords: allCompletedRecords,
      thisWeekRecords: prevRecords,
      lastWeekRecords: [],
      streak: 0,
      targetFastHours,
      targetFastsPerWeek: 5,
      periodDays: daysInMonth(prevM, prevY),
    });

    // Previous month water/steps averages
    const { waterByDay: prevWater, stepsByDay: prevSteps } = await loadDailySummariesForMonth(prevM, prevY);
    const prevWaterVals = Array.from(prevWater.values());
    const prevStepsVals = Array.from(prevSteps.values());

    // Compute prev month best streak for comparison
    const prevHeatmap: { fasted: boolean }[] = [];
    const prevDaysCount = daysInMonth(prevM, prevY);
    for (let day = 1; day <= prevDaysCount; day++) {
      const d = new Date(prevY, prevM, day);
      const dStart = d.getTime();
      const dEnd = new Date(prevY, prevM, day, 23, 59, 59, 999).getTime();
      prevHeatmap.push({ fasted: prevRecords.some(r => r.startTime <= dEnd && (r.endTime ?? 0) >= dStart) });
    }
    const prevBestStreak = computeBestStreak(prevHeatmap);

    prevMonth = {
      metabolicScore: prevMScore.total,
      totalFasts: prevRecords.length,
      avgFastDuration: prevDurations.length > 0 ? prevDurations.reduce((s, h) => s + h, 0) / prevDurations.length : 0,
      weightEnd: prevWeights.length > 0 ? prevWeights[prevWeights.length - 1].kg : null,
      avgWaterMl: prevWaterVals.length > 0 ? Math.round(prevWaterVals.reduce((s, v) => s + v, 0) / prevWaterVals.length) : 0,
      avgSteps: prevStepsVals.length > 0 ? Math.round(prevStepsVals.reduce((s, v) => s + v, 0) / prevStepsVals.length) : 0,
      completionRate: prevRecords.length > 0 ? Math.round((prevRecords.filter(r => r.completed).length / prevRecords.length) * 100) : 0,
      bestStreak: prevBestStreak,
    };
  }

  // ── Since inception ───────────────────────────────────────────────────────
  const createdAt = profile.createdAt ?? Date.now();
  const monthsSinceStart = Math.max(1, Math.ceil((end - createdAt) / (30 * 86400000)));
  const allTimeCompleted = allCompletedRecords.filter(r => r.completed);
  const allTimeDurations = allTimeCompleted.map(r => ((r.endTime ?? 0) - r.startTime) / 3600000);
  const firstWeight = profile.startingWeightKg ?? (allWeightLogs.length > 0 ? allWeightLogs[allWeightLogs.length - 1].kg : null);

  let sinceStart: MonthlyReportData['sinceStart'] = null;
  if (monthsSinceStart > 1) {
    sinceStart = {
      totalMonths: monthsSinceStart,
      totalFasts: allTimeCompleted.length,
      totalHours: Math.round(allTimeDurations.reduce((s, h) => s + h, 0)),
      weightStart: firstWeight,
      weightNow: weightEnd ?? profile.currentWeightKg ?? null,
      totalWeightLost: (firstWeight && weightEnd) ? Math.max(0, firstWeight - weightEnd) : null,
    };
  }

  // ── Month number ──────────────────────────────────────────────────────────
  const monthNumber = monthsSinceStart;

  // ── New computed fields ────────────────────────────────────────────────────
  const isBaseline = monthNumber === 1;
  const weeklyBreakdown: MonthlyReportData['weeklyBreakdown'] = [];
  for (let w = 0; w < Math.ceil(dailyHeatmap.length / 7); w++) {
    const slice = dailyHeatmap.slice(w * 7, (w + 1) * 7);
    weeklyBreakdown.push({ week: w + 1, fasts: slice.filter(d => d.fasted).length, hours: Math.round(slice.reduce((s, d) => s + d.hours, 0) * 10) / 10 });
  }

  const scoreBreakdown = {
    duration: mScore.duration,
    consistency: mScore.consistency,
    circadian: mScore.circadian,
    deepFast: mScore.deepFasts,
  };

  // Projected score (conservative)
  const projectedScore = completedFasts >= 3
    ? Math.min(100, Math.round(mScore.total + (mScore.consistencyPct < 60 ? 8 : mScore.consistencyPct < 80 ? 5 : 2) * (mScore.total >= 85 ? 0.4 : mScore.total >= 70 ? 0.7 : 1.0)))
    : null;

  // Timing intelligence
  const timing: MonthlyReportData['timing'] = (() => {
    if (completedMonthRecords.length === 0) return { mostCommonStartHour: null, mostCommonBreakHour: null, overnightAlignmentPct: 0, bestWindow: null };
    const startHours: number[] = [];
    const endHours: number[] = [];
    let overnightCount = 0;
    completedMonthRecords.forEach(r => {
      const sH = new Date(r.startTime).getHours() + new Date(r.startTime).getMinutes() / 60;
      startHours.push(sH);
      if (r.endTime) {
        const eH = new Date(r.endTime).getHours() + new Date(r.endTime).getMinutes() / 60;
        endHours.push(eH);
        if (new Date(r.startTime).getHours() >= 18 && new Date(r.endTime).getHours() >= 6 && new Date(r.endTime).getHours() <= 14) overnightCount++;
      }
    });
    const fmtHr = (h: number) => { const hr = Math.floor(h); const m = Math.round((h - hr) * 60); const p = hr >= 12 ? 'PM' : 'AM'; return `${hr > 12 ? hr - 12 : hr === 0 ? 12 : hr}:${String(m).padStart(2, '0')} ${p}`; };
    const avgS = startHours.reduce((a, b) => a + b, 0) / startHours.length;
    const avgE = endHours.length > 0 ? endHours.reduce((a, b) => a + b, 0) / endHours.length : 0;
    return {
      mostCommonStartHour: fmtHr(avgS),
      mostCommonBreakHour: endHours.length > 0 ? fmtHr(avgE) : null,
      overnightAlignmentPct: Math.round((overnightCount / completedMonthRecords.length) * 100),
      bestWindow: endHours.length > 0 ? `${fmtHr(avgS)} \u2192 ${fmtHr(avgE)}` : null,
    };
  })();

  // Behaviour intelligence (month 2+ only)
  const behaviour: MonthlyReportData['behaviour'] = !isBaseline ? (() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const wdFasts: Record<string, number> = {};
    const wdTotal: Record<string, number> = {};
    let missedThenResumed = 0, lastMissed = false;
    dailyHeatmap.forEach((day, i) => {
      const dn = dayNames[new Date(year, month, i + 1).getDay()];
      wdTotal[dn] = (wdTotal[dn] ?? 0) + 1;
      if (day.fasted) { wdFasts[dn] = (wdFasts[dn] ?? 0) + 1; if (lastMissed) missedThenResumed++; lastMissed = false; }
      else { if (i > 0) lastMissed = true; }
    });
    const wkF = ['Mon','Tue','Wed','Thu'].reduce((s, d) => s + (wdFasts[d] ?? 0), 0);
    const wkT = ['Mon','Tue','Wed','Thu'].reduce((s, d) => s + (wdTotal[d] ?? 0), 0);
    const weF = ['Fri','Sat','Sun'].reduce((s, d) => s + (wdFasts[d] ?? 0), 0);
    const weT = ['Fri','Sat','Sun'].reduce((s, d) => s + (wdTotal[d] ?? 0), 0);
    const wkPct = wkT > 0 ? Math.round((wkF / wkT) * 100) : 0;
    const wePct = weT > 0 ? Math.round((weF / weT) * 100) : 0;
    const totalMisses = dailyHeatmap.filter((d, i) => !d.fasted && i > 0).length;
    const bestDays = dayNames.map(d => ({ day: d, p: (wdTotal[d] ?? 0) > 0 ? (wdFasts[d] ?? 0) / (wdTotal[d] ?? 1) : 0 })).sort((a, b) => b.p - a.p).filter(d => d.p > 0.5).slice(0, 3).map(d => d.day);
    return { weekdayAdherencePct: wkPct, weekendDropPct: Math.max(0, wkPct - wePct), recoveryRate: totalMisses > 0 ? Math.round((missedThenResumed / totalMisses) * 100) : 100, bestDays };
  })() : null;

  const hasWaterData = waterValues.length > 0;
  const hasStepsData = stepsValues.length > 0;
  const dataGaps: string[] = [];
  if (!hasWaterData) dataGaps.push('Hydration data not available this month');
  if (!hasStepsData) dataGaps.push('Movement data not synced this month');
  if (monthWeightLogs.length === 0) dataGaps.push('No weight logs recorded this month');

  // Baseline comparison (null if this IS the baseline)
  // TODO: For a full implementation, store baseline month data in AsyncStorage
  // on first report generation and retrieve here. For now, use prevMonth as proxy.
  const baseline: MonthlyReportData['baseline'] = null;

  // Next month targets
  const nextMonthTargets: MonthlyReportData['nextMonthTargets'] = (() => {
    const tf = completedFasts < 8 ? Math.min(15, Math.max(8, Math.round(completedFasts * 1.5))) : completedFasts < 15 ? Math.min(20, completedFasts + 3) : completedFasts;
    const tlf = avgFastDuration >= 16 ? '1 weekly 20h+ fast' : 'Keep 16h+ minimum on most fasting days';
    let fa = 'Consistency \u2014 build the daily habit';
    if (behaviour?.weekendDropPct && behaviour.weekendDropPct > 20) fa = 'Timing \u2014 fix weekend drop-off';
    else if (mScore.circadianPct < 70) fa = 'Timing \u2014 improve overnight alignment';
    else if (mScore.consistencyPct >= 80) fa = 'Depth \u2014 extend fasting duration';
    let rh = 'Build your streak to 7+ days';
    if (behaviour?.weekendDropPct && behaviour.weekendDropPct > 20) rh = 'Fix weekend drop-off';
    else if (bestStreak >= 7) rh = `Beat your ${bestStreak}-day streak`;
    return { targetFasts: tf, targetLongFast: tlf, focusArea: fa, retentionHook: rh };
  })();

  // ── Assemble ──────────────────────────────────────────────────────────────
  const partial: Partial<MonthlyReportData> = {
    isBaseline, totalFasts, completedFasts, completionRate, avgFastDuration,
    deepFasts16h, longestFast, bestStreak, circadianPct: mScore.circadianPct,
    weightChange, waterDaysOnTarget, stepsDaysOnTarget, waterTarget, behaviour,
    consistencyPct: mScore.consistencyPct,
  };

  const insights = generateInsights(partial);
  const recommendation = generateRecommendation(partial);

  return {
    month, year,
    monthLabel: monthLabel(month, year),
    userName: profile.name ?? 'Friend',
    planLabel: profile.plan?.fastLabel ? `${profile.plan.fastLabel} IF` : 'Intermittent Fasting',
    monthNumber,
    isBaseline,
    generatedAt: Date.now(),

    totalFasts, completedFasts, completionRate,
    totalFastingHours: Math.round(totalFastingHours * 10) / 10,
    avgFastDuration: Math.round(avgFastDuration * 10) / 10,
    longestFast: Math.round(longestFast * 10) / 10,
    deepFasts16h, bestStreak,
    weeklyBreakdown,
    dailyHeatmap,

    metabolicScore: mScore.total,
    metabolicLabel: mScore.label,
    durationGrade: mScore.durationGrade,
    consistencyPct: mScore.consistencyPct,
    circadianPct: mScore.circadianPct,
    deepFastCount: mScore.deepFastCount,
    scoreBreakdown,
    projectedScore,

    timing,
    behaviour,

    weightStart, weightEnd, weightChange,
    weightLogs: monthWeightLogs.map(w => ({ date: w.date, kg: w.kg })),
    bmiStart, bmiEnd, heightCm,

    avgWaterMl, avgSteps, waterTarget, stepsTarget,
    waterDaysOnTarget, stepsDaysOnTarget,
    hasWaterData, hasStepsData,

    fatBurnedGrams: Math.round(fatBurnedGrams),
    autophagyHours: Math.round(autophagyHours * 10) / 10,
    insulinSensitivity,

    baseline,
    prevMonth,
    sinceStart,

    insights,
    dataGaps,
    recommendation,
    nextMonthTargets,
  };
}
