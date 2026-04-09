// Step5CurrentWeight — "What do you weigh today?" + live BMI scale bar
import React, { useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS, fs, lh } from '@/constants/theme';
import { calcBMI, getBMICategory, bmiCategoryLabel, bmiCategoryColor, lbsToKg } from '@/utils/calculatePlan';
import type { WeightUnit } from '@/types/user';

interface Props {
  value:    string;        // raw input string
  unit:     WeightUnit;
  heightCm: string;        // needed for live BMI
  onChangeValue: (v: string) => void;
  onChangeUnit:  (u: WeightUnit) => void;
}

// ─── BMI Scale Bar ────────────────────────────────────────────────────────────

const BMIScaleBar: React.FC<{
  bmi:    number;
  cat:    ReturnType<typeof getBMICategory>;
  isDark: boolean;
}> = ({ bmi, cat, isDark }) => {
  const BAR_W = 260;
  const BAR_H = 10;
  const SEGS  = [
    { color: '#5b8dd9', pct: 0.25 },   // underweight   10–18.5
    { color: '#3aaa6e', pct: 0.25 },   // normal        18.5–25
    { color: '#e8c05a', pct: 0.2  },   // overweight    25–30
    { color: '#e07b30', pct: 0.15 },   // obese I       30–35
    { color: '#e05555', pct: 0.15 },   // obese II      35–60
  ];

  // Map bmi (10–60) to 0–1
  const bmiPct = Math.min(1, Math.max(0, (bmi - 10) / 50));
  const needleX = bmiPct * BAR_W;

  let x = 0;
  return (
    <View>
      <Svg width={BAR_W} height={BAR_H + 18} viewBox={`0 0 ${BAR_W} ${BAR_H + 18}`}>
        {/* Segments */}
        {SEGS.map((seg, i) => {
          const segW = seg.pct * BAR_W;
          const rect = (
            <Rect key={i} x={x} y={0} width={segW} height={BAR_H} rx={i === 0 ? 5 : i === SEGS.length - 1 ? 5 : 0} fill={seg.color} />
          );
          x += segW;
          return rect;
        })}
        {/* Needle */}
        <Rect x={needleX - 1.5} y={-2} width={3} height={BAR_H + 4} rx={2} fill="#fff" />
        {/* Labels */}
        {[['10','0%'],['18.5','25%'],['25','50%'],['30','66%'],['60','100%']].map(([label, pos]) => (
          <Svg key={label}>
            <Line x1={parseFloat(pos) / 100 * BAR_W} y1={BAR_H} x2={parseFloat(pos) / 100 * BAR_W} y2={BAR_H + 5} stroke={isDark ? 'rgba(200,135,42,0.3)' : 'rgba(160,104,32,0.3)'} strokeWidth={1} />
          </Svg>
        ))}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
        {['Under', 'Normal', 'Over', 'Obese'].map((l) => (
          <Text key={l} style={{ fontFamily: FONTS.bodyRegular, fontSize: fs(8), color: isDark ? 'rgba(200,135,42,0.4)' : 'rgba(160,104,32,0.45)' }}>{l}</Text>
        ))}
      </View>
    </View>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const Step5CurrentWeight: React.FC<Props> = ({
  value, unit, heightCm, onChangeValue, onChangeUnit,
}) => {
  const { isDark } = useTheme();
  const focusAnim = useRef(new Animated.Value(0)).current;
  const iconOpac  = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const bmiAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(iconOpac,  { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(iconScale, { toValue: 1, speed: 12, bounciness: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  const onFocus = useCallback(() =>
    Animated.timing(focusAnim, { toValue: 1, duration: 220, useNativeDriver: false }).start(), []);
  const onBlur  = useCallback(() =>
    Animated.timing(focusAnim, { toValue: 0, duration: 220, useNativeDriver: false }).start(), []);

  const cream    = isDark ? '#f0e0c0' : '#1e1004';
  const goldLt   = isDark ? '#e8a84c' : '#a06820';
  const mutedSub = isDark ? 'rgba(240,224,192,0.42)' : 'rgba(60,35,10,0.48)';
  const muted    = isDark ? '#7a6040' : '#7a5028';
  const activeClr = isDark ? 'rgba(200,135,42,0.7)' : 'rgba(200,135,42,0.72)';
  const idleClr   = isDark ? 'rgba(200,135,42,0.22)' : 'rgba(200,135,42,0.25)';

  const borderColor = focusAnim.interpolate({ inputRange: [0, 1], outputRange: [idleClr, activeClr] });
  const bgColor     = focusAnim.interpolate({ inputRange: [0, 1], outputRange: isDark ? ['rgba(200,135,42,0.04)', 'rgba(200,135,42,0.09)'] : ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.95)'] });

  // Live BMI
  const kg  = unit === 'lbs' ? lbsToKg(parseFloat(value) || 0) : (parseFloat(value) || 0);
  const cm  = parseFloat(heightCm) || 0;
  const bmi = kg > 0 && cm > 50 ? calcBMI(kg, cm) : null;
  const cat = bmi ? getBMICategory(bmi) : null;
  const catColor = bmiCategoryColor(cat, isDark);

  useEffect(() => {
    Animated.timing(bmiAnim, {
      toValue: bmi ? 1 : 0, duration: 320, useNativeDriver: true,
    }).start();
  }, [!!bmi]);

  return (
    <View style={s.wrap}>
      <Animated.View style={[s.iconWrap, { opacity: iconOpac, transform: [{ scale: iconScale }], backgroundColor: 'rgba(200,135,42,0.1)', borderColor: isDark ? 'rgba(200,135,42,0.2)' : 'rgba(200,135,42,0.28)' }]}>
        <Text style={s.iconEmoji}>⚖️</Text>
      </Animated.View>
      <Text style={[s.heading, { color: cream }]}>
        Current{'\n'}<Text style={[s.accent, { color: goldLt }]}>weight</Text>
      </Text>
      <Text style={[s.sub, { color: mutedSub }]}>Your starting point — we'll track from here</Text>

      {/* Unit toggle */}
      <View style={[s.toggle, { backgroundColor: isDark ? 'rgba(200,135,42,0.06)' : 'rgba(200,135,42,0.07)', borderColor: isDark ? 'rgba(200,135,42,0.18)' : 'rgba(200,135,42,0.22)' }]}>
        {(['kg', 'lbs'] as WeightUnit[]).map((u) => (
          <TouchableOpacity key={u} onPress={() => onChangeUnit(u)} style={[s.toggleBtn, unit === u && { backgroundColor: isDark ? 'rgba(200,135,42,0.18)' : 'rgba(200,135,42,0.16)' }]}>
            <Text style={[s.toggleText, { color: unit === u ? goldLt : muted, fontWeight: unit === u ? '600' : '400' }]}>{u}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Input */}
      <Animated.View style={[s.inputCard, { borderColor, backgroundColor: bgColor }]}>
        <Text style={[s.inputLabel, { color: isDark ? 'rgba(200,135,42,0.5)' : 'rgba(160,104,32,0.6)' }]}>CURRENT WEIGHT</Text>
        <View style={s.inputRow}>
          <TextInput
            value={value} onChangeText={onChangeValue}
            keyboardType="decimal-pad"
            placeholder={unit === 'lbs' ? '165' : '74'}
            placeholderTextColor={isDark ? 'rgba(200,135,42,0.22)' : 'rgba(160,104,32,0.28)'}
            style={[s.input, { color: cream }]}
            onFocus={onFocus} onBlur={onBlur} autoFocus
          />
          <Text style={[s.unit, { color: muted }]}>{unit}</Text>
        </View>
        <View style={[s.underline, { backgroundColor: isDark ? 'rgba(200,135,42,0.4)' : 'rgba(200,135,42,0.38)' }]} />
      </Animated.View>

      {/* Live BMI card */}
      <Animated.View style={{ opacity: bmiAnim }}>
        {bmi && cat && (
          <View style={[s.bmiCard, { backgroundColor: isDark ? 'rgba(200,135,42,0.06)' : 'rgba(255,248,232,0.85)', borderColor: isDark ? 'rgba(200,135,42,0.18)' : 'rgba(200,135,42,0.22)' }]}>
            <Text style={[s.bmiLabel, { color: isDark ? 'rgba(200,135,42,0.48)' : 'rgba(160,104,32,0.55)' }]}>YOUR BMI</Text>
            <View style={s.bmiTop}>
              <View style={s.bmiLeft}>
                <Text style={[s.bmiNum, { color: cream }]}>{bmi}</Text>
                <Text style={[s.bmiKgm, { color: muted }]}> kg/m²</Text>
              </View>
              <View style={[s.catBadge, { backgroundColor: catColor + '20', borderColor: catColor + '50' }]}>
                <Text style={[s.catText, { color: catColor }]}>{bmiCategoryLabel(cat)}</Text>
              </View>
            </View>
            <BMIScaleBar bmi={bmi} cat={cat} isDark={isDark} />
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  wrap:       { flex: 1, paddingTop: SPACING.xl }                                                                                                                              as ViewStyle,
  iconWrap:   { width: 50, height: 50, borderRadius: 25, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: SPACING.lg }         as ViewStyle,
  iconEmoji:  { fontSize: fs(20) }                                                                                                                                                 as TextStyle,
  heading:    { fontFamily: FONTS.displayLight, fontSize: fs(38), lineHeight: lh(38), letterSpacing: 0.2, marginBottom: SPACING.xs }                                                  as TextStyle,
  accent:     { fontFamily: FONTS.displayItalic, fontSize: fs(38), lineHeight: lh(38) }                                                                                             as TextStyle,
  sub:        { fontFamily: FONTS.bodyRegular, fontSize: fs(13), lineHeight: lh(13, 1.35), marginBottom: SPACING.lg }                                                               as TextStyle,
  toggle:     { flexDirection: 'row' as const, borderRadius: RADIUS.md, overflow: 'hidden' as const, borderWidth: 1, marginBottom: SPACING.md }                               as ViewStyle,
  toggleBtn:  { flex: 1, paddingVertical: 8, alignItems: 'center' as const }                                                                                                  as ViewStyle,
  toggleText: { fontFamily: FONTS.bodyMedium, fontSize: fs(12) }                                                                                                                  as TextStyle,
  inputCard:  { borderWidth: 1.5, borderRadius: RADIUS.lg, padding: SPACING.sm + 2, paddingTop: SPACING.sm, marginBottom: SPACING.md }                                        as ViewStyle,
  inputLabel: { fontFamily: FONTS.bodyMedium, fontSize: fs(8), letterSpacing: 0.15, fontWeight: '500' as const, marginBottom: 5, textTransform: 'uppercase' as const }            as TextStyle,
  inputRow:   { flexDirection: 'row' as const, alignItems: 'baseline' as const, gap: 4 }                                                                                      as ViewStyle,
  input:      { flex: 1, fontFamily: FONTS.displayLight, fontSize: fs(36), lineHeight: lh(36), padding: 0 }                                                                       as TextStyle,
  unit:       { fontFamily: FONTS.bodyMedium, fontSize: fs(14), fontWeight: '500' as const }                                                                                      as TextStyle,
  underline:  { height: 1.5, borderRadius: 1, marginTop: 6 }                                                                                                                  as ViewStyle,
  bmiCard:    { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.md }                                                                                                as ViewStyle,
  bmiLabel:   { fontFamily: FONTS.bodyMedium, fontSize: fs(8), letterSpacing: 0.14, fontWeight: '500' as const, textTransform: 'uppercase' as const, marginBottom: SPACING.sm }  as TextStyle,
  bmiTop:     { flexDirection: 'row' as const, alignItems: 'flex-end' as const, justifyContent: 'space-between' as const, marginBottom: SPACING.sm }                         as ViewStyle,
  bmiLeft:    { flexDirection: 'row' as const, alignItems: 'baseline' as const }                                                                                              as ViewStyle,
  bmiNum:     { fontFamily: FONTS.displayLight, fontSize: fs(32), fontWeight: '300' as const, lineHeight: lh(32) }                                                                    as TextStyle,
  bmiKgm:     { fontFamily: FONTS.bodyRegular, fontSize: fs(11) }                                                                                                                 as TextStyle,
  catBadge:   { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 }                                                                                 as ViewStyle,
  catText:    { fontFamily: FONTS.bodyMedium, fontSize: fs(11), fontWeight: '600' as const }                                                                                      as TextStyle,
});
