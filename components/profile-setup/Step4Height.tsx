// Step4Height — "How tall are you?"
import React, { useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import { Ruler } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS, fs, lh } from '@/constants/theme';
import { cmToFtIn } from '@/utils/calculatePlan';

type HeightUnit = 'cm' | 'ft';

interface Props {
  valueCm:  string;
  onChange: (cm: string) => void;
}

export const Step4Height: React.FC<Props> = ({ valueCm, onChange }) => {
  const { isDark } = useTheme();
  const [unit, setUnit] = React.useState<HeightUnit>('cm');
  const [ftVal, setFtVal] = React.useState('');
  const [inVal, setInVal] = React.useState('');

  const focusAnim = useRef(new Animated.Value(0)).current;
  const iconOpac  = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;

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

  const handleCmChange = (v: string) => {
    onChange(v);
    // Sync ft/in display
    const n = parseFloat(v);
    if (!isNaN(n) && n > 0) {
      const totalIn = n / 2.54;
      setFtVal(String(Math.floor(totalIn / 12)));
      setInVal(String(Math.round(totalIn % 12)));
    }
  };

  const handleFtInChange = (ft: string, inches: string) => {
    setFtVal(ft); setInVal(inches);
    const f = parseFloat(ft) || 0;
    const i = parseFloat(inches) || 0;
    const cm = Math.round((f * 12 + i) * 2.54);
    if (cm > 0) onChange(String(cm));
  };

  const cream    = isDark ? '#f0e0c0' : '#1e1004';
  const goldLt   = isDark ? '#e8a84c' : '#a06820';
  const mutedSub = isDark ? 'rgba(240,224,192,0.42)' : 'rgba(60,35,10,0.48)';
  const muted    = isDark ? '#7a6040' : '#7a5028';
  const activeClr = isDark ? 'rgba(200,135,42,0.7)' : 'rgba(200,135,42,0.72)';
  const idleClr   = isDark ? 'rgba(200,135,42,0.22)' : 'rgba(200,135,42,0.25)';

  const borderColor = focusAnim.interpolate({ inputRange: [0, 1], outputRange: [idleClr, activeClr] });
  const bgColor     = focusAnim.interpolate({ inputRange: [0, 1], outputRange: isDark ? ['rgba(200,135,42,0.04)', 'rgba(200,135,42,0.09)'] : ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.95)'] });

  // Friendly conversion hint
  const cmNum = parseFloat(valueCm);
  const hint  = !isNaN(cmNum) && cmNum > 100 ? `That's ${cmToFtIn(cmNum)}` : null;

  return (
    <View style={s.wrap}>
      <Animated.View style={[s.iconWrap, { opacity: iconOpac, transform: [{ scale: iconScale }], backgroundColor: 'rgba(200,135,42,0.1)', borderColor: isDark ? 'rgba(200,135,42,0.2)' : 'rgba(200,135,42,0.28)' }]}>
        <Ruler size={20} color={goldLt} />
      </Animated.View>
      <Text style={[s.heading, { color: cream }]}>
        How{'\n'}<Text style={[s.accent, { color: goldLt }]}>tall are you?</Text>
      </Text>
      <Text style={[s.sub, { color: mutedSub }]}>Used for BMI and calorie calculations</Text>

      {/* Unit toggle */}
      <View style={[s.toggle, { backgroundColor: isDark ? 'rgba(200,135,42,0.06)' : 'rgba(200,135,42,0.07)', borderColor: isDark ? 'rgba(200,135,42,0.18)' : 'rgba(200,135,42,0.22)' }]}>
        {(['cm', 'ft'] as HeightUnit[]).map((u) => (
          <TouchableOpacity key={u} onPress={() => setUnit(u)} style={[s.toggleBtn, unit === u && { backgroundColor: isDark ? 'rgba(200,135,42,0.18)' : 'rgba(200,135,42,0.16)' }]}>
            <Text style={[s.toggleText, { color: unit === u ? goldLt : muted, fontWeight: unit === u ? '600' : '400' }]}>{u === 'cm' ? 'cm' : 'ft / in'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {unit === 'cm' ? (
        <Animated.View style={[s.inputCard, { borderColor, backgroundColor: bgColor }]}>
          <Text style={[s.inputLabel, { color: isDark ? 'rgba(200,135,42,0.5)' : 'rgba(160,104,32,0.6)' }]}>HEIGHT</Text>
          <View style={s.inputRow}>
            <TextInput
              value={valueCm} onChangeText={handleCmChange}
              keyboardType="decimal-pad" placeholder="175"
              placeholderTextColor={isDark ? 'rgba(200,135,42,0.22)' : 'rgba(160,104,32,0.28)'}
              style={[s.input, { color: cream }]}
              onFocus={onFocus} onBlur={onBlur}
              autoFocus
            />
            <Text style={[s.unit, { color: muted }]}>cm</Text>
          </View>
          <View style={[s.underline, { backgroundColor: isDark ? 'rgba(200,135,42,0.4)' : 'rgba(200,135,42,0.38)' }]} />
        </Animated.View>
      ) : (
        <View style={s.ftRow}>
          {/* Feet */}
          <Animated.View style={[s.inputCard, { flex: 1, borderColor, backgroundColor: bgColor }]}>
            <Text style={[s.inputLabel, { color: isDark ? 'rgba(200,135,42,0.5)' : 'rgba(160,104,32,0.6)' }]}>FEET</Text>
            <View style={s.inputRow}>
              <TextInput value={ftVal} onChangeText={(v) => handleFtInChange(v, inVal)} keyboardType="number-pad" placeholder="5" placeholderTextColor={isDark ? 'rgba(200,135,42,0.22)' : 'rgba(160,104,32,0.28)'} style={[s.input, { color: cream }]} onFocus={onFocus} onBlur={onBlur} autoFocus />
              <Text style={[s.unit, { color: muted }]}>ft</Text>
            </View>
            <View style={[s.underline, { backgroundColor: isDark ? 'rgba(200,135,42,0.4)' : 'rgba(200,135,42,0.38)' }]} />
          </Animated.View>
          <View style={{ width: SPACING.sm }} />
          {/* Inches */}
          <Animated.View style={[s.inputCard, { flex: 1, borderColor, backgroundColor: bgColor }]}>
            <Text style={[s.inputLabel, { color: isDark ? 'rgba(200,135,42,0.5)' : 'rgba(160,104,32,0.6)' }]}>INCHES</Text>
            <View style={s.inputRow}>
              <TextInput value={inVal} onChangeText={(v) => handleFtInChange(ftVal, v)} keyboardType="number-pad" placeholder="9" placeholderTextColor={isDark ? 'rgba(200,135,42,0.22)' : 'rgba(160,104,32,0.28)'} style={[s.input, { color: cream }]} onFocus={onFocus} onBlur={onBlur} />
              <Text style={[s.unit, { color: muted }]}>in</Text>
            </View>
            <View style={[s.underline, { backgroundColor: isDark ? 'rgba(200,135,42,0.4)' : 'rgba(200,135,42,0.38)' }]} />
          </Animated.View>
        </View>
      )}

      {hint && (
        <Text style={[s.hint, { color: isDark ? 'rgba(240,224,192,0.3)' : 'rgba(60,35,10,0.35)' }]}>{hint}</Text>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  wrap:       { flex: 1, paddingTop: SPACING.xxl }                                                                                                                              as ViewStyle,
  iconWrap:   { width: 50, height: 50, borderRadius: 25, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: SPACING.xl }          as ViewStyle,
  heading:    { fontFamily: FONTS.displayLight, fontSize: fs(38), lineHeight: lh(38), letterSpacing: 0.2, marginBottom: SPACING.xs }                                                   as TextStyle,
  accent:     { fontFamily: FONTS.displayItalic, fontSize: fs(38), lineHeight: lh(38) }                                                                                              as TextStyle,
  sub:        { fontFamily: FONTS.bodyRegular, fontSize: fs(13), lineHeight: lh(13, 1.35), marginBottom: SPACING.lg }                                                                as TextStyle,
  toggle:     { flexDirection: 'row' as const, borderRadius: RADIUS.md, overflow: 'hidden' as const, borderWidth: 1, marginBottom: SPACING.md }                                as ViewStyle,
  toggleBtn:  { flex: 1, paddingVertical: 8, alignItems: 'center' as const }                                                                                                   as ViewStyle,
  toggleText: { fontFamily: FONTS.bodyMedium, fontSize: fs(12) }                                                                                                                   as TextStyle,
  inputCard:  { borderWidth: 1.5, borderRadius: RADIUS.lg, padding: SPACING.sm + 2, paddingTop: SPACING.sm, marginBottom: SPACING.sm }                                         as ViewStyle,
  inputLabel: { fontFamily: FONTS.bodyMedium, fontSize: fs(8), letterSpacing: 0.15, fontWeight: '500' as const, marginBottom: 5, textTransform: 'uppercase' as const }             as TextStyle,
  inputRow:   { flexDirection: 'row' as const, alignItems: 'baseline' as const, gap: 4 }                                                                                       as ViewStyle,
  input:      { flex: 1, fontFamily: FONTS.displayLight, fontSize: fs(36), lineHeight: lh(36), padding: 0 }                                                                            as TextStyle,
  unit:       { fontFamily: FONTS.bodyMedium, fontSize: fs(14), fontWeight: '500' as const }                                                                                       as TextStyle,
  underline:  { height: 1.5, borderRadius: 1, marginTop: 6 }                                                                                                                   as ViewStyle,
  ftRow:      { flexDirection: 'row' as const }                                                                                                                                 as ViewStyle,
  hint:       { fontFamily: FONTS.bodyRegular, fontSize: fs(11), marginTop: 4, textAlign: 'center' as const }                                                                      as TextStyle,
});
