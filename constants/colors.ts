/** Append 8-bit alpha (0–1) to #RRGGBB for React Native styles */
export function hexAlpha(hex: string, alpha: number): string {
  const n = Math.round(Math.max(0, Math.min(1, alpha)) * 255);
  return `${hex.slice(0, 7)}${n.toString(16).padStart(2, '0')}`;
}

export type ColorScheme = {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;
  /** Water / hydration metrics and CTAs */
  hydration: string;
  /** Primary “Begin / End fast” button fill */
  fastAction: string;
  /** Text & icons on `fastAction` buttons */
  onFastAction: string;
  /** Weight tracker accent (warm gold — light vs dark tuned) */
  trackWeight: string;
  /** Streak / flame highlights on dashboard tiles */
  streakAccent: string;
  background: string;
  card: string;
  surface: string;
  surfaceWarm: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textLight: string;
  border: string;
  borderLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  tabBar: string;
  tabActive: string;
  tabInactive: string;
  overlay: string;
};

export const lightColors: ColorScheme = {
  primary: '#C97B2A',
  primaryLight: '#F5E6CC',
  primaryDark: '#A0611E',
  accent: '#B85C38',
  accentLight: '#E8C4B0',

  hydration: '#5B8DD9',
  fastAction: '#D4956A',
  onFastAction: '#1A0D04',
  trackWeight: '#A06820',
  streakAccent: '#E07B30',

  background: '#FBF7F0',
  card: '#FFFFFF',
  surface: '#F5EDE0',
  surfaceWarm: '#FEF3E2',

  text: '#2C1810',
  textSecondary: '#7A6552',
  textMuted: '#6E5E4F',
  textLight: '#FFFFFF',

  border: '#E8DFD0',
  borderLight: '#F0E8DC',

  success: '#5B8C5A',
  successLight: '#E8F0E8',
  warning: '#D4A03C',
  warningLight: '#FDF4E0',
  error: '#C25450',
  errorLight: '#F8E8E8',

  tabBar: '#FFFFFF',
  tabActive: '#C97B2A',
  tabInactive: '#B8A898',

  overlay: 'rgba(44, 24, 16, 0.5)',
};

export const darkColors: ColorScheme = {
  primary: '#E8913A',
  primaryLight: '#2C1A08',
  primaryDark: '#C97B2A',
  accent: '#D4754A',
  accentLight: '#2A1510',

  hydration: '#6B9AE8',
  fastAction: '#D4956A',
  onFastAction: '#1A0D04',
  trackWeight: '#E8A84C',
  streakAccent: '#F09040',

  background: '#100805',
  card: '#1C1009',
  surface: '#231409',
  surfaceWarm: '#271A0A',

  text: '#F2E5D0',
  textSecondary: '#C4A882',
  textMuted: '#B5A08A',
  textLight: '#FFFFFF',

  border: '#301E0F',
  borderLight: '#261508',

  success: '#7AAE79',
  successLight: '#162416',
  warning: '#E8C05A',
  warningLight: '#252010',
  error: '#D46060',
  errorLight: '#251212',

  tabBar: '#140A04',
  tabActive: '#E8913A',
  tabInactive: '#6E5540',

  overlay: 'rgba(0, 0, 0, 0.72)',
};

export default lightColors;
