import { Platform } from 'react-native';

/** Local / Expo Go–style testing only — do not ship release builds with this in `getRevenueCatApiKey`. */
const TEST_API_KEY = 'test_HGpkcLaWDmQYyQVXOOusAvMqiXA';

/** iOS App Store public SDK key (RevenueCat). Used for all non-dev iOS builds unless env overrides. */
const IOS_API_KEY_PRODUCTION = 'appl_rsLgjSpTNwKfBNvDTLaqvOtMXEK';

/**
 * Reads `EXPO_PUBLIC_*` keys from the environment (inlined at build time).
 *
 * **EAS / Expo:** Set variables in the project on expo.dev → Environment variables
 * (e.g. `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` for production). They apply to builds
 * for the selected environment (development / preview / production).
 *
 * **Local:** Use a root `.env` (and `env: load` via Expo) or `eas env:pull` — otherwise
 * the iOS fallback below uses the embedded production constant when `!__DEV__`.
 *
 * **Expo:** Keep `app.json` → `plugins` → `./plugins/withRevenueCat` ios/android keys aligned
 * with the fallbacks here for documentation parity (SDK is still configured from JS).
 *
 * iOS: env → else production constant when `!__DEV__` → else test key for local Metro.
 * Android: env `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` → else test key until you add `goog_`.
 */
export function getRevenueCatApiKey(): string {
  if (Platform.OS === 'ios') {
    const fromEnv = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
    if (fromEnv) return fromEnv;
    return __DEV__ ? TEST_API_KEY : IOS_API_KEY_PRODUCTION;
  }
  if (Platform.OS === 'android') {
    const fromEnv = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
    if (fromEnv) return fromEnv;
    return TEST_API_KEY;
  }
  return TEST_API_KEY;
}

/** Entitlement identifier in RevenueCat dashboard — attach monthly, yearly, lifetime products here. */
export const REVENUECAT_ENTITLEMENT_PRO = 'pro';

/** App Store / Play product identifiers (must match store + RevenueCat product setup). */
export const REVENUECAT_PRODUCT_IDS = {
  monthly: 'aayu_pro_monthly',
  yearly: 'aayu_pro_yearly',
  lifetime: 'aayu_pro_lifetime',
} as const;
