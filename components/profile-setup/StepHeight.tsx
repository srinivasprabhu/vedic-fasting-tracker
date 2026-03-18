// StepHeight — Screen 4: Height — drum-roll ruler picker
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Easing, ScrollView, ViewStyle, TextStyle,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS } from '@/constants/theme';
import { cmToFtIn } from '@/utils/calculatePlan';
import { RulerPicker } from './RulerPicker';

interface Props { value: string; onChange: (v: string) => void; }

export const StepHeight: React.FC<Props> = ({ value, onChange }) => {
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

  // Parse integer cm from the string value
  const intVal = parseInt(value, 10);
  const safeVal = !isNaN(intVal) && intVal >= 100 && intVal <= 250 ? intVal : 170;

  const handleChange = useCallback((v: number) => {
    onChange(String(v));
  }, [onChange]);

  const hint = safeVal > 50 ? `≈ ${cmToFtIn(safeVal)}` : undefined;

  return (
    <Animated.View style={{ opacity: opac, transform: [{ translateY: slide }], paddingTop: SPACING.xl }}>
      <View style={[s.iconWrap, { backgroundColor: 'rgba(200,135,42,.1)', borderColor: isDark ? 'rgba(200,135,42,.2)' : 'rgba(200,135,42,.28)' }]}>
        <Text style={{ fontSize: 20 }}>📏</Text>
      </View>

      <Text style={[s.heading, { color: cream }]}>
        How{'\n'}<Text style={[s.accent, { color: goldLt }]}>tall are you?</Text>
      </Text>
      <Text style={[s.sub, { color: mutedSub }]}>
        Scroll to select · swipe up or down
      </Text>

      <RulerPicker
        value={safeVal}
        min={100}
        max={250}
        onChange={handleChange}
        unit="cm"
        hint={hint}
      />
    </Animated.View>
  );
};

const s = StyleSheet.create({
  iconWrap: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: SPACING.lg } as ViewStyle,
  heading:  { fontFamily: FONTS.displayLight, fontSize: 36, lineHeight: 42, letterSpacing: .2, marginBottom: SPACING.xs } as TextStyle,
  accent:   { fontFamily: FONTS.displayItalic, fontSize: 36 } as TextStyle,
  sub:      { fontFamily: FONTS.bodyRegular, fontSize: 13, lineHeight: 20, marginBottom: SPACING.xl } as TextStyle,
});
