// StepCurrentWeight — Screen 5: Current weight — drum-roll ruler + live BMI
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS, fs, lh } from '@/constants/theme';
import { calcBMI, getBMICategory, bmiCategoryLabel, bmiCategoryColor } from '@/utils/calculatePlan';
import type { WeightUnit } from '@/types/user';
import { Scale } from 'lucide-react-native';
import { RulerPicker } from './RulerPicker';
import { BMIScale } from './BMIScale';

interface Props {
  value:        string;
  onChange:     (v: string) => void;
  heightCm:     string;
  unit:         WeightUnit;
  onUnitChange: (u: WeightUnit) => void;
}

export const StepCurrentWeight: React.FC<Props> = ({ value, onChange, heightCm, unit, onUnitChange }) => {
  const { isDark } = useTheme();

  const opac  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  const [decimal, setDecimal] = useState('');

  useEffect(() => {
    const parts = value.split('.');
    if (parts.length < 2 || parts[1] === '') {
      setDecimal('');
    }
  }, [value]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opac,  { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const cream    = isDark ? '#f0e0c0' : '#1e1004';
  const mutedSub = isDark ? 'rgba(240,224,192,.42)' : 'rgba(60,35,10,.48)';
  const goldLt   = isDark ? '#e8a84c' : '#a06820';
  const mutedCl  = isDark ? '#7a6040' : '#7a5028';

  const defaultKg  = unit === 'lbs' ? 165 : 74;
  const minVal     = unit === 'lbs' ? 60  : 30;
  const maxVal     = unit === 'lbs' ? 400 : 180;
  const intVal     = parseInt(value, 10);
  const safeVal    = !isNaN(intVal) ? Math.min(maxVal, Math.max(minVal, intVal)) : defaultKg;

  const handleRulerChange = useCallback((v: number) => {
    const full = decimal ? `${v}.${decimal}` : String(v);
    onChange(full);
  }, [decimal, onChange]);

  const handleDecimalChange = useCallback((d: string) => {
    setDecimal(d);
    const full = d ? `${safeVal}.${d}` : String(safeVal);
    onChange(full);
  }, [safeVal, onChange]);

  const weightKg = unit === 'lbs' ? parseFloat(value) / 2.20462 : parseFloat(value);
  const cm       = parseFloat(heightCm);
  const bmi      = (!isNaN(weightKg) && !isNaN(cm) && cm > 50) ? calcBMI(weightKg, cm) : null;
  const bmiCat   = bmi ? getBMICategory(bmi) : null;
  const bmiColor = bmiCategoryColor(bmiCat, isDark);

  return (
    <Animated.View style={{ opacity: opac, transform: [{ translateY: slide }], paddingTop: SPACING.lg }}>
      <View style={[s.iconWrap, { backgroundColor: 'rgba(200,135,42,.1)', borderColor: isDark ? 'rgba(200,135,42,.2)' : 'rgba(200,135,42,.28)' }]}>
        <Scale size={20} color={goldLt} />
      </View>

      <Text style={[s.heading, { color: cream }]}>
        Current{'\n'}<Text style={[s.accent, { color: goldLt }]}>weight</Text>
      </Text>
      <Text style={[s.sub, { color: mutedSub }]}>
        BMI summary below — use the ruler for weight
      </Text>

      <View style={[s.unitToggle, {
        backgroundColor: isDark ? 'rgba(200,135,42,.06)' : 'rgba(200,135,42,.07)',
        borderColor:     isDark ? 'rgba(200,135,42,.18)' : 'rgba(200,135,42,.22)',
      }]}>
        {(['kg','lbs'] as WeightUnit[]).map((u) => (
          <TouchableOpacity
            key={u}
            onPress={() => onUnitChange(u)}
            style={[s.unitBtn, unit === u && {
              backgroundColor: isDark ? 'rgba(200,135,42,.18)' : 'rgba(200,135,42,.15)',
            }]}
          >
            <Text style={[s.unitBtnText, {
              color:      unit === u ? goldLt : mutedCl,
              fontWeight: (unit === u ? '600' : '400') as '600' | '400',
            }]}>
              {u}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {bmi && (
        <View style={[s.bmiCard, {
          backgroundColor: isDark ? 'rgba(200,135,42,.06)' : 'rgba(200,135,42,.05)',
          borderColor:     isDark ? 'rgba(200,135,42,.18)' : 'rgba(200,135,42,.2)',
        }]}>
          <Text style={[s.bmiEyebrow, { color: isDark ? 'rgba(200,135,42,.45)' : 'rgba(160,104,32,.5)' }]}>YOUR BMI</Text>
          <View style={s.bmiTopRow}>
            <View style={s.bmiValRow}>
              <Text style={[s.bmiVal, s.bmiValCompact, { color: cream }]}>{bmi}</Text>
              <Text style={[s.bmiUnit, { color: mutedCl }]}>kg/m²</Text>
            </View>
            <View style={[s.bmiCatBadge, { backgroundColor: `${bmiColor}22`, borderColor: `${bmiColor}55` }]}>
              <Text style={[s.bmiCatText, { color: bmiColor }]}>{bmiCategoryLabel(bmiCat)}</Text>
            </View>
          </View>
          <BMIScale bmi={bmi} isDark={isDark} compact />
        </View>
      )}

      <RulerPicker
        key={unit}
        value={safeVal}
        min={minVal}
        max={maxVal}
        onChange={handleRulerChange}
        unit={unit}
        showDecimal
        decimal={decimal}
        onDecimalChange={handleDecimalChange}
        accentColor={goldLt}
      />
    </Animated.View>
  );
};

const s = StyleSheet.create({
  iconWrap:    { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: SPACING.md } as ViewStyle,
  heading:     { fontFamily: FONTS.displayLight, fontSize: fs(32), lineHeight: lh(32), letterSpacing: .2, marginBottom: 4 } as TextStyle,
  accent:      { fontFamily: FONTS.displayItalic, fontSize: fs(32), lineHeight: lh(32) } as TextStyle,
  sub:         { fontFamily: FONTS.bodyRegular, fontSize: fs(13), lineHeight: lh(13, 1.35), marginBottom: SPACING.sm } as TextStyle,
  unitToggle:  { flexDirection: 'row' as const, borderRadius: RADIUS.md, borderWidth: 1, overflow: 'hidden' as const, alignSelf: 'flex-start' as const, marginBottom: SPACING.sm } as ViewStyle,
  unitBtn:     { paddingHorizontal: 16, paddingVertical: 6 } as ViewStyle,
  unitBtnText: { fontFamily: FONTS.bodyMedium, fontSize: fs(12) } as TextStyle,
  bmiCard:     { borderWidth: 1.5, borderRadius: RADIUS.lg, paddingVertical: SPACING.sm, paddingBottom: SPACING.sm - 2, paddingHorizontal: SPACING.md, marginTop: 4, marginBottom: SPACING.sm } as ViewStyle,
  bmiEyebrow:  { fontFamily: FONTS.bodyMedium, fontSize: fs(9), letterSpacing: .12, fontWeight: '500' as const, marginBottom: 4, textTransform: 'uppercase' as const } as TextStyle,
  bmiTopRow:   { flexDirection: 'row' as const, alignItems: 'flex-end' as const, justifyContent: 'space-between' as const, marginBottom: 4 } as ViewStyle,
  bmiValRow:   { flexDirection: 'row' as const, alignItems: 'baseline' as const, gap: 4 } as ViewStyle,
  bmiVal:      { fontFamily: FONTS.displayLight, fontSize: fs(32), fontWeight: '300' as const, lineHeight: lh(32) } as TextStyle,
  bmiValCompact: { fontSize: fs(26), lineHeight: lh(26) } as TextStyle,
  bmiUnit:     { fontFamily: FONTS.bodyMedium, fontSize: fs(11) } as TextStyle,
  bmiCatBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 } as ViewStyle,
  bmiCatText:  { fontFamily: FONTS.bodyMedium, fontSize: fs(11), fontWeight: '600' as const } as TextStyle,
});
