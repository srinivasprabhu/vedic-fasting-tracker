import React from 'react';
import { View, Text, StyleSheet, ScrollView, ViewStyle, TextStyle } from 'react-native';
import { TrendingUp, FileText, Heart, Lock, Sparkles } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, fs, lh } from '@/constants/theme';
import { hexAlpha } from '@/constants/colors';
import type { ColorScheme } from '@/constants/colors';

const PRO_FEATURES = [
  {
    icon: TrendingUp,
    title: 'Weight projection',
    description: 'See where your weight is heading based on your fasting consistency and metabolic data.',
    color: '#3aaa6e',
  },
  {
    icon: FileText,
    title: 'Monthly PDF report',
    description: 'A detailed analysis of your fasting journey — score breakdown, behaviour patterns, and personalised next-month plan.',
    color: '#e8a84c',
  },
  {
    icon: Heart,
    title: 'Health integration',
    description: 'Sync with Apple Health or Google Health Connect for steps, weight, and active energy from your wearables.',
    color: '#c05050',
  },
];

export default function SlideProFeatures() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.headerWrap}>
        <View style={[styles.proBadge, { backgroundColor: hexAlpha(colors.primary, 0.12) }]}>
          <Sparkles size={14} color={colors.primary} />
          <Text style={[styles.proBadgeText, { color: colors.primary }]}>AAYU PRO</Text>
        </View>
      </View>

      <Text style={styles.title}>Go deeper</Text>
      <Text style={styles.body}>
        Everything you need is free. When you&apos;re ready for more, Pro unlocks advanced insights to accelerate your progress.
      </Text>

      {PRO_FEATURES.map((f) => (
        <View key={f.title} style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <View style={styles.featureHeader}>
            <View style={[styles.featureIconWrap, { backgroundColor: hexAlpha(f.color, 0.12) }]}>
              <f.icon size={22} color={f.color} />
            </View>
            <View style={[styles.lockPill, { backgroundColor: hexAlpha(colors.primary, 0.08) }]}>
              <Lock size={10} color={colors.primary} />
              <Text style={[styles.lockText, { color: colors.primary }]}>PRO</Text>
            </View>
          </View>
          <Text style={[styles.featureTitle, { color: colors.text }]}>{f.title}</Text>
          <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{f.description}</Text>
        </View>
      ))}

      <Text style={[styles.footnote, { color: colors.textMuted }]}>
        You can upgrade anytime from Settings. No commitment required.
      </Text>
    </ScrollView>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    wrap: { flex: 1 } as ViewStyle,
    scrollContent: { paddingTop: SPACING.xl, paddingBottom: 100 } as ViewStyle,
    headerWrap: { flexDirection: 'row', marginBottom: SPACING.md } as ViewStyle,
    proBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 } as ViewStyle,
    proBadgeText: { fontFamily: FONTS.bodyMedium, fontSize: fs(11), fontWeight: '700', letterSpacing: 1.2 } as TextStyle,
    title: { fontFamily: FONTS.displayLight, fontSize: fs(30), color: colors.text, letterSpacing: -0.3, marginBottom: SPACING.xs } as TextStyle,
    body: { fontFamily: FONTS.bodyRegular, fontSize: fs(15), lineHeight: lh(15, 1.45), color: colors.textSecondary, marginBottom: SPACING.xl } as TextStyle,
    featureCard: { borderRadius: 16, borderWidth: 1, padding: 18, marginBottom: 12 } as ViewStyle,
    featureHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } as ViewStyle,
    featureIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
    lockPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 } as ViewStyle,
    lockText: { fontFamily: FONTS.bodyMedium, fontSize: fs(9), fontWeight: '800', letterSpacing: 0.8 } as TextStyle,
    featureTitle: { fontFamily: FONTS.bodyMedium, fontSize: fs(17), fontWeight: '700', letterSpacing: -0.2, marginBottom: 6 } as TextStyle,
    featureDesc: { fontFamily: FONTS.bodyRegular, fontSize: fs(13), lineHeight: lh(13, 1.45) } as TextStyle,
    footnote: { fontFamily: FONTS.bodyRegular, fontSize: fs(12), textAlign: 'center', marginTop: SPACING.md } as TextStyle,
  });
}
