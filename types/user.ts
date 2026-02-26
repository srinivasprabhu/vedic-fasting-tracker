export type UserSex = 'male' | 'female' | 'prefer_not_to_say';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  mealCost: number;
}

export interface UserProfile {
  name: string;
  sex: UserSex;
  age: number;
  currency?: string;
  createdAt: number;
}
