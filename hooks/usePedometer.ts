// hooks/usePedometer.ts
// Wraps expo-sensors Pedometer with graceful fallback.
//
// Daily total (auto + manual) is persisted under aayu_steps_day_* (see stepsDayStorage).
// On first open of a new calendar day, prior days are sealed via OS history + manual.

import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
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
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const snapshotRef = useRef<number>(0);

  // ── Helper: take a fresh snapshot from the OS pedometer ──────────────────
  const takeSnapshot = useCallback(async (): Promise<number> => {
    try {
      const start = startOfToday();
      const end = new Date();
      const { steps } = await Pedometer.getStepCountAsync(start, end);
      return steps ?? 0;
    } catch {
      return 0;
    }
  }, []);

  // ── Helper: start the live watch subscription ───────────────────────────
  const startLiveWatch = useCallback(async () => {
    if (Platform.OS === 'web') return;

    subscriptionRef.current?.remove();
    subscriptionRef.current = null;

    try {
      const isAvail = await Pedometer.isAvailableAsync().catch(() => false);
      if (!isAvail) {
        setAvailable(false);
        setIsLive(false);
        return;
      }
      setAvailable(true);

      const snapshot = await takeSnapshot();
      snapshotRef.current = snapshot;
      setAutoSteps(snapshot);

      subscriptionRef.current = Pedometer.watchStepCount(({ steps: delta }) => {
        if (delta > 0) {
          setAutoSteps(snapshotRef.current + delta);
        }
      });
      setIsLive(true);
    } catch {
      setIsLive(false);
    }
  }, [takeSnapshot]);

  // ── Helper: stop the live watch ─────────────────────────────────────────
  const stopLiveWatch = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setIsLive(false);
  }, []);

  // ── Initialise: seal past days + start live watch ───────────────────────
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

      if (!cancelled && Platform.OS !== 'web') {
        await startLiveWatch();
      }
    }

    init();

    return () => {
      cancelled = true;
      stopLiveWatch();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── AppState: pause live watch when backgrounded ────────────────────────
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active' && appStateRef.current !== 'active') {
        void startLiveWatch();
      } else if (nextState !== 'active' && appStateRef.current === 'active') {
        stopLiveWatch();
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [startLiveWatch, stopLiveWatch]);

  // ── Hourly re-snapshot for accuracy (replaces old 5-minute interval) ────
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const interval = setInterval(async () => {
      if (appStateRef.current !== 'active') return;
      try {
        const snapshot = await takeSnapshot();
        snapshotRef.current = snapshot;
        setAutoSteps(snapshot);
      } catch {}
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [takeSnapshot]);

  const steps = autoSteps + manualSteps;

  // ── Persist total (debounced at 30 seconds, was 2 seconds) ──────────────
  useEffect(() => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      persistTimerRef.current = null;
      void saveDayTotal(new Date(), steps);
    }, 30_000);
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, [steps]);

  const addManual = useCallback(async (amount: number) => {
    const updated = manualSteps + amount;
    setManualSteps(updated);
    await saveManualSteps(updated);
    void saveDayTotal(new Date(), autoSteps + updated);
  }, [manualSteps, autoSteps]);

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
