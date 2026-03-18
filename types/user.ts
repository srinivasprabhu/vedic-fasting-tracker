export type UserSex = 'male' | 'female' | 'prefer_not_to_say';

export type AgeGroup =
  | 'under_18' | '18_25' | '26_35'
  | '36_45'    | '46_55' | '56_65' | '65_plus';

export type FastingLevel = 'beginner' | 'intermediate' | 'experienced';

export type FastingPath = 'if' | 'vedic' | 'both';

export type FastingPurpose =
  | 'weight_loss'
  | 'energy'
  | 'metabolic'
  | 'spiritual';

export type WeightUnit = 'kg' | 'lbs';

export type ActivityLevel =
  | 'sedentary'       // desk job, little movement
  | 'lightly_active'  // light exercise 1-3 days/week
  | 'moderately_active' // moderate exercise 3-5 days
  | 'very_active';    // hard exercise 6-7 days

export type HealthConcern =
  | 'none'
  | 'diabetes'
  | 'thyroid'
  | 'pcos'
  | 'hypertension'
  | 'cholesterol'
  | 'heart'
  | 'prefer_not';

export type LastMealTime = '7pm' | '8pm' | '9pm' | '10pm' | 'later';

export interface SafetyFlags {
  pregnant?:           boolean;
  breastfeeding?:      boolean;
  eatingDisorder?:     boolean;
  fastingMedications?: boolean;
}

export type BmiCategory =
  | 'underweight'
  | 'normal'
  | 'overweight'
  | 'obese';

export const AGE_GROUP_TO_NUMBER: Record<AgeGroup, number> = {
  under_18: 16,
  '18_25':  22,
  '26_35':  30,
  '36_45':  40,
  '46_55':  50,
  '56_65':  60,
  '65_plus': 70,
};

export interface CurrencyInfo {
  code:     string;
  symbol:   string;
  name:     string;
  mealCost: number;
}

// ─── Generated plan (stored on profile after setup) ───────────────────────────

export interface UserPlan {
  fastHours:      number;
  eatHours:       number;
  fastLabel:      string;
  dailySteps:     number;
  dailyWaterMl:   number;
  dailyCalories:  number;
  dailyDeficit:   number;
  bmr:            number;
  tdee:           number;
  bmi:            number | null;
  bmiCategory:    BmiCategory | null;
  weeksToGoal:    number | null;
  generatedAt:    number;
}

// ─── User profile ─────────────────────────────────────────────────────────────

export interface UserProfile {
  // ── Original fields ───────────────────────────────────────────────────────
  name:          string;
  ageGroup:      AgeGroup | null;
  fastingLevel:  FastingLevel | null;
  fastingPath:   FastingPath;
  currency?:     string;
  createdAt:     number;

  // ── New fields ────────────────────────────────────────────────────────────
  sex?:              UserSex;
  dob?:              string;
  heightCm?:         number;
  currentWeightKg?:  number;
  startingWeightKg?: number;   // set once during onboarding, never overwritten
  goalWeightKg?:     number;
  weightUnit?:       WeightUnit;
  fastingPurpose?:   FastingPurpose;
  activityLevel?:    ActivityLevel;
  healthConcerns?:   HealthConcern[];
  lastMealTime?:     LastMealTime;
  safetyFlags?:      SafetyFlags;

  // ── Cached plan ───────────────────────────────────────────────────────────
  plan?:             UserPlan;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function hasBodyMetrics(profile: UserProfile | null): boolean {
  return !!(profile?.sex && profile?.heightCm && profile?.currentWeightKg);
}

export function hasPlan(profile: UserProfile | null): boolean {
  return !!(profile?.plan?.fastHours);
}
