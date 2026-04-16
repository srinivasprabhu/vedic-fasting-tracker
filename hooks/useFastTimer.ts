import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export interface FastTimerState {
  hoursElapsed: number;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
  humanReadable: string;
  isActive: boolean;
  isComplete: boolean;
  currentZoneId: string;
  currentZoneName: string;
  currentZoneColor: string;
  hoursToNextZone: number | null;
  timeToNextZone: string | null;
  zoneProgress: number;
  elapsedMs: number;
}

export interface UseFastTimerOptions {
  startTime: string | number | Date;
  endTime?: string | number | Date;
  tickInterval?: number;
  onTick?: (state: FastTimerState) => void;
  onZoneChange?: (newZoneId: string, newZoneName: string) => void;
  onComplete?: () => void;
}

interface ZoneDef {
  id: string;
  name: string;
  color: string;
  startHour: number;
  endHour: number | null;
}

const ZONE_DEFS: ZoneDef[] = [
  { id: 'anabolic', name: 'Anabolic', color: '#5b8dd9', startHour: 0, endHour: 4 },
  { id: 'catabolic', name: 'Catabolic', color: '#d4a017', startHour: 4, endHour: 12 },
  { id: 'fatBurning', name: 'Fat Burning', color: '#e07b30', startHour: 12, endHour: 18 },
  { id: 'ketosis', name: 'Ketosis', color: '#c05050', startHour: 18, endHour: 24 },
  { id: 'autophagy', name: 'Autophagy', color: '#8b6bbf', startHour: 24, endHour: 48 },
  { id: 'deepRenewal', name: 'Deep Renewal', color: '#3aaa6e', startHour: 48, endHour: null },
];

function toDate(value: string | number | Date): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  return new Date(value);
}

function getZoneForHours(hours: number): ZoneDef {
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
  const hoursElapsed = elapsedMs / 3_600_000;

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
    hoursToNextZone: hoursToNext,
    timeToNextZone,
    zoneProgress,
    elapsedMs,
  };
}

const DEFAULT_STATE: FastTimerState = {
  hoursElapsed: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  formatted: '00:00:00',
  humanReadable: '0m',
  isActive: false,
  isComplete: false,
  currentZoneId: 'anabolic',
  currentZoneName: 'Anabolic',
  currentZoneColor: '#5b8dd9',
  hoursToNextZone: 4,
  timeToNextZone: '4h',
  zoneProgress: 0,
  elapsedMs: 0,
};

export function useFastTimer(options: UseFastTimerOptions | null): FastTimerState {
  const {
    startTime,
    endTime,
    tickInterval = 1000,
    onTick,
    onZoneChange,
    onComplete,
  } = options ?? {};

  const startTimestamp = startTime ? toDate(startTime).getTime() : null;
  const endTimestamp = endTime ? toDate(endTime).getTime() : null;

  const startDate = useMemo(() => startTimestamp !== null ? new Date(startTimestamp) : null, [startTimestamp]);
  const endDate = useMemo(() => endTimestamp !== null ? new Date(endTimestamp) : null, [endTimestamp]);

  const [state, setState] = useState<FastTimerState>(() =>
    startDate ? buildState(startDate, endDate, new Date()) : DEFAULT_STATE
  );

  const prevZoneId = useRef<string>(state.currentZoneId);
  const hasCompleted = useRef<boolean>(false);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const onZoneChangeRef = useRef(onZoneChange);
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onZoneChangeRef.current = onZoneChange;
    onCompleteRef.current = onComplete;
    onTickRef.current = onTick;
  }, [onZoneChange, onComplete, onTick]);

  const tick = useCallback(() => {
    if (!startDate) return;
    const now = new Date();
    const next = buildState(startDate, endDate, now);

    setState(next);

    if (next.currentZoneId !== prevZoneId.current) {
      onZoneChangeRef.current?.(next.currentZoneId, next.currentZoneName);
      prevZoneId.current = next.currentZoneId;
    }

    if (next.isComplete && !hasCompleted.current) {
      hasCompleted.current = true;
      onCompleteRef.current?.();
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    }

    onTickRef.current?.(next);
  }, [startDate, endDate]);

  useEffect(() => {
    if (!startDate) {
      setState(DEFAULT_STATE);
      return;
    }

    hasCompleted.current = false;
    prevZoneId.current = '';

    function startTicking() {
      tick();
      if (!hasCompleted.current && !tickIntervalRef.current) {
        tickIntervalRef.current = setInterval(tick, tickInterval);
      }
    }

    function stopTicking() {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    }

    startTicking();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active' && appStateRef.current !== 'active') {
        startTicking();
      } else if (nextState !== 'active' && appStateRef.current === 'active') {
        stopTicking();
      }
      appStateRef.current = nextState;
    });

    return () => {
      stopTicking();
      subscription.remove();
    };
  }, [tick, tickInterval, startDate]);

  return state;
}
