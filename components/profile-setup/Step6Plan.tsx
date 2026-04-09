import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS, fs, lh } from '@/constants/theme';
import type { UserPlan } from '@/types/user';
import {
  formatWater, formatSteps, bmiCategoryLabel, bmiCategoryColor,
  estimateAdjustedWeeksToGoal,
} from '@/utils/calculatePlan';
import { WeightProjectionChart } from '@/components/WeightProjectionChart';
import { Footprints, Droplets, Flame, Scale, Info } from 'lucide-react-native';

// ─── Helper: compute dynamic fast window label ──────────────────────────────

function formatFastWindow(fastHours: number, lastMealHour: number = 20): string {
  const startHour = lastMealHour;
  const endHour = (startHour + fastHours) % 24;
  const fmt = (h: number) => {
    const period = h >= 12 ? 'pm' : 'am';
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${display}${period}`;
  };
  return `${fmt(startHour)} \u2192 ${fmt(endHour)}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step6PlanProps {
  plan:            UserPlan;
  userName:        string;
  currentWeightKg?: number;
  goalWeightKg?:   number;
  weightUnit?:     string;
  lastMealHour?:   number;
}



// ─── Animated metric card ────────────────────────────────────────────────────

const PlanCard: React.FC<{
  icon:      React.ReactNode;
  label:     string;
  value:     string;
  unit?:     string;
  sub?:      string;
  accent?:   string;
  isDark:    boolean;
  delay:     number;
  featured?: boolean;
  children?: React.ReactNode;
}> = ({ icon, label, value, unit, sub, accent, isDark, delay, featured, children }) => {
  const opac  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(14)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opac,  { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 380, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, delay, speed: 14, bounciness: 5, useNativeDriver: true }),
    ]).start();
  }, []);

  const cream    = isDark ? '#f0e0c0' : '#1e1004';
  const mutedClr = isDark ? '#7a6040' : '#7a5028';

  return (
    <Animated.View style={[
      styles.card,
      featured && styles.cardFeatured,
      {
        opacity: opac,
        transform: [{ translateY: slide }, { scale }],
        backgroundColor: isDark ? '#1c1009' : 'rgba(255,255,255,0.78)',
        borderColor: isDark ? 'rgba(200,135,42,0.16)' : 'rgba(200,135,42,0.22)',
        ...(featured && {
          borderColor: isDark ? 'rgba(200,135,42,0.35)' : 'rgba(200,135,42,0.42)',
          backgroundColor: isDark ? '#231508' : 'rgba(255,248,232,0.9)',
        }),
        ...(!isDark && {
          shadowColor: '#c8872a',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: featured ? 0.12 : 0.06,
          shadowRadius: 10, elevation: featured ? 3 : 1,
        }),
      },
    ]}>
      <View style={styles.cardIconWrap}>{icon}</View>
      <Text style={[styles.cardLabel, { color: isDark ? 'rgba(200,135,42,0.5)' : 'rgba(160,104,32,0.55)' }]}>
        {label}
      </Text>
      <View style={styles.cardValueRow}>
        <Text style={[styles.cardValue, { color: cream }]}>{value}</Text>
        {unit && <Text style={[styles.cardUnit, { color: mutedClr }]}>{unit}</Text>}
      </View>
      {sub && (
        <Text style={[styles.cardSub, { color: isDark ? 'rgba(240,224,192,0.38)' : 'rgba(60,35,10,0.42)' }]}>
          {sub}
        </Text>
      )}
      {children}
    </Animated.View>
  );
};

// ─── IF window bar ────────────────────────────────────────────────────────────

const IFWindowBar: React.FC<{
  fastHours:     number;
  eatHours:      number;
  isDark:        boolean;
  delay:         number;
  lastMealHour?: number;
}> = ({ fastHours, eatHours, isDark, delay, lastMealHour = 20 }) => {
  const opac  = useRef(new Animated.Value(0)).current;
  const fillW = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opac, { toValue: 1, duration: 320, delay, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    Animated.timing(fillW, {
      toValue: fastHours / 24,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [fastHours]);

  const fastPct  = (fastHours / 24) * 100;
  const cream    = isDark ? '#f0e0c0' : '#1e1004';
  const mutedClr = isDark ? '#7a6040' : '#7a5028';

  return (
    <Animated.View style={[
      styles.ifCard,
      {
        opacity: opac,
        backgroundColor: isDark ? '#231508' : 'rgba(255,248,232,0.9)',
        borderColor: isDark ? 'rgba(200,135,42,0.35)' : 'rgba(200,135,42,0.42)',
        ...(!isDark && {
          shadowColor: '#c8872a', shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.1, shadowRadius: 10, elevation: 2,
        }),
      },
    ]}>
      <Text style={[styles.cardLabel, { color: isDark ? 'rgba(200,135,42,0.5)' : 'rgba(160,104,32,0.55)' }]}>
        FASTING PROTOCOL
      </Text>

      <View style={styles.ifTitleRow}>
        <Text style={[styles.ifBig, { color: cream }]}>{fastHours}</Text>
        <Text style={[styles.ifColon, { color: mutedClr }]}>:</Text>
        <Text style={[styles.ifBig, { color: cream }]}>{eatHours}</Text>
        <Text style={[styles.ifUnit, { color: mutedClr }]}>IF</Text>
      </View>

      <View style={[styles.ifTrack, { backgroundColor: isDark ? 'rgba(200,135,42,0.1)' : 'rgba(200,135,42,0.12)' }]}>
        <Animated.View style={[
          styles.ifFastFill,
          { width: fillW.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${fastPct}%`] }) },
        ]} />
        <View style={[
          styles.ifEatFill,
          { width: `${100 - fastPct}%`, backgroundColor: isDark ? 'rgba(58,170,110,0.4)' : 'rgba(58,170,110,0.35)' },
        ]} />
      </View>

      <View style={styles.ifLabels}>
        <Text style={[styles.ifLabelText, { color: isDark ? 'rgba(200,135,42,0.45)' : 'rgba(160,104,32,0.5)' }]}>
          {fastHours}h fasting ({formatFastWindow(fastHours, lastMealHour)})
        </Text>
        <Text style={[styles.ifLabelText, { color: isDark ? 'rgba(58,170,110,0.55)' : 'rgba(24,112,64,0.55)' }]}>
          {eatHours}h eating
        </Text>
      </View>

    </Animated.View>
  );
};

// ─── Goal row ─────────────────────────────────────────────────────────────────

const GoalRow: React.FC<{
  weeksToGoal: number | null;
  isDark:      boolean;
  delay:       number;
}> = ({ weeksToGoal, isDark, delay }) => {
  const opac  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opac,  { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 360, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  if (!weeksToGoal) return null;

  return (
    <Animated.View style={[
      styles.goalRow,
      {
        opacity: opac,
        transform: [{ translateY: slide }],
        backgroundColor: isDark ? 'rgba(58,170,110,0.07)' : 'rgba(58,170,110,0.07)',
        borderColor: isDark ? 'rgba(58,170,110,0.22)' : 'rgba(58,170,110,0.25)',
      },
    ]}>
      <View>
        <Text style={[styles.goalEyebrow, { color: isDark ? 'rgba(58,170,110,0.6)' : 'rgba(24,112,64,0.65)' }]}>
          ESTIMATED TIMELINE
        </Text>
        <View style={styles.goalValueRow}>
          <Text style={[styles.goalValue, { color: isDark ? '#7AAE79' : '#187040' }]}>
            ~{weeksToGoal}
          </Text>
          <Text style={[styles.goalUnit, { color: isDark ? '#7AAE79' : '#187040' }]}> weeks</Text>
        </View>
      </View>
      <Text style={[styles.goalSub, { color: isDark ? 'rgba(240,224,192,0.38)' : 'rgba(60,35,10,0.4)' }]}>
        at this plan
      </Text>
    </Animated.View>
  );
};

// ─── Main Step6Plan ───────────────────────────────────────────────────────────

export const Step6Plan: React.FC<Step6PlanProps> = ({
  plan, userName, currentWeightKg, goalWeightKg, weightUnit = 'kg', lastMealHour = 20,
}) => {
  const { isDark } = useTheme();

  const fastHours    = plan.fastHours;
  const eatHours     = plan.eatHours;
  const dailySteps   = plan.dailySteps;
  const dailyWaterMl = plan.dailyWaterMl;

  // Badge + title animations
  const badgeOpac  = useRef(new Animated.Value(0)).current;
  const titleOpac  = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(badgeOpac, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(titleOpac,  { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(titleSlide, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const cream    = isDark ? '#f0e0c0' : '#1e1004';
  const goldLt   = isDark ? '#e8a84c' : '#a06820';
  const mutedSub = isDark ? 'rgba(240,224,192,0.42)' : 'rgba(60,35,10,0.48)';

  const waterLabel   = formatWater(dailyWaterMl);
  const stepsLabel   = formatSteps(dailySteps);
  const deficitLabel = plan.dailyDeficit > 0 ? `−${plan.dailyDeficit} kcal/day` : 'Maintenance';

  // Dynamic timeline that reacts to customised fasting + steps
  const adjustedWeeksToGoal = (currentWeightKg && goalWeightKg && plan.weeksToGoal)
    ? estimateAdjustedWeeksToGoal(plan, fastHours, dailySteps, currentWeightKg, goalWeightKg)
    : plan.weeksToGoal;

  const hasProjection = !!(currentWeightKg && goalWeightKg && adjustedWeeksToGoal && adjustedWeeksToGoal > 0);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: SPACING.md, paddingBottom: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Badge */}
      <Animated.View style={[
        styles.badge,
        {
          opacity: badgeOpac,
          backgroundColor: isDark ? 'rgba(200,135,42,0.1)' : 'rgba(200,135,42,0.1)',
          borderColor: isDark ? 'rgba(200,135,42,0.3)' : 'rgba(200,135,42,0.35)',
        },
      ]}>
        <Text style={[styles.badgeText, { color: goldLt }]}>✦ Personalised for you</Text>
      </Animated.View>

      {/* Title */}
      <Animated.View style={{ opacity: titleOpac, transform: [{ translateY: titleSlide }] }}>
        <Text style={[styles.title, { color: cream }]}>
          Your <Text style={[styles.titleAccent, { color: goldLt }]}>plan</Text> is{'\n'}
          ready{userName ? `, ${userName.split(' ')[0]}` : ''}
        </Text>
        <Text style={[styles.subtitle, { color: mutedSub }]}>
          Based on your profile · adjust anytime in settings
        </Text>
      </Animated.View>

      {/* IF Protocol */}
      <IFWindowBar
        fastHours={fastHours}
        eatHours={eatHours}
        isDark={isDark}
        delay={200}
        lastMealHour={lastMealHour}
      />

      {/* 2-column grid */}
      <View style={styles.grid}>
        <PlanCard
          icon={<View style={[styles.featureIcon, { backgroundColor: '#7AAE7915' }]}><Footprints size={15} color="#7AAE79" /></View>}
          label="DAILY STEPS"
          value={stepsLabel} sub="steps / day"
          isDark={isDark} delay={320}
        />

        <PlanCard
          icon={<View style={[styles.featureIcon, { backgroundColor: '#5b8dd915' }]}><Droplets size={15} color="#5b8dd9" /></View>}
          label="DAILY WATER"
          value={waterLabel} sub="35ml per kg"
          isDark={isDark} delay={370}
        />

        <PlanCard
          icon={<View style={[styles.featureIcon, { backgroundColor: '#e07b3015' }]}><Flame size={15} color="#e07b30" /></View>}
          label="DAILY CALORIES"
          value={String(plan.dailyCalories)} unit="kcal"
          sub={deficitLabel}
          isDark={isDark} delay={420}
        />
        {plan.bmi != null && (
          <PlanCard
            icon={<View style={[styles.featureIcon, { backgroundColor: '#e8a84c15' }]}><Scale size={15} color="#e8a84c" /></View>}
            label="BMI"
            value={String(plan.bmi)}
            sub={bmiCategoryLabel(plan.bmiCategory)}
            accent={bmiCategoryColor(plan.bmiCategory, isDark)}
            isDark={isDark} delay={470}
          />
        )}
      </View>

      {/* Projected weight curve */}
      {hasProjection && (
        <WeightProjectionChart
          currentWeightKg={currentWeightKg!}
          goalWeightKg={goalWeightKg!}
          weeksToGoal={adjustedWeeksToGoal!}
          weightUnit={weightUnit}
          delay={520}
        />
      )}

      {/* Goal timeline */}
      <GoalRow weeksToGoal={adjustedWeeksToGoal} isDark={isDark} delay={hasProjection ? 620 : 520} />

      {/* Projection disclaimer */}
      {hasProjection && (
        <View style={styles.disclaimerRow}>
          <Info size={14} color={isDark ? 'rgba(240,224,192,0.3)' : 'rgba(60,35,10,0.35)'} />
          <Text style={[styles.disclaimerText, { color: isDark ? 'rgba(240,224,192,0.3)' : 'rgba(60,35,10,0.35)' }]}>
            This is a conservative estimate based on your fasting plan, activity level, and age. Actual results may vary depending on food choices during your eating window, sleep quality, stress, hydration, and hormonal factors. Many users see results faster with consistent fasting and mindful eating.
          </Text>
        </View>
      )}

    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  badge:          {
    alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.sm + 2, paddingVertical: 4,
    borderRadius: RADIUS.pill, borderWidth: 1,
    marginBottom: SPACING.sm + 2,
  }                                                              as ViewStyle,
  badgeText:      {
    fontFamily: FONTS.bodyMedium, fontSize: fs(11),
    fontWeight: '500', letterSpacing: 0.14,
  }                                                              as TextStyle,
  title:          {
    fontFamily: FONTS.displayLight, fontSize: fs(34),
    lineHeight: lh(34), letterSpacing: 0.2, marginBottom: SPACING.xs,
  }                                                              as TextStyle,
  titleAccent:    { fontFamily: FONTS.displayItalic, fontSize: fs(34), lineHeight: lh(34) } as TextStyle,
  subtitle:       {
    fontFamily: FONTS.bodyRegular, fontSize: fs(13),
    lineHeight: lh(13, 1.35), marginBottom: SPACING.sm,
  }                                                              as TextStyle,
  // IF card
  ifCard:         {
    borderWidth: 1.5, borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md + 4,
    marginBottom: SPACING.sm,
  }                                                              as ViewStyle,
  ifTitleRow:     { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: SPACING.sm } as ViewStyle,
  ifBig:          { fontFamily: FONTS.displayLight, fontSize: fs(38), fontWeight: '300', lineHeight: lh(38) } as TextStyle,
  ifColon:        { fontFamily: FONTS.displayLight, fontSize: fs(24), fontWeight: '300', lineHeight: lh(24) } as TextStyle,
  ifUnit:         { fontFamily: FONTS.bodyMedium, fontSize: fs(13), fontWeight: '500', lineHeight: lh(13), marginLeft: 4 } as TextStyle,
  ifTrack:        { height: 8, borderRadius: 4, flexDirection: 'row', overflow: 'hidden', marginBottom: SPACING.xs } as ViewStyle,
  ifFastFill:     { height: '100%', backgroundColor: 'rgba(200,135,42,0.55)' } as ViewStyle,
  ifEatFill:      { height: '100%' }                            as ViewStyle,
  ifLabels:       { flexDirection: 'row', justifyContent: 'space-between' } as ViewStyle,
  ifLabelText:    { fontFamily: FONTS.bodyRegular, fontSize: fs(11), lineHeight: lh(11, 1.35) } as TextStyle,
  // Metric cards
  grid:           { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm } as ViewStyle,
  card:           {
    width: '47.5%', borderWidth: 1.5, borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.sm + 2,
    paddingTop: SPACING.sm + 4,
    paddingBottom: SPACING.md,
  }                                                              as ViewStyle,
  cardFeatured:   {}                                             as ViewStyle,
  cardIconWrap:   { marginBottom: 5 }                            as ViewStyle,
  featureIcon:    { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  cardLabel:      {
    fontFamily: FONTS.bodyMedium, fontSize: fs(10),
    lineHeight: lh(10, 1.35),
    letterSpacing: 0.14, fontWeight: '500', marginBottom: 5,
  }                                                              as TextStyle,
  cardValueRow:   { flexDirection: 'row', alignItems: 'baseline', gap: 3 } as ViewStyle,
  cardValue:      { fontFamily: FONTS.displayLight, fontSize: fs(24), fontWeight: '300', lineHeight: lh(24) } as TextStyle,
  cardUnit:       { fontFamily: FONTS.bodyMedium, fontSize: fs(11), fontWeight: '500', lineHeight: lh(11) } as TextStyle,
  cardSub:        { fontFamily: FONTS.bodyRegular, fontSize: fs(12), lineHeight: lh(12, 1.35), marginTop: 3 } as TextStyle,
  // Goal row
  goalRow:        {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderRadius: RADIUS.lg, padding: SPACING.md,
  }                                                              as ViewStyle,
  goalEyebrow:    {
    fontFamily: FONTS.bodyMedium, fontSize: fs(10),
    lineHeight: lh(10, 1.35),
    letterSpacing: 0.14, fontWeight: '500', marginBottom: 4,
  }                                                              as TextStyle,
  goalValueRow:   { flexDirection: 'row', alignItems: 'baseline' } as ViewStyle,
  goalValue:      { fontFamily: FONTS.displayLight, fontSize: fs(28), fontWeight: '300', lineHeight: lh(28) } as TextStyle,
  goalUnit:       { fontFamily: FONTS.bodyMedium, fontSize: fs(14), fontWeight: '500', lineHeight: lh(14) } as TextStyle,
  goalSub:        { fontFamily: FONTS.bodyRegular, fontSize: fs(13), lineHeight: lh(13, 1.35) } as TextStyle,
  disclaimerRow:  {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    marginTop: SPACING.sm + 4, paddingHorizontal: 4,
  }                                                              as ViewStyle,
  disclaimerText: {
    fontFamily: FONTS.bodyRegular, fontSize: fs(11), lineHeight: lh(11, 1.35), flex: 1,
  }                                                              as TextStyle,
});
