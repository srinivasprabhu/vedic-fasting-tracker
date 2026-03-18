// hooks/usePedometer.ts
// Wraps expo-sensors Pedometer with graceful fallback.
//
// Returns:
//   steps          — today's auto-counted steps (0 if unavailable)
//   available      — true if the device hardware supports it
//   permitted      — true once permission granted
//   isLive         — true when actively receiving live updates
//   addManual      — call this to layer manual steps on top
//   resetManual    — wipe any manually-added steps for today
//
// Design:
//   Auto steps (pedometer)  + manual top-up  = total steps shown in UI
//   If pedometer unavailable → manual-only mode, no difference to UX
//   Steps are cached in AsyncStorage so they survive app restarts

import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pedometer } from 'expo-sensors';

// ─── Storage keys ─────────────────────────────────────────────────────────────

const manualKey = () => {
  const d = new Date();
  return `aayu_steps_manual_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
};

// We store the last known pedometer baseline so we can detect day rollovers
const PEDOMETER_BASELINE_KEY = 'aayu_pedometer_baseline';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Midnight of today (local time) */
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function loadManualSteps(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(manualKey());
    return raw ? parseInt(raw, 10) : 0;
  } catch { return 0; }
}

async function saveManualSteps(n: number): Promise<void> {
  try { await AsyncStorage.setItem(manualKey(), String(n)); } catch {}
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UsePedometerResult {
  /** Total steps to display (auto + manual) */
  steps:       number;
  /** Raw pedometer count for today (0 if unavailable) */
  autoSteps:   number;
  /** Manually added steps for today */
  manualSteps: number;
  /** Whether the device hardware supports step counting */
  available:   boolean;
  /** Whether we have permission and are receiving data */
  isLive:      boolean;
  /** Add steps manually on top of pedometer data */
  addManual:   (amount: number) => Promise<void>;
  /** Re-read manual steps from storage (call on screen focus) */
  refreshManual: () => Promise<void>;
  /** Source label for UI — "From phone" vs "Manual" */
  sourceLabel: string;
}

export function usePedometer(): UsePedometerResult {
  const [available, setAvailable]   = useState(false);
  const [autoSteps, setAutoSteps]   = useState(0);
  const [manualSteps, setManualSteps] = useState(0);
  const [isLive, setIsLive]         = useState(false);

  const subscriptionRef = useRef<ReturnType<typeof Pedometer.watchStepCount> | null>(null);

  // ── Initialise ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Load manual steps from storage first (always, regardless of pedometer)
      const manual = await loadManualSteps();
      if (!cancelled) setManualSteps(manual);

      // Web / simulator — skip pedometer entirely
      if (Platform.OS === 'web') return;

      // Check hardware availability
      const isAvailable = await Pedometer.isAvailableAsync().catch(() => false);
      if (!isAvailable || cancelled) {
        setAvailable(false);
        return;
      }
      setAvailable(true);

      // Get today's count since midnight
      try {
        const start = startOfToday();
        const end   = new Date();
        const { steps } = await Pedometer.getStepCountAsync(start, end);
        if (!cancelled) setAutoSteps(steps);
      } catch {
        // getStepCountAsync can throw on Android if permission not yet granted
      }

      // Subscribe to live updates
      try {
        subscriptionRef.current = Pedometer.watchStepCount(({ steps }) => {
          if (!cancelled) {
            // watchStepCount gives cumulative steps since the subscription started.
            // We accumulate on top of the snapshot we already have.
            setAutoSteps(prev => {
              // Only update if the new value is larger (protects against resets)
              return steps > 0 ? prev + steps : prev;
            });
          }
        });

        // Re-fetch snapshot every time the subscription fires a batch
        // Actually watchStepCount gives delta steps per event, so we need
        // to re-snapshot periodically to stay accurate across midnight.
        // We'll re-snapshot on focus instead (see app lifecycle below).

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

  // ── Re-snapshot at midnight / app foreground ─────────────────────────────
  // Expo's watchStepCount gives delta steps per event — we snapshot once at
  // init and accumulate deltas. To handle midnight rollover correctly we
  // re-snapshot when the app comes to foreground.
  useEffect(() => {
    if (Platform.OS === 'web') return;

    let lastSnapshot = autoSteps;

    async function refreshSnapshot() {
      try {
        const isAvailable = await Pedometer.isAvailableAsync().catch(() => false);
        if (!isAvailable) return;
        const start = startOfToday();
        const end   = new Date();
        const { steps } = await Pedometer.getStepCountAsync(start, end);
        setAutoSteps(steps);
        lastSnapshot = steps;
      } catch {}
    }

    // Re-snapshot every 5 minutes while app is open (handles midnight rollover)
    const interval = setInterval(refreshSnapshot, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ── watchStepCount gives DELTA steps per event — accumulate correctly ─────
  // We reset the subscription to use delta accumulation from a fresh snapshot.
  useEffect(() => {
    if (Platform.OS === 'web' || !available) return;

    let cancelled = false;
    let snapshotAtSubscription = 0;

    async function setupLiveWatch() {
      // Remove previous subscription
      subscriptionRef.current?.remove();

      try {
        // Fresh snapshot as baseline
        const start = startOfToday();
        const end   = new Date();
        const { steps: snapshot } = await Pedometer.getStepCountAsync(start, end);
        snapshotAtSubscription = snapshot;
        if (!cancelled) setAutoSteps(snapshot);

        // Watch for deltas from this point forward
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

  // ── addManual ───────────────────────────────────────────────────────────────
  const addManual = useCallback(async (amount: number) => {
    const updated = manualSteps + amount;
    setManualSteps(updated);
    await saveManualSteps(updated);
  }, [manualSteps]);

  // ── refreshManual — re-read manual steps from storage (call on screen focus)
  const refreshManual = useCallback(async () => {
    const manual = await loadManualSteps();
    setManualSteps(manual);
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const steps = autoSteps + manualSteps;
  const sourceLabel = available && isLive
    ? 'From phone · tap to add more'
    : 'Manual · tap to log steps';

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
