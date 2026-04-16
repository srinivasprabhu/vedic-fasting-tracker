# Aayu — Apple Health Integration Fix

## Problem

When tapping "Apple Health" in Settings, the user sees a custom "Permission Required" alert instead of the native iOS HealthKit permission sheet. Aayu does not appear under iPhone Settings → Privacy → Health → Apps.

This means `initHealthKit` is failing silently. Three things need fixing.

---

## Fix 1: Rewrite `lib/healthKit.ts` with correct `react-native-health` API

**File:** `lib/healthKit.ts`

The current file uses the wrong path to access permission constants. The correct API is `AppleHealthKit.Constants.Permissions.StepCount` (accessed on the default export), not `HealthKitPermissions.StepCount` as a named export.

Replace the entire file contents with:

```typescript
/**
 * Apple HealthKit integration (iOS only).
 * Reads steps, weight, and active energy — never writes.
 * All functions are safe to call on Android (they no-op).
 */

import { Platform } from 'react-native';
import type {
  HealthKitPermissions as HKPermissionsType,
  HealthValue,
  HealthUnit,
} from 'react-native-health';

// Lazy-load the native module — only import on iOS
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let AppleHealthKit: any = null;
let permissionsRequest: HKPermissionsType | null = null;

if (Platform.OS === 'ios') {
  try {
    // react-native-health exports via default
    AppleHealthKit = require('react-native-health').default;

    // Build permissions object using Constants.Permissions (the correct API path)
    const Perms = AppleHealthKit?.Constants?.Permissions;
    if (Perms) {
      permissionsRequest = {
        permissions: {
          read: [
            Perms.StepCount,
            Perms.Weight,
            Perms.ActiveEnergyBurned,
          ],
          write: [], // Read-only — Aayu never writes to HealthKit
        },
      };
    } else {
      if (__DEV__) {
        console.warn(
          '[HealthKit] AppleHealthKit.Constants.Permissions is undefined — native module may not be linked. Rebuild the dev client.',
        );
      }
      AppleHealthKit = null;
    }
  } catch (e) {
    if (__DEV__) console.warn('[HealthKit] require failed:', e);
    AppleHealthKit = null;
  }
}

export interface HealthWeightResult {
  kg: number;
  date: Date;
}

/**
 * Check if HealthKit is available on this device AND the native module is loaded.
 */
export function isHealthKitAvailable(): boolean {
  if (Platform.OS !== 'ios') return false;
  if (!AppleHealthKit) return false;
  if (!permissionsRequest) return false;
  return true;
}

/**
 * Request HealthKit read permissions.
 * Returns true if authorised, false if denied or unavailable.
 *
 * NOTE: Due to Apple's privacy model, the promise resolves true even if the user
 * denies a specific permission — we cannot know which permissions were granted.
 * We resolve true as long as initHealthKit succeeds (meaning the sheet was shown).
 */
export async function requestHealthKitPermissions(): Promise<boolean> {
  if (!isHealthKitAvailable()) {
    if (__DEV__) console.warn('[HealthKit] Not available — cannot request permissions');
    return false;
  }

  return new Promise((resolve) => {
    AppleHealthKit.initHealthKit(permissionsRequest, (error: string) => {
      if (error) {
        if (__DEV__) console.warn('[HealthKit] initHealthKit error:', error);
        resolve(false);
      } else {
        if (__DEV__) console.log('[HealthKit] initHealthKit success');
        resolve(true);
      }
    });
  });
}

/**
 * Check whether HealthKit has already been initialised (permissions sheet shown at least once).
 * Used to avoid re-prompting on every app launch.
 */
export async function isAuthorizedToWriteData(): Promise<boolean> {
  if (!isHealthKitAvailable()) return false;
  // HealthKit does not expose a direct "are we authorised" check for reads.
  // We rely on the init flow — if init succeeds, we can read.
  return new Promise((resolve) => {
    AppleHealthKit.initHealthKit(permissionsRequest, (error: string) => {
      resolve(!error);
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
    AppleHealthKit.getStepCount(
      {
        date: startOfDay.toISOString(),
        includeManuallyAdded: true,
      },
      (error: string, results: HealthValue) => {
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
 * Get steps for a specific date.
 */
export async function getHealthKitStepsForDate(date: Date): Promise<number> {
  if (!isHealthKitAvailable()) return 0;

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  return new Promise((resolve) => {
    AppleHealthKit.getStepCount(
      {
        date: start.toISOString(),
        includeManuallyAdded: true,
      },
      (error: string, results: HealthValue) => {
        if (error) resolve(0);
        else resolve(Math.round(results?.value ?? 0));
      },
    );
  });
}

/**
 * Get latest weight sample from HealthKit (in kg).
 */
export async function getHealthKitLatestWeight(): Promise<HealthWeightResult | null> {
  if (!isHealthKitAvailable()) return null;

  return new Promise((resolve) => {
    AppleHealthKit.getLatestWeight(
      { unit: 'gram' as HealthUnit },
      (error: string, results: { value: number; startDate: string }) => {
        if (error || !results?.value) {
          if (__DEV__ && error) console.log('[HealthKit] Weight error:', error);
          resolve(null);
        } else {
          // Convert grams to kg
          const kg = results.value / 1000;
          resolve({
            kg: Math.round(kg * 10) / 10,
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
    AppleHealthKit.getActiveEnergyBurned(
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

**Key changes:**
1. Uses `AppleHealthKit.Constants.Permissions.StepCount` (correct API) instead of `mod.HealthKitPermissions?.StepCount`
2. Uses `require('react-native-health').default` (correct module shape)
3. If `Constants.Permissions` is undefined (native module not linked), the module is treated as unavailable — no silent string fallback that looks like it's working
4. Weight unit changed from `'kg'` to `'gram'` (the library returns grams natively; we convert); `'kg'` is not a supported unit in react-native-health
5. Added `console.warn` logging in `__DEV__` so you can see exactly why init fails

---

## Fix 2: Update `hooks/useHealthSync.ts` to handle the three-state clearly

**File:** `hooks/useHealthSync.ts`

Find the `connect` function and replace it with this version that gives the user better feedback:

```typescript
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
    await AsyncStorage.removeItem(HEALTH_SYNC_LAST_KEY); // Clear throttle
    void performSync();
    return true;
  } else {
    setStatus('denied');
    return false;
  }
}, [isProUser, isAvailable, performSync]);
```

---

## Fix 3: Improve the Settings page alert to distinguish failure modes

**File:** `app/settings.tsx`

Find the Health Integration touchable `onPress` handler. Replace the alert logic with this more informative version:

```typescript
onPress={async () => {
  if (!isProUser) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void presentPaywall();
    return;
  }

  if (healthSync.isEnabled) {
    // Disconnect flow (unchanged)
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
    return;
  }

  // Connection flow with better error messages
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  // Check availability first
  if (!healthSync.isAvailable) {
    Alert.alert(
      `${healthSync.platformLabel} Not Available`,
      Platform.OS === 'ios'
        ? 'HealthKit is not available on this device, or the dev build does not have the HealthKit capability enabled. Rebuild the app with: npx expo prebuild --clean && npx expo run:ios'
        : 'Google Health Connect is not installed or enabled. Install it from the Play Store.',
    );
    return;
  }

  const granted = await healthSync.connect();

  if (granted) {
    Alert.alert(
      'Connected',
      `${healthSync.platformLabel} is now syncing with Aayu.`,
    );
  } else if (healthSync.status === 'denied') {
    Alert.alert(
      'Permission Denied',
      Platform.OS === 'ios'
        ? 'Aayu needs access to Apple Health. Open the Apple Health app → Sharing tab → Apps → Aayu and enable the permissions.'
        : 'Open Health Connect → Permissions → Aayu and enable the permissions.',
    );
  } else {
    Alert.alert(
      'Connection Failed',
      'Could not connect to the health store. Please try again.',
    );
  }
}}
```

Make sure `Platform` is imported at the top of `settings.tsx` — it should already be there.

---

## Fix 4: Rebuild the native dev client

This is almost certainly part of the problem. **After the above code changes, you MUST rebuild the dev client.** The HealthKit entitlement in `app.json` only takes effect when the native iOS project is regenerated.

Run in the project root:

```bash
# Clean prebuild regenerates ios/ and android/ with fresh config from app.json
npx expo prebuild --clean

# Rebuild and install on your connected iPhone
npx expo run:ios --device
```

Select your iPhone from the device picker when prompted.

**Why:** Your current dev build binary on the phone was compiled before the HealthKit entitlement was added. iOS strictly enforces entitlements at binary level — `initHealthKit` fails with an opaque error if the app isn't signed with the HealthKit entitlement, regardless of what `Info.plist` says. A JS-only reload won't fix this.

---

## Verification after rebuild

After rebuilding, in order:

1. **Cold-launch the dev build** on your iPhone (kill and reopen — no Metro reload)
2. Check the **Xcode / Metro console** for the log `[HealthKit] initHealthKit success` or error messages when you tap the Apple Health row
3. iOS should show the **native HealthKit permission sheet** with toggles for Steps, Weight, and Active Energy — NOT your custom alert
4. Toggle all three on and tap "Allow"
5. Go to **iPhone Settings → Privacy & Security → Health → Apps** → "Aayu" should now appear
6. Return to Aayu Settings → the row should show "Connected · Last sync HH:MM"

If step 3 still fails (no native sheet appears, only your custom alert), the Xcode console will show one of:

- `[HealthKit] AppleHealthKit.Constants.Permissions is undefined` → native module is not linked, re-run `npx expo prebuild --clean && npx expo run:ios`
- `[HealthKit] initHealthKit error: Requirements not met` → HealthKit entitlement is missing from the binary; check `ios/vedicintermittentfasting/vedicintermittentfasting.entitlements` contains `<key>com.apple.developer.healthkit</key><true/>`
- `[HealthKit] initHealthKit error: Authorization not determined` → permissions object shape is wrong; verify `Constants.Permissions.StepCount` resolves to a non-undefined string in the debugger

---

## Why the HealthKit permission sheet is different from most iOS permission sheets

Unlike camera, notifications, or location, **HealthKit's permission UI is a full-screen sheet with per-metric toggles** — not a simple "Allow / Don't Allow" dialog. It looks more like a Settings page. When it works, you'll see:

- A header with your app icon and name
- A section "Turn On All"
- Individual toggles for Steps, Weight, and Active Energy
- A "Done" button top-right

If you're seeing an iOS alert dialog instead, it's NOT the HealthKit sheet — it's something else (your custom alert, or a generic error).
