// WeightProjectionChart — SVG projected weight curve for the plan reveal screen
import React, { useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing,
  ViewStyle, TextStyle,
} from 'react-native';
import Svg, {
  Path, Defs, LinearGradient as SvgLinearGradient,
  Stop, Circle, Line, Text as SvgText,
} from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS } from '@/constants/theme';

interface Props {
  currentWeightKg: number;
  goalWeightKg:    number;
  weeksToGoal:     number;
  weightUnit:      string;        // 'kg' or 'lbs'
  delay?:          number;
}

// ─── Chart dimensions ─────────────────────────────────────────────────────────

const CHART_W  = 300;
const CHART_H  = 140;
const PAD_L    = 40;   // left padding for Y-axis labels
const PAD_R    = 16;
const PAD_T    = 16;
const PAD_B    = 28;   // bottom padding for X-axis labels
const PLOT_W   = CHART_W - PAD_L - PAD_R;
const PLOT_H   = CHART_H - PAD_T - PAD_B;

// ─── Generate non-linear weight projection points ─────────────────────────────
// Models faster initial loss that tapers — more realistic than linear.

function generateProjection(
  startKg: number,
  endKg:   number,
  weeks:   number,
  numPoints: number = 20,
): { week: number; weight: number }[] {
  const points: { week: number; weight: number }[] = [];
  const totalLoss = startKg - endKg;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // Ease-out curve: faster loss initially, tapering later
    const easedT = 1 - Math.pow(1 - t, 1.8);
    const week   = Math.round(t * weeks);
    const weight = Math.round((startKg - totalLoss * easedT) * 10) / 10;
    points.push({ week, weight });
  }

  return points;
}

// ─── Build SVG path from points ───────────────────────────────────────────────

function buildCurvePath(
  points: { week: number; weight: number }[],
  minW: number, maxW: number, maxWeek: number,
): string {
  const toX = (week: number) => PAD_L + (week / maxWeek) * PLOT_W;
  const toY = (weight: number) => PAD_T + ((maxW - weight) / (maxW - minW)) * PLOT_H;

  if (points.length < 2) return '';

  let d = `M ${toX(points[0].week)} ${toY(points[0].weight)}`;

  // Smooth cubic bezier through points
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX  = (toX(prev.week) + toX(curr.week)) / 2;
    d += ` C ${cpX} ${toY(prev.weight)}, ${cpX} ${toY(curr.weight)}, ${toX(curr.week)} ${toY(curr.weight)}`;
  }

  return d;
}

function buildAreaPath(
  points: { week: number; weight: number }[],
  minW: number, maxW: number, maxWeek: number,
): string {
  const toX = (week: number) => PAD_L + (week / maxWeek) * PLOT_W;
  const toY = (weight: number) => PAD_T + ((maxW - weight) / (maxW - minW)) * PLOT_H;
  const bottomY = PAD_T + PLOT_H;

  const curvePath = buildCurvePath(points, minW, maxW, maxWeek);
  const lastPt = points[points.length - 1];
  const firstPt = points[0];

  return `${curvePath} L ${toX(lastPt.week)} ${bottomY} L ${toX(firstPt.week)} ${bottomY} Z`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const WeightProjectionChart: React.FC<Props> = ({
  currentWeightKg, goalWeightKg, weeksToGoal, weightUnit, delay = 0,
}) => {
  const { isDark } = useTheme();

  const opac  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opac,  { toValue: 1, duration: 420, delay, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 400, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const { points, minW, maxW, milestones, xLabels } = useMemo(() => {
    const pts = generateProjection(currentWeightKg, goalWeightKg, weeksToGoal);

    // Y-axis range with padding
    const padding = Math.max(1, (currentWeightKg - goalWeightKg) * 0.15);
    const mn = Math.floor(goalWeightKg - padding);
    const mx = Math.ceil(currentWeightKg + padding);

    // Milestone dots at 25%, 50%, 75%
    const ms = [0.25, 0.5, 0.75].map(pct => {
      const idx = Math.round(pct * (pts.length - 1));
      return pts[idx];
    });

    // X-axis labels (start, mid, end)
    const midWeek = Math.round(weeksToGoal / 2);
    const xLbls = [
      { week: 0,            label: 'Now' },
      { week: midWeek,      label: `Wk ${midWeek}` },
      { week: weeksToGoal,  label: `Wk ${weeksToGoal}` },
    ];

    return { points: pts, minW: mn, maxW: mx, milestones: ms, xLabels: xLbls };
  }, [currentWeightKg, goalWeightKg, weeksToGoal]);

  const toX = (week: number) => PAD_L + (week / weeksToGoal) * PLOT_W;
  const toY = (weight: number) => PAD_T + ((maxW - weight) / (maxW - minW)) * PLOT_H;

  const curvePath = buildCurvePath(points, minW, maxW, weeksToGoal);
  const areaPath  = buildAreaPath(points, minW, maxW, weeksToGoal);

  const displayWeight = (kg: number) => {
    if (weightUnit === 'lbs') return `${Math.round(kg * 2.20462)}`;
    return `${Math.round(kg * 10) / 10}`;
  };

  const cream    = isDark ? '#f0e0c0' : '#1e1004';
  const gold     = isDark ? '#c8872a' : '#a06820';
  const goldLt   = isDark ? '#e8a84c' : '#b07020';
  const green    = isDark ? '#7AAE79' : '#187040';
  const mutedClr = isDark ? 'rgba(240,224,192,0.25)' : 'rgba(60,35,10,0.15)';
  const labelClr = isDark ? 'rgba(240,224,192,0.4)' : 'rgba(60,35,10,0.4)';

  // Y-axis labels: 3 evenly spaced
  const yLabels = [maxW, (maxW + minW) / 2, minW].map(w => ({
    weight: Math.round(w),
    y: toY(w),
  }));

  return (
    <Animated.View style={[
      s.container,
      {
        opacity: opac,
        transform: [{ translateY: slide }],
        backgroundColor: isDark ? '#1c1009' : 'rgba(255,255,255,0.78)',
        borderColor: isDark ? 'rgba(200,135,42,0.16)' : 'rgba(200,135,42,0.22)',
        ...(!isDark && {
          shadowColor: '#c8872a',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
          elevation: 1,
        }),
      },
    ]}>
      <Text style={[s.label, { color: isDark ? 'rgba(200,135,42,0.5)' : 'rgba(160,104,32,0.55)' }]}>
        PROJECTED JOURNEY
      </Text>

      {/* Weight badges */}
      <View style={s.badgeRow}>
        <View style={[s.weightBadge, { backgroundColor: `${goldLt}18`, borderColor: `${goldLt}44` }]}>
          <Text style={[s.badgeText, { color: goldLt }]}>
            {displayWeight(currentWeightKg)} {weightUnit}
          </Text>
        </View>
        <Text style={[s.arrowText, { color: mutedClr }]}>→</Text>
        <View style={[s.weightBadge, { backgroundColor: `${green}18`, borderColor: `${green}44` }]}>
          <Text style={[s.badgeText, { color: green }]}>
            {displayWeight(goalWeightKg)} {weightUnit}
          </Text>
        </View>
      </View>

      {/* SVG Chart */}
      <View style={s.chartWrap}>
        <Svg width={CHART_W} height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
          <Defs>
            <SvgLinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={goldLt} stopOpacity={isDark ? 0.25 : 0.18} />
              <Stop offset="100%" stopColor={goldLt} stopOpacity={0.02} />
            </SvgLinearGradient>
          </Defs>

          {/* Horizontal grid lines */}
          {yLabels.map((yl, i) => (
            <Line
              key={i}
              x1={PAD_L} y1={yl.y} x2={CHART_W - PAD_R} y2={yl.y}
              stroke={mutedClr} strokeWidth={0.8} strokeDasharray="4,4"
            />
          ))}

          {/* Area fill */}
          <Path d={areaPath} fill="url(#areaGrad)" />

          {/* Curve line */}
          <Path
            d={curvePath}
            fill="none"
            stroke={goldLt}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Milestone dots */}
          {milestones.map((ms, i) => (
            <Circle
              key={i}
              cx={toX(ms.week)} cy={toY(ms.weight)}
              r={3}
              fill={isDark ? '#231508' : '#fff'}
              stroke={goldLt} strokeWidth={1.5}
            />
          ))}

          {/* Start dot */}
          <Circle
            cx={toX(0)} cy={toY(currentWeightKg)}
            r={4.5}
            fill={goldLt}
          />

          {/* Goal dot */}
          <Circle
            cx={toX(weeksToGoal)} cy={toY(goalWeightKg)}
            r={4.5}
            fill={green}
          />
          {/* Goal ring */}
          <Circle
            cx={toX(weeksToGoal)} cy={toY(goalWeightKg)}
            r={8}
            fill="none"
            stroke={green} strokeWidth={1}
            strokeDasharray="3,2"
            opacity={0.5}
          />

          {/* Y-axis labels */}
          {yLabels.map((yl, i) => (
            <SvgText
              key={`y-${i}`}
              x={PAD_L - 6} y={yl.y + 3.5}
              fontSize={8}
              fontWeight="500"
              fill={labelClr}
              textAnchor="end"
            >
              {yl.weight}
            </SvgText>
          ))}

          {/* X-axis labels */}
          {xLabels.map((xl, i) => (
            <SvgText
              key={`x-${i}`}
              x={toX(xl.week)}
              y={CHART_H - 4}
              fontSize={8}
              fontWeight="500"
              fill={labelClr}
              textAnchor="middle"
            >
              {xl.label}
            </SvgText>
          ))}
        </Svg>
      </View>
    </Animated.View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,

  label: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 8,
    letterSpacing: 0.14,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  } as TextStyle,

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm + 2,
  } as ViewStyle,

  weightBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  } as ViewStyle,

  badgeText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    fontWeight: '600',
  } as TextStyle,

  arrowText: {
    fontSize: 12,
    fontWeight: '400',
  } as TextStyle,

  chartWrap: {
    alignItems: 'center',
    marginHorizontal: -SPACING.xs,
  } as ViewStyle,
});
