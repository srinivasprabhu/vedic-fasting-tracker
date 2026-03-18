// Shared animated card used across Steps 2, 8, 9
import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import { FONTS, SPACING, RADIUS } from '@/constants/theme';

export interface OptionCardItem {
  id:    string;
  icon:  string;
  name:  string;
  desc:  string;
  hint?: string;  // small green note below desc (e.g. beginner progression)
}

interface OptionCardProps {
  item:     OptionCardItem;
  selected: boolean;
  onPress:  () => void;
  delay:    number;
  isDark:   boolean;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  item, selected, onPress, delay, isDark,
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
      ? ['rgba(200,135,42,0.12)', 'rgba(200,135,42,0.55)']
      : ['rgba(200,135,42,0.15)', 'rgba(200,135,42,0.55)'],
  });
  const bgColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isDark
      ? ['rgba(255,255,255,0.02)', 'rgba(200,135,42,0.08)']
      : ['rgba(255,255,255,0.65)',  'rgba(255,248,232,0.95)'],
  });
  const nameColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isDark ? ['#e8d5b0', '#e8a84c'] : ['#1e1004', '#7a4010'],
  });

  const cream   = isDark ? '#f0e0c0' : '#1e1004';
  const muted   = isDark ? 'rgba(240,224,192,0.38)' : 'rgba(60,35,10,0.48)';

  return (
    <Animated.View style={{ opacity: entryOpac, transform: [{ translateY: entrySlide }, { scale: scaleAnim }] }}>
      <TouchableOpacity activeOpacity={1} onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
        <Animated.View style={[s.card, { borderColor, backgroundColor: bgColor }]}>
          <Text style={s.icon}>{item.icon}</Text>
          <View style={s.body}>
            <Animated.Text style={[s.name, { color: nameColor }]}>{item.name}</Animated.Text>
            <Text style={[s.desc, { color: muted }]}>{item.desc}</Text>
            {item.hint && (
              <Text style={[s.hint, { color: isDark ? 'rgba(58,170,110,0.75)' : 'rgba(24,112,64,0.75)' }]}>
                {item.hint}
              </Text>
            )}
          </View>
          <Animated.View style={[
            s.check,
            {
              transform: [{ scale: checkScale }],
              opacity: checkScale,
              backgroundColor: isDark ? '#c8872a' : '#b07020',
            },
          ]}>
            <Text style={s.checkText}>✓</Text>
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const s = StyleSheet.create({
  card:      { flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.xl - 2, borderWidth: 1.5 } as ViewStyle,
  icon:      { fontSize: 22, flexShrink: 0, marginTop: 1 }                                                                                                             as TextStyle,
  body:      { flex: 1, gap: 3 }                                                                                                                                        as ViewStyle,
  name:      { fontFamily: FONTS.bodyMedium, fontSize: 13, fontWeight: '500' as const }                                                                                as TextStyle,
  desc:      { fontFamily: FONTS.bodyRegular, fontSize: 11, lineHeight: 16 }                                                                                           as TextStyle,
  hint:      { fontFamily: FONTS.bodyRegular, fontSize: 10, lineHeight: 14, marginTop: 2 }                                                                             as TextStyle,
  check:     { width: 22, height: 22, borderRadius: 11, flexShrink: 0, alignItems: 'center' as const, justifyContent: 'center' as const, marginTop: 1 }               as ViewStyle,
  checkText: { fontFamily: FONTS.bodyMedium, fontSize: 10, fontWeight: '700' as const, color: '#fff8ed' }                                                              as TextStyle,
});
