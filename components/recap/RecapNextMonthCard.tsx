import { fs } from '@/constants/theme';
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Target } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorScheme } from '@/constants/colors';

interface Props {
  projectedScore: number | null;
  currentScore: number;
  focusArea: string;
  targetFasts: number;
}

export default function RecapNextMonthCard({ projectedScore, currentScore, focusArea, targetFasts }: Props) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceWarm, borderColor: colors.primaryLight }]}>
      <View style={styles.header}>
        <Target size={16} color={colors.primary} />
        <Text style={[styles.eyebrow, { color: colors.primary }]}>NEXT MONTH TARGET</Text>
      </View>

      <Text style={[styles.focus, { color: colors.text }]}>{focusArea}</Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        Aim for {targetFasts} fasts.
        {projectedScore !== null ? ` If you do, your score could reach ${projectedScore}.` : ''}
      </Text>

      {projectedScore !== null && (
        <View style={styles.projectionRow}>
          <Text style={[styles.projectionNow, { color: colors.textMuted }]}>{currentScore}</Text>
          <Text style={[styles.projectionArrow, { color: colors.primary }]}>→</Text>
          <Text style={[styles.projectionTarget, { color: colors.primary }]}>{projectedScore}</Text>
          <Text style={[styles.projectionLabel, { color: colors.textMuted }]}>Projected</Text>
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    card: { borderRadius: 16, padding: 18, borderWidth: 1, marginBottom: 20 } as ViewStyle,
    header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 } as ViewStyle,
    eyebrow: { fontSize: fs(10), fontWeight: '700', letterSpacing: 1.2 } as TextStyle,
    focus: { fontSize: fs(18), fontWeight: '700', letterSpacing: -0.3, marginBottom: 6 } as TextStyle,
    sub: { fontSize: fs(13), lineHeight: 19, marginBottom: 14 } as TextStyle,
    projectionRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 } as ViewStyle,
    projectionNow: { fontSize: fs(22), fontWeight: '700' } as TextStyle,
    projectionArrow: { fontSize: fs(18), fontWeight: '700' } as TextStyle,
    projectionTarget: { fontSize: fs(32), fontWeight: '800', letterSpacing: -1 } as TextStyle,
    projectionLabel: { fontSize: fs(11), fontWeight: '600', marginLeft: 6, letterSpacing: 0.5 } as TextStyle,
  });
}
