// Step2Goal — "What's your main goal?"
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING } from '@/constants/theme';
import { OptionCard } from './OptionCard';
import type { FastingPurpose } from '@/types/user';

const GOALS = [
  { id: 'weight_loss', icon: '⚖️', name: 'Lose weight',        desc: 'Calorie deficit, fat burning window', hint: undefined },
  { id: 'energy',      icon: '⚡', name: 'Energy & focus',     desc: 'Mental clarity, sustained daily energy', hint: undefined },
  { id: 'metabolic',   icon: '🩸', name: 'Metabolic health',   desc: 'Blood sugar, insulin sensitivity', hint: undefined },
  { id: 'spiritual',   icon: '🪔', name: 'Spiritual practice', desc: 'Vedic fasting, Ekadashi calendar', hint: undefined },
];

interface Props {
  value:    FastingPurpose | null;
  onChange: (v: FastingPurpose) => void;
}

export const Step2Goal: React.FC<Props> = ({ value, onChange }) => {
  const { isDark } = useTheme();
  const iconOpac = useRef(new Animated.Value(0)).current;
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

  return (
    <View style={s.wrap}>
      <Animated.View style={[s.iconWrap, { opacity: iconOpac, transform: [{ scale: iconScale }], backgroundColor: 'rgba(200,135,42,0.1)', borderColor: isDark ? 'rgba(200,135,42,0.2)' : 'rgba(200,135,42,0.28)' }]}>
        <Text style={s.iconEmoji}>🎯</Text>
      </Animated.View>
      <Text style={[s.heading, { color: cream }]}>
        What's your{'\n'}<Text style={[s.accent, { color: goldLt }]}>main goal?</Text>
      </Text>
      <Text style={[s.sub, { color: mutedSub }]}>We'll build everything around this</Text>
      <View style={s.cards}>
        {GOALS.map((g, i) => (
          <OptionCard
            key={g.id} item={g} selected={value === g.id}
            onPress={() => onChange(g.id as FastingPurpose)}
            delay={i * 70} isDark={isDark}
          />
        ))}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  wrap:    { flex: 1, paddingTop: SPACING.xl }                                                                                         as ViewStyle,
  iconWrap:{ width: 50, height: 50, borderRadius: 25, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: SPACING.lg } as ViewStyle,
  iconEmoji: { fontSize: 20 }                                                                                                          as TextStyle,
  heading: { fontFamily: FONTS.displayLight, fontSize: 38, lineHeight: 44, letterSpacing: 0.2, marginBottom: SPACING.xs }             as TextStyle,
  accent:  { fontFamily: FONTS.displayItalic, fontSize: 38 }                                                                          as TextStyle,
  sub:     { fontFamily: FONTS.bodyRegular, fontSize: 13, lineHeight: 21, marginBottom: SPACING.xl }                                  as TextStyle,
  cards:   { gap: SPACING.sm + 2 }                                                                                                    as ViewStyle,
});
