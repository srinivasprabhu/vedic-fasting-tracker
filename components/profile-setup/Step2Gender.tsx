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
import type { UserSex } from '@/types/user';

interface Step2GenderProps {
  value: UserSex | null;
  onChange: (gender: UserSex) => void;
}

interface GenderOption {
  id: UserSex;
  label: string;
  emoji: string;
}

const OPTIONS: GenderOption[] = [
  { id: 'male', label: 'Male', emoji: '🧘‍♂️' },
  { id: 'female', label: 'Female', emoji: '🧘‍♀️' },
  { id: 'prefer_not_to_say', label: 'Prefer not to say', emoji: '🙏' },
];

const GenderCard: React.FC<{
  option: GenderOption;
  selected: boolean;
  onPress: () => void;
  delay: number;
}> = ({ option, selected, onPress, delay }) => {
  const selectAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const entranceSlide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceAnim, {
        toValue: 1,
        duration: 420,
        delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(entranceSlide, {
        toValue: 0,
        duration: 420,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(selectAnim, {
      toValue: selected ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [selected]);

  const handlePressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 25,
      bounciness: 3,
    }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 25,
      bounciness: 3,
    }).start();

  const borderColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(200,135,42,0.14)', 'rgba(200,135,42,0.65)'],
  });

  const bgColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(200,135,42,0.04)', 'rgba(200,135,42,0.11)'],
  });

  const checkOpacity = selectAnim;

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
        <Animated.View style={[styles.card, { borderColor, backgroundColor: bgColor }]}>
          <Text style={styles.emoji}>{option.emoji}</Text>
          <View style={styles.cardText}>
            <Text style={[styles.cardLabel, selected && { color: COLORS.goldLight }]}>
              {option.label}
            </Text>
          </View>
          <Animated.View style={[styles.checkWrap, { opacity: checkOpacity }]}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const Step2Gender: React.FC<Step2GenderProps> = ({ value, onChange }) => {
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
        <Text style={styles.iconEmoji}>✦</Text>
      </Animated.View>

      <Text style={styles.heading}>Tell us about{'\n'}yourself</Text>
      <Text style={styles.subheading}>
        Helps us accurately assess your fasting impact in analytics
      </Text>

      <View style={styles.options}>
        {OPTIONS.map((opt, i) => (
          <GenderCard
            key={opt.id}
            option={opt}
            selected={value === opt.id}
            onPress={() => onChange(opt.id)}
            delay={i * 70}
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

  iconEmoji: {
    fontSize: 28,
    color: COLORS.goldLight,
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

  options: {
    gap: 12,
  } as ViewStyle,

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md + 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
  } as ViewStyle,

  emoji: {
    fontSize: 26,
    flexShrink: 0,
  } as TextStyle,

  cardText: {
    flex: 1,
  } as ViewStyle,

  cardLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.cream,
  } as TextStyle,

  checkWrap: {
    flexShrink: 0,
  } as ViewStyle,

  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  checkMark: {
    fontSize: 12,
    color: '#1a0d04',
    fontWeight: '700',
  } as TextStyle,
});
