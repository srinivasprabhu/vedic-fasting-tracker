import React from 'react';

export const AUTOPHAGY_THRESHOLD_HOURS = 16;
export const AVG_MEAL_COST = 150;
export const DEFAULT_BODY_WEIGHT_KG = 70;
export const FAT_BURN_BASE_RATE = 0.14;
export const ACTIVITY_FACTOR = 1.0;

export interface MetabolicZone {
  id: string;
  name: string;
  range: string;
  color: string;
  icon: string;
  description: string;
  minHours: number;
  maxHours: number;
}

export const METABOLIC_ZONES: MetabolicZone[] = [
  { id: 'anabolic', name: 'Anabolic', range: '0-4h', color: '#4A90A4', icon: 'UtensilsCrossed', description: 'Digesting food, insulin elevated', minHours: 0, maxHours: 4 },
  { id: 'catabolic', name: 'Catabolic', range: '4-12h', color: '#D4A03C', icon: 'Zap', description: 'Glycogen depletion begins', minHours: 4, maxHours: 12 },
  { id: 'fatburn', name: 'Fat Burning', range: '12-18h', color: '#E8913A', icon: 'Flame', description: 'Active fat oxidation', minHours: 12, maxHours: 18 },
  { id: 'ketosis', name: 'Ketosis', range: '18-24h', color: '#B85C38', icon: 'FlaskConical', description: 'Deep ketone production', minHours: 18, maxHours: 24 },
  { id: 'autophagy', name: 'Autophagy', range: '24-48h', color: '#7B68AE', icon: 'RefreshCw', description: 'Cellular cleansing peak', minHours: 24, maxHours: 48 },
  { id: 'renewal', name: 'Deep Renewal', range: '48h+', color: '#5B8C5A', icon: 'Dna', description: 'Stem cell regeneration', minHours: 48, maxHours: 999 },
];

export const WARRIOR_LEVELS = [
  { name: 'Beginner', minFasts: 0, color: '#B8A898', icon: 'Leaf' },
  { name: 'Starter', minFasts: 5, color: '#5B8C5A', icon: 'Zap' },
  { name: 'Disciplined', minFasts: 15, color: '#D4A03C', icon: 'Flame' },
  { name: 'Committed', minFasts: 30, color: '#E8913A', icon: 'Dumbbell' },
  { name: 'Master', minFasts: 60, color: '#C97B2A', icon: 'Sparkles' },
  { name: 'Legend', minFasts: 100, color: '#7B68AE', icon: 'Crown' },
];

/** Safe fast duration in hours (never negative — fixes bad/synced records). */
export function fastDurationHours(r: { startTime: number; endTime?: number | null }): number {
  const end = r.endTime ?? r.startTime;
  return Math.max(0, end - r.startTime) / 3600000;
}

/** Returns YYYY-MM-DD in local timezone (not UTC). Use for day-based grouping. */
export function toLocalDateString(d: Date | number): string {
  const date = typeof d === 'number' ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatHours(hours: number): string {
  const h = Number.isFinite(hours) ? Math.max(0, hours) : 0;
  if (h < 1) return `${Math.round(h * 60)}m`;
  return `${Math.round(h * 10) / 10}h`;
}

/** Lifetime / large totals: prefer hours; use days when helpful. Never negative. */
export function formatFastingHoursTotal(hours: number): string {
  const h = Number.isFinite(hours) ? Math.max(0, hours) : 0;
  if (h >= 48) {
    const d = h / 24;
    if (d >= 10) return `${Math.round(d * 10) / 10} d`;
    return `${Math.round(h * 10) / 10}h`;
  }
  return formatHours(h);
}

/**
 * Insights / Today / analytics tiles: same rules as `formatFastingHoursTotal` for rolled-up hours
 * so long all-time values stay short in UI (e.g. days instead of 2000+h).
 */
export function formatInsightHours(hours: number): string {
  return formatFastingHoursTotal(hours);
}

/**
 * Safe UI copy for extended fasting — no numeric hormone multipliers.
 * Use for gauges / cards where a 0–100 style score helps layout.
 */
export function getExtendedFastingSupportLevel(hours: number): {
  score: number;
  label: string;
  sublabel: string;
} {
  const h = Math.max(0, hours);
  if (h < 12) {
    return { score: 25, label: 'Early window', sublabel: 'Longer fasts deepen metabolic adaptation' };
  }
  if (h < 18) {
    return { score: 45, label: 'Fat-burn shift', sublabel: 'Often associated with deeper fat utilization' };
  }
  if (h < 24) {
    return { score: 60, label: 'Extended phase', sublabel: 'Repair and hormone signaling may increase' };
  }
  if (h < 48) {
    return { score: 78, label: 'Deep fasting zone', sublabel: 'Often linked to stronger metabolic flexibility' };
  }
  return { score: 92, label: 'Advanced phase', sublabel: 'Extended fast — listen to your body' };
}

export function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toFixed(n < 10 ? 1 : 0);
}

export function getAutophagyScore(hours: number): number {
  if (hours < 16) return 0;
  if (hours < 24) return Math.round((hours - 16) * 10);
  if (hours < 48) return Math.min(100, Math.round(80 + (hours - 24) * 0.833));
  return 100;
}

export function getAutophagyPhase(score: number): { phase: string; description: string } {
  if (score === 0) return { phase: 'Not Started', description: 'Autophagy begins around 16 hours' };
  if (score < 50) return { phase: 'Early Autophagy', description: 'Cellular cleanup initiating' };
  if (score < 80) return { phase: 'Deep Autophagy', description: 'Significant cellular renewal' };
  return { phase: 'Peak Autophagy', description: 'Maximum cellular regeneration' };
}

export function getHGHMultiplier(hours: number): { multiplier: number; percentage: number; display: string } {
  if (hours < 12) {
    return { multiplier: 1, percentage: 0, display: 'Normal levels' };
  } else if (hours < 24) {
    const multiplier = 1 + ((hours - 12) / 12) * 19;
    return {
      multiplier: Math.round(multiplier * 10) / 10,
      percentage: Math.round((multiplier - 1) * 100),
      display: `${Math.round(multiplier)}x boost`,
    };
  } else if (hours < 48) {
    const multiplier = 20 + ((hours - 24) / 24) * 5;
    return {
      multiplier: Math.round(multiplier * 10) / 10,
      percentage: Math.round((multiplier - 1) * 100),
      display: `${Math.round(multiplier)}x boost`,
    };
  }
  return { multiplier: 25, percentage: 2400, display: '25x boost' };
}

export function calculateFatBurned(fastingHours: number, bodyWeightKg: number = DEFAULT_BODY_WEIGHT_KG): number {
  if (fastingHours < 12) return 0;
  const effectiveHours = fastingHours - 12;
  const fatBurned = effectiveHours * FAT_BURN_BASE_RATE * bodyWeightKg * ACTIVITY_FACTOR;
  return Math.round(fatBurned * 10) / 10;
}

export interface BarData {
  label: string;
  value: number;
  maxValue: number;
}

export interface MilestoneData {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress: number;
  target: number;
  color: string;
}
