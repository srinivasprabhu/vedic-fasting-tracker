import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ScrollView, ViewStyle, TextStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Clock, Target, Sunrise, Flame } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { FONTS, SPACING, fs, lh } from '@/constants/theme';
import { hexAlpha } from '@/constants/colors';
import type { ColorScheme } from '@/constants/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SAMPLE_SCORE = 78;
const SIZE = 160;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMF = 2 * Math.PI * RADIUS;

const COMPONENTS = [
  { icon: Clock, label: 'Duration quality', sub: 'How long your average fast lasts', max: '30 pts', color: '#e07b30' },
  { icon: Target, label: 'Consistency', sub: 'How regularly you fast each week', max: '25 pts', color: '#5b8dd9' },
  { icon: Sunrise, label: 'Circadian alignment', sub: 'How well fasts align with your sleep cycle', max: '20 pts', color: '#d4a017' },
  { icon: Flame, label: 'Deep fast exposure', sub: 'Time spent in ketosis and autophagy zones', max: '25 pts', color: '#8b6bbf' },
];

export default function SlideMetabolicScore() {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(reduceMotion ? SAMPLE_SCORE : 0);

  const scoreColor = colors.trackWeight;

  useEffect(() => {
    if (reduceMotion) {
      progressAnim.setValue(1);
      setDisplayScore(SAMPLE_SCORE);
      return;
    }
    const id = progressAnim.addListener(({ value }) => {
      setDisplayScore(Math.round(value * SAMPLE_SCORE));
    });
    Animated.timing(progressAnim, {
      toValue: 1, duration: 1200, delay: 300,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
    return () => {
      progressAnim.removeListener(id);
    };
  }, [reduceMotion, progressAnim]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMF, CIRCUMF * (1 - SAMPLE_SCORE / 100)],
  });

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.gaugeWrap}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={hexAlpha(colors.text, 0.08)} strokeWidth={STROKE} fill="none" />
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={scoreColor}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMF} ${CIRCUMF}`}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <View style={styles.gaugeCenter}>
          <Text style={[styles.gaugeValue, { color: scoreColor }]}>{displayScore}</Text>
          <Text style={[styles.gaugeMax, { color: colors.textMuted }]}>/ 100</Text>
        </View>
      </View>

      <Text style={styles.title}>Metabolic score</Text>
      <Text style={styles.body}>
        Your Metabolic Discipline Score measures the quality and consistency of your fasting practice. It&apos;s built from four components, scored out of 100.
      </Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
        <Text style={[styles.cardHeader, { color: colors.textMuted }]}>How the score is built</Text>
        {COMPONENTS.map((c, i) => (
          <View key={c.label} style={[styles.compRow, i < COMPONENTS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}>
            <View style={[styles.compIconWrap, { backgroundColor: hexAlpha(c.color, 0.12) }]}>
              <c.icon size={18} color={c.color} />
            </View>
            <View style={styles.compTextCol}>
              <Text style={[styles.compLabel, { color: colors.text }]}>{c.label}</Text>
              <Text style={[styles.compSub, { color: colors.textSecondary }]}>{c.sub}</Text>
            </View>
            <Text style={[styles.compMax, { color: colors.textMuted }]}>{c.max}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.interpretCard, { backgroundColor: hexAlpha(scoreColor, 0.06), borderColor: hexAlpha(scoreColor, 0.2) }]}>
        <Text style={[styles.interpretHeader, { color: scoreColor }]}>How to interpret your score</Text>
        <Text style={[styles.interpretBody, { color: colors.textSecondary }]}>
          A high score means you&apos;re fasting consistently, at good durations, aligned with your circadian rhythm, and spending meaningful time in deep metabolic zones. Aim for steady improvement month over month — not perfection.
        </Text>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    wrap: { flex: 1 } as ViewStyle,
    scrollContent: { paddingTop: SPACING.lg, paddingBottom: 100 } as ViewStyle,
    gaugeWrap: { alignItems: 'center', marginBottom: SPACING.xl, position: 'relative' } as ViewStyle,
    gaugeCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
    gaugeValue: { fontFamily: FONTS.displayLight, fontSize: fs(48), fontWeight: '800', letterSpacing: -2 } as TextStyle,
    gaugeMax: { fontFamily: FONTS.bodyRegular, fontSize: fs(13), marginTop: -4 } as TextStyle,
    title: { fontFamily: FONTS.displayLight, fontSize: fs(28), color: colors.text, letterSpacing: -0.3, marginBottom: SPACING.xs } as TextStyle,
    body: { fontFamily: FONTS.bodyRegular, fontSize: fs(14), lineHeight: lh(14, 1.45), color: colors.textSecondary, marginBottom: SPACING.lg } as TextStyle,
    card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 16 } as ViewStyle,
    cardHeader: { fontFamily: FONTS.bodyMedium, fontSize: fs(12), fontWeight: '600', letterSpacing: 0.3, padding: 14, paddingBottom: 8 } as TextStyle,
    compRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 } as ViewStyle,
    compIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
    compTextCol: { flex: 1 } as ViewStyle,
    compLabel: { fontFamily: FONTS.bodyMedium, fontSize: fs(14), fontWeight: '600' } as TextStyle,
    compSub: { fontFamily: FONTS.bodyRegular, fontSize: fs(12), lineHeight: lh(12, 1.3), marginTop: 2 } as TextStyle,
    compMax: { fontFamily: FONTS.bodyMedium, fontSize: fs(12), fontWeight: '600' } as TextStyle,
    interpretCard: { borderRadius: 16, borderWidth: 1, padding: 16 } as ViewStyle,
    interpretHeader: { fontFamily: FONTS.bodyMedium, fontSize: fs(13), fontWeight: '600', marginBottom: 8 } as TextStyle,
    interpretBody: { fontFamily: FONTS.bodyRegular, fontSize: fs(13), lineHeight: lh(13, 1.5) } as TextStyle,
  });
}
