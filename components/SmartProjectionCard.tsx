// components/SmartProjectionCard.tsx
// Real-time weight forecast card for the Insights tab (Pro feature).
// Shows personalised projection based on actual logged data.

import { fs } from '@/constants/theme';
import React, { useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import Svg, { Path, Circle as SvgCircle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { TrendingDown, Lock, Target, ChevronRight, Zap, FlaskConical } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { SmartProjection } from '@/utils/smart-projection';
import type { ColorScheme } from '@/constants/colors';

// ─── Mini spark chart ─────────────────────────────────────────────────────────

const ProjectionChart: React.FC<{
  data: number[];
  goalKg: number;
  colors: ColorScheme;
  isDark: boolean;
}> = ({ data, goalKg, colors, isDark }) => {
  if (data.length < 2) return null;

  const W = 280;
  const H = 80;
  const PAD_X = 8;
  const PAD_Y = 8;

  const allValues = [...data, goalKg];
  const minV = Math.min(...allValues) - 1;
  const maxV = Math.max(...allValues) + 1;

  const scaleX = (i: number) => PAD_X + (i / (data.length - 1)) * (W - PAD_X * 2);
  const scaleY = (v: number) => PAD_Y + ((maxV - v) / (maxV - minV)) * (H - PAD_Y * 2);

  // Build path
  const points = data.map((v, i) => ({ x: scaleX(i), y: scaleY(v) }));
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    pathD += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  // Area fill
  const areaD = `${pathD} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`;

  const goalY = scaleY(goalKg);
  const lineColor = isDark ? '#7AAE79' : '#3a7a39';
  const goalColor = isDark ? 'rgba(122,174,121,0.4)' : 'rgba(58,122,57,0.3)';

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <LinearGradient id="projFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={lineColor} stopOpacity="0.15" />
          <Stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
        </LinearGradient>
      </Defs>

      {/* Goal line */}
      <Line
        x1={PAD_X} y1={goalY} x2={W - PAD_X} y2={goalY}
        stroke={goalColor} strokeWidth={1} strokeDasharray="4,3"
      />
      <SvgText x={W - PAD_X - 2} y={goalY - 4} fontSize={9} fill={goalColor} textAnchor="end">
        Goal
      </SvgText>

      {/* Area fill */}
      <Path d={areaD} fill="url(#projFill)" />

      {/* Line */}
      <Path d={pathD} fill="none" stroke={lineColor} strokeWidth={2} strokeLinecap="round" />

      {/* Start dot */}
      <SvgCircle cx={points[0].x} cy={points[0].y} r={3.5} fill={lineColor} />

      {/* End dot (goal) */}
      <SvgCircle
        cx={points[points.length - 1].x} cy={points[points.length - 1].y}
        r={4} fill={colors.background} stroke={lineColor} strokeWidth={2}
      />
    </Svg>
  );
};

// ─── Confidence bar ───────────────────────────────────────────────────────────

const ConfidenceBar: React.FC<{ confidence: number; colors: ColorScheme }> = ({ confidence, colors }) => {
  const barAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(barAnim, { toValue: confidence / 100, duration: 800, delay: 400, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [confidence]);

  const label = confidence >= 75 ? 'High' : confidence >= 45 ? 'Medium' : 'Low';
  const barColor = confidence >= 75 ? colors.success : confidence >= 45 ? colors.warning : colors.textMuted;

  return (
    <View style={confS.row}>
      <Text style={[confS.label, { color: colors.textMuted }]}>Confidence</Text>
      <View style={[confS.track, { backgroundColor: colors.surface }]}>
        <Animated.View style={[confS.fill, { backgroundColor: barColor, width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
      </View>
      <Text style={[confS.value, { color: barColor }]}>{label}</Text>
    </View>
  );
};

const confS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 } as ViewStyle,
  label: { fontSize: fs(11), fontWeight: '500', width: 68 } as TextStyle,
  track: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' } as ViewStyle,
  fill: { height: '100%' as any, borderRadius: 2 } as ViewStyle,
  value: { fontSize: fs(11), fontWeight: '600', width: 48, textAlign: 'right' } as TextStyle,
});

// ─── Progress toward goal ─────────────────────────────────────────────────────

const ProgressRow: React.FC<{
  startKg: number;
  currentKg: number;
  goalKg: number;
  progressPct: number;
  weightUnit: string;
  colors: ColorScheme;
}> = ({ startKg, currentKg, goalKg, progressPct, weightUnit, colors }) => {
  const fmt = (kg: number) => weightUnit === 'lbs' ? `${Math.round(kg * 2.20462)}` : `${kg.toFixed(1)}`;
  const unit = weightUnit === 'lbs' ? 'lbs' : 'kg';
  const lost = startKg - currentKg;

  return (
    <View style={progS.container}>
      <View style={progS.labelRow}>
        <Text style={[progS.lost, { color: colors.success }]}>
          {lost > 0 ? `${fmt(lost)} ${unit} lost` : 'Getting started'}
        </Text>
        <Text style={[progS.remaining, { color: colors.textMuted }]}>
          {fmt(currentKg - goalKg)} {unit} to go
        </Text>
      </View>
      <View style={[progS.track, { backgroundColor: colors.surface }]}>
        <Animated.View style={[progS.fill, { backgroundColor: colors.success, width: `${Math.min(100, progressPct)}%` }]} />
      </View>
      <View style={progS.kgRow}>
        <Text style={[progS.kgLabel, { color: colors.textMuted }]}>{fmt(startKg)}</Text>
        <Text style={[progS.kgLabel, { color: colors.text, fontWeight: '700' }]}>{fmt(currentKg)}</Text>
        <Text style={[progS.kgLabel, { color: colors.success }]}>{fmt(goalKg)}</Text>
      </View>
    </View>
  );
};

const progS = StyleSheet.create({
  container: { marginTop: 12 } as ViewStyle,
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 } as ViewStyle,
  lost: { fontSize: fs(12), fontWeight: '600' } as TextStyle,
  remaining: { fontSize: fs(11) } as TextStyle,
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 4 } as ViewStyle,
  fill: { height: '100%' as any, borderRadius: 3 } as ViewStyle,
  kgRow: { flexDirection: 'row', justifyContent: 'space-between' } as ViewStyle,
  kgLabel: { fontSize: fs(10) } as TextStyle,
});

// ─── Locked state (free users) ────────────────────────────────────────────────

export const SmartProjectionLocked: React.FC<{
  teaser: string;
  colors: ColorScheme;
  isDark: boolean;
}> = ({ teaser, colors, isDark }) => (
  <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
    <View style={s.headerRow}>
      <View style={s.headerLeft}>
        <TrendingDown size={16} color="#7AAE79" />
        <Text style={[s.title, { color: colors.text }]}>Weight Forecast</Text>
      </View>
      <View style={s.proBadge}>
        <Lock size={9} color="#e8a84c" />
        <Text style={s.proText}>PRO</Text>
      </View>
    </View>

    {/* Blurred preview */}
    <View style={[s.lockedPreview, { backgroundColor: isDark ? 'rgba(122,174,121,0.04)' : 'rgba(58,122,57,0.03)' }]}>
      <View style={s.lockedChart}>
        <TrendingDown size={32} color={colors.textMuted} style={{ opacity: 0.15 }} />
      </View>
      <View style={s.lockedOverlay}>
        <Lock size={20} color={colors.textMuted} />
        <Text style={[s.lockedTitle, { color: colors.text }]}>Smart Weight Projection</Text>
        <Text style={[s.lockedText, { color: colors.textMuted }]}>{teaser}</Text>
      </View>
    </View>

    <Text style={[s.lockedSubtext, { color: colors.textMuted }]}>
      Powered by your real fasting, weight, and activity data
    </Text>
  </View>
);

// ─── Not-yet-eligible state (Pro but insufficient data) ───────────────────────

export const SmartProjectionBuilding: React.FC<{
  teaser: string;
  logsNeeded?: number;
  daysNeeded?: number;
  colors: ColorScheme;
}> = ({ teaser, logsNeeded, daysNeeded, colors }) => (
  <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
    <View style={s.headerRow}>
      <View style={s.headerLeft}>
        <TrendingDown size={16} color="#7AAE79" />
        <Text style={[s.title, { color: colors.text }]}>Weight Forecast</Text>
      </View>
      <View style={[s.proBadge, { backgroundColor: 'rgba(122,174,121,0.12)' }]}>
        <Zap size={9} color="#7AAE79" />
        <Text style={[s.proText, { color: '#7AAE79' }]}>BUILDING</Text>
      </View>
    </View>

    <View style={[s.buildingContent, { backgroundColor: colors.surface }]}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(122,174,121,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <FlaskConical size={18} color="#7AAE79" />
      </View>
      <Text style={[s.buildingTitle, { color: colors.text }]}>Collecting your data</Text>
      <Text style={[s.buildingText, { color: colors.textMuted }]}>{teaser}</Text>

      {(logsNeeded || daysNeeded) && (
        <View style={s.buildingStats}>
          {logsNeeded != null && logsNeeded > 0 && (
            <View style={[s.buildingStat, { borderColor: colors.borderLight }]}>
              <Text style={[s.buildingStatVal, { color: colors.text }]}>{logsNeeded}</Text>
              <Text style={[s.buildingStatLabel, { color: colors.textMuted }]}>weight logs needed</Text>
            </View>
          )}
          {daysNeeded != null && daysNeeded > 0 && (
            <View style={[s.buildingStat, { borderColor: colors.borderLight }]}>
              <Text style={[s.buildingStatVal, { color: colors.text }]}>{daysNeeded}</Text>
              <Text style={[s.buildingStatLabel, { color: colors.textMuted }]}>more days of data</Text>
            </View>
          )}
        </View>
      )}
    </View>
  </View>
);

// ─── Active projection (Pro + enough data) ───────────────────────────────────

export const SmartProjectionActive: React.FC<{
  projection: SmartProjection;
  weightUnit: string;
  colors: ColorScheme;
  isDark: boolean;
}> = ({ projection, weightUnit, colors, isDark }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const fmt = (kg: number) => weightUnit === 'lbs' ? `${Math.round(kg * 2.20462)}` : `${kg.toFixed(1)}`;
  const unit = weightUnit === 'lbs' ? 'lbs' : 'kg';
  const rateStr = weightUnit === 'lbs'
    ? `${(projection.actualKgPerWeek * 2.20462).toFixed(1)} ${unit}/week`
    : `${projection.actualKgPerWeek.toFixed(1)} ${unit}/week`;

  return (
    <Animated.View style={[s.card, { opacity: fadeAnim, backgroundColor: colors.card, borderColor: isDark ? 'rgba(122,174,121,0.2)' : 'rgba(58,122,57,0.15)' }]}>
      <View style={s.headerRow}>
        <View style={s.headerLeft}>
          <TrendingDown size={16} color="#7AAE79" />
          <Text style={[s.title, { color: colors.text }]}>Weight Forecast</Text>
        </View>
        <View style={[s.liveBadge, { backgroundColor: isDark ? 'rgba(122,174,121,0.12)' : 'rgba(58,122,57,0.1)' }]}>
          <View style={[s.liveDot, { backgroundColor: '#7AAE79' }]} />
          <Text style={[s.liveText, { color: '#7AAE79' }]}>LIVE</Text>
        </View>
      </View>

      {/* Hero stats */}
      <View style={s.heroRow}>
        <View style={s.heroStat}>
          <Text style={[s.heroValue, { color: colors.success }]}>
            ~{projection.weeksToGoal}
          </Text>
          <Text style={[s.heroLabel, { color: colors.textMuted }]}>weeks to goal</Text>
        </View>
        <View style={[s.heroDivider, { backgroundColor: colors.borderLight }]} />
        <View style={s.heroStat}>
          <Text style={[s.heroValue, { color: colors.text }]}>{rateStr}</Text>
          <Text style={[s.heroLabel, { color: colors.textMuted }]}>your pace</Text>
        </View>
        {projection.isAccelerating && (
          <>
            <View style={[s.heroDivider, { backgroundColor: colors.borderLight }]} />
            <View style={s.heroStat}>
              <Text style={[s.heroValue, { color: colors.success }]}>▲</Text>
              <Text style={[s.heroLabel, { color: colors.success }]}>accelerating</Text>
            </View>
          </>
        )}
      </View>

      {/* Chart */}
      {projection.projectedWeeklyKg.length >= 2 && (
        <View style={s.chartWrap}>
          <ProjectionChart
            data={projection.projectedWeeklyKg}
            goalKg={projection.goalKg}
            colors={colors}
            isDark={isDark}
          />
        </View>
      )}

      {/* Progress */}
      <ProgressRow
        startKg={projection.startKg}
        currentKg={projection.currentKg}
        goalKg={projection.goalKg}
        progressPct={projection.progressPct}
        weightUnit={weightUnit}
        colors={colors}
      />

      {/* Confidence */}
      <ConfidenceBar confidence={projection.confidence} colors={colors} />

      {/* Insight */}
      <Text style={[s.insight, { color: colors.textSecondary }]}>
        {projection.insight}
      </Text>

      {/* Disclaimer */}
      <Text style={[s.disclaimer, { color: colors.textMuted }]}>
        Based on {projection.dataPointCount} weight logs over {projection.dataSpanDays} days. Updates with each new log.
      </Text>
    </Animated.View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 } as ViewStyle,
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } as ViewStyle,
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 } as ViewStyle,
  title: { fontSize: fs(15), fontWeight: '700' } as TextStyle,
  proBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(232,168,76,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 } as ViewStyle,
  proText: { fontSize: fs(9), fontWeight: '800', color: '#e8a84c', letterSpacing: 0.8 } as TextStyle,
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 } as ViewStyle,
  liveDot: { width: 6, height: 6, borderRadius: 3 } as ViewStyle,
  liveText: { fontSize: fs(9), fontWeight: '800', letterSpacing: 0.8 } as TextStyle,

  // Hero stats
  heroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 } as ViewStyle,
  heroStat: { flex: 1, alignItems: 'center' } as ViewStyle,
  heroValue: { fontSize: fs(20), fontWeight: '700', letterSpacing: -0.3 } as TextStyle,
  heroLabel: { fontSize: fs(10), fontWeight: '500', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 } as TextStyle,
  heroDivider: { width: 1, height: 28, marginHorizontal: 4 } as ViewStyle,

  // Chart
  chartWrap: { alignItems: 'center', marginBottom: 4 } as ViewStyle,

  // Insight
  insight: { fontSize: fs(12), lineHeight: 17, marginTop: 10 } as TextStyle,
  disclaimer: { fontSize: fs(10), lineHeight: 14, marginTop: 8, fontStyle: 'italic' } as TextStyle,

  // Locked
  lockedPreview: { borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 8, minHeight: 100 } as ViewStyle,
  lockedChart: { marginBottom: 8 } as ViewStyle,
  lockedOverlay: { alignItems: 'center' } as ViewStyle,
  lockedTitle: { fontSize: fs(14), fontWeight: '600', marginTop: 8, marginBottom: 4 } as TextStyle,
  lockedText: { fontSize: fs(12), textAlign: 'center', lineHeight: 17, paddingHorizontal: 16 } as TextStyle,
  lockedSubtext: { fontSize: fs(11), textAlign: 'center' } as TextStyle,

  // Building
  buildingContent: { borderRadius: 12, padding: 16, alignItems: 'center' } as ViewStyle,
  buildingTitle: { fontSize: fs(14), fontWeight: '600', marginBottom: 4 } as TextStyle,
  buildingText: { fontSize: fs(12), textAlign: 'center', lineHeight: 17, marginBottom: 12 } as TextStyle,
  buildingStats: { flexDirection: 'row', gap: 12 } as ViewStyle,
  buildingStat: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, borderWidth: 1 } as ViewStyle,
  buildingStatVal: { fontSize: fs(20), fontWeight: '700' } as TextStyle,
  buildingStatLabel: { fontSize: fs(10), marginTop: 2, textAlign: 'center' } as TextStyle,
});
