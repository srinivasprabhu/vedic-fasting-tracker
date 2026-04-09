import { fs } from '@/constants/theme';
import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorScheme } from '@/constants/colors';

interface DayData {
  label: string;
  value: number;
}

interface ThisWeekCardProps {
  weeklyData: DayData[];
  totalWeekHours: number;
  fastCount: number;
  avgDuration: number;
  vsLastWeekPct: number;
  personalBestHours: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const span = endDeg - startDeg;
  if (span <= 0.1) return '';
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  const largeArc = span > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

function getWeekDateRange(): string {
  const now = new Date();
  const day = now.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (monday.getMonth() === sunday.getMonth()) {
    return `${months[monday.getMonth()]} ${monday.getDate()}–${sunday.getDate()}`;
  }
  return `${months[monday.getMonth()]} ${monday.getDate()}–${months[sunday.getMonth()]} ${sunday.getDate()}`;
}

const SVG_SIZE = 160;
const CX = 80;
const CY = 80;
const TRACK_R = 54;
const STROKE_W = 9;
const LABEL_R = 69;
const GAP_DEG = 8;
const TOTAL_SEGMENT = 360 / 7;
const SEGMENT_DEG = TOTAL_SEGMENT - GAP_DEG;

const ARC_COLOR = '#D4A03C';
const ARC_BEST = '#F0C040';

export default function ThisWeekCard({
  weeklyData,
  totalWeekHours,
  fastCount,
  avgDuration,
  vsLastWeekPct,
  personalBestHours,
}: ThisWeekCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const barAnims = useRef(weeklyData.map(() => new Animated.Value(0))).current;
  const svgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(svgOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    Animated.stagger(
      70,
      barAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 650,
          delay: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        })
      )
    ).start();
  }, [svgOpacity]);

  const maxVal = useMemo(
    () => Math.max(...weeklyData.map((d) => d.value), 1),
    [weeklyData]
  );

  const bestDayIndex = useMemo(() => {
    let bestIdx = -1;
    let bestVal = 0;
    weeklyData.forEach((d, i) => {
      if (d.value > bestVal) {
        bestVal = d.value;
        bestIdx = i;
      }
    });
    return bestIdx;
  }, [weeklyData]);

  const dateRange = useMemo(() => getWeekDateRange(), []);

  const vsSign = vsLastWeekPct > 0 ? '↑' : vsLastWeekPct < 0 ? '↓' : '';
  const vsColor =
    vsLastWeekPct > 0
      ? colors.success
      : vsLastWeekPct < 0
      ? colors.error
      : colors.textMuted;

  const subtitleParts: string[] = [];
  subtitleParts.push(`${totalWeekHours.toFixed(1)}h total`);
  if (fastCount > 0) subtitleParts.push(`${fastCount} fast${fastCount !== 1 ? 's' : ''}`);
  if (vsLastWeekPct !== 0) subtitleParts.push(`${vsSign} ${Math.abs(vsLastWeekPct)}% vs last week`);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.swirlIcon}>⊛</Text>
          <Text style={styles.title}>This Week</Text>
        </View>
        <View style={styles.dateNav}>
          <ChevronLeft size={14} color={colors.textMuted} />
          <Text style={styles.dateRange}>{dateRange}</Text>
          <ChevronRight size={14} color={colors.textMuted} />
        </View>
      </View>

      <Text style={styles.subtitle}>{subtitleParts.join(' · ')}</Text>

      <View style={styles.body}>
        <View style={styles.chartWrap}>
          <Animated.View style={{ opacity: svgOpacity }}>
            <Svg width={SVG_SIZE} height={SVG_SIZE}>
              <G>
                {weeklyData.map((day, i) => {
                  const segStart = i * TOTAL_SEGMENT + GAP_DEG / 2;
                  const segEnd = segStart + SEGMENT_DEG;
                  const fillRatio = maxVal > 0 ? day.value / maxVal : 0;
                  const fillEnd = segStart + fillRatio * SEGMENT_DEG;
                  const isBest = i === bestDayIndex && day.value > 0;

                  const trackD = arcPath(CX, CY, TRACK_R, segStart, segEnd);
                  const fillD = day.value > 0 ? arcPath(CX, CY, TRACK_R, segStart, fillEnd) : '';

                  const labelAngle = segStart + SEGMENT_DEG / 2;
                  const lp = polarToCartesian(CX, CY, LABEL_R, labelAngle);
                  const shortLabel = day.label.charAt(0);

                  return (
                    <G key={i}>
                      <Path
                        d={trackD}
                        stroke={ARC_COLOR + '28'}
                        strokeWidth={STROKE_W}
                        fill="none"
                        strokeLinecap="round"
                      />
                      {fillD ? (
                        <Path
                          d={fillD}
                          stroke={isBest ? ARC_BEST : ARC_COLOR}
                          strokeWidth={STROKE_W}
                          fill="none"
                          strokeLinecap="round"
                        />
                      ) : null}
                      <SvgText
                        x={lp.x}
                        y={lp.y + 4}
                        textAnchor="middle"
                        fontSize={9}
                        fill={
                          day.value > 0
                            ? isBest
                              ? ARC_BEST
                              : ARC_COLOR
                            : colors.textMuted
                        }
                        fontWeight={isBest ? '700' : '500'}
                      >
                        {shortLabel}
                      </SvgText>
                    </G>
                  );
                })}
              </G>
            </Svg>
          </Animated.View>

          <View style={styles.centerOverlay}>
            <Text style={styles.centerHours}>
              {totalWeekHours >= 1 ? `${Math.round(totalWeekHours)}h` : '0h'}
            </Text>
            <Text style={styles.centerSub}>THIS WEEK</Text>
          </View>
        </View>

        <View style={styles.barList}>
          {weeklyData.map((day, i) => {
            const isBest = i === bestDayIndex && day.value > 0;
            const barAnim = barAnims[i];
            const barMaxPct = maxVal > 0 ? (day.value / maxVal) * 100 : 0;
            const barWidth = barAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', `${barMaxPct}%`],
            });

            return (
              <View key={i} style={styles.barRow}>
                <Text style={[styles.dayLabel, isBest && styles.dayLabelBest]}>
                  {day.label}
                </Text>
                <View style={styles.barTrack}>
                  {day.value > 0 && (
                    <Animated.View
                      style={[
                        styles.barFill,
                        { width: barWidth },
                        isBest ? { backgroundColor: ARC_BEST } : null,
                      ]}
                    />
                  )}
                </View>
                <View style={styles.valueWrap}>
                  <Text
                    style={[
                      styles.barValue,
                      day.value === 0 && styles.barValueEmpty,
                      isBest && styles.barValueBest,
                    ]}
                  >
                    {day.value > 0 ? `${day.value.toFixed(1)}h` : '—'}
                  </Text>
                  {isBest && <Star size={9} color={ARC_BEST} fill={ARC_BEST} />}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Text style={styles.footerValue}>
            {avgDuration >= 1 ? `${Math.round(avgDuration)}h` : '—'}
          </Text>
          <Text style={styles.footerLabel}>Avg duration</Text>
        </View>
        <View style={styles.footerDivider} />
        <View style={styles.footerItem}>
          <Text style={[styles.footerValue, { color: vsColor }]}>
            {vsLastWeekPct !== 0 ? `${vsSign} ${Math.abs(vsLastWeekPct)}%` : '—'}
          </Text>
          <Text style={styles.footerLabel}>vs last week</Text>
        </View>
        <View style={styles.footerDivider} />
        <View style={styles.footerItem}>
          <View style={styles.footerValueRow}>
            <Text style={styles.footerValue}>
              {personalBestHours >= 1 ? `${Math.round(personalBestHours)}h` : '—'}
            </Text>
            {personalBestHours >= 1 && (
              <Star size={10} color={ARC_BEST} fill={ARC_BEST} />
            )}
          </View>
          <Text style={styles.footerLabel}>Personal best</Text>
        </View>
      </View>
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 4,
    },
    headerLeft: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
    },
    swirlIcon: {
      fontSize: fs(16),
      color: ARC_COLOR,
    },
    title: {
      fontSize: fs(16),
      fontWeight: '700' as const,
      color: colors.text,
      letterSpacing: -0.3,
    },
    dateNav: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
    },
    dateRange: {
      fontSize: fs(12),
      color: colors.textMuted,
      fontWeight: '500' as const,
    },
    subtitle: {
      fontSize: fs(12),
      color: colors.textMuted,
      marginBottom: 12,
      lineHeight: 16,
    },
    body: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      marginBottom: 14,
    },
    chartWrap: {
      width: SVG_SIZE,
      height: SVG_SIZE,
    },
    centerOverlay: {
      position: 'absolute' as const,
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    centerHours: {
      fontSize: fs(28),
      fontWeight: '800' as const,
      color: colors.text,
      letterSpacing: -1,
    },
    centerSub: {
      fontSize: fs(10),
      fontWeight: '700' as const,
      color: colors.textMuted,
      letterSpacing: 1.5,
      marginTop: 1,
    },
    barList: {
      flex: 1,
      justifyContent: 'center' as const,
      gap: 7,
    },
    barRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
    },
    dayLabel: {
      width: 28,
      fontSize: fs(12),
      color: colors.textMuted,
      fontWeight: '500' as const,
    },
    dayLabelBest: {
      color: colors.text,
      fontWeight: '700' as const,
    },
    barTrack: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.surface,
      overflow: 'hidden' as const,
    },
    barFill: {
      height: '100%' as any,
      borderRadius: 3,
      backgroundColor: ARC_COLOR,
    },
    valueWrap: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 2,
      width: 44,
      justifyContent: 'flex-end' as const,
    },
    barValue: {
      fontSize: fs(12),
      color: colors.textSecondary,
      fontWeight: '500' as const,
      textAlign: 'right' as const,
    },
    barValueEmpty: {
      color: colors.textMuted,
    },
    barValueBest: {
      color: ARC_BEST,
      fontWeight: '700' as const,
    },
    footer: {
      flexDirection: 'row' as const,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      paddingTop: 12,
    },
    footerItem: {
      flex: 1,
      alignItems: 'center' as const,
    },
    footerValueRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 3,
    },
    footerValue: {
      fontSize: fs(16),
      fontWeight: '700' as const,
      color: colors.text,
      letterSpacing: -0.5,
    },
    footerLabel: {
      fontSize: fs(11),
      color: colors.textMuted,
      marginTop: 2,
      fontWeight: '500' as const,
    },
    footerDivider: {
      width: 1,
      backgroundColor: colors.borderLight,
      marginHorizontal: 4,
    },
  });
}
