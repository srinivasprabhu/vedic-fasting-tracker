// StepSafety — combined safety screening: pregnancy, eating disorders, medications
import React, { useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Shield, AlertTriangle, Brain, Pill, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS, fs, lh } from '@/constants/theme';
import type { SafetyFlags, UserSex } from '@/types/user';

interface Props {
  value:    SafetyFlags;
  onChange: (flags: SafetyFlags) => void;
  sex:      UserSex | null;
}

// ─── Toggle row ───────────────────────────────────────────────────────────────

const ToggleRow: React.FC<{
  Icon:    typeof Shield;
  label:   string;
  desc:    string;
  active:  boolean;
  onPress: () => void;
  isDark:  boolean;
  accent?: string;
}> = ({ Icon, label, desc, active, onPress, isDark, accent }) => {
  const gold  = accent ?? (isDark ? '#e8a84c' : '#a06820');
  const cream = isDark ? '#f0e0c0' : '#1e1004';
  const warn  = isDark ? '#D46060' : '#c05050';

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      style={[s.card, {
        backgroundColor: active
          ? (isDark ? 'rgba(212,96,96,.08)' : 'rgba(212,96,96,.06)')
          : (isDark ? 'rgba(200,135,42,.04)' : 'rgba(255,255,255,.65)'),
        borderColor: active
          ? (isDark ? 'rgba(212,96,96,.35)' : 'rgba(212,96,96,.3)')
          : (isDark ? 'rgba(200,135,42,.12)' : 'rgba(200,135,42,.18)'),
      }]}
    >
      <View style={[s.iconCircle, { backgroundColor: active ? 'rgba(212,96,96,.12)' : (isDark ? 'rgba(200,135,42,.08)' : 'rgba(200,135,42,.06)') }]}>
        <Icon size={16} color={active ? warn : gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.cardName, { color: active ? warn : cream }]}>{label}</Text>
        <Text style={[s.cardDesc, { color: isDark ? 'rgba(240,224,192,.38)' : 'rgba(60,35,10,.42)' }]}>
          {desc}
        </Text>
      </View>
      <View style={[
        s.toggle,
        {
          backgroundColor: active
            ? (isDark ? 'rgba(212,96,96,.25)' : 'rgba(212,96,96,.2)')
            : (isDark ? 'rgba(200,135,42,.08)' : 'rgba(200,135,42,.08)'),
          borderColor: active
            ? (isDark ? 'rgba(212,96,96,.5)' : 'rgba(212,96,96,.45)')
            : (isDark ? 'rgba(200,135,42,.2)' : 'rgba(200,135,42,.25)'),
        },
      ]}>
        <Text style={[s.toggleText, { color: active ? warn : (isDark ? 'rgba(240,224,192,.35)' : 'rgba(60,35,10,.3)') }]}>
          {active ? 'Yes' : 'No'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Disclaimer banner ────────────────────────────────────────────────────────

const DisclaimerBanner: React.FC<{ message: string; isDark: boolean }> = ({ message, isDark }) => {
  const opac = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opac, { toValue: 1, duration: 340, useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[
      s.disclaimer,
      {
        opacity: opac,
        transform: [{ translateY: slideY }],
        backgroundColor: isDark ? 'rgba(212,96,96,.08)' : 'rgba(212,96,96,.06)',
        borderColor: isDark ? 'rgba(212,96,96,.25)' : 'rgba(212,96,96,.22)',
      },
    ]}>
      <View style={{ marginTop: 1 }}>
        <ShieldCheck size={16} color={isDark ? 'rgba(212,96,96,.6)' : 'rgba(212,96,96,.55)'} />
      </View>
      <Text style={[s.disclaimerText, { color: isDark ? 'rgba(240,224,192,.6)' : 'rgba(60,35,10,.6)' }]}>
        {message}
      </Text>
    </Animated.View>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const StepSafety: React.FC<Props> = ({ value, onChange, sex }) => {
  const { isDark } = useTheme();
  const opac  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opac,  { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const cream    = isDark ? '#f0e0c0' : '#1e1004';
  const mutedSub = isDark ? 'rgba(240,224,192,.42)' : 'rgba(60,35,10,.48)';
  const goldLt   = isDark ? '#e8a84c' : '#a06820';

  const toggle = useCallback((key: keyof SafetyFlags) => {
    onChange({ ...value, [key]: !value[key] });
  }, [value, onChange]);

  const showFemaleQuestions = sex === 'female';
  const hasAnyFlag = value.pregnant || value.breastfeeding || value.eatingDisorder || value.fastingMedications;

  return (
    <Animated.View style={{ opacity: opac, transform: [{ translateY: slide }], paddingTop: SPACING.xl }}>
      <View style={[s.iconWrap, {
        backgroundColor: 'rgba(200,135,42,.1)',
        borderColor: isDark ? 'rgba(200,135,42,.2)' : 'rgba(200,135,42,.28)',
      }]}>
        <Shield size={20} color={goldLt} />
      </View>

      <Text style={[s.heading, { color: cream }]}>
        Keeping you{'\n'}<Text style={[s.accent, { color: goldLt }]}>safe</Text>
      </Text>
      <Text style={[s.sub, { color: mutedSub }]}>
        A few quick checks so we can personalise your plan{'\n'}
        safely. Tap any that apply to you.
      </Text>

      <View style={s.list}>
        {showFemaleQuestions && (
          <>
            <ToggleRow
              Icon={AlertTriangle}
              label="I'm currently pregnant"
              desc="Fasting isn't recommended during pregnancy"
              active={!!value.pregnant}
              onPress={() => toggle('pregnant')}
              isDark={isDark}
            />
            <ToggleRow
              Icon={AlertTriangle}
              label="I'm currently breastfeeding"
              desc="Your body needs extra calories right now"
              active={!!value.breastfeeding}
              onPress={() => toggle('breastfeeding')}
              isDark={isDark}
            />
          </>
        )}

        <ToggleRow
          Icon={Brain}
          label="History of disordered eating"
          desc="Fasting can sometimes trigger unhealthy patterns"
          active={!!value.eatingDisorder}
          onPress={() => toggle('eatingDisorder')}
          isDark={isDark}
        />
        <ToggleRow
          Icon={Pill}
          label="On diabetes or blood pressure medication"
          desc="Fasting may affect how your medication works"
          active={!!value.fastingMedications}
          onPress={() => toggle('fastingMedications')}
          isDark={isDark}
        />
      </View>

      {(value.pregnant || value.breastfeeding) && (
        <DisclaimerBanner
          message="We recommend consulting your doctor before starting any fasting plan during pregnancy or breastfeeding. Your plan will be adjusted to a gentle schedule."
          isDark={isDark}
        />
      )}
      {value.eatingDisorder && !(value.pregnant || value.breastfeeding) && (
        <DisclaimerBanner
          message="We care about your wellbeing. Please consider speaking with a healthcare provider before starting a fasting routine. We'll keep your plan gentle and flexible."
          isDark={isDark}
        />
      )}
      {value.fastingMedications && !value.eatingDisorder && !(value.pregnant || value.breastfeeding) && (
        <DisclaimerBanner
          message="Fasting can interact with certain medications. Please consult your doctor before starting, especially if you take insulin or blood pressure drugs."
          isDark={isDark}
        />
      )}

      {!hasAnyFlag && (
        <Text style={[s.noneNote, { color: isDark ? 'rgba(122,174,121,.5)' : 'rgba(24,112,64,.5)' }]}>
          None of these apply? Great — you're all set to continue!
        </Text>
      )}
    </Animated.View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  iconWrap:       { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: SPACING.lg } as ViewStyle,
  heading:        { fontFamily: FONTS.displayLight, fontSize: fs(36), lineHeight: lh(36), letterSpacing: .2, marginBottom: SPACING.xs } as TextStyle,
  accent:         { fontFamily: FONTS.displayItalic, fontSize: fs(36), lineHeight: lh(36) } as TextStyle,
  sub:            { fontFamily: FONTS.bodyRegular, fontSize: fs(13), lineHeight: lh(13, 1.35), marginBottom: SPACING.xl } as TextStyle,
  list:           { gap: SPACING.sm } as ViewStyle,
  card:           { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, padding: 12, borderRadius: RADIUS.lg, borderWidth: 1.5 } as ViewStyle,
  iconCircle:     { width: 36, height: 36, borderRadius: 18, alignItems: 'center' as const, justifyContent: 'center' as const, flexShrink: 0 } as ViewStyle,
  cardName:       { fontFamily: FONTS.bodyMedium, fontSize: fs(14), fontWeight: '600' as const, marginBottom: 1 } as TextStyle,
  cardDesc:       { fontFamily: FONTS.bodyRegular, fontSize: fs(12), lineHeight: lh(12, 1.35) } as TextStyle,
  toggle:         { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, borderWidth: 1, flexShrink: 0 } as ViewStyle,
  toggleText:     { fontFamily: FONTS.bodyMedium, fontSize: fs(11), fontWeight: '600' as const } as TextStyle,
  disclaimer:     { flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 10, padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, marginTop: SPACING.md } as ViewStyle,
  disclaimerText: { fontFamily: FONTS.bodyRegular, fontSize: fs(13), lineHeight: lh(13, 1.35), flex: 1 } as TextStyle,
  noneNote:       { fontFamily: FONTS.bodyRegular, fontSize: fs(13), textAlign: 'center' as const, marginTop: SPACING.lg } as TextStyle,
});
