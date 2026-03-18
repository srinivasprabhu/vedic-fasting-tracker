import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Animated, Easing, ViewStyle, TextStyle, Platform,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS } from '@/constants/theme';
import type { UserSex, FastingPurpose, WeightUnit } from '@/types/user';
import { calcBMI, getBMICategory, bmiCategoryLabel, bmiCategoryColor } from '@/utils/calculatePlan';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BodyMetrics {
  sex:             UserSex | null;
  heightCm:        string;   // string for input field
  currentWeightKg: string;   // string for input field
  goalWeightKg:    string;   // string for input field
  weightUnit:      WeightUnit;
  fastingPurpose:  FastingPurpose | null;
}

interface Step5BodyProps {
  value:    BodyMetrics;
  onChange: (metrics: BodyMetrics) => void;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const SEX_OPTIONS: { id: UserSex; label: string; emoji: string }[] = [
  { id: 'male',             label: 'Male',       emoji: '♂' },
  { id: 'female',           label: 'Female',     emoji: '♀' },
  { id: 'prefer_not_to_say', label: 'Prefer not', emoji: '◎' },
];

const PURPOSE_OPTIONS: {
  id: FastingPurpose; label: string; emoji: string; desc: string;
}[] = [
  { id: 'weight_loss', label: 'Lose weight',       emoji: '⚖️', desc: 'Calorie deficit + fat burning' },
  { id: 'energy',      label: 'Energy & focus',    emoji: '⚡', desc: 'Mental clarity, sustained energy' },
  { id: 'metabolic',   label: 'Metabolic health',  emoji: '🩸', desc: 'Blood sugar, insulin sensitivity' },
  { id: 'spiritual',   label: 'Spiritual practice', emoji: '🪔', desc: 'Vedic fasting, Ekadashi calendar' },
];

// ─── Small animated input field ───────────────────────────────────────────────

const MetricInput: React.FC<{
  label:       string;
  value:       string;
  onChange:    (v: string) => void;
  unit:        string;
  placeholder: string;
  isDark:      boolean;
  delay?:      number;
}> = ({ label, value, onChange, unit, placeholder, isDark, delay = 0 }) => {
  const focusAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(10)).current;
  const opacAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacAnim,  { toValue: 1, duration: 360, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 360, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isDark
      ? ['rgba(200,135,42,0.2)', 'rgba(200,135,42,0.7)']
      : ['rgba(200,135,42,0.25)', 'rgba(200,135,42,0.72)'],
  });
  const bgColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isDark
      ? ['rgba(200,135,42,0.04)', 'rgba(200,135,42,0.09)']
      : ['rgba(255,255,255,0.7)',  'rgba(255,255,255,0.95)'],
  });

  const cream    = isDark ? '#f0e0c0' : '#1e1004';
  const mutedLbl = isDark ? 'rgba(200,135,42,0.5)' : 'rgba(160,104,32,0.6)';
  const unitClr  = isDark ? '#7a6040' : '#7a5028';

  return (
    <Animated.View style={{ opacity: opacAnim, transform: [{ translateY: slideAnim }], flex: 1 }}>
      <Animated.View style={[
        iStyles.inputCard,
        { borderColor, backgroundColor: bgColor },
      ]}>
        <Text style={[iStyles.label, { color: mutedLbl }]}>{label}</Text>
        <View style={iStyles.row}>
          <TextInput
            value={value}
            onChangeText={onChange}
            keyboardType="decimal-pad"
            placeholder={placeholder}
            placeholderTextColor={isDark ? 'rgba(200,135,42,0.22)' : 'rgba(160,104,32,0.28)'}
            style={[iStyles.input, { color: cream }]}
            onFocus={() => Animated.timing(focusAnim, { toValue: 1, duration: 220, useNativeDriver: false }).start()}
            onBlur={() => Animated.timing(focusAnim, { toValue: 0, duration: 220, useNativeDriver: false }).start()}
          />
          <Text style={[iStyles.unit, { color: unitClr }]}>{unit}</Text>
        </View>
        <View style={[iStyles.underline, { backgroundColor: isDark ? 'rgba(200,135,42,0.4)' : 'rgba(200,135,42,0.38)' }]} />
      </Animated.View>
    </Animated.View>
  );
};

const iStyles = StyleSheet.create({
  inputCard:  {
    borderWidth: 1.5, borderRadius: RADIUS.lg,
    padding: SPACING.sm + 2, paddingTop: SPACING.sm,
  }                                                              as ViewStyle,
  label:      {
    fontFamily: FONTS.bodyMedium, fontSize: 8,
    letterSpacing: 0.15, fontWeight: '500', marginBottom: 5,
  }                                                              as TextStyle,
  row:        { flexDirection: 'row', alignItems: 'baseline', gap: 4 } as ViewStyle,
  input:      {
    flex: 1, fontFamily: FONTS.displayLight,
    fontSize: 26, lineHeight: 30, padding: 0,
  }                                                              as TextStyle,
  unit:       {
    fontFamily: FONTS.bodyMedium, fontSize: 13, fontWeight: '500',
  }                                                              as TextStyle,
  underline:  { height: 1.5, borderRadius: 1, marginTop: 6 }   as ViewStyle,
});

// ─── Main Step5Body ───────────────────────────────────────────────────────────

export const Step5Body: React.FC<Step5BodyProps> = ({ value, onChange }) => {
  const { isDark } = useTheme();

  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconScale   = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(iconOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(iconScale,   { toValue: 1, speed: 12, bounciness: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  const cream     = isDark ? '#f0e0c0' : '#1e1004';
  const goldLight = isDark ? '#e8a84c' : '#a06820';
  const mutedSub  = isDark ? 'rgba(240,224,192,0.42)' : 'rgba(60,35,10,0.48)';
  const mutedLbl  = isDark ? 'rgba(200,135,42,0.48)' : 'rgba(160,104,32,0.55)';

  // Live BMI preview
  const bmi = (() => {
    const kg = parseFloat(value.weightUnit === 'lbs'
      ? String(parseFloat(value.currentWeightKg || '0') / 2.20462)
      : value.currentWeightKg);
    const cm = parseFloat(value.heightCm);
    if (!kg || !cm || cm < 50) return null;
    return calcBMI(kg, cm);
  })();
  const bmiCat   = bmi ? getBMICategory(bmi) : null;
  const bmiLabel = bmi ? bmiCategoryLabel(bmiCat) : null;
  const bmiColor = bmiCategoryColor(bmiCat, isDark);

  const unitLabel = value.weightUnit === 'lbs' ? 'lbs' : 'kg';

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: SPACING.lg, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Icon */}
      <Animated.View style={[
        styles.iconWrap,
        {
          opacity: iconOpacity,
          transform: [{ scale: iconScale }],
          backgroundColor: 'rgba(200,135,42,0.1)',
          borderColor: isDark ? 'rgba(200,135,42,0.2)' : 'rgba(200,135,42,0.28)',
        },
      ]}>
        <Text style={styles.iconEmoji}>⚖️</Text>
      </Animated.View>

      <Text style={[styles.heading, { color: cream }]}>
        Your body{'\n'}
        <Text style={[styles.headingAccent, { color: goldLight }]}>metrics</Text>
      </Text>
      <Text style={[styles.subheading, { color: mutedSub }]}>
        Powers your personalised plan — stored privately on your device
      </Text>

      {/* ── Sex ── */}
      <Text style={[styles.sectionLabel, { color: mutedLbl }]}>BIOLOGICAL SEX</Text>
      <View style={styles.sexRow}>
        {SEX_OPTIONS.map((opt, i) => {
          const selected = value.sex === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => onChange({ ...value, sex: opt.id })}
              activeOpacity={0.8}
              style={[
                styles.sexBtn,
                {
                  backgroundColor: selected
                    ? isDark ? 'rgba(200,135,42,0.18)' : 'rgba(200,135,42,0.14)'
                    : isDark ? 'rgba(200,135,42,0.05)' : 'rgba(255,255,255,0.65)',
                  borderColor: selected
                    ? isDark ? 'rgba(200,135,42,0.65)' : 'rgba(200,135,42,0.6)'
                    : isDark ? 'rgba(200,135,42,0.15)' : 'rgba(200,135,42,0.2)',
                },
              ]}
            >
              <Text style={styles.sexEmoji}>{opt.emoji}</Text>
              <Text style={[
                styles.sexLabel,
                { color: selected ? goldLight : isDark ? '#e8d5b0' : '#3a2010' },
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Height & Weight unit toggle ── */}
      <View style={styles.rowBetween}>
        <Text style={[styles.sectionLabel, { color: mutedLbl }]}>HEIGHT & WEIGHT</Text>
        <View style={[
          styles.unitToggle,
          {
            backgroundColor: isDark ? 'rgba(200,135,42,0.06)' : 'rgba(200,135,42,0.07)',
            borderColor: isDark ? 'rgba(200,135,42,0.18)' : 'rgba(200,135,42,0.22)',
          },
        ]}>
          {(['kg', 'lbs'] as WeightUnit[]).map((u) => (
            <TouchableOpacity
              key={u}
              onPress={() => onChange({ ...value, weightUnit: u })}
              style={[
                styles.unitBtn,
                value.weightUnit === u && {
                  backgroundColor: isDark ? 'rgba(200,135,42,0.18)' : 'rgba(200,135,42,0.16)',
                },
              ]}
            >
              <Text style={[
                styles.unitBtnText,
                {
                  color: value.weightUnit === u
                    ? goldLight
                    : isDark ? '#7a6040' : '#7a5028',
                  fontWeight: value.weightUnit === u ? '600' : '400',
                },
              ]}>
                {u}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Height / Current weight ── */}
      <View style={styles.inputRow}>
        <MetricInput
          label="HEIGHT"
          value={value.heightCm}
          onChange={(v) => onChange({ ...value, heightCm: v })}
          unit="cm"
          placeholder="175"
          isDark={isDark}
          delay={80}
        />
        <View style={{ width: SPACING.sm }} />
        <MetricInput
          label="CURRENT WEIGHT"
          value={value.currentWeightKg}
          onChange={(v) => onChange({ ...value, currentWeightKg: v })}
          unit={unitLabel}
          placeholder={value.weightUnit === 'lbs' ? '165' : '74'}
          isDark={isDark}
          delay={130}
        />
      </View>

      {/* ── Goal weight ── */}
      <View style={[styles.inputRow, { marginTop: SPACING.sm }]}>
        <MetricInput
          label="GOAL WEIGHT"
          value={value.goalWeightKg}
          onChange={(v) => onChange({ ...value, goalWeightKg: v })}
          unit={unitLabel}
          placeholder={value.weightUnit === 'lbs' ? '145' : '70'}
          isDark={isDark}
          delay={180}
        />
        {/* BMI live preview */}
        <View style={{ width: SPACING.sm }} />
        <View style={[
          styles.bmiPreview,
          {
            backgroundColor: isDark ? 'rgba(200,135,42,0.05)' : 'rgba(255,255,255,0.65)',
            borderColor: isDark ? 'rgba(200,135,42,0.15)' : 'rgba(200,135,42,0.2)',
          },
        ]}>
          <Text style={[styles.bmiLabel, { color: mutedLbl }]}>BMI</Text>
          {bmi ? (
            <>
              <Text style={[styles.bmiValue, { color: cream }]}>{bmi}</Text>
              <Text style={[styles.bmiCat, { color: bmiColor }]}>{bmiLabel}</Text>
            </>
          ) : (
            <Text style={[styles.bmiEmpty, { color: isDark ? 'rgba(200,135,42,0.22)' : 'rgba(160,104,32,0.28)' }]}>
              —
            </Text>
          )}
        </View>
      </View>

      {/* ── Purpose ── */}
      <Text style={[styles.sectionLabel, { color: mutedLbl, marginTop: SPACING.lg }]}>
        YOUR MAIN GOAL
      </Text>
      <View style={styles.purposeGrid}>
        {PURPOSE_OPTIONS.map((opt) => {
          const selected = value.fastingPurpose === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => onChange({ ...value, fastingPurpose: opt.id })}
              activeOpacity={0.8}
              style={[
                styles.purposeCard,
                {
                  backgroundColor: selected
                    ? isDark ? 'rgba(200,135,42,0.14)' : 'rgba(200,135,42,0.1)'
                    : isDark ? 'rgba(200,135,42,0.04)' : 'rgba(255,255,255,0.65)',
                  borderColor: selected
                    ? isDark ? 'rgba(200,135,42,0.58)' : 'rgba(200,135,42,0.52)'
                    : isDark ? 'rgba(200,135,42,0.12)' : 'rgba(200,135,42,0.18)',
                },
              ]}
            >
              {selected && (
                <View style={[styles.purposeCheck, { backgroundColor: isDark ? '#c8872a' : '#b07020' }]}>
                  <Text style={styles.purposeCheckText}>✓</Text>
                </View>
              )}
              <Text style={styles.purposeEmoji}>{opt.emoji}</Text>
              <Text style={[
                styles.purposeName,
                { color: selected ? goldLight : cream },
              ]}>
                {opt.label}
              </Text>
              <Text style={[
                styles.purposeDesc,
                { color: isDark ? 'rgba(240,224,192,0.35)' : 'rgba(60,35,10,0.42)' },
              ]}>
                {opt.desc}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  iconWrap:       {
    width: 50, height: 50, borderRadius: 25, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg,
  }                                                              as ViewStyle,
  iconEmoji:      { fontSize: 20 }                               as TextStyle,
  heading:        {
    fontFamily: FONTS.displayLight, fontSize: 38,
    lineHeight: 44, letterSpacing: 0.2, marginBottom: SPACING.xs,
  }                                                              as TextStyle,
  headingAccent:  { fontFamily: FONTS.displayItalic, fontSize: 38 } as TextStyle,
  subheading:     {
    fontFamily: FONTS.bodyRegular, fontSize: 13,
    lineHeight: 21, marginBottom: SPACING.xl,
  }                                                              as TextStyle,
  sectionLabel:   {
    fontFamily: FONTS.bodyMedium, fontSize: 8,
    letterSpacing: 0.16, fontWeight: '500',
    marginBottom: SPACING.sm,
  }                                                              as TextStyle,
  // Sex
  sexRow:         { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg } as ViewStyle,
  sexBtn:         {
    flex: 1, borderWidth: 1.5, borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2, alignItems: 'center', gap: 4,
  }                                                              as ViewStyle,
  sexEmoji:       { fontSize: 18 }                               as TextStyle,
  sexLabel:       {
    fontFamily: FONTS.bodyMedium, fontSize: 10, fontWeight: '500',
  }                                                              as TextStyle,
  // Unit toggle
  rowBetween:     {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: SPACING.sm,
  }                                                              as ViewStyle,
  unitToggle:     {
    flexDirection: 'row', borderRadius: RADIUS.md,
    overflow: 'hidden', borderWidth: 1,
  }                                                              as ViewStyle,
  unitBtn:        { paddingHorizontal: 12, paddingVertical: 5 } as ViewStyle,
  unitBtnText:    { fontFamily: FONTS.bodyMedium, fontSize: 11 } as TextStyle,
  // Inputs
  inputRow:       { flexDirection: 'row', gap: SPACING.sm, marginBottom: 0 } as ViewStyle,
  // BMI preview
  bmiPreview:     {
    flex: 1, borderWidth: 1.5, borderRadius: RADIUS.lg,
    padding: SPACING.sm + 2, paddingTop: SPACING.sm,
    alignItems: 'center', justifyContent: 'center',
  }                                                              as ViewStyle,
  bmiLabel:       {
    fontFamily: FONTS.bodyMedium, fontSize: 8,
    letterSpacing: 0.15, fontWeight: '500', marginBottom: 5,
    alignSelf: 'flex-start',
  }                                                              as TextStyle,
  bmiValue:       {
    fontFamily: FONTS.displayLight, fontSize: 26,
    fontWeight: '300', lineHeight: 30,
  }                                                              as TextStyle,
  bmiCat:         {
    fontFamily: FONTS.bodyMedium, fontSize: 10, fontWeight: '500',
    marginTop: 2,
  }                                                              as TextStyle,
  bmiEmpty:       {
    fontFamily: FONTS.displayLight, fontSize: 26, lineHeight: 30,
  }                                                              as TextStyle,
  // Purpose
  purposeGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm } as ViewStyle,
  purposeCard:    {
    width: '47.5%', borderWidth: 1.5, borderRadius: RADIUS.lg,
    padding: SPACING.sm + 2, position: 'relative', minHeight: 90,
  }                                                              as ViewStyle,
  purposeCheck:   {
    position: 'absolute', top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  }                                                              as ViewStyle,
  purposeCheckText: {
    fontFamily: FONTS.bodyMedium, fontSize: 9,
    fontWeight: '700', color: '#fff8ed',
  }                                                              as TextStyle,
  purposeEmoji:   { fontSize: 20, marginBottom: 5 }              as TextStyle,
  purposeName:    {
    fontFamily: FONTS.bodyMedium, fontSize: 12,
    fontWeight: '500', marginBottom: 3,
  }                                                              as TextStyle,
  purposeDesc:    {
    fontFamily: FONTS.bodyRegular, fontSize: 10, lineHeight: 14,
  }                                                              as TextStyle,
});
