// StepActivity — Screen 7: Activity level
import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, ViewStyle, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Activity, Armchair, Footprints, Zap, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { hexAlpha } from '@/constants/colors';
import { FONTS, SPACING, RADIUS, fs, lh } from '@/constants/theme';
import type { ActivityLevel } from '@/types/user';

interface Props { value: ActivityLevel | null; onChange: (v: ActivityLevel) => void; }

const OPTIONS: { id: ActivityLevel; Icon: typeof Activity; name: string; desc: string; example: string }[] = [
  { id: 'sedentary',         Icon: Armchair,   name: 'Sedentary',          desc: 'Desk job, little movement',          example: 'Office worker, mostly sitting' },
  { id: 'lightly_active',    Icon: Footprints, name: 'Lightly active',     desc: 'Light exercise 1–3 days/week',       example: 'Walking, light yoga' },
  { id: 'moderately_active', Icon: Activity,   name: 'Moderately active',  desc: 'Moderate exercise 3–5 days/week',    example: 'Gym, cycling, swimming' },
  { id: 'very_active',       Icon: Zap,        name: 'Very active',        desc: 'Hard exercise 6–7 days/week',        example: 'Athletes, manual labour' },
];

export const StepActivity: React.FC<Props> = ({ value, onChange }) => {
  const { isDark, colors } = useTheme();
  const opac  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opac,  { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const cream    = isDark ? colors.text : '#1e1004';
  const mutedSub = isDark ? hexAlpha(colors.text, 0.42) : 'rgba(60,35,10,.48)';
  const goldLt   = colors.primary;

  return (
    <Animated.View style={{ opacity: opac, transform: [{ translateY: slide }], paddingTop: SPACING.xl }}>
      <View style={[s.iconWrap, { backgroundColor: hexAlpha(colors.primary, 0.1), borderColor: isDark ? hexAlpha(colors.primary, 0.2) : hexAlpha(colors.primary, 0.28) }]}>
        <Activity size={20} color={goldLt} />
      </View>
      <Text style={[s.heading, { color: cream }]}>Activity{'\n'}<Text style={[s.accent, { color: goldLt }]}>level</Text></Text>
      <Text style={[s.sub, { color: mutedSub }]}>Helps calculate your daily calorie burn accurately</Text>

      <View style={s.list}>
        {OPTIONS.map((opt) => {
          const sel = value === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={0.78}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(opt.id); }}
              style={[s.card, {
                backgroundColor: sel ? (isDark ? hexAlpha(colors.primary, 0.14) : hexAlpha(colors.primary, 0.1)) : (isDark ? hexAlpha(colors.primary, 0.04) : 'rgba(255,255,255,.65)'),
                borderColor:     sel ? (isDark ? hexAlpha(colors.primary, 0.6) : hexAlpha(colors.primary, 0.55)) : (isDark ? hexAlpha(colors.primary, 0.12) : hexAlpha(colors.primary, 0.18)),
              }]}
            >
              <View style={[s.iconCircle, { backgroundColor: isDark ? hexAlpha(colors.primary, 0.08) : hexAlpha(colors.primary, 0.06) }]}>
                <opt.Icon size={16} color={goldLt} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.cardName, { color: sel ? goldLt : cream }]}>{opt.name}</Text>
                <Text style={[s.cardDesc, { color: isDark ? hexAlpha(colors.text, 0.38) : 'rgba(60,35,10,.42)' }]}>{opt.desc}</Text>
                <Text style={[s.cardExample, { color: isDark ? hexAlpha(colors.primary, 0.35) : hexAlpha(colors.trackWeight, 0.45) }]}>{opt.example}</Text>
              </View>
              {sel && (
                <View style={[s.check, { backgroundColor: isDark ? colors.primaryDark : colors.trackWeight }]}>
                  <Check size={12} color="#fff8ed" strokeWidth={3} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
};

const s = StyleSheet.create({
  iconWrap:    { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: SPACING.lg } as ViewStyle,
  heading:     { fontFamily: FONTS.displayLight, fontSize: fs(36), lineHeight: lh(36), letterSpacing: .2, marginBottom: SPACING.xs } as TextStyle,
  accent:      { fontFamily: FONTS.displayItalic, fontSize: fs(36), lineHeight: lh(36) } as TextStyle,
  sub:         { fontFamily: FONTS.bodyRegular, fontSize: fs(14), lineHeight: lh(14, 1.35), marginBottom: SPACING.xl } as TextStyle,
  list:        { gap: SPACING.sm } as ViewStyle,
  card:        { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, padding: 12, borderRadius: RADIUS.lg, borderWidth: 1.5 } as ViewStyle,
  iconCircle:  { width: 36, height: 36, borderRadius: 18, alignItems: 'center' as const, justifyContent: 'center' as const, flexShrink: 0 } as ViewStyle,
  cardName:    { fontFamily: FONTS.bodyMedium, fontSize: fs(14), fontWeight: '600' as const, marginBottom: 1 } as TextStyle,
  cardDesc:    { fontFamily: FONTS.bodyRegular, fontSize: fs(12), lineHeight: lh(12, 1.35), marginBottom: 2 } as TextStyle,
  cardExample: { fontFamily: FONTS.bodyRegular, fontSize: fs(11), lineHeight: lh(11, 1.35), fontStyle: 'italic' as const } as TextStyle,
  check:       { width: 22, height: 22, borderRadius: 11, alignItems: 'center' as const, justifyContent: 'center' as const, flexShrink: 0 } as ViewStyle,
});
