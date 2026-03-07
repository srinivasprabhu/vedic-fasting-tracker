import React, { useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS } from '@/constants/theme';

interface Step1NameProps {
  value: string;
  onChange: (name: string) => void;
  onSubmit?: () => void;
}

export const Step1Name: React.FC<Step1NameProps> = ({
  value, onChange, onSubmit,
}) => {
  const { isDark, colors } = useTheme();

  const iconOpacity  = useRef(new Animated.Value(0)).current;
  const iconScale    = useRef(new Animated.Value(0.8)).current;
  const cardGlow     = useRef(new Animated.Value(0)).current;
  const cursorAnim   = useRef(new Animated.Value(1)).current;
  const hintOpacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(iconOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(iconScale,   { toValue: 1, speed: 12, bounciness: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleFocus = useCallback(() => {
    Animated.timing(cardGlow, {
      toValue: 1, duration: 280,
      easing: Easing.out(Easing.ease), useNativeDriver: false,
    }).start();
  }, []);

  const handleBlur = useCallback(() => {
    Animated.timing(cardGlow, {
      toValue: 0, duration: 280,
      easing: Easing.out(Easing.ease), useNativeDriver: false,
    }).start();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cursorAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(cursorAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    Animated.timing(hintOpacity, {
      toValue: value.trim().length > 0 ? 1 : 0,
      duration: 320, easing: Easing.out(Easing.ease), useNativeDriver: true,
    }).start();
  }, [value]);

  const borderColor = cardGlow.interpolate({
    inputRange: [0, 1],
    outputRange: isDark
      ? ['rgba(200,135,42,0.22)', 'rgba(200,135,42,0.7)']
      : ['rgba(200,135,42,0.3)',  'rgba(200,135,42,0.75)'],
  });
  const cardBg = cardGlow.interpolate({
    inputRange: [0, 1],
    outputRange: isDark
      ? ['rgba(200,135,42,0.04)', 'rgba(200,135,42,0.09)']
      : ['rgba(255,255,255,0.6)',  'rgba(255,255,255,0.9)'],
  });

  const cream = isDark ? '#f0e0c0' : '#1e1004';
  const goldColor = isDark ? colors.primary : '#a06820';
  const mutedSub = isDark ? 'rgba(240,224,192,0.42)' : 'rgba(60,35,10,0.48)';
  const goldLight = isDark ? '#e8a84c' : '#a06820';

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
        <Text style={styles.iconEmoji}>👤</Text>
      </Animated.View>

      <Text style={[styles.heading, { color: cream }]}>
        What do we{'\n'}call you?
      </Text>
      <Text style={[styles.subheading, { color: mutedSub }]}>
        Helps personalise your analytics and insights
      </Text>

      <Animated.View style={[
        styles.inputCard,
        { borderColor, backgroundColor: cardBg },
        isDark
          ? { shadowColor: goldColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.12, shadowRadius: 14 }
          : { shadowColor: '#c8872a', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.08, shadowRadius: 12 },
      ]}>
        <Text style={[styles.inputLabel, { color: goldColor }]}>
          YOUR NAME
        </Text>

        <View style={styles.inputRow}>
          <TextInput
            value={value}
            onChangeText={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={onSubmit}
            returnKeyType="done"
            autoFocus
            autoCapitalize="words"
            autoCorrect={false}
            placeholderTextColor={isDark ? 'rgba(200,135,42,0.25)' : 'rgba(160,104,32,0.3)'}
            placeholder="Enter your name"
            style={[styles.textInput, { color: cream }]}
          />
          {value.length === 0 && (
            <Animated.View style={[
              styles.cursor,
              {
                opacity: cursorAnim,
                backgroundColor: goldLight,
              },
            ]} />
          )}
        </View>

        <View style={[
          styles.underline,
          { backgroundColor: isDark ? 'rgba(200,135,42,0.5)' : 'rgba(200,135,42,0.45)' },
        ]} />
      </Animated.View>

      <Animated.Text style={[
        styles.hint,
        { opacity: hintOpacity, color: isDark ? '#3aaa6e' : '#208050' },
      ]}>
        ✓ Namaste, {value.trim() || '…'}! Your journey awaits.
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap:       { flex: 1, paddingTop: SPACING.xxl }              as ViewStyle,
  iconWrap:   {
    width: 50, height: 50, borderRadius: 25, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl,
  }                                                             as ViewStyle,
  iconEmoji:  { fontSize: 20 }                                  as TextStyle,
  heading:    {
    fontFamily: FONTS.displayLight, fontSize: 40,
    lineHeight: 46, letterSpacing: 0.2, marginBottom: SPACING.xs,
  }                                                             as TextStyle,
  subheading: {
    fontFamily: FONTS.bodyRegular, fontSize: 13,
    lineHeight: 21, marginBottom: SPACING.xl + 4,
  }                                                             as TextStyle,
  inputCard:  {
    borderWidth: 1.5, borderRadius: RADIUS.lg,
    padding: SPACING.md, paddingTop: SPACING.sm + 2,
    marginBottom: SPACING.sm,
  }                                                             as ViewStyle,
  inputLabel: {
    fontFamily: FONTS.bodyMedium, fontSize: 8,
    letterSpacing: 0.15, fontWeight: '500', marginBottom: 6,
  }                                                             as TextStyle,
  inputRow:   { flexDirection: 'row', alignItems: 'center' }   as ViewStyle,
  textInput:  {
    flex: 1, fontFamily: FONTS.displayLight,
    fontSize: 28, lineHeight: 34, padding: 0,
  }                                                             as TextStyle,
  cursor:     {
    width: 2, height: 26, borderRadius: 1, marginLeft: 2,
  }                                                             as ViewStyle,
  underline:  {
    height: 1.5, borderRadius: 1, marginTop: SPACING.sm,
  }                                                             as ViewStyle,
  hint:       {
    fontFamily: FONTS.bodyRegular, fontSize: 11, marginTop: SPACING.sm,
  }                                                             as TextStyle,
});
