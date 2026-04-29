/**
 * Expo config plugin for RevenueCat (`react-native-purchases`).
 *
 * Upstream `react-native-purchases` does not ship an `app.plugin.js`, so the
 * REVENUECAT_IMPLEMENTATION_PROMPT shape…
 *   ["react-native-purchases", { iosApiKey, androidApiKey }]
 * …cannot resolve as-is. This local plugin applies the native bits Expo expects,
 * while keeping public SDK keys aligned with `constants/revenuecat.ts` /
 * `EXPO_PUBLIC_REVENUECAT_*` at runtime via `Purchases.configure`.
 *
 * `iosApiKey` / `androidApiKey` are accepted for parity with that doc and for
 * CI/reference; they are not written into Info.plist (the RN SDK is configured from JS).
 */
const { withAndroidManifest } = require('expo/config-plugins');

const BILLING = 'com.android.vending.BILLING';

function ensurePlayBillingPermission(androidManifest) {
  const manifest = androidManifest.manifest;
  const permissions = manifest['uses-permission'] ?? [];
  const exists = permissions.some(
    (p) => p?.$?.['android:name'] === BILLING,
  );
  if (!exists) {
    permissions.push({
      $: { 'android:name': BILLING },
    });
    manifest['uses-permission'] = permissions;
  }
}

/**
 * @param {import('@expo/config-types').ExpoConfig} config
 * @param {{ iosApiKey?: string; androidApiKey?: string }} props
 */
module.exports = function withRevenueCat(config, props = {}) {
  void props;

  return withAndroidManifest(config, (cfg) => {
    ensurePlayBillingPermission(cfg.modResults);
    return cfg;
  });
};
