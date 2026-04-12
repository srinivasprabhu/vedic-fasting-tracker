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
