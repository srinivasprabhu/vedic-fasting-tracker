import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
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
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const size = 240;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1));

  useEffect(() => {
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
      };
    }
  }, [isActive, pulseAnim, glowAnim]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.35],
  });

  return (
    <View style={styles.container}>
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
            <Text style={styles.elapsedTime}>{elapsed}</Text>
            <Text style={styles.label}>{label}</Text>
            {isActive && (
              <Text style={styles.remaining}>{remaining} left</Text>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    container: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      position: 'relative' as const,
    },
    glowRing: {
      position: 'absolute' as const,
      width: 270,
      height: 270,
      borderRadius: 135,
      backgroundColor: colors.primary,
    },
    timerOuter: {
      width: 240,
      height: 240,
      borderRadius: 120,
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
      fontSize: 36,
      fontWeight: '300' as const,
      color: colors.text,
      letterSpacing: 1,
    },
    label: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
      fontWeight: '500' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 1.5,
    },
    remaining: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 6,
    },
  });
}
