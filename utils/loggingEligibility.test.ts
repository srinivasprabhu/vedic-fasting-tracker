import { describe, expect, it } from 'vitest';

import {
  checkFastEndAfterStart,
  checkLoggingTimestamp,
  oldestAllowedLocalDayStartMs,
} from '@/utils/loggingEligibility';

describe('oldestAllowedLocalDayStartMs', () => {
  it('is start of local day 6 days before anchor', () => {
    const anchor = new Date(2026, 3, 12, 15, 30, 0).getTime();
    const min = oldestAllowedLocalDayStartMs(anchor);
    const expected = new Date(2026, 3, 6, 0, 0, 0, 0).getTime();
    expect(min).toBe(expected);
  });
});

describe('checkLoggingTimestamp + oldestAllowed', () => {
  it('allows timestamps on oldest allowed day', () => {
    const anchor = new Date(2026, 3, 12, 12, 0, 0).getTime();
    const oldest = oldestAllowedLocalDayStartMs(anchor);
    expect(checkLoggingTimestamp(oldest, anchor).ok).toBe(true);
  });
});

describe('checkFastEndAfterStart', () => {
  it('rejects end equal to start', () => {
    const t = Date.now();
    expect(checkFastEndAfterStart(t, t).ok).toBe(false);
  });

  it('rejects end before start', () => {
    expect(checkFastEndAfterStart(100, 200).ok).toBe(false);
  });

  it('accepts end after start', () => {
    expect(checkFastEndAfterStart(200, 100).ok).toBe(true);
  });
});
