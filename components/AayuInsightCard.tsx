import { fs } from '@/constants/theme';
import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface InsightTag {
  label: string;
  emoji: string;
  color: string;
}

interface AayuInsightCardProps {
  weekFasts: number;
  weekAvgHours: number;
  weekLongestHours: number;
  weekTotalHours: number;
  streak: number;
  weekAutophagyCount: number;
}

function generateInsight(props: AayuInsightCardProps): {
  headline: string;
  supporting: string;
  tags: InsightTag[];
} {
  const {
    weekFasts,
    weekAvgHours,
    weekLongestHours,
    weekTotalHours,
    streak,
    weekAutophagyCount,
  } = props;

  const avgRounded = Math.round(weekAvgHours * 10) / 10;
  const totalRounded = Math.round(weekTotalHours * 10) / 10;
  const longestRounded = Math.round(weekLongestHours * 10) / 10;
  const hasAutophagy = weekAutophagyCount >= 2;
  const hasDeepFast = weekLongestHours >= 24;
  const hasGoodStreak = streak >= 3;

  if (weekFasts === 0) {
    return {
      headline: 'Start your first fast this week',
      supporting:
        'Even a 12–16h window can support insulin balance and metabolic flexibility. Pick a day and begin when it feels right.',
      tags: [
        { label: 'Fresh start', emoji: '✦', color: '#D4A03C' },
        ...(hasGoodStreak ? [{ label: `${streak}-day streak to protect`, emoji: '✦', color: '#C25450' }] : []),
      ],
    };
  }

  if (weekFasts >= 3 && hasAutophagy) {
    return {
      headline:
        weekLongestHours >= 1
          ? `Longest fast: ${longestRounded}h`
          : 'Strong fasting week',
      supporting:
        weekLongestHours >= 48
          ? `Your longest fast reached advanced fasting territory — often associated with deeper fat adaptation and recovery signaling. You logged ${totalRounded}h across ${weekFasts} fasts.`
          : weekLongestHours >= 24
            ? `Your ${longestRounded}h fast likely entered deeper fasting territory, where repair and metabolic adaptation are often more active. ${totalRounded}h total across ${weekFasts} fasts.`
            : `You hit autophagy-friendly length ${weekAutophagyCount > 1 ? `${weekAutophagyCount} times` : 'this week'} — averaging ${avgRounded}h per fast. Consistency builds the habit.`,
      tags: [
        { label: 'Deep fast zone', emoji: '✦', color: '#7B68AE' },
        { label: 'Metabolic shift', emoji: '↗', color: '#5B8C5A' },
        ...(weekLongestHours >= 48
          ? [{ label: 'Advanced phase', emoji: '✦', color: '#D4A03C' }]
          : [{ label: 'Autophagy window', emoji: '✦', color: '#7B68AE' }]),
      ],
    };
  }

  if (hasDeepFast) {
    return {
      headline: `Longest fast: ${longestRounded}h`,
      supporting:
        'Extended fasting is often associated with stronger metabolic flexibility and recovery pathways. Keep listening to your body and hydrate well.',
      tags: [
        { label: 'Deep fast unlocked', emoji: '✦', color: '#7B68AE' },
        { label: 'Fat adaptation', emoji: '✦', color: '#5B8C5A' },
        ...(hasGoodStreak ? [{ label: `${streak}-day streak`, emoji: '✦', color: '#C25450' }] : []),
      ],
    };
  }

  if (hasGoodStreak) {
    return {
      headline: `${streak}-day streak · ${weekFasts} fast${weekFasts === 1 ? '' : 's'} this week`,
      supporting: `Averaging ${avgRounded}h per fast — regular windows help your metabolism stay flexible.`,
      tags: [
        { label: `${streak} day streak`, emoji: '✦', color: '#C25450' },
        { label: `${weekFasts} this week`, emoji: '✦', color: '#5B8C5A' },
      ],
    };
  }

  return {
    headline: `${totalRounded}h logged · ${weekFasts} fast${weekFasts === 1 ? '' : 's'}`,
    supporting:
      'Each completed window supports insulin sensitivity and digestive rest. Small wins compound.',
    tags: [
      { label: `${totalRounded}h this week`, emoji: '✦', color: '#5B8C5A' },
      { label: 'Building momentum', emoji: '✦', color: '#D4A03C' },
    ],
  };
}

export default function AayuInsightCard({
  weekFasts,
  weekAvgHours,
  weekLongestHours,
  weekTotalHours,
  streak,
  weekAutophagyCount,
}: AayuInsightCardProps) {
  const { colors, isDark } = useTheme();
  const reduceMotion = useReducedMotion();
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const dateLabel = `${fmt(weekStart)} – ${fmt(weekEnd)}`;

  const insight = useMemo(
    () =>
      generateInsight({
        weekFasts,
        weekAvgHours,
        weekLongestHours,
        weekTotalHours,
        streak,
        weekAutophagyCount,
      }),
    [weekFasts, weekAvgHours, weekLongestHours, weekTotalHours, streak, weekAutophagyCount],
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: reduceMotion ? 0 : 700,
      delay: reduceMotion ? 0 : 150,
      useNativeDriver: true,
    }).start();

    if (reduceMotion) {
      glowAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 2400, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [fadeAnim, glowAnim, reduceMotion]);

  const cardBg = isDark ? '#1A0D06' : colors.surfaceWarm;
  const cardBorder = isDark ? '#3D2010' : colors.border;
  const borderAccent = '#C97B2A';
  const pillBg = isDark ? '#2A1508' : colors.surface;
  const pillBorder = isDark ? '#3D2010' : colors.border;
  const labelColor = isDark ? '#9E7A50' : colors.textSecondary;
  const dateLabelColor = isDark ? '#6E5540' : colors.textMuted;
  const headlineColor = colors.text;
  const supportingColor = isDark ? '#C8B8A2' : colors.textSecondary;

  return (
    <Animated.View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, opacity: fadeAnim }]}>
      <View style={styles.header}>
        <View style={[styles.headerLeft, { backgroundColor: pillBg, borderColor: pillBorder }]}>
          <Animated.View style={[styles.liveDot, { opacity: glowAnim, backgroundColor: colors.warning }]} />
          <Text style={[styles.headerLabel, { color: labelColor }]}>WEEKLY HIGHLIGHT</Text>
        </View>
        <Text style={[styles.dateLabel, { color: dateLabelColor }]}>{dateLabel}</Text>
      </View>

      <View style={[styles.headlineBlock, { borderLeftColor: borderAccent }]}>
        <Text style={[styles.headline, { color: headlineColor }]}>{insight.headline}</Text>
      </View>

      <Text style={[styles.supporting, { color: supportingColor }]}>{insight.supporting}</Text>

      <View style={styles.tagsRow}>
        {insight.tags.map((tag, i) => (
          <View key={i} style={[styles.tag, { borderColor: tag.color + '60', backgroundColor: tag.color + '15' }]}>
            <Text style={[styles.tagText, { color: tag.color }]}>
              {tag.emoji} {tag.label}
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  headerLabel: {
    fontSize: fs(10),
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  dateLabel: {
    fontSize: fs(13),
    fontWeight: '500',
  },
  headlineBlock: {
    borderLeftWidth: 3,
    paddingLeft: 14,
    marginBottom: 10,
  },
  headline: {
    fontSize: fs(20),
    fontWeight: '700',
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  supporting: {
    fontSize: fs(15),
    lineHeight: 23,
    marginBottom: 14,
    fontWeight: '400',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontSize: fs(13),
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
