import { describe, expect, it } from 'vitest';
import type { FastRecord, FastType } from '@/types/fasting';
import {
  classifyEndedFast,
  computeJourneyStreak,
  computeMonthSummary,
  creditsFromEndedFast,
  minPartialHours,
  qualifyingDateKeysFromRecords,
} from '@/utils/journeyModel';

const H = 3600000;

function rec(overrides: Partial<FastRecord> & Pick<FastRecord, 'startTime' | 'endTime' | 'targetDuration'>): FastRecord {
  return {
    id: 'id-1',
    type: 'if_16_8',
    label: '16:8',
    notes: '',
    completed: true,
    ...overrides,
  };
}

describe('classifyEndedFast', () => {
  it('treats end +45m after 16h target as completed when marked completed (grace)', () => {
    const start = new Date(2026, 0, 10, 8, 0, 0).getTime();
    const r = rec({
      startTime: start,
      endTime: start + 16 * H + 45 * 60000,
      targetDuration: 16 * H,
      completed: true,
    });
    expect(classifyEndedFast(r)).toBe('completed');
  });

  it('requires at least 16h for partial on 5:2', () => {
    const start = new Date(2026, 0, 1, 0, 0, 0).getTime();
    const weekly = rec({
      type: 'if_5_2' as FastType,
      label: '5:2',
      startTime: start,
      endTime: start + 15 * H,
      targetDuration: 24 * H,
      completed: false,
    });
    expect(minPartialHours(true)).toBe(16);
    expect(classifyEndedFast(weekly)).toBe('none');
    const ok = { ...weekly, endTime: start + 16 * H };
    expect(classifyEndedFast(ok)).toBe('partial');
  });
});

describe('creditsFromEndedFast (single segment)', () => {
  it('attributes the fast to the local end day (matches Journey bar chart by end date)', () => {
    const start = new Date(2026, 3, 11, 6, 0, 0).getTime(); // Sat Apr 11
    const end = new Date(2026, 3, 12, 6, 0, 0).getTime(); // Sun Apr 12
    const r = rec({
      startTime: start,
      endTime: end,
      targetDuration: 24 * H,
      completed: true,
    });
    const credits = creditsFromEndedFast(r);
    expect(credits).toHaveLength(1);
    expect(credits[0].calendarDayKey).toBe('2026-04-12');
    expect(credits[0].streakDayKey).toBe('2026-04-11');
  });
});

describe('creditsFromEndedFast (extended fasts)', () => {
  it('emits one credit per 24h block on block end local days for 48h', () => {
    const start = new Date(2026, 3, 8, 0, 0, 0).getTime();
    const end = new Date(2026, 3, 10, 0, 0, 0).getTime();
    const r = rec({
      startTime: start,
      endTime: end,
      targetDuration: 48 * H,
      completed: true,
    });
    const credits = creditsFromEndedFast(r);
    const keys = credits.map((c) => c.streakDayKey).sort();
    expect(keys).toEqual(['2026-04-08', '2026-04-09']);
    expect(credits.every((c) => c.kind === 'completed')).toBe(true);
  });
});

describe('computeJourneyStreak', () => {
  it('counts consecutive qualifying days ending today (16:8 cadence)', () => {
    const now = new Date(2026, 3, 10, 12, 0, 0).getTime();
    const rows: FastRecord[] = [];
    // Five ended fasts whose streak days are Apr 6..Apr 10
    for (let i = 0; i < 5; i++) {
      const day = 6 + i;
      const s = new Date(2026, 3, day, 8, 0, 0).getTime();
      rows.push(
        rec({
          id: `f-${day}`,
          startTime: s,
          endTime: s + 16 * H,
          targetDuration: 16 * H,
          completed: true,
        }),
      );
    }
    expect(computeJourneyStreak(rows, now)).toBe(5);
  });

  it('survives one calendar day without a qualifying credit', () => {
    const now = new Date(2026, 3, 10, 12, 0, 0).getTime();
    const apr8 = new Date(2026, 3, 8, 12, 0, 0).getTime();
    const apr10 = new Date(2026, 3, 10, 12, 0, 0).getTime();
    const rows = [
      rec({ id: 'a', startTime: apr8, endTime: apr8 + 16 * H, targetDuration: 16 * H, completed: true }),
      rec({ id: 'b', startTime: apr10, endTime: apr10 + 16 * H, targetDuration: 16 * H, completed: true }),
    ];
    expect(qualifyingDateKeysFromRecords(rows).has('2026-04-09')).toBe(false);
    expect(computeJourneyStreak(rows, now)).toBe(2);
  });

  it('resets after two consecutive days without a qualifying credit', () => {
    const now = new Date(2026, 3, 10, 12, 0, 0).getTime();
    const apr7 = new Date(2026, 3, 7, 12, 0, 0).getTime();
    const apr10 = new Date(2026, 3, 10, 12, 0, 0).getTime();
    const rows = [
      rec({ id: 'a', startTime: apr7, endTime: apr7 + 16 * H, targetDuration: 16 * H, completed: true }),
      rec({ id: 'b', startTime: apr10, endTime: apr10 + 16 * H, targetDuration: 16 * H, completed: true }),
    ];
    expect(computeJourneyStreak(rows, now)).toBe(1);
  });

  it('still counts streak when a non-eating gap sits between qualifying days (5:2-friendly rule)', () => {
    const now = new Date(2026, 3, 10, 12, 0, 0).getTime();
    const mk = (id: string, day: number) => {
      const s = new Date(2026, 3, day, 9, 0, 0).getTime();
      return rec({ id, startTime: s, endTime: s + 16 * H, targetDuration: 16 * H, completed: true });
    };
    const rows = [mk('a', 7), mk('b', 9), mk('c', 10)];
    expect(qualifyingDateKeysFromRecords(rows).has('2026-04-08')).toBe(false);
    expect(computeJourneyStreak(rows, now)).toBe(3);
  });
});

describe('computeMonthSummary', () => {
  it('returns streak aligned with computeJourneyStreak', () => {
    const now = new Date(2026, 3, 10, 12, 0, 0).getTime();
    const rows = [
      rec({
        id: 'x',
        startTime: new Date(2026, 3, 10, 8, 0, 0).getTime(),
        endTime: new Date(2026, 3, 10, 8, 0, 0).getTime() + 16 * H,
        targetDuration: 16 * H,
        completed: true,
      }),
    ];
    const m = computeMonthSummary(rows, 2026, 3, now);
    expect(m.streak).toBe(computeJourneyStreak(rows, now));
  });
});
