// utils/smart-projection.ts
// Real-time weight loss projection based on actual user data.
// Requires: ≥3 weight logs spanning ≥7 days, OR a 7-day fasting streak.
//
// Unlike the plan-based projection (theoretical), this uses real logged data
// to calculate the user's actual rate of progress and project forward.

import type { FastRecord } from '@/types/fasting';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeightLogEntry {
  kg: number;
  date: string;   // YYYY-MM-DD
  time: number;   // ms timestamp
}

export interface SmartProjection {
  /** Whether we have enough data to show a projection */
  available: boolean;
  /** Why not available (for UI messaging) */
  unavailableReason?: 'need_weight_logs' | 'need_more_time' | 'no_goal' | 'gaining_weight';
  /** How many more weight logs needed */
  logsNeeded?: number;
  /** How many more days of data needed */
  daysNeeded?: number;
  /** Projected weeks to reach goal weight */
  weeksToGoal: number | null;
  /** Actual average kg lost per week (from real data) */
  actualKgPerWeek: number;
  /** Smoothed recent trend (last 2 weeks vs prior) — positive = losing */
  recentTrendKgPerWeek: number;
  /** Whether the trend is accelerating (losing faster recently) */
  isAccelerating: boolean;
  /** Confidence level 0-100 (more data = higher) */
  confidence: number;
  /** Data points used */
  dataPointCount: number;
  /** Days of data span */
  dataSpanDays: number;
  /** Current weight (latest log) */
  currentKg: number;
  /** Goal weight */
  goalKg: number;
  /** Starting weight (from profile/first log) */
  startKg: number;
  /** Progress percentage toward goal */
  progressPct: number;
  /** Weekly projection points for chart (kg values for next N weeks) */
  projectedWeeklyKg: number[];
  /** Insight text for the user */
  insight: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Weighted moving average — gives more weight to recent entries */
function weightedAverage(values: number[], weights: number[]): number {
  let sum = 0, wSum = 0;
  for (let i = 0; i < values.length; i++) {
    const w = weights[i] ?? 1;
    sum += values[i] * w;
    wSum += w;
  }
  return wSum > 0 ? sum / wSum : 0;
}

/** Calculate days between two YYYY-MM-DD date strings */
function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + 'T00:00:00');
  const b = new Date(dateB + 'T00:00:00');
  return Math.abs((b.getTime() - a.getTime()) / 86400000);
}

// ─── Eligibility check ────────────────────────────────────────────────────────

export function isSmartProjectionEligible(
  weightLogs: WeightLogEntry[],
  completedFastCount: number,
  streak: number,
  goalKg: number | null,
): { eligible: boolean; reason?: SmartProjection['unavailableReason']; logsNeeded?: number; daysNeeded?: number } {
  if (!goalKg || goalKg <= 0) {
    return { eligible: false, reason: 'no_goal' };
  }

  // Need at least 3 weight logs
  if (weightLogs.length < 3) {
    return { eligible: false, reason: 'need_weight_logs', logsNeeded: 3 - weightLogs.length };
  }

  // Need data spanning at least 7 days
  const sorted = [...weightLogs].sort((a, b) => a.time - b.time);
  const span = daysBetween(sorted[0].date, sorted[sorted.length - 1].date);
  if (span < 7) {
    return { eligible: false, reason: 'need_more_time', daysNeeded: 7 - span };
  }

  // OR: 7-day fasting streak qualifies even with fewer weight logs
  if (streak >= 7 && weightLogs.length >= 2) {
    return { eligible: true };
  }

  return { eligible: true };
}

// ─── Main calculator ──────────────────────────────────────────────────────────

export function calculateSmartProjection(params: {
  weightLogs: WeightLogEntry[];
  goalKg: number;
  startKg: number;
  completedRecords: FastRecord[];
  streak: number;
}): SmartProjection {
  const { weightLogs, goalKg, startKg, completedRecords, streak } = params;

  // Sort by time ascending
  const sorted = [...weightLogs].sort((a, b) => a.time - b.time);
  const latest = sorted[sorted.length - 1];
  const earliest = sorted[0];
  const currentKg = latest.kg;
  const dataSpanDays = daysBetween(earliest.date, latest.date);
  const dataSpanWeeks = Math.max(1, dataSpanDays / 7);

  // Check if user is actually losing weight
  if (currentKg >= startKg && sorted.length >= 3) {
    // Check if recent trend shows loss even if overall doesn't
    const recentLogs = sorted.slice(-3);
    const recentTrend = recentLogs[0].kg - recentLogs[recentLogs.length - 1].kg;
    if (recentTrend <= 0) {
      return {
        available: false,
        unavailableReason: 'gaining_weight',
        weeksToGoal: null,
        actualKgPerWeek: 0,
        recentTrendKgPerWeek: 0,
        isAccelerating: false,
        confidence: 0,
        dataPointCount: sorted.length,
        dataSpanDays,
        currentKg,
        goalKg,
        startKg,
        progressPct: 0,
        projectedWeeklyKg: [],
        insight: 'Your weight trend is currently stable or increasing. Keep consistent with your fasting plan — results often take 2-3 weeks to show.',
      };
    }
  }

  // ── Calculate actual loss rate ────────────────────────────────────────────
  // Use weighted regression: recent data points count more
  // Weight each log by recency (most recent = highest weight)
  const weights = sorted.map((_, i) => 1 + (i / sorted.length) * 2); // 1.0 to 3.0

  // Calculate weekly loss rates between consecutive logs
  const weeklyRates: number[] = [];
  const rateWeights: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const days = daysBetween(sorted[i - 1].date, sorted[i].date);
    if (days < 1) continue;
    const kgChange = sorted[i - 1].kg - sorted[i].kg; // positive = loss
    const weeklyRate = (kgChange / days) * 7;
    weeklyRates.push(weeklyRate);
    // More weight to recent intervals
    rateWeights.push(1 + (i / sorted.length) * 2);
  }

  // Weighted average loss rate (kg/week)
  const actualKgPerWeek = weeklyRates.length > 0
    ? weightedAverage(weeklyRates, rateWeights)
    : (earliest.kg - latest.kg) / dataSpanWeeks;

  // ── Recent trend (last 14 days vs prior) ──────────────────────────────────
  const twoWeeksAgo = Date.now() - 14 * 86400000;
  const recentLogs = sorted.filter(l => l.time >= twoWeeksAgo);
  const olderLogs = sorted.filter(l => l.time < twoWeeksAgo);

  let recentTrendKgPerWeek = actualKgPerWeek;
  if (recentLogs.length >= 2 && olderLogs.length >= 1) {
    const recentFirst = recentLogs[0].kg;
    const recentLast = recentLogs[recentLogs.length - 1].kg;
    const recentDays = daysBetween(recentLogs[0].date, recentLogs[recentLogs.length - 1].date);
    if (recentDays > 0) {
      recentTrendKgPerWeek = ((recentFirst - recentLast) / recentDays) * 7;
    }
  }

  const isAccelerating = recentTrendKgPerWeek > actualKgPerWeek * 1.1; // 10% faster

  // ── Confidence score (0-100) ──────────────────────────────────────────────
  // More logs + longer span + consistency = higher confidence
  const logScore = Math.min(40, sorted.length * 5); // 5 pts per log, max 40
  const spanScore = Math.min(30, (dataSpanDays / 30) * 30); // max 30 at 30 days
  const consistencyScore = streak >= 7 ? 30 : streak >= 3 ? 20 : 10;
  const confidence = Math.min(100, logScore + spanScore + consistencyScore);

  // ── Project forward ───────────────────────────────────────────────────────
  // Use the better of: actual rate or recent trend (if accelerating)
  const projectionRate = isAccelerating
    ? (actualKgPerWeek * 0.4 + recentTrendKgPerWeek * 0.6) // Blend: favor recent
    : actualKgPerWeek;

  const kgToLose = Math.max(0, currentKg - goalKg);
  let weeksToGoal: number | null = null;

  if (projectionRate > 0.05) { // At least 50g/week loss
    // Simulate with slight adaptive slowdown
    let remaining = kgToLose;
    let weeks = 0;
    const projectedWeeklyKg: number[] = [currentKg];

    while (remaining > 0 && weeks < 150) {
      weeks++;
      // Slight slowdown after week 12 (adaptive thermogenesis)
      const slowdown = weeks > 12 ? Math.min(0.06, (weeks - 12) * 0.002) : 0;
      const weekLoss = projectionRate * (1 - slowdown);
      remaining -= weekLoss;
      projectedWeeklyKg.push(Math.max(goalKg, currentKg - (kgToLose - remaining)));
    }

    weeksToGoal = Math.max(1, weeks);

    // ── Progress ──────────────────────────────────────────────────────────
    const totalToLose = startKg - goalKg;
    const lost = startKg - currentKg;
    const progressPct = totalToLose > 0 ? Math.min(100, Math.max(0, (lost / totalToLose) * 100)) : 0;

    // ── Insight text ──────────────────────────────────────────────────────
    const rateStr = actualKgPerWeek.toFixed(1);
    let insight: string;
    if (weeksToGoal <= 8) {
      insight = `At your current pace of ${rateStr}kg/week, you're on track to reach your goal in about ${weeksToGoal} weeks. Keep it up!`;
    } else if (isAccelerating) {
      insight = `You're losing ${rateStr}kg/week and your pace is picking up. At this rate, you could reach your goal in ~${weeksToGoal} weeks.`;
    } else if (actualKgPerWeek >= 0.3) {
      insight = `Solid progress — ${rateStr}kg/week. You're projected to reach ${goalKg}kg in about ${weeksToGoal} weeks.`;
    } else if (actualKgPerWeek >= 0.15) {
      insight = `Steady progress at ${rateStr}kg/week. Consider extending your fasting window or adding more steps to accelerate.`;
    } else {
      insight = `You're making gradual progress. Consistency is key — try to hit your fasting target daily for faster results.`;
    }

    // Trim projection to reasonable length for chart (max 30 points)
    const chartPoints = projectedWeeklyKg.length > 30
      ? projectedWeeklyKg.filter((_, i) => i % Math.ceil(projectedWeeklyKg.length / 30) === 0 || i === projectedWeeklyKg.length - 1)
      : projectedWeeklyKg;

    return {
      available: true,
      weeksToGoal,
      actualKgPerWeek,
      recentTrendKgPerWeek,
      isAccelerating,
      confidence,
      dataPointCount: sorted.length,
      dataSpanDays,
      currentKg,
      goalKg,
      startKg,
      progressPct,
      projectedWeeklyKg: chartPoints,
      insight,
    };
  }

  // Not enough measurable loss
  return {
    available: false,
    unavailableReason: 'gaining_weight',
    weeksToGoal: null,
    actualKgPerWeek: Math.max(0, actualKgPerWeek),
    recentTrendKgPerWeek: Math.max(0, recentTrendKgPerWeek),
    isAccelerating: false,
    confidence,
    dataPointCount: sorted.length,
    dataSpanDays,
    currentKg,
    goalKg,
    startKg,
    progressPct: 0,
    projectedWeeklyKg: [],
    insight: 'Keep logging your weight consistently. We need a bit more data to show your personalised projection.',
  };
}

// ─── Eligibility message for free users ───────────────────────────────────────

export function getSmartProjectionTeaser(
  weightLogCount: number,
  streak: number,
  hasGoal: boolean,
): string {
  if (!hasGoal) return 'Set a goal weight to see your personalised weight forecast.';
  if (weightLogCount < 3) return `Log ${3 - weightLogCount} more weight${3 - weightLogCount === 1 ? '' : 's'} to unlock your AI-powered weight forecast.`;
  if (streak < 7 && weightLogCount < 5) return `${7 - streak} more days of fasting to unlock your personalised projection.`;
  return 'Your personalised weight forecast is ready.';
}
