/**
 * Rule 6 — Backdating: allow fast logs within the last 7 local calendar days only.
 */

const MS_DAY = 86400000;

export type LoggingEligibility = { ok: true } | { ok: false; message: string };

function startOfLocalDayMs(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Whole local days between event day and today (0 = today). */
export function daysAgoLocal(eventMs: number, nowMs: number = Date.now()): number {
  const a = startOfLocalDayMs(eventMs);
  const b = startOfLocalDayMs(nowMs);
  return Math.floor((b - a) / MS_DAY);
}

/** Start or end timestamp for a fast must fall within rolling 7 local days (0–6 ago allowed, 7+ blocked). */
export function checkLoggingTimestamp(eventMs: number, nowMs: number = Date.now()): LoggingEligibility {
  const ago = daysAgoLocal(eventMs, nowMs);
  if (ago < 0) return { ok: false, message: 'Date cannot be in the future.' };
  if (ago >= 7) {
    return {
      ok: false,
      message: 'We can only track fasts logged within 7 days. Your journey starts here.',
    };
  }
  return { ok: true };
}

export function needsBackdateConfirmation(eventMs: number, nowMs: number = Date.now()): boolean {
  const ago = daysAgoLocal(eventMs, nowMs);
  return ago >= 3 && ago <= 6;
}

/**
 * Start of the earliest local calendar day that still passes `checkLoggingTimestamp`
 * (same 7-day window: today and the prior 6 days).
 */
export function oldestAllowedLocalDayStartMs(nowMs: number = Date.now()): number {
  const d = new Date(nowMs);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 6);
  return d.getTime();
}

/** End timestamp must be strictly after fast start. */
export function checkFastEndAfterStart(endMs: number, startMs: number): LoggingEligibility {
  if (endMs <= startMs) {
    return { ok: false, message: 'End time must be after your fast started.' };
  }
  return { ok: true };
}
