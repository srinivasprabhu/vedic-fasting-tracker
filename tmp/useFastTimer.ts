import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FastTimerState {
  /** Total hours elapsed since fast started (e.g. 9.583) */
  hoursElapsed: number;
  /** Whole hours component */
  hours: number;
  /** Minutes component (0–59) */
  minutes: number;
  /** Seconds component (0–59) */
  seconds: number;
  /** Formatted string e.g. "09:32:14" */
  formatted: string;
  /** Formatted human string e.g. "9h 32m" */
  humanReadable: string;
  /** Whether the fast is currently active */
  isActive: boolean;
  /** Whether the fast has ended (endTime is set and in the past) */
  isComplete: boolean;
  /** Current metabolic zone id */
  currentZoneId: string;
  /** Name of the current metabolic zone */
  currentZoneName: string;
  /** Color of the current metabolic zone */
  currentZoneColor: string;
  /** Hours remaining until the next zone (null if in last zone) */
  hoursToNextZone: number | null;
  /** Formatted string for time to next zone e.g. "2h 28m" */
  timeToNextZone: string | null;
  /** Progress within current zone 0–1 */
  zoneProgress: number;
  /** Total elapsed in milliseconds */
  elapsedMs: number;
}

export interface UseFastTimerOptions {
  /** ISO string or timestamp (ms) when the fast started */
  startTime: string | number | Date;
  /** ISO string or timestamp (ms) when the fast ended. If undefined, fast is ongoing. */
  endTime?: string | number | Date;
  /** How often to tick in milliseconds. Default: 1000 (every second) */
  tickInterval?: number;
  /** Called every tick with updated state */
  onTick?: (state: FastTimerState) => void;
  /** Called when a new metabolic zone is entered */
  onZoneChange?: (newZoneId: string, newZoneName: string) => void;
  /** Called when the fast completes (endTime reached) */
  onComplete?: () => void;
}

// ─── Zone definitions (mirrors MetabolicZoneRiver.tsx) ───────────────────────

interface ZoneDef {
  id: string;
  name: string;
  color: string;
  startHour: number;
  endHour: number | null;
}

const ZONE_DEFS: ZoneDef[] = [
  { id: 'anabolic',    name: 'Anabolic',      color: '#5b8dd9', startHour: 0,  endHour: 4    },
  { id: 'catabolic',   name: 'Catabolic',     color: '#d4a017', startHour: 4,  endHour: 12   },
  { id: 'fatBurning',  name: 'Fat Burning',   color: '#e07b30', startHour: 12, endHour: 18   },
  { id: 'ketosis',     name: 'Ketosis',       color: '#c05050', startHour: 18, endHour: 24   },
  { id: 'autophagy',   name: 'Autophagy',     color: '#8b6bbf', startHour: 24, endHour: 48   },
  { id: 'deepRenewal', name: 'Deep Renewal',  color: '#3aaa6e', startHour: 48, endHour: null },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDate(value: string | number | Date): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  return new Date(value);
}

function getZoneForHours(hours: number): ZoneDef {
  // Walk backwards to find the deepest zone reached
  for (let i = ZONE_DEFS.length - 1; i >= 0; i--) {
    if (hours >= ZONE_DEFS[i].startHour) return ZONE_DEFS[i];
  }
  return ZONE_DEFS[0];
}

function getHoursToNextZone(zone: ZoneDef, hoursElapsed: number): number | null {
  if (zone.endHour === null) return null;
  return Math.max(0, zone.endHour - hoursElapsed);
}

function formatTimeToNext(hours: number | null): string | null {
  if (hours === null) return null;
  if (hours <= 0) return '0m';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function padTwo(n: number): string {
  return String(Math.floor(n)).padStart(2, '0');
}

function buildState(
  startDate: Date,
  endDate: Date | null,
  now: Date
): FastTimerState {
  const isComplete = endDate !== null && now >= endDate;
  const effectiveNow = isComplete && endDate ? endDate : now;
  const isActive = !isComplete && now >= startDate;

  const elapsedMs = Math.max(0, effectiveNow.getTime() - startDate.getTime());
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const hoursElapsed = elapsedMs / 3_600_000; // precise fractional hours

  const zone = getZoneForHours(hoursElapsed);
  const zoneDuration = (zone.endHour ?? zone.startHour + 24) - zone.startHour;
  const zoneProgress = Math.min(
    Math.max((hoursElapsed - zone.startHour) / zoneDuration, 0),
    1
  );

  const hoursToNext = getHoursToNextZone(zone, hoursElapsed);
  const timeToNextZone = formatTimeToNext(hoursToNext);

  const humanParts: string[] = [];
  if (hours > 0) humanParts.push(`${hours}h`);
  humanParts.push(`${minutes}m`);

  return {
    hoursElapsed,
    hours,
    minutes,
    seconds,
    formatted: `${padTwo(hours)}:${padTwo(minutes)}:${padTwo(seconds)}`,
    humanReadable: humanParts.join(' '),
    isActive,
    isComplete,
    currentZoneId: zone.id,
    currentZoneName: zone.name,
    currentZoneColor: zone.color,
    hoursToNextZone,
    timeToNextZone,
    zoneProgress,
    elapsedMs,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useFastTimer
 *
 * Real-time fasting timer hook for the Aayu app.
 * Computes elapsed time, current metabolic zone, zone progress,
 * and time to next zone — updating on every tick.
 *
 * @example
 * const timer = useFastTimer({
 *   startTime: '2026-02-27T06:00:00.000Z',
 *   onZoneChange: (id, name) => showNotification(`Entered ${name}!`),
 * });
 *
 * <MetabolicZoneRiver hoursElapsed={timer.hoursElapsed} />
 * <Text>{timer.formatted}</Text>       // "09:32:14"
 * <Text>{timer.timeToNextZone}</Text>  // "2h 28m"
 */
export function useFastTimer({
  startTime,
  endTime,
  tickInterval = 1000,
  onTick,
  onZoneChange,
  onComplete,
}: UseFastTimerOptions): FastTimerState {
  const startDate = toDate(startTime);
  const endDate = endTime ? toDate(endTime) : null;

  const [state, setState] = useState<FastTimerState>(() =>
    buildState(startDate, endDate, new Date())
  );

  // Track previous zone to detect zone changes
  const prevZoneId = useRef<string>(state.currentZoneId);
  const hasCompleted = useRef<boolean>(false);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    const now = new Date();
    const next = buildState(startDate, endDate, now);

    setState(next);

    // Zone change callback
    if (next.currentZoneId !== prevZoneId.current) {
      onZoneChange?.(next.currentZoneId, next.currentZoneName);
      prevZoneId.current = next.currentZoneId;
    }

    // Completion callback (fire once)
    if (next.isComplete && !hasCompleted.current) {
      hasCompleted.current = true;
      onComplete?.();
      // Stop ticking once complete
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    }

    onTick?.(next);
  }, [startDate, endDate, onTick, onZoneChange, onComplete]);

  useEffect(() => {
    // Immediate tick on mount / dependency change
    tick();

    // Don't start interval if already complete
    if (!hasCompleted.current) {
      tickIntervalRef.current = setInterval(tick, tickInterval);
    }

    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    };
  }, [tick, tickInterval]);

  return state;
}

// ─── Companion: usePersistedFast ─────────────────────────────────────────────
//
// Manages storing and retrieving the fast start/end time from AsyncStorage
// so the timer survives app restarts.

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  START: '@aayu/fast_start',
  END:   '@aayu/fast_end',
} as const;

export interface FastSession {
  startTime: string | null;
  endTime: string | null;
}

export interface UsePersistedFastReturn {
  /** Current fast session (null values = no active fast) */
  session: FastSession;
  /** True while loading from storage */
  loading: boolean;
  /** Start a new fast right now */
  startFast: () => Promise<void>;
  /** End the current fast right now */
  endFast: () => Promise<void>;
  /** Clear all fast data (reset) */
  resetFast: () => Promise<void>;
}

/**
 * usePersistedFast
 *
 * Manages fast start/end timestamps in AsyncStorage.
 * Combine with useFastTimer for a complete real-time experience.
 *
 * @example
 * const { session, loading, startFast, endFast } = usePersistedFast();
 *
 * const timer = useFastTimer({
 *   startTime: session.startTime ?? new Date(),
 *   endTime: session.endTime ?? undefined,
 *   onZoneChange: (id, name) => {
 *     // Push a local notification: "You've entered ${name}!"
 *   },
 * });
 *
 * // Then pass to your component:
 * if (!loading && session.startTime) {
 *   return <MetabolicZoneRiver hoursElapsed={timer.hoursElapsed} />;
 * }
 */
export function usePersistedFast(): UsePersistedFastReturn {
  const [session, setSession] = useState<FastSession>({
    startTime: null,
    endTime: null,
  });
  const [loading, setLoading] = useState(true);

  // Load from storage on mount
  useEffect(() => {
    async function load() {
      try {
        const [start, end] = await AsyncStorage.multiGet([
          STORAGE_KEYS.START,
          STORAGE_KEYS.END,
        ]);
        setSession({
          startTime: start[1] ?? null,
          endTime: end[1] ?? null,
        });
      } catch (err) {
        console.error('[usePersistedFast] Failed to load:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const startFast = useCallback(async () => {
    const now = new Date().toISOString();
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.START, now],
        [STORAGE_KEYS.END, ''],   // clear any previous end
      ]);
      setSession({ startTime: now, endTime: null });
    } catch (err) {
      console.error('[usePersistedFast] Failed to start fast:', err);
    }
  }, []);

  const endFast = useCallback(async () => {
    const now = new Date().toISOString();
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.END, now);
      setSession((prev) => ({ ...prev, endTime: now }));
    } catch (err) {
      console.error('[usePersistedFast] Failed to end fast:', err);
    }
  }, []);

  const resetFast = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.START, STORAGE_KEYS.END]);
      setSession({ startTime: null, endTime: null });
    } catch (err) {
      console.error('[usePersistedFast] Failed to reset fast:', err);
    }
  }, []);

  return { session, loading, startFast, endFast, resetFast };
}

// ─── Complete wiring example ──────────────────────────────────────────────────
//
// AnalyticsScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
//
// import React from 'react';
// import { View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
// import MetabolicZoneRiver from './MetabolicZoneRiver';
// import { useFastTimer, usePersistedFast } from './useFastTimer';
//
// export default function AnalyticsScreen() {
//   const { session, loading, startFast, endFast, resetFast } = usePersistedFast();
//
//   const timer = useFastTimer({
//     startTime: session.startTime ?? new Date(),
//     endTime:   session.endTime   ?? undefined,
//     tickInterval: 1000,
//     onZoneChange: (id, name) => {
//       // 🔔 Trigger a local push notification here
//       // e.g. Notifications.scheduleNotificationAsync(...)
//       console.log(`Entered zone: ${name}`);
//     },
//     onComplete: () => {
//       console.log('Fast complete!');
//     },
//   });
//
//   if (loading) {
//     return (
//       <SafeAreaView style={{ flex: 1, backgroundColor: '#0e0905', alignItems: 'center', justifyContent: 'center' }}>
//         <ActivityIndicator color="#c8872a" />
//       </SafeAreaView>
//     );
//   }
//
//   if (!session.startTime) {
//     return (
//       <SafeAreaView style={{ flex: 1, backgroundColor: '#0e0905', alignItems: 'center', justifyContent: 'center' }}>
//         <TouchableOpacity onPress={startFast} style={{ backgroundColor: '#c8872a', padding: 16, borderRadius: 12 }}>
//           <Text style={{ color: '#fff', fontWeight: '600' }}>Begin Fast</Text>
//         </TouchableOpacity>
//       </SafeAreaView>
//     );
//   }
//
//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: '#0e0905' }}>
//       {/* Live timer display */}
//       <View style={{ padding: 20, alignItems: 'center' }}>
//         <Text style={{ color: '#f5d48a', fontSize: 36, fontFamily: 'Cormorant-Light' }}>
//           {timer.formatted}
//         </Text>
//         <Text style={{ color: '#7a6040', fontSize: 12, marginTop: 4 }}>
//           {timer.timeToNextZone
//             ? `${timer.timeToNextZone} until ${timer.currentZoneName} ends`
//             : 'Peak state reached'}
//         </Text>
//       </View>
//
//       {/* River visualisation */}
//       <MetabolicZoneRiver
//         hoursElapsed={timer.hoursElapsed}
//         onZonePress={(zone) => console.log('Tapped:', zone.name)}
//       />
//
//       {/* End fast button */}
//       {!timer.isComplete && (
//         <TouchableOpacity
//           onPress={endFast}
//           style={{ margin: 20, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#c8872a33', alignItems: 'center' }}
//         >
//           <Text style={{ color: '#7a6040', fontSize: 13 }}>End Fast</Text>
//         </TouchableOpacity>
//       )}
//     </SafeAreaView>
//   );
// }
