/**
 * Theme constants for Aayu onboarding screens.
 * Uses system fonts for broad compatibility.
 */

import { darkColors, hexAlpha } from './colors';

/** Legacy onboarding palette — derived from dark ColorScheme so hex cannot drift. */
export const COLORS = {
  bg: darkColors.background,
  cream: darkColors.text,
  gold: darkColors.primaryDark,
  goldLight: darkColors.primary,
  goldPale: darkColors.textSecondary,
  green: darkColors.success,
  muted: hexAlpha(darkColors.text, 0.4),
  text: hexAlpha(darkColors.text, 0.65),
} as const;

export const FONTS = {
  displayLight: undefined as string | undefined,
  displayItalic: undefined as string | undefined,
  bodyMedium: undefined as string | undefined,
  bodyRegular: undefined as string | undefined,
};

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  pill: 100,
  round: 9999,
} as const;

/** Standardized border-radius tokens for consistent design */
export const RADII = RADIUS; // Alias for convenience

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

/**
 * Typography scale — semantic steps (pair with `fs()` for the runtime size, see below).
 */
export const FONT_SIZES = {
  /** Use sparingly - only for decorative/non-essential text */
  xs: 10,
  /** Minimum readable size for labels and captions */
  caption: 11,
  /** Labels, eyebrows, small UI text */
  label: 12,
  /** Small body text - minimum for readable content */
  bodySmall: 12,
  /** Default body text */
  body: 14,
  /** Large body text */
  bodyLarge: 15,
  /** Subheadings */
  subheading: 16,
  /** Section headings */
  heading: 18,
  /** Screen titles */
  title: 20,
  /** Large titles */
  titleLarge: 22,
  /** Display text */
  display: 26,
  /** Medium display */
  displayMd: 32,
  /** Large display */
  displayLg: 36,
  /** Extra large display */
  displayXl: 46,
  /** Hero display */
  displayHero: 58,
} as const;

/** Font weights as React Native string values */
export const FONT_WEIGHTS = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

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
 * Global font scale factor — applied by `fs()` (Option A: no Text/TextInput monkey-patch).
 */
export const FONT_SCALE = 1.2;

/** Apply design-token font size; use for `fontSize` so it matches the former global scale. */
export function fs(size: number): number {
  return Math.round(size * FONT_SCALE);
}

/**
 * Line height for the same design size as `fs(n)` — keeps ascenders/descenders from clipping
 * when font sizes are scaled (pair: fontSize: fs(n), lineHeight: lh(n)).
 */
export function lh(designFontSize: number, ratio = 1.3): number {
  return Math.round(fs(designFontSize) * ratio);
}
