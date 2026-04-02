// components/BrandedSplash.tsx
// Full-screen branded loading screen shown for ~2 seconds on app launch.
// Displays the Aayu mandala rotating with a gentle pulse and fade-out.
// Mounts OVER the app content, then fades away to reveal the app beneath.

import React, { useEffect, useRef } from 'react';
import {
  View, Text, Animated, Easing, StyleSheet,
  Dimensions, ViewStyle, TextStyle,
} from 'react-native';
import { AayuMandala } from '@/components/onboarding/AayuMandala';

const { width: W, height: H } = Dimensions.get('window');

// Duration the splash stays visible (ms)
const SPLASH_HOLD_MS = 1800;
// Duration of the fade-out (ms)
const FADE_OUT_MS = 600;

interface Props {
  /** Called when the splash is fully hidden and should be unmounted */
  onFinish: () => void;
}

export default function BrandedSplash({ onFinish }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(12)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Fade in the wordmark after a short delay
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(textSlide, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 2. Fade in the tagline
    Animated.sequence([
      Animated.delay(700),
      Animated.timing(tagOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. After hold duration, fade out the entire splash
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_OUT_MS,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, SPLASH_HOLD_MS);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[s.container, { opacity }]} pointerEvents="none">
      {/* Background */}
      <View style={s.bg} />

      {/* Ambient glow behind mandala */}
      <View style={s.glowOuter} />
      <View style={s.glowInner} />

      {/* Rotating mandala */}
      <View style={s.mandalaWrap}>
        <AayuMandala
          size={140}
          color="#c8872a"
          animated={true}
          glow={true}
          opacity={1}
        />
      </View>

      {/* Wordmark */}
      <Animated.View style={[s.textWrap, { opacity: textOpacity, transform: [{ translateY: textSlide }] }]}>
        <Text style={s.brand}>Aayu</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={[s.tagWrap, { opacity: tagOpacity }]}>
        <Text style={s.tagline}>Fast smarter. Live longer.</Text>
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0604',
  } as ViewStyle,

  glowOuter: {
    position: 'absolute',
    width: W * 0.8,
    height: W * 0.8,
    borderRadius: W * 0.4,
    backgroundColor: 'rgba(200,135,42,0.04)',
  } as ViewStyle,

  glowInner: {
    position: 'absolute',
    width: W * 0.45,
    height: W * 0.45,
    borderRadius: W * 0.225,
    backgroundColor: 'rgba(200,135,42,0.06)',
  } as ViewStyle,

  mandalaWrap: {
    marginBottom: 28,
  } as ViewStyle,

  textWrap: {
    alignItems: 'center',
  } as ViewStyle,

  brand: {
    fontSize: 36,
    fontWeight: '300',
    color: '#f0e0c0',
    letterSpacing: 8,
  } as TextStyle,

  tagWrap: {
    marginTop: 12,
  } as ViewStyle,

  tagline: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(200,135,42,0.45)',
    letterSpacing: 2,
  } as TextStyle,
});
