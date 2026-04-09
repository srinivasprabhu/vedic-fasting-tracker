import { fs } from '@/constants/theme';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Play, Square, Flame, Clock, Trophy, Settings, ChevronRight, Sun, Moon, Bell, Sparkles, Edit3, Scale, Check, Smartphone, Droplet, Footprints } from 'lucide-react-native';

import { useTheme }        from '@/contexts/ThemeContext';

import { useFasting }      from '@/contexts/FastingContext';
import { useUserProfile }  from '@/contexts/UserProfileContext';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { VEDIC_QUOTES, NEUTRAL_DAILY_QUOTES } from '@/mocks/vedic-data';
import CircularTimer       from '@/components/CircularTimer';
import FastTimePickerModal from '@/components/FastTimePickerModal';
import MetabolicZoneRiver  from '@/components/MetabolicZoneRiver';
import { useFastTimer }    from '@/hooks/useFastTimer';
import { useReviewPrompt } from '@/hooks/useReviewPrompt';
import { usePedometer }    from '@/hooks/usePedometer';
import ReviewPromptCard    from '@/components/ReviewPromptCard';
import { formatWater, kgToLbs, getAge, calcBMI } from '@/utils/calculatePlan';
import { FastType } from '@/types/fasting';
import { FastPlanPickerModal, FastPlanOption } from '@/components/FastPlanPickerModal';
import { WeeklyFastDaysModal } from '@/components/WeeklyFastDaysModal';
import type { ColorScheme } from '@/constants/colors';
import { TRADITIONAL_INSIGHTS_KEY } from '@/constants/storageKeys';
import { StatTile } from '@/components/ui/StatTile';
import { formatInsightHours } from '@/utils/analytics-helpers';
import { formatNextFastTimingPhrase } from '@/utils/fastingPlanSchedule';

// ─── Storage keys ─────────────────────────────────────────────────────────────

const waterDayKey = () => { const d = new Date(); return `aayu_water_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`; };
const WEIGHT_KEY  = 'aayu_weight_log';

/** Minimum touch target ~44pt (Apple HIG); extends 38px visuals to comfortable taps */
const HEADER_ICON_HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatShortDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// ─── Animated progress bar ────────────────────────────────────────────────────

const ProgBar: React.FC<{ pct: number; color: string; height?: number; bg: string }> = ({ pct, color, height = 4, bg }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: Math.min(pct / 100, 1), duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [pct]);
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: bg, overflow: 'hidden' as const }}>
      <Animated.View style={{ height: '100%' as any, borderRadius: height / 2, backgroundColor: color, width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
    </View>
  );
};

// ─── Quick-add water button ───────────────────────────────────────────────────

const WaterQuickBtn: React.FC<{ label: string; ml: number; onPress: () => void; colors: ColorScheme; waterAccent: string; featured?: boolean }> = ({ label, ml, onPress, colors, waterAccent, featured }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    accessibilityRole="button"
    accessibilityLabel={`Add ${ml} milliliters of water (${label})`}
    accessibilityHint="Double tap to add this amount to your daily water intake"
    style={{
      minWidth: 78,
      height: 56,
      paddingHorizontal: 12,
      borderRadius: 16,
      borderWidth: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: featured ? `${waterAccent}2E` : colors.surface,
      borderColor: featured ? `${waterAccent}66` : colors.borderLight,
    }}
  >
    <Text style={{ fontSize: fs(16), fontWeight: '700' as const, color: waterAccent }}>+{ml >= 1000 ? `${ml/1000}L` : `${ml}ml`}</Text>
    <Text style={{ fontSize: fs(13), fontWeight: '500' as const, color: colors.textSecondary, marginTop: 2 }}>{label}</Text>
  </TouchableOpacity>
);

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { activeFast, startFast, endFast, streak, totalHours, completedRecords } = useFasting();
  const { profile, getGreeting, getInitial, updateFastPlan, isProUser } = useUserProfile();
  const { presentPaywall } = useRevenueCat();
  const completedFastCount = completedRecords.filter(r => r.completed).length;
  const { visible: showReview, handleReview, handleDismiss: dismissReview } = useReviewPrompt(completedFastCount, streak);

  // ── Pedometer for auto step counting ──────────────────────────────────────
  const pedometer = usePedometer();

  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker]     = useState(false);
  const [pendingFast, setPendingFast] = useState<{ type: FastType; name: string; duration: number } | null>(null);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [showWeeklyDaysModal, setShowWeeklyDaysModal] = useState(false);
  const [weeklyPlanDraft, setWeeklyPlanDraft] = useState<FastPlanOption | null>(null);
  const [traditionalInsights, setTraditionalInsights] = useState(false);
  /** Bumps on focus and every minute while idle so the “Next fast …” clause stays in sync with the clock. */
  const [nextFastPhraseTick, setNextFastPhraseTick] = useState(0);

  // ── Water and weight (not from pedometer, still AsyncStorage) ─────────────
  const [waterMl, setWaterMl]     = useState(0);
  const [weightKg, setWeightKg]   = useState<number | null>(null);
  const plan        = profile?.plan;
  const hasPlan     = !!(plan?.fastHours);
  const waterTarget = plan?.dailyWaterMl ?? 2500;
  const stepsTarget = plan?.dailySteps   ?? 8000;
  const goalKg      = profile?.goalWeightKg ?? null;
  const displayKg   = weightKg ?? profile?.currentWeightKg ?? null;
  const weightUnit  = profile?.weightUnit ?? 'kg';

  // Re-read water + weight + steps every time the screen gains focus
  // (handles coming back from detail pages where data was changed)
  useFocusEffect(
    useCallback(() => {
      // Refresh manual steps from storage (may have been added on detail page)
      pedometer.refreshManual();
      setNextFastPhraseTick((t) => t + 1);

      AsyncStorage.getItem(TRADITIONAL_INSIGHTS_KEY).then((v) => {
        setTraditionalInsights(v === '1' || v === 'true');
      });

      // Water
      AsyncStorage.getItem(waterDayKey()).then(raw => {
        if (raw) {
          try { const entries: { ml: number }[] = JSON.parse(raw); setWaterMl(entries.reduce((s, e) => s + e.ml, 0)); } catch {}
        } else { setWaterMl(0); }
      });
      // Weight
      AsyncStorage.getItem(WEIGHT_KEY).then(raw => {
        if (raw) {
          try { const log: { kg: number }[] = JSON.parse(raw); if (log.length > 0) setWeightKg(log[0].kg); } catch {}
        }
      });
    }, [])
  );

  // Quick-add water inline from home card
  const addWater = useCallback(async (ml: number, label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const existing = await AsyncStorage.getItem(waterDayKey()).then(r => r ? JSON.parse(r) : []).catch(() => []);
    const entry = { id: `w_${Date.now()}`, ml, label, time: Date.now() };
    await AsyncStorage.setItem(waterDayKey(), JSON.stringify([entry, ...existing]));
    setWaterMl(prev => prev + ml);
  }, []);

  // ── Animations ─────────────────────────────────────────────────────────────
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(20)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const quote = useMemo(() => {
    const pool = traditionalInsights ? VEDIC_QUOTES : NEUTRAL_DAILY_QUOTES;
    return pool[Math.floor(Date.now() / 86400000) % pool.length];
  }, [traditionalInsights]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (activeFast || !plan?.fastLabel) return;
    const id = setInterval(() => setNextFastPhraseTick((x) => x + 1), 60_000);
    return () => clearInterval(id);
  }, [activeFast, plan?.fastLabel]);

  const timer = useFastTimer(activeFast ? { startTime: activeFast.startTime, onZoneChange: () => {} } : null);

  const handleBeginFast = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Use the plan's fast hours, or default to 16:8
    const fastH = plan?.fastHours ?? 16;
    const label = plan?.fastLabel ?? `${fastH}:${24 - fastH}`;
    setPendingFast({ type: `if_${fastH}_${24 - fastH}` as FastType, name: `${label} Fast`, duration: fastH });
    setShowStartTimePicker(true);
  }, [plan]);

  const handleStartNow = useCallback(() => {
    if (!pendingFast) return;
    startFast(pendingFast.type, pendingFast.name, pendingFast.duration * 3600000);
    setPendingFast(null);
  }, [pendingFast, startFast]);

  const handleStartCustom = useCallback((ts: number) => {
    if (!pendingFast) return;
    startFast(pendingFast.type, pendingFast.name, pendingFast.duration * 3600000, ts);
    setPendingFast(null);
  }, [pendingFast, startFast]);

  const handleEndFast = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowEndTimePicker(true);
  }, []);

  const handleEndNow = useCallback(() => {
    const completed = timer.elapsedMs >= (activeFast?.targetDuration ?? 0) * 0.8;
    Haptics.notificationAsync(completed ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
    endFast(completed);
    setTimeout(() => router.push('/fast-complete' as any), 300);
  }, [activeFast, timer.elapsedMs, endFast]);

  const handleEndCustom = useCallback((ts: number) => {
    if (!activeFast) return;
    const completed = (ts - activeFast.startTime) >= activeFast.targetDuration * 0.8;
    Haptics.notificationAsync(completed ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
    endFast(completed, ts);
    setTimeout(() => router.push('/fast-complete' as any), 300);
  }, [activeFast, endFast]);

  const pressIn  = useCallback(() => Animated.spring(buttonScale, { toValue: 0.95, friction: 8, useNativeDriver: true }).start(), []);
  const pressOut = useCallback(() => Animated.spring(buttonScale, { toValue: 1,    friction: 8, useNativeDriver: true }).start(), []);

  const progress  = activeFast ? timer.elapsedMs / activeFast.targetDuration : 0;
  const remaining = activeFast ? Math.max(0, activeFast.targetDuration - timer.elapsedMs) : 0;

  const nextFastTimingPhrase = useMemo(
    () => formatNextFastTimingPhrase(profile, new Date()),
    [profile, nextFastPhraseTick],
  );

  const waterPct    = waterTarget > 0 ? (waterMl / waterTarget) * 100 : 0;
  const stepsPct    = stepsTarget > 0 ? (pedometer.steps / stepsTarget) * 100 : 0;

  // ── Plan picker safety restrictions ───────────────────────────────────────
  const userAge = profile ? getAge(profile) : 30;
  const userBmi = (profile?.currentWeightKg && profile?.heightCm)
    ? calcBMI(profile.currentWeightKg, profile.heightCm) : null;

  const planMaxFastHours = useMemo(() => {
    if (userAge < 18) return 14;               // minors: max 14:10
    if (userBmi !== null && userBmi < 18.5) return 12;  // underweight: max 12:12
    return null;                                // no restriction
  }, [userAge, userBmi]);

  const planRestrictionReason = useMemo(() => {
    if (userAge < 18) return 'Fasting plans longer than 14 hours are not recommended for users under 18. Your body is still growing and needs adequate nutrition.';
    if (userBmi !== null && userBmi < 18.5) return 'Longer fasting plans are not recommended at your current BMI. Focus on maintaining a healthy weight with gentle time-restricted eating.';
    return undefined;
  }, [userAge, userBmi]);

  const waterColor = colors.hydration;
  const stepsColor = colors.success;
  const weightColor = colors.trackWeight;

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* ── Sticky header (outside ScrollView) ─────────────────── */}
        <View style={[styles.headerSticky, { backgroundColor: colors.background }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.avatar} accessibilityLabel={`User avatar, ${profile?.name ?? 'Friend'}`}>
                <Text style={styles.avatarText}>{getInitial()}</Text>
              </View>
              <View style={styles.headerTextCol}>
                <Text style={[styles.greeting, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">
                  {profile?.name ?? 'Friend'}
                </Text>
                <Text style={[styles.greetingDate, { color: colors.textSecondary }]} numberOfLines={2} ellipsizeMode="tail">
                  {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.themeBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleTheme(); }}
                activeOpacity={0.7}
                accessibilityLabel="Toggle theme"
                accessibilityHint="Switches between light and dark appearance"
                hitSlop={HEADER_ICON_HIT_SLOP}
              >
                {isDark ? <Sun size={18} color={colors.trackWeight} /> : <Moon size={18} color={colors.trackWeight} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconHeaderBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/notification-settings' as any); }}
                activeOpacity={0.7}
                accessibilityLabel="Notifications"
                accessibilityHint="Open notification settings"
                hitSlop={HEADER_ICON_HIT_SLOP}
              >
                <Bell size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconHeaderBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                onPress={() => router.push('/settings' as any)}
                activeOpacity={0.7}
                accessibilityLabel="Settings"
                accessibilityHint="Open app settings"
                hitSlop={HEADER_ICON_HIT_SLOP}
              >
                <Settings size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {showReview && <ReviewPromptCard onReview={handleReview} onDismiss={dismissReview} />}

          {/* My plan pill */}
          {plan?.fastLabel && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowPlanPicker(true)}
              style={[styles.myPlanPill, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            >
              <Text style={[styles.myPlanLabel, { color: colors.textSecondary }]}>My plan</Text>
              <Text style={[styles.myPlanValue, { color: colors.primary }]}>{plan.fastLabel}</Text>
              <Edit3 size={14} color={colors.textMuted} style={{ opacity: 0.7 }} />
            </TouchableOpacity>
          )}

          {/* Timer card */}
          <View style={[styles.timerCard, { backgroundColor: colors.card, borderColor: activeFast ? `${colors.primary}35` : colors.borderLight }]}>
            {activeFast ? (
              <Text style={[styles.timerEyebrow, { color: colors.textSecondary }]}>{activeFast.label} · {formatShortDuration(remaining)} remaining</Text>
            ) : plan?.fastLabel ? (
              <Text style={[styles.timerEyebrow, { color: colors.textSecondary }]}>Next fast · {plan.fastLabel} · {nextFastTimingPhrase}</Text>
            ) : null}
            <CircularTimer progress={progress} elapsed={activeFast ? timer.formatted : '00:00:00'} remaining={formatShortDuration(remaining)} label={activeFast ? activeFast.label : 'READY TO FAST'} isActive={!!activeFast} />
            <MetabolicZoneRiver hoursElapsed={timer.hoursElapsed} isActive={!!activeFast} colors={colors} variant="embedded" />
            <Animated.View style={[styles.timerCtaWrap, { marginTop: activeFast ? 10 : 20 }, { transform: [{ scale: buttonScale }] }]}>
              {activeFast ? (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.fastAction }]} onPress={handleEndFast} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={0.85} testID="stop-fast-button" accessibilityLabel="End fast">
                  <Square size={18} color={colors.onFastAction} fill={colors.onFastAction} />
                  <Text style={[styles.actionBtnText, { color: colors.onFastAction }]}>End Fast</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.fastAction }]} onPress={handleBeginFast} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={0.85} testID="start-fast-button" accessibilityLabel="Begin fast">
                  <Play size={18} color={colors.onFastAction} fill={colors.onFastAction} />
                  <Text style={[styles.actionBtnText, { color: colors.onFastAction }]}>Begin Fast</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          </View>

          {/* Stats row — first-use welcome when no fast completed yet and not mid-fast */}
          {completedFastCount === 0 && !activeFast ? (
            <View style={[styles.statsWelcomeRow, { backgroundColor: colors.surfaceWarm, borderColor: colors.borderLight }]}>
              <Sparkles size={22} color={colors.primary} />
              <View style={styles.statsWelcomeTextCol}>
                <Text style={[styles.statsWelcomeTitle, { color: colors.text }]}>Your journey starts here</Text>
                <Text style={[styles.statsWelcomeSub, { color: colors.textSecondary }]}>
                  Streak, hours, and completed counts appear after your first fast. Tap Begin Fast when you are ready.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.statsRow}>
              <StatTile icon={<Flame size={15} color={colors.streakAccent} />} value={String(streak)} label="DAY STREAK" iconBackground={`${colors.streakAccent}1A`} />
              <StatTile icon={<Clock size={15} color={colors.primary} />} value={formatInsightHours(totalHours)} label="TOTAL HOURS" iconBackground={`${colors.primary}18`} />
              <StatTile icon={<Trophy size={15} color={colors.success} />} value={String(completedRecords.filter(r => r.completed).length)} label="COMPLETED" iconBackground={`${colors.success}18`} />
            </View>
          )}

          {/* Today's targets */}
          {hasPlan && (
            <View style={styles.targetsSection}>
              <View style={styles.targetsHeader}>
                <Text style={[styles.targetsTitle, { color: colors.text }]}>Today's targets</Text>
                {plan?.fastLabel && (
                  <View style={[styles.planPill, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                    <Clock size={14} color={colors.textSecondary} />
                    <Text style={[styles.planPillText, { color: colors.textSecondary }]}>{plan.fastLabel}</Text>
                  </View>
                )}
              </View>

              {/* Hydration — full width (body tappable → water log; quick-adds stay separate) */}
              <View style={[styles.hydrationCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/(tabs)/(home)/water' as any);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Hydration, open water log"
                  accessibilityHint="Shows your history and full water tracker"
                  style={styles.hydrationPressable}
                >
                  <View style={styles.hydrationHeader}>
                    <View style={styles.hydrationTitleLeft}>
                      <Droplet size={18} color={waterColor} strokeWidth={2} accessibilityElementsHidden />
                      <Text style={[styles.hydrationLabel, { color: waterColor }]}>HYDRATION</Text>
                    </View>
                    <View style={styles.hydrationPctBtn}>
                      {waterPct >= 100 ? (
                        <Check size={18} color={colors.success} />
                      ) : (
                        <Text style={[styles.hydrationPct, { color: waterColor }]}>{Math.round(waterPct)}%</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.trackerValRow}>
                    <Text style={[styles.trackerVal, { color: colors.text }]}>
                      {waterMl >= 1000 ? (waterMl / 1000).toFixed(1) : waterMl}
                    </Text>
                    <Text style={[styles.trackerUnit, { color: colors.textSecondary }]}>{waterMl >= 1000 ? 'L' : 'ml'}</Text>
                    <Text style={[styles.trackerOf, { color: colors.textSecondary }]}>/ {formatWater(waterTarget)}</Text>
                  </View>
                  <ProgBar pct={waterPct} color={waterColor} height={6} bg={isDark ? 'rgba(91,141,217,.12)' : 'rgba(91,141,217,.1)'} />
                </TouchableOpacity>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.waterQuickRow}>
                  <WaterQuickBtn label="Cup" ml={150} onPress={() => addWater(150, 'Cup')} colors={colors} waterAccent={waterColor} />
                  <WaterQuickBtn label="Glass" ml={250} onPress={() => addWater(250, 'Glass')} colors={colors} waterAccent={waterColor} featured />
                  <WaterQuickBtn label="Bottle" ml={500} onPress={() => addWater(500, 'Bottle')} colors={colors} waterAccent={waterColor} featured />
                  <WaterQuickBtn label="Large" ml={750} onPress={() => addWater(750, 'Large')} colors={colors} waterAccent={waterColor} />
                </ScrollView>
              </View>

              {/* Steps + weight — two columns */}
              <View style={styles.targetsGridRow}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push('/(tabs)/(home)/steps' as any)}
                  style={[styles.gridHalfCard, { flex: 1 }, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
                  accessibilityRole="button"
                  accessibilityLabel="Steps"
                >
                  <View style={styles.compactMetricHeader}>
                    <View style={styles.compactMetricTitle}>
                      <Footprints size={16} color={stepsColor} strokeWidth={2} accessibilityElementsHidden />
                      <Text style={[styles.compactEyebrow, { color: stepsColor }]}>STEPS</Text>
                    </View>
                    {pedometer.available && (
                      <View style={[styles.liveDotInline, { backgroundColor: pedometer.isLive ? stepsColor : colors.warning }]} />
                    )}
                  </View>
                  <View style={styles.gridStepsValRow}>
                    <Text style={[styles.gridStepsVal, { color: colors.text }]}>
                      {pedometer.steps >= 1000 ? (pedometer.steps / 1000).toFixed(1) : pedometer.steps}
                    </Text>
                    {pedometer.steps >= 1000 && (
                      <Text style={[styles.gridStepsSuffix, { color: colors.textSecondary }]}>k</Text>
                    )}
                    <Text style={[styles.gridStepsGoal, { color: colors.textSecondary }]}>
                      / {stepsTarget >= 1000 ? `${stepsTarget / 1000}k` : stepsTarget}
                    </Text>
                  </View>
                  <ProgBar pct={stepsPct} color={stepsColor} height={6} bg={isDark ? 'rgba(58,170,110,.12)' : 'rgba(58,170,110,.1)'} />
                  {pedometer.available && (
                    <View style={styles.gridStepsFooter}>
                      <Smartphone size={12} color={colors.textSecondary} />
                      <Text style={[styles.gridStepsFooterText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {pedometer.isLive ? 'Auto-syncing' : 'Motion sensor'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {displayKg != null && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => router.push('/(tabs)/(home)/weight' as any)}
                    style={[styles.gridHalfCard, { flex: 1 }, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
                    accessibilityRole="button"
                    accessibilityLabel="Weight"
                  >
                    <View style={[styles.compactMetricHeader, styles.compactMetricHeaderPlain]}>
                      <View style={styles.compactMetricTitle}>
                        <Scale size={16} color={weightColor} strokeWidth={2} accessibilityElementsHidden />
                        <Text style={[styles.compactEyebrow, { color: weightColor }]}>WEIGHT</Text>
                      </View>
                    </View>
                    <Text style={[styles.gridWeightMain, { color: colors.text }]} numberOfLines={1}>
                      {weightUnit === 'lbs' ? `${kgToLbs(displayKg).toFixed(1)} lbs` : `${displayKg.toFixed(1)} kg`}
                    </Text>
                    <View style={styles.weightCardFooter}>
                      {goalKg != null ? (
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={[styles.weightGoalLabel, { color: colors.textMuted }]}>GOAL</Text>
                          <Text style={[styles.weightGoalSm, { color: colors.textSecondary }]} numberOfLines={1}>
                            {weightUnit === 'lbs' ? `${kgToLbs(goalKg).toFixed(1)} lbs` : `${goalKg.toFixed(1)} kg`}
                          </Text>
                        </View>
                      ) : (
                        <View style={{ flex: 1 }} />
                      )}
                      <ChevronRight size={18} color={colors.textSecondary} />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Quote — moved to bottom for better content priority */}
          <Animated.View style={[styles.quoteCard, { opacity: fadeAnim, backgroundColor: colors.surface, borderLeftColor: colors.primary }]}>
            <Text style={[styles.quoteText, { color: colors.text }]}>"{quote.text}"</Text>
            <Text style={[styles.quoteSrc, { color: colors.textSecondary }]}>— {quote.source}</Text>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>

      <FastTimePickerModal visible={showStartTimePicker} onClose={() => { setShowStartTimePicker(false); setPendingFast(null); }} onSelectNow={handleStartNow} onSelectCustom={handleStartCustom} title="When did you start fasting?" />
      <FastTimePickerModal visible={showEndTimePicker}   onClose={() => setShowEndTimePicker(false)} onSelectNow={handleEndNow} onSelectCustom={handleEndCustom} title="When did you break your fast?" maxDate={new Date()} />

      <FastPlanPickerModal
        visible={showPlanPicker}
        currentPlan={plan?.fastLabel ?? null}
        isProUser={isProUser}
        maxFastHours={planMaxFastHours}
        restrictionReason={planRestrictionReason}
        onSelect={(p: FastPlanOption) => {
          if (p.id === 'if_5_2' || p.id === 'if_4_3') {
            setWeeklyPlanDraft(p);
            setShowPlanPicker(false);
            setShowWeeklyDaysModal(true);
            return;
          }
          updateFastPlan(p.fastHours, p.eatHours, p.label, { planId: p.id });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
        onClose={() => setShowPlanPicker(false)}
        onUpgrade={() => {
          setShowPlanPicker(false);
          void presentPaywall();
        }}
      />

      {weeklyPlanDraft && (weeklyPlanDraft.id === 'if_5_2' || weeklyPlanDraft.id === 'if_4_3') && (
        <WeeklyFastDaysModal
          visible={showWeeklyDaysModal}
          planTemplateId={weeklyPlanDraft.id}
          initialDays={
            profile?.plan?.planTemplateId === weeklyPlanDraft.id
              ? profile.plan.weeklyFastDays
              : undefined
          }
          onClose={() => {
            setShowWeeklyDaysModal(false);
            setWeeklyPlanDraft(null);
          }}
          onConfirm={(days) => {
            updateFastPlan(weeklyPlanDraft.fastHours, weeklyPlanDraft.eatHours, weeklyPlanDraft.label, {
              planId: weeklyPlanDraft.id,
              weeklyFastDays: days,
            });
            setWeeklyPlanDraft(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }}
        />
      )}
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    root:              { flex: 1, backgroundColor: colors.background } as ViewStyle,
    scrollContent:     { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 100 } as ViewStyle,
    headerSticky:      { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight } as ViewStyle,
    headerRow:         { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, minHeight: 52 } as ViewStyle,
    headerLeft:        { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, flex: 1, minWidth: 0 } as ViewStyle,
    headerTextCol:     { flex: 1, minWidth: 0, justifyContent: 'center' as const } as ViewStyle,
    avatar:            { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center' as const, justifyContent: 'center' as const, flexShrink: 0 } as ViewStyle,
    avatarText:        { fontSize: fs(16), fontWeight: '700' as const, color: '#fff' } as TextStyle,
    greeting:          { fontSize: fs(18), fontWeight: '700' as const, lineHeight: 22 } as TextStyle,
    greetingDate:      { fontSize: fs(12), fontWeight: '500' as const, marginTop: 1, lineHeight: 16 } as TextStyle,
    headerActions:     { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, flexShrink: 0 } as ViewStyle,
    themeBtn:          { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const } as ViewStyle,
    iconHeaderBtn:     { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const } as ViewStyle,
    myPlanPill:        { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, alignSelf: 'center' as const, gap: 8, paddingHorizontal: 16, minHeight: 44, borderRadius: 22, borderWidth: 1, marginBottom: 16 } as ViewStyle,
    myPlanLabel:       { fontSize: fs(17), fontWeight: '600' as const, color: colors.text } as TextStyle,
    myPlanValue:       { fontSize: fs(18), fontWeight: '600' as const, color: colors.primary } as TextStyle,
    quoteCard:         { borderRadius: 16, padding: 16, marginBottom: 16, borderLeftWidth: 3, minHeight: 112 } as ViewStyle,
    quoteText:         { fontSize: fs(16), fontStyle: 'italic' as const, lineHeight: 24, fontWeight: '400' as const } as TextStyle,
    quoteSrc:          { fontSize: fs(13), fontWeight: '500' as const, marginTop: 8, lineHeight: 18 } as TextStyle,
    timerCard:         { borderRadius: 28, borderWidth: 1, paddingTop: 18, paddingHorizontal: 16, paddingBottom: 18, marginBottom: 20, alignItems: 'center' as const } as ViewStyle,
    timerEyebrow:      { fontSize: fs(14), fontWeight: '500' as const, lineHeight: 20, alignSelf: 'center' as const, textAlign: 'center' as const, marginBottom: 14, paddingHorizontal: 4 } as TextStyle,
    timerCtaWrap:      { marginTop: 20, width: '100%' as const, alignItems: 'center' as const } as ViewStyle,
    actionBtn:         { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, width: '100%' as const, height: 54, paddingHorizontal: 28, borderRadius: 14, gap: 10 } as ViewStyle,
    actionBtnText:     { fontSize: fs(18), fontWeight: '600' as const, lineHeight: 22 } as TextStyle,
    statsRow:          { flexDirection: 'row' as const, flexWrap: 'wrap' as const, alignItems: 'stretch' as const, gap: 8, marginBottom: 16 } as ViewStyle,
    statsWelcomeRow:   { flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 14, borderRadius: 16, borderWidth: 1, paddingVertical: 16, paddingHorizontal: 16, marginBottom: 16 } as ViewStyle,
    statsWelcomeTextCol:{ flex: 1, minWidth: 0 } as ViewStyle,
    statsWelcomeTitle: { fontSize: fs(16), fontWeight: '600' as const, letterSpacing: -0.2, lineHeight: 22 } as TextStyle,
    statsWelcomeSub:   { fontSize: fs(13), fontWeight: '500' as const, marginTop: 4, lineHeight: 19 } as TextStyle,
    targetsSection:    { marginBottom: 0 } as ViewStyle,
    targetsHeader:     { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginTop: 4, marginBottom: 12 } as ViewStyle,
    targetsTitle:      { fontSize: fs(20), fontWeight: '600' as const, lineHeight: 26 } as TextStyle,
    planPill:          { flexDirection: 'row' as const, paddingHorizontal: 14, minHeight: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center' as const, gap: 6 } as ViewStyle,
    planPillText:      { fontSize: fs(16), fontWeight: '600' as const } as TextStyle,
    hydrationCard:     { borderRadius: 24, borderWidth: 1, padding: 18, marginBottom: 12 } as ViewStyle,
    hydrationPressable:{ width: '100%' as const } as ViewStyle,
    hydrationHeader:   { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginBottom: 10 } as ViewStyle,
    hydrationTitleLeft:{ flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, flex: 1, minWidth: 0 } as ViewStyle,
    hydrationLabel:    { fontSize: fs(12), fontWeight: '700' as const, letterSpacing: 0.6, textTransform: 'uppercase' as const } as TextStyle,
    hydrationPctBtn:   { alignItems: 'center' as const, justifyContent: 'center' as const, minWidth: 40 } as ViewStyle,
    hydrationPct:      { fontSize: fs(17), fontWeight: '700' as const } as TextStyle,
    targetsGridRow:    { flexDirection: 'row' as const, gap: 10, alignItems: 'stretch' as const, marginBottom: 14 } as ViewStyle,
    gridHalfCard:      { borderRadius: 24, borderWidth: 1, padding: 16, minWidth: 0, minHeight: 152 } as ViewStyle,
    compactMetricHeader:{ flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginBottom: 8 } as ViewStyle,
    compactMetricHeaderPlain:{ justifyContent: 'flex-start' as const } as ViewStyle,
    compactMetricTitle:{ flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, flex: 1, minWidth: 0 } as ViewStyle,
    compactEyebrow:    { fontSize: fs(11), fontWeight: '700' as const, letterSpacing: 0.55, textTransform: 'uppercase' as const } as TextStyle,
    liveDotInline:     { width: 6, height: 6, borderRadius: 3, flexShrink: 0 } as ViewStyle,
    gridStepsValRow:   { flexDirection: 'row' as const, alignItems: 'baseline' as const, flexWrap: 'wrap' as const, gap: 2, marginBottom: 10 } as ViewStyle,
    gridStepsVal:      { fontSize: fs(26), fontWeight: '600' as const, letterSpacing: -0.4, lineHeight: 30 } as TextStyle,
    gridStepsSuffix:   { fontSize: fs(15), fontWeight: '600' as const } as TextStyle,
    gridStepsGoal:     { fontSize: fs(15), fontWeight: '500' as const, marginLeft: 2 } as TextStyle,
    gridStepsFooter:   { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5, marginTop: 10 } as ViewStyle,
    gridStepsFooterText:{ fontSize: fs(12), fontWeight: '500' as const, lineHeight: 16, flex: 1 } as TextStyle,
    gridWeightMain:    { fontSize: fs(24), fontWeight: '600' as const, lineHeight: 28, marginBottom: 10 } as TextStyle,
    weightCardFooter:  { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, marginTop: 4 } as ViewStyle,
    weightGoalLabel:   { fontSize: fs(10), fontWeight: '700' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const, marginBottom: 2 } as TextStyle,
    weightGoalSm:      { fontSize: fs(15), fontWeight: '600' as const, lineHeight: 20 } as TextStyle,
    trackerEyebrow:    { fontSize: fs(12), fontWeight: '600' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const, marginBottom: 4 } as TextStyle,
    trackerValRow:     { flexDirection: 'row' as const, alignItems: 'baseline' as const, gap: 5, marginBottom: 10 } as ViewStyle,
    trackerVal:        { fontSize: fs(30), fontWeight: '600' as const, letterSpacing: -0.5 } as TextStyle,
    trackerUnit:       { fontSize: fs(18), fontWeight: '500' as const } as TextStyle,
    trackerOf:         { fontSize: fs(18), fontWeight: '500' as const, marginLeft: 2 } as TextStyle,
    waterQuickRow:     { flexDirection: 'row' as const, gap: 10, marginTop: 14, paddingRight: 4 } as ViewStyle,
  });
}
