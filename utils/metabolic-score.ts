// utils/metabolic-score.ts
// Metabolic Discipline Score — a composite 0-100 score measuring fasting quality.
//
// MDS = Duration (30) + Consistency (25) + Circadian (20) + Deep Fasts (15) + Streak (10)

import type { FastRecord } from '@/types/fasting';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MetabolicScoreBreakdown {
  /** Overall score 0-100 */
  total: number;
  /** Are you fasting long enough? (0-30) */
  duration: number;
  /** Duration as 0-100 normalized score */
  durationPct: number;
  /** Grade label: A, B+, B, C+, C, D */
  durationGrade: string;
  /** Duration insight text */
  durationInsight: string;
  /** Are you fasting regularly? (0-25) */
  consistency: number;
  /** Consistency as percentage 0-100 */
  consistencyPct: number;
  /** Consistency grade */
  consistencyGrade: string;
  /** Consistency insight text */
  consistencyInsight: string;
  /** Week completed count */
  weekCompleted: number;
  /** Are you fasting overnight? (0-20) */
  circadian: number;
  /** Circadian alignment as percentage 0-100 */
  circadianPct: number;
  /** Circadian grade */
  circadianGrade: string;
  /** Circadian insight text */
  circadianInsight: string;
  /** Overnight overlap hours */
  overnightOverlapHours: number;
  /** Are you hitting deep fasting zones? (0-15) */
  deepFasts: number;
  /** Deep fast quality as 0-100 */
  deepFastPct: number;
  /** Deep fast grade */
  deepFastGrade: string;
  /** Deep fast insight text */
  deepFastInsight: string;
  /** Number of deep fasts this week */
  deepFastCount: number;
  /** Streak momentum bonus (0-10) */
  streakBonus: number;
  /** Human-readable label */
  label: string;
  /** Change vs last week's score */
  vsLastWeek: number;
  /** Average fast duration this week in hours */
  avgDurationHours: number;
  /** Target fast hours from plan */
  targetHours: number;
}

export type ScoreLevel = 'excellent' | 'strong' | 'building' | 'starting' | 'beginning';

// ─── Circadian overlap helper ─────────────────────────────────────────────────
// Calculates how many hours of a fast overlap with the overnight window (10 PM – 6 AM).
// This rewards fasting during sleep, which is the healthiest circadian pattern.

function calcCircadianOverlap(startTime: number, endTime: number): number {
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  const fastDurationHours = (endTime - startTime) / 3600000;
  
  if (fastDurationHours <= 0) return 0;

  // We check each night that the fast spans
  let totalOverlapHours = 0;
  
  // Start from the day of the fast start
  const checkStart = new Date(startDate);
  checkStart.setHours(0, 0, 0, 0);
  
  // Check up to 3 nights (covers fasts up to ~72h)
  for (let dayOffset = -1; dayOffset <= 3; dayOffset++) {
    const nightStart = new Date(checkStart);
    nightStart.setDate(nightStart.getDate() + dayOffset);
    nightStart.setHours(22, 0, 0, 0); // 10 PM
    
    const nightEnd = new Date(nightStart);
    nightEnd.setDate(nightEnd.getDate() + 1);
    nightEnd.setHours(6, 0, 0, 0); // 6 AM next day
    
    // Calculate overlap between [startTime, endTime] and [nightStart, nightEnd]
    const overlapStart = Math.max(startTime, nightStart.getTime());
    const overlapEnd = Math.min(endTime, nightEnd.getTime());
    
    if (overlapEnd > overlapStart) {
      totalOverlapHours += (overlapEnd - overlapStart) / 3600000;
    }
  }
  
  return totalOverlapHours;
}

// ─── Main calculator ──────────────────────────────────────────────────────────

export function calculateMetabolicScore(params: {
  /** All completed fasting records */
  completedRecords: FastRecord[];
  /** Records within the current period (7D/30D/90D) */
  thisWeekRecords: FastRecord[];
  /** Records from the previous period (for comparison) */
  lastWeekRecords: FastRecord[];
  /** Current streak count */
  streak: number;
  /** User's planned fast hours (e.g. 16 for 16:8) */
  targetFastHours: number;
  /** Target fasts per week (5 for daily IF, 2 for 5:2) */
  targetFastsPerWeek?: number;
  /** Number of days in the period (7, 30, or 90). Default 7. */
  periodDays?: number;
}): MetabolicScoreBreakdown {
  const {
    completedRecords,
    thisWeekRecords,
    lastWeekRecords,
    streak,
    targetFastHours,
    targetFastsPerWeek = 5,
    periodDays = 7,
  } = params;

  // Scale the consistency target based on period length
  // e.g., 5 fasts/week → ~21 fasts in 30 days, ~64 in 90 days
  const weeks = periodDays / 7;
  const targetFastsForPeriod = Math.round(targetFastsPerWeek * weeks);

  // ── 1. Duration Score (0-30) ─────────────────────────────────────────────
  // How close is your average fast duration to your target?
  const thisWeekDurations = thisWeekRecords
    .filter(r => r.endTime && r.completed)
    .map(r => ((r.endTime ?? 0) - r.startTime) / 3600000);

  const avgDuration = thisWeekDurations.length > 0
    ? thisWeekDurations.reduce((s, h) => s + h, 0) / thisWeekDurations.length
    : 0;

  // Allow slight over-target to still max out, cap at 1.0
  const durationRatio = targetFastHours > 0
    ? Math.min(1, avgDuration / targetFastHours)
    : 0;
  const duration = Math.round(durationRatio * 30);
  const durationPct = Math.round(durationRatio * 100);

  // Grade: A (>90%), B+ (>80%), B (>70%), C+ (>60%), C (>50%), D
  const durationGrade = durationRatio >= 0.95 ? 'A+'
    : durationRatio >= 0.9 ? 'A'
    : durationRatio >= 0.8 ? 'B+'
    : durationRatio >= 0.7 ? 'B'
    : durationRatio >= 0.6 ? 'C+'
    : durationRatio >= 0.5 ? 'C'
    : 'D';

  // Insight text
  const avgH = Math.floor(avgDuration);
  const avgM = Math.round((avgDuration - avgH) * 60);
  const diffMin = Math.round((targetFastHours - avgDuration) * 60);
  const durationInsight = avgDuration === 0
    ? 'Complete your first fast to see your duration score.'
    : avgDuration >= targetFastHours
    ? `Averaging ${avgH}h ${avgM}m — exceeding your ${targetFastHours}h target. Excellent.`
    : `Averaging ${avgH}h ${avgM}m — just ${diffMin}m short of your ${targetFastHours}h target. ${durationRatio >= 0.9 ? 'Strong.' : 'Keep pushing.'}`;

  // ── 2. Consistency Score (0-25) ──────────────────────────────────────────
  // How many fasts did you complete in this period vs target?
  const weekCompleted = thisWeekRecords.filter(r => r.completed).length;
  const consistencyRatio = targetFastsForPeriod > 0
    ? Math.min(1, weekCompleted / targetFastsForPeriod)
    : 0;
  const consistency = Math.round(consistencyRatio * 25);
  const consistencyPct = Math.round(consistencyRatio * 100);
  const consistencyGrade = consistencyRatio >= 0.95 ? 'A+'
    : consistencyRatio >= 0.85 ? 'A'
    : consistencyRatio >= 0.7 ? 'B+'
    : consistencyRatio >= 0.6 ? 'B'
    : consistencyRatio >= 0.4 ? 'C+'
    : consistencyRatio >= 0.2 ? 'C'
    : 'D';
  const remaining = Math.max(0, targetFastsForPeriod - weekCompleted);
  const consistencyInsight = weekCompleted === 0
    ? `No fasts completed in this period yet.`
    : weekCompleted >= targetFastsForPeriod
    ? `${weekCompleted} of ${targetFastsForPeriod} days on target. Perfect consistency.`
    : `${weekCompleted} of ${targetFastsForPeriod} days on target. ${remaining} more ${remaining === 1 ? 'day' : 'days'} to go.`;

  // ── 3. Circadian Score (0-20) ────────────────────────────────────────────
  // How much of your fasting overlaps with the overnight window (10PM-6AM)?
  const weekCircadianScores = thisWeekRecords
    .filter(r => r.endTime && r.completed)
    .map(r => {
      const overlapHours = calcCircadianOverlap(r.startTime, r.endTime!);
      // Max 8 hours of overnight overlap per fast (10PM-6AM = 8h)
      return Math.min(1, overlapHours / 8);
    });

  const avgCircadian = weekCircadianScores.length > 0
    ? weekCircadianScores.reduce((s, v) => s + v, 0) / weekCircadianScores.length
    : 0;
  const circadian = Math.round(avgCircadian * 20);
  const circadianPct = Math.round(avgCircadian * 100);
  const circadianGrade = circadianPct >= 90 ? 'A+'
    : circadianPct >= 80 ? 'A'
    : circadianPct >= 70 ? 'B+'
    : circadianPct >= 60 ? 'B'
    : circadianPct >= 45 ? 'C+'
    : circadianPct >= 30 ? 'C'
    : 'D';

  // Average overnight overlap hours
  const avgOverlapHours = weekCircadianScores.length > 0
    ? (weekCircadianScores.reduce((s, v) => s + v, 0) / weekCircadianScores.length) * 8
    : 0;
  const overlapH = Math.floor(avgOverlapHours);
  const overlapM = Math.round((avgOverlapHours - overlapH) * 60);
  const circadianInsight = weekCircadianScores.length === 0
    ? 'Complete a fast to see your circadian alignment.'
    : circadianPct >= 80
    ? `${overlapH}h ${overlapM}m overnight overlap. Great circadian alignment.`
    : `${overlapH}h ${overlapM}m overnight overlap. Push break-fast past 7 AM to improve.`;

  // ── 4. Deep Fast Score (0-15) ────────────────────────────────────────────
  // How many fasts this week exceeded 16h (autophagy threshold)?
  const deepFastCount = thisWeekRecords.filter(r => {
    if (!r.endTime || !r.completed) return false;
    const hours = (r.endTime - r.startTime) / 3600000;
    return hours >= 16;
  }).length;

  // Target: 2 deep fasts per week
  const deepFastRatio = Math.min(1, deepFastCount / 2);
  const deepFasts = Math.round(deepFastRatio * 15);
  const deepFastPct = Math.round(deepFastRatio * 100);
  const deepFastGrade = deepFastPct >= 90 ? 'A'
    : deepFastPct >= 75 ? 'B+'
    : deepFastPct >= 50 ? 'B'
    : deepFastPct >= 25 ? 'C'
    : 'D';
  const deepFastInsight = deepFastCount === 0
    ? 'No deep fasts (16h+) this week. Try extending one fast past 16 hours.'
    : deepFastCount >= 2
    ? `${deepFastCount} deep fasts this week. ${deepFastCount >= 3 ? 'Exceptional depth.' : 'Solid.'}`
    : `${deepFastCount} deep fast this week. One 18h+ fast would push this to ${deepFastGrade === 'B' ? 'A' : 'B+'}.`;

  // ── 5. Streak Bonus (0-10) ───────────────────────────────────────────────
  const streakBonus = Math.min(10, Math.round(streak * 1.5));

  // ── Total ────────────────────────────────────────────────────────────────
  const total = Math.min(100, duration + consistency + circadian + deepFasts + streakBonus);

  // ── Label ────────────────────────────────────────────────────────────────
  const label = total >= 85 ? 'Excellent metabolic discipline'
    : total >= 70 ? 'Strong metabolic discipline'
    : total >= 50 ? 'Building discipline'
    : total >= 30 ? 'Getting started'
    : 'Just beginning';

  // ── vs Last Week ─────────────────────────────────────────────────────────
  // Quick calculation of last week's score for comparison
  let lastWeekTotal = 0;
  if (lastWeekRecords.length > 0) {
    const lwDurations = lastWeekRecords
      .filter(r => r.endTime && r.completed)
      .map(r => ((r.endTime ?? 0) - r.startTime) / 3600000);
    const lwAvgDur = lwDurations.length > 0
      ? lwDurations.reduce((s, h) => s + h, 0) / lwDurations.length
      : 0;
    const lwDuration = Math.round(Math.min(1, lwAvgDur / Math.max(1, targetFastHours)) * 30);
    const lwCompleted = lastWeekRecords.filter(r => r.completed).length;
    const lwConsistency = Math.round(Math.min(1, lwCompleted / Math.max(1, targetFastsForPeriod)) * 25);
    const lwCircadianScores = lastWeekRecords
      .filter(r => r.endTime && r.completed)
      .map(r => Math.min(1, calcCircadianOverlap(r.startTime, r.endTime!) / 8));
    const lwCircadian = lwCircadianScores.length > 0
      ? Math.round((lwCircadianScores.reduce((s, v) => s + v, 0) / lwCircadianScores.length) * 20)
      : 0;
    const lwDeep = lastWeekRecords.filter(r => {
      if (!r.endTime || !r.completed) return false;
      return ((r.endTime - r.startTime) / 3600000) >= 16;
    }).length;
    const lwDeepScore = Math.round(Math.min(1, lwDeep / 2) * 15);
    // No streak data for last week, use 0
    lastWeekTotal = Math.min(100, lwDuration + lwConsistency + lwCircadian + lwDeepScore);
  }

  const vsLastWeek = total - lastWeekTotal;

  return {
    total,
    duration,
    durationPct,
    durationGrade,
    durationInsight,
    consistency,
    consistencyPct,
    consistencyGrade,
    consistencyInsight,
    weekCompleted,
    circadian,
    circadianPct,
    circadianGrade,
    circadianInsight,
    overnightOverlapHours: avgOverlapHours,
    deepFasts,
    deepFastPct,
    deepFastGrade,
    deepFastInsight,
    deepFastCount,
    streakBonus,
    label,
    vsLastWeek,
    avgDurationHours: avgDuration,
    targetHours: targetFastHours,
  };
}

// ─── Helper: get score level for styling ──────────────────────────────────────

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'strong';
  if (score >= 50) return 'building';
  if (score >= 30) return 'starting';
  return 'beginning';
}

export function getScoreColor(level: ScoreLevel, isDark: boolean): string {
  switch (level) {
    case 'excellent': return isDark ? '#5B8C5A' : '#3a7a39';
    case 'strong':    return isDark ? '#e8a84c' : '#c8872a';
    case 'building':  return isDark ? '#E8913A' : '#c07020';
    case 'starting':  return isDark ? '#B8A898' : '#8a7a6a';
    case 'beginning': return isDark ? '#706860' : '#a09890';
  }
}

// ─── Helper: get last week's records ──────────────────────────────────────────

export function getLastWeekRecords(completedRecords: FastRecord[]): FastRecord[] {
  const now = new Date();
  const day = now.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setHours(0, 0, 0, 0);
  startOfThisWeek.setDate(now.getDate() - daysFromMonday);
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

  return completedRecords.filter(
    r => r.startTime >= startOfLastWeek.getTime() && r.startTime < startOfThisWeek.getTime()
  );
}

// ─── Helper: get records for a date range ─────────────────────────────────────

export type InsightRange = '7D' | '30D' | '90D';

/** Returns records within the last N days */
export function getRecordsForRange(
  completedRecords: FastRecord[],
  range: InsightRange,
): FastRecord[] {
  const now = Date.now();
  const days = range === '7D' ? 7 : range === '30D' ? 30 : 90;
  const cutoff = now - days * 86400000;
  return completedRecords.filter(r => (r.endTime ?? r.startTime) >= cutoff);
}

/** Returns the "previous period" records for comparison.
 *  If range=7D → previous 7 days; 30D → previous 30 days; 90D → previous 90 days */
export function getPreviousPeriodRecords(
  completedRecords: FastRecord[],
  range: InsightRange,
): FastRecord[] {
  const now = Date.now();
  const days = range === '7D' ? 7 : range === '30D' ? 30 : 90;
  const periodStart = now - days * 2 * 86400000;
  const periodEnd = now - days * 86400000;
  return completedRecords.filter(r => {
    const t = r.endTime ?? r.startTime;
    return t >= periodStart && t < periodEnd;
  });
}

// ─── Helper: target fasts per week based on plan ──────────────────────────────

export function getTargetFastsPerWeek(fastLabel?: string | null): number {
  if (!fastLabel) return 5;
  const lower = fastLabel.toLowerCase();
  if (lower.includes('5:2')) return 2;
  if (lower.includes('4:3')) return 3;
  if (lower.includes('omad')) return 5;
  if (lower.includes('36')) return 3;
  return 5; // Default for daily IF plans
}
