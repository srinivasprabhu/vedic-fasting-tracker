import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ScrollView, ViewStyle, TextStyle } from 'react-native';
import { Waves, Flame, Zap, Brain, Sparkles, Leaf } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { METABOLIC_ZONE_PALETTE } from '@/constants/metabolicZones';
import { FONTS, SPACING, fs, lh } from '@/constants/theme';
import { hexAlpha } from '@/constants/colors';
import type { ColorScheme } from '@/constants/colors';

const ZONES = [
  { id: 'anabolic', name: 'Fed state', hours: '0–4h', icon: Waves, color: METABOLIC_ZONE_PALETTE.anabolic, desc: 'Digesting food, insulin elevated' },
  { id: 'catabolic', name: 'Catabolic', hours: '4–12h', icon: Flame, color: METABOLIC_ZONE_PALETTE.catabolic, desc: 'Glycogen depleting, fat mobilisation starts' },
  { id: 'fatBurning', name: 'Fat burning', hours: '12–18h', icon: Zap, color: METABOLIC_ZONE_PALETTE.fatBurning, desc: 'Primary fuel switches to stored body fat' },
  { id: 'ketosis', name: 'Ketosis', hours: '18–24h', icon: Brain, color: METABOLIC_ZONE_PALETTE.ketosis, desc: 'Ketone production ramps up, mental clarity' },
  { id: 'autophagy', name: 'Autophagy', hours: '24–48h', icon: Sparkles, color: METABOLIC_ZONE_PALETTE.autophagy, desc: 'Cellular cleanup and renewal accelerates' },
  { id: 'deepRenewal', name: 'Deep renewal', hours: '48h+', icon: Leaf, color: METABOLIC_ZONE_PALETTE.deepRenewal, desc: 'Immune regeneration, stem cell activation' },
];

const BAR_FLEX = [10, 20, 20, 18, 20, 12];

export default function SlideMetabolicZones() {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const revealAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      revealAnim.setValue(1);
      return;
    }
    Animated.timing(revealAnim, {
      toValue: 1, duration: 1000, delay: 300,
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, [reduceMotion, revealAnim]);

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.barSection}>
        <Text style={[styles.barLabel, { color: colors.textMuted }]}>YOUR FASTING TIMELINE</Text>
        <View style={styles.barContainer}>
          {ZONES.map((z, i) => (
            <Animated.View
              key={z.id}
              style={[
                styles.barSegment,
                {
                  flex: BAR_FLEX[i],
                  backgroundColor: z.color,
                  opacity: revealAnim.interpolate({
                    inputRange: [0, 0.15 + i * 0.14, 0.35 + i * 0.14],
                    outputRange: [0.15, 0.15, 1],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          ))}
        </View>
        <View style={styles.barTimes}>
          <Text style={[styles.barTime, { color: colors.textMuted }]}>0h</Text>
          <Text style={[styles.barTime, { color: colors.textMuted }]}>12h</Text>
          <Text style={[styles.barTime, { color: colors.textMuted }]}>24h</Text>
          <Text style={[styles.barTime, { color: colors.textMuted }]}>48h+</Text>
        </View>
      </View>

      <Text style={styles.title}>Metabolic zones</Text>
      <Text style={styles.body}>
        During a fast, your body progresses through distinct metabolic phases. Aayu tracks which zone you&apos;re in and how long you spend there.
      </Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
        <Text style={[styles.cardHeader, { color: colors.textMuted }]}>What each zone means</Text>
        {ZONES.map((z, i) => (
          <View key={z.id} style={[styles.zoneRow, i < ZONES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}>
            <View style={[styles.zoneIconWrap, { backgroundColor: hexAlpha(z.color, 0.12) }]}>
              <z.icon size={18} color={z.color} />
            </View>
            <View style={styles.zoneTextCol}>
              <View style={styles.zoneNameRow}>
                <Text style={[styles.zoneName, { color: colors.text }]}>{z.name}</Text>
                <Text style={[styles.zoneHours, { color: colors.textMuted }]}>{z.hours}</Text>
              </View>
              <Text style={[styles.zoneDesc, { color: colors.textSecondary }]}>{z.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    wrap: { flex: 1 } as ViewStyle,
    scrollContent: { paddingTop: SPACING.lg, paddingBottom: 100 } as ViewStyle,
    barSection: { marginBottom: SPACING.xl } as ViewStyle,
    barLabel: { fontFamily: FONTS.bodyMedium, fontSize: fs(10), fontWeight: '600', letterSpacing: 1.5, marginBottom: 10 } as TextStyle,
    barContainer: { flexDirection: 'row', height: 28, borderRadius: 8, overflow: 'hidden' } as ViewStyle,
    barSegment: { height: '100%' } as ViewStyle,
    barTimes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 } as ViewStyle,
    barTime: { fontFamily: FONTS.bodyRegular, fontSize: fs(10) } as TextStyle,
    title: { fontFamily: FONTS.displayLight, fontSize: fs(28), color: colors.text, letterSpacing: -0.3, marginBottom: SPACING.xs } as TextStyle,
    body: { fontFamily: FONTS.bodyRegular, fontSize: fs(14), lineHeight: lh(14, 1.45), color: colors.textSecondary, marginBottom: SPACING.lg } as TextStyle,
    card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' } as ViewStyle,
    cardHeader: { fontFamily: FONTS.bodyMedium, fontSize: fs(12), fontWeight: '600', letterSpacing: 0.3, padding: 14, paddingBottom: 8 } as TextStyle,
    zoneRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 } as ViewStyle,
    zoneIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
    zoneTextCol: { flex: 1 } as ViewStyle,
    zoneNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } as ViewStyle,
    zoneName: { fontFamily: FONTS.bodyMedium, fontSize: fs(14), fontWeight: '600' } as TextStyle,
    zoneHours: { fontFamily: FONTS.bodyRegular, fontSize: fs(12) } as TextStyle,
    zoneDesc: { fontFamily: FONTS.bodyRegular, fontSize: fs(12), lineHeight: lh(12, 1.35), marginTop: 2 } as TextStyle,
  });
}
