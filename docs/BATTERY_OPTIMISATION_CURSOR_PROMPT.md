# Aayu — Battery Optimisation — Cursor Implementation Prompt

## Overview

Optimise the app's battery footprint by making the fasting timer and pedometer AppState-aware, removing duplicate pedometer subscriptions, increasing persist debounce, and ensuring animation loops respect reduced motion. These changes eliminate ~95% of unnecessary CPU work while the app is backgrounded during a fast.

**Golden rule:** The user's fasting data is computed from `Date.now() - startTime`. No data is ever lost by pausing intervals. The timer is pure math — it doesn't accumulate state.

---

## Context

**Stack:** React Native, Expo SDK 54, TypeScript.

**Key files to modify:**
- `hooks/useFastTimer.ts` — fasting timer with 1-second interval
- `hooks/usePedometer.ts` — step counter with live watch + 5-min snapshot
- `components/AayuInsightCard.tsx` — animated glow loop
- `components/CircularTimer.tsx` — animated pulse loop (already has useReducedMotion — verify it stops the loop)

**Files NOT to touch:**
- `components/DailySyncManager.tsx` — already well-designed (AppState-driven, throttled)
- `components/NotificationScheduleSync.tsx` — already efficient (fingerprint-based)
- `utils/notifications.ts` — uses OS-level scheduling, no battery impact
- `lib/supabase.ts` — no realtime, no polling
- `contexts/RevenueCatContext.tsx` — checks on launch only

---

## Task 1: Make `useFastTimer` AppState-aware

**File:** `hooks/useFastTimer.ts`

### 1a. Add AppState import

Add to the imports at the top:
```typescript
import { AppState, AppStateStatus } from 'react-native';
```

### 1b. Add AppState tracking ref

Inside the `useFastTimer` function, after the existing refs (`prevZoneId`, `hasCompleted`, `tickIntervalRef`), add:

```typescript
const appStateRef = useRef<AppStateStatus>(AppState.currentState);
```

### 1c. Replace the main timer useEffect

Find the existing useEffect that starts the interval:

```typescript
useEffect(() => {
    if (!startDate) {
      setState(DEFAULT_STATE);
      return;
    }

    hasCompleted.current = false;
    prevZoneId.current = '';
    tick();

    if (!hasCompleted.current) {
      tickIntervalRef.current = setInterval(tick, tickInterval);
    }

    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    };
  }, [tick, tickInterval, startDate]);
```

Replace it with this version that pauses when backgrounded:

```typescript
useEffect(() => {
  if (!startDate) {
    setState(DEFAULT_STATE);
    return;
  }

  hasCompleted.current = false;
  prevZoneId.current = '';

  // Start or restart the timer interval
  function startTicking() {
    // Always compute fresh state from startDate (no accumulated drift)
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

  // Initial tick
  startTicking();

  // Pause interval when app goes to background, resume on foreground
  const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
    if (nextState === 'active' && appStateRef.current !== 'active') {
      // App returned to foreground — re-compute immediately (catches up from startDate)
      startTicking();
    } else if (nextState !== 'active' && appStateRef.current === 'active') {
      // App going to background — stop the interval to save battery
      stopTicking();
    }
    appStateRef.current = nextState;
  });

  return () => {
    stopTicking();
    subscription.remove();
  };
}, [tick, tickInterval, startDate]);
```

**Why this works:** `buildState()` always computes elapsed time as `Date.now() - startDate`. When the app returns from background after 4 hours, the very first tick() call produces the correct 4-hour elapsed time. No state is accumulated — it's pure math from timestamps.

---

## Task 2: Fix `usePedometer` — remove duplicates, add AppState awareness, increase debounce

**File:** `hooks/usePedometer.ts`

### 2a. Add AppState import

Add to the imports at the top:
```typescript
import { AppState, AppStateStatus, Platform } from 'react-native';
```

Note: `Platform` is already imported — just add `AppState` and `AppStateStatus`.

### 2b. Replace the ENTIRE hook body

The current hook has three `useEffect` blocks with overlapping pedometer subscriptions and a 5-minute polling interval. Replace the entire `usePedometer` function body with this consolidated version:

```typescript
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

    // Remove any existing subscription first
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

      // Take a fresh snapshot as baseline
      const snapshot = await takeSnapshot();
      snapshotRef.current = snapshot;
      setAutoSteps(snapshot);

      // Subscribe to live step deltas
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
      // Seal past days' step totals using OS history
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

      // Load today's manual steps
      const manual = await loadManualSteps();
      if (!cancelled) setManualSteps(manual);

      // Start live watch (only if not web and not cancelled)
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
        // App returned to foreground — re-snapshot and restart live watch
        void startLiveWatch();
      } else if (nextState !== 'active' && appStateRef.current === 'active') {
        // App going to background — stop live watch to save battery
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
      // Only re-snapshot if app is in foreground
      if (appStateRef.current !== 'active') return;
      try {
        const snapshot = await takeSnapshot();
        snapshotRef.current = snapshot;
        setAutoSteps(snapshot);
      } catch {}
    }, 60 * 60 * 1000); // Every 60 minutes (was 5 minutes)

    return () => clearInterval(interval);
  }, [takeSnapshot]);

  const steps = autoSteps + manualSteps;

  // ── Persist total (debounced at 30 seconds, was 2 seconds) ──────────────
  useEffect(() => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      persistTimerRef.current = null;
      void saveDayTotal(new Date(), steps);
    }, 30_000); // 30 seconds (was 2 seconds)
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, [steps]);

  const addManual = useCallback(async (amount: number) => {
    const updated = manualSteps + amount;
    setManualSteps(updated);
    await saveManualSteps(updated);
    // Also update the persisted total immediately for manual adds
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
```

**What changed:**
1. Removed the duplicate `watchStepCount` call from the init useEffect (was creating a subscription with incorrect cumulative delta logic).
2. Removed the 5-minute `setInterval` snapshot entirely. Replaced with a 60-minute interval for accuracy drift correction.
3. Added `AppState` listener that stops the live watch when backgrounded and re-snapshots + re-subscribes on foreground.
4. Increased persist debounce from 2 seconds to 30 seconds.
5. The `addManual` callback now triggers an immediate persist (manual adds are user-initiated — they should save promptly).
6. Consolidated all pedometer logic into `startLiveWatch()` / `stopLiveWatch()` helpers for clarity.

**Keep everything else unchanged:** The `UsePedometerResult` interface, the `loadManualSteps` / `saveManualSteps` helper functions at the top of the file, and the `startOfToday()` function all stay as-is.

---

## Task 3: Fix animation loops in `AayuInsightCard`

**File:** `components/AayuInsightCard.tsx`

Find the `useEffect` that runs the glow animation loop. It currently looks like:

```typescript
useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: reduceMotion ? 0 : 700,
      delay: reduceMotion ? 0 : 150,
      useNativeDriver: true,
    }).start();

    if (reduceMotion) {
      glowAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 2400, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [fadeAnim, glowAnim, reduceMotion]);
```

This is **almost correct** — it checks `reduceMotion` and skips the loop. However, the `glowAnim.setValue(1)` means the dot is fully opaque (visible but static) rather than at a neutral resting state. This is fine. **No change needed here.**

**Verify that `useReducedMotion` is imported and used** — it already is. This component is correctly optimised.

---

## Task 4: Verify `CircularTimer` animation handling

**File:** `components/CircularTimer.tsx`

The CircularTimer already imports `useReducedMotion` and skips animations when enabled. Verify this logic is correct:

```typescript
if (reduceMotion) {
  pulseAnim.setValue(1);
  glowAnim.setValue(isActive ? 0.25 : 0);
  return;
}
```

This is correct — it returns early from the useEffect, preventing the loop from starting. **No change needed.**

---

## Task 5: Verify `DedicatedSeekerCard` animation handling

**File:** `app/(tabs)/analytics/index.tsx` (DedicatedSeekerCard is defined inline)

Find the DedicatedSeekerCard component inside the analytics page. It already imports and uses `useReducedMotion`:

```typescript
if (reduceMotion) {
  glowAnim.setValue(1);
  return;
}
```

This is correct. **No change needed.**

---

## What NOT to change

1. **`components/DailySyncManager.tsx`** — Already uses AppState listener correctly. Syncs on background transition, not polling. Throttled to 2-hour intervals. No changes needed.

2. **`components/NotificationScheduleSync.tsx`** — Uses a fingerprint memo that only triggers sync when the plan actually changes. Has a 400ms debounce timeout. No changes needed.

3. **`utils/notifications.ts`** — All notifications use `Notifications.scheduleNotificationAsync` with native triggers (`DAILY`, `WEEKLY`, `TIME_INTERVAL`). The OS delivers these — the app does not need to be running. No changes needed.

4. **`lib/supabase.ts`** — No realtime channels, no polling, no websocket subscriptions. Just `autoRefreshToken: true` which uses a background timer managed by the Supabase client (only fires when the token approaches expiry, typically once per hour). No changes needed.

5. **`contexts/RevenueCatContext.tsx`** — Checks entitlements on app launch and after paywall dismissal only. No polling. No changes needed.

6. **Any UI components, styles, or layouts** — This prompt is purely about background CPU/battery. No visual changes.

---

## Verification checklist

After implementation:

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] App launches correctly with `npx expo start --dev-client`
- [ ] Start a fast → timer counts up correctly
- [ ] Lock phone for 30 seconds → unlock → timer shows correct elapsed time (should "jump" to the right time instantly)
- [ ] Background the app → check iOS/Android battery stats → Aayu should show minimal background activity
- [ ] Steps count updates when walking with the app open
- [ ] Background the app → walk 100 steps → open app → steps should re-snapshot to correct count within ~1 second
- [ ] The pedometer "Auto-syncing" label appears when live watch is active
- [ ] Manual step add works correctly and persists
- [ ] No duplicate step counting (watch for steps doubling when switching between foreground/background)
- [ ] AayuInsightCard glow animation works in dark mode (pulsing dot)
- [ ] Enable "Reduce Motion" in device accessibility settings → verify no animation loops are running (dot should be static)

## Summary of battery impact

| Change | Before | After | Reduction |
|--------|--------|-------|-----------|
| Timer ticks while backgrounded | 1/second for 16+ hours | 0 while backgrounded | ~57,000 ticks saved per fast |
| Pedometer subscriptions | 2 overlapping live watches | 1 watch, paused when backgrounded | 50% fewer subscriptions, 0 in background |
| Step snapshot interval | Every 5 minutes | Every 60 minutes | 12x fewer snapshots |
| Step persist debounce | 2 seconds | 30 seconds | 15x fewer AsyncStorage writes |
| Animation loops in background | Continue running | Native driver (already OK) | Verified correct |
