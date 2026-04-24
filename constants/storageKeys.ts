/** AsyncStorage keys shared by root layout, onboarding, profile, and dev tools. */

export const ONBOARDING_COMPLETE_KEY = 'vedic_onboarding_complete';
export const PROFILE_STORAGE_KEY = 'vedic_user_profile';

/** Local completed/active fasting sessions (see FastingContext, lib/sync) */
export const FASTING_RECORDS_STORAGE_KEY = 'vedic_fasting_records';

/** 'system' | 'light' | 'dark' — persisted user theme choice */
export const THEME_PREFERENCE_KEY = 'vedic_theme_pref';
/** Legacy boolean dark flag; migrated once into THEME_PREFERENCE_KEY */
export const THEME_LEGACY_DARK_KEY = 'vedic_theme_dark';

/** When true, Today shows rotating traditional/Vedic quotes; default off (neutral copy). */
export const TRADITIONAL_INSIGHTS_KEY = 'aayu_traditional_insights';

/** Whether health sync (Apple Health / Health Connect) is enabled */
export const HEALTH_SYNC_ENABLED_KEY = 'aayu_health_sync_enabled';
/** Timestamp of last health sync (throttle guard) */
export const HEALTH_SYNC_LAST_KEY = 'aayu_health_sync_last';

/** Set to 'true' after the user completes the feature walkthrough (shows only once). */
export const WALKTHROUGH_COMPLETE_KEY = 'aayu_walkthrough_complete';

