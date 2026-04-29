// app/(tabs)/insights/index.tsx
// Insights tab — Metabolic Discipline Score + health metrics with Pro gating.

import { fs } from '@/constants/theme';
import { useScrollToTop } from '@react-navigation/native';
import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, ViewStyle, TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Zap, TrendingUp, Heart, Sparkles, Droplets,
  Flame, Brain, Info, Lock, ChevronRight,
  Activity,
} from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useFasting } from '@/contexts/FastingContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import {
  calculateMetabolicScore,
  getScoreLevel,
  getScoreColor,
  getLastWeekRecords,
  getTargetFastsPerWeek,
  getRecordsForRange,
  getPreviousPeriodRecords,
  getInsightPeriodSpanDays,
  InsightRange,
} from '@/utils/metabolic-score';
import {
  formatHours,
  formatNumber,
  formatInsightHours,
  getAutophagyScore,
  getExtendedFastingSupportLevel,
  calculateFatBurned,
  AUTOPHAGY_THRESHOLD_HOURS,
  toLocalDateString,
} from '@/utils/analytics-helpers';
import type { FastRecord } from '@/types/fasting';
import { METRIC_KNOWLEDGE, MetricKnowledge } from '@/mocks/metric-knowledge';
import MetricKnowledgeModal from '@/components/MetricKnowledgeModal';
import ScoreBreakdownModal from '@/components/ScoreBreakdownModal';
import MonthlyReportCard from '@/components/MonthlyReportCard';
import { AayuMandala } from '@/components/onboarding/AayuMandala';
import {
  SmartProjectionActive,
  SmartProjectionBuilding,
  SmartProjectionLocked,
} from '@/components/SmartProjectionCard';
import {
  isSmartProjectionEligible,
  calculateSmartProjection,
  getSmartProjectionTeaser,
  WeightLogEntry,
} from '@/utils/smart-projection';
import type { ColorScheme } from '@/constants/colors';
import { StatValueText } from '@/components/ui/StatValueText';

const WEIGHT_LOG_KEY = 'aayu_weight_log';

// ─── Score ring (SVG arc) ─────────────────────────────────────────────────────

const ScoreRing: React.FC<{ score: number; color: string; colors: ColorScheme }> = ({ score, color, colors }) => {
  const SIZE = 96;
  const STROKE = 7;
  const R = (SIZE - STROKE) / 2;
  const CIRCUMF = 2 * Math.PI * R;
  const fill = CIRCUMF * (score / 100);

  return (
    <View style={{ width: SIZE, height: SIZE }}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke={colors.surface} strokeWidth={STROKE} />
        <Circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          fill="none" stroke={color} strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${fill} ${CIRCUMF}`}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={[{ fontSize: fs(30), fontWeight: '800', color, letterSpacing: -1 }]}>{score}</Text>
      </View>
    </View>
  );
};

// ─── Range toggle (7D / 30D / All-time) ──────────────────────────────────────

const RANGE_LABEL: Record<InsightRange, string> = {
  '7D': '7D',
  '30D': '30D',
  ALL: 'All',
};

const RangeToggle: React.FC<{
  value: InsightRange;
  onChange: (v: InsightRange) => void;
  isProUser: boolean;
  colors: ColorScheme;
  onLockedProPress?: () => void;
}> = ({ value, onChange, isProUser, colors, onLockedProPress }) => {
  const ranges: InsightRange[] = ['7D', '30D', 'ALL'];
  return (
    <View style={[rtS.row, { backgroundColor: colors.surface }]}>
      {ranges.map(r => {
        const active = value === r;
        const locked = !isProUser && r !== '7D';
        return (
          <TouchableOpacity
            key={r} activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (locked) {
                onLockedProPress?.();
                return;
              }
              onChange(r);
            }}
            style={[rtS.item, active && { backgroundColor: colors.card }]}
          >
            <View style={rtS.labelRow}>
              <Text style={[rtS.label, { color: active ? colors.text : colors.textMuted }, active && rtS.labelActive]}>{RANGE_LABEL[r]}</Text>
              {locked && <Lock size={9} color={colors.trackWeight} style={{ marginLeft: 2 }} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const rtS = StyleSheet.create({
  row: { flexDirection: 'row', borderRadius: 10, padding: 2, gap: 2 } as ViewStyle,
  item: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center' } as ViewStyle,
  labelRow: { flexDirection: 'row', alignItems: 'center' } as ViewStyle,
  label: { fontSize: fs(12), fontWeight: '500' } as TextStyle,
  labelActive: { fontWeight: '700' } as TextStyle,
});

// ─── Breakdown pill ───────────────────────────────────────────────────────────

const BreakdownPill: React.FC<{ label: string; value: string; colors: ColorScheme }> = ({ label, value, colors }) => (
  <View style={[pillS.pill, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
    <Text style={[pillS.label, { color: colors.textSecondary }]}>{label}</Text>
    <Text style={[pillS.value, { color: colors.text }]}> {value}</Text>
  </View>
);

const pillS = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1, marginRight: 6, marginBottom: 6 } as ViewStyle,
  label: { fontSize: fs(11), fontWeight: '500' } as TextStyle,
  value: { fontSize: fs(11), fontWeight: '700' } as TextStyle,
});

// ─── Key stat with sublabel ───────────────────────────────────────────────────

const KeyStatCard: React.FC<{
  value: string;
  label: string;
  sublabel?: string;
  sublabelColor?: string;
  colors: ColorScheme;
  onInfoPress?: () => void;
}> = ({ value, label, sublabel, sublabelColor, colors, onInfoPress }) => {
  const body = (
    <>
      <StatValueText color={colors.text} size="lg">{value}</StatValueText>
      <Text style={[ksS.label, { color: colors.textMuted }]}>{label}</Text>
      {sublabel ? <Text style={[ksS.sub, { color: sublabelColor || colors.success }]}>{sublabel}</Text> : null}
    </>
  );
  return (
    <View style={[ksS.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
      {onInfoPress ? (
        <TouchableOpacity
          style={ksS.infoCorner}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onInfoPress();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={`More about ${label}`}
        >
          <Info size={12} color={colors.textMuted} />
        </TouchableOpacity>
      ) : null}
      {onInfoPress ? (
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onInfoPress();
          }}
          style={ksS.cardTouchable}
        >
          {body}
        </TouchableOpacity>
      ) : (
        body
      )}
    </View>
  );
};

const ksS = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    alignSelf: 'stretch',
    position: 'relative' as const,
  } as ViewStyle,
  infoCorner: { position: 'absolute' as const, top: 8, right: 8, zIndex: 2 } as ViewStyle,
  cardTouchable: { alignItems: 'center' as const, width: '100%' } as ViewStyle,
  label: { fontSize: fs(10), fontWeight: '600', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.6, textAlign: 'center' } as TextStyle,
  sub: { fontSize: fs(10), fontWeight: '600', marginTop: 2 } as TextStyle,
});

// ─── Consistency dots (Mon–Sun): green if a fast completed that day (by end date, local) ─

const ConsistencyDots: React.FC<{ weekRecords: FastRecord[]; colors: ColorScheme }> = ({ weekRecords, colors }) => {
  const now = new Date();
  const day = now.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - daysFromMonday);

  const completedEndDays = new Set<string>();
  weekRecords.forEach(r => {
    if (!r.completed) return;
    const t = r.endTime ?? r.startTime;
    completedEndDays.add(toLocalDateString(t));
  });

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <View style={dotS.row}>
      {days.map((d, i) => {
        const cell = new Date(startOfWeek);
        cell.setDate(startOfWeek.getDate() + i);
        const filled = completedEndDays.has(toLocalDateString(cell));
        return (
          <View key={i} style={dotS.item}>
            <View style={[dotS.dot, {
              backgroundColor: filled ? colors.success : 'transparent',
              borderColor: filled ? colors.success : colors.borderLight,
            }]} />
            <Text style={[dotS.label, { color: colors.textMuted }]}>{d}</Text>
          </View>
        );
      })}
    </View>
  );
};

const dotS = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 4 } as ViewStyle,
  item: { alignItems: 'center', gap: 5 } as ViewStyle,
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5 } as ViewStyle,
  label: { fontSize: fs(10), fontWeight: '500' } as TextStyle,
});

// ─── Pro locked card ──────────────────────────────────────────────────────────

const ProLockedCard: React.FC<{
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  previewValue?: string;
  colors: ColorScheme;
  onPress?: () => void;
}> = ({ title, subtitle, icon, previewValue, colors, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress?.();
    }}
    style={[lockS.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
  >
    <View style={lockS.topRow}>
      {icon}
      <View style={[lockS.proBadge, { backgroundColor: `${colors.trackWeight}1F` }]}>
        <Lock size={9} color={colors.trackWeight} />
        <Text style={[lockS.proText, { color: colors.trackWeight }]}>PRO</Text>
      </View>
    </View>
    {previewValue && (
      <Text style={[lockS.previewVal, { color: colors.textMuted }]}>{previewValue}</Text>
    )}
    <Text style={[lockS.title, { color: colors.text }]}>{title}</Text>
    <Text style={[lockS.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
  </TouchableOpacity>
);

const lockS = StyleSheet.create({
  card: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 14, alignItems: 'center', minHeight: 120 } as ViewStyle,
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 8 } as ViewStyle,
  proBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 } as ViewStyle,
  proText: { fontSize: fs(10), fontWeight: '800', letterSpacing: 0.8 } as TextStyle,
  previewVal: { fontSize: fs(20), fontWeight: '700', letterSpacing: -0.5, marginBottom: 2, opacity: 0.35 } as TextStyle,
  title: { fontSize: fs(12), fontWeight: '600', textAlign: 'center' } as TextStyle,
  subtitle: { fontSize: fs(10), textAlign: 'center', marginTop: 2, lineHeight: 14 } as TextStyle,
});

// ─── Free metric card ─────────────────────────────────────────────────────────

const FreeMetricCard: React.FC<{
  icon: React.ReactNode;
  value: string;
  label: string;
  sublabel: string;
  color: string;
  colors: ColorScheme;
  onPress?: () => void;
}> = ({ icon, value, label, sublabel, color, colors, onPress }) => {
  const open = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };
  return (
    <View style={[freeS.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
      {onPress ? (
        <TouchableOpacity
          style={freeS.infoCorner}
          onPress={open}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={`More about ${label}`}
        >
          <Info size={13} color={colors.textMuted} />
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity activeOpacity={0.75} onPress={onPress ? open : undefined} disabled={!onPress} style={freeS.cardInner}>
        <View style={[freeS.iconWrap, { backgroundColor: `${color}18` }]}>{icon}</View>
        <StatValueText color={color} size="md">{value}</StatValueText>
        <Text style={[freeS.label, { color: colors.text }]}>{label}</Text>
        <Text style={[freeS.sublabel, { color: colors.textMuted }]}>{sublabel}</Text>
      </TouchableOpacity>
    </View>
  );
};

const freeS = StyleSheet.create({
  card: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 14, alignSelf: 'stretch', position: 'relative' as const } as ViewStyle,
  infoCorner: { position: 'absolute' as const, top: 10, right: 10, zIndex: 2 } as ViewStyle,
  cardInner: { alignItems: 'center' as const, width: '100%' } as ViewStyle,
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 } as ViewStyle,
  label: { fontSize: fs(12), fontWeight: '600', marginTop: 2, textAlign: 'center' } as TextStyle,
  sublabel: { fontSize: fs(10), textAlign: 'center', marginTop: 1, lineHeight: 14 } as TextStyle,
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function InsightsScreen() {
  const { colors, isDark } = useTheme();
  const { profile, isProUser } = useUserProfile();
  const { presentPaywall } = useRevenueCat();
  const { completedRecords, streak, thisWeekRecords } = useFasting();
  const openProPaywall = useCallback(() => {
    void presentPaywall();
  }, [presentPaywall]);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [range, setRange] = useState<InsightRange>('7D');
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricKnowledge | null>(null);
  const [knowledgeModalVisible, setKnowledgeModalVisible] = useState(false);
  const [weightLogs, setWeightLogs] = useState<WeightLogEntry[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const insightsScrollRef = useRef(null);
  useScrollToTop(insightsScrollRef);
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  // Load weight logs (refresh on screen focus)
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(WEIGHT_LOG_KEY).then(raw => {
        if (raw) {
          try {
            const entries = JSON.parse(raw) as WeightLogEntry[];
            setWeightLogs(entries);
          } catch {}
        }
      });
    }, [])
  );

  const handleInfoPress = useCallback((id: string) => {
    const metric = METRIC_KNOWLEDGE[id];
    if (metric) { setSelectedMetric(metric); setKnowledgeModalVisible(true); }
  }, []);

  // ── Compute scores based on selected range ──────────────────────────────────
  const plan = profile?.plan;
  const targetFastHours = plan?.fastHours ?? 16;
  const targetFastsPerWeek = getTargetFastsPerWeek(plan?.fastLabel);

  // Records for the selected time range (7d rolling, 30d rolling, or everything)
  const periodRecords = useMemo(() => getRecordsForRange(completedRecords, range), [completedRecords, range]);
  const prevPeriodRecords = useMemo(() => getPreviousPeriodRecords(completedRecords, range), [completedRecords, range]);
  const periodSpanDays = useMemo(
    () => getInsightPeriodSpanDays(completedRecords, range),
    [completedRecords, range],
  );
  const targetFastsForSpan = useMemo(
    () => Math.max(1, Math.round(targetFastsPerWeek * (periodSpanDays / 7))),
    [targetFastsPerWeek, periodSpanDays],
  );

  const metabolicScore = useMemo(() => calculateMetabolicScore({
    completedRecords,
    thisWeekRecords: periodRecords,
    lastWeekRecords: prevPeriodRecords,
    streak,
    targetFastHours,
    targetFastsPerWeek,
    periodDays: periodSpanDays,
  }), [completedRecords, periodRecords, prevPeriodRecords, streak, targetFastHours, targetFastsPerWeek, periodSpanDays]);

  const periodLabel = range === '7D' ? 'Last 7 days' : range === '30D' ? 'Last 30 days' : 'All time';
  const vsLabel = range === '7D' ? 'vs prior 7 days' : range === '30D' ? 'vs prior 30 days' : '';

  const scoreLevel = getScoreLevel(metabolicScore.total);
  const scoreColor = getScoreColor(scoreLevel, isDark);

  // Health metrics: same window as the range toggle (not lifetime)
  const avgFastDuration = useMemo(() => {
    if (periodRecords.length === 0) return 0;
    return periodRecords.reduce((sum, r) => sum + ((r.endTime ?? 0) - r.startTime) / 3600000, 0) / periodRecords.length;
  }, [periodRecords]);

  const completionRate = useMemo(() => {
    if (periodRecords.length === 0) return 0;
    return Math.round((periodRecords.filter(r => r.completed).length / periodRecords.length) * 100);
  }, [periodRecords]);

  const insulinSensitivity = useMemo(() => {
    if (periodRecords.length === 0) return 0;
    const periodCompleted = periodRecords.filter(r => r.completed).length;
    const d = Math.min(35, (avgFastDuration / 16) * 35);
    const s = Math.min(25, (periodCompleted / targetFastsForSpan) * 25);
    const c = (completionRate / 100) * 30;
    const e = Math.min(10, (periodCompleted / Math.max(15, targetFastsForSpan * 2)) * 10);
    return Math.min(Math.round(d + s + c + e), 100);
  }, [avgFastDuration, completionRate, periodRecords, targetFastsForSpan]);

  const autophagyDepth = useMemo(() => {
    if (periodRecords.length === 0) return 0;
    const scores = periodRecords.map(r => getAutophagyScore(((r.endTime ?? 0) - r.startTime) / 3600000));
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [periodRecords]);

  const longestFast = useMemo(() => {
    if (periodRecords.length === 0) return 0;
    return Math.max(...periodRecords.map(r => ((r.endTime ?? 0) - r.startTime) / 3600000));
  }, [periodRecords]);

  const extendedFastingLevel = useMemo(
    () => getExtendedFastingSupportLevel(longestFast),
    [longestFast],
  );

  const inflammationReduction = useMemo(() => {
    if (periodRecords.length === 0) return 0;
    const periodHoursSum = periodRecords.reduce((sum, r) => sum + ((r.endTime ?? 0) - r.startTime) / 3600000, 0);
    const b = Math.min(40, (periodHoursSum / 1000) * 40);
    const periodCompleted = periodRecords.filter(r => r.completed).length;
    const c = Math.min(15, (periodCompleted / targetFastsForSpan) * 15);
    const q = avgFastDuration >= 16 ? 10 : avgFastDuration >= 14 ? 5 : 0;
    return Math.round(b + c + q);
  }, [periodRecords, targetFastsForSpan, avgFastDuration]);

  const totalFatBurned = useMemo(
    () => periodRecords.reduce((sum, r) => sum + calculateFatBurned(((r.endTime ?? 0) - r.startTime) / 3600000), 0),
    [periodRecords],
  );
  const totalAutophagyHours = useMemo(() => {
    let h = 0;
    periodRecords.forEach(r => {
      const d = ((r.endTime ?? 0) - r.startTime) / 3600000;
      if (d > AUTOPHAGY_THRESHOLD_HOURS) h += d - AUTOPHAGY_THRESHOLD_HOURS;
    });
    return h;
  }, [periodRecords]);
  const cellularAgeReduction = useMemo(
    () => Math.round((totalAutophagyHours / 100 / 12) * 10) / 10,
    [totalAutophagyHours],
  );
  const gutRestHours = useMemo(
    () => periodRecords.reduce((sum, r) => sum + Math.max(0, ((r.endTime ?? 0) - r.startTime) / 3600000 - 8), 0),
    [periodRecords],
  );

  // Key stats row (low-insulin time, etc.)
  const periodHours = useMemo(() => periodRecords.reduce((sum, r) => sum + ((r.endTime ?? 0) - r.startTime) / 3600000, 0), [periodRecords]);
  const periodCompleted = periodRecords.filter(r => r.completed).length;

  // Also keep this-week for the consistency dots (always 7-day)
  const weekCompleted = thisWeekRecords.filter(r => r.completed).length;

  // ── Smart Projection (Pro feature) ────────────────────────────────────────
  const goalKg = profile?.goalWeightKg ?? null;
  const startKg = profile?.startingWeightKg ?? profile?.currentWeightKg ?? 0;
  const weightUnit = profile?.weightUnit ?? 'kg';

  const projectionEligibility = useMemo(() =>
    isSmartProjectionEligible(weightLogs, completedRecords.length, streak, goalKg),
    [weightLogs, completedRecords.length, streak, goalKg]
  );

  const smartProjection = useMemo(() => {
    if (!projectionEligibility.eligible || !goalKg) return null;
    return calculateSmartProjection({
      weightLogs,
      goalKg,
      startKg,
      completedRecords,
      streak,
    });
  }, [weightLogs, goalKg, startKg, completedRecords, streak, projectionEligibility.eligible]);

  const projectionTeaser = useMemo(() =>
    getSmartProjectionTeaser(weightLogs.length, streak, !!goalKg),
    [weightLogs.length, streak, goalKg]
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Sticky header (outside scroll, matches Today tab) */}
        <View style={[styles.headerSticky, { backgroundColor: colors.background, borderBottomColor: colors.borderLight }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.screenTitle, { color: colors.text }]}>Insights</Text>
            <RangeToggle
              value={range}
              onChange={setRange}
              isProUser={isProUser}
              colors={colors}
              onLockedProPress={openProPaywall}
            />
          </View>
        </View>

        <Animated.ScrollView
          ref={insightsScrollRef}
          style={[{ flex: 1 }, { opacity: fadeAnim }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Hero: Metabolic Discipline Score ──────────────────────── */}
          <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.borderLight, overflow: 'hidden' }]}>
            <View
              pointerEvents="none"
              style={{ position: 'absolute', right: -36, top: -28, zIndex: 0 }}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <AayuMandala size={168} color={colors.primary} animated={false} glow={false} opacity={0.07} />
            </View>
            <View style={[styles.heroTopRow, { zIndex: 1 }]}>
              <Text style={[styles.heroEyebrow, { color: colors.textMuted }]}>METABOLIC DISCIPLINE SCORE</Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleInfoPress('metabolicDiscipline');
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="About Metabolic Discipline Score"
              >
                <Info size={14} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={[styles.heroBody, { zIndex: 1 }]}>
              <ScoreRing score={metabolicScore.total} color={scoreColor} colors={colors} />
              <View style={styles.heroMeta}>
                <Text style={[styles.heroLabel, { color: colors.text }]}>{metabolicScore.label}</Text>
                {vsLabel.length > 0 && metabolicScore.vsLastWeek !== 0 && (
                  <Text style={[styles.heroChange, { color: metabolicScore.vsLastWeek > 0 ? colors.success : colors.error }]}>
                    {metabolicScore.vsLastWeek > 0 ? '▲' : '▼'} {metabolicScore.vsLastWeek > 0 ? '+' : ''}{metabolicScore.vsLastWeek} {vsLabel}
                  </Text>
                )}
                <View style={styles.pillWrap}>
                  <BreakdownPill label="Duration" value={metabolicScore.durationGrade} colors={colors} />
                  <BreakdownPill label="Consistency" value={`${metabolicScore.consistencyPct}%`} colors={colors} />
                  <BreakdownPill label="Circadian" value={`${metabolicScore.circadianPct}%`} colors={colors} />
                  <BreakdownPill label="Deep Fasts" value={String(metabolicScore.deepFastCount)} colors={colors} />
                </View>
              </View>
            </View>

            {/* See score breakdown link */}
            <TouchableOpacity
              style={styles.breakdownLink}
              activeOpacity={0.7}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowBreakdown(true); }}
            >
              <Text style={[styles.breakdownLinkText, { color: colors.primary }]}>See score breakdown →</Text>
            </TouchableOpacity>
          </View>

          {/* ─── Key Stats Row ─────────────────────────────────────────── */}
          <View style={styles.keyStatsRow}>
            <KeyStatCard
              value={formatInsightHours(periodHours)}
              label="Low-insulin time"
              sublabel={periodLabel}
              colors={colors}
              onInfoPress={() => handleInfoPress('lowInsulinTime')}
            />
            <KeyStatCard
              value={String(metabolicScore.deepFastCount)}
              label="Deep fasts"
              sublabel={metabolicScore.deepFastCount > 0 ? `16h+ · ${periodLabel.toLowerCase()}` : undefined}
              colors={colors}
              onInfoPress={() => handleInfoPress('deepFastsInsight')}
            />
            <KeyStatCard
              value={`${metabolicScore.circadianPct}%`}
              label="Circadian alignment"
              sublabel={metabolicScore.circadianPct >= 70 ? '▲ Improving' : undefined}
              sublabelColor={metabolicScore.circadianPct >= 70 ? colors.success : colors.textMuted}
              colors={colors}
              onInfoPress={() => handleInfoPress('circadianAlignment')}
            />
          </View>

          {/* ─── Fasting Consistency ────────────────────────────────────── */}
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Fasting Consistency</Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleInfoPress('fastingConsistency');
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="About fasting consistency"
              >
                <Info size={14} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ConsistencyDots weekRecords={thisWeekRecords} colors={colors} />
            <View style={styles.consistencyStats}>
              <Text style={[styles.cStat, { color: colors.textSecondary }]}>{weekCompleted}/{targetFastsPerWeek} target days</Text>
              <Text style={[styles.cStat, { color: colors.textSecondary }]}>{streak} day streak</Text>
              <Text style={[styles.cStat, { color: colors.textSecondary }]}>{formatHours(longestFast)} longest</Text>
            </View>
          </View>

          {/* ─── Free Health Metrics ────────────────────────────────────── */}
          <Text style={[styles.sectionHeader, { color: colors.text }]}>Health Metrics</Text>
          <View style={styles.metricsGrid}>
            <FreeMetricCard
              icon={<Droplets size={18} color="#2E86AB" />}
              value={`${insulinSensitivity}/100`}
              label="Insulin Sensitivity"
              sublabel="Metabolic health"
              color="#2E86AB"
              colors={colors}
              onPress={() => handleInfoPress('insulinSensitivity')}
            />
            <FreeMetricCard
              icon={<Sparkles size={18} color="#7B68AE" />}
              value={`${autophagyDepth}%`}
              label="Autophagy Depth"
              sublabel="Cellular renewal"
              color="#7B68AE"
              colors={colors}
              onPress={() => handleInfoPress('autophagy')}
            />
          </View>

          {/* ─── Pro zone: upgrade CTA at entrance, then all Pro content ── */}

          {/* Unlock banner — shown at top of Pro zone so free users see it
              before encountering locked cards, not after */}
          {!isProUser && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={openProPaywall}
              style={[styles.proBanner, {
                backgroundColor: isDark ? 'rgba(232,168,76,0.08)' : 'rgba(200,135,42,0.06)',
                borderColor: isDark ? 'rgba(232,168,76,0.25)' : 'rgba(200,135,42,0.2)',
              }]}
            >
              <View style={styles.proBannerLeft}>
                <Sparkles size={16} color={colors.trackWeight} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.proBannerTitle, { color: colors.text }]}>Unlock Aayu Pro</Text>
                  <Text style={[styles.proBannerSub, { color: colors.textSecondary }]}>Advanced metrics, AI coaching, weight forecast</Text>
                </View>
              </View>
              <ChevronRight size={18} color={colors.primary} />
            </TouchableOpacity>
          )}

          {/* ─── Smart Weight Projection (Pro) ────────────────────── */}
          {isProUser ? (
            smartProjection?.available ? (
              <SmartProjectionActive
                projection={smartProjection}
                weightUnit={weightUnit}
                colors={colors}
                isDark={isDark}
              />
            ) : (
              <SmartProjectionBuilding
                teaser={projectionTeaser}
                logsNeeded={projectionEligibility.logsNeeded}
                daysNeeded={projectionEligibility.daysNeeded}
                colors={colors}
              />
            )
          ) : (
            <TouchableOpacity activeOpacity={0.88} onPress={openProPaywall}>
              <SmartProjectionLocked
                teaser={projectionTeaser}
                colors={colors}
                isDark={isDark}
              />
            </TouchableOpacity>
          )}

          {/* ─── Monthly Report (Pro) ────────────────────────────────── */}
          <MonthlyReportCard />

          {/* ─── Pro Insights ───────────────────────────────────────────── */}
          <View style={styles.proSection}>
            <View style={styles.proHeader}>
              {isProUser ? <Zap size={14} color={colors.trackWeight} /> : <Lock size={14} color={colors.trackWeight} />}
              <Text style={[styles.proHeaderText, { color: colors.text }]}>{isProUser ? 'Advanced Metrics' : 'Pro Insights'}</Text>
            </View>
            {!isProUser && <Text style={[styles.proSubtext, { color: colors.textMuted }]}>Unlock deeper health intelligence with Aayu Pro</Text>}
          </View>

          <View style={styles.metricsGrid}>
            {isProUser ? (
              <FreeMetricCard icon={<Flame size={18} color="#E8913A" />} value={`${formatNumber(totalFatBurned)}g`} label="Fat Burned" sublabel="Estimated fat loss" color="#E8913A" colors={colors} onPress={() => handleInfoPress('fatBurned')} />
            ) : (
              <ProLockedCard title="Fat Burned" subtitle="Total estimated fat loss" icon={<Flame size={18} color="#E8913A" />} previewValue="●●●g" colors={colors} onPress={openProPaywall} />
            )}
            {isProUser ? (
              <FreeMetricCard icon={<TrendingUp size={18} color="#E8913A" />} value={`${extendedFastingLevel.score}/100`} label={extendedFastingLevel.label} sublabel={`Longest ${formatHours(longestFast)} · ${extendedFastingLevel.sublabel}`} color="#E8913A" colors={colors} onPress={() => handleInfoPress('metabolicZone')} />
            ) : (
              <ProLockedCard title="Fasting phase" subtitle="Metabolic depth from your longest fast" icon={<TrendingUp size={18} color="#E8913A" />} previewValue="●●/100" colors={colors} onPress={openProPaywall} />
            )}
          </View>
          <View style={styles.metricsGrid}>
            {isProUser ? (
              <FreeMetricCard icon={<Heart size={18} color="#C25450" />} value={`${inflammationReduction}/100`} label="Inflammation" sublabel="Cumulative reduction" color="#C25450" colors={colors} onPress={() => handleInfoPress('inflammationReduction')} />
            ) : (
              <ProLockedCard title="Inflammation" subtitle="Cumulative reduction" icon={<Heart size={18} color="#C25450" />} previewValue="●●/100" colors={colors} onPress={openProPaywall} />
            )}
            {isProUser ? (
              <FreeMetricCard icon={<Brain size={18} color="#7B68AE" />} value={`-${cellularAgeReduction}y`} label="Cellular Age" sublabel="Biological age reduction" color="#7B68AE" colors={colors} onPress={() => handleInfoPress('cellularAge')} />
            ) : (
              <ProLockedCard title="Cellular Age" subtitle="Biological age reduction" icon={<Brain size={18} color="#7B68AE" />} previewValue="-●●y" colors={colors} onPress={openProPaywall} />
            )}
          </View>
          <View style={styles.metricsGrid}>
            {isProUser ? (
              <FreeMetricCard icon={<Activity size={16} color="#5B8C5A" />} value={formatInsightHours(gutRestHours)} label="Gut Rest" sublabel="Digestive rest hours" color="#5B8C5A" colors={colors} onPress={() => handleInfoPress('gutRest')} />
            ) : (
              <ProLockedCard title="Gut Rest" subtitle="Digestive rest hours" icon={<Activity size={16} color="#5B8C5A" />} previewValue="●●h" colors={colors} onPress={openProPaywall} />
            )}
            {isProUser ? (
              <FreeMetricCard icon={<Sparkles size={16} color="#7B68AE" />} value={formatInsightHours(totalAutophagyHours)} label="Deep Autophagy" sublabel="Cellular renewal time" color="#7B68AE" colors={colors} onPress={() => handleInfoPress('autophagy')} />
            ) : (
              <ProLockedCard title="Deep Autophagy" subtitle="Cellular renewal time" icon={<Sparkles size={16} color="#7B68AE" />} previewValue="●●h" colors={colors} onPress={openProPaywall} />
            )}
          </View>

          {/* Empty state */}
          {completedRecords.length === 0 && (
            <View style={styles.emptyState}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 16 }}>
                <Brain size={28} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Complete your first fast</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Your metabolic insights will appear here after your first completed fast.</Text>
            </View>
          )}

          <View style={{ height: 32 }} />
        </Animated.ScrollView>
      </SafeAreaView>

      {/* Score Breakdown Modal */}
      <ScoreBreakdownModal
        visible={showBreakdown}
        score={metabolicScore}
        onClose={() => setShowBreakdown(false)}
        isProUser={isProUser}
        proAutophagyDepth={autophagyDepth}
        proInflammationIndex={inflammationReduction}
      />

      <MetricKnowledgeModal
        visible={knowledgeModalVisible}
        metric={selectedMetric}
        onClose={() => setKnowledgeModalVisible(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background } as ViewStyle,
    headerSticky: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 12,
      borderBottomWidth: 1,
    } as ViewStyle,
    scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 } as ViewStyle,

    // Header
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 } as ViewStyle,
    screenTitle: { fontSize: fs(28), fontWeight: '700', letterSpacing: -0.5, marginTop: 4 } as TextStyle,

    // Hero
    heroCard: { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 14 } as ViewStyle,
    heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } as ViewStyle,
    heroEyebrow: { fontSize: fs(10), fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' } as TextStyle,
    heroBody: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16 } as ViewStyle,
    heroMeta: { flex: 1, minWidth: 160 } as ViewStyle,
    heroLabel: { fontSize: fs(16), fontWeight: '700', letterSpacing: -0.2, marginBottom: 4 } as TextStyle,
    heroChange: { fontSize: fs(12), fontWeight: '600', marginBottom: 10 } as TextStyle,
    pillWrap: { flexDirection: 'row', flexWrap: 'wrap' } as ViewStyle,
    breakdownLink: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight, alignItems: 'center' } as ViewStyle,
    breakdownLinkText: { fontSize: fs(13), fontWeight: '600' } as TextStyle,

    // Key stats
    keyStatsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch', gap: 8, marginBottom: 16 } as ViewStyle,

    // Section
    sectionCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 } as ViewStyle,
    sectionTitleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 14,
    } as ViewStyle,
    sectionTitle: { fontSize: fs(15), fontWeight: '700', marginBottom: 14 } as TextStyle,
    consistencyStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 } as ViewStyle,
    cStat: { fontSize: fs(12), fontWeight: '500' } as TextStyle,
    sectionHeader: { fontSize: fs(16), fontWeight: '700', marginBottom: 10, marginTop: 4 } as TextStyle,
    metricsGrid: { flexDirection: 'row', alignItems: 'stretch', gap: 10, marginBottom: 10 } as ViewStyle,

    // Pro
    proSection: { marginTop: 10, marginBottom: 12 } as ViewStyle,
    proHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 } as ViewStyle,
    proHeaderText: { fontSize: fs(16), fontWeight: '700' } as TextStyle,
    proSubtext: { fontSize: fs(13), marginBottom: 10 } as TextStyle,
    proBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 6, marginBottom: 16 } as ViewStyle,
    proBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 } as ViewStyle,
    proBannerTitle: { fontSize: fs(15), fontWeight: '700' } as TextStyle,
    proBannerSub: { fontSize: fs(12), marginTop: 1 } as TextStyle,

    // Empty
    emptyState: { alignItems: 'center', paddingVertical: 40 } as ViewStyle,
    emptyTitle: { fontSize: fs(18), fontWeight: '600', marginBottom: 8 } as TextStyle,
    emptyText: { fontSize: fs(14), textAlign: 'center', lineHeight: 20, paddingHorizontal: 32 } as TextStyle,
  });
}
