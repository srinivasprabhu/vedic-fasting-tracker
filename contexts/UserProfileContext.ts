import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import {
  UserProfile,
  UserSex,
  FastingPurpose,
  WeightUnit,
  hasBodyMetrics,
  type PlanTemplateId,
} from '@/types/user';
import { calculatePlan } from '@/utils/calculatePlan';
import { detectCurrencyFromLocale, getCurrencyInfo } from '@/constants/currencies';
import { useAuth } from '@/contexts/AuthContext';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { supabase } from '@/lib/supabase';
import { PROFILE_STORAGE_KEY } from '@/constants/storageKeys';

async function loadProfile(): Promise<UserProfile | null> {
  try {
    const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.log('Failed to load user profile:', e);
    return null;
  }
}

async function saveProfile(profile: UserProfile): Promise<UserProfile> {
  try {
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    console.log('User profile saved:', profile.name);
  } catch (e) {
    console.log('Failed to save user profile:', e);
  }
  return profile;
}

export const [UserProfileProvider, useUserProfile] = createContextHook(() => {
  const { user, isAuthenticated } = useAuth();
  const { isProUser, toggleDevProOverride } = useRevenueCat();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const toggleProUser = useCallback(async () => {
    if (!__DEV__) return;
    await toggleDevProOverride();
  }, [toggleDevProOverride]);

  const profileQuery = useQuery({
    queryKey: ['user-profile'],
    queryFn: loadProfile,
  });

  const saveMutation = useMutation({
    mutationFn: saveProfile,
  });
  const saveMutateRef = useRef(saveMutation.mutate);
  saveMutateRef.current = saveMutation.mutate;

  useEffect(() => {
    if (profileQuery.data !== undefined) {
      let p = profileQuery.data;
      // One-time migration: backfill startingWeightKg from the first weight log
      // or from currentWeightKg if no startingWeightKg was saved
      if (p && p.currentWeightKg && !p.startingWeightKg) {
        (async () => {
          try {
            const raw = await AsyncStorage.getItem('aayu_weight_log');
            const log: { kg: number; time: number }[] = raw ? JSON.parse(raw) : [];
            // Use the oldest log entry, or currentWeightKg as fallback
            const oldest = log.length > 0 ? log[log.length - 1].kg : p!.currentWeightKg!;
            const migrated = { ...p!, startingWeightKg: oldest };
            setProfile(migrated);
            saveMutateRef.current(migrated);
          } catch {
            const migrated = { ...p!, startingWeightKg: p!.currentWeightKg };
            setProfile(migrated);
            saveMutateRef.current(migrated);
          }
        })();
      } else {
        setProfile(p);
      }
    }
  }, [profileQuery.data]);

  // ── Supabase sync ──────────────────────────────────────────────────────────

  const syncToSupabase = useCallback((p: UserProfile) => {
    if (!isAuthenticated || !user?.id) return;
    supabase
      .from('profiles')
      .upsert(
        {
          id:                user.id,
          name:              p.name,
          age_group:         p.ageGroup ?? null,
          fasting_level:     p.fastingLevel ?? null,
          fasting_path:      p.fastingPath ?? 'if',
          currency:          p.currency ?? null,
          // New body metric fields
          sex:               p.sex ?? null,
          dob:               p.dob ?? null,
          height_cm:         p.heightCm ?? null,
          current_weight_kg: p.currentWeightKg ?? null,
          goal_weight_kg:    p.goalWeightKg ?? null,
          weight_unit:       p.weightUnit ?? 'kg',
          fasting_purpose:   p.fastingPurpose ?? null,
          plan:              p.plan ?? null,
        },
        { onConflict: 'id' }
      )
      .then(({ error }) => {
        if (error) console.warn('Supabase profile upsert failed:', error);
      });
  }, [isAuthenticated, user?.id]);

  // ── updateProfile — existing API, unchanged ────────────────────────────────

  const updateProfile = useCallback((newProfile: UserProfile) => {
    const withPlan: UserProfile = hasBodyMetrics(newProfile)
      ? { ...newProfile, plan: calculatePlan(newProfile) ?? newProfile.plan }
      : newProfile;
    setProfile(withPlan);
    saveMutateRef.current(withPlan);
    syncToSupabase(withPlan);
  }, [syncToSupabase]);

  // ── updateBodyMetrics — called from Step 5 ────────────────────────────────

  const updateBodyMetrics = useCallback((metrics: {
    sex:             UserSex;
    dob?:            string;
    heightCm:        number;
    currentWeightKg: number;
    goalWeightKg?:   number;
    weightUnit?:     WeightUnit;
    fastingPurpose?: FastingPurpose;
  }) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const updated: UserProfile = { ...prev, ...metrics };
      // Preserve startingWeightKg — set it once (first time body metrics are saved)
      if (!updated.startingWeightKg) {
        updated.startingWeightKg = metrics.currentWeightKg;
      }
      updated.plan = calculatePlan(updated) ?? prev.plan;
      saveMutateRef.current(updated);
      syncToSupabase(updated);
      return updated;
    });
  }, [syncToSupabase]);

  // ── updateFastPlan — change fasting protocol from plan picker ──────────────

  const updateFastPlan = useCallback(
    (
      fastHours: number,
      eatHours: number,
      planLabel: string,
      opts?: { planId?: string; weeklyFastDays?: number[] },
    ) => {
      setProfile((prev) => {
        if (!prev) return prev;
        const isWeekly = opts?.planId === 'if_5_2' || opts?.planId === 'if_4_3';
        const templateId = isWeekly ? (opts!.planId as PlanTemplateId) : undefined;
        const weeklyDays = isWeekly ? (opts?.weeklyFastDays ?? prev.plan?.weeklyFastDays) : undefined;

        const updatedPlan = prev.plan
          ? {
              ...prev.plan,
              fastHours,
              eatHours,
              fastLabel: planLabel,
              ...(isWeekly
                ? { planTemplateId: templateId, weeklyFastDays: weeklyDays }
                : { planTemplateId: undefined, weeklyFastDays: undefined }),
            }
          : {
              fastHours,
              eatHours,
              fastLabel: planLabel,
              dailySteps: 8000,
              dailyWaterMl: 2500,
              dailyCalories: 1800,
              dailyDeficit: 0,
              bmr: 0,
              tdee: 0,
              bmi: null,
              bmiCategory: null,
              weeksToGoal: null,
              generatedAt: Date.now(),
              ...(isWeekly ? { planTemplateId: templateId, weeklyFastDays: weeklyDays } : {}),
            };
        const updated: UserProfile = { ...prev, plan: updatedPlan };
        saveMutateRef.current(updated);
        syncToSupabase(updated);
        return updated;
      });
    },
    [syncToSupabase],
  );

  const updateWeeklyFastDays = useCallback(
    (days: number[]) => {
      setProfile((prev) => {
        if (!prev?.plan?.planTemplateId) return prev;
        const tid = prev.plan.planTemplateId;
        if (tid !== 'if_5_2' && tid !== 'if_4_3') return prev;
        const updatedPlan = { ...prev.plan, weeklyFastDays: days };
        const updated: UserProfile = { ...prev, plan: updatedPlan };
        saveMutateRef.current(updated);
        syncToSupabase(updated);
        return updated;
      });
    },
    [syncToSupabase],
  );

  // ── updateDailyTarget — change steps or water target from detail pages ──

  const updateDailyTarget = useCallback((key: 'dailySteps' | 'dailyWaterMl', value: number) => {
    setProfile((prev) => {
      if (!prev?.plan) return prev;
      const updatedPlan = { ...prev.plan, [key]: value };
      const updated: UserProfile = { ...prev, plan: updatedPlan };
      saveMutateRef.current(updated);
      syncToSupabase(updated);
      return updated;
    });
  }, [syncToSupabase]);

  // ── refreshPlan — call after weight is logged ─────────────────────────────

  const refreshPlan = useCallback(() => {
    setProfile((prev) => {
      if (!prev || !hasBodyMetrics(prev)) return prev;
      const newPlan = calculatePlan(prev);
      if (!newPlan) return prev;
      const updated: UserProfile = { ...prev, plan: newPlan };
      saveMutateRef.current(updated);
      return updated;
    });
  }, []);

  // ── Existing helpers (unchanged) ──────────────────────────────────────────

  const currencyCode = profile?.currency ?? detectCurrencyFromLocale();
  const currencyInfo = getCurrencyInfo(currencyCode);
  const hasProfile   = profile !== null;

  const getGreeting = useCallback(() => {
    return profile?.name ?? '';
  }, [profile?.name]);

  const getInitial = useCallback(() => {
    if (!profile?.name) return '✦';
    return profile.name.charAt(0).toUpperCase();
  }, [profile?.name]);

  return {
    profile,
    hasProfile,
    isLoading: profileQuery.isLoading,
    // Existing API — unchanged
    updateProfile,
    getGreeting,
    getInitial,
    currencyInfo,
    // New
    updateBodyMetrics,
    refreshPlan,
    updateFastPlan,
    updateWeeklyFastDays,
    updateDailyTarget,
    // Pro testing
    isProUser,
    toggleProUser,
  };
});
