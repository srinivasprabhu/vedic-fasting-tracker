import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing,
  TouchableOpacity, ViewStyle, TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS } from '@/constants/theme';

interface StepBuildingPlanProps {
  userName: string;
  /** Called when the animation finishes — parent should advance to the plan reveal step */
  onComplete: () => void;
}

// ─── Analysis stages ──────────────────────────────────────────────────────────

const STAGES = [
  { icon: '🧬', label: 'Analysing your profile…' },
  { icon: '🔥', label: 'Calculating metabolic rate…' },
  { icon: '🕐', label: 'Designing your fasting window…' },
  { icon: '🎯', label: 'Personalising daily targets…' },
  { icon: '✦',  label: 'Your plan is ready' },
];

const STAGE_DELAY   = 850;  // ms between each stage appearing

// ─── Single stage row ─────────────────────────────────────────────────────────

const StageRow: React.FC<{
  icon:    string;
  label:   string;
  isDark:  boolean;
  index:   number;
  active:  boolean;
  isLast:  boolean;
}> = ({ icon, label, isDark, index, active, isLast }) => {
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
      // Show checkmark after the row has appeared
      Animated.timing(checkOpacity, {
        toValue: 1, duration: 260, delay: 200, useNativeDriver: true,
      }).start();
    });
  }, [active]);

  const cream  = isDark ? '#f0e0c0' : '#1e1004';
  const gold   = isDark ? '#e8a84c' : '#a06820';
  const muted  = isDark ? 'rgba(240,224,192,0.45)' : 'rgba(60,35,10,0.5)';
  const check  = isDark ? '#7AAE79' : '#187040';

  return (
    <Animated.View style={[
      styles.stageRow,
      {
        opacity,
        transform: [{ translateY: slideY }, { scale }],
      },
    ]}>
      <Text style={[styles.stageIcon, isLast && { color: gold }]}>{icon}</Text>
      <Text style={[
        styles.stageLabel,
        { color: isLast ? gold : muted },
        isLast && styles.stageLabelFinal,
      ]}>
        {label}
      </Text>
      {!isLast && (
        <Animated.Text style={[styles.stageCheck, { opacity: checkOpacity, color: check }]}>
          ✓
        </Animated.Text>
      )}
    </Animated.View>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const StepBuildingPlan: React.FC<StepBuildingPlanProps> = ({ userName, onComplete }) => {
  const { isDark } = useTheme();

  const [activeIndex, setActiveIndex] = useState(-1);
  const [isComplete, setIsComplete] = useState(false);

  // Progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Title fade-in
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide   = useRef(new Animated.Value(16)).current;

  // Glow pulse
  const glowOpacity = useRef(new Animated.Value(0.03)).current;

  // CTA button entrance
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ctaSlide   = useRef(new Animated.Value(20)).current;
  const ctaScale   = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Title entrance
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true,
      }),
      Animated.timing(titleSlide, {
        toValue: 0, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();

    // Pulsing glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.03, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();

    // Progress bar — smooth fill over the full duration
    const totalDuration = STAGES.length * STAGE_DELAY;
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: totalDuration,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Reveal stages one by one
    const timers: ReturnType<typeof setTimeout>[] = [];
    STAGES.forEach((_, i) => {
      const timer = setTimeout(() => {
        setActiveIndex(i);

        // After the last stage appears, show the CTA
        if (i === STAGES.length - 1) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setIsComplete(true);

          // Animate CTA button in
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

  const handleRevealPlan = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete();
  }, [onComplete]);

  const cream    = isDark ? '#f0e0c0' : '#1e1004';
  const gold     = isDark ? '#c8872a' : '#a06820';
  const goldLt   = isDark ? '#e8a84c' : '#b07020';
  const mutedSub = isDark ? 'rgba(240,224,192,0.38)' : 'rgba(60,35,10,0.42)';

  const firstName = userName?.trim().split(' ')[0] || '';

  return (
    <View style={styles.container}>
      {/* Ambient glow */}
      <Animated.View style={[
        styles.glow,
        { backgroundColor: gold, opacity: glowOpacity },
      ]} />

      {/* Title */}
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

      {/* Progress bar */}
      <View style={[styles.progressTrack, {
        backgroundColor: isDark ? 'rgba(200,135,42,0.1)' : 'rgba(200,135,42,0.14)',
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

      {/* Stage list */}
      <View style={styles.stageList}>
        {STAGES.map((stage, i) => (
          <StageRow
            key={i}
            icon={stage.icon}
            label={stage.label}
            isDark={isDark}
            index={i}
            active={i <= activeIndex}
            isLast={i === STAGES.length - 1}
          />
        ))}
      </View>

      {/* CTA — appears after all stages complete */}
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
              backgroundColor: isDark ? gold : '#b07020',
              shadowColor: gold,
              shadowOpacity: isDark ? 0.35 : 0.25,
            },
          ]}
        >
          <Text style={[
            styles.ctaText,
            { color: isDark ? '#1a0d04' : '#fff8ed' },
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
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: 0.2,
    textAlign: 'center',
    marginBottom: SPACING.xs + 2,
  } as TextStyle,

  titleAccent: {
    fontFamily: FONTS.displayItalic,
    fontSize: 32,
  } as TextStyle,

  subtitle: {
    fontFamily: FONTS.bodyRegular,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  } as TextStyle,

  // Progress bar
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

  // Stage list
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

  stageIcon: {
    fontSize: 18,
    width: 26,
    textAlign: 'center',
  } as TextStyle,

  stageLabel: {
    fontFamily: FONTS.bodyRegular,
    fontSize: 14,
    letterSpacing: 0.1,
    flex: 1,
  } as TextStyle,

  stageLabelFinal: {
    fontFamily: FONTS.bodyMedium,
    fontWeight: '600',
  } as TextStyle,

  stageCheck: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    fontWeight: '600',
  } as TextStyle,

  // CTA button
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
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  } as TextStyle,
});
