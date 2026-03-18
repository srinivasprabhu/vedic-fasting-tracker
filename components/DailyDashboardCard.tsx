// components/DailyDashboardCard.tsx
// Compact plan summary + tracker rows shown on home screen.
// Taps on each row navigate to the full tracker screen.

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import { router } from 'expo-router';
import { Droplets, Footprints, Scale, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { formatWater, formatSteps } from '@/utils/calculatePlan';
import type { ColorScheme } from '@/constants/colors';

// ─── Animated progress bar ────────────────────────────────────────────────────

const ProgressBar: React.FC<{
  pct:   number;   // 0–100
  color: string;
  bg:    string;
}> = ({ pct, color, bg }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(pct / 100, 1),
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={[pb.track, { backgroundColor: bg }]}>
      <Animated.View style={[
        pb.fill,
        {
          width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          backgroundColor: color,
        },
      ]} />
    </View>
  );
};

const pb = StyleSheet.create({
  track: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' as const },
  fill:  { height: '100%' as any, borderRadius: 2 },
});

// ─── Single tracker row ───────────────────────────────────────────────────────

const TrackerRow: React.FC<{
  icon:     React.ReactNode;
  label:    string;
  current:  string;
  target:   string;
  pct:      number;
  color:    string;
  trackBg:  string;
  onPress:  () => void;
  colors:   ColorScheme;
  delay:    number;
}> = ({ icon, label, current, target, pct, color, trackBg, onPress, colors, delay }) => {
  const opac  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opac,  { toValue: 1, duration: 340, delay, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 320, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const pctLabel = pct >= 100 ? '✓' : `${Math.round(pct)}%`;
  const pctColor = pct >= 100 ? colors.success : pct >= 60 ? colors.warning : colors.textMuted;

  return (
    <Animated.View style={{ opacity: opac, transform: [{ translateY: slide }] }}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.72}
        style={[row.wrap, {
          borderBottomColor: colors.borderLight,
        }]}
      >
        {/* Icon */}
        <View style={[row.iconWrap, { backgroundColor: color + '18' }]}>
          {icon}
        </View>

        {/* Label + bar */}
        <View style={row.middle}>
          <View style={row.topLine}>
            <Text style={[row.label, { color: colors.textSecondary }]}>{label}</Text>
            <Text style={[row.pct, { color: pctColor }]}>{pctLabel}</Text>
          </View>
          <View style={row.barRow}>
            <ProgressBar pct={pct} color={color} bg={trackBg} />
            <Text style={[row.values, { color: colors.textMuted }]}>
              {current} / {target}
            </Text>
          </View>
        </View>

        {/* Chevron */}
        <ChevronRight size={14} color={colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const row = StyleSheet.create({
  wrap:    {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  }                                                              as ViewStyle,
  iconWrap:{ width: 32, height: 32, borderRadius: 10, alignItems: 'center' as const, justifyContent: 'center' as const } as ViewStyle,
  middle:  { flex: 1, gap: 5 }                                  as ViewStyle,
  topLine: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const } as ViewStyle,
  label:   { fontSize: 12, fontWeight: '500' as const }          as TextStyle,
  pct:     { fontSize: 11, fontWeight: '600' as const }          as TextStyle,
  barRow:  { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 } as ViewStyle,
  values:  { fontSize: 10, minWidth: 60, textAlign: 'right' as const } as TextStyle,
});

// ─── Plan summary pill row ────────────────────────────────────────────────────

const PlanPill: React.FC<{
  emoji: string;
  label: string;
  colors: ColorScheme;
}> = ({ emoji, label, colors }) => (
  <View style={[pill.wrap, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
    <Text style={pill.emoji}>{emoji}</Text>
    <Text style={[pill.label, { color: colors.textSecondary }]}>{label}</Text>
  </View>
);

const pill = StyleSheet.create({
  wrap:  { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 } as ViewStyle,
  emoji: { fontSize: 12 }                                        as TextStyle,
  label: { fontSize: 11, fontWeight: '500' as const }            as TextStyle,
});

// ─── Main component ───────────────────────────────────────────────────────────

interface DailyDashboardCardProps {
  // Pass in today's logged values — will be 0 if user hasn't logged yet
  waterLoggedMl: number;
  stepsLogged:   number;
  weightKg:      number | null;
}

export const DailyDashboardCard: React.FC<DailyDashboardCardProps> = ({
  waterLoggedMl,
  stepsLogged,
  weightKg,
}) => {
  const { colors, isDark } = useTheme();
  const { profile } = useUserProfile();

  const plan    = profile?.plan;
  const hasPlan = !!(plan?.fastHours);

  // If user has no plan, don't render
  if (!hasPlan) return null;

  const waterTarget  = plan!.dailyWaterMl;
  const stepsTarget  = plan!.dailySteps;
  const waterPct     = waterTarget > 0 ? (waterLoggedMl / waterTarget) * 100 : 0;
  const stepsPct     = stepsTarget > 0 ? (stepsLogged / stepsTarget) * 100 : 0;

  const goalKg       = profile?.goalWeightKg ?? null;
  const currentKg    = weightKg ?? profile?.currentWeightKg ?? null;
  const weightDisplay = currentKg ? `${currentKg.toFixed(1)} kg` : '—';
  const goalDisplay   = goalKg ? `${goalKg.toFixed(1)} kg` : 'No goal';

  // Weight progress toward goal
  const startKg  = profile?.currentWeightKg ?? currentKg ?? 0;
  const weightPct = (goalKg && currentKg && startKg > goalKg)
    ? Math.min(100, Math.max(0, ((startKg - currentKg) / (startKg - goalKg)) * 100))
    : 0;

  // Color tokens
  const waterColor = '#5b8dd9';
  const stepsColor = colors.success;
  const weightColor = isDark ? '#e8a84c' : '#a06820';
  const trackBg    = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const cardAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(cardAnim, { toValue: 1, duration: 480, delay: 100, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: cardAnim }}>
      <View style={[card.wrap, {
        backgroundColor: colors.card,
        borderColor: colors.borderLight,
      }]}>
        {/* Header */}
        <View style={card.header}>
          <Text style={[card.title, { color: colors.text }]}>Today's targets</Text>
          {plan?.fastLabel && (
            <View style={card.pills}>
              <PlanPill emoji="⏱️" label={plan.fastLabel} colors={colors} />
            </View>
          )}
        </View>

        {/* Tracker rows */}
        <TrackerRow
          icon={<Droplets size={16} color={waterColor} />}
          label="Water"
          current={formatWater(waterLoggedMl)}
          target={formatWater(waterTarget)}
          pct={waterPct}
          color={waterColor}
          trackBg={trackBg}
          onPress={() => router.push('/(tabs)/(home)/water' as any)}
          colors={colors}
          delay={60}
        />
        <TrackerRow
          icon={<Footprints size={16} color={stepsColor} />}
          label="Steps"
          current={stepsLogged >= 1000 ? `${(stepsLogged / 1000).toFixed(1)}k` : String(stepsLogged)}
          target={formatSteps(stepsTarget)}
          pct={stepsPct}
          color={stepsColor}
          trackBg={trackBg}
          onPress={() => router.push('/(tabs)/(home)/steps' as any)}
          colors={colors}
          delay={110}
        />
        <View style={{ borderBottomWidth: 0 }}>
          <TrackerRow
            icon={<Scale size={16} color={weightColor} />}
            label="Weight"
            current={weightDisplay}
            target={goalDisplay}
            pct={weightPct}
            color={weightColor}
            trackBg={trackBg}
            onPress={() => router.push('/(tabs)/(home)/weight' as any)}
            colors={colors}
            delay={160}
          />
        </View>
      </View>
    </Animated.View>
  );
};

const card = StyleSheet.create({
  wrap:   {
    borderRadius: 16, borderWidth: 1,
    padding: 14, marginBottom: 20,
  }                                                              as ViewStyle,
  header: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    justifyContent: 'space-between' as const, marginBottom: 4,
  }                                                              as ViewStyle,
  title:  { fontSize: 14, fontWeight: '600' as const }          as TextStyle,
  pills:  { flexDirection: 'row' as const, gap: 6 }             as ViewStyle,
});
