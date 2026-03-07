export type UserSex = 'male' | 'female' | 'prefer_not_to_say';

export type AgeGroup =
  | 'under_18' | '18_25' | '26_35'
  | '36_45'    | '46_55' | '56_65' | '65_plus';

export type FastingLevel = 'beginner' | 'intermediate' | 'experienced';

export type FastingPath = 'if' | 'vedic' | 'both';

export const AGE_GROUP_TO_NUMBER: Record<AgeGroup, number> = {
  under_18: 16,
  '18_25': 22,
  '26_35': 30,
  '36_45': 40,
  '46_55': 50,
  '56_65': 60,
  '65_plus': 70,
};

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  mealCost: number;
}

export interface UserProfile {
  name: string;
  ageGroup: AgeGroup | null;
  fastingLevel: FastingLevel | null;
  fastingPath: FastingPath;
  currency?: string;
  createdAt: number;
}
