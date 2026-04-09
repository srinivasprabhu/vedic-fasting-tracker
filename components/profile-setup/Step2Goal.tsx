// Step2Goal — "What's your main goal?"
import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle, TextStyle } from 'react-native';
import { Target, Scale, Zap, Droplet, Flame } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, fs, lh } from '@/constants/theme';
import { OptionCard } from './OptionCard';
import type { FastingPurpose } from '@/types/user';

interface Props {
  value:    FastingPurpose | null;
  onChange: (v: FastingPurpose) => void;
}

export const Step2Goal: React.FC<Props> = ({ value, onChange }) => {
  const { isDark, colors } = useTheme();
  const iconOpac = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(iconOpac,  { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(iconScale, { toValue: 1, speed: 12, bounciness: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  const cream    = colors.text;
  const goldLt   = colors.trackWeight;
  const mutedSub = colors.textSecondary;

  const goals = useMemo(
    () =>
      [
        { id: 'weight_loss' as const, Icon: Scale, name: 'Lose weight', desc: 'Calorie deficit, fat burning window', hint: undefined as string | undefined },
        { id: 'energy' as const, Icon: Zap, name: 'Energy & focus', desc: 'Mental clarity, sustained daily energy', hint: undefined as string | undefined },
        { id: 'metabolic' as const, Icon: Droplet, name: 'Metabolic health', desc: 'Blood sugar, insulin sensitivity', hint: undefined as string | undefined },
        { id: 'spiritual' as const, Icon: Flame, name: 'Spiritual practice', desc: 'Vedic fasting, Ekadashi calendar', hint: undefined as string | undefined },
      ].map(({ Icon, ...rest }) => ({
        ...rest,
        icon: <Icon size={20} color={goldLt} />,
      })),
    [goldLt],
  );

  return (
    <View style={s.wrap}>
      <Animated.View style={[s.iconWrap, { opacity: iconOpac, transform: [{ scale: iconScale }], backgroundColor: `${colors.primary}1A`, borderColor: `${colors.primary}33` }]}>
        <Target size={20} color={goldLt} />
      </Animated.View>
      <Text style={[s.heading, { color: cream }]}>
        What's your{'\n'}<Text style={[s.accent, { color: goldLt }]}>main goal?</Text>
      </Text>
      <Text style={[s.sub, { color: mutedSub }]}>We'll build everything around this</Text>
      <View style={s.cards}>
        {goals.map((g, i) => (
          <OptionCard
            key={g.id} item={g} selected={value === g.id}
            onPress={() => onChange(g.id as FastingPurpose)}
            delay={i * 70} isDark={isDark}
            colors={colors}
          />
        ))}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  wrap:    { flex: 1, paddingTop: SPACING.xl }                                                                                         as ViewStyle,
  iconWrap:{ width: 50, height: 50, borderRadius: 25, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: SPACING.lg } as ViewStyle,
  heading: { fontFamily: FONTS.displayLight, fontSize: fs(38), lineHeight: lh(38), letterSpacing: 0.2, marginBottom: SPACING.xs }             as TextStyle,
  accent:  { fontFamily: FONTS.displayItalic, fontSize: fs(38), lineHeight: lh(38) }                                                          as TextStyle,
  sub:     { fontFamily: FONTS.bodyRegular, fontSize: fs(13), lineHeight: lh(13, 1.35), marginBottom: SPACING.xl }                          as TextStyle,
  cards:   { gap: SPACING.sm + 2 }                                                                                                    as ViewStyle,
});
