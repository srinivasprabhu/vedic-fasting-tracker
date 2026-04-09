import React, { useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import { User, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS, fs, lh } from '@/constants/theme';
import { hexAlpha } from '@/constants/colors';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Step1NameProps {
  value: string;
  onChange: (name: string) => void;
  onSubmit?: () => void;
}

export const Step1Name: React.FC<Step1NameProps> = ({
  value, onChange, onSubmit,
}) => {
  const { isDark, colors } = useTheme();
  const reduceMotion = useReducedMotion();

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
    if (reduceMotion) {
      cursorAnim.setValue(1);
      return;
    }
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(cursorAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    blink.start();
    return () => blink.stop();
  }, [reduceMotion]);

  useEffect(() => {
    Animated.timing(hintOpacity, {
      toValue: value.trim().length > 0 ? 1 : 0,
      duration: 320, easing: Easing.out(Easing.ease), useNativeDriver: true,
    }).start();
  }, [value]);

  const borderColor = cardGlow.interpolate({
    inputRange: [0, 1],
    outputRange: isDark
      ? [hexAlpha(colors.primary, 0.22), hexAlpha(colors.primary, 0.7)]
      : [hexAlpha(colors.primary, 0.3), hexAlpha(colors.primary, 0.75)],
  });
  const cardBg = cardGlow.interpolate({
    inputRange: [0, 1],
    outputRange: isDark
      ? [hexAlpha(colors.primary, 0.04), hexAlpha(colors.primary, 0.09)]
      : ['rgba(255,255,255,0.6)',  'rgba(255,255,255,0.9)'],
  });

  const cream = colors.text;
  const goldColor = colors.primary;
  const mutedSub = colors.textSecondary;
  const goldLight = colors.trackWeight;

  return (
    <View style={styles.wrap}>
      <Animated.View style={[
        styles.iconWrap,
        {
          opacity: iconOpacity,
          transform: [{ scale: iconScale }],
          backgroundColor: `${colors.primary}1A`,
          borderColor: `${colors.primary}33`,
        },
      ]}>
        <User size={20} color={goldLight} />
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
          : { shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.08, shadowRadius: 12 },
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
            placeholderTextColor={colors.textMuted}
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
          { backgroundColor: `${colors.primary}80` },
        ]} />
      </Animated.View>

      <Animated.View style={[
        styles.hintRow,
        { opacity: hintOpacity },
      ]}>
        <Check size={14} color={colors.success} strokeWidth={3} />
        <Text style={[styles.hint, { color: colors.success }]}>
          Namaste, {value.trim() || '…'}! Your journey awaits.
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap:       { flex: 1, paddingTop: SPACING.xxl }              as ViewStyle,
  iconWrap:   {
    width: 50, height: 50, borderRadius: 25, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl,
  }                                                             as ViewStyle,
  iconEmoji:  { fontSize: fs(20) }                                  as TextStyle,
  heading:    {
    fontFamily: FONTS.displayLight, fontSize: fs(40),
    lineHeight: lh(40), letterSpacing: 0.2, marginBottom: SPACING.xs,
  }                                                             as TextStyle,
  subheading: {
    fontFamily: FONTS.bodyRegular, fontSize: fs(14),
    lineHeight: lh(14, 1.35), marginBottom: SPACING.xl + 4,
  }                                                             as TextStyle,
  inputCard:  {
    borderWidth: 1.5, borderRadius: RADIUS.lg,
    padding: SPACING.md, paddingTop: SPACING.sm + 2,
    marginBottom: SPACING.sm,
  }                                                             as ViewStyle,
  inputLabel: {
    fontFamily: FONTS.bodyMedium, fontSize: fs(10),
    letterSpacing: 0.15, fontWeight: '500', marginBottom: 6,
  }                                                             as TextStyle,
  inputRow:   { flexDirection: 'row', alignItems: 'center' }   as ViewStyle,
  textInput:  {
    flex: 1, fontFamily: FONTS.displayLight,
    fontSize: fs(28), lineHeight: lh(28), padding: 0,
  }                                                             as TextStyle,
  cursor:     {
    width: 2, height: 26, borderRadius: 1, marginLeft: 2,
  }                                                             as ViewStyle,
  underline:  {
    height: 1.5, borderRadius: 1, marginTop: SPACING.sm,
  }                                                             as ViewStyle,
  hintRow:    {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.sm,
  }                                                             as ViewStyle,
  hint:       {
    fontFamily: FONTS.bodyRegular, fontSize: fs(13),
  }                                                             as TextStyle,
});
