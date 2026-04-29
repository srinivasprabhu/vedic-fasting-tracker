// app/(tabs)/(home)/steps.tsx
// Full steps tracker screen — manual logging, ring, 7-day bar chart.

import { fs } from '@/constants/theme';
import { useScrollToTop } from '@react-navigation/native';
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Animated, Easing, TextInput,
  ViewStyle, TextStyle, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Footprints, Activity, Zap, Trophy, Check, Edit3, Sparkles, Lightbulb } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { usePedometer } from '@/hooks/usePedometer';
import { formatSteps } from '@/utils/calculatePlan';
import type { ColorScheme } from '@/constants/colors';
import { loadWeekStepBars } from '@/utils/stepsDayStorage';

// ─── Quick-add amounts ────────────────────────────────────────────────────────

const STEPS_GREEN = '#7AAE79';

const QUICK_STEPS = [
  { steps: 1000, label: '~10 min walk' },
  { steps: 2500, label: '~25 min walk' },
  { steps: 5000, label: '~50 min walk' },
  { steps: 10000, label: 'Full day goal' },
];

// ─── Ring ─────────────────────────────────────────────────────────────────────

const StepsRing: React.FC<{
  pct:    number;
  steps:  number;
  goal:   number;
  colors: ColorScheme;
}> = ({ pct, steps, goal, colors }) => {
  const SIZE    = 180;
  const STROKE  = 12;
  const R       = (SIZE - STROKE) / 2;
  const CIRCUMF = 2 * Math.PI * R;
  const fill    = CIRCUMF * Math.min(pct / 100, 1);

  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <Circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke={colors.surface} strokeWidth={STROKE} />
          <Circle
            cx={SIZE/2} cy={SIZE/2} r={R}
            fill="none" stroke={colors.success} strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${fill} ${CIRCUMF}`}
            transform={`rotate(-90 ${SIZE/2} ${SIZE/2})`}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={[rs.val, { color: colors.text }]}>
            {steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : steps}
          </Text>
          <Text style={[rs.unit, { color: colors.textSecondary }]}>steps</Text>
          <Text style={[rs.goal, { color: colors.success }]}>
            {Math.round(pct)}% of {formatSteps(goal)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const rs = StyleSheet.create({
  val:  { fontSize: fs(36), fontWeight: '700' as const, letterSpacing: -1 } as TextStyle,
  unit: { fontSize: fs(12), fontWeight: '500' as const, marginTop: 2 }      as TextStyle,
  goal: { fontSize: fs(12), fontWeight: '600' as const, marginTop: 4 }      as TextStyle,
});

// ─── 7-day bar chart ──────────────────────────────────────────────────────────

const WeekChart: React.FC<{
  data:   { label: string; steps: number; isToday: boolean }[];
  goal:   number;
  colors: ColorScheme;
  isDark: boolean;
}> = ({ data, goal, colors, isDark }) => {
  const maxSteps = Math.max(...data.map((d) => d.steps), goal);
  const W = 260;
  const H = 80;
  const BAR_W = 28;
  const GAP   = (W - data.length * BAR_W) / (data.length + 1);
  const goalY = H - (goal / maxSteps) * H;

  const textFill = isDark ? 'rgba(184,149,106,0.5)' : 'rgba(139,115,85,0.55)';

  return (
    <View style={{ alignItems: 'center', marginBottom: 4 }}>
      <Svg width={W} height={H + 16} viewBox={`0 0 ${W} ${H + 16}`}>
        {/* Goal line */}
        {goal > 0 && (
          <Line
            x1={0} y1={goalY} x2={W} y2={goalY}
            stroke={isDark ? 'rgba(200,135,42,0.4)' : 'rgba(160,104,32,0.4)'}
            strokeWidth={1}
            strokeDasharray="4,3"
          />
        )}
        {data.map((d, i) => {
          const barH = maxSteps > 0 ? (d.steps / maxSteps) * H : 0;
          const x = GAP + i * (BAR_W + GAP);
          const y = H - barH;
          const fill = d.isToday
            ? colors.success
            : d.steps >= goal
            ? colors.success + '80'
            : isDark ? 'rgba(122,174,121,0.3)' : 'rgba(91,140,90,0.25)';

          return (
            <React.Fragment key={d.label}>
              <Rect x={x} y={y} width={BAR_W} height={barH}
                fill={fill} rx={4} />
              <SvgText
                x={x + BAR_W / 2} y={H + 13}
                fontSize={9} fill={d.isToday ? (isDark ? '#e8a84c' : '#a06820') : textFill}
                fontWeight={d.isToday ? '700' : '400'}
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function StepsScreen() {
  const { colors, isDark } = useTheme();
  const { profile, updateDailyTarget } = useUserProfile();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const goal = profile?.plan?.dailySteps ?? 8000;
  const pedometer = usePedometer();

  const [weekData, setWeekData] = useState<{ label: string; steps: number; isToday: boolean }[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingTarget, setEditingTarget] = useState(false);
  const stepsScrollRef = useRef<ScrollView>(null);
  useScrollToTop(stepsScrollRef);

  // Use pedometer for live step count (same source as Today screen)
  const steps = pedometer.steps;

  useEffect(() => {
    loadWeekStepBars().then((week) => {
      setWeekData(week);
      setLoading(false);
    });
  }, []);

  // Keep today's bar in sync with live pedometer
  useEffect(() => {
    setWeekData(prev => prev.map(d => d.isToday ? { ...d, steps: pedometer.steps } : d));
  }, [pedometer.steps]);

  const pct       = goal > 0 ? (steps / goal) * 100 : 0;
  const remaining = Math.max(0, goal - steps);

  const addSteps = useCallback(async (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await pedometer.addManual(amount);
  }, [pedometer]);

  const handleManualAdd = useCallback(async () => {
    const n = parseInt(inputVal, 10);
    if (!isNaN(n) && n > 0) {
      await addSteps(n);
      setInputVal('');
      setShowInput(false);
    }
  }, [inputVal, addSteps]);

  const kcalBurned = Math.round(steps * 0.05);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ScrollView
            ref={stepsScrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <ChevronLeft size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.title, { color: colors.text }]}>Daily Steps</Text>
            </View>

            {/* Ring */}
            <StepsRing pct={pct} steps={steps} goal={goal} colors={colors} />

            {/* Editable target */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEditingTarget(prev => !prev); }}
              style={[styles.targetPill, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            >
              <Text style={[styles.targetLabel, { color: colors.textSecondary }]}>Daily target</Text>
              <Text style={[styles.targetValue, { color: colors.success }]}>{formatSteps(goal)}</Text>
              {editingTarget ? <Check size={14} color={colors.success} /> : <Edit3 size={14} color={colors.textMuted} />}
            </TouchableOpacity>

            {editingTarget && (
              <View style={styles.targetPresets}>
                {[5000, 6000, 7500, 8000, 10000, 12000].map(s => (
                  <TouchableOpacity
                    key={s}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Set daily step target to ${formatSteps(s)} steps`}
                    accessibilityState={{ selected: s === goal }}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      updateDailyTarget('dailySteps', s);
                      setEditingTarget(false);
                    }}
                    style={[
                      styles.targetPresetBtn,
                      {
                        backgroundColor: s === goal ? 'rgba(91,140,90,0.15)' : colors.card,
                        borderColor: s === goal ? colors.success : colors.borderLight,
                      },
                    ]}
                  >
                    <Text style={[
                      styles.targetPresetText,
                      { color: s === goal ? colors.success : colors.text, fontWeight: s === goal ? '700' : '500' },
                    ]}>
                      {formatSteps(s)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Stats */}
            <View style={styles.statsRow}>
              {[
                { val: remaining >= 1000 ? `${(remaining / 1000).toFixed(1)}k` : String(remaining), lbl: 'to goal' },
                { val: `${(steps * 0.00076).toFixed(1)}km`, lbl: 'distance' },
                { val: String(kcalBurned), lbl: 'kcal' },
              ].map(({ val, lbl }) => (
                <View key={lbl} style={[styles.statBox, { backgroundColor: colors.successLight, borderColor: colors.success + '30' }]}>
                  <Text style={[styles.statVal, { color: colors.success }]}>{val}</Text>
                  <Text style={[styles.statLbl, { color: isDark ? 'rgba(122,174,121,0.55)' : 'rgba(91,140,90,0.55)' }]}>{lbl}</Text>
                </View>
              ))}
            </View>

            {/* 7-day chart */}
            {weekData.length > 0 && (
              <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <View style={styles.chartHeader}>
                  <Text style={[styles.chartTitle, { color: colors.text }]}>7-day history</Text>
                  <Text style={[styles.chartAvg, { color: colors.textMuted }]}>
                    avg {formatSteps(Math.round(weekData.reduce((s, d) => s + d.steps, 0) / Math.max(1, weekData.filter(d => d.steps > 0).length)))} steps
                  </Text>
                </View>
                <WeekChart data={weekData} goal={goal} colors={colors} isDark={isDark} />
              </View>
            )}

            {/* Quick add */}
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>QUICK ADD</Text>
            <View style={styles.quickGrid}>
              {QUICK_STEPS.map((opt, idx) => (
                <TouchableOpacity
                  key={opt.steps}
                  onPress={() => addSteps(opt.steps)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={
                    opt.steps >= 1000
                      ? `Add ${opt.steps / 1000} thousand steps (${opt.label})`
                      : `Add ${opt.steps} steps (${opt.label})`
                  }
                  accessibilityHint="Double tap to add these steps to your count for today"
                  style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
                >
                  <View style={styles.quickIconCircle}>
                    {idx === 0 ? <Footprints size={15} color={STEPS_GREEN} /> :
                     idx === 1 ? <Activity size={15} color={STEPS_GREEN} /> :
                     idx === 2 ? <Zap size={15} color={STEPS_GREEN} /> :
                     <Trophy size={15} color={STEPS_GREEN} />}
                  </View>
                  <Text style={[styles.quickSteps, { color: colors.success }]}>
                    +{opt.steps >= 1000 ? `${opt.steps / 1000}k` : opt.steps}
                  </Text>
                  <Text style={[styles.quickLabel, { color: colors.textMuted }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Manual entry */}
            {showInput ? (
              <View style={[styles.manualCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <Text style={[styles.manualLabel, { color: colors.textMuted }]}>Enter steps manually</Text>
                <View style={styles.manualRow}>
                  <TextInput
                    value={inputVal}
                    onChangeText={setInputVal}
                    keyboardType="number-pad"
                    placeholder="e.g. 3500"
                    placeholderTextColor={colors.textMuted}
                    style={[styles.manualInput, { color: colors.text, borderColor: colors.borderLight }]}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleManualAdd}
                  />
                  <TouchableOpacity
                    onPress={handleManualAdd}
                    style={[styles.manualBtn, { backgroundColor: colors.primary }]}
                  >
                    <Text style={[styles.manualBtnText, { color: colors.textLight }]}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setShowInput(true)}
                style={[styles.manualToggle, { borderColor: colors.borderLight }]}
              >
                <Text style={[styles.manualToggleText, { color: colors.textSecondary }]}>
                  + Enter steps manually
                </Text>
              </TouchableOpacity>
            )}

            {/* Goal met */}
            {pct >= 100 && (
              <View style={[styles.goalBanner, { backgroundColor: colors.successLight, borderColor: colors.success + '40' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Trophy size={15} color={colors.success} />
                  <Text style={[styles.goalText, { color: colors.success }]}>
                    Daily goal reached! Amazing work.
                  </Text>
                </View>
              </View>
            )}

            {/* Tip */}
            {pct < 100 && remaining > 0 && (
              <View style={[styles.tip, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  <Lightbulb size={15} color={colors.textSecondary} style={{ marginTop: 2 }} />
                  <Text style={[styles.tipText, { color: colors.textSecondary, flex: 1 }]}>
                    {remaining >= 1000
                      ? `Walk ${Math.ceil(remaining / 120)} more minutes to hit your goal.`
                      : `Just ${remaining} more steps — you're almost there!`}
                  </Text>
                </View>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    root:        { flex: 1, backgroundColor: colors.background } as ViewStyle,
    safe:        { flex: 1 }                                      as ViewStyle,
    scroll:      { flex: 1 }                                      as ViewStyle,
    content:     { paddingHorizontal: 20, paddingBottom: 40 }     as ViewStyle,
    header:      { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, marginTop: 12, marginBottom: 8 } as ViewStyle,
    backBtn:     { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const } as ViewStyle,
    title:       { fontSize: fs(22), fontWeight: '700' as const, letterSpacing: -0.3 } as TextStyle,
    targetPill:    { flexDirection: 'row' as const, alignItems: 'center' as const, alignSelf: 'center' as const, gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginBottom: 14 } as ViewStyle,
    targetLabel:   { fontSize: fs(13), fontWeight: '500' as const } as TextStyle,
    targetValue:   { fontSize: fs(15), fontWeight: '700' as const } as TextStyle,
    targetEdit:    { fontSize: fs(14), marginLeft: 2 } as TextStyle,
    targetPresets: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, justifyContent: 'center' as const, marginBottom: 16 } as ViewStyle,
    targetPresetBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 } as ViewStyle,
    targetPresetText: { fontSize: fs(14) } as TextStyle,
    statsRow:    { flexDirection: 'row' as const, gap: 8, marginBottom: 20 }       as ViewStyle,
    statBox:     { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10, alignItems: 'center' as const } as ViewStyle,
    statVal:     { fontSize: fs(18), fontWeight: '700' as const, letterSpacing: -0.5 } as TextStyle,
    statLbl:     { fontSize: fs(11), fontWeight: '500' as const, marginTop: 2, textTransform: 'uppercase' as const, letterSpacing: 0.5 } as TextStyle,
    chartCard:   { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 20 } as ViewStyle,
    chartHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 12 } as ViewStyle,
    chartTitle:  { fontSize: fs(13), fontWeight: '600' as const }                      as TextStyle,
    chartAvg:    { fontSize: fs(12) }                                                   as TextStyle,
    sectionTitle:{ fontSize: fs(11), fontWeight: '600' as const, letterSpacing: 0.8, marginBottom: 10 } as TextStyle,
    quickGrid:   { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, marginBottom: 16 } as ViewStyle,
    quickBtn:    { width: '47.5%', borderRadius: 16, borderWidth: 1, padding: 12, alignItems: 'center' as const, gap: 4 } as ViewStyle,
    quickIconCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(122,174,121,0.1)', alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 2 } as ViewStyle,
    quickSteps:  { fontSize: fs(15), fontWeight: '700' as const }                      as TextStyle,
    quickLabel:  { fontSize: fs(9), textAlign: 'center' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5 } as TextStyle,
    manualCard:  { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 14 } as ViewStyle,
    manualLabel: { fontSize: fs(12), marginBottom: 10 }                                as TextStyle,
    manualRow:   { flexDirection: 'row' as const, gap: 10 }                        as ViewStyle,
    manualInput: { flex: 1, fontSize: fs(18), fontWeight: '600' as const, borderBottomWidth: 1.5, paddingVertical: 6, paddingHorizontal: 0 } as TextStyle,
    manualBtn:   { borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, justifyContent: 'center' as const } as ViewStyle,
    manualBtnText: { fontSize: fs(14), fontWeight: '600' as const }                    as TextStyle,
    manualToggle:{ borderWidth: 1, borderStyle: 'dashed' as const, borderRadius: 12, padding: 14, alignItems: 'center' as const, marginBottom: 14 } as ViewStyle,
    manualToggleText: { fontSize: fs(13), fontWeight: '500' as const }                 as TextStyle,
    goalBanner:  { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 14, alignItems: 'center' as const } as ViewStyle,
    goalText:    { fontSize: fs(13), fontWeight: '600' as const }                      as TextStyle,
    tip:         { borderRadius: 12, borderWidth: 1, padding: 12 }                 as ViewStyle,
    tipText:     { fontSize: fs(13), lineHeight: 19 }                                  as TextStyle,
  });
}
