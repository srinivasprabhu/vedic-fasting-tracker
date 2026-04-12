// StepLastMeal — preferred last meal time to personalise fasting window
import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Clock, Sunrise, UtensilsCrossed, Moon, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS, fs, lh } from '@/constants/theme';
import type { LastMealTime } from '@/types/user';

interface Props {
  value:    LastMealTime | null;
  onChange: (v: LastMealTime) => void;
}

/** Shared with home/settings pickers */
export const LAST_MEAL_OPTIONS: { id: LastMealTime; Icon: typeof Clock; label: string; desc: string }[] = [
  { id: '7pm',   Icon: Sunrise,          label: '7:00 pm',  desc: 'Early dinner, early to bed' },
  { id: '8pm',   Icon: UtensilsCrossed,  label: '8:00 pm',  desc: 'Most common dinner time' },
  { id: '9pm',   Icon: Moon,             label: '9:00 pm',  desc: 'Late dinner, moderate schedule' },
  { id: '10pm',  Icon: Moon,             label: '10:00 pm', desc: 'Night owl, late meals' },
  { id: 'later', Icon: Moon,             label: 'After 10',  desc: 'Very late / shift work' },
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
        <Clock size={20} color={goldLt} />
      </View>

      <Text style={[s.heading, { color: cream }]}>
        Last meal{'\n'}<Text style={[s.accent, { color: goldLt }]}>time</Text>
      </Text>
      <Text style={[s.sub, { color: mutedSub }]}>
        When do you usually finish eating? This helps us{'\n'}
        set the ideal fasting window for your routine.
      </Text>

      <View style={s.list}>
        {LAST_MEAL_OPTIONS.map((opt) => {
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
              <View style={[s.iconCircle, { backgroundColor: isDark ? 'rgba(200,135,42,.08)' : 'rgba(200,135,42,.06)' }]}>
                <opt.Icon size={16} color={goldLt} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.cardName, { color: sel ? goldLt : cream }]}>{opt.label}</Text>
                <Text style={[s.cardDesc, { color: isDark ? 'rgba(240,224,192,.38)' : 'rgba(60,35,10,.42)' }]}>
                  {opt.desc}
                </Text>
              </View>
              {sel && (
                <View style={[s.check, { backgroundColor: isDark ? '#c8872a' : '#b07020' }]}>
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
  iconWrap:   { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: SPACING.lg } as ViewStyle,
  heading:    { fontFamily: FONTS.displayLight, fontSize: fs(36), lineHeight: lh(36), letterSpacing: .2, marginBottom: SPACING.xs } as TextStyle,
  accent:     { fontFamily: FONTS.displayItalic, fontSize: fs(36), lineHeight: lh(36) } as TextStyle,
  sub:        { fontFamily: FONTS.bodyRegular, fontSize: fs(13), lineHeight: lh(13, 1.35), marginBottom: SPACING.xl } as TextStyle,
  list:       { gap: SPACING.sm } as ViewStyle,
  card:       { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, padding: 12, borderRadius: RADIUS.lg, borderWidth: 1.5 } as ViewStyle,
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center' as const, justifyContent: 'center' as const, flexShrink: 0 } as ViewStyle,
  cardName:   { fontFamily: FONTS.bodyMedium, fontSize: fs(15), fontWeight: '600' as const, marginBottom: 1 } as TextStyle,
  cardDesc:   { fontFamily: FONTS.bodyRegular, fontSize: fs(13), lineHeight: lh(13, 1.35) } as TextStyle,
  check:      { width: 22, height: 22, borderRadius: 11, alignItems: 'center' as const, justifyContent: 'center' as const, flexShrink: 0 } as ViewStyle,
});
