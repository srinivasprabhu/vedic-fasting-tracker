/**
 * Auth configuration for Google and Apple Sign-In.
 * Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
 * in .env when you have OAuth credentials from Google Cloud Console.
 */
const env = (typeof process !== 'undefined' ? process.env : {}) as Record<
  string,
  string | undefined
>;

export const GOOGLE_WEB_CLIENT_ID =
  env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

export const GOOGLE_IOS_CLIENT_ID =
  env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
