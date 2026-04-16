# Aayu — Apple Health + Google Health Connect Integration — Cursor Prompt

## Overview

Integrate Apple HealthKit (iOS) and Google Health Connect (Android) as a **Pro-only feature**. The integration syncs steps, weight, and active energy burned from the platform health stores into Aayu. Data flows **one direction only** — read from health store into the app. Aayu does NOT write to the health stores.

**Design principles:**
1. Pro-only — gated behind `isProUser` from `useRevenueCat()`
2. Battery-conscious — sync on app open + hourly, NOT continuously
3. Graceful degradation — if health permissions denied or unavailable, all existing functionality continues to work exactly as before
4. Platform-safe — iOS code never runs on Android and vice versa

---

## Tech stack context

- **React Native** with **Expo SDK 54** (managed workflow with dev client)
- **Expo Router v6** for navigation
- **TypeScript** strict mode
- `app.json` already has `expo-dev-client` configured
- `newArchEnabled: true` in app.json
- Already using `expo-sensors` Pedometer for step counting (free tier)
- Pro gating via `useRevenueCat()` → `isProUser` boolean
- Weight stored in AsyncStorage under key `aayu_weight_log` as `{ id, kg, date, time }[]`
- Steps stored via `utils/stepsDayStorage.ts` → `saveDayTotal(date, total)`
- User profile has `weightUnit` (`'kg' | 'lbs'`) for display

**Libraries to use:**
- **iOS:** `react-native-health` (npm: `react-native-health@1.19.0`) — mature, widely used, Expo config plugin available
- **Android:** `react-native-health-connect` (npm: `react-native-health-connect@3.2.0` + Expo plugin `expo-health-connect`) — official Google Health Connect wrapper with Expo support

---

## Task 1: Install dependencies

Run these commands:

```bash
npm install react-native-health
npm install react-native-health-connect expo-health-connect
npm install expo-build-properties --save-dev
```

---

## Task 2: Update `app.json` — add plugins and permissions

### 2a. Add `react-native-health` config plugin for iOS

Add to the `plugins` array:
```json
[
  "react-native-health",
  {
    "isClinicalDataEnabled": false
  }
]
```

### 2b. Add `expo-health-connect` config plugin for Android

Add to the `plugins` array:
```json
"expo-health-connect"
```

### 2c. Add `expo-build-properties` for Android SDK version

Add to the `plugins` array:
```json
[
  "expo-build-properties",
  {
    "android": {
      "compileSdkVersion": 35,
      "targetSdkVersion": 35,
      "minSdkVersion": 26
    }
  }
]
```

### 2d. Add iOS HealthKit entitlement

In `app.json` under `expo.ios`, add:
```json
"entitlements": {
  "com.apple.developer.healthkit": true,
  "com.apple.developer.healthkit.access": []
}
```

### 2e. Add iOS usage description

In `app.json` under `expo.ios.infoPlist`, add:
```json
"NSHealthShareUsageDescription": "Aayu reads your steps, weight, and active energy to enhance your fasting insights and show your progress in one place."
```

Note: We only need `NSHealthShareUsageDescription` (read), NOT `NSHealthUpdateUsageDescription` (write) since Aayu only reads from HealthKit.

### 2f. Add Android Health Connect permissions

In `app.json` under `expo.android.permissions`, add these to the existing array:
```json
"android.permission.health.READ_STEPS",
"android.permission.health.READ_WEIGHT",
"android.permission.health.READ_ACTIVE_CALORIES_BURNED"
```

### 2g. Create Android manifest config plugin

Create a new file `plugins/withHealthConnect.js` in the project root:

```javascript
const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withHealthConnect(config) {
  return withAndroidManifest(config, async (config) => {
    const mainApplication = config.modResults.manifest.application?.[0];
    if (!mainApplication) return config;

    // Find the main activity
    const mainActivity = mainApplication.activity?.find(
      (a) => a.$?.['android:name'] === '.MainActivity'
    );
    if (!mainActivity) return config;

    // Add intent filter for Health Connect permissions
    if (!mainActivity['intent-filter']) {
      mainActivity['intent-filter'] = [];
    }

    const hasHealthFilter = mainActivity['intent-filter'].some((f) =>
      f.action?.some(
        (a) =>
          a.$?.['android:name'] ===
          'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE'
      )
    );

    if (!hasHealthFilter) {
      mainActivity['intent-filter'].push({
        action: [
          {
            $: {
              'android:name':
                'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE',
            },
          },
        ],
      });
    }

    return config;
  });
};
```

Add to `app.json` plugins array:
```json
"./plugins/withHealthConnect"
```

### Final plugins array should look like:

```json
"plugins": [
  "@sentry/react-native/expo",
  [
    "expo-notifications",
    { "icon": "./assets/images/icon.png", "sounds": [] }
  ],
  "expo-router",
  "expo-font",
  "expo-web-browser",
  "expo-apple-authentication",
  [
    "@react-native-google-signin/google-signin",
    { "iosUrlScheme": "com.googleusercontent.apps.174313447601-brnan6k03ufofi4oa6ask4g4k3tf0hl1" }
  ],
  [
    "react-native-health",
    { "isClinicalDataEnabled": false }
  ],
  "expo-health-connect",
  [
    "expo-build-properties",
    {
      "android": {
        "compileSdkVersion": 35,
        "targetSdkVersion": 35,
        "minSdkVersion": 26
      }
    }
  ],
  "./plugins/withHealthConnect"
]
```

---

## Task 3: Create `lib/healthKit.ts` — iOS HealthKit wrapper

Create file `lib/healthKit.ts`:

```typescript
/**
 * Apple HealthKit integration (iOS only).
 * Reads steps, weight, and active energy — never writes.
 * All functions are safe to call on Android (they no-op).
 */

import { Platform } from 'react-native';

// Lazy-load the native module — only import on iOS
let AppleHealthKit: typeof import('react-native-health').default | null = null;
let HealthKitPermissions: any = null;

if (Platform.OS === 'ios') {
  try {
    const mod = require('react-native-health');
    AppleHealthKit = mod.default;
    HealthKitPermissions = {
      permissions: {
        read: [
          mod.HealthKitPermissions?.StepCount ?? 'StepCount',
          mod.HealthKitPermissions?.Weight ?? 'Weight',
          mod.HealthKitPermissions?.ActiveEnergyBurned ?? 'ActiveEnergyBurned',
        ],
        write: [], // Read-only — Aayu never writes to HealthKit
      },
    };
  } catch {
    AppleHealthKit = null;
  }
}

export interface HealthStepsResult {
  steps: number;
  date: Date;
}

export interface HealthWeightResult {
  kg: number;
  date: Date;
}

/**
 * Check if HealthKit is available on this device.
 */
export function isHealthKitAvailable(): boolean {
  if (Platform.OS !== 'ios' || !AppleHealthKit) return false;
  return true;
}

/**
 * Request HealthKit read permissions.
 * Returns true if authorised, false if denied or unavailable.
 */
export async function requestHealthKitPermissions(): Promise<boolean> {
  if (!isHealthKitAvailable()) return false;

  return new Promise((resolve) => {
    AppleHealthKit!.initHealthKit(HealthKitPermissions, (error: string) => {
      if (error) {
        if (__DEV__) console.log('[HealthKit] Permission denied:', error);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

/**
 * Get today's step count from HealthKit.
 */
export async function getHealthKitStepsToday(): Promise<number> {
  if (!isHealthKitAvailable()) return 0;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  return new Promise((resolve) => {
    AppleHealthKit!.getStepCount(
      { date: startOfDay.toISOString(), includeManuallyAdded: true },
      (error: string, results: { value: number }) => {
        if (error) {
          if (__DEV__) console.log('[HealthKit] Steps error:', error);
          resolve(0);
        } else {
          resolve(Math.round(results?.value ?? 0));
        }
      },
    );
  });
}

/**
 * Get steps for a specific date range.
 */
export async function getHealthKitStepsForDate(date: Date): Promise<number> {
  if (!isHealthKitAvailable()) return 0;

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return new Promise((resolve) => {
    AppleHealthKit!.getStepCount(
      { date: start.toISOString(), endDate: end.toISOString(), includeManuallyAdded: true },
      (error: string, results: { value: number }) => {
        if (error) {
          resolve(0);
        } else {
          resolve(Math.round(results?.value ?? 0));
        }
      },
    );
  });
}

/**
 * Get latest weight sample from HealthKit.
 * Returns null if no weight data available.
 */
export async function getHealthKitLatestWeight(): Promise<HealthWeightResult | null> {
  if (!isHealthKitAvailable()) return null;

  return new Promise((resolve) => {
    AppleHealthKit!.getLatestWeight(
      { unit: 'kg' },
      (error: string, results: { value: number; startDate: string }) => {
        if (error || !results?.value) {
          resolve(null);
        } else {
          resolve({
            kg: Math.round(results.value * 10) / 10,
            date: new Date(results.startDate),
          });
        }
      },
    );
  });
}

/**
 * Get today's active energy burned (kcal) from HealthKit.
 */
export async function getHealthKitActiveEnergy(): Promise<number> {
  if (!isHealthKitAvailable()) return 0;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  return new Promise((resolve) => {
    AppleHealthKit!.getActiveEnergyBurned(
      {
        startDate: startOfDay.toISOString(),
        endDate: new Date().toISOString(),
        includeManuallyAdded: false,
      },
      (error: string, results: Array<{ value: number }>) => {
        if (error || !results?.length) {
          resolve(0);
        } else {
          const total = results.reduce((sum, r) => sum + (r.value ?? 0), 0);
          resolve(Math.round(total));
        }
      },
    );
  });
}
```

---

## Task 4: Create `lib/healthConnect.ts` — Android Health Connect wrapper

Create file `lib/healthConnect.ts`:

```typescript
/**
 * Google Health Connect integration (Android only).
 * Reads steps, weight, and active energy — never writes.
 * All functions are safe to call on iOS (they no-op).
 */

import { Platform } from 'react-native';

// Lazy-load — only import on Android
let HC: typeof import('react-native-health-connect') | null = null;

if (Platform.OS === 'android') {
  try {
    HC = require('react-native-health-connect');
  } catch {
    HC = null;
  }
}

export interface HealthConnectStepsResult {
  steps: number;
  date: Date;
}

export interface HealthConnectWeightResult {
  kg: number;
  date: Date;
}

/**
 * Check if Health Connect is available on this device.
 */
export async function isHealthConnectAvailable(): Promise<boolean> {
  if (Platform.OS !== 'android' || !HC) return false;
  try {
    const status = await HC.getSdkStatus();
    return status === HC.SdkAvailabilityStatus.SDK_AVAILABLE;
  } catch {
    return false;
  }
}

/**
 * Request Health Connect read permissions.
 * Returns true if all requested permissions are granted.
 */
export async function requestHealthConnectPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android' || !HC) return false;

  try {
    await HC.initialize();

    const permissions = await HC.requestPermission([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'Weight' },
      { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
    ]);

    // Check that at least Steps permission was granted
    const stepsGranted = permissions.some(
      (p) => p.recordType === 'Steps' && p.accessType === 'read',
    );
    return stepsGranted;
  } catch (e) {
    if (__DEV__) console.log('[HealthConnect] Permission error:', e);
    return false;
  }
}

/**
 * Get today's step count from Health Connect.
 */
export async function getHealthConnectStepsToday(): Promise<number> {
  if (Platform.OS !== 'android' || !HC) return 0;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  try {
    const result = await HC.readRecords('Steps', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startOfDay.toISOString(),
        endTime: new Date().toISOString(),
      },
    });

    return result.records.reduce(
      (sum, r) => sum + (r.count ?? 0),
      0,
    );
  } catch {
    return 0;
  }
}

/**
 * Get steps for a specific date.
 */
export async function getHealthConnectStepsForDate(date: Date): Promise<number> {
  if (Platform.OS !== 'android' || !HC) return 0;

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  try {
    const result = await HC.readRecords('Steps', {
      timeRangeFilter: {
        operator: 'between',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
    });

    return result.records.reduce(
      (sum, r) => sum + (r.count ?? 0),
      0,
    );
  } catch {
    return 0;
  }
}

/**
 * Get latest weight from Health Connect.
 */
export async function getHealthConnectLatestWeight(): Promise<HealthConnectWeightResult | null> {
  if (Platform.OS !== 'android' || !HC) return null;

  try {
    const result = await HC.readRecords('Weight', {
      timeRangeFilter: {
        operator: 'between',
        startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date().toISOString(),
      },
    });

    if (!result.records.length) return null;

    // Get the most recent record
    const latest = result.records[result.records.length - 1];
    const kg = latest.weight?.inKilograms ?? 0;
    if (kg <= 0) return null;

    return {
      kg: Math.round(kg * 10) / 10,
      date: new Date(latest.time),
    };
  } catch {
    return null;
  }
}

/**
 * Get today's active calories burned.
 */
export async function getHealthConnectActiveEnergy(): Promise<number> {
  if (Platform.OS !== 'android' || !HC) return 0;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  try {
    const result = await HC.readRecords('ActiveCaloriesBurned', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startOfDay.toISOString(),
        endTime: new Date().toISOString(),
      },
    });

    return Math.round(
      result.records.reduce(
        (sum, r) => sum + (r.energy?.inKilocalories ?? 0),
        0,
      ),
    );
  } catch {
    return 0;
  }
}
```

---

## Task 5: Create `hooks/useHealthSync.ts` — unified cross-platform hook

Create file `hooks/useHealthSync.ts`:

```typescript
/**
 * useHealthSync — Pro-only hook that syncs health data from Apple Health / Google Health Connect.
 *
 * Reads: steps (today), latest weight, active energy.
 * Syncs: on mount + every 60 minutes while app is foregrounded.
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

const HEALTH_SYNC_ENABLED_KEY = 'aayu_health_sync_enabled';
const HEALTH_SYNC_LAST_KEY = 'aayu_health_sync_last';
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
    checkAvailability();
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

      // ── Merge weight: only update if health store has a newer entry ─────
      if (latestWeightKg !== null && latestWeightKg > 0) {
        try {
          const raw = await AsyncStorage.getItem(WEIGHT_KEY);
          const log: { id: string; kg: number; date: string; time: number }[] = raw
            ? JSON.parse(raw)
            : [];
          const today = new Date().toISOString().slice(0, 10);
          const hasToday = log.some((e) => e.date === today);

          if (!hasToday) {
            // Add the health store weight as a new entry for today
            const entry = {
              id: `w_health_${Date.now()}`,
              kg: latestWeightKg,
              date: today,
              time: Date.now(),
            };
            const updated = [entry, ...log].slice(0, 90); // Keep max 90 entries
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
      // Clear any running interval if user is no longer Pro or disabled sync
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      return;
    }

    // Initial sync with delay (don't compete with other startup tasks)
    const initialTimer = setTimeout(() => {
      void performSync();
    }, 3000);

    // Hourly sync interval
    syncIntervalRef.current = setInterval(() => {
      if (appStateRef.current === 'active') {
        void performSync();
      }
    }, SYNC_INTERVAL_MS);

    // AppState listener: sync on return to foreground
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
      // Immediately sync after connecting
      await AsyncStorage.removeItem(HEALTH_SYNC_LAST_KEY); // Clear throttle
      void performSync();
      return true;
    } else {
      setStatus('denied');
      return false;
    }
  }, [isProUser, performSync]);

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
    await AsyncStorage.removeItem(HEALTH_SYNC_LAST_KEY); // Clear throttle
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
```

---

## Task 6: Add Health Sync toggle to Settings page

**File:** `app/settings.tsx`

### 6a. Add imports

Add at the top with other imports:
```typescript
import { useHealthSync } from '@/hooks/useHealthSync';
import { Heart } from 'lucide-react-native'; // Already imported — verify
```

### 6b. Initialise the hook

Inside the Settings component, after the existing `useRevenueCat()` call, add:
```typescript
const healthSync = useHealthSync(isProUser);
```

Where `isProUser` comes from the existing `useRevenueCat()` destructuring (it should already be available as `const { ..., isProUser } = useRevenueCat()` or from `useUserProfile()`).

### 6c. Add the Health Sync section

Add a new settings section in the appropriate place (after the Notifications section, before the Account section). The section should contain:

```tsx
{/* ── Health Integration (Pro) ──────────────────────────── */}
<Text style={styles.sectionTitle}>Health Integration</Text>
<View style={styles.sectionCard}>
  <TouchableOpacity
    style={styles.settingRow}
    activeOpacity={0.75}
    onPress={async () => {
      if (!isProUser) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        void presentPaywall();
        return;
      }
      if (healthSync.isEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert(
          `Disconnect ${healthSync.platformLabel}?`,
          'Aayu will stop reading health data. Your existing data stays.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Disconnect',
              style: 'destructive',
              onPress: () => void healthSync.disconnect(),
            },
          ],
        );
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const granted = await healthSync.connect();
        if (!granted && healthSync.status === 'denied') {
          Alert.alert(
            'Permission Required',
            `Please allow Aayu to read health data in your device Settings → Privacy → ${healthSync.platformLabel}.`,
          );
        }
      }
    }}
  >
    <View style={styles.settingRowLeft}>
      <Heart size={20} color={isProUser ? colors.error : colors.textMuted} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            {healthSync.platformLabel}
          </Text>
          {!isProUser && (
            <View style={[styles.proBadge, { backgroundColor: `${colors.primary}20` }]}>
              <Text style={[styles.proBadgeText, { color: colors.primary }]}>PRO</Text>
            </View>
          )}
        </View>
        <Text style={[styles.settingSub, { color: colors.textMuted }]}>
          {healthSync.isEnabled
            ? healthSync.status === 'syncing'
              ? 'Syncing...'
              : `Connected · Last sync ${healthSync.data.lastSyncTime ? new Date(healthSync.data.lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'never'}`
            : 'Sync steps, weight & energy'}
        </Text>
      </View>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {healthSync.isEnabled && (
        <View style={[styles.connectedDot, { backgroundColor: colors.success }]} />
      )}
      <ChevronRight size={18} color={colors.textMuted} />
    </View>
  </TouchableOpacity>
</View>
```

### 6d. Add the necessary styles

Add to the `makeStyles` function if not already present:
```typescript
proBadge: {
  paddingHorizontal: 6,
  paddingVertical: 1,
  borderRadius: 4,
} as ViewStyle,
proBadgeText: {
  fontSize: fs(9),
  fontWeight: '700' as const,
  letterSpacing: 0.5,
} as TextStyle,
connectedDot: {
  width: 8,
  height: 8,
  borderRadius: 4,
} as ViewStyle,
```

Check if `proBadge` and `proBadgeText` styles already exist in your settings styles — if so, reuse them.

---

## Task 7: Update `usePedometer` to merge health store data

**File:** `hooks/usePedometer.ts`

The `useHealthSync` hook already writes health store steps into `stepsDayStorage` via `saveDayTotal`. The pedometer hook reads from the same storage. The merge logic in `useHealthSync.performSync()` uses `Math.max(healthSteps, existingSteps)` — so whichever source has a higher count wins. **No changes needed to `usePedometer.ts`.**

However, the pedometer's `refreshManual()` function is called in `useFocusEffect` on the Today page. When health sync writes a higher step count, the next `useFocusEffect` will pick it up automatically. **This already works.**

---

## Task 8: Add a storage key constant

**File:** `constants/storageKeys.ts`

Add these constants:
```typescript
/** Whether health sync (Apple Health / Health Connect) is enabled */
export const HEALTH_SYNC_ENABLED_KEY = 'aayu_health_sync_enabled';
/** Timestamp of last health sync (throttle) */
export const HEALTH_SYNC_LAST_KEY = 'aayu_health_sync_last';
```

Then update `lib/healthKit.ts`, `lib/healthConnect.ts`, and `hooks/useHealthSync.ts` to import from `@/constants/storageKeys` instead of defining the keys inline.

---

## What NOT to change

1. **Today page UI** — No new cards or sections. Health data flows silently into existing step/weight displays.
2. **Journey page** — No changes. Trend charts automatically pick up the improved step/weight data.
3. **Onboarding** — Do not add health setup to onboarding. It's a Pro feature discovered in Settings.
4. **FastingContext** — No fasting data comes from health stores.
5. **Existing pedometer logic** — `usePedometer` continues to work identically for free users. Health sync is additive.

---

## Battery behaviour

| Action | Frequency | API calls |
|--------|-----------|-----------|
| Initial sync | Once on app open (3s delay) | 3 reads (steps, weight, energy) |
| Periodic sync | Every 60 minutes (only if foregrounded) | 3 reads |
| Return from background | Once on AppState → 'active' | 3 reads (throttled — skips if <60 min since last) |
| While backgrounded | Never | 0 |
| Free users | Never | 0 — hook short-circuits when `!isProUser` |

Total API calls per day (assuming 1 hour screen time): ~4-6 health store reads. Negligible battery impact.

---

## Verification checklist

After implementation:
- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npx expo prebuild --clean` succeeds for both iOS and Android
- [ ] iOS: Settings → Health Integration → tap → HealthKit permission dialog appears
- [ ] iOS: After granting, steps/weight from Apple Health appear in Today page
- [ ] Android: Settings → Health Integration → tap → Health Connect permission dialog appears
- [ ] Android: After granting, steps from Health Connect appear in Today page
- [ ] Free user: tapping Health Integration shows paywall, NOT the permission dialog
- [ ] Disconnect works: tap again → confirm → status returns to idle
- [ ] Weight from health store appears in weight log (without duplicating existing manual entries)
- [ ] Steps show the higher of pedometer vs health store (not doubled)
- [ ] Backgrounding the app does NOT trigger any health API calls
- [ ] No new network requests (all health data is local on-device reads)
- [ ] Existing pedometer continues to work for free users with zero behaviour change
