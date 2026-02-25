export type UserSex = 'male' | 'female' | 'prefer_not_to_say';

export interface UserProfile {
  name: string;
  sex: UserSex;
  age: number;
  createdAt: number;
}
