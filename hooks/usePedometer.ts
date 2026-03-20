// hooks/usePedometer.ts
// Wraps expo-sensors Pedometer with graceful fallback.
//
// Daily total (auto + manual) is persisted under aayu_steps_day_* (see stepsDayStorage).
// On first open of a new calendar day, prior days are sealed via OS history + manual.

import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pedometer } from 'expo-sensors';
import {
  manualStepsKey,
  saveDayTotal,
  finalizePastStepDaysSinceLastOpen,
} from '@/utils/stepsDayStorage';

/** Midnight of today (local time) */
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function loadManualSteps(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(manualStepsKey(new Date()));
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

async function saveManualSteps(n: number): Promise<void> {
  try {
    await AsyncStorage.setItem(manualStepsKey(new Date()), String(n));
  } catch {}
}

export interface UsePedometerResult {
  steps: number;
  autoSteps: number;
  manualSteps: number;
  available: boolean;
  isLive: boolean;
  addManual: (amount: number) => Promise<void>;
  refreshManual: () => Promise<void>;
  sourceLabel: string;
}

export function usePedometer(): UsePedometerResult {
  const [available, setAvailable] = useState(false);
  const [autoSteps, setAutoSteps] = useState(0);
  const [manualSteps, setManualSteps] = useState(0);
  const [isLive, setIsLive] = useState(false);

  const subscriptionRef = useRef<ReturnType<typeof Pedometer.watchStepCount> | null>(null);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Initialise + seal past days ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      await finalizePastStepDaysSinceLastOpen(async (start, end) => {
        if (Platform.OS === 'web') return 0;
        try {
          const ok = await Pedometer.isAvailableAsync().catch(() => false);
          if (!ok) return 0;
          const { steps } = await Pedometer.getStepCountAsync(start, end);
          return steps ?? 0;
        } catch {
          return 0;
        }
      });

      const manual = await loadManualSteps();
      if (!cancelled) setManualSteps(manual);

      if (Platform.OS === 'web') return;

      const isAvailable = await Pedometer.isAvailableAsync().catch(() => false);
      if (!isAvailable || cancelled) {
        setAvailable(false);
        return;
      }
      setAvailable(true);

      try {
        const start = startOfToday();
        const end = new Date();
        const { steps } = await Pedometer.getStepCountAsync(start, end);
        if (!cancelled) setAutoSteps(steps);
      } catch {}

      try {
        subscriptionRef.current = Pedometer.watchStepCount(({ steps }) => {
          if (!cancelled) {
            setAutoSteps(prev => (steps > 0 ? prev + steps : prev));
          }
        });
        if (!cancelled) setIsLive(true);
      } catch {
        setIsLive(false);
      }
    }

    init();

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, []);

  // ── Re-snapshot every 5 minutes (midnight rollover while app open) ─────────
  useEffect(() => {
    if (Platform.OS === 'web') return;

    async function refreshSnapshot() {
      try {
        const isAvailable = await Pedometer.isAvailableAsync().catch(() => false);
        if (!isAvailable) return;
        const start = startOfToday();
        const end = new Date();
        const { steps } = await Pedometer.getStepCountAsync(start, end);
        setAutoSteps(steps);
      } catch {}
    }

    const interval = setInterval(refreshSnapshot, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Live watch with correct delta handling ──────────────────────────────────
  useEffect(() => {
    if (Platform.OS === 'web' || !available) return;

    let cancelled = false;
    let snapshotAtSubscription = 0;

    async function setupLiveWatch() {
      subscriptionRef.current?.remove();

      try {
        const start = startOfToday();
        const end = new Date();
        const { steps: snapshot } = await Pedometer.getStepCountAsync(start, end);
        snapshotAtSubscription = snapshot;
        if (!cancelled) setAutoSteps(snapshot);

        subscriptionRef.current = Pedometer.watchStepCount(({ steps: delta }) => {
          if (!cancelled && delta > 0) {
            setAutoSteps(snapshotAtSubscription + delta);
          }
        });

        if (!cancelled) setIsLive(true);
      } catch {
        if (!cancelled) setIsLive(false);
      }
    }

    setupLiveWatch();

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [available]);

  const steps = autoSteps + manualSteps;

  // ── Persist auto + manual total for today (debounced) ─────────────────────
  useEffect(() => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      persistTimerRef.current = null;
      void saveDayTotal(new Date(), steps);
    }, 2000);
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, [steps]);

  const addManual = useCallback(async (amount: number) => {
    const updated = manualSteps + amount;
    setManualSteps(updated);
    await saveManualSteps(updated);
  }, [manualSteps]);

  const refreshManual = useCallback(async () => {
    const manual = await loadManualSteps();
    setManualSteps(manual);
  }, []);

  const sourceLabel =
    available && isLive ? 'From phone · tap to add more' : 'Manual · tap to log steps';

  return {
    steps,
    autoSteps,
    manualSteps,
    available,
    isLive,
    addManual,
    refreshManual,
    sourceLabel,
  };
}
