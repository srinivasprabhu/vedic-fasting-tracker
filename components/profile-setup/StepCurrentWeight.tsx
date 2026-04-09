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

interface Props {
  value:        string;
  onChange:     (v: string) => void;
  heightCm:     string;
  unit:         WeightUnit;
  onUnitChange: (u: WeightUnit) => void;
}

// ── BMI scale bar ─────────────────────────────────────────────────────────────

const BMIScale: React.FC<{ bmi: number; isDark: boolean; compact?: boolean }> = ({
  bmi, isDark, compact,
}) => {
  const minBMI = 10, maxBMI = 40;
  const pct    = Math.min(100, Math.max(0, ((bmi - minBMI) / (maxBMI - minBMI)) * 100));
  const needleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(needleAnim, { toValue: pct, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [pct]);

  if (compact) {
    return (
      <View style={bsc.wrap}>
        <View style={bsc.bar}>
          <View style={[bsc.seg, { flex: 1.7, backgroundColor: '#5b8dd9' }]} />
          <View style={[bsc.seg, { flex: 1.5, backgroundColor: '#3aaa6e' }]} />
          <View style={[bsc.seg, { flex: 1,   backgroundColor: '#e8c05a' }]} />
          <View style={[bsc.seg, { flex: 1.2, backgroundColor: '#e07b30' }]} />
          <View style={[bsc.seg, { flex: 2,   backgroundColor: '#e05555' }]} />
        </View>
        <View style={bsc.needleTrack}>
          <Animated.View style={[bsc.needle, {
            left: needleAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={bs.wrap}>
      <View style={bs.bar}>
        <View style={[bs.seg, { flex: 1.7, backgroundColor: '#5b8dd9' }]} />
        <View style={[bs.seg, { flex: 1.5, backgroundColor: '#3aaa6e' }]} />
        <View style={[bs.seg, { flex: 1,   backgroundColor: '#e8c05a' }]} />
        <View style={[bs.seg, { flex: 1.2, backgroundColor: '#e07b30' }]} />
        <View style={[bs.seg, { flex: 2,   backgroundColor: '#e05555' }]} />
      </View>
      <View style={bs.needleTrack}>
        <Animated.View style={[bs.needle, {
          left: needleAnim.interpolate({ inputRange: [0,100], outputRange: ['0%','100%'] }),
        }]} />
      </View>
      <View style={bs.labels}>
        {['Under','Normal','Over','Obese'].map(l => (
          <Text key={l} style={[bs.lbl, { color: isDark ? 'rgba(200,135,42,.4)' : 'rgba(160,104,32,.45)' }]}>{l}</Text>
        ))}
      </View>
    </View>
  );
};

const bsc = StyleSheet.create({
  wrap:        { marginTop: 4 }                                                         as ViewStyle,
  bar:         { flexDirection: 'row' as const, height: 5, borderRadius: 3, overflow: 'hidden' as const } as ViewStyle,
  seg:         { height: '100%' as any }                                                as ViewStyle,
  needleTrack: { height: 9, position: 'relative' as const }                              as ViewStyle,
  needle:      { position: 'absolute' as const, width: 2, height: 9, borderRadius: 1, backgroundColor: '#fff', top: 0, marginLeft: -1, shadowColor: '#000', shadowOffset: { width:0, height:1 }, shadowOpacity: .35, shadowRadius: 1.5 } as ViewStyle,
});

const bs = StyleSheet.create({
  wrap:        { marginTop: 6 }                                                         as ViewStyle,
  bar:         { flexDirection: 'row' as const, height: 8, borderRadius: 4, overflow: 'hidden' as const } as ViewStyle,
  seg:         { height: '100%' as any }                                                as ViewStyle,
  needleTrack: { height: 14, position: 'relative' as const }                            as ViewStyle,
  needle:      { position: 'absolute' as const, width: 3, height: 14, borderRadius: 2, backgroundColor: '#fff', top: 0, marginLeft: -1.5, shadowColor: '#000', shadowOffset: { width:0, height:1 }, shadowOpacity: .4, shadowRadius: 2 } as ViewStyle,
  labels:      { flexDirection: 'row' as const, justifyContent: 'space-between' as const, marginTop: 2 } as ViewStyle,
  lbl:         { fontFamily: FONTS.bodyRegular, fontSize: fs(10) }                           as TextStyle,
});

// ─── Main component ───────────────────────────────────────────────────────────

export const StepCurrentWeight: React.FC<Props> = ({ value, onChange, heightCm, unit, onUnitChange }) => {
  const { isDark } = useTheme();

  const opac  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  // Decimal part of weight (e.g. ".4" in "83.4")
  const [decimal, setDecimal] = useState('');

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

  // Parse integer kg from string
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

  // Live BMI
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

      {/* Unit toggle */}
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
              fontWeight: (unit === u ? '600' : '400') as any,
            }]}>
              {u}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Compact BMI above a shorter ruler so weight controls clear the bottom CTA */}
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
        value={safeVal}
        min={minVal}
        max={maxVal}
        onChange={handleRulerChange}
        unit={unit}
        showDecimal
        decimal={decimal}
        onDecimalChange={handleDecimalChange}
        visibleRows={3}
        compact
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
