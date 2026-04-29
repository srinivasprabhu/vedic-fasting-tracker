import PostHog from 'posthog-react-native';
import type { PostHogEventProperties } from '@posthog/core';

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST;

let client: PostHog | null = null;
let clientPromise: Promise<PostHog | null> | null = null;

/**
 * Single PostHog client (aligned with RN programmatic init).
 * Returns null if keys missing or init fails.
 */
export async function getPostHogClient(): Promise<PostHog | null> {
  if (client) return client;
  if (!POSTHOG_KEY?.trim() || !POSTHOG_HOST?.trim()) {
    if (__DEV__) console.log('[Analytics] PostHog not configured — skipping');
    return null;
  }

  if (!clientPromise) {
    clientPromise = (async (): Promise<PostHog | null> => {
      try {
        const ph = new PostHog(POSTHOG_KEY, {
          host: POSTHOG_HOST,
          captureAppLifecycleEvents: true,
        });
        await ph.ready();
        client = ph;
        if (__DEV__) console.log('[Analytics] PostHog initialised');
        return ph;
      } catch (e) {
        if (__DEV__) console.warn('[Analytics] PostHog init failed:', e);
        return null;
      }
    })();
  }

  return clientPromise;
}

async function capture(event: string, properties?: PostHogEventProperties): Promise<void> {
  try {
    const ph = await getPostHogClient();
    ph?.capture(event, properties);
  } catch {
    /* never block app */
  }
}

export function trackAppOpened(): void {
  void capture('app_opened');
}

export function trackOnboardingCompleted(properties: { goal: string; plan: string }): void {
  void capture('onboarding_completed', properties);
}

export function trackFastStarted(properties: {
  planLabel: string;
  targetHours: number;
  isCustomStartTime: boolean;
}): void {
  void capture('fast_started', properties);
}

export function trackFastCompleted(properties: {
  planLabel: string;
  targetHours: number;
  actualHours: number;
  completed: boolean;
  streak: number;
}): void {
  void capture('fast_completed', properties);
}

export function trackPaywallShown(properties: { trigger: string }): void {
  void capture('paywall_shown', properties);
}

export function trackPaywallDismissed(properties: { trigger: string }): void {
  void capture('paywall_dismissed', properties);
}

export function trackPaywallConverted(properties: { trigger: string; productId: string }): void {
  void capture('paywall_converted', properties);
}

export function trackScreenView(screenName: string): void {
  void capture('screen_viewed', { screen: screenName });
}

export async function identifyUser(userId: string, properties?: PostHogEventProperties): Promise<void> {
  try {
    const ph = await getPostHogClient();
    ph?.identify(userId, properties);
  } catch {
    /* noop */
  }
}

export async function resetAnalytics(): Promise<void> {
  try {
    const ph = await getPostHogClient();
    ph?.reset();
  } catch {
    /* noop */
  }
}
