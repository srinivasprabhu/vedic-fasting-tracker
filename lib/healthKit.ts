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
