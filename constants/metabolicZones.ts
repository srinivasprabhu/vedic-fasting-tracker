/**
 * Semantic palette for fasting metabolic timeline UI.
 * Single source for zone rails, dots, and related accents (not theme-variant).
 */
export const METABOLIC_ZONE_PALETTE = {
  anabolic: '#5b8dd9',
  catabolic: '#d4a017',
  fatBurning: '#e07b30',
  ketosis: '#c05050',
  autophagy: '#8b6bbf',
  deepRenewal: '#3aaa6e',
} as const;

export type MetabolicZoneKey = keyof typeof METABOLIC_ZONE_PALETTE;
