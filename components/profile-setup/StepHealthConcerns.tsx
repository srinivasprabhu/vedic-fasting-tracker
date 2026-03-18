// StepHealthConcerns — Screen 8: Multi-select health concerns
import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, ViewStyle, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS } from '@/constants/theme';
import type { HealthConcern } from '@/types/user';

interface Props { value: HealthConcern[]; onChange: (v: HealthConcern[]) => void; }

const OPTIONS: { id: HealthConcern; label: string; emoji: string }[] = [
  { id: 'none',          label: 'None',                  emoji: '✅' },
  { id: 'diabetes',      label: 'Diabetes / Pre-diabetes', emoji: '🩸' },
  { id: 'thyroid',       label: 'Thyroid condition',      emoji: '🦋' },
  { id: 'pcos',          label: 'PCOS',                   emoji: '🌸' },
  { id: 'hypertension',  label: 'High blood pressure',    emoji: '❤️' },
  { id: 'cholesterol',   label: 'High cholesterol',       emoji: '💊' },
  { id: 'heart',         label: 'Heart condition',        emoji: '🫀' },
  { id: 'prefer_not',    label: 'Prefer not to say',      emoji: '🔒' },
];

export const StepHealthConcerns: React.FC<Props> = ({ value, onChange }) => {
  const { isDark } = useTheme();
  const opac  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opac,  { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const cream    = isDark ? '#f0e0c0' : '#1e1004';
  const mutedSub = isDark ? 'rgba(240,224,192,.42)' : 'rgba(60,35,10,.48)';
  const goldLt   = isDark ? '#e8a84c' : '#a06820';

  const toggle = (id: HealthConcern) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (id === 'none') { onChange(['none']); return; }
    const without = value.filter((v) => v !== 'none');
    if (without.includes(id)) {
      const next = without.filter((v) => v !== id);
      onChange(next.length === 0 ? ['none'] : next);
    } else {
      onChange([...without, id]);
    }
  };

  return (
    <Animated.View style={{ opacity: opac, transform: [{ translateY: slide }], paddingTop: SPACING.xl }}>
      <View style={[s.iconWrap, { backgroundColor: 'rgba(200,135,42,.1)', borderColor: isDark ? 'rgba(200,135,42,.2)' : 'rgba(200,135,42,.28)' }]}>
        <Text style={{ fontSize: 20 }}>❤️</Text>
      </View>
      <Text style={[s.heading, { color: cream }]}>Any health{'\n'}<Text style={[s.accent, { color: goldLt }]}>concerns?</Text></Text>
      <Text style={[s.sub, { color: mutedSub }]}>Keeps your fasting safe · select all that apply</Text>

      <View style={s.grid}>
        {OPTIONS.map((opt) => {
          const sel = value.includes(opt.id);
          return (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={0.78}
              onPress={() => toggle(opt.id)}
              style={[s.chip, {
                backgroundColor: sel ? (isDark ? 'rgba(200,135,42,.14)' : 'rgba(200,135,42,.1)') : (isDark ? 'rgba(200,135,42,.04)' : 'rgba(255,255,255,.6)'),
                borderColor:     sel ? (isDark ? 'rgba(200,135,42,.6)' : 'rgba(200,135,42,.55)') : (isDark ? 'rgba(200,135,42,.14)' : 'rgba(200,135,42,.2)'),
              }]}
            >
              <Text style={s.chipEmoji}>{opt.emoji}</Text>
              <Text style={[s.chipLabel, { color: sel ? goldLt : (isDark ? 'rgba(240,224,192,.7)' : '#3a2010') }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[s.privacy, { color: isDark ? 'rgba(240,224,192,.26)' : 'rgba(60,35,10,.3)' }]}>
        🔒 Stored privately on your device only
      </Text>
    </Animated.View>
  );
};

const s = StyleSheet.create({
  iconWrap:   { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: SPACING.lg } as ViewStyle,
  heading:    { fontFamily: FONTS.displayLight, fontSize: 36, lineHeight: 42, letterSpacing: .2, marginBottom: SPACING.xs } as TextStyle,
  accent:     { fontFamily: FONTS.displayItalic, fontSize: 36 } as TextStyle,
  sub:        { fontFamily: FONTS.bodyRegular, fontSize: 13, lineHeight: 20, marginBottom: SPACING.xl } as TextStyle,
  grid:       { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: SPACING.sm, marginBottom: SPACING.md } as ViewStyle,
  chip:       { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 24, borderWidth: 1.5 } as ViewStyle,
  chipEmoji:  { fontSize: 14 } as TextStyle,
  chipLabel:  { fontFamily: FONTS.bodyMedium, fontSize: 13, fontWeight: '500' as const } as TextStyle,
  privacy:    { fontFamily: FONTS.bodyRegular, fontSize: 12, lineHeight: 17 } as TextStyle,
});
