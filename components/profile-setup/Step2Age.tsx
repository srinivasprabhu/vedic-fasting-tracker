import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import type { AgeGroup } from '@/types/user';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS } from '@/constants/theme';

interface Step2AgeProps {
  value: AgeGroup | null;
  onChange: (age: AgeGroup) => void;
}

const AGE_OPTIONS: { id: AgeGroup; label: string }[] = [
  { id: 'under_18', label: 'Under 18' },
  { id: '18_25',    label: '18–25'    },
  { id: '26_35',    label: '26–35'    },
  { id: '36_45',    label: '36–45'    },
  { id: '46_55',    label: '46–55'    },
  { id: '56_65',    label: '56–65'    },
  { id: '65_plus',  label: '65+'      },
];

const AgePill: React.FC<{
  label: string;
  selected: boolean;
  onPress: () => void;
  delay: number;
  isDark: boolean;
}> = ({ label, selected, onPress, delay, isDark }) => {
  const selectAnim    = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const scaleAnim     = useRef(new Animated.Value(1)).current;
  const entranceAnim  = useRef(new Animated.Value(0)).current;
  const entranceSlide = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceAnim, {
        toValue: 1, duration: 360, delay,
        easing: Easing.out(Easing.ease), useNativeDriver: true,
      }),
      Animated.timing(entranceSlide, {
        toValue: 0, duration: 360, delay,
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
  }, [selected]);

  const handlePressIn  = () =>
    Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true, speed: 28, bounciness: 4 }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 28, bounciness: 4 }).start();

  const borderColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isDark
      ? ['rgba(200,135,42,0.18)', 'rgba(200,135,42,0.82)']
      : ['rgba(200,135,42,0.22)', 'rgba(200,135,42,0.78)'],
  });
  const bgColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isDark
      ? ['rgba(200,135,42,0.05)', 'rgba(200,135,42,0.15)']
      : ['rgba(255,255,255,0.65)', 'rgba(255,248,232,0.95)'],
  });
  const textColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isDark
      ? ['#e8d5b0', '#f5d48a']
      : ['#3a2010', '#7a4010'],
  });

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
        <Animated.View style={[styles.pill, { borderColor, backgroundColor: bgColor }]}>
          <Animated.Text style={[styles.pillLabel, { color: textColor }]}>
            {label}
          </Animated.Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const Step2Age: React.FC<Step2AgeProps> = ({ value, onChange }) => {
  const { isDark, colors } = useTheme();
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconScale   = useRef(new Animated.Value(0.8)).current;

  const goldLight = isDark ? '#e8a84c' : '#a06820';
  const cream = isDark ? '#f0e0c0' : '#1e1004';
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
        <Text style={[styles.iconText, { color: goldLight }]}>✦</Text>
      </Animated.View>

      <Text style={[styles.heading, { color: cream }]}>
        Your age
      </Text>
      <Text style={[styles.subheading, { color: mutedSub }]}>
        Helps accurately assess your fasting impact in analytics
      </Text>

      <View style={styles.grid}>
        {AGE_OPTIONS.map((opt, i) => (
          <AgePill
            key={opt.id}
            label={opt.label}
            selected={value === opt.id}
            onPress={() => onChange(opt.id)}
            delay={i * 50}
            isDark={isDark}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap:      { flex: 1, paddingTop: SPACING.xxl }                as ViewStyle,
  iconWrap:  {
    width: 50, height: 50, borderRadius: 25, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl,
  }                                                              as ViewStyle,
  iconText:  { fontSize: 20, fontFamily: FONTS.bodyRegular }     as TextStyle,
  heading:   {
    fontFamily: FONTS.displayLight, fontSize: 40,
    lineHeight: 46, letterSpacing: 0.2, marginBottom: SPACING.xs,
  }                                                              as TextStyle,
  subheading: {
    fontFamily: FONTS.bodyRegular, fontSize: 13,
    lineHeight: 21, marginBottom: SPACING.xl + 4,
  }                                                              as TextStyle,
  grid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 9 } as ViewStyle,
  pill:      {
    borderWidth: 1.5, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md + 4, paddingVertical: SPACING.sm + 3,
    alignItems: 'center', minWidth: 80,
  }                                                              as ViewStyle,
  pillLabel: { fontFamily: FONTS.bodyMedium, fontSize: 13, fontWeight: '500' } as TextStyle,
});
