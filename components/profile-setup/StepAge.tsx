// StepAge — exact age using the drum-roll ruler picker
import React, { useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet,
  Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS } from '@/constants/theme';
import { RulerPicker } from './RulerPicker';

interface Props {
  value:    number;
  onChange: (age: number) => void;
}

export const StepAge: React.FC<Props> = ({ value, onChange }) => {
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
  const goldLt   = isDark ? '#e8a84c' : '#a06820';
  const mutedSub = isDark ? 'rgba(240,224,192,.42)' : 'rgba(60,35,10,.48)';

  const safeVal = Math.min(80, Math.max(14, value));

  const handleChange = useCallback((v: number) => {
    onChange(v);
  }, [onChange]);

  // Contextual subtitle based on age
  const ageNote = safeVal < 18
    ? 'Please consult a guardian before starting a fasting plan'
    : safeVal >= 65
      ? 'Your plan will be optimised for gentle, safe fasting'
      : 'This helps us accurately calculate your metabolic rate';

  return (
    <Animated.View style={{ opacity: opac, transform: [{ translateY: slide }], paddingTop: SPACING.xl }}>
      <View style={[s.iconWrap, {
        backgroundColor: 'rgba(200,135,42,.1)',
        borderColor: isDark ? 'rgba(200,135,42,.2)' : 'rgba(200,135,42,.28)',
      }]}>
        <Text style={{ fontSize: 20 }}>🎂</Text>
      </View>

      <Text style={[s.heading, { color: cream }]}>
        Your{'\n'}<Text style={[s.accent, { color: goldLt }]}>age</Text>
      </Text>
      <Text style={[s.sub, { color: mutedSub }]}>
        {ageNote}
      </Text>

      <RulerPicker
        value={safeVal}
        min={14}
        max={80}
        onChange={handleChange}
        unit="yrs"
      />
    </Animated.View>
  );
};

const s = StyleSheet.create({
  iconWrap: {
    width: 48, height: 48, borderRadius: 24, borderWidth: 1,
    alignItems: 'center' as const, justifyContent: 'center' as const,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  heading: {
    fontFamily: FONTS.displayLight, fontSize: 36, lineHeight: 42,
    letterSpacing: 0.2, marginBottom: SPACING.xs,
  } as TextStyle,
  accent: {
    fontFamily: FONTS.displayItalic, fontSize: 36,
  } as TextStyle,
  sub: {
    fontFamily: FONTS.bodyRegular, fontSize: 13, lineHeight: 20,
    marginBottom: SPACING.xl,
  } as TextStyle,
});
