/**
 * Theme constants for Aayu onboarding screens.
 * Uses system fonts for broad compatibility.
 */

export const COLORS = {
  bg: '#0a0604',
  cream: '#f0e0c0',
  gold: '#c8872a',
  goldLight: '#e8a84c',
  goldPale: '#f2e5d0',
  green: '#5b8c5a',
  muted: 'rgba(240,224,192,0.4)',
  text: 'rgba(240,224,192,0.65)',
};

export const FONTS = {
  displayLight: undefined as string | undefined,
  displayItalic: undefined as string | undefined,
  bodyMedium: undefined as string | undefined,
  bodyRegular: undefined as string | undefined,
};

export const RADIUS = {
  xl: 20,
  lg: 16,
  md: 12,
  sm: 8,
  pill: 100,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

/**
 * Global font scale factor.
 * Change this single value to scale ALL font sizes across the app.
 * 1.0 = default, 1.2 = 20% larger, 1.5 = 50% larger
 */
export const FONT_SCALE = 1.2;

/** Apply font scale to a size value. Use this for all fontSize values. */
export function fs(size: number): number {
  return Math.round(size * FONT_SCALE);
}
