// Step3Sex — "What's your biological sex?"
import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS } from '@/constants/theme';
import type { UserSex } from '@/types/user';

const OPTIONS: { id: UserSex; emoji: string; label: string }[] = [
  { id: 'male',              emoji: '♂',  label: 'Male'       },
  { id: 'female',            emoji: '♀',  label: 'Female'     },
  { id: 'prefer_not_to_say', emoji: '◎', label: 'Prefer not' },
];

interface Props {
  value:    UserSex | null;
  onChange: (v: UserSex) => void;
}

export const Step3Sex: React.FC<Props> = ({ value, onChange }) => {
  const { isDark } = useTheme();
  const iconOpac  = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(iconOpac,  { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(iconScale, { toValue: 1, speed: 12, bounciness: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  const cream    = isDark ? '#f0e0c0' : '#1e1004';
  const goldLt   = isDark ? '#e8a84c' : '#a06820';
  const mutedSub = isDark ? 'rgba(240,224,192,0.42)' : 'rgba(60,35,10,0.48)';
  const privNote = isDark ? 'rgba(240,224,192,0.25)' : 'rgba(60,35,10,0.3)';

  return (
    <View style={s.wrap}>
      <Animated.View style={[s.iconWrap, { opacity: iconOpac, transform: [{ scale: iconScale }], backgroundColor: 'rgba(200,135,42,0.1)', borderColor: isDark ? 'rgba(200,135,42,0.2)' : 'rgba(200,135,42,0.28)' }]}>
        <Text style={s.iconEmoji}>👤</Text>
      </Animated.View>
      <Text style={[s.heading, { color: cream }]}>
        Your{'\n'}<Text style={[s.accent, { color: goldLt }]}>biological sex</Text>
      </Text>
      <Text style={[s.sub, { color: mutedSub }]}>
        Used to calculate your metabolic rate accurately
      </Text>

      <View style={s.row}>
        {OPTIONS.map((opt, i) => {
          const sel = value === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => onChange(opt.id)}
              activeOpacity={0.8}
              style={[
                s.btn,
                {
                  backgroundColor: sel
                    ? isDark ? 'rgba(200,135,42,0.16)' : 'rgba(200,135,42,0.12)'
                    : isDark ? 'rgba(200,135,42,0.05)' : 'rgba(255,255,255,0.65)',
                  borderColor: sel
                    ? isDark ? 'rgba(200,135,42,0.65)' : 'rgba(200,135,42,0.6)'
                    : isDark ? 'rgba(200,135,42,0.15)' : 'rgba(200,135,42,0.2)',
                },
              ]}
            >
              <Text style={s.emoji}>{opt.emoji}</Text>
              <Text style={[s.label, { color: sel ? goldLt : isDark ? '#e8d5b0' : '#3a2010' }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[s.privacy, { color: privNote }]}>
        🔒 Stored only on your device — never shared.
      </Text>
    </View>
  );
};

const s = StyleSheet.create({
  wrap:     { flex: 1, paddingTop: SPACING.xxl }                                                                                                  as ViewStyle,
  iconWrap: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: SPACING.xl } as ViewStyle,
  iconEmoji:{ fontSize: 20 }                                                                                                                      as TextStyle,
  heading:  { fontFamily: FONTS.displayLight, fontSize: 38, lineHeight: 44, letterSpacing: 0.2, marginBottom: SPACING.xs }                       as TextStyle,
  accent:   { fontFamily: FONTS.displayItalic, fontSize: 38 }                                                                                    as TextStyle,
  sub:      { fontFamily: FONTS.bodyRegular, fontSize: 13, lineHeight: 21, marginBottom: SPACING.xl + 4 }                                        as TextStyle,
  row:      { flexDirection: 'row' as const, gap: SPACING.sm, marginBottom: SPACING.lg }                                                         as ViewStyle,
  btn:      { flex: 1, borderWidth: 1.5, borderRadius: RADIUS.lg, paddingVertical: SPACING.md, alignItems: 'center' as const, gap: 5 }           as ViewStyle,
  emoji:    { fontSize: 22 }                                                                                                                      as TextStyle,
  label:    { fontFamily: FONTS.bodyMedium, fontSize: 11, fontWeight: '500' as const }                                                           as TextStyle,
  privacy:  { fontFamily: FONTS.bodyRegular, fontSize: 10, lineHeight: 15 }                                                                      as TextStyle,
});
