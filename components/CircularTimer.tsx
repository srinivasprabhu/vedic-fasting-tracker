import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Easing, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { ColorScheme } from '@/constants/colors';

interface CircularTimerProps {
  progress: number;
  elapsed: string;
  remaining: string;
  label: string;
  isActive: boolean;
}

export default function CircularTimer({ progress, elapsed, remaining, label, isActive }: CircularTimerProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const { width: screenWidth } = useWindowDimensions();

  // Responsive sizing: max ~200px ring, scales down on smaller screens
  const size = Math.min(200, screenWidth * 0.56);
  const strokeWidth = Math.max(7, size * 0.035);

  const styles = useMemo(() => makeStyles(colors, size), [colors, size]);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1));

  useEffect(() => {
    // Skip animations if user prefers reduced motion
    if (reduceMotion) {
      pulseAnim.setValue(1);
      glowAnim.setValue(isActive ? 0.25 : 0);
      return;
    }

    if (isActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      glow.start();
      return () => {
        pulse.stop();
        glow.stop();
        // Reset to initial values on cleanup
        pulseAnim.setValue(1);
        glowAnim.setValue(0);
      };
    } else {
      // Reset animations when not active
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [isActive, reduceMotion, pulseAnim, glowAnim]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.35],
  });

  // Calculate progress percentage for accessibility
  const progressPercent = Math.round(progress * 100);

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={
        isActive
          ? `Fasting timer: ${elapsed} elapsed, ${remaining} remaining, ${progressPercent}% complete`
          : `Fasting timer ready: ${label}`
      }
      accessibilityValue={{
        min: 0,
        max: 100,
        now: progressPercent,
        text: `${progressPercent}% complete`,
      }}
    >
      {isActive && (
        <Animated.View
          style={[
            styles.glowRing,
            { opacity: glowOpacity },
          ]}
        />
      )}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <View style={styles.timerOuter}>
          <Svg width={size} height={size} style={styles.svg}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.borderLight}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.primary}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
          <View style={styles.centerContent}>
            <Text style={styles.elapsedTime} accessibilityElementsHidden={true}>
              {elapsed}
            </Text>
            <Text style={styles.label} accessibilityElementsHidden={true}>
              {label}
            </Text>
            {isActive && (
              <Text style={styles.remaining} accessibilityElementsHidden={true}>
                {remaining} left
              </Text>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function makeStyles(colors: ColorScheme, size: number = 200) {
  const glowSize = size * 1.12; // Glow ring is 12% larger than timer
  const elapsedFontSize = 36; // Keep digits large and readable at fixed size
  const labelSize = Math.max(12, size * 0.046); // Min 12px for accessibility

  return StyleSheet.create({
    container: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      position: 'relative' as const,
    },
    glowRing: {
      position: 'absolute' as const,
      width: glowSize,
      height: glowSize,
      borderRadius: glowSize / 2,
      backgroundColor: colors.primary,
    },
    timerOuter: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: colors.card,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 8,
    },
    svg: {
      position: 'absolute' as const,
    },
    centerContent: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    elapsedTime: {
      fontSize: elapsedFontSize,
      fontWeight: '500' as const,
      color: colors.text,
      letterSpacing: 0.5,
      lineHeight: elapsedFontSize * 1.1,
    },
    label: {
      fontSize: labelSize,
      color: colors.textSecondary,
      marginTop: size * 0.03,
      fontWeight: '600' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.8,
      lineHeight: labelSize * 1.33,
    },
    remaining: {
      fontSize: Math.max(14, size * 0.054),
      color: colors.textSecondary,
      marginTop: size * 0.03,
      lineHeight: Math.max(18, size * 0.07),
    },
  });
}
