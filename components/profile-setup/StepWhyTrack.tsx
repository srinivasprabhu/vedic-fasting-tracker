import React, { useRef, useEffect } from 'react';
import {
  View, Text, Image, StyleSheet, Animated, Easing,
  ViewStyle, TextStyle, ImageStyle, Dimensions,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { FONTS, SPACING, fs, lh } from '@/constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');

const HERO_IMAGE = require('@/assets/images/setup-hero.png');

export const StepWhyTrack: React.FC = () => {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const imgScale = useRef(new Animated.Value(1.08)).current;
  const imgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
      imgScale.setValue(1);
      imgOpacity.setValue(1);
      return;
    }

    Animated.parallel([
      Animated.timing(imgOpacity, {
        toValue: 1, duration: 600, delay: 100,
        easing: Easing.out(Easing.ease), useNativeDriver: true,
      }),
      Animated.timing(imgScale, {
        toValue: 1, duration: 800, delay: 100,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 500, delay: 400,
        easing: Easing.out(Easing.ease), useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 500, delay: 400,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();
  }, [reduceMotion, fadeAnim, slideAnim, imgScale, imgOpacity]);

  return (
    <View style={styles.wrap}>
      <Animated.View style={[
        styles.imageWrap,
        {
          opacity: imgOpacity,
          transform: [{ scale: imgScale }],
        },
      ]}>
        <Image
          source={HERO_IMAGE}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={[styles.imageFade, { backgroundColor: colors.background }]} />
      </Animated.View>

      <Animated.View style={[
        styles.textWrap,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}>
        <Text style={[styles.heading, { color: colors.text }]}>
          Renew from within.{'\n'}Science agrees.
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Fasting activates your body&apos;s natural ability to heal and regenerate. Let&apos;s set up your personal plan.
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  } as ViewStyle,

  imageWrap: {
    width: SCREEN_W,
    height: SCREEN_W * 0.95,
    marginLeft: -24,
    marginTop: -12,
    overflow: 'hidden',
    position: 'relative',
  } as ViewStyle,

  heroImage: {
    width: '100%',
    height: '100%',
  } as ImageStyle,

  imageFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    opacity: 0.9,
  } as ViewStyle,

  textWrap: {
    paddingHorizontal: 4,
    marginTop: -20,
  } as ViewStyle,

  heading: {
    fontFamily: FONTS.displayLight,
    fontSize: fs(32),
    lineHeight: lh(32, 1.12),
    letterSpacing: -0.5,
    marginBottom: SPACING.sm,
  } as TextStyle,

  body: {
    fontFamily: FONTS.bodyRegular,
    fontSize: fs(15),
    lineHeight: lh(15, 1.5),
  } as TextStyle,
});
