import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorScheme } from '@/constants/colors';

interface InsightTag {
  label: string;
  emoji: string;
  color: string;
}

interface AayuInsightCardProps {
  totalWeekFasts: number;
  avgFastHours: number;
  longestFastHours: number;
  totalHours: number;
  streak: number;
  autophagyCount: number;
}

function generateInsight(props: AayuInsightCardProps): {
  quote: string;
  body: React.ReactNode;
  tags: InsightTag[];
} {
  const {
    totalWeekFasts,
    avgFastHours,
    longestFastHours,
    totalHours,
    streak,
    autophagyCount,
  } = props;

  const gutRestHours = Math.round(totalHours * 0.6);
  const hghMultiplier = longestFastHours >= 72 ? 25 : longestFastHours >= 48 ? 15 : longestFastHours >= 24 ? 5 : longestFastHours >= 16 ? 2 : 1;
  const avgRounded = Math.round(avgFastHours);
  const hasAutophagy = autophagyCount >= 2;
  const hasDeepFast = longestFastHours >= 24;
  const hasGoodStreak = streak >= 3;

  if (totalWeekFasts === 0 && totalHours === 0) {
    return {
      quote: '"Your journey begins with a single breath of intention."',
      body: (
        <Text style={bodyBaseStyle}>
          Start your first fast and let{' '}
          <Text style={{ color: '#D4A03C', fontWeight: '700' }}>Agni</Text>
          {' '}begin its renewal. The Vedas say — the one who masters{' '}
          <Text style={{ color: '#C97B2A', fontStyle: 'italic', fontWeight: '600' }}>Tapas</Text>
          {' '}masters life itself. Every great discipline starts today. 🌅
        </Text>
      ),
      tags: [
        { label: 'Begin your sadhana', emoji: '🕉️', color: '#7B68AE' },
      ],
    };
  }

  if (totalWeekFasts >= 3 && hasAutophagy) {
    return {
      quote: `"Your Agni rested ${gutRestHours}h this week — your digestive fire is strengthening."`,
      body: (
        <Text style={bodyBaseStyle}>
          You completed{' '}
          <Text style={{ color: '#D4A03C', fontWeight: '700' }}>{totalWeekFasts} fasts</Text>
          {' '}averaging{' '}
          <Text style={{ color: '#D4A03C', fontWeight: '700' }}>{avgRounded}h</Text>
          , reaching{' '}
          <Text style={{ color: '#2E86AB', fontWeight: '700' }}>Deep Autophagy</Text>
          {' '}{autophagyCount > 1 ? `${autophagyCount} times` : 'once'}.{longestFastHours >= 48 ? ` Your longest fast (${Math.round(longestFastHours)}h) triggered ${hghMultiplier}×` : ''}{longestFastHours >= 48 ? <Text style={{ color: '#D4A03C', fontWeight: '700' }}> HGH boost</Text> : ''}{longestFastHours >= 48 ? ` — a rare cellular renewal the Vedas call ` : ' Consistency is your superpower. '}{longestFastHours >= 48 ? <Text style={{ color: '#C97B2A', fontStyle: 'italic', fontWeight: '600' }}>Tapas</Text> : ''}{longestFastHours >= 48 ? '. 🔥' : '🔥'}
        </Text>
      ),
      tags: [
        { label: 'Agni strengthening', emoji: '↑', color: '#5B8C5A' },
        { label: 'Tapas achieved', emoji: '🌙', color: '#D4A03C' },
        ...(hasAutophagy ? [{ label: `Autophagy ${autophagyCount}×`, emoji: '✦', color: '#7B68AE' }] : []),
      ],
    };
  }

  if (hasDeepFast && hghMultiplier >= 5) {
    return {
      quote: `"In stillness, the body heals what the mind cannot see."`,
      body: (
        <Text style={bodyBaseStyle}>
          Your{' '}
          <Text style={{ color: '#D4A03C', fontWeight: '700' }}>{Math.round(longestFastHours)}h fast</Text>
          {' '}triggered a{' '}
          <Text style={{ color: '#E8913A', fontWeight: '700' }}>{hghMultiplier}× HGH boost</Text>
          {' '}— activating cellular renewal the Vedas call{' '}
          <Text style={{ color: '#C97B2A', fontStyle: 'italic', fontWeight: '600' }}>Tapas</Text>
          . Total{' '}
          <Text style={{ color: '#D4A03C', fontWeight: '700' }}>{Math.round(totalHours)}h fasted</Text>
          {' '}across your journey. Your{' '}
          <Text style={{ color: '#2E86AB', fontWeight: '700' }}>Agni</Text>
          {' '}is blazing. 🔥
        </Text>
      ),
      tags: [
        { label: 'Deep fast unlocked', emoji: '🌙', color: '#7B68AE' },
        { label: `HGH ${hghMultiplier}×`, emoji: '⚡', color: '#E8913A' },
        ...(hasGoodStreak ? [{ label: `${streak} day streak`, emoji: '🔥', color: '#C25450' }] : []),
      ],
    };
  }

  if (hasGoodStreak) {
    return {
      quote: `"Discipline practised daily becomes dharma."`,
      body: (
        <Text style={bodyBaseStyle}>
          A{' '}
          <Text style={{ color: '#D4A03C', fontWeight: '700' }}>{streak}-fast streak</Text>
          {' '}— this is how transformation happens. Averaging{' '}
          <Text style={{ color: '#D4A03C', fontWeight: '700' }}>{avgRounded}h per fast</Text>
          , your{' '}
          <Text style={{ color: '#5B8C5A', fontWeight: '700' }}>Agni</Text>
          {' '}grows stronger each cycle. The Vedas honour this consistency as{' '}
          <Text style={{ color: '#C97B2A', fontStyle: 'italic', fontWeight: '600' }}>Niyama</Text>
          {' '}— sacred discipline. 🙏
        </Text>
      ),
      tags: [
        { label: `${streak} fast streak`, emoji: '🔥', color: '#C25450' },
        { label: 'Niyama practice', emoji: '🕉️', color: '#7B68AE' },
      ],
    };
  }

  return {
    quote: '"Every fast is a prayer your body offers to the universe."',
    body: (
      <Text style={bodyBaseStyle}>
        You have fasted{' '}
        <Text style={{ color: '#D4A03C', fontWeight: '700' }}>{Math.round(totalHours)}h</Text>
        {' '}in total, giving your{' '}
        <Text style={{ color: '#5B8C5A', fontWeight: '700' }}>Agni</Text>
        {' '}precious rest. Each fast strengthens{' '}
        <Text style={{ color: '#2E86AB', fontWeight: '700' }}>insulin sensitivity</Text>
        {' '}and deepens cellular renewal. Keep going — your{' '}
        <Text style={{ color: '#C97B2A', fontStyle: 'italic', fontWeight: '600' }}>Tapas</Text>
        {' '}is building. ✨
      </Text>
    ),
    tags: [
      { label: 'Agni resting', emoji: '🌿', color: '#5B8C5A' },
      { label: 'Journey ongoing', emoji: '✨', color: '#D4A03C' },
    ],
  };
}

const bodyBaseStyle = {
  fontSize: 14,
  lineHeight: 22,
  color: '#C8B8A2',
};

export default function AayuInsightCard({
  totalWeekFasts,
  avgFastHours,
  longestFastHours,
  totalHours,
  streak,
  autophagyCount,
}: AayuInsightCardProps) {
  const { colors } = useTheme();
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const insight = useMemo(
    () => generateInsight({ totalWeekFasts, avgFastHours, longestFastHours, totalHours, streak, autophagyCount }),
    [totalWeekFasts, avgFastHours, longestFastHours, totalHours, streak, autophagyCount]
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

  const isDark = colors.background === '#100805';
  const cardBg = isDark ? '#1A0D06' : '#2C1810';
  const quoteColor = '#D4A03C';
  const borderAccent = '#C97B2A';

  return (
    <Animated.View style={[styles.card, { backgroundColor: cardBg, opacity: fadeAnim }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Animated.View style={[styles.liveDot, { opacity: glowAnim, backgroundColor: quoteColor }]} />
          <Text style={styles.headerLabel}>AAYU INSIGHT · TODAY</Text>
        </View>
        <Text style={styles.dateLabel}>{dateLabel}</Text>
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
    borderColor: '#3D2010',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#2A1508',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#3D2010',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#9E7A50',
    letterSpacing: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#6E5540',
    fontWeight: '500' as const,
  },
  quoteBlock: {
    borderLeftWidth: 3,
    paddingLeft: 14,
    marginBottom: 14,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic' as const,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  body: {
    marginBottom: 16,
  },
  tagsRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
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
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
});
