# Aayu — Sentry + PostHog Integration Prompt for Cursor

## Context

Aayu is a React Native fasting app built with Expo SDK 54, Expo Router, TypeScript, React Query, Supabase, and RevenueCat. The project root is at the current working directory.

**Stack details:**
- Expo SDK 54 with `expo-router` v6 for navigation
- TypeScript strict mode
- `app/_layout.tsx` is the root layout with nested providers: ThemeProvider → AuthProvider → RevenueCatProvider → UserProfileProvider → FastingProvider
- `app.json` already has `"scheme": "aayu-fasting"` and EAS project ID configured
- `eas.json` has development, preview, and production build profiles
- Environment variables use `EXPO_PUBLIC_` prefix (Expo convention)
- The app uses `__DEV__` checks for dev-only logging

**IMPORTANT CONSTRAINTS:**
- Do NOT modify any existing UI, styles, or user-facing behaviour
- Do NOT change any existing import paths or module structure
- Do NOT remove any existing code — only add new code
- All new files go in `lib/` or `constants/` directories
- Use `EXPO_PUBLIC_` prefix for all environment variables
- Sentry must initialise BEFORE any React rendering in `app/_layout.tsx`
- PostHog provider must wrap inside the existing provider tree (inside GestureHandlerRootView, around ThemeProvider)
- All analytics calls must be safe — if PostHog fails to initialise, the app must still work
- Use TypeScript throughout — no `any` types except where third-party types require it

---

## Task 1: Install dependencies

Run these commands (do NOT modify package.json manually):
```bash
npx expo install @sentry/react-native
npx expo install posthog-react-native expo-file-system expo-application expo-device expo-localization
```

---

## Task 2: Update app.json — add Sentry plugin

In `app.json`, add `"@sentry/react-native/expo"` to the beginning of the `plugins` array. Keep all existing plugins. The result should look like:

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
  ]
]
```

---

## Task 3: Create `lib/sentry.ts`

Create a new file `lib/sentry.ts` that initialises Sentry:

```typescript
import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

/**
 * Initialise Sentry for crash reporting.
 * Call this once at the top of app/_layout.tsx, before any React rendering.
 * Safe to call even if DSN is missing (no-ops in that case).
 */
export function initSentry(): void {
  if (!SENTRY_DSN) {
    if (__DEV__) console.log('[Sentry] No DSN configured — skipping init');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    debug: __DEV__,
    enabled: !__DEV__, // Only report in production builds
    tracesSampleRate: 0.2, // 20% of transactions for performance monitoring
    environment: __DEV__ ? 'development' : 'production',
    beforeSend(event) {
      // Strip any PII from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((bc) => {
          if (bc.data?.url) {
            // Remove query params that might contain tokens
            try {
              const url = new URL(bc.data.url);
              url.search = '';
              bc.data.url = url.toString();
            } catch {
              // Not a valid URL, leave as-is
            }
          }
          return bc;
        });
      }
      return event;
    },
  });
}

/**
 * Set user context for Sentry (call after sign-in).
 * Only sets the user ID — no email or name for privacy.
 */
export function setSentryUser(userId: string | null): void {
  if (userId) {
    Sentry.setUser({ id: userId });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Capture a non-fatal error with context.
 */
export function captureError(error: unknown, context?: Record<string, string>): void {
  if (context) {
    Sentry.setContext('extra', context);
  }
  Sentry.captureException(error);
}

export { Sentry };
```

---

## Task 4: Create `lib/analytics.ts`

Create a new file `lib/analytics.ts` with typed PostHog event helpers:

```typescript
import PostHog from 'posthog-react-native';

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST;

/** Shared PostHog client — initialised lazily, null if config missing. */
let client: PostHog | null = null;

/**
 * Get or create the PostHog client.
 * Returns null if API key is not configured (safe to call always).
 */
export async function getPostHogClient(): Promise<PostHog | null> {
  if (client) return client;
  if (!POSTHOG_KEY || !POSTHOG_HOST) {
    if (__DEV__) console.log('[Analytics] PostHog not configured — skipping');
    return null;
  }

  try {
    client = await PostHog.initAsync(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      // Flush events every 30 seconds or when 20 events are queued
      flushAt: 20,
      flushInterval: 30000,
      // Capture app lifecycle events automatically
      captureApplicationLifecycleEvents: true,
      captureDeepLinks: true,
      captureNativeAppLifecycleEvents: true,
    });
    if (__DEV__) console.log('[Analytics] PostHog initialised');
    return client;
  } catch (e) {
    if (__DEV__) console.warn('[Analytics] PostHog init failed:', e);
    return null;
  }
}

// ─── Typed event helpers ─────────────────────────────────────────────────────
// These are the 5 critical launch events + a few extras.
// Each function is safe to call even if PostHog is not initialised.

async function capture(event: string, properties?: Record<string, unknown>): Promise<void> {
  try {
    const ph = await getPostHogClient();
    ph?.capture(event, properties);
  } catch {
    // Never let analytics crash the app
  }
}

/** User opened the app (cold start) */
export function trackAppOpened(): void {
  void capture('app_opened');
}

/** User completed the onboarding flow */
export function trackOnboardingCompleted(properties: {
  goal: string;
  plan: string;
}): void {
  void capture('onboarding_completed', properties);
}

/** User started a fast */
export function trackFastStarted(properties: {
  planLabel: string;
  targetHours: number;
  isCustomStartTime: boolean;
}): void {
  void capture('fast_started', properties);
}

/** User ended a fast (completed or abandoned) */
export function trackFastCompleted(properties: {
  planLabel: string;
  targetHours: number;
  actualHours: number;
  completed: boolean;
  streak: number;
}): void {
  void capture('fast_completed', properties);
}

/** Paywall was shown to the user */
export function trackPaywallShown(properties: {
  trigger: string;
}): void {
  void capture('paywall_shown', properties);
}

/** User dismissed the paywall without purchasing */
export function trackPaywallDismissed(properties: {
  trigger: string;
}): void {
  void capture('paywall_dismissed', properties);
}

/** User completed a purchase through the paywall */
export function trackPaywallConverted(properties: {
  trigger: string;
  productId: string;
}): void {
  void capture('paywall_converted', properties);
}

/** User viewed a specific screen (for screen-level analytics) */
export function trackScreenView(screenName: string): void {
  void capture('screen_viewed', { screen: screenName });
}

/** Set the user ID for PostHog (call after sign-in) */
export async function identifyUser(userId: string, properties?: Record<string, unknown>): Promise<void> {
  try {
    const ph = await getPostHogClient();
    ph?.identify(userId, properties);
  } catch {
    // Never let analytics crash the app
  }
}

/** Reset PostHog identity (call on sign-out) */
export async function resetAnalytics(): Promise<void> {
  try {
    const ph = await getPostHogClient();
    ph?.reset();
  } catch {
    // Silent
  }
}
```

---

## Task 5: Update `app/_layout.tsx`

Make the following changes to `app/_layout.tsx`. Be precise — only add, do not remove existing code.

### 5a. Add imports at the top of the file (after existing imports):

```typescript
import { initSentry, Sentry } from '@/lib/sentry';
import { trackAppOpened, getPostHogClient } from '@/lib/analytics';
import { PostHogProvider } from 'posthog-react-native';
```

### 5b. Call initSentry() BEFORE SplashScreen.preventAutoHideAsync():

The line `SplashScreen.preventAutoHideAsync();` already exists near the top of the file. Add `initSentry();` directly ABOVE it:

```typescript
// Initialise crash reporting before any React rendering
initSentry();

SplashScreen.preventAutoHideAsync();
```

### 5c. Wrap the Sentry error boundary around RootLayoutNav:

Find the `RootLayout` default export function. It currently returns:
```tsx
<QueryClientProvider client={queryClient}>
  <GestureHandlerRootView style={{ flex: 1 }}>
    <ThemeProvider>
      ...
    </ThemeProvider>
  </GestureHandlerRootView>
</QueryClientProvider>
```

Wrap the entire return with `Sentry.wrap()` by changing the export:

```typescript
function RootLayoutInner() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <AuthProvider>
            <RevenueCatProvider>
              <UserProfileProvider>
                <NotificationScheduleSync />
                <DailySyncManager />
                <FastingProvider>
                  <RootLayoutNav />
                </FastingProvider>
              </UserProfileProvider>
            </RevenueCatProvider>
          </AuthProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

export default Sentry.wrap(RootLayoutInner);
```

### 5d. Track app_opened in RootLayoutNav:

Inside the `RootLayoutNav` function, add a useEffect to track app open. Add it after the existing `useEffect` blocks (after the one that checks onboarding):

```typescript
// Track app opened for analytics
useEffect(() => {
  trackAppOpened();
}, []);
```

---

## Task 6: Add analytics events to key screens

### 6a. Onboarding completion (`app/onboarding.tsx`)

Find the function that handles completing onboarding (it likely calls `AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true')` and then navigates to profile-setup or the main app).

Add this import at the top:
```typescript
import { trackOnboardingCompleted } from '@/lib/analytics';
```

Add this call right before or after the navigation:
```typescript
trackOnboardingCompleted({
  goal: 'onboarding', // or whatever context is available
  plan: 'default',
});
```

### 6b. Fast started (`app/(tabs)/(home)/index.tsx`)

Add this import at the top:
```typescript
import { trackFastStarted, trackFastCompleted } from '@/lib/analytics';
```

Find the `handleStartNow` function. It currently calls `startFast(...)`. Add tracking right after:
```typescript
const handleStartNow = useCallback(() => {
  if (!pendingFast) return;
  startFast(pendingFast.type, pendingFast.name, pendingFast.duration * 3600000);
  trackFastStarted({
    planLabel: pendingFast.name,
    targetHours: pendingFast.duration,
    isCustomStartTime: false,
  });
  setPendingFast(null);
}, [pendingFast, startFast]);
```

Find the `handleStartCustom` function. Add tracking:
```typescript
const handleStartCustom = useCallback((ts: number) => {
  if (!pendingFast) return;
  startFast(pendingFast.type, pendingFast.name, pendingFast.duration * 3600000, ts);
  trackFastStarted({
    planLabel: pendingFast.name,
    targetHours: pendingFast.duration,
    isCustomStartTime: true,
  });
  setPendingFast(null);
}, [pendingFast, startFast]);
```

Find the `handleEndNow` function. Add tracking:
```typescript
const handleEndNow = useCallback(() => {
  const completed = timer.elapsedMs >= (activeFast?.targetDuration ?? 0) * 0.8;
  Haptics.notificationAsync(completed ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
  trackFastCompleted({
    planLabel: activeFast?.label ?? 'unknown',
    targetHours: (activeFast?.targetDuration ?? 0) / 3600000,
    actualHours: timer.elapsedMs / 3600000,
    completed,
    streak,
  });
  endFast(completed);
  setTimeout(() => router.push('/fast-complete' as any), 300);
}, [activeFast, timer.elapsedMs, endFast, streak]);
```

Find the `handleEndCustom` function. Add tracking:
```typescript
const handleEndCustom = useCallback((ts: number) => {
  if (!activeFast) return;
  const completed = (ts - activeFast.startTime) >= activeFast.targetDuration * 0.8;
  Haptics.notificationAsync(completed ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
  trackFastCompleted({
    planLabel: activeFast.label,
    targetHours: activeFast.targetDuration / 3600000,
    actualHours: (ts - activeFast.startTime) / 3600000,
    completed,
    streak,
  });
  endFast(completed, ts);
  setTimeout(() => router.push('/fast-complete' as any), 300);
}, [activeFast, endFast, streak]);
```

### 6c. Paywall events (`contexts/RevenueCatContext.tsx`)

Add this import at the top:
```typescript
import { trackPaywallShown, trackPaywallDismissed, trackPaywallConverted } from '@/lib/analytics';
```

Find the `presentPaywall` function. It likely calls RevenueCat's paywall presentation. Add tracking around it:

Before showing the paywall:
```typescript
trackPaywallShown({ trigger: 'manual' });
```

If the paywall returns a result indicating purchase:
```typescript
trackPaywallConverted({ trigger: 'manual', productId: result.productIdentifier ?? 'unknown' });
```

If the paywall is dismissed without purchase:
```typescript
trackPaywallDismissed({ trigger: 'manual' });
```

The exact implementation depends on how `presentPaywall` is structured. Look for the result handling and add the appropriate tracking calls. The key principle: never let a tracking call prevent the paywall from working. Wrap each in try/catch if needed.

---

## Task 7: Create `.env.example`

Create `.env.example` in the project root (this one IS committed to git as a template):

```env
# Sentry — crash reporting (https://sentry.io)
EXPO_PUBLIC_SENTRY_DSN=

# PostHog — analytics (https://posthog.com)
EXPO_PUBLIC_POSTHOG_KEY=
EXPO_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

Also create the actual `.env` file (NOT committed — should be in .gitignore):
```env
EXPO_PUBLIC_SENTRY_DSN=https://your-actual-dsn@o000.ingest.sentry.io/000
EXPO_PUBLIC_POSTHOG_KEY=phc_your_actual_key_here
EXPO_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

---

## Task 8: Update .gitignore

Add these lines to `.gitignore` if not already present:
```
.env
.env.local
sentry.properties
```

---

## Verification

After all changes, run:
1. `npx tsc --noEmit` — must pass with zero errors
2. `npx expo start --dev-client` — app must launch
3. Check that no existing tests break: `npm run test` (if tests exist)
4. Check Sentry dashboard for test events
5. Check PostHog Live Events for `app_opened`

**DO NOT:**
- Change any UI components, styles, or layouts
- Modify the existing provider order (only wrap with Sentry.wrap at the outermost level)
- Add analytics calls to every screen — only the 5 critical events listed above
- Use synchronous PostHog calls — always use the async helpers from `lib/analytics.ts`
- Store API keys in source code — always use environment variables
