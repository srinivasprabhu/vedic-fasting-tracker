// hooks/useTrendData.ts
// Loads historical data for fasting, water, and weight trends.
// Returns arrays of { date, value } for each metric over the requested range.

import { useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFasting } from '@/contexts/FastingContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { toLocalDateString } from '@/utils/analytics-helpers';

export type TimeRange = 'week' | 'month' | 'year';

export interface TrendPoint {
  date:  string;   // YYYY-MM-DD
  label: string;   // display label (e.g. "Mon", "Mar 5", "Jan")
  value: number;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getDaysInRange(range: TimeRange): Date[] {
  const now = new Date();
  const dates: Date[] = [];

  if (range === 'week') {
    const day = now.getDay();
    const daysFromMonday = day === 0 ? 6 : day - 1;
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - daysFromMonday + i);
      d.setHours(0, 0, 0, 0);
      dates.push(d);
    }
  } else if (range === 'month') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      dates.push(d);
    }
  } else {
    // Year: group by month (last 12 months)
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      dates.push(d);
    }
  }

  return dates;
}

function formatLabel(date: Date, range: TimeRange): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (range === 'week') return days[date.getDay()];
  if (range === 'month') return `${date.getDate()}`;
  return months[date.getMonth()];
}

function waterKeyForDate(d: Date): string {
  return `aayu_water_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
}

function stepsKeyForDate(d: Date): string {
  return `aayu_steps_manual_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTrendData(range: TimeRange, todayStepsOverride?: number) {
  const { completedRecords } = useFasting();
  const { profile } = useUserProfile();

  const [waterData, setWaterData]   = useState<TrendPoint[]>([]);
  const [weightData, setWeightData] = useState<TrendPoint[]>([]);
  const [stepsData, setStepsData]   = useState<TrendPoint[]>([]);
  const [isLoading, setIsLoading]   = useState(true);

  // ── Fasting data (from context, always available) ──────────────────────────

  const fastingData: TrendPoint[] = useMemo(() => {
    const dates = getDaysInRange(range);

    if (range === 'year') {
      // Group by month
      return dates.map(monthDate => {
        const y = monthDate.getFullYear();
        const m = monthDate.getMonth();
        const monthRecords = completedRecords.filter(r => {
          const rd = new Date(r.endTime ?? r.startTime);
          return rd.getFullYear() === y && rd.getMonth() === m;
        });
        const totalHours = monthRecords.reduce((sum, r) => {
          return sum + ((r.endTime ?? 0) - r.startTime) / 3600000;
        }, 0);
        return {
          date: toLocalDateString(monthDate),
          label: formatLabel(monthDate, range),
          value: Math.round(totalHours * 10) / 10,
        };
      });
    }

    // Week or Month: group by day
    return dates.map(d => {
      const dateStr = toLocalDateString(d);
      const dayRecords = completedRecords.filter(r => {
        const rDate = toLocalDateString(r.endTime ?? r.startTime);
        return rDate === dateStr;
      });
      const totalHours = dayRecords.reduce((sum, r) => {
        return sum + ((r.endTime ?? 0) - r.startTime) / 3600000;
      }, 0);
      return {
        date: dateStr,
        label: formatLabel(d, range),
        value: Math.round(totalHours * 10) / 10,
      };
    });
  }, [completedRecords, range]);

  // ── Water + Weight data (from AsyncStorage) ────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const dates = getDaysInRange(range);

      // Water
      if (range === 'year') {
        // For year view, sum daily water per month
        // We only have per-day keys, so load last 365 days and aggregate
        const now = new Date();
        const dailyWater: Record<string, number> = {};

        const waterPromises = Array.from({ length: 365 }, (_, i) => {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const key = waterKeyForDate(d);
          const dateStr = toLocalDateString(d);
          return AsyncStorage.getItem(key).then(raw => {
            if (raw) {
              try {
                const entries: { ml: number }[] = JSON.parse(raw);
                dailyWater[dateStr] = entries.reduce((s, e) => s + e.ml, 0);
              } catch {}
            }
          }).catch(() => {});
        });

        await Promise.all(waterPromises);

        const waterPoints: TrendPoint[] = dates.map(monthDate => {
          const y = monthDate.getFullYear();
          const m = monthDate.getMonth();
          let total = 0;
          let count = 0;
          Object.entries(dailyWater).forEach(([dateStr, ml]) => {
            const [dy, dm] = dateStr.split('-').map(Number);
            if (dy === y && dm - 1 === m) {
              total += ml;
              count++;
            }
          });
          return {
            date: toLocalDateString(monthDate),
            label: formatLabel(monthDate, range),
            value: count > 0 ? Math.round(total / count) : 0, // avg daily for the month
          };
        });

        if (!cancelled) setWaterData(waterPoints);
      } else {
        // Week or Month: load each day
        const waterPromises = dates.map(async d => {
          const key = waterKeyForDate(d);
          try {
            const raw = await AsyncStorage.getItem(key);
            if (raw) {
              const entries: { ml: number }[] = JSON.parse(raw);
              return entries.reduce((s, e) => s + e.ml, 0);
            }
          } catch {}
          return 0;
        });

        const waterValues = await Promise.all(waterPromises);
        const waterPoints: TrendPoint[] = dates.map((d, i) => ({
          date: toLocalDateString(d),
          label: formatLabel(d, range),
          value: waterValues[i],
        }));

        if (!cancelled) setWaterData(waterPoints);
      }

      // Weight
      try {
        const raw = await AsyncStorage.getItem('aayu_weight_log');
        const log: { kg: number; date: string; time: number }[] = raw ? JSON.parse(raw) : [];

        if (range === 'year') {
          const weightPoints: TrendPoint[] = dates.map(monthDate => {
            const y = monthDate.getFullYear();
            const m = monthDate.getMonth();
            const monthEntries = log.filter(e => {
              const ed = new Date(e.time);
              return ed.getFullYear() === y && ed.getMonth() === m;
            });
            // Use latest entry for the month
            const latest = monthEntries.sort((a, b) => b.time - a.time)[0];
            return {
              date: toLocalDateString(monthDate),
              label: formatLabel(monthDate, range),
              value: latest ? Math.round(latest.kg * 10) / 10 : 0,
            };
          });
          if (!cancelled) setWeightData(weightPoints);
        } else {
          const weightPoints: TrendPoint[] = dates.map(d => {
            const dateStr = toLocalDateString(d);
            const dayEntry = log.find(e => e.date === dateStr);
            return {
              date: dateStr,
              label: formatLabel(d, range),
              value: dayEntry ? Math.round(dayEntry.kg * 10) / 10 : 0,
            };
          });
          if (!cancelled) setWeightData(weightPoints);
        }
      } catch {
        if (!cancelled) setWeightData([]);
      }

      // Steps
      if (range === 'year') {
        const now = new Date();
        const dailySteps: Record<string, number> = {};

        const stepsPromises = Array.from({ length: 365 }, (_, i) => {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const key = stepsKeyForDate(d);
          const dateStr = toLocalDateString(d);
          return AsyncStorage.getItem(key).then(raw => {
            if (raw) dailySteps[dateStr] = parseInt(raw, 10) || 0;
          }).catch(() => {});
        });

        await Promise.all(stepsPromises);

        const stepsPoints: TrendPoint[] = dates.map(monthDate => {
          const y = monthDate.getFullYear();
          const m = monthDate.getMonth();
          let total = 0;
          let count = 0;
          Object.entries(dailySteps).forEach(([dateStr, steps]) => {
            const [dy, dm] = dateStr.split('-').map(Number);
            if (dy === y && dm - 1 === m && steps > 0) {
              total += steps;
              count++;
            }
          });
          return {
            date: toLocalDateString(monthDate),
            label: formatLabel(monthDate, range),
            value: count > 0 ? Math.round(total / count) : 0,
          };
        });

        if (!cancelled) setStepsData(stepsPoints);
      } else {
        const stepsPromises = dates.map(async d => {
          const key = stepsKeyForDate(d);
          try {
            const raw = await AsyncStorage.getItem(key);
            return raw ? parseInt(raw, 10) || 0 : 0;
          } catch { return 0; }
        });

        const stepsValues = await Promise.all(stepsPromises);
        const stepsPoints: TrendPoint[] = dates.map((d, i) => ({
          date: toLocalDateString(d),
          label: formatLabel(d, range),
          value: stepsValues[i],
        }));

        // Override today's value with live pedometer data if available
        if (todayStepsOverride != null && todayStepsOverride > 0) {
          const todayStr = toLocalDateString(new Date());
          const updated = stepsPoints.map(p =>
            p.date === todayStr ? { ...p, value: todayStepsOverride } : p
          );
          if (!cancelled) setStepsData(updated);
        } else {
          if (!cancelled) setStepsData(stepsPoints);
        }
      }

      if (!cancelled) setIsLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [range]);

  // Update today's steps with live pedometer data without re-running full load
  useEffect(() => {
    if (todayStepsOverride == null || todayStepsOverride <= 0) return;
    const todayStr = toLocalDateString(new Date());
    setStepsData(prev => prev.map(p =>
      p.date === todayStr && todayStepsOverride > p.value
        ? { ...p, value: todayStepsOverride }
        : p
    ));
  }, [todayStepsOverride]);

  // Targets from user plan
  const waterTarget = profile?.plan?.dailyWaterMl ?? 2500;
  const stepsTarget = profile?.plan?.dailySteps ?? 8000;
  const goalWeightKg = profile?.goalWeightKg ?? null;
  const startingWeightKg = profile?.startingWeightKg ?? profile?.currentWeightKg ?? null;

  return {
    fastingData,
    waterData,
    weightData,
    stepsData,
    waterTarget,
    stepsTarget,
    goalWeightKg,
    startingWeightKg,
    isLoading,
  };
}
