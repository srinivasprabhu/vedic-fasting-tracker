/**
 * useHealthSync — Pro-only hook that syncs health data from Apple Health / Google Health Connect.
 *
 * Reads: steps (today), latest weight, active energy.
 * Syncs: on mount (3 s delay) + every 60 minutes while app is foregrounded.
 * Writes synced data into existing storage (stepsDayStorage, weight log).
 *
 * Battery-conscious:
 * - Only polls every 60 minutes (not continuously)
 * - Pauses when app is backgrounded (AppState-aware)
 * - No subscriptions/observers — pure point-in-time reads
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveDayTotal, loadDayTotal } from '@/utils/stepsDayStorage';
import { HEALTH_SYNC_ENABLED_KEY, HEALTH_SYNC_LAST_KEY } from '@/constants/storageKeys';

// iOS
import {
  isHealthKitAvailable,
  requestHealthKitPermissions,
  getHealthKitStepsToday,
  getHealthKitLatestWeight,
  getHealthKitActiveEnergy,
} from '@/lib/healthKit';

// Android
import {
  isHealthConnectAvailable,
  requestHealthConnectPermissions,
  getHealthConnectStepsToday,
  getHealthConnectLatestWeight,
  getHealthConnectActiveEnergy,
} from '@/lib/healthConnect';

const WEIGHT_KEY = 'aayu_weight_log';

/** Minimum interval between syncs (ms). */
const SYNC_INTERVAL_MS = 60 * 60 * 1000; // 60 minutes

export type HealthSyncStatus = 'idle' | 'connecting' | 'syncing' | 'connected' | 'denied' | 'unavailable';

export interface HealthSyncData {
  steps: number | null;
  latestWeightKg: number | null;
  activeEnergyKcal: number | null;
  lastSyncTime: number | null;
}

export interface UseHealthSyncResult {
  /** Current connection status */
  status: HealthSyncStatus;
  /** Whether the platform health store is available at all */
  isAvailable: boolean;
  /** Whether the user has enabled health sync */
  isEnabled: boolean;
  /** Synced data (null values = not yet synced or unavailable) */
  data: HealthSyncData;
  /** Connect and request permissions (user-initiated) */
  connect: () => Promise<boolean>;
  /** Disconnect — stops syncing and clears the enabled flag */
  disconnect: () => Promise<void>;
  /** Force a manual sync now */
  syncNow: () => Promise<void>;
  /** Platform label for UI */
  platformLabel: string;
}

export function useHealthSync(isProUser: boolean): UseHealthSyncResult {
  const [status, setStatus] = useState<HealthSyncStatus>('idle');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [data, setData] = useState<HealthSyncData>({
    steps: null,
    latestWeightKg: null,
    activeEnergyKcal: null,
    lastSyncTime: null,
  });

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const platformLabel = Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect';

  // ── Check availability on mount ─────────────────────────────────────────
  useEffect(() => {
    async function checkAvailability() {
      if (Platform.OS === 'ios') {
        setIsAvailable(isHealthKitAvailable());
      } else if (Platform.OS === 'android') {
        const avail = await isHealthConnectAvailable();
        setIsAvailable(avail);
      } else {
        setIsAvailable(false);
      }
    }
    void checkAvailability();
  }, []);

  // ── Load persisted enabled state ────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(HEALTH_SYNC_ENABLED_KEY).then((v) => {
      if (v === 'true') {
        setIsEnabled(true);
        setStatus('connected');
      }
    });
  }, []);

  // ── Core sync function ──────────────────────────────────────────────────
  const performSync = useCallback(async () => {
    if (!isProUser || !isEnabled) return;

    // Throttle: don't sync more often than SYNC_INTERVAL_MS
    try {
      const lastSync = await AsyncStorage.getItem(HEALTH_SYNC_LAST_KEY);
      if (lastSync) {
        const elapsed = Date.now() - parseInt(lastSync, 10);
        if (elapsed < SYNC_INTERVAL_MS) return;
      }
    } catch {}

    setStatus('syncing');

    try {
      let steps = 0;
      let latestWeightKg: number | null = null;
      let activeEnergyKcal = 0;

      if (Platform.OS === 'ios') {
        steps = await getHealthKitStepsToday();
        const weight = await getHealthKitLatestWeight();
        latestWeightKg = weight?.kg ?? null;
        activeEnergyKcal = await getHealthKitActiveEnergy();
      } else if (Platform.OS === 'android') {
        steps = await getHealthConnectStepsToday();
        const weight = await getHealthConnectLatestWeight();
        latestWeightKg = weight?.kg ?? null;
        activeEnergyKcal = await getHealthConnectActiveEnergy();
      }

      // ── Merge steps: keep the higher of pedometer vs health store ───────
      if (steps > 0) {
        const existingSteps = await loadDayTotal(new Date());
        if (steps > existingSteps) {
          await saveDayTotal(new Date(), steps);
        }
      }

      // ── Merge weight: only add if no entry exists for today ─────────────
      if (latestWeightKg !== null && latestWeightKg > 0) {
        try {
          const raw = await AsyncStorage.getItem(WEIGHT_KEY);
          const log: { id: string; kg: number; date: string; time: number }[] = raw
            ? JSON.parse(raw)
            : [];
          const today = new Date().toISOString().slice(0, 10);
          const hasToday = log.some((e) => e.date === today);

          if (!hasToday) {
            const entry = {
              id: `w_health_${Date.now()}`,
              kg: latestWeightKg,
              date: today,
              time: Date.now(),
            };
            const updated = [entry, ...log].slice(0, 90);
            await AsyncStorage.setItem(WEIGHT_KEY, JSON.stringify(updated));
          }
        } catch {}
      }

      const now = Date.now();
      await AsyncStorage.setItem(HEALTH_SYNC_LAST_KEY, String(now));

      setData({
        steps: steps > 0 ? steps : null,
        latestWeightKg,
        activeEnergyKcal: activeEnergyKcal > 0 ? activeEnergyKcal : null,
        lastSyncTime: now,
      });
      setStatus('connected');
    } catch (e) {
      if (__DEV__) console.warn('[HealthSync] Sync error:', e);
      setStatus('connected'); // Don't show error state for transient failures
    }
  }, [isProUser, isEnabled]);

  // ── Auto-sync on mount + hourly (only when foregrounded) ────────────────
  useEffect(() => {
    if (!isProUser || !isEnabled) {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      return;
    }

    const initialTimer = setTimeout(() => {
      void performSync();
    }, 3000);

    syncIntervalRef.current = setInterval(() => {
      if (appStateRef.current === 'active') {
        void performSync();
      }
    }, SYNC_INTERVAL_MS);

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active' && appStateRef.current !== 'active') {
        void performSync();
      }
      appStateRef.current = nextState;
    });

    return () => {
      clearTimeout(initialTimer);
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      subscription.remove();
    };
  }, [isProUser, isEnabled, performSync]);

  // ── Connect (user-initiated) ────────────────────────────────────────────
  const connect = useCallback(async (): Promise<boolean> => {
    if (!isProUser) return false;

    // Hard-check availability before even trying
    if (!isAvailable) {
      if (__DEV__) {
        console.warn(
          '[useHealthSync] Not available. Platform:',
          Platform.OS,
          'isAvailable state:',
          isAvailable,
        );
      }
      setStatus('unavailable');
      return false;
    }

    setStatus('connecting');

    let granted = false;
    if (Platform.OS === 'ios') {
      granted = await requestHealthKitPermissions();
    } else if (Platform.OS === 'android') {
      granted = await requestHealthConnectPermissions();
    }

    if (granted) {
      setIsEnabled(true);
      setStatus('connected');
      await AsyncStorage.setItem(HEALTH_SYNC_ENABLED_KEY, 'true');
      await AsyncStorage.removeItem(HEALTH_SYNC_LAST_KEY);
      void performSync();
      return true;
    } else {
      setStatus('denied');
      return false;
    }
  }, [isProUser, isAvailable, performSync]);

  // ── Disconnect ──────────────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    setIsEnabled(false);
    setStatus('idle');
    setData({
      steps: null,
      latestWeightKg: null,
      activeEnergyKcal: null,
      lastSyncTime: null,
    });
    await AsyncStorage.removeItem(HEALTH_SYNC_ENABLED_KEY);
    await AsyncStorage.removeItem(HEALTH_SYNC_LAST_KEY);
  }, []);

  // ── Manual sync ─────────────────────────────────────────────────────────
  const syncNow = useCallback(async () => {
    await AsyncStorage.removeItem(HEALTH_SYNC_LAST_KEY);
    await performSync();
  }, [performSync]);

  return {
    status,
    isAvailable,
    isEnabled,
    data,
    connect,
    disconnect,
    syncNow,
    platformLabel,
  };
}
