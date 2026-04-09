import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing,
  TouchableOpacity, ViewStyle, TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Dna, Flame, Clock, Target, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS, fs, lh } from '@/constants/theme';
import type { ColorScheme } from '@/constants/colors';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface StepBuildingPlanProps {
  userName: string;
  onComplete: () => void;
}

// ─── Analysis stages ──────────────────────────────────────────────────────────

const STAGES: { Icon: typeof Dna | null; label: string }[] = [
  { Icon: Dna,    label: 'Analysing your profile…' },
  { Icon: Flame,  label: 'Calculating metabolic rate…' },
  { Icon: Clock,  label: 'Designing your fasting window…' },
  { Icon: Target, label: 'Personalising daily targets…' },
  { Icon: null,   label: 'Your plan is ready' },
];

const STAGE_DELAY = 850;

// ─── Single stage row ─────────────────────────────────────────────────────────

const StageRow: React.FC<{
  Icon:    typeof Dna | null;
  label:   string;
  colors:  ColorScheme;
  index:   number;
  active:  boolean;
  isLast:  boolean;
}> = ({ Icon, label, colors, index, active, isLast }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(12)).current;
  const scale   = useRef(new Animated.Value(0.92)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 340, easing: Easing.out(Easing.ease), useNativeDriver: true,
      }),
      Animated.timing(slideY, {
        toValue: 0, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1, speed: 16, bounciness: 4, useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(checkOpacity, {
        toValue: 1, duration: 260, delay: 200, useNativeDriver: true,
      }).start();
    });
  }, [active]);

  const gold   = colors.primary;
  const muted  = colors.textMuted;
  const checkColor = colors.success;

  return (
    <Animated.View style={[
      styles.stageRow,
      {
        opacity,
        transform: [{ translateY: slideY }, { scale }],
      },
    ]}>
      <View style={styles.stageIconWrap}>
        {Icon ? (
          <Icon size={18} color={isLast ? gold : muted} />
        ) : (
          <Text
            style={[styles.stageBrandMark, { color: gold }]}
            accessible={false}
            importantForAccessibility="no"
          >
            ✦
          </Text>
        )}
      </View>
      <Text style={[
        styles.stageLabel,
        { color: isLast ? gold : muted },
        isLast && styles.stageLabelFinal,
      ]}>
        {label}
      </Text>
      {!isLast && (
        <Animated.View style={{ opacity: checkOpacity }}>
          <Check size={14} color={checkColor} strokeWidth={3} />
        </Animated.View>
      )}
    </Animated.View>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const StepBuildingPlan: React.FC<StepBuildingPlanProps> = ({ userName, onComplete }) => {
  const { isDark, colors } = useTheme();
  const reduceMotion = useReducedMotion();

  const [activeIndex, setActiveIndex] = useState(-1);
  const [isComplete, setIsComplete] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide   = useRef(new Animated.Value(16)).current;
  const glowOpacity  = useRef(new Animated.Value(0.03)).current;
  const ctaOpacity   = useRef(new Animated.Value(0)).current;
  const ctaSlide     = useRef(new Animated.Value(20)).current;
  const ctaScale     = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true,
      }),
      Animated.timing(titleSlide, {
        toValue: 0, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();

    const totalDuration = STAGES.length * STAGE_DELAY;
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: totalDuration,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const timers: ReturnType<typeof setTimeout>[] = [];
    STAGES.forEach((_, i) => {
      const timer = setTimeout(() => {
        setActiveIndex(i);

        if (i === STAGES.length - 1) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setIsComplete(true);

          Animated.parallel([
            Animated.timing(ctaOpacity, {
              toValue: 1, duration: 420, delay: 300,
              easing: Easing.out(Easing.ease), useNativeDriver: true,
            }),
            Animated.timing(ctaSlide, {
              toValue: 0, duration: 400, delay: 300,
              easing: Easing.out(Easing.cubic), useNativeDriver: true,
            }),
            Animated.spring(ctaScale, {
              toValue: 1, delay: 300, speed: 14, bounciness: 6, useNativeDriver: true,
            }),
          ]).start();
        }
      }, (i + 1) * STAGE_DELAY);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      glowOpacity.setValue(0.055);
      return;
    }
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.03, duration: 1200, useNativeDriver: true }),
      ]),
    );
    glowLoop.start();
    return () => glowLoop.stop();
  }, [reduceMotion, glowOpacity]);

  const handleRevealPlan = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete();
  }, [onComplete]);

  const cream    = colors.text;
  const gold     = colors.primary;
  const goldLt   = colors.trackWeight;
  const mutedSub = colors.textSecondary;

  const firstName = userName?.trim().split(' ')[0] || '';

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.glow,
        { backgroundColor: gold, opacity: glowOpacity },
      ]} />

      <Animated.View style={[
        styles.titleWrap,
        { opacity: titleOpacity, transform: [{ translateY: titleSlide }] },
      ]}>
        <Text style={[styles.title, { color: cream }]}>
          {firstName ? `${firstName}, ` : ''}building{'\n'}
          your <Text style={[styles.titleAccent, { color: goldLt }]}>plan</Text>
        </Text>
        <Text style={[styles.subtitle, { color: mutedSub }]}>
          Crafting a personalised experience just for you
        </Text>
      </Animated.View>

      <View style={[styles.progressTrack, {
        backgroundColor: `${colors.primary}24`,
      }]}>
        <Animated.View style={[styles.progressFill, {
          backgroundColor: goldLt,
          width: progressAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          }),
          shadowColor: goldLt,
        }]} />
      </View>

      <View style={styles.stageList}>
        {STAGES.map((stage, i) => (
          <StageRow
            key={i}
            Icon={stage.Icon}
            label={stage.label}
            colors={colors}
            index={i}
            active={i <= activeIndex}
            isLast={i === STAGES.length - 1}
          />
        ))}
      </View>

      <Animated.View style={[
        styles.ctaWrap,
        {
          opacity: ctaOpacity,
          transform: [{ translateY: ctaSlide }, { scale: ctaScale }],
        },
      ]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleRevealPlan}
          style={[
            styles.ctaBtn,
            {
              backgroundColor: colors.fastAction,
              shadowColor: colors.fastAction,
              shadowOpacity: isDark ? 0.35 : 0.25,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="See my personalised plan"
        >
          <Text style={[
            styles.ctaText,
            { color: colors.onFastAction },
          ]}>
            See my personalised plan ✦
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,

  glow: {
    position: 'absolute',
    top: '15%',
    left: '10%',
    right: '10%',
    height: '35%',
    borderRadius: 200,
  } as ViewStyle,

  titleWrap: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  } as ViewStyle,

  title: {
    fontFamily: FONTS.displayLight,
    fontSize: fs(32),
    lineHeight: lh(32),
    letterSpacing: 0.2,
    textAlign: 'center',
    marginBottom: SPACING.xs + 2,
  } as TextStyle,

  titleAccent: {
    fontFamily: FONTS.displayItalic,
    fontSize: fs(32),
    lineHeight: lh(32),
  } as TextStyle,

  subtitle: {
    fontFamily: FONTS.bodyRegular,
    fontSize: fs(13),
    lineHeight: lh(13, 1.35),
    textAlign: 'center',
  } as TextStyle,

  progressTrack: {
    width: '80%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: SPACING.xl + SPACING.sm,
  } as ViewStyle,

  progressFill: {
    height: '100%',
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  } as ViewStyle,

  stageList: {
    width: '100%',
    gap: SPACING.md + 2,
  } as ViewStyle,

  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm + 4,
  } as ViewStyle,

  stageIconWrap: {
    width: 26,
    alignItems: 'center',
  } as ViewStyle,

  stageBrandMark: {
    fontSize: fs(18),
    fontFamily: FONTS.bodyRegular,
  } as TextStyle,

  stageLabel: {
    fontFamily: FONTS.bodyRegular,
    fontSize: fs(14),
    letterSpacing: 0.1,
    flex: 1,
  } as TextStyle,

  stageLabelFinal: {
    fontFamily: FONTS.bodyMedium,
    fontWeight: '600',
  } as TextStyle,

  ctaWrap: {
    width: '100%',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.xl + SPACING.md,
  } as ViewStyle,

  ctaBtn: {
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 8,
  } as ViewStyle,

  ctaText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: fs(16),
    fontWeight: '600',
    letterSpacing: 0.2,
  } as TextStyle,
});
