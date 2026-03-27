// components/DailySyncManager.tsx
// Invisible component that syncs daily water + steps to Supabase when
// the app goes to background (or at midnight if app stays open).
//
// Mount inside AuthProvider + UserProfileProvider so it has access to user context.

import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { syncDailySummary } from '@/lib/sync';

const LAST_SYNC_KEY = 'aayu_daily_sync_last';

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function waterKeyForDate(d: Date): string {
  return `aayu_water_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
}

function stepsKeyForDate(d: Date): string {
  return `aayu_steps_day_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
}

function stepsManualKeyForDate(d: Date): string {
  return `aayu_steps_manual_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
}

async function readTodayWater(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(waterKeyForDate(new Date()));
    if (!raw) return 0;
    const entries: { ml: number }[] = JSON.parse(raw);
    return entries.reduce((s, e) => s + e.ml, 0);
  } catch { return 0; }
}

async function readTodaySteps(): Promise<number> {
  const d = new Date();
  try {
    // Try unified key first
    const unified = await AsyncStorage.getItem(stepsKeyForDate(d));
    if (unified) return parseInt(unified, 10) || 0;
    // Fallback to manual key
    const manual = await AsyncStorage.getItem(stepsManualKeyForDate(d));
    if (manual) return parseInt(manual, 10) || 0;
    return 0;
  } catch { return 0; }
}

async function shouldSync(): Promise<boolean> {
  try {
    const last = await AsyncStorage.getItem(LAST_SYNC_KEY);
    if (!last) return true;
    // Parse last sync: "YYYY-MM-DD:HH"
    const [lastDate, lastHour] = last.split(':');
    const now = new Date();
    const currentDate = todayDateStr();
    const currentHour = String(now.getHours());
    // Sync if: different day, or at least 2 hours since last sync
    if (lastDate !== currentDate) return true;
    if (Math.abs(parseInt(currentHour) - parseInt(lastHour || '0')) >= 2) return true;
    return false;
  } catch { return true; }
}

async function markSynced(): Promise<void> {
  try {
    const now = new Date();
    await AsyncStorage.setItem(LAST_SYNC_KEY, `${todayDateStr()}:${now.getHours()}`);
  } catch {}
}

export function DailySyncManager() {
  const { user, isAuthenticated } = useAuth();
  const appState = useRef(AppState.currentState);
  const midnightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSync = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;

    const canSync = await shouldSync();
    if (!canSync) return;

    const date = todayDateStr();
    const waterMl = await readTodayWater();
    const steps = await readTodaySteps();

    // Only sync if there's meaningful data
    if (waterMl === 0 && steps === 0) return;

    try {
      await syncDailySummary(user.id, date, waterMl, steps);
      await markSynced();
      if (__DEV__) console.log(`[DailySync] Synced ${date}: water=${waterMl}ml, steps=${steps}`);
    } catch (e) {
      if (__DEV__) console.warn('[DailySync] Failed:', e);
    }
  }, [isAuthenticated, user?.id]);

  // Also sync yesterday if we missed it (app was closed overnight)
  const syncYesterdayIfMissed = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yDateStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    let waterMl = 0;
    try {
      const raw = await AsyncStorage.getItem(waterKeyForDate(yesterday));
      if (raw) {
        const entries: { ml: number }[] = JSON.parse(raw);
        waterMl = entries.reduce((s, e) => s + e.ml, 0);
      }
    } catch {}

    let steps = 0;
    try {
      const unified = await AsyncStorage.getItem(stepsKeyForDate(yesterday));
      if (unified) steps = parseInt(unified, 10) || 0;
      else {
        const manual = await AsyncStorage.getItem(stepsManualKeyForDate(yesterday));
        if (manual) steps = parseInt(manual, 10) || 0;
      }
    } catch {}

    if (waterMl === 0 && steps === 0) return;

    try {
      await syncDailySummary(user.id, yDateStr, waterMl, steps);
      if (__DEV__) console.log(`[DailySync] Synced yesterday ${yDateStr}: water=${waterMl}ml, steps=${steps}`);
    } catch {}
  }, [isAuthenticated, user?.id]);

  // Listen for app going to background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      // Sync when app goes from active → background/inactive
      if (appState.current === 'active' && (nextState === 'background' || nextState === 'inactive')) {
        performSync();
      }
      // Also sync yesterday when app comes back to foreground (catch overnight gap)
      if (nextState === 'active' && appState.current !== 'active') {
        syncYesterdayIfMissed();
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [performSync, syncYesterdayIfMissed]);

  // Schedule a midnight sync if app stays open past midnight
  useEffect(() => {
    function scheduleNextMidnight() {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setDate(midnight.getDate() + 1);
      midnight.setHours(0, 0, 10, 0); // 10 seconds past midnight
      const msUntilMidnight = midnight.getTime() - now.getTime();

      midnightTimer.current = setTimeout(() => {
        // Sync yesterday's data (which just ended)
        syncYesterdayIfMissed();
        // Schedule the next one
        scheduleNextMidnight();
      }, msUntilMidnight);
    }

    if (isAuthenticated && user?.id) {
      scheduleNextMidnight();
    }

    return () => {
      if (midnightTimer.current) clearTimeout(midnightTimer.current);
    };
  }, [isAuthenticated, user?.id, syncYesterdayIfMissed]);

  // Initial sync on mount (catches app restart scenarios)
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Small delay to not compete with other startup tasks
      const timer = setTimeout(() => {
        syncYesterdayIfMissed();
        performSync();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user?.id]);

  // Invisible component — renders nothing
  return null;
}
