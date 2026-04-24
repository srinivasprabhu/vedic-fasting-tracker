import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing,
  ViewStyle, TextStyle,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { FONTS, SPACING, fs, lh } from '@/constants/theme';
import { hexAlpha } from '@/constants/colors';

interface StepWelcomeProps {
  name: string;
  onAutoAdvance: () => void;
}

export const StepWelcome: React.FC<StepWelcomeProps> = ({ name, onAutoAdvance }) => {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const handScale = useRef(new Animated.Value(0.5)).current;
  const handOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
      handScale.setValue(1);
      handOpacity.setValue(1);
    } else {
      Animated.parallel([
        Animated.timing(handOpacity, {
          toValue: 1, duration: 400, delay: 100, useNativeDriver: true,
        }),
        Animated.spring(handScale, {
          toValue: 1, delay: 100, speed: 10, bounciness: 10, useNativeDriver: true,
        }),
      ]).start();

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1, duration: 500, delay: 350,
          easing: Easing.out(Easing.ease), useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0, duration: 500, delay: 350,
          easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
      ]).start();
    }

    const timer = setTimeout(() => {
      onAutoAdvance();
    }, 5500);

    return () => clearTimeout(timer);
  }, [reduceMotion, fadeAnim, slideAnim, handScale, handOpacity, onAutoAdvance]);

  const displayName = name.trim() || 'Friend';

  return (
    <View style={styles.wrap}>
      <Animated.View style={[
        styles.handWrap,
        {
          opacity: handOpacity,
          transform: [{ scale: handScale }],
          backgroundColor: hexAlpha(colors.primary, 0.08),
          borderColor: hexAlpha(colors.primary, 0.18),
        },
      ]}>
        <Text style={styles.handEmoji}>👋</Text>
      </Animated.View>

      <Animated.View style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}>
        <Text style={[styles.heading, { color: colors.text }]}>
          Nice to meet you,{'\n'}{displayName}!
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Aayu is your personal fasting companion — helping you build metabolic discipline with science-backed tracking and insights.
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: 80,
  } as ViewStyle,
  handWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  } as ViewStyle,
  handEmoji: {
    fontSize: 32,
  } as TextStyle,
  heading: {
    fontFamily: FONTS.displayLight,
    fontSize: fs(32),
    lineHeight: lh(32, 1.15),
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: SPACING.md,
  } as TextStyle,
  body: {
    fontFamily: FONTS.bodyRegular,
    fontSize: fs(15),
    lineHeight: lh(15, 1.45),
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  } as TextStyle,
});
