import { describe, expect, it } from 'vitest';
import { requiresGentle12_12, selectIFProtocol } from '@/utils/calculatePlan';

describe('requiresGentle12_12', () => {
  it('is false for none only', () => {
    expect(requiresGentle12_12(['none'], {})).toBe(false);
  });

  it('is false when concerns and flags are empty', () => {
    expect(requiresGentle12_12(undefined, undefined)).toBe(false);
    expect(requiresGentle12_12([], undefined)).toBe(false);
  });

  it('is true when any concern is not none', () => {
    expect(requiresGentle12_12(['diabetes'], undefined)).toBe(true);
  });

  it('is true when any safety flag is set', () => {
    expect(requiresGentle12_12(['none'], { pregnant: true })).toBe(true);
    expect(requiresGentle12_12(undefined, { fastingMedications: true })).toBe(true);
  });
});

describe('selectIFProtocol', () => {
  it('uses 12:12 when underweight (BMI < 18.5)', () => {
    const p = selectIFProtocol('weight_loss', 'experienced', 17.5, undefined, undefined);
    expect(p.fastLabel).toBe('12:12');
  });

  it('uses 12:12 for a real health concern', () => {
    const p = selectIFProtocol('energy', 'beginner', 22, ['diabetes'], undefined);
    expect(p.fastLabel).toBe('12:12');
  });

  it('does not force 12:12 for none only', () => {
    const p = selectIFProtocol('energy', 'beginner', 22, ['none'], undefined);
    expect(p.fastLabel).toBe('14:10');
  });

  it('uses 12:12 when a safety flag is set', () => {
    const p = selectIFProtocol('energy', 'beginner', 22, ['none'], { pregnant: true });
    expect(p.fastLabel).toBe('12:12');
  });

  it('uses 14:10 when BMI ≥ 35 (before weight_loss level rules)', () => {
    const p = selectIFProtocol('weight_loss', 'experienced', 36, undefined, undefined);
    expect(p.fastLabel).toBe('14:10');
  });

  it('maps weight_loss levels to 12:12 / 16:8 / 18:6', () => {
    expect(selectIFProtocol('weight_loss', 'beginner', 24, undefined, undefined).fastLabel).toBe('12:12');
    expect(selectIFProtocol('weight_loss', 'intermediate', 24, undefined, undefined).fastLabel).toBe('16:8');
    expect(selectIFProtocol('weight_loss', 'experienced', 24, undefined, undefined).fastLabel).toBe('18:6');
  });

  it('uses 14:10 for energy at beginner', () => {
    expect(selectIFProtocol('energy', 'beginner', 22, undefined, undefined).fastLabel).toBe('14:10');
  });

  it('uses 14:10 for spiritual', () => {
    expect(selectIFProtocol('spiritual', 'beginner', 22, undefined, undefined).fastLabel).toBe('14:10');
  });

  it('uses 14:10 when purpose is undefined', () => {
    expect(selectIFProtocol(undefined, 'beginner', 22, undefined, undefined).fastLabel).toBe('14:10');
  });
});
