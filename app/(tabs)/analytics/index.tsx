import { fs } from '@/constants/theme';
import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TrendingUp,
  Clock,
  Target,
  Award,
  BarChart3,
  Flame,
  Zap,
  Sparkles,
  Trophy,
  Star,
  Crown,
  Shield,
  Sunrise,
  Moon,
  Droplets,
  Battery,
  CircleDot,
  Info,
  Leaf,
  Dumbbell,
  Flower2,
  Scale,
  Footprints,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useFasting } from '@/contexts/FastingContext';
import { METRIC_KNOWLEDGE, MetricKnowledge } from '@/mocks/metric-knowledge';
import MetricKnowledgeModal from '@/components/MetricKnowledgeModal';
import { MilestoneRow } from '@/components/AnalyticsComponents';
import { TrendChartCard } from '@/components/TrendChartCard';
import { useTrendData, TimeRange } from '@/hooks/useTrendData';
import { usePedometer as __usePedometer } from '@/hooks/usePedometer';
import { useReducedMotion } from '@/hooks/useReducedMotion';

import {
  WARRIOR_LEVELS,
  AUTOPHAGY_THRESHOLD_HOURS,
  formatHours,
  formatInsightHours,
  fastDurationHours,
  MilestoneData,
} from '@/utils/analytics-helpers';
import { getTargetFastsPerWeek } from '@/utils/metabolic-score';
import AayuInsightCard from '@/components/AayuInsightCard';
import { StatValueText } from '@/components/ui/StatValueText';
import type { ColorScheme } from '@/constants/colors';

type TabKey = 'overview' | 'spirit';

const WARRIOR_ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Leaf, Zap, Flame, Dumbbell, Sparkles, Crown,
};

function DedicatedSeekerCard({
  completedCount,
  colors,
  targetFastsPerWeek,
}: {
  completedCount: number;
  colors: ColorScheme;
  targetFastsPerWeek: number;
}) {
  const BADGE_COLOR = '#D4A03C';
  const isUnlocked = completedCount >= 10;
  const progress = Math.min(completedCount, 10);
  const remaining = Math.max(0, 10 - progress);
  const estWeeks = remaining === 0 ? 0 : Math.ceil(remaining / Math.max(1, targetFastsPerWeek));
  const reduceMotion = useReducedMotion();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress / 10,
      duration: 1100,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    if (!isUnlocked) {
      glowAnim.setValue(1);
      return;
    }
    if (reduceMotion) {
      glowAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.5, duration: 2000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [progress, isUnlocked, progressAnim, glowAnim, reduceMotion]);

  const barWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={[dStyles.card, {
      backgroundColor: isUnlocked ? BADGE_COLOR + '0C' : colors.card,
      borderColor: isUnlocked ? BADGE_COLOR + '50' : colors.borderLight,
    }]}>
      <View style={dStyles.header}>
        <Animated.View style={[dStyles.iconCircle, {
          backgroundColor: BADGE_COLOR + '20',
          opacity: isUnlocked ? glowAnim : 1,
        }]}>
          <Star size={20} color={BADGE_COLOR} fill={isUnlocked ? BADGE_COLOR : 'none'} />
        </Animated.View>
        <View style={dStyles.titleBlock}>
          <View style={dStyles.titleRow}>
            <Text style={[dStyles.title, { color: colors.text }]}>Dedicated Faster</Text>
            {isUnlocked && (
              <View style={[dStyles.pill, { backgroundColor: BADGE_COLOR + '20' }]}>
                <Text style={[dStyles.pillText, { color: BADGE_COLOR }]}>Unlocked ✦</Text>
              </View>
            )}
          </View>
          <Text style={[dStyles.sub, { color: colors.textMuted }]}>
            {isUnlocked
              ? 'A true commitment to fasting. Your discipline shines.'
              : `Complete ${remaining} more fast${remaining === 1 ? '' : 's'} to unlock this badge`}
          </Text>
          {!isUnlocked && remaining > 0 && (
            <Text style={[dStyles.paceHint, { color: colors.textSecondary }]}>
              {estWeeks <= 1
                ? 'One strong week can get you much closer.'
                : `About ${estWeeks} weeks at your plan pace (${targetFastsPerWeek} fasts/wk).`}
            </Text>
          )}
        </View>
        <View style={dStyles.counter}>
          <Text style={[dStyles.countNum, { color: isUnlocked ? BADGE_COLOR : colors.text }]}>{progress}</Text>
          <Text style={[dStyles.countDen, { color: colors.textMuted }]}>/10</Text>
        </View>
      </View>
      <View style={[dStyles.track, { backgroundColor: colors.surface }]}>
        <Animated.View style={[dStyles.fill, { width: barWidth, backgroundColor: BADGE_COLOR }]} />
      </View>
    </View>
  );
}

const dStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  titleBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  title: {
    fontSize: fs(16),
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pillText: {
    fontSize: fs(10),
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  sub: {
    fontSize: fs(13),
    marginTop: 2,
    lineHeight: 18,
  },
  paceHint: {
    fontSize: fs(12),
    marginTop: 6,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
  counter: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
  },
  countNum: {
    fontSize: fs(26),
    fontWeight: '800' as const,
    letterSpacing: -1,
  },
  countDen: {
    fontSize: fs(14),
    fontWeight: '500' as const,
    marginLeft: 1,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  fill: {
    height: '100%' as any,
    borderRadius: 3,
  },
});

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const { profile } = useUserProfile();
  const showVedic = profile?.fastingPath === 'vedic' || profile?.fastingPath === 'both';
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { completedRecords, streak, totalHours, thisWeekRecords } = useFasting();

  // Live pedometer for today's steps in trend chart
  const pedometer = __usePedometer();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [selectedMetric, setSelectedMetric] = useState<MetricKnowledge | null>(null);
  const [knowledgeModalVisible, setKnowledgeModalVisible] = useState(false);

  // Trend chart ranges
  const [fastingRange, setFastingRange] = useState<TimeRange>('week');
  const [weightRange, setWeightRange]   = useState<TimeRange>('week');
  const [waterRange, setWaterRange]     = useState<TimeRange>('week');
  const [stepsRange, setStepsRange]     = useState<TimeRange>('week');
  const fastingTrend = useTrendData(fastingRange);
  const weightTrend  = useTrendData(weightRange);
  const waterTrend   = useTrendData(waterRange);
  const stepsTrend   = useTrendData(stepsRange, pedometer.steps);

  useEffect(() => {
    if (!showVedic && activeTab === 'spirit') {
      setActiveTab('overview');
    }
  }, [showVedic, activeTab]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const completionRate = useMemo(() => {
    if (completedRecords.length === 0) return 0;
    const completed = completedRecords.filter(r => r.completed).length;
    return Math.round((completed / completedRecords.length) * 100);
  }, [completedRecords]);

  const avgFastDuration = useMemo(() => {
    if (completedRecords.length === 0) return 0;
    const total = completedRecords.reduce((sum, r) => {
      return sum + fastDurationHours(r);
    }, 0);
    return total / completedRecords.length;
  }, [completedRecords]);

  const longestFast = useMemo(() => {
    if (completedRecords.length === 0) return 0;
    return Math.max(
      ...completedRecords.map(r => fastDurationHours(r))
    );
  }, [completedRecords]);

  const sattvicScore = useMemo(() => {
    let score = 0;
    const completedCount = completedRecords.filter(r => r.completed).length;
    score += Math.min(completedCount * 2, 30);
    const vedicFasts = completedRecords.filter(r =>
      ['ekadashi', 'pradosh', 'purnima', 'amavasya', 'monday', 'thursday', 'saturday', 'nirjala', 'navratri'].includes(r.type)
    ).length;
    score += Math.min(vedicFasts * 5, 35);
    score += Math.min(streak * 3, 20);
    score += completionRate > 70 ? 15 : completionRate > 50 ? 10 : completionRate > 30 ? 5 : 0;
    return Math.min(score, 100);
  }, [completedRecords, streak, completionRate]);

  const completedFastCount = useMemo(
    () => completedRecords.filter(r => r.completed).length,
    [completedRecords],
  );

  const warriorLevel = useMemo(() => {
    let level = WARRIOR_LEVELS[0];
    for (const l of WARRIOR_LEVELS) {
      if (completedFastCount >= l.minFasts) level = l;
    }
    return level;
  }, [completedFastCount]);

  const warriorNextLevel = useMemo(() => {
    return WARRIOR_LEVELS.find(l => l.minFasts > completedFastCount) ?? null;
  }, [completedFastCount]);

  const waterWeekTotalMl = useMemo(
    () => waterTrend.waterData.reduce((s, d) => s + d.value, 0),
    [waterTrend.waterData],
  );

  const milestones: MilestoneData[] = useMemo(() => {
    const completedCount = completedRecords.filter(r => r.completed).length;
    const has24h = longestFast >= 24;
    const has36h = longestFast >= 36;

    return [
      {
        id: 'first_fast',
        title: 'First Flame',
        description: 'Complete your first fast',
        icon: <Sunrise size={18} color={completedCount >= 1 ? '#E8913A' : colors.textMuted} />,
        unlocked: completedCount >= 1,
        progress: Math.min(completedCount, 1),
        target: 1,
        color: '#E8913A',
      },
      {
        id: '10_fasts',
        title: 'Dedicated Faster',
        description: 'Complete 10 fasts',
        icon: <Star size={18} color={completedCount >= 10 ? '#D4A03C' : colors.textMuted} />,
        unlocked: completedCount >= 10,
        progress: Math.min(completedCount, 10),
        target: 10,
        color: '#D4A03C',
      },
      {
        id: '50_fasts',
        title: 'Endurance Master',
        description: 'Complete 50 fasts',
        icon: <Crown size={18} color={completedCount >= 50 ? '#C97B2A' : colors.textMuted} />,
        unlocked: completedCount >= 50,
        progress: Math.min(completedCount, 50),
        target: 50,
        color: '#C97B2A',
      },
      {
        id: '100_hours',
        title: 'Century Club',
        description: 'Fast for a total of 100 hours',
        icon: <Clock size={18} color={totalHours >= 100 ? '#5B8C5A' : colors.textMuted} />,
        unlocked: totalHours >= 100,
        progress: Math.min(Math.round(totalHours), 100),
        target: 100,
        color: '#5B8C5A',
      },
      {
        id: '24h_fast',
        title: 'Iron Will',
        description: 'Complete a 24-hour fast',
        icon: <Shield size={18} color={has24h ? '#B85C38' : colors.textMuted} />,
        unlocked: has24h,
        progress: has24h ? 1 : 0,
        target: 1,
        color: '#B85C38',
      },
      {
        id: '36h_fast',
        title: 'Transcendence',
        description: 'Complete a 36-hour fast',
        icon: <Moon size={18} color={has36h ? '#7B68AE' : colors.textMuted} />,
        unlocked: has36h,
        progress: has36h ? 1 : 0,
        target: 1,
        color: '#7B68AE',
      },
      {
        id: '7_streak',
        title: 'Week of Discipline',
        description: 'Achieve a 7-fast streak',
        icon: <Trophy size={18} color={streak >= 7 ? '#D4A03C' : colors.textMuted} />,
        unlocked: streak >= 7,
        progress: Math.min(streak, 7),
        target: 7,
        color: '#D4A03C',
      },
    ];
  }, [completedRecords, longestFast, totalHours, streak, colors.textMuted]);

  const unlockedCount = milestones.filter(m => m.unlocked).length;

  const thisWeekHours = useMemo(() => {
    return thisWeekRecords.reduce((sum, r) => {
      return sum + fastDurationHours(r);
    }, 0);
  }, [thisWeekRecords]);

  const lastWeekHours = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const daysFromMonday = day === 0 ? 6 : day - 1;
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setHours(0, 0, 0, 0);
    startOfThisWeek.setDate(now.getDate() - daysFromMonday);
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
    const lastWeekRecs = completedRecords.filter(
      (r) =>
        r.startTime >= startOfLastWeek.getTime() &&
        r.startTime < startOfThisWeek.getTime()
    );
    return lastWeekRecs.reduce((sum, r) => {
      return sum + fastDurationHours(r);
    }, 0);
  }, [completedRecords]);

  const vsLastWeekPct = useMemo(() => {
    if (lastWeekHours === 0) return 0;
    return Math.round(((thisWeekHours - lastWeekHours) / lastWeekHours) * 100);
  }, [thisWeekHours, lastWeekHours]);

  const thisWeekAvgDuration = useMemo(() => {
    if (thisWeekRecords.length === 0) return 0;
    return thisWeekHours / thisWeekRecords.length;
  }, [thisWeekHours, thisWeekRecords]);

  const thisWeekPersonalBest = useMemo(() => {
    if (thisWeekRecords.length === 0) return 0;
    return Math.max(
      ...thisWeekRecords.map((r) => fastDurationHours(r))
    );
  }, [thisWeekRecords]);

  const thisWeekAutophagyCount = useMemo(() => {
    return thisWeekRecords.filter(r => {
      const hours = fastDurationHours(r);
      return hours > AUTOPHAGY_THRESHOLD_HOURS;
    }).length;
  }, [thisWeekRecords]);

  const targetFastsPerWeek = useMemo(() => {
    const p = profile?.plan;
    if (!p) return getTargetFastsPerWeek(null);
    if (p.planTemplateId === 'if_5_2' || p.planTemplateId === 'if_4_3') {
      const n = p.weeklyFastDays?.length;
      if (n && n > 0) return n;
    }
    return getTargetFastsPerWeek(p.fastLabel);
  }, [profile?.plan]);

  const weekCompletedCount = useMemo(
    () => thisWeekRecords.filter(r => r.completed).length,
    [thisWeekRecords],
  );

  const goalAdherencePct = useMemo(() => {
    const t = targetFastsPerWeek;
    if (t <= 0) return 0;
    return Math.min(100, Math.round((weekCompletedCount / t) * 100));
  }, [weekCompletedCount, targetFastsPerWeek]);

  const weekSummaryLine = useMemo(() => {
    if (thisWeekHours < 0.05 && thisWeekRecords.length === 0) {
      return 'No fasts logged this calendar week yet — start when you are ready.';
    }
    const parts = [`${formatHours(thisWeekHours)} fasting logged this week`];
    if (thisWeekPersonalBest >= 1) {
      parts.push(`longest single fast ${formatHours(thisWeekPersonalBest)}`);
    }
    return `${parts[0]}${parts.length > 1 ? ` · ${parts[1]}` : ''}.`;
  }, [thisWeekHours, thisWeekRecords.length, thisWeekPersonalBest]);

  const waterWeekLoggedDays = useMemo(() => {
    if (waterRange !== 'week') return 99;
    return waterTrend.waterData.filter(d => d.value > 0).length;
  }, [waterTrend.waterData, waterRange]);

  const fastingChartHint = useMemo(() => {
    if (fastingRange === 'week') return 'Hours logged per day · This week';
    if (fastingRange === 'month') return 'Hours logged per day · Last 30 days';
    return 'Total hours · By month';
  }, [fastingRange]);

  const fastingInterpretation = useMemo(() => {
    const pts = fastingTrend.fastingData.filter(d => d.value > 0);
    if (pts.length === 0) return 'No hours in this range yet — complete a fast to see bars fill in.';
    const best = fastingTrend.fastingData.reduce((m, d) => (d.value > m.v ? { v: d.value, l: d.label } : m), { v: 0, l: '' });
    return `${pts.length} active day${pts.length === 1 ? '' : 's'} · strongest day ${best.l} (${formatHours(best.v)}).`;
  }, [fastingTrend.fastingData]);

  const weightInterpretation = useMemo(() => {
    const data = weightTrend.weightData;
    const positive = data.filter(d => d.value > 0);
    if (positive.length < 2) return 'Log weight a few times to see trend and coaching notes here.';
    const latest = data[data.length - 1]?.value ?? 0;
    const first =
      weightTrend.startingWeightKg && weightTrend.startingWeightKg > 0
        ? weightTrend.startingWeightKg
        : positive[0].value;
    const change = latest - first;
    if (Math.abs(change) < 0.08) return 'Weight is steady in this window — consistency beats speed.';
    if (change < 0) return 'Slight downward move — small steps add up when you stay consistent.';
    return 'Trending up in this window — zoom out to monthly view for context.';
  }, [weightTrend.weightData, weightTrend.startingWeightKg]);

  const stepsReferenceCaption = useMemo(() => {
    const t = stepsTrend.stepsTarget;
    if (!t || t <= 0) return undefined;
    return `Goal: ${t >= 1000 ? `${(t / 1000).toFixed(1)}k` : t} steps`;
  }, [stepsTrend.stepsTarget]);

  const stepsInterpretation = useMemo(() => {
    const data = stepsTrend.stepsData;
    const t = stepsTrend.stepsTarget;
    let hits = 0;
    data.forEach(d => {
      if (t && t > 0 && d.value >= t) hits++;
    });
    const best = data.reduce((m, d) => (d.value > m.v ? { v: d.value, l: d.label } : m), { v: 0, l: '' });
    const active = data.filter(d => d.value > 0).length;
    if (active === 0) return 'No step data in this range — move when you can; it supports recovery.';
    const g = t && t > 0 ? ` Hit goal on ${hits} day${hits === 1 ? '' : 's'}.` : '';
    const b = best.v > 0 ? ` Best day: ${best.l}.` : '';
    return `${active} day${active === 1 ? '' : 's'} with activity.${g}${b}`;
  }, [stepsTrend.stepsData, stepsTrend.stepsTarget]);

  const handleTabPress = useCallback((tab: TabKey) => {
    setActiveTab(tab);
  }, []);

  const handleInfoPress = useCallback((id: string) => {
    const metric = METRIC_KNOWLEDGE[id];
    if (metric) {
      setSelectedMetric(metric);
      setKnowledgeModalVisible(true);
    }
  }, []);

  const handleCloseKnowledge = useCallback(() => {
    setKnowledgeModalVisible(false);
  }, []);

  const renderOverviewTab = () => (
    <>
      {/* 1. Key numbers — immediate at-a-glance context */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: colors.warningLight }]}>
            <TrendingUp size={18} color={colors.warning} />
          </View>
          <StatValueText color={colors.text} size="xl">
            {String(streak)}
          </StatValueText>
          <Text style={styles.statLabel}>Current streak</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: colors.accentLight }]}>
            <Award size={18} color={colors.accent} />
          </View>
          <StatValueText color={colors.text} size="xl">
            {formatInsightHours(longestFast)}
          </StatValueText>
          <Text style={styles.statLabel}>Longest fast</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: colors.primaryLight }]}>
            <Clock size={18} color={colors.primary} />
          </View>
          <StatValueText color={colors.text} size="xl">
            {formatInsightHours(thisWeekHours)}
          </StatValueText>
          <Text style={styles.statLabel}>This week</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: colors.successLight }]}>
            <Target size={18} color={colors.success} />
          </View>
          <StatValueText color={colors.text} size="xl">
            {`${goalAdherencePct}%`}
          </StatValueText>
          <Text style={styles.statLabel}>Goal adherence</Text>
          <Text style={[styles.statHint, { color: colors.textMuted }]}>
            {weekCompletedCount} of {targetFastsPerWeek} planned fasts
          </Text>
        </View>
      </View>

      {/* 2. Identity anchor — who you are as a faster */}
      <View style={styles.warriorCard}>
        <View style={styles.warriorLeft}>
          <View style={styles.warriorIconCircle}>
            {(() => {
              const Icon = WARRIOR_ICON_MAP[warriorLevel.icon];
              return Icon ? <Icon size={22} color={warriorLevel.color} /> : null;
            })()}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.warriorLevelLabel}>FASTING LEVEL</Text>
            <Text style={[styles.warriorLevelName, { color: warriorLevel.color }]}>{warriorLevel.name}</Text>
            {warriorNextLevel ? (
              <Text style={[styles.warriorNext, { color: colors.textSecondary }]}>
                {warriorNextLevel.minFasts - completedFastCount} more to reach {warriorNextLevel.name}
              </Text>
            ) : (
              <Text style={[styles.warriorNext, { color: colors.textSecondary }]}>Top level — keep the rhythm.</Text>
            )}
          </View>
        </View>
        <View style={styles.warriorRight}>
          <Text style={styles.warriorFastCount}>{completedFastCount}</Text>
          <Text style={styles.warriorFastLabel}>
            {completedFastCount === 1 ? 'completed fast' : 'completed fasts'}
          </Text>
        </View>
      </View>

      {/* 3. Coach insight — synthesis after user has their numbers + level in mind */}
      <View style={styles.section}>
        <AayuInsightCard
          weekFasts={thisWeekRecords.length}
          weekAvgHours={thisWeekAvgDuration}
          weekLongestHours={thisWeekPersonalBest}
          weekTotalHours={thisWeekHours}
          streak={streak}
          weekAutophagyCount={thisWeekAutophagyCount}
        />
      </View>

      {/* 4. Next milestone — flows naturally from identity card above */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Star size={16} color="#D4A03C" />
          <Text style={styles.sectionTitleInline}>Next achievement</Text>
        </View>
        <DedicatedSeekerCard
          completedCount={completedFastCount}
          colors={colors}
          targetFastsPerWeek={targetFastsPerWeek}
        />
      </View>

      {/* 5. Deep trends — explore the data behind the numbers */}
      <View style={styles.section}>
        <View style={[styles.sectionHeaderRow, { marginBottom: 12 }]}>
          <BarChart3 size={16} color={colors.primary} />
          <Text style={styles.sectionTitleInline}>Patterns & Trends</Text>
        </View>
        <TrendChartCard
          title="Fasting"
          icon={<Clock size={17} color={colors.primary} />}
          color={colors.primary}
          data={fastingTrend.fastingData}
          unit="h"
          chartType="bar"
          range={fastingRange}
          onRangeChange={setFastingRange}
          detailHint={fastingChartHint}
          interpretation={fastingInterpretation}
          barMetricKind="fasting"
          formatValue={(v) => v >= 1 ? `${Math.round(v * 10) / 10}h` : `${Math.round(v * 60)}m`}
          formatYLabel={(v) => `${Math.round(v)}h`}
        />
        <TrendChartCard
          title="Weight"
          icon={<Scale size={17} color={colors.warning} />}
          color={colors.warning}
          data={weightTrend.weightData}
          unit="kg"
          chartType="line"
          range={weightRange}
          onRangeChange={setWeightRange}
          goalValue={weightTrend.goalWeightKg ?? undefined}
          startingValue={weightTrend.startingWeightKg ?? undefined}
          detailHint="Trend line · Dashed line is goal weight"
          interpretation={weightInterpretation}
          formatValue={(v) => `${v.toFixed(1)}kg`}
          formatYLabel={(v) => `${Math.round(v * 10) / 10}`}
        />
        {waterRange === 'week' && waterWeekLoggedDays < 3 ? (
          <View style={[styles.compactWaterCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <View style={styles.compactWaterTop}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: `${colors.hydration}15`, alignItems: 'center' as const, justifyContent: 'center' as const }}>
                <Droplets size={18} color={colors.hydration} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.compactWaterTitle, { color: colors.text }]}>Hydration</Text>
                <Text style={[styles.compactWaterSub, { color: colors.textSecondary }]}>
                  {waterWeekTotalMl >= 1000
                    ? `${(waterWeekTotalMl / 1000).toFixed(1)} L logged this week`
                    : `${Math.round(waterWeekTotalMl)} ml logged this week`}
                  {waterTrend.waterTarget && waterTrend.waterTarget > 0
                    ? ` · ~${(waterTrend.waterTarget / 1000).toFixed(1)} L/day target`
                    : ''}
                </Text>
              </View>
            </View>
            <Text style={[styles.compactWaterHint, { color: colors.textMuted }]}>
              Log a few more days to unlock the full week chart.
            </Text>
            <TouchableOpacity
              style={[styles.compactWaterCta, { backgroundColor: `${colors.hydration}22`, borderColor: colors.hydration }]}
              onPress={() => router.push('/(tabs)/(home)/water' as any)}
              activeOpacity={0.75}
            >
              <Text style={[styles.compactWaterCtaText, { color: colors.hydration }]}>Log water on Today</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TrendChartCard
            title="Water"
            icon={<Droplets size={17} color={colors.hydration} />}
            color={colors.hydration}
            data={waterTrend.waterData}
            unit="ml"
            chartType="bar"
            range={waterRange}
            onRangeChange={setWaterRange}
            targetValue={waterTrend.waterTarget}
            detailHint="Fluid logged per day"
            referenceLineCaption={
              waterTrend.waterTarget && waterTrend.waterTarget > 0
                ? `Goal: ${(waterTrend.waterTarget / 1000).toFixed(1)}L / day`
                : undefined
            }
            barMetricKind="water"
            formatValue={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}L` : `${Math.round(v)}ml`}
            formatYLabel={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}L` : `${Math.round(v)}ml`}
          />
        )}
        <TrendChartCard
          title="Steps"
          icon={<Footprints size={17} color={colors.success} />}
          color={colors.success}
          data={stepsTrend.stepsData}
          unit="steps"
          chartType="bar"
          range={stepsRange}
          onRangeChange={setStepsRange}
          targetValue={stepsTrend.stepsTarget}
          detailHint="Steps per day in this range"
          referenceLineCaption={stepsReferenceCaption}
          interpretation={stepsInterpretation}
          barMetricKind="steps"
          formatValue={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`}
          formatYLabel={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : `${Math.round(v)}`}
        />
      </View>
    </>
  );

  const renderSpiritTab = () => (
    <>
      <View style={styles.section}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => handleInfoPress('sattvicScore')}>
          <View style={styles.sectionHeaderRow}>
            <CircleDot size={16} color="#7B68AE" />
            <Text style={styles.sectionTitleInline}>Sattvic Score</Text>
            <View style={styles.learnMorePill}>
              <Info size={11} color="#7B68AE" />
              <Text style={[styles.learnMoreText, { color: '#7B68AE' }]}>Learn</Text>
            </View>
          </View>
        </TouchableOpacity>
        <Text style={styles.sectionSubtext}>Your spiritual fasting alignment</Text>

        <View style={styles.sattvicCard}>
          <View style={styles.sattvicTop}>
            <View style={styles.sattvicScoreWrap}>
              <Text style={styles.sattvicScoreValue}>{sattvicScore}</Text>
              <Text style={styles.sattvicScoreMax}>/100</Text>
            </View>
            <View style={styles.sattvicMeta}>
              <Text style={styles.sattvicLevel}>
                {sattvicScore >= 80 ? 'Highly Sattvic' :
                  sattvicScore >= 60 ? 'Rajasic-Sattvic' :
                    sattvicScore >= 30 ? 'Developing' : 'Just Starting'}
              </Text>
              <Text style={styles.sattvicDesc}>
                {sattvicScore >= 80 ? 'Your fasting practice reflects deep spiritual discipline' :
                  sattvicScore >= 60 ? 'Strong balance of discipline and devotion' :
                    sattvicScore >= 30 ? 'Building momentum in your sadhana' : 'Every journey begins with a single step'}
              </Text>
            </View>
          </View>
          <View style={styles.sattvicBar}>
            <View style={[styles.sattvicBarFill, { width: `${sattvicScore}%` as any }]} />
          </View>
          <View style={styles.sattvicBreakdown}>
            <View style={styles.sattvicBreakdownItem}>
              <Text style={styles.sattvicBreakdownLabel}>Vedic Fasts</Text>
              <Text style={styles.sattvicBreakdownValue}>
                {completedRecords.filter(r =>
                  ['ekadashi', 'pradosh', 'purnima', 'amavasya', 'monday', 'thursday', 'saturday', 'nirjala', 'navratri'].includes(r.type)
                ).length}
              </Text>
            </View>
            <View style={styles.sattvicDivider} />
            <View style={styles.sattvicBreakdownItem}>
              <Text style={styles.sattvicBreakdownLabel}>Consistency</Text>
              <Text style={styles.sattvicBreakdownValue}>{completionRate}%</Text>
            </View>
            <View style={styles.sattvicDivider} />
            <View style={styles.sattvicBreakdownItem}>
              <Text style={styles.sattvicBreakdownLabel}>Streak</Text>
              <Text style={styles.sattvicBreakdownValue}>{streak}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => handleInfoPress('pranaEnergy')}>
          <View style={styles.sectionHeaderRow}>
            <Battery size={16} color="#5B8C5A" />
            <Text style={styles.sectionTitleInline}>Prana Energy</Text>
            <View style={styles.learnMorePill}>
              <Info size={11} color="#5B8C5A" />
              <Text style={[styles.learnMoreText, { color: '#5B8C5A' }]}>Learn</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.pranaCard}>
          <View style={styles.pranaRow}>
            <View style={styles.pranaItem}>
              <View style={[styles.pranaIconCircle, { backgroundColor: '#5B8C5A15' }]}>
                <Flower2 size={20} color="#5B8C5A" />
              </View>
              <Text style={styles.pranaValue}>{Math.min(Math.round(avgFastDuration / 24 * 100), 100)}%</Text>
              <Text style={styles.pranaLabel}>Mental Clarity</Text>
            </View>
            <View style={styles.pranaItem}>
              <View style={[styles.pranaIconCircle, { backgroundColor: '#E8913A15' }]}>
                <Zap size={20} color="#E8913A" />
              </View>
              <Text style={styles.pranaValue}>{Math.min(Math.round(streak * 10 + completionRate * 0.3), 100)}%</Text>
              <Text style={styles.pranaLabel}>Vitality</Text>
            </View>
            <View style={styles.pranaItem}>
              <View style={[styles.pranaIconCircle, { backgroundColor: '#7B68AE15' }]}>
                <Sparkles size={20} color="#7B68AE" />
              </View>
              <Text style={styles.pranaValue}>{Math.min(Math.round(sattvicScore * 0.9 + streak * 2), 100)}%</Text>
              <Text style={styles.pranaLabel}>Spiritual</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Trophy size={16} color={colors.primary} />
          <Text style={styles.sectionTitleInline}>Milestones</Text>
          <View style={styles.milestoneBadgeCount}>
            <Text style={styles.milestoneBadgeText}>{unlockedCount}/{milestones.length}</Text>
          </View>
        </View>
        <View style={styles.milestoneCard}>
          {milestones.map((m, i) => (
            <MilestoneRow key={m.id} milestone={m} index={i} />
          ))}
        </View>
      </View>
    </>
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Sticky header (outside scroll, matches Today tab) */}
        <View style={[styles.headerSticky, { backgroundColor: colors.background, borderBottomColor: colors.borderLight }]}>
          <Text style={styles.screenTitle}>Journey</Text>
          <Text style={styles.screenSubtitle}>Your progress, patterns, and milestones</Text>

          {showVedic && (
            <View style={styles.tabBar}>
              {([
                { key: 'overview' as TabKey, label: 'Overview', icon: <BarChart3 size={14} color={activeTab === 'overview' ? colors.primary : colors.textMuted} /> },
                { key: 'spirit' as TabKey, label: 'Spirit', icon: <Star size={14} color={activeTab === 'spirit' ? colors.primary : colors.textMuted} /> },
              ]).map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
                  onPress={() => handleTabPress(tab.key)}
                  activeOpacity={0.7}
                >
                  {tab.icon}
                  <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Animated.ScrollView
          style={[styles.scroll, { opacity: fadeAnim }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'overview' && renderOverviewTab()}
          {showVedic && activeTab === 'spirit' && renderSpiritTab()}

          {completedRecords.length === 0 && activeTab !== 'spirit' && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Flower2 size={28} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No fasts recorded yet</Text>
              <Text style={styles.emptyText}>
                Begin your first fast — every great journey starts with a single step.
              </Text>
            </View>
          )}

          <View style={{ height: 32 }} />
        </Animated.ScrollView>
      </SafeAreaView>

      <MetricKnowledgeModal
        visible={knowledgeModalVisible}
        metric={selectedMetric}
        onClose={handleCloseKnowledge}
      />
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
    },
    headerSticky: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 12,
      borderBottomWidth: 1,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 100,
    },
    screenTitle: {
      fontSize: fs(28),
      fontWeight: '700' as const,
      color: colors.text,
      marginTop: 4,
      letterSpacing: -0.5,
    },
    screenSubtitle: {
      fontSize: fs(15),
      color: colors.textSecondary,
      marginBottom: 0,
      marginTop: 2,
      lineHeight: 21,
    },
    tabBar: {
      flexDirection: 'row' as const,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 3,
      marginTop: 12,
      marginBottom: 0,
    },
    tabItem: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: 10,
      borderRadius: 10,
      gap: 5,
    },
    tabItemActive: {
      backgroundColor: colors.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    tabLabel: {
      fontSize: fs(13),
      fontWeight: '500' as const,
      color: colors.textMuted,
    },
    tabLabelActive: {
      color: colors.text,
      fontWeight: '600' as const,
    },
    statsGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      alignItems: 'stretch' as const,
      gap: 10,
      marginBottom: 14,
    },
    statCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      flexGrow: 1,
      flexBasis: '45%' as any,
      alignSelf: 'stretch' as const,
    },
    statIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: 10,
    },
    statLabel: {
      fontSize: fs(15),
      fontWeight: '600' as const,
      color: colors.textMuted,
      marginTop: 4,
    },
    statHint: {
      fontSize: fs(12),
      fontWeight: '500' as const,
      marginTop: 6,
      lineHeight: 16,
    },
    summaryStrip: {
      borderRadius: 16,
      borderWidth: 1,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 14,
    },
    summaryStripEyebrow: {
      fontSize: fs(10),
      fontWeight: '700' as const,
      letterSpacing: 1,
      marginBottom: 6,
    },
    summaryStripBody: {
      fontSize: fs(15),
      lineHeight: 22,
      fontWeight: '500' as const,
    },
    compactWaterCard: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 16,
      marginBottom: 12,
    },
    compactWaterTop: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: 12,
    },
    compactWaterTitle: {
      fontSize: fs(17),
      fontWeight: '700' as const,
    },
    compactWaterSub: {
      fontSize: fs(14),
      marginTop: 4,
      lineHeight: 20,
    },
    compactWaterHint: {
      fontSize: fs(13),
      marginTop: 10,
      lineHeight: 18,
    },
    compactWaterCta: {
      marginTop: 12,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center' as const,
    },
    compactWaterCtaText: {
      fontSize: fs(15),
      fontWeight: '700' as const,
    },
    warriorCard: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      justifyContent: 'space-between' as const,
      backgroundColor: colors.surfaceWarm,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.primaryLight,
      marginBottom: 24,
    },
    warriorLeft: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: 12,
      flex: 1,
      minWidth: 0,
    },
    warriorIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primaryLight,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    warriorLevelLabel: {
      fontSize: fs(10),
      fontWeight: '700' as const,
      color: colors.textMuted,
      letterSpacing: 1.2,
      marginBottom: 2,
    },
    warriorLevelName: {
      fontSize: fs(20),
      fontWeight: '800' as const,
      letterSpacing: -0.5,
    },
    warriorNext: {
      fontSize: fs(13),
      fontWeight: '500' as const,
      marginTop: 6,
      lineHeight: 18,
    },
    warriorRight: {
      alignItems: 'center' as const,
    },
    warriorFastCount: {
      fontSize: fs(24),
      fontWeight: '700' as const,
      color: colors.text,
    },
    warriorFastLabel: {
      fontSize: fs(12),
      color: colors.textMuted,
    },
    section: {
      marginBottom: 24,
    },
    sectionHeaderRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      marginBottom: 4,
    },
    sectionTitleInline: {
      fontSize: fs(17),
      fontWeight: '600' as const,
      color: colors.text,
      flex: 1,
    },
    sectionSubtext: {
      fontSize: fs(13),
      color: colors.textMuted,
      marginBottom: 14,
      marginTop: 2,
    },
    sattvicCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    sattvicTop: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 16,
      marginBottom: 14,
    },
    sattvicScoreWrap: {
      flexDirection: 'row' as const,
      alignItems: 'baseline' as const,
    },
    sattvicScoreValue: {
      fontSize: fs(42),
      fontWeight: '800' as const,
      color: '#7B68AE',
      letterSpacing: -2,
    },
    sattvicScoreMax: {
      fontSize: fs(16),
      fontWeight: '500' as const,
      color: colors.textMuted,
    },
    sattvicMeta: {
      flex: 1,
    },
    sattvicLevel: {
      fontSize: fs(15),
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 2,
    },
    sattvicDesc: {
      fontSize: fs(12),
      color: colors.textMuted,
      lineHeight: 16,
    },
    sattvicBar: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.surface,
      overflow: 'hidden' as const,
      marginBottom: 14,
    },
    sattvicBarFill: {
      height: '100%' as any,
      borderRadius: 3,
      backgroundColor: '#7B68AE',
    },
    sattvicBreakdown: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    sattvicBreakdownItem: {
      flex: 1,
      alignItems: 'center' as const,
    },
    sattvicBreakdownLabel: {
      fontSize: fs(12),
      color: colors.textMuted,
      marginBottom: 2,
    },
    sattvicBreakdownValue: {
      fontSize: fs(18),
      fontWeight: '700' as const,
      color: colors.text,
    },
    sattvicDivider: {
      width: 1,
      height: 32,
      backgroundColor: colors.borderLight,
    },
    pranaCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    pranaRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    pranaItem: {
      flex: 1,
      alignItems: 'center' as const,
    },
    pranaIconCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: 6,
    },
    pranaValue: {
      fontSize: fs(20),
      fontWeight: '700' as const,
      color: colors.text,
    },
    pranaLabel: {
      fontSize: fs(12),
      color: colors.textMuted,
      marginTop: 2,
    },
    milestoneCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      marginTop: 8,
    },
    milestoneBadgeCount: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    milestoneBadgeText: {
      fontSize: fs(12),
      fontWeight: '600' as const,
      color: colors.primary,
    },
    emptyState: {
      alignItems: 'center' as const,
      paddingVertical: 48,
    },
    emptyIconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.surface,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: fs(18),
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: fs(14),
      color: colors.textSecondary,
      textAlign: 'center' as const,
      lineHeight: 20,
      paddingHorizontal: 32,
    },
    learnMorePill: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: colors.surface,
    },
    learnMoreText: {
      fontSize: fs(11),
      fontWeight: '600' as const,
    },
  });
}
