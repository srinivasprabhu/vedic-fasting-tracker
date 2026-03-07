import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

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

function generateInsight(
  props: AayuInsightCardProps,
  bodyTextColor: string,
): {
  quote: string;
  body: React.ReactNode;
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

  const gutRestHours = Math.round(weekTotalHours * 0.6);
  const hghMultiplier = weekLongestHours >= 72 ? 25 : weekLongestHours >= 48 ? 15 : weekLongestHours >= 24 ? 5 : weekLongestHours >= 16 ? 2 : 1;
  const avgRounded = Math.round(weekAvgHours);
  const hasAutophagy = weekAutophagyCount >= 2;
  const hasDeepFast = weekLongestHours >= 24;
  const hasGoodStreak = streak >= 3;

  const bodyBase = { fontSize: 14, lineHeight: 22, color: bodyTextColor };

  // No fasts this week — motivational nudge
  if (weekFasts === 0) {
    const motivations = [
      {
        quote: '"A new week is a blank page — write something powerful."',
        body: (
          <Text style={bodyBase}>
            You haven't fasted yet this week. Even a short{' '}
            <Text style={{ color: '#D4A03C', fontWeight: '700' }}>12-hour fast</Text>
            {' '}can lower insulin, boost fat-burning, and give your gut a{' '}
            <Text style={{ color: '#5B8C5A', fontWeight: '700' }}>much-needed break</Text>
            . Start today and make this week count. 💪
          </Text>
        ),
        tags: [
          { label: 'Fresh start', emoji: '🌅', color: '#D4A03C' },
          ...(hasGoodStreak ? [{ label: `${streak} streak to protect`, emoji: '🔥', color: '#C25450' }] : []),
        ],
      },
      {
        quote: '"The best time to start was yesterday. The next best time is now."',
        body: (
          <Text style={bodyBase}>
            Your body is ready for its next fast. Research shows{' '}
            <Text style={{ color: '#2E86AB', fontWeight: '700' }}>autophagy</Text>
            {' '}— your body's cellular cleanup — kicks in after just{' '}
            <Text style={{ color: '#D4A03C', fontWeight: '700' }}>16 hours</Text>
            . One fast can set the tone for the entire week. 🚀
          </Text>
        ),
        tags: [
          { label: 'Week awaits', emoji: '⚡', color: '#7B68AE' },
        ],
      },
      {
        quote: '"Consistency beats perfection — show up this week."',
        body: (
          <Text style={bodyBase}>
            No fasts logged yet, but the week is young. Even{' '}
            <Text style={{ color: '#D4A03C', fontWeight: '700' }}>one fast</Text>
            {' '}this week keeps the momentum going. Your{' '}
            <Text style={{ color: '#5B8C5A', fontWeight: '700' }}>metabolism</Text>
            {' '}responds best to regular fasting windows. Make it happen. 🎯
          </Text>
        ),
        tags: [
          { label: 'Stay consistent', emoji: '🎯', color: '#5B8C5A' },
        ],
      },
    ];
    const idx = new Date().getDay() % motivations.length;
    return motivations[idx];
  }

  // Strong week: 3+ fasts with autophagy hits
  if (weekFasts >= 3 && hasAutophagy) {
    return {
      quote: `"Your gut rested ${gutRestHours}h this week — your metabolism is adapting."`,
      body: (
        <Text style={bodyBase}>
          You completed{' '}
          <Text style={{ color: '#D4A03C', fontWeight: '700' }}>{weekFasts} fasts</Text>
          {' '}averaging{' '}
          <Text style={{ color: '#D4A03C', fontWeight: '700' }}>{avgRounded}h</Text>
          , reaching{' '}
          <Text style={{ color: '#2E86AB', fontWeight: '700' }}>Deep Autophagy</Text>
          {' '}{weekAutophagyCount > 1 ? `${weekAutophagyCount} times` : 'once'}.{weekLongestHours >= 48 ? ` Your longest fast (${Math.round(weekLongestHours)}h) triggered ${hghMultiplier}×` : ''}{weekLongestHours >= 48 ? <Text style={{ color: '#D4A03C', fontWeight: '700' }}> HGH boost</Text> : ''}{weekLongestHours >= 48 ? ' — a powerful cellular renewal event.' : ' Consistency is your superpower. '} 🔥
        </Text>
      ),
      tags: [
        { label: 'Metabolism adapting', emoji: '↑', color: '#5B8C5A' },
        { label: 'Deep rest achieved', emoji: '🌙', color: '#D4A03C' },
        { label: `Autophagy ${weekAutophagyCount}×`, emoji: '✦', color: '#7B68AE' },
      ],
    };
  }

  // Deep fast this week with significant HGH boost
  if (hasDeepFast && hghMultiplier >= 5) {
    return {
      quote: `"In stillness, the body heals what the mind cannot see."`,
      body: (
        <Text style={bodyBase}>
          This week your{' '}
          <Text style={{ color: '#D4A03C', fontWeight: '700' }}>{Math.round(weekLongestHours)}h fast</Text>
          {' '}triggered a{' '}
          <Text style={{ color: '#E8913A', fontWeight: '700' }}>{hghMultiplier}× HGH boost</Text>
          {' '}— activating deep{' '}
          <Text style={{ color: '#C97B2A', fontStyle: 'italic', fontWeight: '600' }}>cellular renewal</Text>
          . You've fasted{' '}
          <Text style={{ color: '#D4A03C', fontWeight: '700' }}>{Math.round(weekTotalHours)}h</Text>
          {' '}so far this week. Your body is thanking you. 🔥
        </Text>
      ),
      tags: [
        { label: 'Deep fast unlocked', emoji: '🌙', color: '#7B68AE' },
        { label: `HGH ${hghMultiplier}×`, emoji: '⚡', color: '#E8913A' },
        ...(hasGoodStreak ? [{ label: `${streak} day streak`, emoji: '🔥', color: '#C25450' }] : []),
      ],
    };
  }

  // Good streak going
  if (hasGoodStreak) {
    return {
      quote: `"Discipline practised daily becomes identity."`,
      body: (
        <Text style={bodyBase}>
          A{' '}
          <Text style={{ color: '#D4A03C', fontWeight: '700' }}>{streak}-fast streak</Text>
          {' '}and{' '}
          <Text style={{ color: '#D4A03C', fontWeight: '700' }}>{weekFasts} fast{weekFasts > 1 ? 's' : ''}</Text>
          {' '}this week — this is how transformation happens. Averaging{' '}
          <Text style={{ color: '#D4A03C', fontWeight: '700' }}>{avgRounded}h per fast</Text>
          , your{' '}
          <Text style={{ color: '#5B8C5A', fontWeight: '700' }}>metabolism</Text>
          {' '}grows more efficient each cycle. 💪
        </Text>
      ),
      tags: [
        { label: `${streak} fast streak`, emoji: '🔥', color: '#C25450' },
        { label: `${weekFasts} this week`, emoji: '📊', color: '#5B8C5A' },
      ],
    };
  }

  // Default: some fasting activity this week
  return {
    quote: '"Every fast is a gift your body gives itself."',
    body: (
      <Text style={bodyBase}>
        You've fasted{' '}
        <Text style={{ color: '#D4A03C', fontWeight: '700' }}>{Math.round(weekTotalHours)}h</Text>
        {' '}across{' '}
        <Text style={{ color: '#D4A03C', fontWeight: '700' }}>{weekFasts} fast{weekFasts > 1 ? 's' : ''}</Text>
        {' '}this week, giving your{' '}
        <Text style={{ color: '#5B8C5A', fontWeight: '700' }}>digestive system</Text>
        {' '}rest. Each fast strengthens{' '}
        <Text style={{ color: '#2E86AB', fontWeight: '700' }}>insulin sensitivity</Text>
        {' '}and deepens cellular renewal. Keep going! ✨
      </Text>
    ),
    tags: [
      { label: `${Math.round(weekTotalHours)}h this week`, emoji: '⏱️', color: '#5B8C5A' },
      { label: 'Building momentum', emoji: '✨', color: '#D4A03C' },
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
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const dateLabel = `${fmt(weekStart)} – ${fmt(weekEnd)}`;

  const bodyTextColor = isDark ? '#C8B8A2' : colors.textSecondary;

  const insight = useMemo(
    () => generateInsight(
      { weekFasts, weekAvgHours, weekLongestHours, weekTotalHours, streak, weekAutophagyCount },
      bodyTextColor,
    ),
    [weekFasts, weekAvgHours, weekLongestHours, weekTotalHours, streak, weekAutophagyCount, bodyTextColor]
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      delay: 150,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 2400, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim, glowAnim]);

  const cardBg = isDark ? '#1A0D06' : colors.surfaceWarm;
  const cardBorder = isDark ? '#3D2010' : colors.border;
  const quoteColor = '#D4A03C';
  const borderAccent = '#C97B2A';
  const pillBg = isDark ? '#2A1508' : colors.surface;
  const pillBorder = isDark ? '#3D2010' : colors.border;
  const labelColor = isDark ? '#9E7A50' : colors.textSecondary;
  const dateLabelColor = isDark ? '#6E5540' : colors.textMuted;

  return (
    <Animated.View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, opacity: fadeAnim }]}>
      <View style={styles.header}>
        <View style={[styles.headerLeft, { backgroundColor: pillBg, borderColor: pillBorder }]}>
          <Animated.View style={[styles.liveDot, { opacity: glowAnim, backgroundColor: quoteColor }]} />
          <Text style={[styles.headerLabel, { color: labelColor }]}>INSIGHT · WEEK</Text>
        </View>
        <Text style={[styles.dateLabel, { color: dateLabelColor }]}>{dateLabel}</Text>
      </View>

      <View style={[styles.quoteBlock, { borderLeftColor: borderAccent }]}>
        <Text style={[styles.quoteText, { color: quoteColor }]}>{insight.quote}</Text>
      </View>

      <View style={styles.body}>
        {insight.body}
      </View>

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
    marginBottom: 14,
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
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  quoteBlock: {
    borderLeftWidth: 3,
    paddingLeft: 14,
    marginBottom: 14,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  body: {
    marginBottom: 16,
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
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
