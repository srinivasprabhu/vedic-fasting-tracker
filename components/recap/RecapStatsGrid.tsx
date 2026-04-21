import { fs } from '@/constants/theme';
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Flame, Clock, TrendingUp } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorScheme } from '@/constants/colors';
import type { MonthlyReportData } from '@/utils/monthly-report';

interface Props {
  completedFasts: number;
  avgFastDuration: number;
  bestStreak: number;
  prevMonth: MonthlyReportData['prevMonth'];
}

export default function RecapStatsGrid({ completedFasts, avgFastDuration, bestStreak, prevMonth }: Props) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(), []);

  const fastsDelta = prevMonth ? completedFasts - prevMonth.totalFasts : null;
  const durationDelta = prevMonth ? avgFastDuration - prevMonth.avgFastDuration : null;
  const streakDelta = prevMonth ? bestStreak - prevMonth.bestStreak : null;

  return (
    <View style={styles.grid}>
      <StatTile
        icon={<Flame size={18} color={colors.primary} />}
        iconBg={colors.primaryLight}
        value={String(completedFasts)}
        label="Fasts completed"
        delta={fastsDelta}
        deltaUnit=""
        colors={colors}
      />
      <StatTile
        icon={<Clock size={18} color={colors.accent} />}
        iconBg={colors.accentLight}
        value={`${avgFastDuration.toFixed(1)}h`}
        label="Avg duration"
        delta={durationDelta !== null ? Math.round(durationDelta * 10) / 10 : null}
        deltaUnit="h"
        colors={colors}
      />
      <StatTile
        icon={<TrendingUp size={18} color={colors.warning} />}
        iconBg={colors.warningLight}
        value={String(bestStreak)}
        label="Best streak"
        delta={streakDelta}
        deltaUnit="d"
        colors={colors}
      />
    </View>
  );
}

function StatTile({
  icon, iconBg, value, label, delta, deltaUnit, colors,
}: {
  icon: React.ReactNode;
  iconBg: string;
  value: string;
  label: string;
  delta: number | null;
  deltaUnit: string;
  colors: ColorScheme;
}) {
  const styles = React.useMemo(() => makeStyles(), []);
  const deltaColor = delta === null ? colors.textMuted : delta > 0 ? colors.success : delta < 0 ? colors.warning : colors.textMuted;
  const deltaStr = delta === null ? null : delta === 0 ? '—' : delta > 0 ? `+${delta}${deltaUnit}` : `${delta}${deltaUnit}`;

  return (
    <View style={[styles.tile, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      {deltaStr && (
        <Text style={[styles.delta, { color: deltaColor }]}>{deltaStr} vs last</Text>
      )}
    </View>
  );
}

function makeStyles() {
  return StyleSheet.create({
    grid: { flexDirection: 'row', gap: 10, marginBottom: 28 } as ViewStyle,
    tile: { flex: 1, borderRadius: 16, padding: 14, borderWidth: 1, alignItems: 'flex-start' } as ViewStyle,
    iconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10 } as ViewStyle,
    value: { fontSize: fs(22), fontWeight: '800', letterSpacing: -0.5 } as TextStyle,
    label: { fontSize: fs(11), fontWeight: '500', marginTop: 2 } as TextStyle,
    delta: { fontSize: fs(11), fontWeight: '600', marginTop: 4 } as TextStyle,
  });
}
