import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Zap, Droplets, Footprints, Activity } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { AayuMandala } from '@/components/onboarding/AayuMandala';
import { FONTS, SPACING, fs, lh } from '@/constants/theme';
import { hexAlpha } from '@/constants/colors';
import type { ColorScheme } from '@/constants/colors';

const FEATURES = [
  { icon: Zap, label: 'Metabolic zones', sub: 'Real-time fasting phases', color: '#e07b30' },
  { icon: Activity, label: 'Body score', sub: 'Your metabolic discipline', color: '#8b6bbf' },
  { icon: Droplets, label: 'Hydration', sub: 'Daily water tracking', color: '#5b8dd9' },
  { icon: Footprints, label: 'Movement', sub: 'Steps and activity', color: '#3aaa6e' },
];

export default function SlideHowAayuWorks() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={styles.visualWrap}>
        <View style={[styles.glowRing, { borderColor: hexAlpha(colors.primary, 0.15) }]}>
          <AayuMandala size={100} color={colors.primary} animated glow />
        </View>
      </View>

      <Text style={styles.title}>How Aayu works</Text>
      <Text style={styles.body}>
        Aayu tracks your fasting rhythm across four dimensions — metabolic zones, your score, hydration, and movement.
      </Text>

      <View style={styles.grid}>
        {FEATURES.map((f) => (
          <View key={f.label} style={[styles.tile, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <View style={[styles.tileIcon, { backgroundColor: hexAlpha(f.color, 0.12) }]}>
              <f.icon size={20} color={f.color} />
            </View>
            <Text style={[styles.tileLabel, { color: colors.text }]}>{f.label}</Text>
            <Text style={[styles.tileSub, { color: colors.textMuted }]}>{f.sub}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    wrap: { flex: 1, paddingTop: SPACING.xl } as ViewStyle,
    visualWrap: { alignItems: 'center', marginBottom: SPACING.xl + 8 } as ViewStyle,
    glowRing: { width: 140, height: 140, borderRadius: 70, borderWidth: 1, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
    title: { fontFamily: FONTS.displayLight, fontSize: fs(30), color: colors.text, letterSpacing: -0.3, marginBottom: SPACING.xs } as TextStyle,
    body: { fontFamily: FONTS.bodyRegular, fontSize: fs(15), lineHeight: lh(15, 1.45), color: colors.textSecondary, marginBottom: SPACING.xl } as TextStyle,
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 } as ViewStyle,
    tile: { width: '47%' as const, borderRadius: 16, borderWidth: 1, padding: 14 } as ViewStyle,
    tileIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 10 } as ViewStyle,
    tileLabel: { fontFamily: FONTS.bodyMedium, fontSize: fs(14), fontWeight: '600', marginBottom: 2 } as TextStyle,
    tileSub: { fontFamily: FONTS.bodyRegular, fontSize: fs(12), lineHeight: lh(12, 1.3) } as TextStyle,
  });
}
