// StepLastMeal — preferred last meal time to personalise fasting window
import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS } from '@/constants/theme';
import type { LastMealTime } from '@/types/user';

interface Props {
  value:    LastMealTime | null;
  onChange: (v: LastMealTime) => void;
}

const OPTIONS: { id: LastMealTime; emoji: string; label: string; desc: string }[] = [
  { id: '7pm',   emoji: '🌅', label: '7:00 pm',  desc: 'Early dinner, early to bed' },
  { id: '8pm',   emoji: '🍽️', label: '8:00 pm',  desc: 'Most common dinner time' },
  { id: '9pm',   emoji: '🌙', label: '9:00 pm',  desc: 'Late dinner, moderate schedule' },
  { id: '10pm',  emoji: '🌃', label: '10:00 pm', desc: 'Night owl, late meals' },
  { id: 'later', emoji: '🦉', label: 'After 10',  desc: 'Very late / shift work' },
];

export const StepLastMeal: React.FC<Props> = ({ value, onChange }) => {
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

  return (
    <Animated.View style={{ opacity: opac, transform: [{ translateY: slide }], paddingTop: SPACING.xl }}>
      <View style={[s.iconWrap, {
        backgroundColor: 'rgba(200,135,42,.1)',
        borderColor: isDark ? 'rgba(200,135,42,.2)' : 'rgba(200,135,42,.28)',
      }]}>
        <Text style={{ fontSize: 20 }}>🕐</Text>
      </View>

      <Text style={[s.heading, { color: cream }]}>
        Last meal{'\n'}<Text style={[s.accent, { color: goldLt }]}>time</Text>
      </Text>
      <Text style={[s.sub, { color: mutedSub }]}>
        When do you usually finish eating? This helps us{'\n'}
        set the ideal fasting window for your routine.
      </Text>

      <View style={s.list}>
        {OPTIONS.map((opt) => {
          const sel = value === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={0.78}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(opt.id); }}
              style={[s.card, {
                backgroundColor: sel
                  ? (isDark ? 'rgba(200,135,42,.14)' : 'rgba(200,135,42,.1)')
                  : (isDark ? 'rgba(200,135,42,.04)' : 'rgba(255,255,255,.65)'),
                borderColor: sel
                  ? (isDark ? 'rgba(200,135,42,.6)' : 'rgba(200,135,42,.55)')
                  : (isDark ? 'rgba(200,135,42,.12)' : 'rgba(200,135,42,.18)'),
              }]}
            >
              <Text style={s.cardEmoji}>{opt.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.cardName, { color: sel ? goldLt : cream }]}>{opt.label}</Text>
                <Text style={[s.cardDesc, { color: isDark ? 'rgba(240,224,192,.38)' : 'rgba(60,35,10,.42)' }]}>
                  {opt.desc}
                </Text>
              </View>
              {sel && (
                <View style={[s.check, { backgroundColor: isDark ? '#c8872a' : '#b07020' }]}>
                  <Text style={s.checkText}>✓</Text>
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
  heading:     { fontFamily: FONTS.displayLight, fontSize: 36, lineHeight: 42, letterSpacing: .2, marginBottom: SPACING.xs } as TextStyle,
  accent:      { fontFamily: FONTS.displayItalic, fontSize: 36 } as TextStyle,
  sub:         { fontFamily: FONTS.bodyRegular, fontSize: 13, lineHeight: 20, marginBottom: SPACING.xl } as TextStyle,
  list:        { gap: SPACING.sm } as ViewStyle,
  card:        { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, padding: 12, borderRadius: RADIUS.lg, borderWidth: 1.5 } as ViewStyle,
  cardEmoji:   { fontSize: 22, width: 36, textAlign: 'center' as const, flexShrink: 0 } as TextStyle,
  cardName:    { fontFamily: FONTS.bodyMedium, fontSize: 15, fontWeight: '600' as const, marginBottom: 1 } as TextStyle,
  cardDesc:    { fontFamily: FONTS.bodyRegular, fontSize: 13, lineHeight: 18 } as TextStyle,
  check:       { width: 22, height: 22, borderRadius: 11, alignItems: 'center' as const, justifyContent: 'center' as const, flexShrink: 0 } as ViewStyle,
  checkText:   { fontFamily: FONTS.bodyMedium, fontSize: 12, fontWeight: '700' as const, color: '#fff8ed' } as TextStyle,
});
