// components/FastPlanPickerModal.tsx
// Bottom sheet modal for changing fasting plan — with Pro tier upsell.

import { fs } from '@/constants/theme';
import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, Animated, Easing, ViewStyle, TextStyle, Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { X, Lock, Check, AlertTriangle, Clock, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorScheme } from '@/constants/colors';
import { FastWindowStartPickerPanel } from '@/components/FastWindowStartSheet';
import { formatReminderTimeLabel } from '@/utils/fastingPlanSchedule';

// ─── Plan data ────────────────────────────────────────────────────────────────

export interface FastPlanOption {
  id:          string;
  label:       string;        // "16:8"
  fastHours:   number;
  eatHours:    number;
  desc:        string;
  isPro:       boolean;
  color:       string;        // card accent
}

export interface FastPlanCategory {
  title:    string;
  subtitle: string;
  plans:    FastPlanOption[];
}

const C_GREEN  = '#3aaa6e';
const C_GOLD   = '#D4A03C';
const C_ORANGE = '#E8913A';
const C_BLUE   = '#5b8dd9';
const C_PURPLE = '#7B68AE';

export const PLAN_CATEGORIES: FastPlanCategory[] = [
  {
    title: 'Beginner',
    subtitle: 'Best for: Getting started',
    plans: [
      { id: 'if_12_12', label: '12:12', fastHours: 12, eatHours: 12, desc: '12 hour fast with 12 hour eating window.', isPro: false, color: C_GREEN },
      { id: 'if_13_11', label: '13:11', fastHours: 13, eatHours: 11, desc: '13 hour fast with 11 hour eating window.', isPro: false, color: C_GREEN },
      { id: 'if_14_10', label: '14:10', fastHours: 14, eatHours: 10, desc: '14 hour fast with 10 hour eating window.', isPro: false, color: C_GREEN },
    ],
  },
  {
    title: 'Regular',
    subtitle: 'Best for: Full health benefits',
    plans: [
      { id: 'if_16_8',  label: '16:8',  fastHours: 16, eatHours: 8,  desc: '16 hour fast with 8 hour eating window.', isPro: false, color: C_GOLD },
      { id: 'if_17_7',  label: '17:7',  fastHours: 17, eatHours: 7,  desc: '17 hour fast with 7 hour eating window.', isPro: false, color: C_GOLD },
      { id: 'if_18_6',  label: '18:6',  fastHours: 18, eatHours: 6,  desc: '18 hour fast with 6 hour eating window.', isPro: false, color: C_GOLD },
    ],
  },
  {
    title: 'Advanced',
    subtitle: 'Best for: Deep autophagy',
    plans: [
      { id: 'if_20_4',  label: '20:4',  fastHours: 20, eatHours: 4,  desc: '20 hour fast with 4 hour eating window.',  isPro: true, color: C_ORANGE },
      { id: 'if_21_3',  label: '21:3',  fastHours: 21, eatHours: 3,  desc: '21 hour fast with 3 hour eating window.',  isPro: true, color: C_ORANGE },
      { id: 'if_22_2',  label: '22:2',  fastHours: 22, eatHours: 2,  desc: '22 hour fast with 2 hour eating window.',  isPro: true, color: C_ORANGE },
    ],
  },
  {
    title: 'Weekly Schedules',
    subtitle: 'Best for: Flexibility through the week',
    plans: [
      { id: 'if_5_2',   label: '5:2',     fastHours: 24, eatHours: 0,  desc: '5 days eating, 2 days fasting per week.', isPro: true, color: C_BLUE },
      { id: 'if_4_3',   label: '4:3',     fastHours: 24, eatHours: 0,  desc: '4 days eating, 3 days fasting per week.', isPro: true, color: C_BLUE },
    ],
  },
  {
    title: 'Long Fasts',
    subtitle: 'Best for: Challenging yourself',
    plans: [
      { id: 'if_omad',  label: 'OMAD',   fastHours: 23, eatHours: 1, desc: 'One meal a day. 23 hour fast.', isPro: true, color: C_PURPLE },
      { id: 'if_36',    label: '36h',     fastHours: 36, eatHours: 0, desc: 'A one time fast, longer than 24 hours.', isPro: true, color: C_PURPLE },
    ],
  },
];

// ─── Plan card ────────────────────────────────────────────────────────────────

const PlanCard: React.FC<{
  plan:       FastPlanOption;
  selected:   boolean;
  isProUser:  boolean;
  onSelect:   () => void;
  colors:     ColorScheme;
  isDark:     boolean;
  restricted?: boolean;  // safety-restricted (age/BMI)
}> = ({ plan, selected, isProUser, onSelect, colors, isDark, restricted }) => {
  const locked = plan.isPro && !isProUser;
  const blocked = restricted || false;  // can't select even if Pro
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const pressIn  = () => Animated.spring(scaleAnim, { toValue: 0.96, speed: 30, bounciness: 3, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scaleAnim, { toValue: 1, speed: 22, bounciness: 4, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1, minWidth: '46%' }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSelect();
        }}
        style={[
          s.planCard,
          {
            backgroundColor: (locked || blocked)
              ? (isDark ? 'rgba(200,135,42,.06)' : 'rgba(200,135,42,.04)')
              : `${plan.color}${isDark ? '18' : '12'}`,
            borderColor: selected
              ? plan.color
              : (locked || blocked)
                ? (isDark ? 'rgba(200,135,42,.12)' : 'rgba(200,135,42,.15)')
                : `${plan.color}40`,
            opacity: (locked || blocked) ? 0.55 : 1,
          },
        ]}
      >
        {/* Selected check */}
        {selected && (
          <View style={[s.checkBadge, { backgroundColor: plan.color }]}>
            <Check size={12} color="#fff" strokeWidth={3} />
          </View>
        )}

        {/* Pro badge or safety badge */}
        {blocked ? (
          <View style={[s.proBadge, { backgroundColor: isDark ? 'rgba(212,96,96,.8)' : '#c05050' }]}>
            <AlertTriangle size={12} color="#fff" />
          </View>
        ) : plan.isPro ? (
          <View style={[s.proBadge, { backgroundColor: isDark ? 'rgba(232,168,76,.9)' : '#E8913A' }]}>
            <Text style={s.proBadgeText}>PRO</Text>
          </View>
        ) : null}

        {/* Plan label */}
        <Text style={[
          s.planLabel,
          { color: (locked || blocked) ? colors.textMuted : (isDark ? '#fff' : '#1a0d04') },
        ]}>
          {plan.label}
        </Text>

        {/* Description */}
        <Text style={[
          s.planDesc,
          { color: (locked || blocked) ? colors.textMuted : (isDark ? 'rgba(255,255,255,.65)' : 'rgba(26,13,4,.55)') },
        ]}>
          {plan.desc}
        </Text>

        {/* Lock icon */}
        {(locked || blocked) && (
          <View style={s.lockWrap}>
            <Lock size={14} color={colors.textMuted} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Pro upsell banner ────────────────────────────────────────────────────────

const ProUpsellBanner: React.FC<{ colors: ColorScheme; isDark: boolean; onPress: () => void }> = ({ colors, isDark, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={onPress}
    style={[s.upsellBanner, {
      backgroundColor: isDark ? 'rgba(232,168,76,.1)' : 'rgba(232,168,76,.08)',
      borderColor: isDark ? 'rgba(232,168,76,.3)' : 'rgba(232,168,76,.25)',
    }]}
  >
    <Text style={s.upsellEmoji}>✦</Text>
    <View style={{ flex: 1 }}>
      <Text style={[s.upsellTitle, { color: isDark ? '#e8a84c' : '#a06820' }]}>Unlock Aayu Pro</Text>
      <Text style={[s.upsellDesc, { color: colors.textMuted }]}>
        Access advanced plans, weekly schedules, and extended fasts
      </Text>
    </View>
    <Text style={[s.upsellArrow, { color: isDark ? '#e8a84c' : '#a06820' }]}>→</Text>
  </TouchableOpacity>
);

// ─── Main modal ───────────────────────────────────────────────────────────────

interface FastPlanPickerModalProps {
  visible:     boolean;
  currentPlan: string | null; // current plan label, e.g. "16:8"
  isProUser:   boolean;
  onSelect:    (plan: FastPlanOption) => void;
  onClose:     () => void;
  onUpgrade:   () => void;
  /** Max fast hours allowed (e.g. 14 for under-18). null = no limit. */
  maxFastHours?: number | null;
  /** Reason shown when a plan exceeds maxFastHours */
  restrictionReason?: string;
  /** Minutes from midnight when the fast usually starts (for time row + sheet). */
  fastWindowInitialMinutes?: number;
  /** Persist start time when user saves from the sheet (omit to hide the row). */
  onSaveFastWindowStart?: (minutesFromMidnight: number) => void;
}

export const FastPlanPickerModal: React.FC<FastPlanPickerModalProps> = ({
  visible, currentPlan, isProUser, onSelect, onClose, onUpgrade,
  maxFastHours = null, restrictionReason,
  fastWindowInitialMinutes = 19 * 60,
  onSaveFastWindowStart,
}) => {
  const { colors, isDark } = useTheme();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [showFastStartSheet, setShowFastStartSheet] = useState(false);
  const [liveFastStartMinutes, setLiveFastStartMinutes] = useState(fastWindowInitialMinutes);

  useEffect(() => {
    if (visible) setLiveFastStartMinutes(fastWindowInitialMinutes);
  }, [visible, fastWindowInitialMinutes]);

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(0);
      Animated.spring(slideAnim, { toValue: 1, tension: 65, friction: 11, useNativeDriver: true }).start();
    } else {
      setShowFastStartSheet(false);
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => onClose());
  }, [onClose, slideAnim]);

  const handleSelect = useCallback((plan: FastPlanOption) => {
    // Pro gate
    if (plan.isPro && !isProUser) {
      onUpgrade();
      return;
    }
    // Safety gate: max fast hours (e.g. under-18 or underweight)
    if (maxFastHours !== null && plan.fastHours > maxFastHours) {
      // Blocked — do nothing (card shows as restricted)
      return;
    }
    onSelect(plan);
    handleClose();
  }, [isProUser, maxFastHours, onSelect, onUpgrade, handleClose]);

  // Find selected plan id from label
  const selectedId = useMemo(() => {
    if (!currentPlan) return null;
    for (const cat of PLAN_CATEGORIES) {
      const found = cat.plans.find(p => p.label === currentPlan || p.id === currentPlan);
      if (found) return found.id;
    }
    // Try matching by fastHours from the label (e.g. "16:8" → 16)
    const match = currentPlan.match(/^(\d+):(\d+)$/);
    if (match) {
      const fast = parseInt(match[1], 10);
      const eat  = parseInt(match[2], 10);
      for (const cat of PLAN_CATEGORIES) {
        const found = cat.plans.find(p => p.fastHours === fast && p.eatHours === eat);
        if (found) return found.id;
      }
    }
    return null;
  }, [currentPlan]);

  const screenH = Dimensions.get('window').height;
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [screenH, 0],
  });

  const startLabel = formatReminderTimeLabel(
    Math.floor(liveFastStartMinutes / 60),
    liveFastStartMinutes % 60,
  );

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={s.overlay}>
        <TouchableOpacity style={s.overlayBg} activeOpacity={1} onPress={handleClose} />

        <Animated.View style={[
          s.sheet,
          {
            transform: [{ translateY }],
            backgroundColor: colors.background,
          },
        ]}>
          {/* Handle */}
          <View style={[s.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={s.header}>
            <View>
              <Text style={[s.title, { color: colors.text }]}>Fasting plans</Text>
              <Text style={[s.subtitle, { color: colors.textSecondary }]}>Choose your preferred fasting schedule</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={[s.closeBtn, { backgroundColor: colors.surface }]}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {onSaveFastWindowStart ? (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowFastStartSheet(true);
              }}
              style={[
                s.fastStartRow,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)',
                  borderColor: colors.borderLight,
                },
              ]}
              accessibilityLabel={`Fast starts at ${startLabel}, change start time`}
            >
              <View style={[s.fastStartIcon, { backgroundColor: `${C_GOLD}22` }]}>
                <Clock size={16} color={C_GOLD} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[s.fastStartMeta, { color: colors.textMuted }]}>FAST STARTS</Text>
                <Text style={[s.fastStartValue, { color: colors.text }]}>{startLabel} · tap to change</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}

          {/* Plans */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scrollContent}
            bounces={false}
          >
            {/* Safety restriction banner */}
            {maxFastHours !== null && restrictionReason && (
              <View style={[s.restrictBanner, {
                backgroundColor: isDark ? 'rgba(212,96,96,.08)' : 'rgba(212,96,96,.06)',
                borderColor: isDark ? 'rgba(212,96,96,.25)' : 'rgba(212,96,96,.22)',
              }]}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(212,96,96,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={18} color={isDark ? '#e07b7b' : '#c05050'} />
                </View>
                <Text style={[s.restrictText, { color: isDark ? 'rgba(240,224,192,.65)' : 'rgba(60,35,10,.65)' }]}>
                  {restrictionReason}
                </Text>
              </View>
            )}

            {PLAN_CATEGORIES.map((cat, ci) => (
              <View key={cat.title} style={ci > 0 ? s.catGap : undefined}>
                <Text style={[s.catTitle, { color: colors.text }]}>{cat.title}</Text>
                <Text style={[s.catSubtitle, { color: colors.textMuted }]}>{cat.subtitle}</Text>

                <View style={s.planRow}>
                  {cat.plans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      selected={selectedId === plan.id}
                      isProUser={isProUser}
                      onSelect={() => handleSelect(plan)}
                      colors={colors}
                      isDark={isDark}
                      restricted={maxFastHours !== null && plan.fastHours > maxFastHours}
                    />
                  ))}
                </View>
              </View>
            ))}

            {/* Pro upsell */}
            {!isProUser && (
              <ProUpsellBanner colors={colors} isDark={isDark} onPress={onUpgrade} />
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>

        {showFastStartSheet && onSaveFastWindowStart ? (
          <View style={s.timePickerLayer} pointerEvents="box-none">
            <TouchableOpacity
              style={s.timePickerScrim}
              activeOpacity={1}
              onPress={() => setShowFastStartSheet(false)}
              accessibilityLabel="Dismiss time picker"
            />
            <FastWindowStartPickerPanel
              colors={colors}
              isDark={isDark}
              initialMinutes={liveFastStartMinutes}
              onDismiss={() => setShowFastStartSheet(false)}
              onConfirm={(m) => {
                setLiveFastStartMinutes(m);
                onSaveFastWindowStart(m);
              }}
            />
          </View>
        ) : null}
      </View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  } as ViewStyle,

  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,.55)',
  } as ViewStyle,

  timePickerLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 24,
    justifyContent: 'flex-end',
  } as ViewStyle,

  timePickerScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  } as ViewStyle,

  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
  } as ViewStyle,

  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  } as ViewStyle,

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 18,
  } as ViewStyle,

  title: {
    fontSize: fs(24),
    fontWeight: '700',
    letterSpacing: -0.5,
  } as TextStyle,

  subtitle: {
    fontSize: fs(14),
    marginTop: 3,
  } as TextStyle,

  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  fastStartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  } as ViewStyle,

  fastStartIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  fastStartMeta: {
    fontSize: fs(10),
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 2,
  } as TextStyle,

  fastStartValue: {
    fontSize: fs(15),
    fontWeight: '600',
  } as TextStyle,

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  } as ViewStyle,

  catGap: {
    marginTop: 22,
  } as ViewStyle,

  catTitle: {
    fontSize: fs(16),
    fontWeight: '700',
    marginBottom: 3,
  } as TextStyle,

  catSubtitle: {
    fontSize: fs(13),
    marginBottom: 10,
  } as TextStyle,

  planRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  } as ViewStyle,

  planCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    minHeight: 100,
    position: 'relative',
  } as ViewStyle,

  planLabel: {
    fontSize: fs(28),
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 6,
  } as TextStyle,

  planDesc: {
    fontSize: fs(13),
    lineHeight: 18,
  } as TextStyle,

  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  proBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  } as ViewStyle,

  proBadgeText: {
    fontSize: fs(10),
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  } as TextStyle,

  lockWrap: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    opacity: 0.5,
  } as ViewStyle,

  upsellBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 24,
  } as ViewStyle,

  upsellEmoji: {
    fontSize: fs(22),
  } as TextStyle,

  upsellTitle: {
    fontSize: fs(15),
    fontWeight: '700',
    marginBottom: 2,
  } as TextStyle,

  upsellDesc: {
    fontSize: fs(12),
    lineHeight: 17,
  } as TextStyle,

  upsellArrow: {
    fontSize: fs(20),
    fontWeight: '300',
  } as TextStyle,

  restrictBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  } as ViewStyle,

  restrictText: {
    fontSize: fs(13),
    lineHeight: 19,
    flex: 1,
  } as TextStyle,
});
