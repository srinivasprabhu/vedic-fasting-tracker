// StepSex — Screen 3: Biological sex
import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS } from '@/constants/theme';
import type { UserSex } from '@/types/user';

interface Props { value: UserSex | null; onChange: (v: UserSex) => void; }

const OPTIONS: { id: UserSex; symbol: string; label: string }[] = [
  { id: 'male',              symbol: '♂', label: 'Male'       },
  { id: 'female',            symbol: '♀', label: 'Female'     },
  { id: 'prefer_not_to_say', symbol: '◎', label: 'Prefer not' },
];

export const StepSex: React.FC<Props> = ({ value, onChange }) => {
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
  const mutedDim = isDark ? 'rgba(240,224,192,.28)' : 'rgba(60,35,10,.3)';

  return (
    <Animated.View style={{ opacity: opac, transform: [{ translateY: slide }], paddingTop: SPACING.xl }}>
      <View style={[s.iconWrap, { backgroundColor: 'rgba(200,135,42,.1)', borderColor: isDark ? 'rgba(200,135,42,.2)' : 'rgba(200,135,42,.28)' }]}>
        <Text style={{ fontSize: 20 }}>👤</Text>
      </View>
      <Text style={[s.heading, { color: cream }]}>Your{'\n'}<Text style={[s.accent, { color: goldLt }]}>biological sex</Text></Text>
      <Text style={[s.sub, { color: mutedSub }]}>Used to calculate your metabolic rate accurately</Text>

      <View style={s.row}>
        {OPTIONS.map((opt) => {
          const sel = value === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={0.78}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(opt.id); }}
              style={[s.btn, {
                backgroundColor: sel ? (isDark ? 'rgba(200,135,42,.16)' : 'rgba(200,135,42,.12)') : (isDark ? 'rgba(200,135,42,.05)' : 'rgba(255,255,255,.65)'),
                borderColor:     sel ? (isDark ? 'rgba(200,135,42,.65)' : 'rgba(200,135,42,.6)') : (isDark ? 'rgba(200,135,42,.15)' : 'rgba(200,135,42,.2)'),
              }]}
            >
              <Text style={[s.symbol, { color: sel ? goldLt : (isDark ? 'rgba(240,224,192,.6)' : 'rgba(30,16,4,.6)') }]}>{opt.symbol}</Text>
              <Text style={[s.label, { color: sel ? goldLt : (isDark ? 'rgba(240,224,192,.7)' : '#3a2010') }]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[s.privacy, { color: mutedDim }]}>
        🔒 Stored only on your device · never shared
      </Text>
    </Animated.View>
  );
};

const s = StyleSheet.create({
  iconWrap: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: SPACING.lg } as ViewStyle,
  heading:  { fontFamily: FONTS.displayLight, fontSize: 36, lineHeight: 42, letterSpacing: .2, marginBottom: SPACING.xs } as TextStyle,
  accent:   { fontFamily: FONTS.displayItalic, fontSize: 36 } as TextStyle,
  sub:      { fontFamily: FONTS.bodyRegular, fontSize: 14, lineHeight: 21, marginBottom: SPACING.xl } as TextStyle,
  row:      { flexDirection: 'row' as const, gap: SPACING.sm, marginBottom: SPACING.lg } as ViewStyle,
  btn:      { flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1.5, alignItems: 'center' as const, gap: 5 } as ViewStyle,
  symbol:   { fontFamily: FONTS.displayLight, fontSize: 24, lineHeight: 28 } as TextStyle,
  label:    { fontFamily: FONTS.bodyMedium, fontSize: 13, fontWeight: '500' as const } as TextStyle,
  privacy:  { fontFamily: FONTS.bodyRegular, fontSize: 12, lineHeight: 17, textAlign: 'center' as const, marginTop: SPACING.sm } as TextStyle,
});
