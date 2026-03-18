import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Play, Square, Flame, Clock, Trophy, Settings, ChevronRight, Sun, Moon } from 'lucide-react-native';
import Svg, { Rect } from 'react-native-svg';

import { useTheme }        from '@/contexts/ThemeContext';

import { useFasting }      from '@/contexts/FastingContext';
import { useUserProfile }  from '@/contexts/UserProfileContext';
import { VEDIC_QUOTES } from '@/mocks/vedic-data';
import CircularTimer       from '@/components/CircularTimer';
import FastTimePickerModal from '@/components/FastTimePickerModal';
import MetabolicZoneRiver  from '@/components/MetabolicZoneRiver';
import { useFastTimer }    from '@/hooks/useFastTimer';
import { useReviewPrompt } from '@/hooks/useReviewPrompt';
import { usePedometer }    from '@/hooks/usePedometer';
import ReviewPromptCard    from '@/components/ReviewPromptCard';
import { formatWater, kgToLbs } from '@/utils/calculatePlan';
import { FastType } from '@/types/fasting';
import { FastPlanPickerModal, FastPlanOption } from '@/components/FastPlanPickerModal';
import type { ColorScheme } from '@/constants/colors';

// ─── Storage keys ─────────────────────────────────────────────────────────────

const waterDayKey = () => { const d = new Date(); return `aayu_water_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`; };
const WEIGHT_KEY  = 'aayu_weight_log';

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

// ─── Mini 7-day bars (compact) ────────────────────────────────────────────────

const TinyBars: React.FC<{ data: number[]; isToday: boolean[]; goal: number; color: string }> = ({ data, isToday, goal, color }) => {
  const maxV = Math.max(...data, goal, 1);
  const W = 56; const H = 28; const BW = 5; const GAP = 2;
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {data.map((v, i) => {
        const barH = Math.max(2, (v / maxV) * H);
        const x = i * (BW + GAP);
        const fill = isToday[i] ? color : (v >= goal ? `${color}80` : `${color}30`);
        return <Rect key={i} x={x} y={H - barH} width={BW} height={barH} fill={fill} rx={2} />;
      })}
    </Svg>
  );
};

// ─── Quick-add water button ───────────────────────────────────────────────────

const WaterQuickBtn: React.FC<{ label: string; ml: number; onPress: () => void; colors: ColorScheme; featured?: boolean }> = ({ label, ml, onPress, colors, featured }) => (
  <TouchableOpacity
    onPress={onPress} activeOpacity={0.75}
    style={{
      flex: 1, paddingVertical: 7, borderRadius: 9, borderWidth: 1,
      alignItems: 'center' as const,
      backgroundColor: featured ? 'rgba(91,141,217,.18)' : colors.surface,
      borderColor: featured ? 'rgba(91,141,217,.4)' : colors.borderLight,
    }}
  >
    <Text style={{ fontSize: 11, fontWeight: '700' as const, color: '#5b8dd9' }}>+{ml >= 1000 ? `${ml/1000}L` : `${ml}ml`}</Text>
    <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 1 }}>{label}</Text>
  </TouchableOpacity>
);

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { activeFast, startFast, endFast, streak, totalHours, completedRecords } = useFasting();
  const { profile, getGreeting, getInitial, updateFastPlan, isProUser } = useUserProfile();
  const completedFastCount = completedRecords.filter(r => r.completed).length;
  const { visible: showReview, handleReview, handleDismiss: dismissReview } = useReviewPrompt(completedFastCount, streak);

  // ── Pedometer for auto step counting ──────────────────────────────────────
  const pedometer = usePedometer();

  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker]     = useState(false);
  const [pendingFast, setPendingFast] = useState<{ type: FastType; name: string; duration: number } | null>(null);
  const [showPlanPicker, setShowPlanPicker] = useState(false);

  // ── Water and weight (not from pedometer, still AsyncStorage) ─────────────
  const [waterMl, setWaterMl]     = useState(0);
  const [weightKg, setWeightKg]   = useState<number | null>(null);
  const [weekStepData, setWeekStepData] = useState<{ v: number; today: boolean }[]>([]);

  // Re-read water + weight + steps every time the screen gains focus
  // (handles coming back from detail pages where data was changed)
  useFocusEffect(
    useCallback(() => {
      // Refresh manual steps from storage (may have been added on detail page)
      pedometer.refreshManual();

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
      // 7-day step history (manual key, since pedometer gives live today)
      const now = new Date();
      const fromMon = now.getDay() === 0 ? 6 : now.getDay() - 1;
      Promise.all(Array.from({ length: 7 }, async (_, i) => {
        const diff = i - fromMon;
        const d = new Date(now); d.setDate(d.getDate() + diff);
        const key = `aayu_steps_manual_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
        try { const r = await AsyncStorage.getItem(key); return { v: r ? parseInt(r,10) : 0, today: diff === 0 }; }
        catch { return { v: 0, today: false }; }
      })).then(setWeekStepData);
    }, [])
  );

  // Keep today's bar in sync with live pedometer total
  useEffect(() => {
    setWeekStepData(prev => prev.map(d => d.today ? { ...d, v: pedometer.steps } : d));
  }, [pedometer.steps]);

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

  const quote = VEDIC_QUOTES[Math.floor(Date.now() / 86400000) % VEDIC_QUOTES.length];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

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

  // Plan data
  const plan        = profile?.plan;
  const hasPlan     = !!(plan?.fastHours);
  const waterTarget = plan?.dailyWaterMl ?? 2500;
  const stepsTarget = plan?.dailySteps   ?? 8000;
  const waterPct    = waterTarget > 0 ? (waterMl / waterTarget) * 100 : 0;
  const stepsPct    = stepsTarget > 0 ? (pedometer.steps / stepsTarget) * 100 : 0;
  const goalKg      = profile?.goalWeightKg ?? null;
  const displayKg   = weightKg ?? profile?.currentWeightKg ?? null;
  const weightUnit  = profile?.weightUnit ?? 'kg';

  const waterColor  = '#5b8dd9';
  const stepsColor  = colors.success;
  const weightColor = isDark ? '#e8a84c' : '#a06820';

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitial()}</Text>
                </View>
                <View>
                  <Text style={[styles.greeting, { color: colors.text }]}>{getGreeting()}</Text>
                  <Text style={[styles.greetingDate, { color: colors.textMuted }]}>
                    {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {streak > 0 ? ` · ${streak} day streak 🔥` : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={[styles.themeBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleTheme(); }}
                  activeOpacity={0.7}
                >
                  {isDark ? <Sun size={16} color="#e8a84c" /> : <Moon size={16} color="#a06820" />}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.settingsBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]} onPress={() => router.push('/settings' as any)} activeOpacity={0.7}>
                  <Settings size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* Quote */}
          <Animated.View style={[styles.quoteCard, { opacity: fadeAnim, backgroundColor: colors.surface, borderLeftColor: colors.primary }]}>
            <Text style={[styles.quoteText, { color: colors.text }]}>"{quote.text}"</Text>
            <Text style={[styles.quoteSrc, { color: colors.textMuted }]}>— {quote.source}</Text>
          </Animated.View>

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
              <Text style={[styles.myPlanEdit, { color: colors.textMuted }]}>✎</Text>
            </TouchableOpacity>
          )}

          {/* Timer card */}
          <View style={[styles.timerCard, { backgroundColor: colors.card, borderColor: activeFast ? `${colors.primary}35` : colors.borderLight }]}>
            {activeFast ? (
              <Text style={[styles.timerEyebrow, { color: colors.textMuted }]}>{activeFast.label} · {formatShortDuration(remaining)} remaining</Text>
            ) : plan?.fastLabel ? (
              <Text style={[styles.timerEyebrow, { color: colors.textMuted }]}>Next fast · {plan.fastLabel} · starts tonight</Text>
            ) : null}
            <CircularTimer progress={progress} elapsed={activeFast ? timer.formatted : '00:00:00'} remaining={formatShortDuration(remaining)} label={activeFast ? activeFast.label : 'READY TO FAST'} isActive={!!activeFast} />
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              {activeFast ? (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.accent }]} onPress={handleEndFast} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={0.85} testID="stop-fast-button">
                  <Square size={16} color={colors.textLight} fill={colors.textLight} />
                  <Text style={[styles.actionBtnText, { color: colors.textLight }]}>End Fast</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={handleBeginFast} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={0.85} testID="start-fast-button">
                  <Play size={16} color={colors.textLight} fill={colors.textLight} />
                  <Text style={[styles.actionBtnText, { color: colors.textLight }]}>Begin Fast</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            {[
              { icon: '🔥', val: String(streak),                                          bg: colors.warningLight, clr: colors.warning,  lbl: 'Streak' },
              { icon: '⏱️', val: String(Math.round(totalHours)),                          bg: colors.primaryLight, clr: colors.primary,  lbl: 'Hours'  },
              { icon: '🏆', val: String(completedRecords.filter(r=>r.completed).length),  bg: colors.successLight, clr: colors.success,  lbl: 'Done'   },
            ].map(({ icon, val, bg, clr, lbl }) => (
              <View key={lbl} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <View style={[styles.statIcon, { backgroundColor: bg }]}><Text style={{ fontSize: 14 }}>{icon}</Text></View>
                <Text style={[styles.statVal, { color: colors.text }]}>{val}</Text>
                <Text style={[styles.statLbl, { color: colors.textMuted }]}>{lbl}</Text>
              </View>
            ))}
          </View>

          {/* Today's targets */}
          {hasPlan && (
            <View style={styles.targetsSection}>
              <View style={styles.targetsHeader}>
                <Text style={[styles.targetsTitle, { color: colors.text }]}>Today's targets</Text>
                {plan?.fastLabel && (
                  <View style={[styles.planPill, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                    <Text style={[styles.planPillText, { color: colors.textSecondary }]}>⏱️ {plan.fastLabel}</Text>
                  </View>
                )}
              </View>

              {/* Water card with inline quick-add */}
              <View style={[styles.trackerCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <View style={styles.trackerCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.trackerEyebrow, { color: waterColor }]}>WATER</Text>
                    <View style={styles.trackerValRow}>
                      <Text style={[styles.trackerVal, { color: colors.text }]}>{waterMl >= 1000 ? (waterMl/1000).toFixed(1) : waterMl}</Text>
                      <Text style={[styles.trackerUnit, { color: colors.textMuted }]}>{waterMl >= 1000 ? 'L' : 'ml'}</Text>
                      <Text style={[styles.trackerOf, { color: colors.textMuted }]}>/ {formatWater(waterTarget)}</Text>
                    </View>
                    <ProgBar pct={waterPct} color={waterColor} bg={isDark ? 'rgba(91,141,217,.12)' : 'rgba(91,141,217,.1)'} />
                  </View>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/(home)/water' as any)} style={styles.trackerRight}>
                    <Text style={[styles.trackerPct, { color: waterPct >= 100 ? colors.success : waterColor }]}>{waterPct >= 100 ? '✓' : `${Math.round(waterPct)}%`}</Text>
                    <ChevronRight size={13} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.waterQuickRow}>
                  <WaterQuickBtn label="Cup"    ml={150} onPress={() => addWater(150,'Cup')}    colors={colors} />
                  <WaterQuickBtn label="Glass"  ml={250} onPress={() => addWater(250,'Glass')}  colors={colors} featured />
                  <WaterQuickBtn label="Bottle" ml={500} onPress={() => addWater(500,'Bottle')} colors={colors} featured />
                  <WaterQuickBtn label="Large"  ml={750} onPress={() => addWater(750,'Large')}  colors={colors} />
                </View>
              </View>

              {/* Steps card — pedometer-aware */}
              <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/(tabs)/(home)/steps' as any)} style={[styles.trackerCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <View style={styles.trackerCardTop}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.stepsEyebrowRow}>
                      <Text style={[styles.trackerEyebrow, { color: stepsColor }]}>STEPS</Text>
                      {pedometer.available && (
                        <View style={[styles.liveDot, { backgroundColor: pedometer.isLive ? stepsColor : colors.warning }]} />
                      )}
                    </View>
                    <View style={styles.trackerValRow}>
                      <Text style={[styles.trackerVal, { color: colors.text }]}>{pedometer.steps >= 1000 ? (pedometer.steps/1000).toFixed(1) : pedometer.steps}</Text>
                      {pedometer.steps >= 1000 && <Text style={[styles.trackerUnit, { color: colors.textMuted }]}>k</Text>}
                      <Text style={[styles.trackerOf, { color: colors.textMuted }]}>/ {stepsTarget >= 1000 ? `${stepsTarget/1000}k` : stepsTarget}</Text>
                    </View>
                    <ProgBar pct={stepsPct} color={stepsColor} bg={isDark ? 'rgba(58,170,110,.12)' : 'rgba(58,170,110,.1)'} />
                  </View>
                  <View style={styles.trackerRight}>
                    {weekStepData.length === 7 ? (
                      <TinyBars data={weekStepData.map(d => d.v)} isToday={weekStepData.map(d => d.today)} goal={stepsTarget} color={stepsColor} />
                    ) : (
                      <Text style={[styles.trackerPct, { color: stepsPct >= 100 ? colors.success : stepsColor }]}>{stepsPct >= 100 ? '✓' : `${Math.round(stepsPct)}%`}</Text>
                    )}
                    <ChevronRight size={13} color={colors.textMuted} />
                  </View>
                </View>
                {pedometer.available && (
                  <Text style={[styles.sourceLabel, { color: colors.textMuted }]}>
                    {pedometer.isLive ? '📱 Counting automatically from your phone' : '📱 Motion sensor available'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Weight row */}
              {displayKg && (
                <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/(tabs)/(home)/weight' as any)} style={[styles.weightRow, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                  <Text style={{ fontSize: 18 }}>⚖️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.trackerEyebrow, { color: weightColor }]}>WEIGHT</Text>
                    <Text style={[styles.weightVal, { color: colors.text }]}>
                      {weightUnit === 'lbs' ? `${kgToLbs(displayKg).toFixed(1)} lbs` : `${displayKg.toFixed(1)} kg`}
                    </Text>
                  </View>
                  {goalKg && (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.trackerEyebrow, { color: colors.textMuted }]}>GOAL</Text>
                      <Text style={[styles.weightGoal, { color: colors.textSecondary }]}>
                        {weightUnit === 'lbs' ? `${kgToLbs(goalKg).toFixed(1)} lbs` : `${goalKg.toFixed(1)} kg`}
                      </Text>
                    </View>
                  )}
                  <ChevronRight size={14} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          )}

          <MetabolicZoneRiver hoursElapsed={timer.hoursElapsed} isActive={!!activeFast} colors={colors} />
        </ScrollView>
      </SafeAreaView>

      <FastTimePickerModal visible={showStartTimePicker} onClose={() => { setShowStartTimePicker(false); setPendingFast(null); }} onSelectNow={handleStartNow} onSelectCustom={handleStartCustom} title="When did you start fasting?" />
      <FastTimePickerModal visible={showEndTimePicker}   onClose={() => setShowEndTimePicker(false)} onSelectNow={handleEndNow} onSelectCustom={handleEndCustom} title="When did you break your fast?" maxDate={new Date()} />

      <FastPlanPickerModal
        visible={showPlanPicker}
        currentPlan={plan?.fastLabel ?? null}
        isProUser={isProUser}
        onSelect={(p: FastPlanOption) => {
          updateFastPlan(p.fastHours, p.eatHours, p.label);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
        onClose={() => setShowPlanPicker(false)}
        onUpgrade={() => {
          setShowPlanPicker(false);
          // TODO: Navigate to paywall
        }}
      />
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    root:              { flex: 1, backgroundColor: colors.background }                  as ViewStyle,
    scrollContent:     { paddingHorizontal: 18, paddingBottom: 100 }                    as ViewStyle,
    header:            { marginTop: 10, marginBottom: 12 }                              as ViewStyle,
    headerRow:         { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const } as ViewStyle,
    headerLeft:        { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, flex: 1 } as ViewStyle,
    avatar:            { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center' as const, justifyContent: 'center' as const } as ViewStyle,
    avatarText:        { fontSize: 16, fontWeight: '700' as const, color: '#fff' }      as TextStyle,
    greeting:          { fontSize: 15, fontWeight: '600' as const }                     as TextStyle,
    greetingDate:      { fontSize: 12, marginTop: 1 }                                   as TextStyle,
    headerActions:     { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 } as ViewStyle,
    themeBtn:          { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const } as ViewStyle,
    settingsBtn:       { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const } as ViewStyle,
    myPlanPill:        { flexDirection: 'row' as const, alignItems: 'center' as const, alignSelf: 'center' as const, gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginBottom: 12 } as ViewStyle,
    myPlanLabel:       { fontSize: 13, fontWeight: '500' as const } as TextStyle,
    myPlanValue:       { fontSize: 14, fontWeight: '700' as const } as TextStyle,
    myPlanEdit:        { fontSize: 14, marginLeft: 2 } as TextStyle,
    quoteCard:         { borderRadius: 13, padding: 13, marginBottom: 14, borderLeftWidth: 3 } as ViewStyle,
    quoteText:         { fontSize: 13, fontStyle: 'italic' as const, lineHeight: 19 }   as TextStyle,
    quoteSrc:          { fontSize: 11, marginTop: 5 }                                   as TextStyle,
    timerCard:         { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 14, alignItems: 'center' as const, gap: 12 } as ViewStyle,
    timerEyebrow:      { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.5, alignSelf: 'center' as const } as TextStyle,
    actionBtn:         { flexDirection: 'row' as const, alignItems: 'center' as const, paddingHorizontal: 32, paddingVertical: 13, borderRadius: 26, gap: 8, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 6 } as ViewStyle,
    actionBtnText:     { fontSize: 15, fontWeight: '600' as const }                     as TextStyle,
    statsRow:          { flexDirection: 'row' as const, gap: 8, marginBottom: 14 }      as ViewStyle,
    statCard:          { flex: 1, borderRadius: 13, borderWidth: 1, padding: 11, alignItems: 'center' as const } as ViewStyle,
    statIcon:          { width: 32, height: 32, borderRadius: 16, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 6 } as ViewStyle,
    statVal:           { fontSize: 20, fontWeight: '700' as const }                     as TextStyle,
    statLbl:           { fontSize: 10, marginTop: 2, textTransform: 'uppercase' as const, letterSpacing: 0.7 } as TextStyle,
    targetsSection:    { marginBottom: 14 }                                             as ViewStyle,
    targetsHeader:     { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginBottom: 10 } as ViewStyle,
    targetsTitle:      { fontSize: 15, fontWeight: '700' as const }                     as TextStyle,
    planPill:          { flexDirection: 'row' as const, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 } as ViewStyle,
    planPillText:      { fontSize: 12, fontWeight: '500' as const }                     as TextStyle,
    trackerCard:       { borderRadius: 14, borderWidth: 1, padding: 13, marginBottom: 8 } as ViewStyle,
    trackerCardTop:    { flexDirection: 'row' as const, alignItems: 'flex-end' as const, gap: 10, marginBottom: 10 } as ViewStyle,
    trackerEyebrow:    { fontSize: 10, fontWeight: '600' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const, marginBottom: 3 } as TextStyle,
    trackerValRow:     { flexDirection: 'row' as const, alignItems: 'baseline' as const, gap: 3, marginBottom: 6 } as ViewStyle,
    trackerVal:        { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.5 } as TextStyle,
    trackerUnit:       { fontSize: 13, fontWeight: '500' as const }                     as TextStyle,
    trackerOf:         { fontSize: 12, marginLeft: 2 }                                  as TextStyle,
    trackerRight:      { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 4 } as ViewStyle,
    trackerPct:        { fontSize: 13, fontWeight: '700' as const }                     as TextStyle,
    waterQuickRow:     { flexDirection: 'row' as const, gap: 6 }                        as ViewStyle,
    stepsEyebrowRow:   { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 } as ViewStyle,
    liveDot:           { width: 6, height: 6, borderRadius: 3, marginBottom: 3 }        as ViewStyle,
    sourceLabel:       { fontSize: 11, marginTop: 4 }                                    as TextStyle,
    weightRow:         { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, borderRadius: 14, borderWidth: 1, padding: 13, marginBottom: 8 } as ViewStyle,
    weightVal:         { fontSize: 17, fontWeight: '700' as const }                     as TextStyle,
    weightGoal:        { fontSize: 14, fontWeight: '600' as const }                     as TextStyle,
  });
}
