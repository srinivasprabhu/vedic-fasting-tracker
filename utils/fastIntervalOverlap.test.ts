import type { FastRecord, FastType } from '@/types/fasting';
import { describe, expect, it } from 'vitest';

import {
  checkNewFastStartDoesNotOverlap,
  newFastStartOverlapsCompleted,
} from '@/utils/fastIntervalOverlap';

const T = 'if_16_8' as FastType;

function rec(
  start: number,
  end: number | null,
  id = 'a',
): FastRecord {
  return {
    id,
    type: T,
    label: '16:8',
    startTime: start,
    endTime: end,
    targetDuration: 16 * 3600000,
    completed: true,
    notes: '',
  };
}

describe('newFastStartOverlapsCompleted', () => {
  it('returns true when new start falls before an existing fast ends', () => {
    const r = rec(100, 500);
    expect(newFastStartOverlapsCompleted(200, [r])).toBe(true);
  });

  it('returns false when new start equals existing end (back-to-back)', () => {
    const r = rec(100, 500);
    expect(newFastStartOverlapsCompleted(500, [r])).toBe(false);
  });

  it('returns false when new start is after existing end', () => {
    const r = rec(100, 500);
    expect(newFastStartOverlapsCompleted(501, [r])).toBe(false);
  });

  it('allows same calendar day after previous fast ended (5pm vs 12:07pm same day)', () => {
    const start = new Date(2026, 3, 11, 10, 1, 0, 0).getTime();
    const end = new Date(2026, 3, 12, 12, 7, 0, 0).getTime();
    const r = rec(start, end);
    const fivePm = new Date(2026, 3, 12, 17, 0, 0, 0).getTime();
    expect(newFastStartOverlapsCompleted(fivePm, [r])).toBe(false);
  });

  it('blocks when new start is same day but still inside previous window (e.g. 5am vs end 12:07pm)', () => {
    const start = new Date(2026, 3, 11, 10, 1, 0, 0).getTime();
    const end = new Date(2026, 3, 12, 12, 7, 0, 0).getTime();
    const r = rec(start, end);
    const fiveAm = new Date(2026, 3, 12, 5, 0, 0, 0).getTime();
    expect(newFastStartOverlapsCompleted(fiveAm, [r])).toBe(true);
  });

  it('ignores active (unended) records', () => {
    const r = rec(100, null);
    expect(newFastStartOverlapsCompleted(200, [r])).toBe(false);
  });

  it('matches checkNewFastStartDoesNotOverlap', () => {
    const r = rec(100, 500);
    expect(checkNewFastStartDoesNotOverlap(200, [r]).ok).toBe(false);
    expect(checkNewFastStartDoesNotOverlap(500, [r]).ok).toBe(true);
  });
});
