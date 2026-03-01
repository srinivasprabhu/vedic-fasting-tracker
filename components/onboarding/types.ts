export interface OnboardingSlideData {
  id: string;
  tag: string;
  title: string;
  titleAccent?: string;
  body: string;
  icon: string;
  bgColors: readonly [string, string, string];
  accentColor: string;
  iconBg: string;
}
