import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import type { FastingPath } from '@/types/user';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS } from '@/constants/theme';

interface Step4PathProps {
  value: FastingPath;
  onChange: (path: FastingPath) => void;
}

type PillVariant = 'default' | 'vedic' | 'both';

interface PathOption {
  id: FastingPath;
  icon: string;
  name: string;
  description: string;
  pill: string;
  pillVariant: PillVariant;
  methods?: string[];
}

const PATHS: PathOption[] = [
  {
    id: 'if',
    icon: '⏱️',
    name: 'Intermittent Fasting',
    description: 'Time-based fasting windows. Science-backed, flexible, works for everyone.',
    pill: 'Default',
    pillVariant: 'default',
    methods: ['16:8', '18:6', 'OMAD', '5:2', '72h'],
  },
  {
    id: 'vedic',
    icon: '🪔',
    name: 'Vedic Fasting',
    description: 'Calendar-based fasting aligned with Hindu traditions. Ekadashi, Pradosh, Navratri and more.',
    pill: 'Traditional',
    pillVariant: 'vedic',
    methods: ['Ekadashi', 'Pradosh', 'Navratri'],
  },
  {
    id: 'both',
    icon: '✨',
    name: 'Both',
    description: 'Combine IF windows with Vedic calendar days. The complete Aayu experience.',
    pill: 'Recommended',
    pillVariant: 'both',
  },
];

const PILL_COLORS: Record<PillVariant, { bg: string; border: string; textDark: string; textLight: string }> = {
  default: {
    bg: 'rgba(200,135,42,0.1)',  border: 'rgba(200,135,42,0.28)',
    textDark: '#c8872a', textLight: '#a06820',
  },
  vedic: {
    bg: 'rgba(155,114,207,0.08)', border: 'rgba(155,114,207,0.28)',
    textDark: '#9b72cf', textLight: '#6b42af',
  },
  both: {
    bg: 'rgba(58,170,110,0.08)', border: 'rgba(58,170,110,0.28)',
    textDark: '#3aaa6e', textLight: '#1a8048',
  },
};

const PathCard: React.FC<{
  option: PathOption;
  selected: boolean;
  onPress: () => void;
  delay: number;
  isDark: boolean;
}> = ({ option, selected, onPress, delay, isDark }) => {
  const selectAnim    = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const scaleAnim     = useRef(new Animated.Value(1)).current;
  const entranceAnim  = useRef(new Animated.Value(0)).current;
  const entranceSlide = useRef(new Animated.Value(16)).current;
  const checkScale    = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceAnim, {
        toValue: 1, duration: 420, delay,
        easing: Easing.out(Easing.ease), useNativeDriver: true,
      }),
      Animated.timing(entranceSlide, {
        toValue: 0, duration: 420, delay,
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
    Animated.spring(checkScale, {
      toValue: selected ? 1 : 0,
      speed: 20, bounciness: 9, useNativeDriver: true,
    }).start();
  }, [selected]);

  const handlePressIn  = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 30, bounciness: 3 }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 22, bounciness: 4 }).start();

  const borderColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isDark
      ? ['rgba(200,135,42,0.12)', 'rgba(200,135,42,0.5)']
      : ['rgba(200,135,42,0.15)', 'rgba(200,135,42,0.5)'],
  });
  const bgColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isDark
      ? ['rgba(255,255,255,0.02)', 'rgba(200,135,42,0.07)']
      : ['rgba(255,255,255,0.65)',  'rgba(255,248,232,0.95)'],
  });
  const nameColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isDark
      ? ['#e8d5b0', '#e8a84c']
      : ['#1e1004', '#7a4010'],
  });

  const pill = PILL_COLORS[option.pillVariant];

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
        <Animated.View style={[
          styles.card,
          {
            borderColor,
            backgroundColor: bgColor,
            ...(!isDark && {
              shadowColor: '#c8872a',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: selected ? 0.1 : 0.04,
              shadowRadius: selected ? 16 : 6,
              elevation: selected ? 3 : 1,
            }),
          },
        ]}>
          <Animated.View style={[
            styles.checkBadge,
            {
              transform: [{ scale: checkScale }],
              backgroundColor: isDark ? '#c8872a' : '#b07020',
              opacity: checkScale,
            },
          ]}>
            <Text style={styles.checkText}>✓</Text>
          </Animated.View>

          <View style={styles.cardHeader}>
            <View style={[
              styles.iconWrap,
              {
                backgroundColor: isDark ? 'rgba(200,135,42,0.08)' : 'rgba(200,135,42,0.09)',
                borderColor:     isDark ? 'rgba(200,135,42,0.2)'  : 'rgba(200,135,42,0.22)',
              },
            ]}>
              <Text style={styles.cardIcon}>{option.icon}</Text>
            </View>
            <View style={styles.titleRow}>
              <Animated.Text style={[styles.cardName, { color: nameColor }]}>
                {option.name}
              </Animated.Text>
              <View style={[
                styles.pill,
                { backgroundColor: pill.bg, borderColor: pill.border },
              ]}>
                <Text style={[
                  styles.pillText,
                  { color: isDark ? pill.textDark : pill.textLight },
                ]}>
                  {option.pill}
                </Text>
              </View>
            </View>
          </View>

          <Text style={[
            styles.cardDesc,
            { color: isDark ? 'rgba(240,224,192,0.38)' : 'rgba(60,35,10,0.48)' },
          ]}>
            {option.description}
          </Text>

          {option.methods && (
            <View style={styles.methodsRow}>
              {option.methods.map((m) => (
                <View key={m} style={[
                  styles.methodPill,
                  { borderColor: isDark ? 'rgba(200,135,42,0.15)' : 'rgba(200,135,42,0.18)' },
                ]}>
                  <Text style={[
                    styles.methodText,
                    { color: isDark ? '#7a6040' : '#7a5028' },
                  ]}>
                    {m}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const Step4Path: React.FC<Step4PathProps> = ({ value, onChange }) => {
  const { isDark, colors } = useTheme();
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconScale   = useRef(new Animated.Value(0.8)).current;

  const cream = isDark ? '#f0e0c0' : '#1e1004';
  const goldLight = isDark ? '#e8a84c' : '#a06820';
  const mutedSub = isDark ? 'rgba(240,224,192,0.42)' : 'rgba(60,35,10,0.48)';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(iconOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(iconScale,   { toValue: 1, speed: 12, bounciness: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingTop: SPACING.lg,
        paddingBottom: 24,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Animated.View style={[
        styles.headerIcon,
        {
          opacity: iconOpacity,
          transform: [{ scale: iconScale }],
          backgroundColor: 'rgba(200,135,42,0.1)',
          borderColor: isDark ? 'rgba(200,135,42,0.2)' : 'rgba(200,135,42,0.28)',
        },
      ]}>
        <Text style={styles.headerEmoji}>🌿</Text>
      </Animated.View>

      <Text style={[styles.heading, { color: cream }]}>
        Your fasting{'\n'}
        <Text style={[styles.headingAccent, { color: goldLight }]}>
          path
        </Text>
      </Text>
      <Text style={[styles.subheading, { color: mutedSub }]}>
        You can always change this in settings
      </Text>

      <View style={styles.cards}>
        {PATHS.map((path, i) => (
          <PathCard
            key={path.id}
            option={path}
            selected={value === path.id}
            onPress={() => onChange(path.id)}
            delay={i * 85}
            isDark={isDark}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  headerIcon:  {
    width: 50, height: 50, borderRadius: 25, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg,
  }                                                              as ViewStyle,
  headerEmoji: { fontSize: 20 }                                  as TextStyle,
  heading:     {
    fontFamily: FONTS.displayLight, fontSize: 38,
    lineHeight: 44, letterSpacing: 0.2, marginBottom: SPACING.xs,
  }                                                              as TextStyle,
  headingAccent: {
    fontFamily: FONTS.displayItalic, fontSize: 38,
  }                                                              as TextStyle,
  subheading:  {
    fontFamily: FONTS.bodyRegular, fontSize: 13,
    lineHeight: 21, marginBottom: SPACING.xl,
  }                                                              as TextStyle,
  cards:       { gap: SPACING.sm + 1 }                           as ViewStyle,
  card:        {
    borderRadius: RADIUS.xl, borderWidth: 1.5,
    padding: SPACING.md, position: 'relative',
  }                                                              as ViewStyle,
  checkBadge:  {
    position: 'absolute', top: SPACING.md, right: SPACING.md,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  }                                                              as ViewStyle,
  checkText:   {
    fontFamily: FONTS.bodyMedium, fontSize: 9,
    fontWeight: '700', color: '#fff8ed',
  }                                                              as TextStyle,
  cardHeader:  {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.sm + 2, marginBottom: SPACING.xs + 2,
  }                                                              as ViewStyle,
  iconWrap:    {
    width: 38, height: 38, borderRadius: RADIUS.md,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }                                                              as ViewStyle,
  cardIcon:    { fontSize: 17 }                                  as TextStyle,
  titleRow:    { flex: 1, gap: 3 }                               as ViewStyle,
  cardName:    {
    fontFamily: FONTS.bodyMedium, fontSize: 13, fontWeight: '500',
  }                                                              as TextStyle,
  pill:        {
    alignSelf: 'flex-start', paddingHorizontal: SPACING.sm,
    paddingVertical: 2, borderRadius: RADIUS.pill, borderWidth: 1,
  }                                                              as ViewStyle,
  pillText:    {
    fontFamily: FONTS.bodyMedium, fontSize: 8,
    fontWeight: '500', letterSpacing: 0.07,
  }                                                              as TextStyle,
  cardDesc:    {
    fontFamily: FONTS.bodyRegular, fontSize: 11,
    lineHeight: 17, marginBottom: SPACING.sm,
  }                                                              as TextStyle,
  methodsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 5 } as ViewStyle,
  methodPill:  {
    borderWidth: 1, borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm, paddingVertical: 2,
  }                                                              as ViewStyle,
  methodText:  {
    fontFamily: FONTS.bodyRegular, fontSize: 9,
  }                                                              as TextStyle,
});
