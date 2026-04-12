import type { FastRecord } from '@/types/fasting';

import type { LoggingEligibility } from '@/utils/loggingEligibility';

/** User-visible copy when a new start would overlap an existing completed fast. */
export const FAST_OVERLAP_MESSAGE =
  'A fast already covers this time. You cannot log a second fast in the same period.';

/**
 * Whether starting a new fast at `newStartMs` would overlap any **completed** fast
 * `[startTime, endTime]` when the new fast is modeled as `[newStartMs, +∞)`.
 *
 * Equivalent to: exists r with endTime set such that `newStartMs < r.endTime`
 * (open-ended new interval intersects a past closed interval).
 */
export function newFastStartOverlapsCompleted(newStartMs: number, records: FastRecord[]): boolean {
  for (const r of records) {
    if (r.endTime === null) continue;
    if (newStartMs < r.endTime) return true;
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
