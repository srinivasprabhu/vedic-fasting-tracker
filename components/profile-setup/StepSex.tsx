// StepSex — Screen 3: Biological sex
import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { User, UserX, Lock } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS, fs, lh } from '@/constants/theme';
import { hexAlpha } from '@/constants/colors';
import type { UserSex } from '@/types/user';

interface Props { value: UserSex | null; onChange: (v: UserSex) => void; }

const OPTIONS: { id: UserSex; Icon: typeof User; label: string }[] = [
  { id: 'male',              Icon: User,  label: 'Male'       },
  { id: 'female',            Icon: User,  label: 'Female'     },
  { id: 'prefer_not_to_say', Icon: UserX, label: 'Prefer not' },
];

export const StepSex: React.FC<Props> = ({ value, onChange }) => {
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
  const mutedDim = isDark ? hexAlpha(colors.text, 0.28) : 'rgba(60,35,10,.3)';

  return (
    <Animated.View style={{ opacity: opac, transform: [{ translateY: slide }], paddingTop: SPACING.xl }}>
      <View style={[s.iconWrap, { backgroundColor: hexAlpha(colors.primary, 0.1), borderColor: isDark ? hexAlpha(colors.primary, 0.2) : hexAlpha(colors.primary, 0.28) }]}>
        <User size={20} color={goldLt} />
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
                backgroundColor: sel ? (isDark ? hexAlpha(colors.primary, 0.16) : hexAlpha(colors.primary, 0.12)) : (isDark ? hexAlpha(colors.primary, 0.05) : 'rgba(255,255,255,.65)'),
                borderColor:     sel ? (isDark ? hexAlpha(colors.primary, 0.65) : hexAlpha(colors.primary, 0.6)) : (isDark ? hexAlpha(colors.primary, 0.15) : hexAlpha(colors.primary, 0.2)),
              }]}
            >
              <opt.Icon size={24} color={sel ? goldLt : (isDark ? 'rgba(240,224,192,.6)' : 'rgba(30,16,4,.6)')} />
              <Text style={[s.label, { color: sel ? goldLt : (isDark ? 'rgba(240,224,192,.7)' : '#3a2010') }]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={s.privacyRow}>
        <Lock size={12} color={mutedDim} />
        <Text style={[s.privacy, { color: mutedDim }]}>
          Stored only on your device · never shared
        </Text>
      </View>
    </Animated.View>
  );
};

const s = StyleSheet.create({
  iconWrap:   { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: SPACING.lg } as ViewStyle,
  heading:    { fontFamily: FONTS.displayLight, fontSize: fs(36), lineHeight: lh(36), letterSpacing: .2, marginBottom: SPACING.xs } as TextStyle,
  accent:     { fontFamily: FONTS.displayItalic, fontSize: fs(36), lineHeight: lh(36) } as TextStyle,
  sub:        { fontFamily: FONTS.bodyRegular, fontSize: fs(14), lineHeight: lh(14, 1.35), marginBottom: SPACING.xl } as TextStyle,
  row:        { flexDirection: 'row' as const, gap: SPACING.sm, marginBottom: SPACING.lg } as ViewStyle,
  btn:        { flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1.5, alignItems: 'center' as const, gap: 5 } as ViewStyle,
  label:      { fontFamily: FONTS.bodyMedium, fontSize: fs(13), fontWeight: '500' as const } as TextStyle,
  privacyRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6, marginTop: SPACING.sm } as ViewStyle,
  privacy:    { fontFamily: FONTS.bodyRegular, fontSize: fs(12), lineHeight: lh(12, 1.35), textAlign: 'center' as const } as TextStyle,
});
