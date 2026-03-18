// StepGoal — Screen 2: Main fasting goal
import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS } from '@/constants/theme';
import type { FastingPurpose } from '@/types/user';

interface Props { value: FastingPurpose | null; onChange: (v: FastingPurpose) => void; }

const OPTIONS: { id: FastingPurpose; emoji: string; name: string; desc: string }[] = [
  { id: 'weight_loss', emoji: '⚖️', name: 'Lose weight',       desc: 'Calorie deficit + fat burning window' },
  { id: 'energy',      emoji: '⚡', name: 'Energy & focus',    desc: 'Mental clarity, sustained energy' },
  { id: 'metabolic',   emoji: '🩸', name: 'Metabolic health',  desc: 'Blood sugar, insulin sensitivity' },
  { id: 'spiritual',   emoji: '🪔', name: 'Spiritual practice', desc: 'Vedic fasting tradition' },
];

export const StepGoal: React.FC<Props> = ({ value, onChange }) => {
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

  return (
    <Animated.View style={{ opacity: opac, transform: [{ translateY: slide }], paddingTop: SPACING.xl }}>
      <View style={[s.iconWrap, { backgroundColor: 'rgba(200,135,42,.1)', borderColor: isDark ? 'rgba(200,135,42,.2)' : 'rgba(200,135,42,.28)' }]}>
        <Text style={s.iconEmoji}>🎯</Text>
      </View>
      <Text style={[s.heading, { color: cream }]}>What's your{'\n'}<Text style={[s.accent, { color: goldLt }]}>main goal?</Text></Text>
      <Text style={[s.sub, { color: mutedSub }]}>We'll build your entire plan around this</Text>

      <View style={s.list}>
        {OPTIONS.map((opt, i) => {
          const sel = value === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={0.78}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(opt.id); }}
              style={[s.card, {
                backgroundColor: sel ? (isDark ? 'rgba(200,135,42,.14)' : 'rgba(200,135,42,.1)') : (isDark ? 'rgba(200,135,42,.04)' : 'rgba(255,255,255,.65)'),
                borderColor:     sel ? (isDark ? 'rgba(200,135,42,.6)' : 'rgba(200,135,42,.55)') : (isDark ? 'rgba(200,135,42,.12)' : 'rgba(200,135,42,.18)'),
              }]}
            >
              <View style={[s.emoji, { backgroundColor: isDark ? 'rgba(200,135,42,.08)' : 'rgba(200,135,42,.06)' }]}>
                <Text style={{ fontSize: 20 }}>{opt.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.cardName, { color: sel ? goldLt : cream }]}>{opt.name}</Text>
                <Text style={[s.cardDesc, { color: isDark ? 'rgba(240,224,192,.38)' : 'rgba(60,35,10,.42)' }]}>{opt.desc}</Text>
              </View>
              {sel && (
                <View style={[s.check, { backgroundColor: isDark ? '#c8872a' : '#b07020' }]}>
                  <Text style={s.checkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
};

const s = StyleSheet.create({
  iconWrap:  { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: SPACING.lg } as ViewStyle,
  iconEmoji: { fontSize: 20 } as TextStyle,
  heading:   { fontFamily: FONTS.displayLight, fontSize: 36, lineHeight: 42, letterSpacing: .2, marginBottom: SPACING.xs } as TextStyle,
  accent:    { fontFamily: FONTS.displayItalic, fontSize: 36 } as TextStyle,
  sub:       { fontFamily: FONTS.bodyRegular, fontSize: 14, lineHeight: 21, marginBottom: SPACING.xl } as TextStyle,
  list:      { gap: SPACING.sm } as ViewStyle,
  card:      { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, padding: 13, borderRadius: RADIUS.lg, borderWidth: 1.5 } as ViewStyle,
  emoji:     { width: 40, height: 40, borderRadius: 12, alignItems: 'center' as const, justifyContent: 'center' as const, flexShrink: 0 } as ViewStyle,
  cardName:  { fontFamily: FONTS.bodyMedium, fontSize: 15, fontWeight: '600' as const, marginBottom: 2 } as TextStyle,
  cardDesc:  { fontFamily: FONTS.bodyRegular, fontSize: 13, lineHeight: 18 } as TextStyle,
  check:     { width: 22, height: 22, borderRadius: 11, alignItems: 'center' as const, justifyContent: 'center' as const, flexShrink: 0 } as ViewStyle,
  checkText: { fontFamily: FONTS.bodyMedium, fontSize: 12, fontWeight: '700' as const, color: '#fff8ed' } as TextStyle,
});
