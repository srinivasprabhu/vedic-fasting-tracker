import { fs } from '@/constants/theme';
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorScheme } from '@/constants/colors';

interface Props {
  insights: string[];
}

export default function RecapInsightsList({ insights }: Props) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const top = insights.slice(0, 3);
  if (top.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
      <View style={styles.header}>
        <Sparkles size={16} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>What stood out</Text>
      </View>
      {top.map((insight, i) => (
        <View key={i} style={styles.row}>
          <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
          <Text style={[styles.text, { color: colors.textSecondary }]}>{insight}</Text>
        </View>
      ))}
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    card: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 20 } as ViewStyle,
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 } as ViewStyle,
    title: { fontSize: fs(15), fontWeight: '700' } as TextStyle,
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 } as ViewStyle,
    bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 8 } as ViewStyle,
    text: { fontSize: fs(14), lineHeight: 21, flex: 1 } as TextStyle,
  });
}
