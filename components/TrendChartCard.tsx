// components/TrendChartCard.tsx
// Reusable trend chart card with Week/Month/Year toggle.
// Supports bar charts (fasting, water) and line charts (weight).

import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import Svg, {
  Rect, Line, Path, Circle, Defs,
  LinearGradient as SvgLinearGradient, Stop,
  Text as SvgText,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS } from '@/constants/theme';
import type { TrendPoint, TimeRange } from '@/hooks/useTrendData';
import type { ColorScheme } from '@/constants/colors';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrendChartCardProps {
  title:       string;
  icon:        string;
  color:       string;
  data:        TrendPoint[];
  unit:        string;        // "h", "ml", "kg", "steps"
  chartType:   'bar' | 'line';
  range:       TimeRange;
  onRangeChange: (r: TimeRange) => void;
  targetValue?: number;       // dashed target line (for water, steps)
  goalValue?:  number;        // dashed goal line (for weight)
  startingValue?: number;     // starting reference for change calculation (weight)
  formatValue?: (v: number) => string;
  formatYLabel?: (v: number) => string;  // custom Y-axis label formatter
}

// ─── Chart dimensions ─────────────────────────────────────────────────────────

const CHART_W   = 300;
const CHART_H   = 140;
const PAD_L     = 36;
const PAD_R     = 8;
const PAD_T     = 12;
const PAD_B     = 22;
const PLOT_W    = CHART_W - PAD_L - PAD_R;
const PLOT_H    = CHART_H - PAD_T - PAD_B;

// ─── Range toggle ─────────────────────────────────────────────────────────────

const RangeToggle: React.FC<{
  value: TimeRange;
  onChange: (v: TimeRange) => void;
  colors: ColorScheme;
}> = ({ value, onChange, colors }) => {
  const ranges: { key: TimeRange; label: string }[] = [
    { key: 'week',  label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'year',  label: 'Year' },
  ];

  return (
    <View style={[rt.row, { backgroundColor: colors.surface }]}>
      {ranges.map(r => {
        const active = value === r.key;
        return (
          <TouchableOpacity
            key={r.key}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(r.key);
            }}
            style={[rt.item, active && { backgroundColor: colors.card }]}
          >
            <Text style={[rt.label, { color: active ? colors.text : colors.textMuted }, active && rt.labelActive]}>
              {r.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const rt = StyleSheet.create({
  row:         { flexDirection: 'row', borderRadius: 10, padding: 2 } as ViewStyle,
  item:        { flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center' } as ViewStyle,
  label:       { fontSize: 11, fontWeight: '500' } as TextStyle,
  labelActive: { fontWeight: '600' } as TextStyle,
});

// ─── Summary row ──────────────────────────────────────────────────────────────

const SummaryRow: React.FC<{
  data:    TrendPoint[];
  unit:    string;
  color:   string;
  colors:  ColorScheme;
  chartType: 'bar' | 'line';
  startingValue?: number;
  formatValue?: (v: number) => string;
}> = ({ data, unit, color, colors, chartType, formatValue, startingValue }) => {
  const nonZero = data.filter(d => d.value > 0);
  const total   = nonZero.reduce((s, d) => s + d.value, 0);
  const avg     = nonZero.length > 0 ? total / nonZero.length : 0;
  const best    = nonZero.length > 0 ? Math.max(...nonZero.map(d => d.value)) : 0;
  const fmt     = formatValue ?? ((v: number) => `${Math.round(v * 10) / 10}${unit}`);

  if (chartType === 'line') {
    // For weight: show latest, change from starting weight, lowest
    const latest = nonZero.length > 0 ? nonZero[nonZero.length - 1].value : 0;
    // Use startingValue (onboarding weight) as reference if available, otherwise first data point
    const first  = startingValue && startingValue > 0 ? startingValue : (nonZero.length > 0 ? nonZero[0].value : 0);
    const change = latest - first;
    const lowest = nonZero.length > 0 ? Math.min(...nonZero.map(d => d.value)) : 0;
    return (
      <View style={sr.row}>
        <View style={sr.item}><Text style={[sr.val, { color }]}>{fmt(latest)}</Text><Text style={[sr.lbl, { color: colors.textMuted }]}>Latest</Text></View>
        <View style={[sr.div, { backgroundColor: colors.borderLight }]} />
        <View style={sr.item}>
          <Text style={[sr.val, { color: change <= 0 ? colors.success : colors.error }]}>
            {change <= 0 ? '↓' : '↑'} {fmt(Math.abs(change))}
          </Text>
          <Text style={[sr.lbl, { color: colors.textMuted }]}>Change</Text>
        </View>
        <View style={[sr.div, { backgroundColor: colors.borderLight }]} />
        <View style={sr.item}><Text style={[sr.val, { color }]}>{fmt(lowest)}</Text><Text style={[sr.lbl, { color: colors.textMuted }]}>Lowest</Text></View>
      </View>
    );
  }

  return (
    <View style={sr.row}>
      <View style={sr.item}><Text style={[sr.val, { color }]}>{fmt(total)}</Text><Text style={[sr.lbl, { color: colors.textMuted }]}>Total</Text></View>
      <View style={[sr.div, { backgroundColor: colors.borderLight }]} />
      <View style={sr.item}><Text style={[sr.val, { color }]}>{fmt(avg)}</Text><Text style={[sr.lbl, { color: colors.textMuted }]}>Avg</Text></View>
      <View style={[sr.div, { backgroundColor: colors.borderLight }]} />
      <View style={sr.item}><Text style={[sr.val, { color }]}>{fmt(best)}</Text><Text style={[sr.lbl, { color: colors.textMuted }]}>Best</Text></View>
    </View>
  );
};

const sr = StyleSheet.create({
  row:  { flexDirection: 'row', paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(200,135,42,.08)' } as ViewStyle,
  item: { flex: 1, alignItems: 'center' } as ViewStyle,
  val:  { fontSize: 15, fontWeight: '700', letterSpacing: -0.3 } as TextStyle,
  lbl:  { fontSize: 10, marginTop: 2, fontWeight: '500' } as TextStyle,
  div:  { width: 1, height: 32, marginHorizontal: 2 } as ViewStyle,
});

// ─── Bar chart renderer ───────────────────────────────────────────────────────

function renderBarChart(
  data: TrendPoint[],
  color: string,
  colors: ColorScheme,
  range: TimeRange,
  targetValue?: number,
  formatYAxis: (v: number) => string = (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`,
) {
  const nonZero = data.filter(d => d.value > 0);
  const maxVal  = Math.max(...data.map(d => d.value), targetValue ?? 0, 1);
  const barCount = data.length;

  const gap    = range === 'month' ? 2 : range === 'year' ? 4 : 6;
  const barW   = Math.max(2, (PLOT_W - (barCount - 1) * gap) / barCount);

  const toY = (v: number) => PAD_T + PLOT_H - (v / maxVal) * PLOT_H;

  // Y-axis labels: 3 values
  const ySteps = [0, maxVal / 2, maxVal];

  // X-axis labels: show a subset
  const labelEvery = range === 'month' ? 7 : range === 'year' ? 1 : 1;

  return (
    <Svg width={CHART_W} height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
      {/* Grid lines */}
      {ySteps.map((v, i) => (
        <Line
          key={`g-${i}`}
          x1={PAD_L} y1={toY(v)} x2={CHART_W - PAD_R} y2={toY(v)}
          stroke={colors.borderLight} strokeWidth={0.5} strokeDasharray="4,4"
        />
      ))}

      {/* Target line */}
      {targetValue != null && targetValue > 0 && (
        <Line
          x1={PAD_L} y1={toY(targetValue)} x2={CHART_W - PAD_R} y2={toY(targetValue)}
          stroke={color} strokeWidth={1} strokeDasharray="6,4" opacity={0.4}
        />
      )}

      {/* Bars */}
      {data.map((d, i) => {
        const x = PAD_L + i * (barW + gap);
        const barH = d.value > 0 ? Math.max(2, (d.value / maxVal) * PLOT_H) : 0;
        const y = PAD_T + PLOT_H - barH;
        const isToday = i === data.length - 1 && range === 'week';
        const opacity = d.value > 0 ? (isToday ? 1 : 0.7) : 0.15;

        return (
          <Rect
            key={i}
            x={x} y={d.value > 0 ? y : PAD_T + PLOT_H - 2}
            width={barW} height={d.value > 0 ? barH : 2}
            rx={Math.min(barW / 2, 3)}
            fill={color}
            opacity={opacity}
          />
        );
      })}

      {/* Y-axis labels */}
      {ySteps.map((v, i) => (
        <SvgText
          key={`yl-${i}`}
          x={PAD_L - 4} y={toY(v) + 3.5}
          fontSize={8} fontWeight="500"
          fill={colors.textMuted} textAnchor="end"
        >
          {formatYAxis(v)}
        </SvgText>
      ))}

      {/* X-axis labels */}
      {data.map((d, i) => {
        if (i % labelEvery !== 0 && range === 'month') return null;
        const x = PAD_L + i * (barW + gap) + barW / 2;
        return (
          <SvgText
            key={`xl-${i}`}
            x={x} y={CHART_H - 4}
            fontSize={range === 'month' ? 7 : 8} fontWeight="500"
            fill={colors.textMuted} textAnchor="middle"
          >
            {d.label}
          </SvgText>
        );
      })}
    </Svg>
  );
}

// ─── Line chart renderer ──────────────────────────────────────────────────────

function renderLineChart(
  data: TrendPoint[],
  color: string,
  colors: ColorScheme,
  range: TimeRange,
  goalValue?: number,
  formatYAxis: (v: number) => string = (v) => `${Math.round(v * 10) / 10}`,
) {
  const nonZero = data.filter(d => d.value > 0);
  if (nonZero.length === 0) {
    return (
      <Svg width={CHART_W} height={CHART_H}>
        <SvgText x={CHART_W / 2} y={CHART_H / 2} fontSize={11} fill={colors.textMuted} textAnchor="middle">
          No data yet
        </SvgText>
      </Svg>
    );
  }

  const values  = nonZero.map(d => d.value);
  const allVals = goalValue ? [...values, goalValue] : values;
  const padding = Math.max(0.5, (Math.max(...allVals) - Math.min(...allVals)) * 0.15);
  const minV    = Math.floor(Math.min(...allVals) - padding);
  const maxV    = Math.ceil(Math.max(...allVals) + padding);

  // Map only non-zero points to positions
  const pointIndices = data.map((d, i) => d.value > 0 ? i : -1).filter(i => i >= 0);
  const step = data.length > 1 ? PLOT_W / (data.length - 1) : PLOT_W;

  const toX = (idx: number) => PAD_L + idx * step;
  const toY = (v: number) => PAD_T + ((maxV - v) / (maxV - minV)) * PLOT_H;

  // Build curve path
  let linePath = '';
  let areaPath = '';
  const points = pointIndices.map(i => ({ x: toX(i), y: toY(data[i].value) }));

  if (points.length >= 2) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cpX = (points[i - 1].x + points[i].x) / 2;
      linePath += ` C ${cpX} ${points[i - 1].y}, ${cpX} ${points[i].y}, ${points[i].x} ${points[i].y}`;
    }
    const bottomY = PAD_T + PLOT_H;
    areaPath = `${linePath} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
  }

  const ySteps = [maxV, (maxV + minV) / 2, minV];
  const labelEvery = range === 'month' ? 7 : 1;

  return (
    <Svg width={CHART_W} height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
      <Defs>
        <SvgLinearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <Stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </SvgLinearGradient>
      </Defs>

      {/* Grid */}
      {ySteps.map((v, i) => (
        <Line key={`g-${i}`} x1={PAD_L} y1={toY(v)} x2={CHART_W - PAD_R} y2={toY(v)}
          stroke={colors.borderLight} strokeWidth={0.5} strokeDasharray="4,4" />
      ))}

      {/* Goal line */}
      {goalValue != null && goalValue > 0 && (
        <>
          <Line
            x1={PAD_L} y1={toY(goalValue)} x2={CHART_W - PAD_R} y2={toY(goalValue)}
            stroke={colors.success} strokeWidth={1} strokeDasharray="6,4" opacity={0.5}
          />
          <SvgText x={CHART_W - PAD_R + 2} y={toY(goalValue) + 3} fontSize={7} fill={colors.success} fontWeight="600">
            Goal
          </SvgText>
        </>
      )}

      {/* Area fill */}
      {areaPath && <Path d={areaPath} fill="url(#lineGrad)" />}

      {/* Line */}
      {linePath && (
        <Path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
      )}

      {/* Dots */}
      {points.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
      ))}

      {/* Y-axis labels */}
      {ySteps.map((v, i) => (
        <SvgText key={`yl-${i}`} x={PAD_L - 4} y={toY(v) + 3.5}
          fontSize={8} fontWeight="500" fill={colors.textMuted} textAnchor="end">
          {formatYAxis(v)}
        </SvgText>
      ))}

      {/* X-axis labels */}
      {data.map((d, i) => {
        if (range === 'month' && i % labelEvery !== 0) return null;
        const x = toX(i);
        return (
          <SvgText key={`xl-${i}`} x={x} y={CHART_H - 4}
            fontSize={range === 'month' ? 7 : 8} fontWeight="500"
            fill={colors.textMuted} textAnchor="middle">
            {d.label}
          </SvgText>
        );
      })}
    </Svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export const TrendChartCard: React.FC<TrendChartCardProps> = ({
  title, icon, color, data, unit, chartType,
  range, onRangeChange, targetValue, goalValue, startingValue, formatValue, formatYLabel,
}) => {
  const { colors, isDark } = useTheme();

  const opac  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opac,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[
      s.card,
      {
        opacity: opac,
        transform: [{ translateY: slide }],
        backgroundColor: colors.card,
        borderColor: colors.borderLight,
      },
    ]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.headerIcon}>{icon}</Text>
          <Text style={[s.headerTitle, { color: colors.text }]}>{title}</Text>
        </View>
        <Text style={[s.headerUnit, { color: colors.textMuted }]}>
          {unit === 'h' ? 'Hours per day' : unit === 'ml' ? 'ml per day' : unit}
        </Text>
      </View>

      {/* Range toggle */}
      <RangeToggle value={range} onChange={onRangeChange} colors={colors} />

      {/* Chart */}
      <View style={s.chartWrap}>
        {chartType === 'bar'
          ? renderBarChart(data, color, colors, range, targetValue, formatYLabel)
          : renderLineChart(data, color, colors, range, goalValue, formatYLabel)
        }
      </View>

      {/* Summary row */}
      <SummaryRow
        data={data}
        unit={unit}
        color={color}
        colors={colors}
        chartType={chartType}
        startingValue={startingValue}
        formatValue={formatValue}
      />
    </Animated.View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  } as ViewStyle,

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  } as ViewStyle,

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,

  headerIcon: {
    fontSize: 16,
  } as TextStyle,

  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  } as TextStyle,

  headerUnit: {
    fontSize: 11,
    fontWeight: '500',
  } as TextStyle,

  chartWrap: {
    alignItems: 'center',
    marginVertical: 8,
  } as ViewStyle,
});

export default TrendChartCard;
