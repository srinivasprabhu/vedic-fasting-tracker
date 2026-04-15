import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import {
  Clock, Droplet, Footprints, Check, Zap, Sunrise, Star,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { fs, RADIUS } from '@/constants/theme';
import { hexAlpha, type ColorScheme } from '@/constants/colors';
import { formatWater } from '@/utils/calculatePlan';
import type { YesterdayData } from '@/utils/yesterdayData';

export type { YesterdayData };

interface YesterdayCardProps {
  data: YesterdayData;
}

function formatFastHours(h: number): string {
  if (h <= 0) return '0m';
  return h >= 1 ? `${Math.round(h * 10) / 10}h` : `${Math.round(h * 60)}m`;
}

function formatWaterShort(ml: number): string {
  return ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml`;
}

function formatStepsShort(steps: number): string {
  return steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : String(steps);
}

type NudgeIcon = 'zap' | 'droplet' | 'sunrise' | 'star';

function generateNudge(
  data: YesterdayData,
  colors: ColorScheme,
): { headline: string; body: string; icon: NudgeIcon; accentColor: string } {
  const {
    fastHours,
    fastCompleted,
    didFast,
    waterMl,
    steps,
    waterTarget,
    stepsTarget,
    fastTargetHours,
    streak,
  } = data;

  const waterRatio = waterTarget > 0 ? waterMl / waterTarget : 0;
  const stepsRatio = stepsTarget > 0 ? steps / stepsTarget : 0;
  const waterPct = waterRatio * 100;

  const waterFormatted = formatWaterShort(waterMl);
  const waterTargetFormatted = formatWater(waterTarget);
  const stepsFormatted = formatStepsShort(steps);
  const fastDisplay = formatFastHours(fastHours);

  if (fastCompleted && waterRatio >= 0.9 && stepsRatio >= 0.8) {
    return {
      headline: 'Strong day yesterday',
      body:
        `You hit your fasting and water targets. ${streak > 1
          ? `Keep your ${streak}-day streak alive tonight.`
          : 'Build on this momentum tonight.'}`,
      icon: 'zap',
      accentColor: colors.success,
    };
  }

  if (fastCompleted && waterRatio < 0.6) {
    return {
      headline: 'Great fast, hydration needs a boost',
      body:
        `You fasted ${fastDisplay} but only drank ${waterFormatted}. Aim for ${waterTargetFormatted} today — hydration supports longer fasts.`,
      icon: 'droplet',
      accentColor: colors.hydration,
    };
  }

  if (fastCompleted && stepsRatio < 0.5) {
    return {
      headline: 'Solid fast, let\'s move more today',
      body:
        `Your ${fastDisplay} fast was on point. Adding more movement today can amplify fat oxidation during your next window.`,
      icon: 'zap',
      accentColor: colors.success,
    };
  }

  if (didFast && !fastCompleted) {
    return {
      headline: 'Keep building the habit',
      body:
        `Your ${fastDisplay} fast was short of your goal. Aim for a full ${fastTargetHours}h window tonight.`,
      icon: 'sunrise',
      accentColor: colors.primary,
    };
  }

  if (fastCompleted) {
    return {
      headline: `${fastDisplay} fast completed`,
      body:
        `Every completed window supports insulin sensitivity and metabolic flexibility. ${streak > 1 ? `${streak} days strong.` : 'Keep going.'}`,
      icon: 'star',
      accentColor: colors.primary,
    };
  }

  const noFastButPositive =
    !didFast
    && (stepsRatio >= 0.4 || waterRatio >= 0.5 || steps >= 3000 || waterMl >= 1200);

  if (!didFast && noFastButPositive) {
    const body =
      steps >= 500
        ? `You still hit ${stepsFormatted} steps${waterPct >= 80 ? ' and stayed hydrated' : ''}. Ready for a fresh fast tonight.`
        : waterRatio >= 0.5
          ? `You still logged ${waterFormatted}. Ready for a fresh fast tonight.`
          : `You still hit ${stepsFormatted} steps. Ready for a fresh fast tonight.`;
    return {
      headline: 'Rest days build resilience',
      body,
      icon: 'sunrise',
      accentColor: colors.primary,
    };
  }

  return {
    headline: 'Today is a fresh page',
    body:
      `One slow day doesn't undo your progress. Start small — a glass of water and a ${fastTargetHours}h fast tonight.`,
    icon: 'sunrise',
    accentColor: colors.primary,
  };
}

function NudgeIconView({ name, color }: { name: NudgeIcon; color: string }) {
  const size = 16;
  switch (name) {
    case 'zap':
      return <Zap size={size} color={color} strokeWidth={2.2} />;
    case 'droplet':
      return <Droplet size={size} color={color} strokeWidth={2.2} />;
    case 'sunrise':
      return <Sunrise size={size} color={color} strokeWidth={2.2} />;
    case 'star':
      return <Star size={size} color={color} strokeWidth={2.2} />;
    default:
      return <Sunrise size={size} color={color} strokeWidth={2.2} />;
  }
}

export default function YesterdayCard({ data }: YesterdayCardProps) {
  const { colors, isDark } = useTheme();
  const nudge = useMemo(() => generateNudge(data, colors), [data, colors]);

  const waterHit = data.waterTarget > 0 && data.waterMl >= data.waterTarget * 0.9;
  const stepsHit = data.stepsTarget > 0 && data.steps >= data.stepsTarget * 0.8;

  const borderColor = isDark ? '#3D2010' : colors.border;
  const cardBg = isDark ? '#1A0D06' : colors.surfaceWarm;

  const a11yYesterday = data.didFast
    ? `fasted ${formatFastHours(data.fastHours)}`
    : 'did not complete a fast';
  const waterA11y = data.waterMl >= 1000
    ? `${(data.waterMl / 1000).toFixed(1)} litres`
    : `${data.waterMl} millilitres`;
  const stepsA11y = data.steps >= 1000 ? `${Math.round(data.steps / 100) / 10} thousand` : String(data.steps);

  return (
    <View
      style={[styles.card, {
        borderRadius: RADIUS.lg,
        borderColor,
        backgroundColor: cardBg,
      }]}
      accessibilityLabel={`Yesterday: ${a11yYesterday}, drank ${waterA11y}, ${stepsA11y} steps`}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.eyebrow, { color: colors.textMuted }]}>YESTERDAY</Text>
        <Text style={[styles.dateText, { color: colors.textSecondary }]}>{data.dateLabel}</Text>
      </View>

      <View style={styles.chipsRow}>
        <View
          style={[
            styles.chip,
            {
              backgroundColor: hexAlpha(colors.text, 0.025),
              borderColor: hexAlpha(colors.text, 0.05),
              opacity: data.didFast ? 1 : 0.5,
            },
          ]}
          accessibilityElementsHidden={true}
        >
          {data.fastCompleted && (
            <View style={[styles.chipBadge, { backgroundColor: hexAlpha(colors.success, 0.15) }]}>
              <Check size={7} color={colors.success} strokeWidth={3} />
            </View>
          )}
          <View style={[styles.chipIconCircle, { backgroundColor: hexAlpha(colors.text, 0.06) }]}>
            <Clock size={12} color={colors.textSecondary} strokeWidth={2} />
          </View>
          <Text
            style={[
              styles.chipValue,
              { color: data.didFast ? colors.text : hexAlpha(colors.text, 0.25) },
              !data.didFast && styles.chipValueRest,
            ]}
            numberOfLines={1}
          >
            {data.didFast ? formatFastHours(data.fastHours) : 'Rest day'}
          </Text>
          <Text style={[styles.chipLabel, { color: colors.textMuted }]}>FASTING</Text>
        </View>

        <View
          style={[styles.chip, { backgroundColor: hexAlpha(colors.text, 0.025), borderColor: hexAlpha(colors.text, 0.05) }]}
          accessibilityElementsHidden={true}
        >
          {waterHit && (
            <View style={[styles.chipBadge, { backgroundColor: hexAlpha(colors.success, 0.15) }]}>
              <Check size={7} color={colors.success} strokeWidth={3} />
            </View>
          )}
          <View style={[styles.chipIconCircle, { backgroundColor: hexAlpha(colors.text, 0.06) }]}>
            <Droplet size={12} color={colors.hydration} strokeWidth={2} />
          </View>
          <Text style={[styles.chipValue, { color: colors.text }]} numberOfLines={1}>
            {formatWaterShort(data.waterMl)}
          </Text>
          <Text style={[styles.chipLabel, { color: colors.textMuted }]}>WATER</Text>
        </View>

        <View
          style={[styles.chip, { backgroundColor: hexAlpha(colors.text, 0.025), borderColor: hexAlpha(colors.text, 0.05) }]}
          accessibilityElementsHidden={true}
        >
          {stepsHit && (
            <View style={[styles.chipBadge, { backgroundColor: hexAlpha(colors.success, 0.15) }]}>
              <Check size={7} color={colors.success} strokeWidth={3} />
            </View>
          )}
          <View style={[styles.chipIconCircle, { backgroundColor: hexAlpha(colors.text, 0.06) }]}>
            <Footprints size={12} color={colors.success} strokeWidth={2} />
          </View>
          <Text style={[styles.chipValue, { color: colors.text }]} numberOfLines={1}>
            {formatStepsShort(data.steps)}
          </Text>
          <Text style={[styles.chipLabel, { color: colors.textMuted }]}>STEPS</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: hexAlpha(colors.text, 0.04) }]} />

      <View style={styles.nudgeRow}>
        <View style={[styles.nudgeIconCircle, { backgroundColor: hexAlpha(nudge.accentColor, 0.18) }]}>
          <NudgeIconView name={nudge.icon} color={nudge.accentColor} />
        </View>
        <View style={styles.nudgeTextCol}>
          <Text style={[styles.nudgeHeadline, { color: colors.text }]}>{nudge.headline}</Text>
          <Text style={[styles.nudgeBody, { color: colors.textSecondary }]}>{nudge.body}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  } as ViewStyle,
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  } as ViewStyle,
  eyebrow: {
    fontSize: fs(10),
    fontWeight: '600',
    letterSpacing: 1.2,
  } as TextStyle,
  dateText: {
    fontSize: fs(12),
    fontWeight: '500',
  } as TextStyle,
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
  } as ViewStyle,
  chip: {
    flex: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    position: 'relative',
  } as ViewStyle,
  chipBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  } as ViewStyle,
  chipIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  } as ViewStyle,
  chipValue: {
    fontSize: fs(14),
    fontWeight: '700',
  } as TextStyle,
  chipValueRest: {
    fontSize: fs(11),
    fontWeight: '600',
  } as TextStyle,
  chipLabel: {
    fontSize: fs(8),
    fontWeight: '600',
    letterSpacing: 0.6,
    marginTop: 2,
    textTransform: 'uppercase',
  } as TextStyle,
  divider: {
    height: 1,
    marginVertical: 10,
  } as ViewStyle,
  nudgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  } as ViewStyle,
  nudgeIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  nudgeTextCol: {
    flex: 1,
    minWidth: 0,
  } as ViewStyle,
  nudgeHeadline: {
    fontSize: fs(13),
    fontWeight: '600',
    lineHeight: fs(18),
  } as TextStyle,
  nudgeBody: {
    fontSize: fs(11),
    fontWeight: '400',
    lineHeight: fs(16),
    marginTop: 4,
  } as TextStyle,
});
