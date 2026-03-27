// components/TrendChartCard.tsx
// Reusable trend chart card with Week/Month/Year toggle.
// Supports bar charts (fasting, water) and line charts (weight).

import React, { useRef, useEffect } from 'react';
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
import { toLocalDateString } from '@/utils/analytics-helpers';
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
  /** Shown under the title (e.g. "Hours logged per day · This week") */
  detailHint?: string;
  /** Coaching line below the summary row */
  interpretation?: string;
  /** Dashed horizontal line caption (e.g. "Goal: 8k steps") */
  referenceLineCaption?: string;
  barMetricKind?: 'fasting' | 'steps' | 'water' | 'default';
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
            <Text
              style={[
                rt.label,
                { color: active ? colors.text : colors.textSecondary },
                active && rt.labelActive,
              ]}
            >
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
  label:       { fontSize: 12, fontWeight: '500' } as TextStyle,
  labelActive: { fontWeight: '700' } as TextStyle,
});

// ─── Summary row ──────────────────────────────────────────────────────────────

const SummaryRow: React.FC<{
  data:    TrendPoint[];
  unit:    string;
  color:   string;
  colors:  ColorScheme;
  chartType: 'bar' | 'line';
  range:   TimeRange;
  startingValue?: number;
  goalKg?: number;
  formatValue?: (v: number) => string;
  barMetricKind?: 'fasting' | 'steps' | 'water' | 'default';
}> = ({ data, unit, color, colors, chartType, range, formatValue, startingValue, goalKg, barMetricKind }) => {
  const nonZero = data.filter(d => d.value > 0);
  const total   = nonZero.reduce((s, d) => s + d.value, 0);
  const avg     = nonZero.length > 0 ? total / nonZero.length : 0;
  const best    = nonZero.length > 0 ? Math.max(...nonZero.map(d => d.value)) : 0;
  const fmt     = formatValue ?? ((v: number) => `${Math.round(v * 10) / 10}${unit}`);

  const totalBarLabel =
    range === 'week' ? 'Week total' : range === 'month' ? 'Month total' : 'Year total';
  const avgBarLabel = barMetricKind === 'fasting' ? 'Avg / day' : 'Avg / day';
  const bestBarLabel = barMetricKind === 'fasting' ? 'Longest day' : 'Best day';

  if (chartType === 'line') {
    const valsPositive = data.map(d => d.value).filter(v => v > 0);
    const latest = data.length > 0 ? data[data.length - 1].value : 0;
    const firstPointInRange = data.find(d => d.value > 0)?.value ?? 0;
    const first =
      startingValue != null && startingValue > 0
        ? startingValue
        : firstPointInRange;
    const change = latest - first;
    const lowest = valsPositive.length > 0 ? Math.min(...valsPositive) : 0;
    const changeLabel = range === 'week' ? '7d change' : range === 'month' ? '30d change' : 'Change';
    const hasGoal = goalKg != null && goalKg > 0 && latest > 0;
    const toGoal = hasGoal ? Math.abs(latest - goalKg) : null;
    return (
      <View style={sr.row}>
        <View style={sr.item}><Text style={[sr.val, { color }]}>{fmt(latest)}</Text><Text style={[sr.lbl, { color: colors.textMuted }]}>Latest</Text></View>
        <View style={[sr.div, { backgroundColor: colors.borderLight }]} />
        <View style={sr.item}>
          <Text style={[sr.val, { color: change <= 0 ? colors.success : colors.error }]}>
            {change <= 0 ? '↓' : '↑'} {fmt(Math.abs(change))}
          </Text>
          <Text style={[sr.lbl, { color: colors.textMuted }]}>{changeLabel}</Text>
        </View>
        <View style={[sr.div, { backgroundColor: colors.borderLight }]} />
        <View style={sr.item}>
          <Text style={[sr.val, { color }]}>{hasGoal ? fmt(toGoal!) : fmt(lowest)}</Text>
          <Text style={[sr.lbl, { color: colors.textMuted }]}>{hasGoal ? 'To goal' : 'Lowest'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={sr.row}>
      <View style={sr.item}><Text style={[sr.val, { color }]}>{fmt(total)}</Text><Text style={[sr.lbl, { color: colors.textMuted }]}>{totalBarLabel}</Text></View>
      <View style={[sr.div, { backgroundColor: colors.borderLight }]} />
      <View style={sr.item}><Text style={[sr.val, { color }]}>{fmt(avg)}</Text><Text style={[sr.lbl, { color: colors.textMuted }]}>{avgBarLabel}</Text></View>
      <View style={[sr.div, { backgroundColor: colors.borderLight }]} />
      <View style={sr.item}><Text style={[sr.val, { color }]}>{fmt(best)}</Text><Text style={[sr.lbl, { color: colors.textMuted }]}>{bestBarLabel}</Text></View>
    </View>
  );
};

const sr = StyleSheet.create({
  row:  { flexDirection: 'row', paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(200,135,42,.08)' } as ViewStyle,
  item: { flex: 1, alignItems: 'center' } as ViewStyle,
  val:  { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 } as TextStyle,
  lbl:  { fontSize: 11, marginTop: 2, fontWeight: '600' } as TextStyle,
  div:  { width: 1, height: 32, marginHorizontal: 2 } as ViewStyle,
  interpret: { fontSize: 13, lineHeight: 18, marginTop: 10, fontWeight: '500' } as TextStyle,
  refCap: { fontSize: 11, fontWeight: '600', marginTop: 4, alignSelf: 'center' } as TextStyle,
});

// ─── Bar chart renderer ───────────────────────────────────────────────────────

function renderBarChart(
  data: TrendPoint[],
  color: string,
  colors: ColorScheme,
  range: TimeRange,
  targetValue?: number,
  formatYAxis: (v: number) => string = (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`,
  targetLineCaption?: string,
) {
  const maxVal  = Math.max(...data.map(d => d.value), targetValue ?? 0, 1);
  const barCount = data.length;
  const todayStr = toLocalDateString(new Date());

  const gap    = range === 'month' ? 2 : range === 'year' ? 4 : 6;
  const barW   = Math.max(2, (PLOT_W - (barCount - 1) * gap) / barCount);

  const toY = (v: number) => PAD_T + PLOT_H - (v / maxVal) * PLOT_H;

  const ySteps = [0, maxVal / 2, maxVal];
  const labelEvery = range === 'month' ? 7 : range === 'year' ? 1 : 1;
  const ty = targetValue != null && targetValue > 0 ? toY(targetValue) : 0;

  return (
    <Svg width={CHART_W} height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
      {ySteps.map((v, i) => (
        <Line
          key={`g-${i}`}
          x1={PAD_L} y1={toY(v)} x2={CHART_W - PAD_R} y2={toY(v)}
          stroke={colors.borderLight} strokeWidth={0.5} strokeDasharray="4,4"
        />
      ))}

      {targetValue != null && targetValue > 0 && (
        <>
          <Line
            x1={PAD_L} y1={ty} x2={CHART_W - PAD_R} y2={ty}
            stroke={color} strokeWidth={1} strokeDasharray="6,4" opacity={0.45}
          />
          {targetLineCaption ? (
            <SvgText
              x={PAD_L}
              y={Math.max(PAD_T + 9, ty - 4)}
              fontSize={9}
              fontWeight="600"
              fill={colors.textSecondary}
            >
              {targetLineCaption}
            </SvgText>
          ) : null}
        </>
      )}

      {data.map((d, i) => {
        const x = PAD_L + i * (barW + gap);
        const isFuture = range === 'week' && d.date > todayStr;
        const isToday = range === 'week' && d.date === todayStr;

        if (isFuture) {
          return (
            <Rect
              key={i}
              x={x}
              y={PAD_T + PLOT_H - 3}
              width={barW}
              height={3}
              rx={1.5}
              fill={color}
              opacity={0.12}
            />
          );
        }

        const barH = d.value > 0 ? Math.max(3, (d.value / maxVal) * PLOT_H) : 0;
        const y = PAD_T + PLOT_H - barH;
        const opacity = d.value > 0 ? (isToday ? 1 : 0.78) : 0.2;

        return (
          <Rect
            key={i}
            x={x}
            y={d.value > 0 ? y : PAD_T + PLOT_H - 3}
            width={barW}
            height={d.value > 0 ? barH : 3}
            rx={Math.min(barW / 2, 3)}
            fill={color}
            opacity={opacity}
            stroke={isToday && d.value > 0 ? 'rgba(255,255,255,0.35)' : 'none'}
            strokeWidth={isToday && d.value > 0 ? 1 : 0}
          />
        );
      })}

      {ySteps.map((v, i) => (
        <SvgText
          key={`yl-${i}`}
          x={PAD_L - 4}
          y={toY(v) + 4}
          fontSize={9}
          fontWeight="500"
          fill={colors.textMuted}
          textAnchor="end"
        >
          {formatYAxis(v)}
        </SvgText>
      ))}

      {data.map((d, i) => {
        if (i % labelEvery !== 0 && range === 'month') return null;
        const x = PAD_L + i * (barW + gap) + barW / 2;
        const muted = range === 'week' && d.date > todayStr;
        return (
          <SvgText
            key={`xl-${i}`}
            x={x}
            y={CHART_H - 3}
            fontSize={range === 'month' ? 8 : 9}
            fontWeight="500"
            fill={colors.textMuted}
            textAnchor="middle"
            opacity={muted ? 0.45 : 1}
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
        <SvgText x={CHART_W / 2} y={CHART_H / 2} fontSize={12} fill={colors.textMuted} textAnchor="middle">
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
          <SvgText x={CHART_W - PAD_R + 2} y={toY(goalValue) + 4} fontSize={9} fill={colors.success} fontWeight="700">
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
        <SvgText key={`yl-${i}`} x={PAD_L - 4} y={toY(v) + 4}
          fontSize={9} fontWeight="500" fill={colors.textMuted} textAnchor="end">
          {formatYAxis(v)}
        </SvgText>
      ))}

      {/* X-axis labels */}
      {data.map((d, i) => {
        if (range === 'month' && i % labelEvery !== 0) return null;
        const x = toX(i);
        return (
          <SvgText key={`xl-${i}`} x={x} y={CHART_H - 3}
            fontSize={range === 'month' ? 8 : 9} fontWeight="500"
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
  detailHint, interpretation, referenceLineCaption, barMetricKind = 'default',
}) => {
  const { colors } = useTheme();

  const opac  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opac,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const headerRightFallback =
    unit === 'h' ? 'Hours / day' : unit === 'ml' ? 'ml / day' : unit === 'steps' ? 'steps / day' : unit;

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
      <View style={s.header}>
        <View style={s.headerTitleCol}>
          <View style={s.headerLeft}>
            <Text style={s.headerIcon}>{icon}</Text>
            <Text style={[s.headerTitle, { color: colors.text }]}>{title}</Text>
          </View>
          {detailHint ? (
            <Text style={[s.detailHint, { color: colors.textMuted }]}>{detailHint}</Text>
          ) : null}
        </View>
        {!detailHint ? (
          <Text style={[s.headerUnit, { color: colors.textMuted }]}>{headerRightFallback}</Text>
        ) : null}
      </View>

      <RangeToggle value={range} onChange={onRangeChange} colors={colors} />

      <View style={s.chartWrap}>
        {chartType === 'bar'
          ? renderBarChart(
              data,
              color,
              colors,
              range,
              targetValue,
              formatYLabel,
              referenceLineCaption,
            )
          : renderLineChart(data, color, colors, range, goalValue, formatYLabel)
        }
      </View>

      <SummaryRow
        data={data}
        unit={unit}
        color={color}
        colors={colors}
        chartType={chartType}
        range={range}
        startingValue={startingValue}
        goalKg={chartType === 'line' ? goalValue : undefined}
        formatValue={formatValue}
        barMetricKind={barMetricKind}
      />

      {interpretation ? (
        <Text style={[sr.interpret, { color: colors.textSecondary }]}>{interpretation}</Text>
      ) : null}
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  } as ViewStyle,

  headerTitleCol: {
    flex: 1,
    minWidth: 0,
  } as ViewStyle,

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,

  headerIcon: {
    fontSize: 17,
  } as TextStyle,

  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  } as TextStyle,

  detailHint: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    marginLeft: 28,
    lineHeight: 16,
  } as TextStyle,

  headerUnit: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  } as TextStyle,

  chartWrap: {
    alignItems: 'center',
    marginVertical: 8,
  } as ViewStyle,
});

export default TrendChartCard;
