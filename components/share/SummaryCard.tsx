import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import type { MonthlyReportData } from '@/utils/monthly-report';

interface Props {
  data: MonthlyReportData;
}

const CARD_SIZE = 360;

const SummaryCard = forwardRef<View, Props>(({ data }, ref) => {
  const scoreColor =
    data.metabolicScore >= 85 ? '#7AAE79' :
    data.metabolicScore >= 70 ? '#e8a84c' :
    data.metabolicScore >= 50 ? '#E8913A' :
    '#B8A898';

  const delta = data.prevMonth ? data.metabolicScore - data.prevMonth.metabolicScore : null;
  const deltaLabel = data.isBaseline
    ? null
    : delta === null
      ? null
      : delta > 0
        ? `+${delta} from last month`
        : delta < 0
          ? `${delta} from last month`
          : null;

  const ringSize = 200;
  const ringStroke = 10;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumf = 2 * Math.PI * ringRadius;
  const ringFill = ringCircumf * (data.metabolicScore / 100);

  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <View style={styles.brandRow}>
        <AayuLogoMark size={20} color="#c8872a" />
        <Text style={styles.brandText}>Aayu</Text>
      </View>

      <Text style={styles.monthLabel}>{data.monthLabel.toUpperCase()}</Text>

      <View style={styles.scoreWrap}>
        <Svg width={ringSize} height={ringSize}>
          <Circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={ringRadius}
            stroke="rgba(240,224,192,0.1)"
            strokeWidth={ringStroke}
            fill="none"
          />
          <Circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={ringRadius}
            stroke={scoreColor}
            strokeWidth={ringStroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${ringFill} ${ringCircumf}`}
            transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
          />
        </Svg>

        <View style={styles.scoreCenter}>
          <Text style={[styles.scoreValue, { color: scoreColor }]}>{data.metabolicScore}</Text>
          <Text style={styles.scoreMax}>/ 100</Text>
        </View>
      </View>

      <Text style={styles.scoreLabel}>{data.metabolicLabel}</Text>
      <Text style={styles.scoreSub}>Metabolic discipline score</Text>

      {deltaLabel != null && delta !== null && (
        <View style={[styles.deltaPill, { backgroundColor: delta > 0 ? 'rgba(122,174,121,0.15)' : 'rgba(232,168,76,0.15)' }]}>
          <Text style={[styles.deltaText, { color: delta > 0 ? '#7AAE79' : '#e8a84c' }]}>{deltaLabel}</Text>
        </View>
      )}

      <View style={styles.statRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{data.completedFasts}</Text>
          <Text style={styles.statLabel}>Fasts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{data.avgFastDuration.toFixed(1)}h</Text>
          <Text style={styles.statLabel}>Avg</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{data.bestStreak}d</Text>
          <Text style={styles.statLabel}>Best streak</Text>
        </View>
      </View>

      <Text style={styles.footer}>aayu.app</Text>
    </View>
  );
});

SummaryCard.displayName = 'SummaryCard';
export default SummaryCard;

function AayuLogoMark({ size = 20, color = '#c8872a' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96">
      <G transform="translate(48,48)">
        <Circle cx={0} cy={0} r={44} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.4} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <Path
            key={deg}
            d="M0,-36 C-10,-24 -10,-14 0,-11 C10,-14 10,-24 0,-36Z"
            fill="none"
            stroke={color}
            strokeWidth={1.6}
            strokeOpacity={0.8}
            strokeLinejoin="round"
            transform={`rotate(${deg})`}
          />
        ))}
        <Path d="M0,-6 4.3,0 0,6 -4.3,0Z" fill={color} />
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    backgroundColor: '#0a0604',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  } as ViewStyle,
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 4,
  } as ViewStyle,
  brandText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#c8872a',
    letterSpacing: 0.3,
  } as TextStyle,
  monthLabel: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '600',
    color: '#8c7a6a',
    letterSpacing: 2,
    marginBottom: 22,
  } as TextStyle,
  scoreWrap: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  scoreCenter: {
    position: 'absolute',
    alignItems: 'center',
  } as ViewStyle,
  scoreValue: {
    fontSize: 64,
    fontWeight: '800',
    letterSpacing: -2,
  } as TextStyle,
  scoreMax: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8c7a6a',
    marginTop: -4,
  } as TextStyle,
  scoreLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f0e0c0',
    marginTop: 14,
    letterSpacing: -0.3,
  } as TextStyle,
  scoreSub: {
    fontSize: 11,
    color: '#8c7a6a',
    marginTop: 3,
  } as TextStyle,
  deltaPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 12,
  } as ViewStyle,
  deltaText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  } as TextStyle,
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(240,224,192,0.1)',
    alignSelf: 'stretch',
    justifyContent: 'space-around',
  } as ViewStyle,
  statItem: { alignItems: 'center', flex: 1 } as ViewStyle,
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f0e0c0',
    letterSpacing: -0.5,
  } as TextStyle,
  statLabel: {
    fontSize: 10,
    color: '#8c7a6a',
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.3,
  } as TextStyle,
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(240,224,192,0.1)',
  } as ViewStyle,
  footer: {
    position: 'absolute',
    bottom: 16,
    fontSize: 10,
    color: '#5c4a3a',
    fontWeight: '600',
    letterSpacing: 1,
  } as TextStyle,
});
