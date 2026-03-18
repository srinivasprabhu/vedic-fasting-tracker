import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing,
  TouchableOpacity, KeyboardAvoidingView,
  Platform, StatusBar, ViewStyle, TextStyle, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Step1Name }           from '@/components/profile-setup/Step1Name';
import { StepGoal }            from '@/components/profile-setup/StepGoal';
import { StepSex }             from '@/components/profile-setup/StepSex';
import { StepAge }             from '@/components/profile-setup/StepAge';
import { StepHeight }          from '@/components/profile-setup/StepHeight';
import { StepCurrentWeight }   from '@/components/profile-setup/StepCurrentWeight';
import { StepTargetWeight }    from '@/components/profile-setup/StepTargetWeight';
import { StepActivity }        from '@/components/profile-setup/StepActivity';
import { StepLastMeal }        from '@/components/profile-setup/StepLastMeal';
import { StepHealthConcerns }  from '@/components/profile-setup/StepHealthConcerns';
import { StepSafety }          from '@/components/profile-setup/StepSafety';
import { Step3Level as StepExperience }  from '@/components/profile-setup/Step3Level';
import { StepBuildingPlan }              from '@/components/profile-setup/StepBuildingPlan';
import { Step6Plan as StepPlanReveal } from '@/components/profile-setup/Step6Plan';
import { SetupHeader }                  from '@/components/profile-setup/SetupHeader';

import { useTheme }       from '@/contexts/ThemeContext';
import { useAuth }        from '@/contexts/AuthContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { FONTS, SPACING } from '@/constants/theme';
import { calculatePlan }  from '@/utils/calculatePlan';
import type {
  FastingPurpose, UserSex, WeightUnit,
  ActivityLevel, HealthConcern, FastingLevel, UserPlan,
  LastMealTime, SafetyFlags,
} from '@/types/user';

const TOTAL_STEPS = 14;

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  const { profile, updateProfile, updateBodyMetrics, isLoading } = useUserProfile();

  const [step, setStep]                   = useState(1);
  const [name, setName]                   = useState('');
  const [purpose, setPurpose]             = useState<FastingPurpose | null>(null);
  const [sex, setSex]                     = useState<UserSex | null>(null);
  const [age, setAge]                     = useState(28);     // ruler opens at 28
  const [heightCm, setHeightCm]           = useState('170');  // ruler opens at 170 cm
  const [currentWeight, setCurrentWeight] = useState('80');   // ruler opens at 80 kg
  const [targetWeight, setTargetWeight]   = useState('75');   // ruler opens at 75 kg
  const [weightUnit, setWeightUnit]       = useState<WeightUnit>('kg');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [lastMealTime, setLastMealTime]   = useState<LastMealTime | null>(null);
  const [healthConcerns, setHealthConcerns] = useState<HealthConcern[]>(['none']);
  const [safetyFlags, setSafetyFlags]     = useState<SafetyFlags>({});
  const [fastingLevel, setFastingLevel]   = useState<FastingLevel | null>(null);


  useEffect(() => {
    if (!isLoading && isAuthenticated && profile?.name?.trim()) {
      router.replace('/(tabs)/(home)' as any);
    }
  }, [isAuthenticated, profile?.name, isLoading]);

  // Live plan for reveal screen
  const plan: UserPlan | null = useMemo(() => {
    if (!sex || !heightCm || !currentWeight) return null;
    const kg  = weightUnit === 'lbs' ? parseFloat(currentWeight) / 2.20462 : parseFloat(currentWeight);
    const gkg = targetWeight
      ? (weightUnit === 'lbs' ? parseFloat(targetWeight) / 2.20462 : parseFloat(targetWeight))
      : undefined;
    if (isNaN(kg) || isNaN(parseFloat(heightCm))) return null;
    return calculatePlan({
      name, fastingLevel, fastingPath: 'if', createdAt: Date.now(),
      ageGroup: null, dob: `${new Date().getFullYear() - age}-06-15`,
      sex, heightCm: parseFloat(heightCm),
      currentWeightKg: kg, goalWeightKg: gkg,
      weightUnit, fastingPurpose: purpose ?? undefined,
      activityLevel: activityLevel ?? undefined,
      healthConcerns: healthConcerns.length > 0 ? healthConcerns : undefined,
      lastMealTime: lastMealTime ?? undefined,
      safetyFlags: Object.keys(safetyFlags).length > 0 ? safetyFlags : undefined,
    });
  }, [sex, heightCm, currentWeight, targetWeight, weightUnit, purpose, fastingLevel, activityLevel, healthConcerns, name]);

  const progressAnim   = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide   = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: step / TOTAL_STEPS, duration: 420,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, [step]);

  const animateIn = useCallback(() => {
    contentOpacity.setValue(0);
    contentSlide.setValue(18);
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 1, duration: 480, delay: 60, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(contentSlide,   { toValue: 0, duration: 480, delay: 60, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => { animateIn(); }, [step]);
  useEffect(() => { animateIn(); }, []);

  const handleBack = useCallback(() => {
    if (step > 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Skip the building screen when going back from the plan reveal
      setStep(s => s === 14 ? 12 : s - 1);
    }
  }, [step]);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < TOTAL_STEPS) { setStep(s => s + 1); } else { handleComplete(); }
  }, [step]);

  const handleComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const kg  = weightUnit === 'lbs' ? parseFloat(currentWeight) / 2.20462 : parseFloat(currentWeight);
    const gkg = targetWeight
      ? (weightUnit === 'lbs' ? parseFloat(targetWeight) / 2.20462 : parseFloat(targetWeight))
      : undefined;
    const dob = `${new Date().getFullYear() - age}-06-15`;
    const base = { name: name.trim() || 'Friend', ageGroup: null as null, fastingLevel, fastingPath: 'if' as const, createdAt: Date.now(), dob };
    if (sex && heightCm && !isNaN(kg)) {
      updateProfile(base);
      updateBodyMetrics({ sex, dob, heightCm: parseFloat(heightCm), currentWeightKg: kg, goalWeightKg: gkg, weightUnit, fastingPurpose: purpose ?? undefined });
    } else { updateProfile(base); }
    router.replace('/(tabs)/(home)' as any);
  }, [name, fastingLevel, sex, heightCm, currentWeight, targetWeight, weightUnit, purpose, updateProfile, updateBodyMetrics]);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateProfile({ name: 'Friend', ageGroup: null, fastingLevel: null, fastingPath: 'if', createdAt: Date.now() });
    router.replace('/(tabs)/(home)' as any);
  }, [updateProfile]);

  const canProceed = useMemo(() => {
    switch (step) {
      case 1:  return name.trim().length > 0;
      case 2:  return purpose !== null;
      case 3:  return sex !== null;
      case 4:  return age >= 14 && age <= 80;
      case 5:  return parseFloat(heightCm) > 50;
      case 6:  return parseFloat(currentWeight) > 0;
      case 7:  return true;
      case 8:  return activityLevel !== null;
      case 9:  return lastMealTime !== null;
      case 10: return true;  // health concerns
      case 11: return true;  // safety — always can proceed
      case 12: return fastingLevel !== null;
      case 13: return false; // building screen — auto-advances, no CTA
      case 14: return true;
      default: return false;
    }
  }, [step, name, purpose, sex, age, heightCm, currentWeight, activityLevel, lastMealTime, fastingLevel]);

  const ctaLabel = useMemo(() => {
    if (step === 7)  return targetWeight ? 'Continue →' : 'Skip for now →';
    if (step === 12) return plan ? 'Build my plan →' : 'Continue →';
    if (step === 13) return '';  // building screen — no CTA shown
    if (step === 14) return 'Start my first fast →';
    return 'Continue →';
  }, [step, targetWeight, plan]);

  const renderStep = () => {
    switch (step) {
      case 1:  return <Step1Name value={name} onChange={setName} onSubmit={canProceed ? handleNext : undefined} />;
      case 2:  return <StepGoal value={purpose} onChange={setPurpose} />;
      case 3:  return <StepSex value={sex} onChange={setSex} />;
      case 4:  return <StepAge value={age} onChange={setAge} />;
      case 5:  return <StepHeight value={heightCm} onChange={setHeightCm} />;
      case 6:  return <StepCurrentWeight value={currentWeight} onChange={setCurrentWeight} heightCm={heightCm} unit={weightUnit} onUnitChange={setWeightUnit} />;
      case 7:  return <StepTargetWeight value={targetWeight} onChange={setTargetWeight} currentWeightKg={currentWeight} heightCm={heightCm} unit={weightUnit} />;
      case 8:  return <StepActivity value={activityLevel} onChange={setActivityLevel} />;
      case 9:  return <StepLastMeal value={lastMealTime} onChange={setLastMealTime} />;
      case 10: return <StepHealthConcerns value={healthConcerns} onChange={setHealthConcerns} />;
      case 11: return <StepSafety value={safetyFlags} onChange={setSafetyFlags} sex={sex} />;
      case 12: return <StepExperience value={fastingLevel} onChange={setFastingLevel} />;
      case 13: return <StepBuildingPlan userName={name} onComplete={handleNext} />;
      case 14: {
        if (!plan) return null;
        const cwKg = weightUnit === 'lbs' ? parseFloat(currentWeight) / 2.20462 : parseFloat(currentWeight);
        const gwKg = targetWeight
          ? (weightUnit === 'lbs' ? parseFloat(targetWeight) / 2.20462 : parseFloat(targetWeight))
          : undefined;
        const mealHourMap: Record<string, number> = { '7pm': 19, '8pm': 20, '9pm': 21, '10pm': 22, 'later': 23 };
        const mealHour = lastMealTime ? mealHourMap[lastMealTime] ?? 20 : 20;
        return (
          <StepPlanReveal
            plan={plan}
            userName={name}
            currentWeightKg={cwKg}
            goalWeightKg={gwKg}
            weightUnit={weightUnit}
            lastMealHour={mealHour}
          />
        );
      }
      default: return null;
    }
  };

  const goldColor   = isDark ? '#c8872a' : '#a06820';
  const goldLight   = isDark ? '#e8a84c' : '#b07020';
  const bgColors    = isDark
    ? ['#1a0d04', '#0e0703', '#070402'] as const
    : ['#fdf3e3', '#faf0e4', '#f8edd8'] as const;

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#070402' : '#fdf3e3' }}>
      <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

        <LinearGradient colors={bgColors} style={StyleSheet.absoluteFillObject} start={{ x: .3, y: 0 }} end={{ x: .7, y: 1 }} />
        <View style={[s.ambientGlow, { backgroundColor: goldColor, opacity: isDark ? .04 : .035 }]} />

        {step !== 13 && (
          <View style={[s.progressTrack, { top: insets.top }]}>
            <Animated.View style={[s.progressFill, {
              width: progressAnim.interpolate({ inputRange: [0,1], outputRange: ['0%','100%'] }),
              backgroundColor: goldLight, shadowColor: goldLight,
            }]} />
          </View>
        )}

        {step !== 13 && (
          <SetupHeader step={step > 13 ? step - 1 : step} total={TOTAL_STEPS - 1} onBack={step > 1 ? handleBack : undefined} style={{ paddingTop: insets.top + 12 }} />
        )}

        <ScrollView
          contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 120 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEnabled
          nestedScrollEnabled
        >
          <Animated.View style={[s.stepWrap, { opacity: contentOpacity, transform: [{ translateY: contentSlide }] }]}>
            {renderStep()}
          </Animated.View>
        </ScrollView>

        {step !== 13 && (
          <View style={[s.bottomWrap, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity
              activeOpacity={canProceed ? .85 : 1}
              onPress={canProceed ? handleNext : undefined}
              style={[s.ctaBtn, {
                backgroundColor: canProceed ? (isDark ? goldColor : '#b07020') : 'rgba(200,135,42,.2)',
                shadowColor: goldColor,
                shadowOpacity: canProceed ? (isDark ? .35 : .25) : 0,
                elevation: canProceed ? 8 : 0,
              }]}
            >
              <Text style={[s.ctaText, { color: canProceed ? (isDark ? '#1a0d04' : '#fff8ed') : 'rgba(200,135,42,.4)' }]}>
                {ctaLabel}
              </Text>
            </TouchableOpacity>

            {step === 1 && (
              <TouchableOpacity onPress={handleSkip} style={s.skipBtn}>
                <Text style={[s.skipText, { color: isDark ? 'rgba(240,224,192,.28)' : 'rgba(60,35,10,.28)' }]}>Skip for now</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1 }                                                             as ViewStyle,
  ambientGlow:   { position: 'absolute' as const, top: '10%', left: '5%', right: '5%', height: '40%', borderRadius: 300 } as ViewStyle,
  progressTrack: { position: 'absolute' as const, left: 0, right: 0, height: 3, backgroundColor: 'rgba(200,135,42,.12)', zIndex: 10 } as ViewStyle,
  progressFill:  { height: '100%' as any, borderRadius: 2, shadowOffset: { width: 0, height: 0 }, shadowOpacity: .6, shadowRadius: 4 } as ViewStyle,
  scrollContent: { flexGrow: 1 }                                                         as ViewStyle,
  stepWrap:      { flex: 1, paddingHorizontal: 24, paddingTop: 12 }                      as ViewStyle,
  bottomWrap:    { paddingHorizontal: 24, paddingTop: 12 }                               as ViewStyle,
  ctaBtn:        { borderRadius: 16, paddingVertical: 17, alignItems: 'center' as const, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14 } as ViewStyle,
  ctaText:       { fontFamily: FONTS.bodyMedium, fontSize: 16, fontWeight: '600' as const, letterSpacing: .2 } as TextStyle,
  skipBtn:       { alignItems: 'center' as const, paddingVertical: 14 }                  as ViewStyle,
  skipText:      { fontFamily: FONTS.bodyRegular, fontSize: 13 }                         as TextStyle,
});
