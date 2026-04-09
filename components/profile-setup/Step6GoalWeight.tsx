// Step6GoalWeight — "What's your target weight?" + target BMI + timeline
import React, { useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import { Target } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS, fs, lh } from '@/constants/theme';
import { calcBMI, getBMICategory, bmiCategoryLabel, bmiCategoryColor, lbsToKg, calcWeeksToGoal } from '@/utils/calculatePlan';
import type { WeightUnit } from '@/types/user';

interface Props {
  value:          string;
  unit:           WeightUnit;
  currentWeightKg: number | null;   // in kg
  heightCm:        number | null;
  onChangeValue:  (v: string) => void;
}

export const Step6GoalWeight: React.FC<Props> = ({
  value, unit, currentWeightKg, heightCm, onChangeValue,
}) => {
  const { isDark } = useTheme();
  const focusAnim = useRef(new Animated.Value(0)).current;
  const iconOpac  = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const previewAnim = useRef(new Animated.Value(0)).current;

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

  // Target BMI + timeline calc
  const goalKg  = unit === 'lbs' ? lbsToKg(parseFloat(value) || 0) : (parseFloat(value) || 0);
  const bmi     = goalKg > 0 && heightCm ? calcBMI(goalKg, heightCm) : null;
  const cat     = bmi ? getBMICategory(bmi) : null;
  const catColor = bmiCategoryColor(cat, isDark);
  const weeks   = (goalKg > 0 && currentWeightKg)
    ? calcWeeksToGoal(currentWeightKg, goalKg, 400)
    : null;
  const loseKg  = (goalKg > 0 && currentWeightKg && currentWeightKg > goalKg)
    ? (currentWeightKg - goalKg).toFixed(1)
    : null;

  useEffect(() => {
    Animated.timing(previewAnim, {
      toValue: bmi ? 1 : 0, duration: 320, useNativeDriver: true,
    }).start();
  }, [!!bmi]);

  return (
    <View style={s.wrap}>
      <Animated.View style={[s.iconWrap, { opacity: iconOpac, transform: [{ scale: iconScale }], backgroundColor: 'rgba(200,135,42,0.1)', borderColor: isDark ? 'rgba(200,135,42,0.2)' : 'rgba(200,135,42,0.28)' }]}>
        <Target size={20} color={goldLt} />
      </Animated.View>
      <Text style={[s.heading, { color: cream }]}>
        Target{'\n'}<Text style={[s.accent, { color: goldLt }]}>weight</Text>
      </Text>
      <Text style={[s.sub, { color: mutedSub }]}>Where do you want to get to?</Text>

      <Animated.View style={[s.inputCard, { borderColor, backgroundColor: bgColor }]}>
        <Text style={[s.inputLabel, { color: isDark ? 'rgba(200,135,42,0.5)' : 'rgba(160,104,32,0.6)' }]}>TARGET WEIGHT</Text>
        <View style={s.inputRow}>
          <TextInput
            value={value} onChangeText={onChangeValue}
            keyboardType="decimal-pad"
            placeholder={unit === 'lbs' ? '145' : '70'}
            placeholderTextColor={isDark ? 'rgba(200,135,42,0.22)' : 'rgba(160,104,32,0.28)'}
            style={[s.input, { color: isDark ? '#7AAE79' : '#187040' }]}
            onFocus={onFocus} onBlur={onBlur} autoFocus
          />
          <Text style={[s.unit, { color: muted }]}>{unit}</Text>
        </View>
        <View style={[s.underline, { backgroundColor: 'rgba(58,170,110,0.4)' }]} />
      </Animated.View>

      <Animated.View style={{ opacity: previewAnim }}>
        {bmi && cat && (
          <View style={[s.previewCard, { backgroundColor: isDark ? 'rgba(58,170,110,0.07)' : 'rgba(232,248,240,0.85)', borderColor: isDark ? 'rgba(58,170,110,0.22)' : 'rgba(58,170,110,0.28)' }]}>
            <Text style={[s.previewLabel, { color: isDark ? 'rgba(58,170,110,0.6)' : 'rgba(24,112,64,0.65)' }]}>TARGET BMI</Text>
            <View style={s.previewTop}>
              <View>
                <Text style={[s.bmiNum, { color: isDark ? '#7AAE79' : '#187040' }]}>{bmi}</Text>
                <Text style={[s.bmiSub, { color: isDark ? 'rgba(58,170,110,0.55)' : 'rgba(24,112,64,0.55)' }]}>kg/m²</Text>
              </View>
              <View style={[s.catBadge, { backgroundColor: catColor + '20', borderColor: catColor + '50' }]}>
                <Text style={[s.catText, { color: catColor }]}>{bmiCategoryLabel(cat)}</Text>
              </View>
            </View>
            {loseKg && weeks && (
              <View style={s.timelineRow}>
                <Text style={[s.tlLabel, { color: isDark ? 'rgba(240,224,192,0.38)' : 'rgba(60,35,10,0.4)' }]}>Lose </Text>
                <Text style={[s.tlVal, { color: isDark ? '#7AAE79' : '#187040' }]}>{loseKg} {unit} </Text>
                <Text style={[s.tlLabel, { color: isDark ? 'rgba(240,224,192,0.38)' : 'rgba(60,35,10,0.4)' }]}>in roughly </Text>
                <Text style={[s.tlVal, { color: isDark ? '#7AAE79' : '#187040' }]}>~{weeks} weeks</Text>
              </View>
            )}
          </View>
        )}
      </Animated.View>

      <TouchableOpacity onPress={() => onChangeValue('')} style={s.skipLink}>
        <Text style={[s.skipText, { color: isDark ? 'rgba(240,224,192,0.25)' : 'rgba(60,35,10,0.25)' }]}>
          Skip — I'll set this later
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const s = StyleSheet.create({
  wrap:        { flex: 1, paddingTop: SPACING.xl }                                                                                                                          as ViewStyle,
  iconWrap:    { width: 50, height: 50, borderRadius: 25, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: SPACING.lg }     as ViewStyle,
  heading:     { fontFamily: FONTS.displayLight, fontSize: fs(38), lineHeight: lh(38), letterSpacing: 0.2, marginBottom: SPACING.xs }                                              as TextStyle,
  accent:      { fontFamily: FONTS.displayItalic, fontSize: fs(38), lineHeight: lh(38) }                                                                                        as TextStyle,
  sub:         { fontFamily: FONTS.bodyRegular, fontSize: fs(13), lineHeight: lh(13, 1.35), marginBottom: SPACING.md }                                                         as TextStyle,
  inputCard:   { borderWidth: 1.5, borderRadius: RADIUS.lg, padding: SPACING.sm + 2, paddingTop: SPACING.sm, marginBottom: SPACING.md }                                    as ViewStyle,
  inputLabel:  { fontFamily: FONTS.bodyMedium, fontSize: fs(8), letterSpacing: 0.15, fontWeight: '500' as const, marginBottom: 5, textTransform: 'uppercase' as const }       as TextStyle,
  inputRow:    { flexDirection: 'row' as const, alignItems: 'baseline' as const, gap: 4 }                                                                                  as ViewStyle,
  input:       { flex: 1, fontFamily: FONTS.displayLight, fontSize: fs(36), lineHeight: lh(36), padding: 0 }                                                                      as TextStyle,
  unit:        { fontFamily: FONTS.bodyMedium, fontSize: fs(14), fontWeight: '500' as const }                                                                                  as TextStyle,
  underline:   { height: 1.5, borderRadius: 1, marginTop: 6 }                                                                                                              as ViewStyle,
  previewCard: { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.md, marginBottom: SPACING.sm }                                                                  as ViewStyle,
  previewLabel:{ fontFamily: FONTS.bodyMedium, fontSize: fs(8), letterSpacing: 0.14, fontWeight: '500' as const, textTransform: 'uppercase' as const, marginBottom: SPACING.sm } as TextStyle,
  previewTop:  { flexDirection: 'row' as const, alignItems: 'flex-end' as const, justifyContent: 'space-between' as const, marginBottom: SPACING.sm }                     as ViewStyle,
  bmiNum:      { fontFamily: FONTS.displayLight, fontSize: fs(30), fontWeight: '300' as const, lineHeight: lh(30) }                                                                as TextStyle,
  bmiSub:      { fontFamily: FONTS.bodyRegular, fontSize: fs(10), marginTop: 1 }                                                                                               as TextStyle,
  catBadge:    { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 }                                                                              as ViewStyle,
  catText:     { fontFamily: FONTS.bodyMedium, fontSize: fs(11), fontWeight: '600' as const }                                                                                  as TextStyle,
  timelineRow: { flexDirection: 'row' as const, alignItems: 'center' as const, flexWrap: 'wrap' as const }                                                                 as ViewStyle,
  tlLabel:     { fontFamily: FONTS.bodyRegular, fontSize: fs(12) }                                                                                                             as TextStyle,
  tlVal:       { fontFamily: FONTS.bodyMedium, fontSize: fs(13), fontWeight: '600' as const }                                                                                  as TextStyle,
  skipLink:    { alignItems: 'center' as const, paddingVertical: SPACING.sm }                                                                                               as ViewStyle,
  skipText:    { fontFamily: FONTS.bodyRegular, fontSize: fs(11) }                                                                                                             as TextStyle,
});
