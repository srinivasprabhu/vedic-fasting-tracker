import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

/**
 * Initialise Sentry for crash reporting.
 * Call once at startup before React rendering.
 * Safe when DSN is missing (no-ops).
 */
export function initSentry(): void {
  if (!SENTRY_DSN) {
    if (__DEV__) console.log('[Sentry] No DSN configured — skipping init');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    debug: __DEV__,
    enabled: !__DEV__,
    tracesSampleRate: 0.2,
    environment: __DEV__ ? 'development' : 'production',
    beforeSend(event) {
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((bc) => {
          if (bc.data?.url && typeof bc.data.url === 'string') {
            try {
              const url = new URL(bc.data.url);
              url.search = '';
              bc.data.url = url.toString();
            } catch {
              /* keep */
            }
          }
          return bc;
        });
      }
      return event;
    },
  });
}

export function setSentryUser(userId: string | null): void {
  if (userId) {
    Sentry.setUser({ id: userId });
  } else {
    Sentry.setUser(null);
  }
}

export function captureError(error: unknown, context?: Record<string, string>): void {
  if (context) {
    Sentry.setContext('extra', context);
  }
  Sentry.captureException(error);
}

export { Sentry };
