import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { fs } from '@/constants/theme';
import { AayuMandala } from './AayuMandala';
import type { OnboardingSlideData } from './types';

const { width: W, height: H } = Dimensions.get('window');

interface OnboardingSlideProps {
  slide: OnboardingSlideData;
  isActive: boolean;
  isBrandSlide: boolean;
  iconOpacity: Animated.Value;
  iconScale: Animated.Value;
}

export const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  slide,
  isActive,
  isBrandSlide,
  iconOpacity,
  iconScale,
}) => {
  const mandalaSize = isBrandSlide ? 200 : 140;

  return (
    <View style={styles.slide}>
      <Animated.View
        style={[
          styles.iconWrap,
          {
            opacity: isActive ? iconOpacity : 0,
            transform: [{ scale: isActive ? iconScale : 0.8 }],
          },
        ]}
      >
        <View
          style={[
            styles.glowRing,
            {
              width: mandalaSize + 56,
              height: mandalaSize + 56,
              borderRadius: (mandalaSize + 56) / 2,
              borderColor: `${slide.accentColor}18`,
            },
          ]}
        />
        <View
          style={[
            styles.glowRing,
            styles.glowRingMid,
            {
              width: mandalaSize + 28,
              height: mandalaSize + 28,
              borderRadius: (mandalaSize + 28) / 2,
              borderColor: `${slide.accentColor}28`,
            },
          ]}
        />

        <View
          style={[
            styles.iconBg,
            {
              width: mandalaSize + 8,
              height: mandalaSize + 8,
              borderRadius: (mandalaSize + 8) / 2,
              backgroundColor: slide.iconBg,
              borderColor: `${slide.accentColor}30`,
            },
          ]}
        >
          {isBrandSlide ? (
            <AayuMandala
              size={mandalaSize}
              color={slide.accentColor}
              animated={isActive}
              glow
            />
          ) : slide.iconComponent ? (
            slide.iconComponent
          ) : (
            <Text
              style={[styles.icon, { fontSize: fs(Math.round(mandalaSize * 0.38)) }]}
              accessible={false}
              importantForAccessibility="no"
            >
              {slide.icon}
            </Text>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  slide: {
    width: W,
    height: H,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: H * 0.28,
  } as ViewStyle,

  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  glowRing: {
    position: 'absolute',
    borderWidth: 1,
  } as ViewStyle,

  glowRingMid: {
    borderWidth: 1.5,
  } as ViewStyle,

  iconBg: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  icon: {
    textAlign: 'center',
  } as TextStyle,
});
