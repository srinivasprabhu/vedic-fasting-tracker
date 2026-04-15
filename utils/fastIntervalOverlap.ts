import type { FastRecord } from '@/types/fasting';

import type { LoggingEligibility } from '@/utils/loggingEligibility';

/** User-visible copy when a new start would overlap an existing completed fast. */
export const FAST_OVERLAP_MESSAGE =
  'A fast already covers this time. You cannot log a second fast in the same period.';

/**
 * Whether starting a new fast at `newStartMs` would overlap any **completed** fast
 * `[startTime, endTime]` when the new fast is modeled as `[newStartMs, +∞)`.
 *
 * Intersection of ray [newStart, ∞) with closed [s, e] is non-empty iff max(newStart, s) < e
 * (strict end so back-to-back at the same instant is allowed).
 */
export function newFastStartOverlapsCompleted(newStartMs: number, records: FastRecord[]): boolean {
  for (const r of records) {
    if (r.endTime == null) continue;
    const s = Number(r.startTime);
    const e = Number(r.endTime);
    if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) continue;
    if (Math.max(newStartMs, s) < e) return true;
  }
  return false;
}

export function checkNewFastStartDoesNotOverlap(
  newStartMs: number,
  records: FastRecord[],
): LoggingEligibility {
  if (newFastStartOverlapsCompleted(newStartMs, records)) {
    return { ok: false, message: FAST_OVERLAP_MESSAGE };
  }
  return { ok: true };
}
