import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';

export type AgeGroup =
  | 'under_18'
  | '18_25'
  | '26_35'
  | '36_45'
  | '46_55'
  | '56_65'
  | '65_plus';

export const AGE_GROUP_TO_NUMBER: Record<AgeGroup, number> = {
  under_18: 16,
  '18_25': 22,
  '26_35': 30,
  '36_45': 40,
  '46_55': 50,
  '56_65': 60,
  '65_plus': 70,
};

interface Step3AgeProps {
  value: AgeGroup | null;
  onChange: (age: AgeGroup) => void;
}

interface AgeOption {
  id: AgeGroup;
  label: string;
}

const AGE_OPTIONS: AgeOption[] = [
  { id: 'under_18', label: 'Under 18' },
  { id: '18_25', label: '18–25' },
  { id: '26_35', label: '26–35' },
  { id: '36_45', label: '36–45' },
  { id: '46_55', label: '46–55' },
  { id: '56_65', label: '56–65' },
  { id: '65_plus', label: '65+' },
];

const AgePill: React.FC<{
  option: AgeOption;
  selected: boolean;
  onPress: () => void;
  delay: number;
}> = ({ option, selected, onPress, delay }) => {
  const selectAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const entranceSlide = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceAnim, {
        toValue: 1,
        duration: 380,
        delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(entranceSlide, {
        toValue: 0,
        duration: 380,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(selectAnim, {
      toValue: selected ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [selected]);

  const handlePressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.94,
      useNativeDriver: true,
      speed: 25,
      bounciness: 4,
    }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 25,
      bounciness: 4,
    }).start();

  const borderColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(200,135,42,0.18)', 'rgba(200,135,42,0.8)'],
  });
  const bgColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(200,135,42,0.05)', 'rgba(200,135,42,0.15)'],
  });
  const textColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.text, COLORS.goldPale],
  });

  return (
    <Animated.View
      style={{
        opacity: entranceAnim,
        transform: [{ translateY: entranceSlide }, { scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
      >
        <Animated.View style={[styles.pill, { borderColor, backgroundColor: bgColor }]}>
          <Animated.Text style={[styles.pillLabel, { color: textColor }]}>
            {option.label}
          </Animated.Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const Step3Age: React.FC<Step3AgeProps> = ({ value, onChange }) => {
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: 1,
        speed: 12,
        bounciness: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[
          styles.iconWrap,
          { opacity: iconOpacity, transform: [{ scale: iconScale }] },
        ]}
      >
        <Text style={styles.iconText}>🌿</Text>
      </Animated.View>

      <Text style={styles.heading}>Your age</Text>
      <Text style={styles.subheading}>
        Helps us accurately assess your fasting impact in analytics
      </Text>

      <View style={styles.grid}>
        {AGE_OPTIONS.map((opt, i) => (
          <AgePill
            key={opt.id}
            option={opt}
            selected={value === opt.id}
            onPress={() => onChange(opt.id)}
            delay={i * 55}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingTop: SPACING.xxl,
  } as ViewStyle,

  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(200,135,42,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(200,135,42,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  } as ViewStyle,

  iconText: {
    fontSize: 36,
  } as TextStyle,

  heading: {
    fontSize: 42,
    fontWeight: '300',
    color: COLORS.cream,
    lineHeight: 48,
    letterSpacing: 0.2,
    marginBottom: SPACING.sm,
  } as TextStyle,

  subheading: {
    fontSize: 14,
    color: 'rgba(240,224,192,0.45)',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  } as TextStyle,

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  } as ViewStyle,

  pill: {
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md + 4,
    paddingVertical: SPACING.sm + 3,
    alignItems: 'center',
    minWidth: 82,
  } as ViewStyle,

  pillLabel: {
    fontSize: 14,
    fontWeight: '500',
  } as TextStyle,
});
