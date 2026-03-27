import type {
  UserProfile, UserPlan, UserSex,
  FastingPurpose, FastingLevel, ActivityLevel,
  BmiCategory, AgeGroup, WeightUnit,
} from '@/types/user';
import { AGE_GROUP_TO_NUMBER } from '@/types/user';

// ─── Unit conversions ─────────────────────────────────────────────────────────

export const kgToLbs = (kg: number): number =>
  Math.round(kg * 2.20462 * 10) / 10;

export const lbsToKg = (lbs: number): number =>
  Math.round((lbs / 2.20462) * 100) / 100;

export const displayWeight = (kg: number, unit: WeightUnit): number =>
  unit === 'lbs' ? kgToLbs(kg) : Math.round(kg * 10) / 10;

export const cmToFtIn = (cm: number): string => {
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inch = Math.round(totalIn % 12);
  return `${ft}'${inch}"`;
};

// ─── Age ──────────────────────────────────────────────────────────────────────

export function getAgeFromDob(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return Math.max(10, age);
}

export function getAge(profile: UserProfile): number {
  if (profile.dob) return getAgeFromDob(profile.dob);
  if (profile.ageGroup) return AGE_GROUP_TO_NUMBER[profile.ageGroup];
  return 30;
}

// ─── BMR — Mifflin-St Jeor ────────────────────────────────────────────────────

export function calcBMR(
  weightKg: number,
  heightCm: number,
  age:      number,
  sex:      UserSex,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  switch (sex) {
    case 'male':               return Math.round(base + 5);
    case 'female':             return Math.round(base - 161);
    case 'prefer_not_to_say':  return Math.round(base - 78);
  }
}

// ─── TDEE — uses ActivityLevel (preferred) or FastingLevel (legacy) ───────────

const ACTIVITY_MULTIPLIER: Record<ActivityLevel | FastingLevel | 'default', number> = {
  sedentary:         1.2,
  lightly_active:    1.375,
  moderately_active: 1.55,
  very_active:       1.725,
  // legacy fallbacks
  beginner:          1.375,
  intermediate:      1.55,
  experienced:       1.725,
  default:           1.375,
};

export function calcTDEE(
  bmr:           number,
  activityLevel: ActivityLevel | null,
  fastingLevel:  FastingLevel | null,
): number {
  const key = activityLevel ?? fastingLevel ?? 'default';
  const mult = ACTIVITY_MULTIPLIER[key];
  return Math.round(bmr * mult);
}

// ─── BMI ──────────────────────────────────────────────────────────────────────

export function calcBMI(weightKg: number, heightCm: number): number {
  const hm = heightCm / 100;
  return Math.round((weightKg / (hm * hm)) * 10) / 10;
}

export function getBMICategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25)   return 'normal';
  if (bmi < 30)   return 'overweight';
  return 'obese';
}

export function bmiCategoryLabel(cat: BmiCategory | null): string {
  switch (cat) {
    case 'underweight': return 'Underweight';
    case 'normal':      return 'Normal';
    case 'overweight':  return 'Overweight';
    case 'obese':       return 'Obese';
    default:            return '—';
  }
}

export function bmiCategoryColor(cat: BmiCategory | null, isDark: boolean): string {
  switch (cat) {
    case 'underweight': return isDark ? '#5b8dd9' : '#2255b0';
    case 'normal':      return isDark ? '#7AAE79' : '#187040';
    case 'overweight':  return isDark ? '#E8C05A' : '#a06820';
    case 'obese':       return isDark ? '#D46060' : '#c05050';
    default:            return isDark ? '#6E5540' : '#7a5028';
  }
}

// ─── IF Protocol ──────────────────────────────────────────────────────────────
// Beginners always start at 12:12 — plan upgrades shown in-app over 4 weeks.

interface IFProtocol { fastHours: number; eatHours: number; fastLabel: string; }

export function selectIFProtocol(
  purpose: FastingPurpose | undefined,
  level:   FastingLevel | null,
  bmi:     number | null,
): IFProtocol {
  // Safety overrides
  if (bmi !== null && bmi < 18.5) return { fastHours: 12, eatHours: 12, fastLabel: '12:12' };
  if (bmi !== null && bmi >= 35)  return { fastHours: 14, eatHours: 10, fastLabel: '14:10' };

  // Beginners always start gentle
  if (level === 'beginner') return { fastHours: 12, eatHours: 12, fastLabel: '12:12' };

  switch (purpose) {
    case 'weight_loss':
      if (level === 'experienced')  return { fastHours: 18, eatHours: 6,  fastLabel: '18:6' };
      return                               { fastHours: 16, eatHours: 8,  fastLabel: '16:8' };
    case 'energy':
    case 'metabolic':
      if (level === 'experienced')  return { fastHours: 18, eatHours: 6,  fastLabel: '18:6' };
      return                               { fastHours: 16, eatHours: 8,  fastLabel: '16:8' };
    case 'spiritual':
      return { fastHours: 16, eatHours: 8, fastLabel: '16:8' };
    default:
      return { fastHours: 16, eatHours: 8, fastLabel: '16:8' };
  }
}

// ─── Calories ─────────────────────────────────────────────────────────────────

export function calcDailyCalories(
  tdee:        number,
  purpose:     FastingPurpose | undefined,
  bmi:         number | null,
  sex?:        UserSex,
  hasGoalWeight?: boolean,
  age?:        number,
): { calories: number; deficit: number } {
  // Sex-aware calorie floor: 1500 for males, 1200 for females
  const floor = sex === 'male' ? 1500 : 1200;

  // Under 18: never create a calorie deficit — growing bodies need full nutrition
  if (age !== undefined && age < 18) return { calories: tdee, deficit: 0 };

  if (bmi !== null && bmi < 18.5) return { calories: tdee + 100, deficit: -100 };

  // If user set a goal weight (they want to lose), bump the deficit
  // even if their stated purpose isn't "weight_loss"
  const effectivePurpose = (hasGoalWeight && purpose !== 'weight_loss')
    ? 'weight_loss_mild' : purpose;

  switch (effectivePurpose) {
    case 'weight_loss': {
      const deficit = 400;
      return { calories: Math.max(floor, tdee - deficit), deficit };
    }
    case 'weight_loss_mild': {
      // User has a goal weight but primary purpose isn't weight loss
      // Use a moderate deficit (300) instead of the tiny purpose-based one
      const deficit = 300;
      return { calories: Math.max(floor, tdee - deficit), deficit };
    }
    case 'energy':
    case 'metabolic': {
      const deficit = 100;
      return { calories: Math.max(floor, tdee - deficit), deficit };
    }
    case 'spiritual': {
      const calories = Math.round(tdee * 0.85);
      return { calories: Math.max(floor, calories), deficit: tdee - Math.max(floor, calories) };
    }
    default: {
      const deficit = 300;
      return { calories: Math.max(floor, tdee - deficit), deficit };
    }
  }
}

// ─── Water ────────────────────────────────────────────────────────────────────

export function calcDailyWaterMl(weightKg: number): number {
  return Math.max(1500, Math.round((weightKg * 35) / 100) * 100);
}

// ─── Steps ────────────────────────────────────────────────────────────────────

export function calcDailySteps(
  purpose:       FastingPurpose | undefined,
  level:         FastingLevel | null,
  activityLevel: ActivityLevel | null,
  ageGroup:      AgeGroup | null,
): number {
  let steps = 7000;

  // Activity level base
  switch (activityLevel) {
    case 'sedentary':         steps = 5000; break;
    case 'lightly_active':    steps = 7000; break;
    case 'moderately_active': steps = 8500; break;
    case 'very_active':       steps = 10000; break;
    default: break;
  }

  // Purpose adjustment
  switch (purpose) {
    case 'weight_loss': steps += 1000; break;
    case 'energy':      steps += 500;  break;
    default: break;
  }

  // Age adjustment
  if (ageGroup === '46_55' || ageGroup === '56_65' || ageGroup === '65_plus') {
    steps -= 500;
  }

  return Math.max(4000, Math.round(steps / 500) * 500);
}

// ─── Weeks to goal ────────────────────────────────────────────────────────────

// Realistic projection that accounts for:
//  1. Calorie deficit from diet
//  2. IF metabolic bonus (15-20% more fat loss than CICO alone per research)
//  3. Steps/activity calorie burn beyond sedentary baseline
//  4. Initial water weight drop in first 1-2 weeks of IF
//  5. Non-linear curve: faster early, slight adaptive slowdown after week 8
//  6. Age-adjusted metabolic recovery rate
export function calcWeeksToGoal(
  currentKg: number,
  goalKg:    number,
  deficit:   number,
  options?: {
    fastHours?:     number;
    dailySteps?:    number;
    activityLevel?: ActivityLevel | null;
    age?:           number;
  },
): number | null {
  if (goalKg >= currentKg || deficit <= 0) return null;
  const kgToLose = currentKg - goalKg;

  // Base loss from calorie deficit: 7700 kcal = 1 kg fat
  const baseKgPerWeek = (deficit * 7) / 7700;

  // 1. IF metabolic bonus: research shows 15-20% more fat loss with IF
  const fastHours = options?.fastHours ?? 16;
  const ifBonus = fastHours >= 18 ? 0.20
    : fastHours >= 16 ? 0.17
    : fastHours >= 14 ? 0.12
    : fastHours >= 12 ? 0.08
    : 0.05;

  // 2. Steps: ~0.04 kcal per step above sedentary baseline (3000)
  const steps = options?.dailySteps ?? 7000;
  const extraStepsBurn = Math.max(0, (steps - 3000) * 0.04);
  const stepsKgPerWeek = (extraStepsBurn * 7) / 7700;

  // 3. Age factor
  const age = options?.age ?? 35;
  const ageFactor = age < 30 ? 1.05 : age < 40 ? 1.0 : age < 50 ? 0.97 : 0.93;

  // Effective weekly loss (steady state)
  const effectiveKgPerWeek = (baseKgPerWeek * (1 + ifBonus) + stepsKgPerWeek) * ageFactor;

  // 4. Initial water weight from glycogen depletion (~1-1.5kg in weeks 1-2)
  const waterWeightBonus = fastHours >= 14 ? 1.2 : fastHours >= 12 ? 0.8 : 0.4;

  // 5. Week-by-week simulation with non-linear curve
  let remaining = kgToLose;
  let weeks = 0;

  while (remaining > 0 && weeks < 200) {
    weeks++;
    let weekLoss: number;
    if (weeks <= 2) {
      weekLoss = effectiveKgPerWeek + (waterWeightBonus / 2);
    } else if (weeks <= 8) {
      weekLoss = effectiveKgPerWeek;
    } else {
      const slowdown = Math.min(0.08, (weeks - 8) * 0.003);
      weekLoss = effectiveKgPerWeek * (1 - slowdown);
    }
    remaining -= weekLoss;
  }

  return Math.max(1, weeks);
}

// ─── Master function ──────────────────────────────────────────────────────────

export function calculatePlan(profile: UserProfile): UserPlan | null {
  const { sex, heightCm, currentWeightKg } = profile;
  if (!sex || !heightCm || !currentWeightKg) return null;

  const age     = getAge(profile);

  // ── Safety: minors and underweight ────────────────────────────────────────
  const bmiCheck = calcBMI(currentWeightKg, heightCm);
  // Under 18: never generate a weight-loss plan, override purpose
  const safePurpose = (age < 18 && profile.fastingPurpose === 'weight_loss')
    ? 'energy' as FastingPurpose
    : profile.fastingPurpose;
  // Underweight: clear goal weight to prevent deficit plan
  const safeGoalKg = (bmiCheck < 18.5 && profile.goalWeightKg && profile.goalWeightKg < currentWeightKg)
    ? undefined
    : profile.goalWeightKg;
  const bmr     = calcBMR(currentWeightKg, heightCm, age, sex);
  const tdee    = calcTDEE(bmr, profile.activityLevel ?? null, profile.fastingLevel ?? null);
  const bmi     = calcBMI(currentWeightKg, heightCm);
  const bmiCat  = getBMICategory(bmi);
  let protocol = selectIFProtocol(safePurpose, profile.fastingLevel ?? null, bmi);
  // Under 18: cap at 14:10 max — longer fasts not recommended for growing bodies
  if (age < 18 && protocol.fastHours > 14) {
    protocol = { fastHours: 14, eatHours: 10, fastLabel: '14:10' };
  }
  const { calories, deficit } = calcDailyCalories(
    tdee, safePurpose, bmi, sex, !!safeGoalKg, age,
  );
  const waterMl = calcDailyWaterMl(currentWeightKg);
  const steps   = calcDailySteps(
    safePurpose,
    profile.fastingLevel ?? null,
    profile.activityLevel ?? null,
    profile.ageGroup ?? null,
  );
  const weeksToGoal = safeGoalKg
    ? calcWeeksToGoal(currentWeightKg, safeGoalKg, deficit, {
        fastHours: protocol.fastHours,
        dailySteps: steps,
        activityLevel: profile.activityLevel ?? null,
        age,
      })
    : null;

  const prev = profile.plan;
  const keepWeekly =
    prev?.planTemplateId === 'if_5_2' || prev?.planTemplateId === 'if_4_3'
      ? {
          planTemplateId: prev.planTemplateId,
          weeklyFastDays: prev.weeklyFastDays,
          fastHours:      prev.fastHours,
          eatHours:       prev.eatHours,
          fastLabel:      prev.fastLabel,
        }
      : null;

  return {
    fastHours:     keepWeekly?.fastHours ?? protocol.fastHours,
    eatHours:      keepWeekly?.eatHours ?? protocol.eatHours,
    fastLabel:     keepWeekly?.fastLabel ?? protocol.fastLabel,
    dailySteps:    steps,
    dailyWaterMl:  waterMl,
    dailyCalories: calories,
    dailyDeficit:  deficit,
    bmr,
    tdee,
    bmi,
    bmiCategory:   bmiCat,
    weeksToGoal,
    generatedAt:   Date.now(),
    ...(keepWeekly?.planTemplateId
      ? { planTemplateId: keepWeekly.planTemplateId, weeklyFastDays: keepWeekly.weeklyFastDays }
      : {}),
  };
}

// ─── Display helpers ──────────────────────────────────────────────────────────

// ─── Adjusted timeline estimate for customised plans ───────────────────────
// Models how changing fasting hours and steps affects the timeline.
//  • Longer fasts shrink the eating window, increasing the effective deficit.
//    Each hour beyond 12h adds ~25 kcal to the effective daily deficit.
//  • More steps increase TDEE. ~1000 extra steps ≈ 40 kcal burned.
// These are approximations for display purposes — not clinical precision.

export function estimateAdjustedWeeksToGoal(
  basePlan:        UserPlan,
  customFastHours: number,
  customSteps:     number,
  currentKg:       number,
  goalKg:          number,
  age?:            number,
): number | null {
  if (goalKg >= currentKg || basePlan.dailyDeficit <= 0) return basePlan.weeksToGoal;

  const baseDeficit   = basePlan.dailyDeficit;
  const baseFastHours = basePlan.fastHours;
  const baseSteps     = basePlan.dailySteps;

  // Fasting bonus/penalty: each hour beyond base adds ~25 kcal deficit
  const fastDelta = (customFastHours - baseFastHours) * 25;

  // Steps bonus/penalty: each 1000 steps beyond base adds ~40 kcal burned
  const stepDelta = ((customSteps - baseSteps) / 1000) * 40;

  const adjustedDeficit = Math.max(50, Math.round(baseDeficit + fastDelta + stepDelta));

  // Use the improved formula with all factors
  return calcWeeksToGoal(currentKg, goalKg, adjustedDeficit, {
    fastHours: customFastHours,
    dailySteps: customSteps,
    age: age ?? 35,
  });
}

export function formatWater(ml: number): string {
  return ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml`;
}

export function formatSteps(steps: number): string {
  return steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : String(steps);
}

export function purposeLabel(purpose: FastingPurpose | undefined): string {
  switch (purpose) {
    case 'weight_loss': return 'Lose weight';
    case 'energy':      return 'Energy & focus';
    case 'metabolic':   return 'Metabolic health';
    case 'spiritual':   return 'Spiritual practice';
    default:            return 'General health';
  }
}

export function activityLabel(level: ActivityLevel | undefined): string {
  switch (level) {
    case 'sedentary':         return 'Sedentary';
    case 'lightly_active':    return 'Lightly active';
    case 'moderately_active': return 'Moderately active';
    case 'very_active':       return 'Very active';
    default:                  return '—';
  }
}
