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
 * Returns true if at least Steps permission is granted.
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
 * Get latest weight from Health Connect (looks back 90 days).
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

    const latest = result.records[result.records.length - 1];
    const kg = (latest as any).weight?.inKilograms ?? 0;
    if (kg <= 0) return null;

    return {
      kg: Math.round(kg * 10) / 10,
      date: new Date((latest as any).time),
    };
  } catch {
    return null;
  }
}

/**
 * Get today's active calories burned from Health Connect.
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
        (sum, r) => sum + ((r as any).energy?.inKilocalories ?? 0),
        0,
      ),
    );
  } catch {
    return 0;
  }
}
