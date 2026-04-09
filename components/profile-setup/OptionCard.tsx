// Shared animated card used across Steps 2, 8, 9
import React, { useRef, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { FONTS, SPACING, RADIUS, fs, lh } from '@/constants/theme';
import type { ColorScheme } from '@/constants/colors';
import { hexAlpha } from '@/constants/colors';

export interface OptionCardItem {
  id:    string;
  icon:  React.ReactNode;
  name:  string;
  desc:  string;
  hint?: string;
}

interface OptionCardProps {
  item:     OptionCardItem;
  selected: boolean;
  onPress:  () => void;
  delay:    number;
  isDark:   boolean;
  colors:   ColorScheme;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  item, selected, onPress, delay, isDark, colors,
}) => {
  const selectAnim   = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const scaleAnim    = useRef(new Animated.Value(1)).current;
  const entryOpac    = useRef(new Animated.Value(0)).current;
  const entrySlide   = useRef(new Animated.Value(14)).current;
  const checkScale   = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entryOpac,  { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.timing(entrySlide, { toValue: 0, duration: 380, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(selectAnim, {
      toValue: selected ? 1 : 0,
      duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: false,
    }).start();
    Animated.spring(checkScale, {
      toValue: selected ? 1 : 0, speed: 20, bounciness: 9, useNativeDriver: true,
    }).start();
  }, [selected]);

  const handlePressIn  = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, speed: 30, bounciness: 3, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1,    speed: 22, bounciness: 4, useNativeDriver: true }).start();

  const borderColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isDark
      ? [hexAlpha(colors.primary, 0.12), hexAlpha(colors.primary, 0.55)]
      : [hexAlpha(colors.primary, 0.15), hexAlpha(colors.primary, 0.55)],
  });
  const bgColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isDark
      ? ['rgba(255,255,255,0.02)', hexAlpha(colors.primary, 0.08)]
      : ['rgba(255,255,255,0.65)',  'rgba(255,248,232,0.95)'],
  });
  const nameColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isDark ? [colors.textSecondary, colors.primary] : [colors.text, colors.primaryDark],
  });

  const a11yLabel = useMemo(() => {
    const parts = [item.name, item.desc];
    if (item.hint) parts.push(item.hint);
    return parts.join('. ');
  }, [item.desc, item.hint, item.name]);

  return (
    <Animated.View style={{ opacity: entryOpac, transform: [{ translateY: entrySlide }, { scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={a11yLabel}
        accessibilityHint={selected ? 'Currently selected. Double tap to keep this option.' : 'Double tap to select this option'}
      >
        <Animated.View style={[s.card, { borderColor, backgroundColor: bgColor }]}>
          <View style={s.iconWrap} importantForAccessibility="no-hide-descendants">{item.icon}</View>
          <View style={s.body}>
            <Animated.Text style={[s.name, { color: nameColor }]}>{item.name}</Animated.Text>
            <Text style={[s.desc, { color: colors.textSecondary }]}>{item.desc}</Text>
            {item.hint && (
              <Text style={[s.hint, { color: colors.success }]}>
                {item.hint}
              </Text>
            )}
          </View>
          <Animated.View
            style={[
              s.check,
              {
                transform: [{ scale: checkScale }],
                opacity: checkScale,
                backgroundColor: colors.primary,
              },
            ]}
            importantForAccessibility="no-hide-descendants"
          >
            <Check size={12} color={colors.textLight} strokeWidth={3} />
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const s = StyleSheet.create({
  card:     { flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.xl - 2, borderWidth: 1.5 } as ViewStyle,
  iconWrap: { flexShrink: 0, marginTop: 1 }                                                                                                                         as ViewStyle,
  body:     { flex: 1, gap: 3 }                                                                                                                                      as ViewStyle,
  name:     { fontFamily: FONTS.bodyMedium, fontSize: fs(13), fontWeight: '500' as const }                                                                              as TextStyle,
  desc:     { fontFamily: FONTS.bodyRegular, fontSize: fs(11), lineHeight: lh(11, 1.35) }                                                                                  as TextStyle,
  hint:     { fontFamily: FONTS.bodyRegular, fontSize: fs(10), lineHeight: lh(10, 1.35), marginTop: 2 }                                                                  as TextStyle,
  check:    { width: 22, height: 22, borderRadius: 11, flexShrink: 0, alignItems: 'center' as const, justifyContent: 'center' as const, marginTop: 1 }             as ViewStyle,
});
