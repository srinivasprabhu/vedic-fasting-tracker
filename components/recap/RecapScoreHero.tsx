import { fs } from '@/constants/theme';
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ViewStyle, TextStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { ColorScheme } from '@/constants/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const SIZE = 180;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMF = 2 * Math.PI * RADIUS;

interface Props {
  score: number;
  label: string;
  prevScore: number | null;
  isBaseline: boolean;
}

export default function RecapScoreHero({ score, label, prevScore, isBaseline }: Props) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const reduceMotion = useReducedMotion();

  const progressAnim = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = React.useState(reduceMotion ? score : 0);

  useEffect(() => {
    if (reduceMotion) {
      progressAnim.setValue(1);
      setDisplayScore(score);
      return;
    }

    const id = progressAnim.addListener(({ value }) => {
      setDisplayScore(Math.round(value * score));
    });

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1200,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => {
      progressAnim.removeListener(id);
    };
  }, [score, progressAnim, reduceMotion]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMF, CIRCUMF * (1 - score / 100)],
  });

  const scoreColor =
    score >= 85 ? colors.success :
    score >= 70 ? '#e8a84c' :
    score >= 50 ? colors.warning :
    colors.textMuted;

  const delta = prevScore !== null ? score - prevScore : null;
  const deltaLabel = isBaseline
    ? 'Baseline month'
    : delta === null
      ? null
      : delta === 0
        ? 'Same as last month'
        : delta > 0
          ? `+${delta} pts`
          : `${delta} pts`;
  const deltaColor =
    isBaseline ? colors.primary :
    delta === null ? colors.textMuted :
    delta > 0 ? colors.success :
    delta < 0 ? colors.warning :
    colors.textSecondary;

  return (
    <View style={styles.container}>
      <View style={styles.scoreWrap}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={colors.surface}
            strokeWidth={STROKE}
            fill="none"
          />
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

        <View style={styles.scoreCenter}>
          <Text style={[styles.scoreValue, { color: scoreColor }]}>{displayScore}</Text>
          <Text style={[styles.scoreMax, { color: colors.textMuted }]}>/ 100</Text>
        </View>
      </View>

      <Text style={[styles.scoreLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.scoreSublabel, { color: colors.textMuted }]}>Metabolic discipline score</Text>

      {deltaLabel && (
        <View style={[styles.deltaPill, { backgroundColor: `${deltaColor}15` }]}>
          <Text style={[styles.deltaText, { color: deltaColor }]}>{deltaLabel}</Text>
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    container: { alignItems: 'center', marginBottom: 32 } as ViewStyle,
    scoreWrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
    scoreCenter: { position: 'absolute', alignItems: 'center' } as ViewStyle,
    scoreValue: { fontSize: fs(56), fontWeight: '800', letterSpacing: -2 } as TextStyle,
    scoreMax: { fontSize: fs(14), fontWeight: '500', marginTop: -6 } as TextStyle,
    scoreLabel: { fontSize: fs(22), fontWeight: '700', marginTop: 18, letterSpacing: -0.3 } as TextStyle,
    scoreSublabel: { fontSize: fs(13), marginTop: 4 } as TextStyle,
    deltaPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, marginTop: 14 } as ViewStyle,
    deltaText: { fontSize: fs(13), fontWeight: '700', letterSpacing: 0.3 } as TextStyle,
  });
}
