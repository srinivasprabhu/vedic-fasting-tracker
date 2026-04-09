// StepTargetWeight — Screen 6: Goal weight — drum-roll ruler + target BMI
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet,
  Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS, fs, lh } from '@/constants/theme';
import { calcBMI, getBMICategory, bmiCategoryLabel, bmiCategoryColor } from '@/utils/calculatePlan';
import type { WeightUnit } from '@/types/user';
import { Target, Check } from 'lucide-react-native';
import { RulerPicker } from './RulerPicker';

interface Props {
  value:           string;
  onChange:        (v: string) => void;
  currentWeightKg: string;
  heightCm:        string;
  unit:            WeightUnit;
}

export const StepTargetWeight: React.FC<Props> = ({ value, onChange, currentWeightKg, heightCm, unit }) => {
  const { isDark } = useTheme();

  const opac  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;
  const [decimal, setDecimal] = useState('');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opac,  { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const cream    = isDark ? '#f0e0c0' : '#1e1004';
  const mutedSub = isDark ? 'rgba(240,224,192,.42)' : 'rgba(60,35,10,.48)';
  const green    = isDark ? '#7AAE79' : '#187040';

  const toKg = useCallback((s: string) =>
    unit === 'lbs' ? parseFloat(s) / 2.20462 : parseFloat(s), [unit]);

  const defaultGoal = unit === 'lbs' ? 145 : 70;
  const minVal      = unit === 'lbs' ? 60  : 30;
  const maxVal      = unit === 'lbs' ? 400 : 180;
  const intVal      = parseInt(value, 10);
  const safeVal     = !isNaN(intVal) ? Math.min(maxVal, Math.max(minVal, intVal)) : defaultGoal;

  const handleRulerChange = useCallback((v: number) => {
    const full = decimal ? `${v}.${decimal}` : String(v);
    onChange(full);
  }, [decimal, onChange]);

  const handleDecimalChange = useCallback((d: string) => {
    setDecimal(d);
    const full = d ? `${safeVal}.${d}` : String(safeVal);
    onChange(full);
  }, [safeVal, onChange]);

  // Target BMI
  const cm       = parseFloat(heightCm);
  const goalKg   = toKg(value);
  const targetBmi   = (!isNaN(goalKg) && !isNaN(cm) && cm > 50 && goalKg > 20) ? calcBMI(goalKg, cm) : null;
  const targetCat   = targetBmi ? getBMICategory(targetBmi) : null;
  const targetColor = bmiCategoryColor(targetCat, isDark);

  return (
    <Animated.View style={{ opacity: opac, transform: [{ translateY: slide }], paddingTop: SPACING.xl }}>
      <View style={[s.iconWrap, { backgroundColor: 'rgba(58,170,110,.1)', borderColor: isDark ? 'rgba(58,170,110,.2)' : 'rgba(58,170,110,.28)' }]}>
        <Target size={20} color={green} />
      </View>

      <Text style={[s.heading, { color: cream }]}>
        Target{'\n'}<Text style={[s.accent, { color: green }]}>weight</Text>
      </Text>
      <Text style={[s.sub, { color: mutedSub }]}>
        Target BMI stays visible above — scroll the ruler below
      </Text>

      {/* Target BMI — above ruler so it stays on screen without scrolling */}
      {targetBmi && (
        <View style={[s.previewCard, {
          backgroundColor: isDark ? 'rgba(58,170,110,.07)' : 'rgba(58,170,110,.06)',
          borderColor:     isDark ? 'rgba(58,170,110,.2)'  : 'rgba(58,170,110,.22)',
        }]}>
          <Text style={[s.previewLabel, { color: isDark ? 'rgba(58,170,110,.55)' : 'rgba(24,112,64,.6)' }]}>
            TARGET BMI
          </Text>
          <View style={s.previewRow}>
            <View style={s.previewValRow}>
              <Text style={[s.previewBig, { color: green }]}>{targetBmi}</Text>
              <Text style={[s.previewUnit, { color: isDark ? 'rgba(58,170,110,.5)' : 'rgba(24,112,64,.55)' }]}>kg/m²</Text>
            </View>
            <View style={[s.previewBadge, { backgroundColor: `${targetColor}22`, borderColor: `${targetColor}55` }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Text style={[s.previewBadgeText, { color: targetColor }]}>
                  {bmiCategoryLabel(targetCat)}
                </Text>
                {targetCat === 'normal' && <Check size={11} color={targetColor} strokeWidth={3} />}
              </View>
            </View>
          </View>
        </View>
      )}

      <RulerPicker
        value={safeVal}
        min={minVal}
        max={maxVal}
        onChange={handleRulerChange}
        unit={unit}
        showDecimal
        decimal={decimal}
        onDecimalChange={handleDecimalChange}
        accentColor={green}
      />
    </Animated.View>
  );
};

const s = StyleSheet.create({
  iconWrap:        { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: SPACING.lg } as ViewStyle,
  heading:         { fontFamily: FONTS.displayLight, fontSize: fs(36), lineHeight: lh(36), letterSpacing: .2, marginBottom: SPACING.xs } as TextStyle,
  accent:          { fontFamily: FONTS.displayItalic, fontSize: fs(36), lineHeight: lh(36) } as TextStyle,
  sub:             { fontFamily: FONTS.bodyRegular, fontSize: fs(13), lineHeight: lh(13, 1.35), marginBottom: SPACING.md } as TextStyle,
  previewCard:     { borderWidth: 1.5, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm } as ViewStyle,
  previewLabel:    { fontFamily: FONTS.bodyMedium, fontSize: fs(10), letterSpacing: .14, fontWeight: '500' as const, marginBottom: 8, textTransform: 'uppercase' as const } as TextStyle,
  previewRow:      { flexDirection: 'row' as const, alignItems: 'flex-end' as const, justifyContent: 'space-between' as const, marginBottom: 8 } as ViewStyle,
  previewValRow:   { flexDirection: 'row' as const, alignItems: 'baseline' as const, gap: 4 } as ViewStyle,
  previewBig:      { fontFamily: FONTS.displayLight, fontSize: fs(32), fontWeight: '300' as const, lineHeight: lh(32) } as TextStyle,
  previewUnit:     { fontFamily: FONTS.bodyMedium, fontSize: fs(11) } as TextStyle,
  previewBadge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 } as ViewStyle,
  previewBadgeText:{ fontFamily: FONTS.bodyMedium, fontSize: fs(11), fontWeight: '600' as const } as TextStyle,
});
