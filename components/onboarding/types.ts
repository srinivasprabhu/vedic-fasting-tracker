import type { ReactNode } from 'react';

export interface OnboardingSlideData {
  id: string;
  tag: string;
  title: string;
  titleAccent?: string;
  body: string;
  icon: string;
  iconComponent?: ReactNode;
  bgColors: readonly [string, string, string];
  accentColor: string;
  iconBg: string;
}
