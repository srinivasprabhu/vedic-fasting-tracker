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
 * Typography scale — single source of truth for font sizes.
 * Use these when defining styles: fontSize: FONT_SIZES.body
 * FONT_SCALE in _layout.tsx is applied to all Text/TextInput at render time.
 */
export const FONT_SIZES = {
  xs: 8,
  caption: 10,
  label: 11,
  bodySmall: 12,
  body: 14,
  bodyLarge: 15,
  subheading: 16,
  heading: 18,
  title: 20,
  titleLarge: 22,
  display: 26,
  displayMd: 32,
  displayLg: 36,
  displayXl: 46,
  displayHero: 58,
} as const;

/**
 * Line heights — pair with FONT_SIZES for typography.
 * Usage: lineHeight: LINE_HEIGHTS.body
 */
export const LINE_HEIGHTS = {
  xs: 14,
  caption: 16,
  body: 20,
  bodyLarge: 21,
  heading: 24,
  title: 28,
  display: 42,
  displayLg: 44,
  displayHero: 64,
} as const;

/**
 * Animation durations (ms) — single source for transition timings.
 * Usage: duration: ANIMATION.normal
 */
export const ANIMATION = {
  instant: 100,
  fast: 200,
  normal: 350,
  moderate: 500,
  slow: 800,
} as const;

/**
 * Elevation values for Android (Material shadow depth).
 * Usage: elevation: ELEVATION.medium
 */
export const ELEVATION = {
  none: 0,
  low: 2,
  medium: 4,
  high: 8,
} as const;

/**
 * Shadow presets — offset + radius for iOS-style shadows.
 * Usage: { ...SHADOW.md, shadowColor: '...' }
 */
export const SHADOW = {
  sm: { shadowOffset: { width: 0, height: 1 }, shadowRadius: 2 },
  md: { shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 },
  lg: { shadowOffset: { width: 0, height: 6 }, shadowRadius: 14 },
} as const;

/**
 * Border widths — consistent stroke thickness.
 */
export const BORDER_WIDTHS = {
  thin: 1,
  medium: 1.5,
  thick: 2,
} as const;

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
