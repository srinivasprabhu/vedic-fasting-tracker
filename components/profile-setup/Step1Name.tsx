import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';

interface Step1NameProps {
  value: string;
  onChange: (name: string) => void;
  onSubmit?: () => void;
}

export const Step1Name: React.FC<Step1NameProps> = ({
  value,
  onChange,
  onSubmit,
}) => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const focusAnim = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: 1,
        speed: 12,
        bounciness: 6,
        useNativeDriver: true,
      }),
    ]).start();

    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [focused]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(200,135,42,0.15)', 'rgba(200,135,42,0.6)'],
  });

  const bgColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(200,135,42,0.04)', 'rgba(200,135,42,0.08)'],
  });

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[
          styles.iconWrap,
          { opacity: iconOpacity, transform: [{ scale: iconScale }] },
        ]}
      >
        <Text style={styles.icon}>👤</Text>
      </Animated.View>

      <Text style={styles.heading}>What do we{'\n'}call you?</Text>
      <Text style={styles.subheading}>
        Helps us accurately assess your fasting impact in analytics
      </Text>

      <Animated.View
        style={[
          styles.inputCard,
          {
            borderColor,
            backgroundColor: bgColor,
          },
        ]}
      >
        <Text style={styles.inputLabel}>YOUR NAME</Text>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmit}
          returnKeyType="done"
          autoCapitalize="words"
          autoCorrect={false}
          style={styles.input}
          placeholderTextColor="rgba(200,135,42,0.25)"
          placeholder="e.g. Arjun"
          selectionColor={COLORS.goldLight}
          cursorColor={COLORS.goldLight}
        />
        <Animated.View style={[styles.inputUnderline, { backgroundColor: borderColor }]} />
      </Animated.View>

      {value.length > 0 && (
        <Text style={[styles.hint, { color: COLORS.green }]}>
          ✓ Namaste, {value}! Your journey awaits.
        </Text>
      )}
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

  icon: {
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
    marginBottom: SPACING.xxl + 4,
  } as TextStyle,

  inputCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,

  inputLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.gold,
    letterSpacing: 0.14,
    textTransform: 'uppercase',
    marginBottom: 6,
  } as TextStyle,

  input: {
    fontSize: 28,
    fontWeight: '300',
    color: COLORS.cream,
    paddingVertical: 4,
    letterSpacing: 0.3,
  } as TextStyle,

  inputUnderline: {
    height: 1.5,
    borderRadius: 1,
    marginTop: SPACING.xs,
  } as ViewStyle,

  hint: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 18,
    marginTop: SPACING.sm,
  } as TextStyle,
});
