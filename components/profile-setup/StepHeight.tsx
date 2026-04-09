// StepHeight — Screen 4: Height — drum-roll ruler picker
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Easing, ScrollView, ViewStyle, TextStyle,
} from 'react-native';
import { Ruler } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS, fs, lh } from '@/constants/theme';
import { hexAlpha } from '@/constants/colors';
import { cmToFtIn } from '@/utils/calculatePlan';
import { RulerPicker } from './RulerPicker';

interface Props { value: string; onChange: (v: string) => void; }

export const StepHeight: React.FC<Props> = ({ value, onChange }) => {
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

  // Parse integer cm from the string value
  const intVal = parseInt(value, 10);
  const safeVal = !isNaN(intVal) && intVal >= 100 && intVal <= 250 ? intVal : 170;

  const handleChange = useCallback((v: number) => {
    onChange(String(v));
  }, [onChange]);

  const hint = safeVal > 50 ? `≈ ${cmToFtIn(safeVal)}` : undefined;

  return (
    <Animated.View style={{ opacity: opac, transform: [{ translateY: slide }], paddingTop: SPACING.xl }}>
      <View style={[s.iconWrap, { backgroundColor: hexAlpha(colors.primary, 0.1), borderColor: isDark ? hexAlpha(colors.primary, 0.2) : hexAlpha(colors.primary, 0.28) }]}>
        <Ruler size={20} color={goldLt} />
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
  heading:  { fontFamily: FONTS.displayLight, fontSize: fs(36), lineHeight: lh(36), letterSpacing: .2, marginBottom: SPACING.xs } as TextStyle,
  accent:   { fontFamily: FONTS.displayItalic, fontSize: fs(36), lineHeight: lh(36) } as TextStyle,
  sub:      { fontFamily: FONTS.bodyRegular, fontSize: fs(13), lineHeight: lh(13, 1.35), marginBottom: SPACING.xl } as TextStyle,
});
