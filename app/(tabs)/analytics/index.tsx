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
  Heart,
  Sparkles,
  Trophy,
  Star,
  Crown,
  Shield,
  Sunrise,
  Moon,
  Activity,
  Brain,
  Droplets,
  Battery,
  CircleDot,
  Info,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useFasting } from '@/contexts/FastingContext';
import { FAST_TYPE_COLORS } from '@/mocks/vedic-data';
import { METRIC_KNOWLEDGE, MetricKnowledge } from '@/mocks/metric-knowledge';
import MetricKnowledgeModal from '@/components/MetricKnowledgeModal';
import {
  ScoreGauge,
  ImpactCard,
  MilestoneRow,
} from '@/components/AnalyticsComponents';
import { TrendChartCard } from '@/components/TrendChartCard';
import { useTrendData, TimeRange } from '@/hooks/useTrendData';
import { usePedometer as __usePedometer } from '@/hooks/usePedometer';

import {
  WARRIOR_LEVELS,
  AUTOPHAGY_THRESHOLD_HOURS,
  AVG_MEAL_COST,
  formatHours,
  formatNumber,
  getAutophagyScore,
  getHGHMultiplier,
  calculateFatBurned,
  toLocalDateString,
  MilestoneData,
  BarData,
} from '@/utils/analytics-helpers';
import AayuInsightCard from '@/components/AayuInsightCard';
import type { ColorScheme } from '@/constants/colors';

type TabKey = 'overview' | 'spirit';

function DedicatedSeekerCard({ completedCount, colors }: { completedCount: number; colors: ColorScheme }) {
  const BADGE_COLOR = '#D4A03C';
  const isUnlocked = completedCount >= 10;
  const progress = Math.min(completedCount, 10);
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
    if (isUnlocked) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.5, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [progress, isUnlocked, progressAnim, glowAnim]);

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
              : `${10 - progress} more fast${10 - progress === 1 ? '' : 's'} to unlock this badge`}
          </Text>
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
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  sub: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  counter: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
  },
  countNum: {
    fontSize: 26,
    fontWeight: '800' as const,
    letterSpacing: -1,
  },
  countDen: {
    fontSize: 14,
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
  const { activeFast, completedRecords, streak, totalHours, thisWeekRecords, thisMonthRecords } = useFasting();

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
      return sum + ((r.endTime ?? 0) - r.startTime) / 3600000;
    }, 0);
    return total / completedRecords.length;
  }, [completedRecords]);

  const weeklyData: BarData[] = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const data = days.map((label, i) => {
      const diff = i - daysFromMonday;
      const date = new Date(now);
      date.setDate(date.getDate() + diff);
      const dateStr = toLocalDateString(date);

      const dayRecords = completedRecords.filter(r => {
        const rDate = toLocalDateString(r.endTime ?? r.startTime);
        return rDate === dateStr;
      });

      const hours = dayRecords.reduce((sum, r) => {
        return sum + ((r.endTime ?? 0) - r.startTime) / 3600000;
      }, 0);

      return { label, value: hours, maxValue: 24 };
    });

    const maxVal = Math.max(...data.map(d => d.value), 1);
    return data.map(d => ({ ...d, maxValue: maxVal }));
  }, [completedRecords]);

  const fastTypeBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    completedRecords.forEach(r => {
      counts[r.type] = (counts[r.type] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [completedRecords]);

  const longestFast = useMemo(() => {
    if (completedRecords.length === 0) return 0;
    return Math.max(
      ...completedRecords.map(r => ((r.endTime ?? 0) - r.startTime) / 3600000)
    );
  }, [completedRecords]);

  const currentFastHours = useMemo(() => {
    if (!activeFast) return 0;
    return (Date.now() - activeFast.startTime) / 3600000;
  }, [activeFast]);

  const insulinSensitivity = useMemo(() => {
    const durationScore = Math.min(35, (avgFastDuration / 16) * 35);
    const streakScore = Math.min(25, (streak / 30) * 25);
    const completionScore = (completionRate / 100) * 30;
    const experienceScore = Math.min(10, (completedRecords.filter(r => r.completed).length / 50) * 10);
    return Math.min(Math.round(durationScore + streakScore + completionScore + experienceScore), 100);
  }, [avgFastDuration, streak, completionRate, completedRecords]);

  const autophagyDepth = useMemo(() => {
    if (completedRecords.length === 0) return 0;
    const scores = completedRecords.map(r => {
      const hours = ((r.endTime ?? 0) - r.startTime) / 3600000;
      return getAutophagyScore(hours);
    });
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [completedRecords]);

  const bestHGH = useMemo(() => {
    return getHGHMultiplier(longestFast);
  }, [longestFast]);

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

  const warriorLevel = useMemo(() => {
    const completedCount = completedRecords.filter(r => r.completed).length;
    let level = WARRIOR_LEVELS[0];
    for (const l of WARRIOR_LEVELS) {
      if (completedCount >= l.minFasts) level = l;
    }
    return level;
  }, [completedRecords]);

  const gutRestHours = useMemo(() => {
    return completedRecords.reduce((sum, r) => {
      const hours = ((r.endTime ?? 0) - r.startTime) / 3600000;
      return sum + Math.max(0, hours - 8);
    }, 0);
  }, [completedRecords]);

  const totalFatBurned = useMemo(() => {
    return completedRecords.reduce((sum, r) => {
      const hours = ((r.endTime ?? 0) - r.startTime) / 3600000;
      return sum + calculateFatBurned(hours);
    }, 0);
  }, [completedRecords]);

  const totalAutophagyHours = useMemo(() => {
    let hours = 0;
    completedRecords.forEach(r => {
      const dur = ((r.endTime ?? 0) - r.startTime) / 3600000;
      if (dur > AUTOPHAGY_THRESHOLD_HOURS) {
        hours += dur - AUTOPHAGY_THRESHOLD_HOURS;
      }
    });
    return hours;
  }, [completedRecords]);

  const cellularAgeReduction = useMemo(() => {
    const monthsReduced = totalAutophagyHours / 100;
    const yearsReduced = monthsReduced / 12;
    return Math.round(yearsReduced * 10) / 10;
  }, [totalAutophagyHours]);

  const inflammationReduction = useMemo(() => {
    const baseReduction = Math.min(40, (totalHours / 1000) * 40);
    const consistencyBonus = Math.min(15, (streak / 30) * 15);
    const qualityBonus = avgFastDuration >= 16 ? 10 : avgFastDuration >= 14 ? 5 : 0;
    return Math.round(baseReduction + consistencyBonus + qualityBonus);
  }, [totalHours, streak, avgFastDuration]);

  const impactMetrics = useMemo(() => {
    const fatBurnedCalories = totalFatBurned * 9;
    const mealsSkipped = completedRecords.reduce((sum, r) => {
      const durationHours = ((r.endTime ?? 0) - r.startTime) / 3600000;
      return sum + Math.floor(durationHours / 6);
    }, 0);
    return { fatBurnedCalories, fatBurnedGrams: totalFatBurned, autophagyHours: totalAutophagyHours, mealsSkipped };
  }, [totalFatBurned, totalAutophagyHours, completedRecords]);

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

  const autophagyCount = useMemo(() => {
    return completedRecords.filter(r => {
      const hours = ((r.endTime ?? 0) - r.startTime) / 3600000;
      return hours > AUTOPHAGY_THRESHOLD_HOURS;
    }).length;
  }, [completedRecords]);

  const thisWeekHours = useMemo(() => {
    return thisWeekRecords.reduce((sum, r) => {
      return sum + ((r.endTime ?? 0) - r.startTime) / 3600000;
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
      return sum + ((r.endTime ?? 0) - r.startTime) / 3600000;
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
      ...thisWeekRecords.map((r) => ((r.endTime ?? 0) - r.startTime) / 3600000)
    );
  }, [thisWeekRecords]);

  const thisWeekAutophagyCount = useMemo(() => {
    return thisWeekRecords.filter(r => {
      const hours = ((r.endTime ?? 0) - r.startTime) / 3600000;
      return hours > AUTOPHAGY_THRESHOLD_HOURS;
    }).length;
  }, [thisWeekRecords]);

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

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: colors.warningLight }]}>
            <TrendingUp size={18} color={colors.warning} />
          </View>
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: colors.primaryLight }]}>
            <Clock size={18} color={colors.primary} />
          </View>
          <Text style={styles.statValue}>{formatHours(totalHours)}</Text>
          <Text style={styles.statLabel}>Total Fasted</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: colors.successLight }]}>
            <Target size={18} color={colors.success} />
          </View>
          <Text style={styles.statValue}>{completionRate}%</Text>
          <Text style={styles.statLabel}>Completion</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: colors.accentLight }]}>
            <Award size={18} color={colors.accent} />
          </View>
          <Text style={styles.statValue}>{formatHours(longestFast)}</Text>
          <Text style={styles.statLabel}>Longest Fast</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Star size={16} color="#D4A03C" />
          <Text style={styles.sectionTitleInline}>Next Achievement</Text>
        </View>
        <DedicatedSeekerCard
          completedCount={completedRecords.filter(r => r.completed).length}
          colors={colors}
        />
      </View>

      {/* Trend charts */}
      <View style={styles.section}>
        <TrendChartCard
          title="Fasting"
          icon="⏱️"
          color={colors.primary}
          data={fastingTrend.fastingData}
          unit="h"
          chartType="bar"
          range={fastingRange}
          onRangeChange={setFastingRange}
          formatValue={(v) => v >= 1 ? `${Math.round(v * 10) / 10}h` : `${Math.round(v * 60)}m`}
          formatYLabel={(v) => `${Math.round(v)}h`}
        />
        <TrendChartCard
          title="Weight"
          icon="⚖️"
          color={colors.warning}
          data={weightTrend.weightData}
          unit="kg"
          chartType="line"
          range={weightRange}
          onRangeChange={setWeightRange}
          goalValue={weightTrend.goalWeightKg ?? undefined}
          startingValue={weightTrend.startingWeightKg ?? undefined}
          formatValue={(v) => `${v.toFixed(1)}kg`}
          formatYLabel={(v) => `${Math.round(v * 10) / 10}`}
        />
        <TrendChartCard
          title="Steps"
          icon="👟"
          color={colors.success}
          data={stepsTrend.stepsData}
          unit="steps"
          chartType="bar"
          range={stepsRange}
          onRangeChange={setStepsRange}
          targetValue={stepsTrend.stepsTarget}
          formatValue={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`}
          formatYLabel={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : `${Math.round(v)}`}
        />
        <TrendChartCard
          title="Water"
          icon="💧"
          color="#5b8dd9"
          data={waterTrend.waterData}
          unit="ml"
          chartType="bar"
          range={waterRange}
          onRangeChange={setWaterRange}
          targetValue={waterTrend.waterTarget}
          formatValue={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}L` : `${Math.round(v)}ml`}
          formatYLabel={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}L` : `${Math.round(v)}ml`}
        />
      </View>

      <View style={styles.warriorCard}>
        <View style={styles.warriorLeft}>
          <Text style={styles.warriorEmoji}>{warriorLevel.icon}</Text>
          <View>
            <Text style={styles.warriorLevelLabel}>FASTING LEVEL</Text>
            <Text style={[styles.warriorLevelName, { color: warriorLevel.color }]}>{warriorLevel.name}</Text>
          </View>
        </View>
        <View style={styles.warriorRight}>
          <Text style={styles.warriorFastCount}>{completedRecords.filter(r => r.completed).length}</Text>
          <Text style={styles.warriorFastLabel}>fasts</Text>
        </View>
      </View>
    </>
  );

  const renderBodyTab = () => (
    <>
      {totalHours > 0 && (
        <>
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Zap size={16} color={colors.primary} />
              <Text style={styles.sectionTitleInline}>Body Scores</Text>
              <View style={styles.tapHintBadge}>
                <Info size={10} color={colors.textMuted} />
                <Text style={styles.tapHintText}>Tap to learn</Text>
              </View>
            </View>
            <Text style={styles.sectionSubtext}>
              Health metrics based on your fasting patterns
            </Text>

            <View style={styles.scoreGridRow}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => handleInfoPress('insulinSensitivity')} style={styles.scoreGaugeTouchable}>
                <ScoreGauge
                  value={insulinSensitivity}
                  maxValue={100}
                  label="Insulin Sensitivity"
                  color="#2E86AB"
                  suffix="/100"
                  icon={<Droplets size={16} color="#2E86AB" />}
                />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} onPress={() => handleInfoPress('autophagy')} style={styles.scoreGaugeTouchable}>
                <ScoreGauge
                  value={autophagyDepth}
                  maxValue={100}
                  label="Avg Autophagy Depth"
                  color="#7B68AE"
                  suffix="%"
                  icon={<Sparkles size={16} color="#7B68AE" />}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.scoreGridRow}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => handleInfoPress('hghBoost')} style={styles.scoreGaugeTouchable}>
                <ScoreGauge
                  value={bestHGH.multiplier}
                  maxValue={25}
                  label="Best HGH Boost"
                  color="#E8913A"
                  suffix="x"
                  icon={<TrendingUp size={16} color="#E8913A" />}
                />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} onPress={() => handleInfoPress('inflammationReduction')} style={styles.scoreGaugeTouchable}>
                <ScoreGauge
                  value={inflammationReduction}
                  maxValue={100}
                  label="Inflammation Reduction"
                  color="#C25450"
                  suffix="/100"
                  icon={<Heart size={16} color="#C25450" />}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Flame size={16} color={colors.primary} />
              <Text style={styles.sectionTitleInline}>Physical Impact</Text>
            </View>

            <TouchableOpacity activeOpacity={0.7} onPress={() => handleInfoPress('fatBurned')}>
              <View style={styles.impactHeroCard}>
                <View style={styles.impactHeroInner}>
                  <Flame size={28} color="#E8913A" />
                  <View style={styles.impactHeroTextWrap}>
                    <Text style={styles.impactHeroValue}>
                      {formatNumber(impactMetrics.fatBurnedGrams)}g
                    </Text>
                    <Text style={styles.impactHeroLabel}>estimated body fat burned</Text>
                  </View>
                  <View style={styles.infoBtn}>
                    <Info size={15} color={colors.textMuted} />
                  </View>
                </View>
                <View style={styles.impactHeroDivider} />
                <Text style={styles.impactHeroEquiv}>
                  {formatNumber(impactMetrics.fatBurnedCalories)} kcal from fat · Tap to learn more
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.impactGrid}>
              <ImpactCard
                icon={<Sparkles size={20} color="#7B68AE" />}
                value={formatHours(impactMetrics.autophagyHours)}
                label="Deep Autophagy"
                sublabel="Cellular renewal time"
                color="#7B68AE"
                index={0}
                knowledgeId="autophagy"
                onInfoPress={handleInfoPress}
              />
              <ImpactCard
                icon={<Zap size={20} color="#E8913A" />}
                value={bestHGH.display}
                label="Peak HGH Boost"
                sublabel="From your longest fast"
                color="#E8913A"
                index={1}
                knowledgeId="hghBoost"
                onInfoPress={handleInfoPress}
              />
              <ImpactCard
                icon={<Heart size={20} color="#C25450" />}
                value={`${inflammationReduction}%`}
                label="Inflammation ↓"
                sublabel="Cumulative reduction"
                color="#C25450"
                index={2}
                knowledgeId="inflammationReduction"
                onInfoPress={handleInfoPress}
              />
              <ImpactCard
                icon={<Droplets size={20} color="#2E86AB" />}
                value={`${insulinSensitivity}/100`}
                label="Insulin Score"
                sublabel="Metabolic sensitivity"
                color="#2E86AB"
                index={3}
                knowledgeId="insulinSensitivity"
                onInfoPress={handleInfoPress}
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Brain size={16} color={colors.primary} />
              <Text style={styles.sectionTitleInline}>Advanced Metrics</Text>
            </View>

            <View style={styles.advancedGrid}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => handleInfoPress('cellularAge')} style={styles.advancedTouchable}>
                <View style={styles.advancedCard}>
                  <View style={styles.infoHintRight}>
                    <Info size={13} color={colors.textMuted} />
                  </View>
                  <Text style={styles.advancedEmoji}>🧬</Text>
                  <Text style={styles.advancedValue}>-{cellularAgeReduction}y</Text>
                  <Text style={styles.advancedLabel}>Cellular Age</Text>
                  <Text style={styles.advancedSub}>Estimated biological age reduction</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} onPress={() => handleInfoPress('gutRest')} style={styles.advancedTouchable}>
                <View style={styles.advancedCard}>
                  <View style={styles.infoHintRight}>
                    <Info size={13} color={colors.textMuted} />
                  </View>
                  <Text style={styles.advancedEmoji}>🫗</Text>
                  <Text style={styles.advancedValue}>{formatHours(gutRestHours)}</Text>
                  <Text style={styles.advancedLabel}>Gut Rest (Agni)</Text>
                  <Text style={styles.advancedSub}>Total digestive system rest</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.savingsCard}>
              <View style={styles.savingsRow}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => handleInfoPress('mealsSkipped')} style={styles.savingsItem}>
                  <Text style={styles.savingsEmoji}>🍽️</Text>
                  <Text style={styles.savingsValue}>{impactMetrics.mealsSkipped}</Text>
                  <Text style={styles.savingsLabel}>Meals Skipped</Text>
                  <Info size={11} color={colors.textMuted} style={styles.savingsInfoIcon} />
                </TouchableOpacity>

              </View>
            </View>
          </View>
        </>
      )}
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
              <Text style={styles.pranaEmoji}>🧘</Text>
              <Text style={styles.pranaValue}>{Math.min(Math.round(avgFastDuration / 24 * 100), 100)}%</Text>
              <Text style={styles.pranaLabel}>Mental Clarity</Text>
            </View>
            <View style={styles.pranaItem}>
              <Text style={styles.pranaEmoji}>⚡</Text>
              <Text style={styles.pranaValue}>{Math.min(Math.round(streak * 10 + completionRate * 0.3), 100)}%</Text>
              <Text style={styles.pranaLabel}>Vitality</Text>
            </View>
            <View style={styles.pranaItem}>
              <Text style={styles.pranaEmoji}>🕉️</Text>
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
        <Animated.ScrollView
          style={[styles.scroll, { opacity: fadeAnim }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.screenTitle}>Journey</Text>
          <Text style={styles.screenSubtitle}>Your fasting journey insights</Text>

          {/* Sub-tabs: Overview + Spirit (if Vedic) */}
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

          {activeTab === 'overview' && renderOverviewTab()}
          {showVedic && activeTab === 'spirit' && renderSpiritTab()}

          {completedRecords.length === 0 && activeTab !== 'spirit' && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🧘</Text>
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
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 100,
    },
    screenTitle: {
      fontSize: 28,
      fontWeight: '700' as const,
      color: colors.text,
      marginTop: 12,
      letterSpacing: -0.5,
    },
    screenSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
      marginTop: 2,
    },
    tabBar: {
      flexDirection: 'row' as const,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 3,
      marginBottom: 20,
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
      fontSize: 13,
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
      gap: 10,
      marginBottom: 14,
    },
    statCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      flexGrow: 1,
      flexBasis: '45%' as any,
    },
    statIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: 10,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: colors.text,
    },
    statLabel: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    warriorCard: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
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
      alignItems: 'center' as const,
      gap: 12,
    },
    warriorEmoji: {
      fontSize: 32,
    },
    warriorLevelLabel: {
      fontSize: 10,
      fontWeight: '700' as const,
      color: colors.textMuted,
      letterSpacing: 1.2,
      marginBottom: 2,
    },
    warriorLevelName: {
      fontSize: 20,
      fontWeight: '800' as const,
      letterSpacing: -0.5,
    },
    warriorRight: {
      alignItems: 'center' as const,
    },
    warriorFastCount: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: colors.text,
    },
    warriorFastLabel: {
      fontSize: 12,
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
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
      flex: 1,
    },
    sectionSubtext: {
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: 14,
      marginTop: 2,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 12,
    },
    liveBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      backgroundColor: '#E8F8E820',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#4CAF50',
    },
    liveText: {
      fontSize: 9,
      fontWeight: '700' as const,
      color: '#4CAF50',
      letterSpacing: 0.8,
    },
    zonesCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    scoreGridRow: {
      flexDirection: 'row' as const,
      gap: 10,
      marginBottom: 10,
    },
    impactHeroCard: {
      backgroundColor: colors.surfaceWarm,
      borderRadius: 16,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.primaryLight,
      marginBottom: 12,
    },
    impactHeroInner: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 14,
    },
    impactHeroTextWrap: {
      flex: 1,
    },
    impactHeroValue: {
      fontSize: 32,
      fontWeight: '800' as const,
      color: colors.primary,
      letterSpacing: -1,
    },
    impactHeroLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    impactHeroDivider: {
      height: 1,
      backgroundColor: colors.borderLight,
      marginVertical: 12,
    },
    impactHeroEquiv: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      textAlign: 'center' as const,
    },
    impactGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 10,
      marginBottom: 12,
    },
    advancedGrid: {
      flexDirection: 'row' as const,
      gap: 10,
      marginBottom: 12,
    },
    advancedCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.borderLight,
      alignItems: 'center' as const,
    },
    advancedEmoji: {
      fontSize: 28,
      marginBottom: 6,
    },
    advancedValue: {
      fontSize: 22,
      fontWeight: '700' as const,
      color: colors.text,
      letterSpacing: -0.5,
    },
    advancedLabel: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.textSecondary,
      marginTop: 2,
      textAlign: 'center' as const,
    },
    advancedSub: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
      textAlign: 'center' as const,
    },
    savingsCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    savingsRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    savingsItem: {
      flex: 1,
      alignItems: 'center' as const,
    },
    savingsEmoji: {
      fontSize: 24,
      marginBottom: 6,
    },
    savingsValue: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: colors.text,
    },
    savingsLabel: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    savingsDivider: {
      width: 1,
      height: 48,
      backgroundColor: colors.borderLight,
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
      fontSize: 42,
      fontWeight: '800' as const,
      color: '#7B68AE',
      letterSpacing: -2,
    },
    sattvicScoreMax: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: colors.textMuted,
    },
    sattvicMeta: {
      flex: 1,
    },
    sattvicLevel: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 2,
    },
    sattvicDesc: {
      fontSize: 12,
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
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 2,
    },
    sattvicBreakdownValue: {
      fontSize: 18,
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
      borderRadius: 14,
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
    pranaEmoji: {
      fontSize: 28,
      marginBottom: 6,
    },
    pranaValue: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: colors.text,
    },
    pranaLabel: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    milestoneCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
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
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.primary,
    },
    chartCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      marginTop: 8,
    },
    summaryCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    summaryRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingVertical: 8,
    },
    summaryLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.text,
    },
    divider: {
      height: 1,
      backgroundColor: colors.borderLight,
    },
    typeList: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    typeRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 10,
    },
    typeDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 10,
    },
    typeName: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    typeCount: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.textSecondary,
    },
    emptyState: {
      alignItems: 'center' as const,
      paddingVertical: 48,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center' as const,
      lineHeight: 20,
      paddingHorizontal: 32,
    },
    infoHintRight: {
      position: 'absolute' as const,
      top: 10,
      right: 10,
      opacity: 0.5,
    },
    infoBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.surface,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    tapHintBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      backgroundColor: colors.surface,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    tapHintText: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '500' as const,
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
      fontSize: 11,
      fontWeight: '600' as const,
    },
    scoreGaugeTouchable: {
      flex: 1,
    },
    advancedTouchable: {
      flex: 1,
    },
    savingsInfoIcon: {
      marginTop: 4,
    },
    sectionTitleTouchable: {
      flex: 1,
    },
  });
}
