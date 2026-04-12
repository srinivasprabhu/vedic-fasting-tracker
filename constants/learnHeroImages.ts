import type { ImageSourcePropType } from 'react-native';

import type { LearnHeroImageKey } from '@/types/learn';

export const LEARN_HERO_IMAGES: Record<LearnHeroImageKey, ImageSourcePropType> = {
  biological_clock: require('../assets/learn/hero-biological-clock.png'),
  balance_wellness: require('../assets/learn/hero-balance-wellness.png'),
};

export function resolveLearnHeroImage(key: LearnHeroImageKey | undefined): ImageSourcePropType | undefined {
  if (!key) return undefined;
  return LEARN_HERO_IMAGES[key];
}
