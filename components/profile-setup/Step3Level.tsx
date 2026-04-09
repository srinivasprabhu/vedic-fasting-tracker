import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import { Flame, Leaf, Zap, Bird, Check } from 'lucide-react-native';
import type { FastingLevel } from '@/types/user';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS, fs, lh } from '@/constants/theme';

interface Step3LevelProps {
  value: FastingLevel | null;
  onChange: (level: FastingLevel) => void;
}

interface LevelOption {
  id: FastingLevel;
  Icon: typeof Flame;
  name: string;
  description: string;
}

const LEVELS: LevelOption[] = [
  {
    id: 'beginner',
    Icon: Leaf,
    name: 'Beginner',
    description: 'New to fasting or just starting out. We\'ll ease you in with 12:12 and build from there.',
  },
  {
    id: 'intermediate',
    Icon: Zap,
    name: 'Getting there',
    description: 'You\'ve tried fasting before. Comfortable with 16:8, ready to explore more.',
  },
  {
    id: 'experienced',
    Icon: Bird,
    name: 'Experienced',
    description: 'Fasting is a habit. You do extended fasts and know your body well.',
  },
];

const LevelCard: React.FC<{
  option: LevelOption;
  selected: boolean;
  onPress: () => void;
  delay: number;
  isDark: boolean;
}> = ({ option, selected, onPress, delay, isDark }) => {
  const selectAnim    = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const scaleAnim     = useRef(new Animated.Value(1)).current;
  const entranceAnim  = useRef(new Animated.Value(0)).current;
  const entranceSlide = useRef(new Animated.Value(16)).current;
  const checkScale    = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceAnim, {
        toValue: 1, duration: 400, delay,
        easing: Easing.out(Easing.ease), useNativeDriver: true,
      }),
      Animated.timing(entranceSlide, {
        toValue: 0, duration: 400, delay,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(selectAnim, {
      toValue: selected ? 1 : 0,
      duration: 200, easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
    Animated.spring(checkScale, {
      toValue: selected ? 1 : 0,
      speed: 20, bounciness: 8, useNativeDriver: true,
    }).start();
  }, [selected]);

  const handlePressIn  = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 30, bounciness: 3 }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 22, bounciness: 4 }).start();

  const borderColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isDark
      ? ['rgba(200,135,42,0.12)', 'rgba(200,135,42,0.55)']
      : ['rgba(200,135,42,0.15)', 'rgba(200,135,42,0.55)'],
  });
  const bgColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isDark
      ? ['rgba(255,255,255,0.02)', 'rgba(200,135,42,0.08)']
      : ['rgba(255,255,255,0.65)',  'rgba(255,248,232,0.95)'],
  });
  const nameColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isDark
      ? ['#e8d5b0', '#e8a84c']
      : ['#1e1004', '#7a4010'],
  });

  const goldLt = isDark ? '#e8a84c' : '#a06820';

  return (
    <Animated.View style={{
      opacity: entranceAnim,
      transform: [{ translateY: entranceSlide }, { scale: scaleAnim }],
    }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        <Animated.View style={[
          styles.card,
          {
            borderColor,
            backgroundColor: bgColor,
            ...(!isDark && {
              shadowColor: '#c8872a',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: selected ? 0.1 : 0.04,
              shadowRadius: selected ? 14 : 6,
              elevation: selected ? 3 : 1,
            }),
          },
        ]}>
          <View style={[styles.cardIconCircle, { backgroundColor: isDark ? 'rgba(200,135,42,.08)' : 'rgba(200,135,42,.06)' }]}>
            <option.Icon size={18} color={goldLt} />
          </View>

          <View style={styles.cardBody}>
            <Animated.Text style={[styles.cardName, { color: nameColor }]}>
              {option.name}
            </Animated.Text>
            <Text style={[
              styles.cardDesc,
              { color: isDark ? 'rgba(240,224,192,0.38)' : 'rgba(60,35,10,0.48)' },
            ]}>
              {option.description}
            </Text>
          </View>

          <Animated.View style={[
            styles.check,
            {
              transform: [{ scale: checkScale }],
              backgroundColor: isDark ? '#c8872a' : '#b07020',
              opacity: checkScale,
            },
          ]}>
            <Check size={12} color="#fff8ed" strokeWidth={3} />
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const Step3Level: React.FC<Step3LevelProps> = ({ value, onChange }) => {
  const { isDark, colors } = useTheme();
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconScale   = useRef(new Animated.Value(0.8)).current;

  const cream = isDark ? '#f0e0c0' : '#1e1004';
  const goldLight = isDark ? '#e8a84c' : '#a06820';
  const mutedSub = isDark ? 'rgba(240,224,192,0.42)' : 'rgba(60,35,10,0.48)';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(iconOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(iconScale,   { toValue: 1, speed: 12, bounciness: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.wrap}>
      <Animated.View style={[
        styles.iconWrap,
        {
          opacity: iconOpacity,
          transform: [{ scale: iconScale }],
          backgroundColor: 'rgba(200,135,42,0.1)',
          borderColor: isDark ? 'rgba(200,135,42,0.2)' : 'rgba(200,135,42,0.28)',
        },
      ]}>
        <Flame size={20} color={goldLight} />
      </Animated.View>

      <Text style={[styles.heading, { color: cream }]}>
        Your fasting{'\n'}
        <Text style={[styles.headingAccent, { color: goldLight }]}>
          experience
        </Text>
      </Text>
      <Text style={[styles.subheading, { color: mutedSub }]}>
        We'll set the right starting point for you
      </Text>

      <View style={styles.cards}>
        {LEVELS.map((lvl, i) => (
          <LevelCard
            key={lvl.id}
            option={lvl}
            selected={value === lvl.id}
            onPress={() => onChange(lvl.id)}
            delay={i * 80}
            isDark={isDark}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap:           { flex: 1, paddingTop: SPACING.xl }               as ViewStyle,
  iconWrap:       {
    width: 50, height: 50, borderRadius: 25, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg,
  }                                                              as ViewStyle,
  heading:        {
    fontFamily: FONTS.displayLight, fontSize: fs(38),
    lineHeight: lh(38), letterSpacing: 0.2, marginBottom: SPACING.xs,
  }                                                              as TextStyle,
  headingAccent:  { fontFamily: FONTS.displayItalic, fontSize: fs(38), lineHeight: lh(38) } as TextStyle,
  subheading:     {
    fontFamily: FONTS.bodyRegular, fontSize: fs(14),
    lineHeight: lh(14, 1.35), marginBottom: SPACING.xl,
  }                                                              as TextStyle,
  cards:          { gap: SPACING.sm + 2 }                           as ViewStyle,
  card:           {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.md, padding: SPACING.md,
    borderRadius: RADIUS.xl - 2, borderWidth: 1.5,
  }                                                              as ViewStyle,
  cardIconCircle: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }                                                              as ViewStyle,
  cardBody:       { flex: 1 }                                        as ViewStyle,
  cardName:       {
    fontFamily: FONTS.bodyMedium, fontSize: fs(14),
    fontWeight: '500', marginBottom: 3,
  }                                                              as TextStyle,
  cardDesc:       {
    fontFamily: FONTS.bodyRegular, fontSize: fs(13), lineHeight: lh(13, 1.35),
  }                                                              as TextStyle,
  check:          {
    width: 22, height: 22, borderRadius: 11, flexShrink: 0,
    alignItems: 'center', justifyContent: 'center',
  }                                                              as ViewStyle,
});
