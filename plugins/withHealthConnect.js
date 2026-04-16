const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withHealthConnect(config) {
  return withAndroidManifest(config, async (config) => {
    const mainApplication = config.modResults.manifest.application?.[0];
    if (!mainApplication) return config;

    const mainActivity = mainApplication.activity?.find(
      (a) => a.$?.['android:name'] === '.MainActivity'
    );
    if (!mainActivity) return config;

    if (!mainActivity['intent-filter']) {
      mainActivity['intent-filter'] = [];
    }

    const hasHealthFilter = mainActivity['intent-filter'].some((f) =>
      f.action?.some(
        (a) =>
          a.$?.['android:name'] ===
          'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE'
      )
    );

    if (!hasHealthFilter) {
      mainActivity['intent-filter'].push({
        action: [
          {
            $: {
              'android:name':
                'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE',
            },
          },
        ],
      });
    }

    return config;
  });
};
