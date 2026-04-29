// app/(tabs)/(home)/water.tsx
// Full water tracker screen — manual logging, ring progress, quick-add, log history.

import { fs } from '@/constants/theme';
import { useScrollToTop } from '@react-navigation/native';
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Trash2, Coffee, Droplet, Droplets, Check, Edit3, Sparkles } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { formatWater } from '@/utils/calculatePlan';
import type { ColorScheme } from '@/constants/colors';

// ─── Storage ──────────────────────────────────────────────────────────────────

const WATER_KEY = () => {
  const d = new Date();
  return `aayu_water_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
};

interface WaterEntry {
  id:    string;
  ml:    number;
  label: string;
  time:  number;
}

async function loadEntries(): Promise<WaterEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(WATER_KEY());
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveEntries(entries: WaterEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(WATER_KEY(), JSON.stringify(entries));
  } catch {}
}

// ─── Quick-add options ────────────────────────────────────────────────────────

const QUICK_ADD = [
  { ml: 150,  label: 'Cup' },
  { ml: 250,  label: 'Glass' },
  { ml: 500,  label: 'Bottle' },
  { ml: 750,  label: 'Large' },
];

// ─── Ring styles (module-level so WaterRing can reference them) ───────────────

const ringStyles = StyleSheet.create({
  ringVal:  { fontSize: fs(36), fontWeight: '700' as const, letterSpacing: -1 }   as TextStyle,
  ringUnit: { fontSize: fs(12), fontWeight: '500' as const, marginTop: 2 }        as TextStyle,
  ringGoal: { fontSize: fs(11), marginTop: 2 }                                     as TextStyle,
  ringPct:  { fontSize: fs(13), fontWeight: '600' as const, marginTop: 3 }        as TextStyle,
});

// ─── Ring component ───────────────────────────────────────────────────────────

const WaterRing: React.FC<{
  pct:     number;
  totalMl: number;
  goalMl:  number;
  colors:  ColorScheme;
}> = ({ pct, totalMl, goalMl, colors }) => {
  const SIZE    = 180;
  const STROKE  = 12;
  const R       = (SIZE - STROKE) / 2;
  const CIRCUMF = 2 * Math.PI * R;
  const fill    = CIRCUMF * Math.min(pct / 100, 1);

  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <Circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none" stroke={colors.surface} strokeWidth={STROKE}
          />
          <Circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none" stroke={colors.hydration} strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${fill} ${CIRCUMF}`}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={[ringStyles.ringVal, { color: colors.text }]}>
            {totalMl >= 1000 ? (totalMl / 1000).toFixed(1) : totalMl}
          </Text>
          <Text style={[ringStyles.ringUnit, { color: colors.textSecondary }]}>
            {totalMl >= 1000 ? 'litres' : 'ml'}
          </Text>
          <Text style={[ringStyles.ringGoal, { color: colors.hydration }]}>
            of {formatWater(goalMl)}
          </Text>
          <Text style={[ringStyles.ringPct, { color: colors.hydration }]}>
            {Math.round(pct)}%
          </Text>
        </View>
      </View>
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function WaterScreen() {
  const { colors, isDark } = useTheme();
  const { profile, updateDailyTarget } = useUserProfile();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const waterScrollRef = useRef<ScrollView>(null);
  useScrollToTop(waterScrollRef);

  const goalMl = profile?.plan?.dailyWaterMl ?? 2500;

  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTarget, setEditingTarget] = useState(false);

  useEffect(() => {
    loadEntries().then((e) => { setEntries(e); setLoading(false); });
  }, []);

  const totalMl = useMemo(() => entries.reduce((s, e) => s + e.ml, 0), [entries]);
  const pct     = goalMl > 0 ? (totalMl / goalMl) * 100 : 0;
  const leftMl  = Math.max(0, goalMl - totalMl);

  const addEntry = useCallback(async (ml: number, label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const entry: WaterEntry = {
      id:    `w_${Date.now()}`,
      ml,
      label,
      time:  Date.now(),
    };
    const updated = [entry, ...entries];
    setEntries(updated);
    await saveEntries(updated);
  }, [entries]);

  const deleteEntry = useCallback(async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    await saveEntries(updated);
  }, [entries]);

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const streak = pct >= 100 ? 1 : 0;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          ref={waterScrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            >
              <ChevronLeft size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Water Intake</Text>
          </View>

          {/* Ring */}
          <WaterRing pct={pct} totalMl={totalMl} goalMl={goalMl} colors={colors} />

          {/* Editable target */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEditingTarget(prev => !prev); }}
            style={[styles.targetPill, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
          >
            <Text style={[styles.targetLabel, { color: colors.textSecondary }]}>Daily target</Text>
            <Text style={[styles.targetValue, { color: colors.hydration }]}>{formatWater(goalMl)}</Text>
            {editingTarget ? <Check size={14} color={colors.hydration} /> : <Edit3 size={14} color={colors.textMuted} />}
          </TouchableOpacity>

          {editingTarget && (
            <View style={styles.targetPresets}>
              {[1500, 2000, 2500, 3000, 3500, 4000].map(ml => (
                <TouchableOpacity
                  key={ml}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Set daily water goal to ${formatWater(ml)}`}
                  accessibilityState={{ selected: ml === goalMl }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    updateDailyTarget('dailyWaterMl', ml);
                    setEditingTarget(false);
                  }}
                  style={[
                    styles.targetPresetBtn,
                    {
                      backgroundColor: ml === goalMl ? `${colors.hydration}26` : colors.card,
                      borderColor: ml === goalMl ? colors.hydration : colors.borderLight,
                    },
                  ]}
                >
                  <Text style={[
                    styles.targetPresetText,
                    { color: ml === goalMl ? colors.hydration : colors.text, fontWeight: ml === goalMl ? '700' : '500' },
                  ]}>
                    {formatWater(ml)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Stats row */}
          <View style={styles.statsRow}>
            {[
              { val: formatWater(leftMl), lbl: 'remaining' },
              { val: String(entries.length), lbl: 'glasses' },
              { val: `${streak}d`, lbl: 'streak' },
            ].map(({ val, lbl }) => (
              <View key={lbl} style={[styles.statBox, { backgroundColor: `${colors.hydration}18`, borderColor: `${colors.hydration}30` }]}>
                <Text style={[styles.statVal, { color: colors.hydration }]}>{val}</Text>
                <Text style={[styles.statLbl, { color: `${colors.hydration}99` }]}>
                  {lbl}
                </Text>
              </View>
            ))}
          </View>

          {/* Quick add */}
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>QUICK ADD</Text>
          <View style={styles.quickRow}>
            {QUICK_ADD.map((opt) => (
              <TouchableOpacity
                key={opt.ml}
                onPress={() => addEntry(opt.ml, opt.label)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`Add ${opt.ml} milliliters of water (${opt.label})`}
                accessibilityHint="Double tap to add this amount to your daily water intake"
                style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
              >
                <View style={styles.quickIconCircle}>
                  {opt.label === 'Cup' ? <Coffee size={15} color={colors.hydration} /> :
                   opt.label === 'Glass' ? <Droplet size={15} color={colors.hydration} /> :
                   opt.label === 'Bottle' ? <Droplets size={15} color={colors.hydration} /> :
                   <Droplets size={15} color={colors.hydration} />}
                </View>
                <Text style={[styles.quickMl, { color: colors.hydration }]}>{opt.ml}ml</Text>
                <Text style={[styles.quickLabel, { color: colors.textMuted }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Goal met banner */}
          {pct >= 100 && (
            <View style={[styles.goalBanner, { backgroundColor: colors.successLight, borderColor: colors.success + '40' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Sparkles size={15} color={colors.success} />
                <Text style={[styles.goalBannerText, { color: colors.success }]}>
                  Daily goal reached! Great hydration today.
                </Text>
              </View>
            </View>
          )}

          {/* Log */}
          {entries.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>TODAY'S LOG</Text>
              <View style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                {entries.map((entry, i) => (
                  <View
                    key={entry.id}
                    style={[
                      styles.logRow,
                      i < entries.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
                    ]}
                  >
                    <View style={[styles.logDot, { backgroundColor: colors.hydration }]} />
                    <View style={styles.logInfo}>
                      <Text style={[styles.logName, { color: colors.text }]}>{entry.label}</Text>
                      <Text style={[styles.logTime, { color: colors.textMuted }]}>{formatTime(entry.time)}</Text>
                    </View>
                    <Text style={[styles.logMl, { color: colors.hydration }]}>{entry.ml}ml</Text>
                    <TouchableOpacity
                      onPress={() => deleteEntry(entry.id)}
                      style={styles.deleteBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={13} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          )}

          {entries.length === 0 && !loading && (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: `${colors.hydration}15` }]}>
                <Droplets size={28} color={colors.hydration} />
              </View>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No water logged yet today</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>Tap a button above to get started</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    root:         { flex: 1, backgroundColor: colors.background }                as ViewStyle,
    safe:         { flex: 1 }                                                    as ViewStyle,
    scroll:       { flex: 1 }                                                    as ViewStyle,
    content:      { paddingHorizontal: 20, paddingBottom: 40 }                   as ViewStyle,
    header:       { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, marginTop: 12, marginBottom: 8 } as ViewStyle,
    backBtn:      { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const } as ViewStyle,
    title:        { fontSize: fs(22), fontWeight: '700' as const, letterSpacing: -0.3 }  as TextStyle,
    targetPill:    { flexDirection: 'row' as const, alignItems: 'center' as const, alignSelf: 'center' as const, gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginBottom: 14 } as ViewStyle,
    targetLabel:   { fontSize: fs(13), fontWeight: '500' as const } as TextStyle,
    targetValue:   { fontSize: fs(15), fontWeight: '700' as const } as TextStyle,
    targetEdit:    { fontSize: fs(14), marginLeft: 2 } as TextStyle,
    targetPresets: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, justifyContent: 'center' as const, marginBottom: 16 } as ViewStyle,
    targetPresetBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 } as ViewStyle,
    targetPresetText: { fontSize: fs(14) } as TextStyle,
    statsRow:     { flexDirection: 'row' as const, gap: 8, marginBottom: 20 }    as ViewStyle,
    statBox:      { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10, alignItems: 'center' as const } as ViewStyle,
    statVal:      { fontSize: fs(18), fontWeight: '700' as const, letterSpacing: -0.5 }  as TextStyle,
    statLbl:      { fontSize: fs(11), fontWeight: '500' as const, marginTop: 2, textTransform: 'uppercase' as const, letterSpacing: 0.5 } as TextStyle,
    sectionTitle: { fontSize: fs(11), fontWeight: '600' as const, letterSpacing: 0.8, marginBottom: 10 } as TextStyle,
    quickRow:     { flexDirection: 'row' as const, gap: 8, marginBottom: 16 }    as ViewStyle,
    quickBtn:     { flex: 1, borderRadius: 16, borderWidth: 1, padding: 12, alignItems: 'center' as const, gap: 4 } as ViewStyle,
    quickIconCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(91,141,217,0.1)', alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 2 } as ViewStyle,
    quickMl:      { fontSize: fs(15), fontWeight: '700' as const }                   as TextStyle,
    quickLabel:   { fontSize: fs(9), textTransform: 'uppercase' as const, letterSpacing: 0.5 } as TextStyle,
    goalBanner:   { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16, alignItems: 'center' as const } as ViewStyle,
    goalBannerText: { fontSize: fs(13), fontWeight: '600' as const }                 as TextStyle,
    logCard:      { borderRadius: 14, borderWidth: 1, overflow: 'hidden' as const, marginBottom: 16 } as ViewStyle,
    logRow:       { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, padding: 12 } as ViewStyle,
    logDot:       { width: 8, height: 8, borderRadius: 4 }                       as ViewStyle,
    logInfo:      { flex: 1 }                                                    as ViewStyle,
    logName:      { fontSize: fs(13), fontWeight: '500' as const }                   as TextStyle,
    logTime:      { fontSize: fs(12), marginTop: 1 }                                 as TextStyle,
    logMl:        { fontSize: fs(13), fontWeight: '600' as const }                   as TextStyle,
    deleteBtn:    { padding: 4 }                                                  as ViewStyle,
    emptyState:   { alignItems: 'center' as const, paddingVertical: 32 }         as ViewStyle,
    emptyIcon:    { width: 56, height: 56, borderRadius: 28, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 12 } as ViewStyle,
    emptyText:    { fontSize: fs(15), fontWeight: '600' as const }                   as TextStyle,
    emptySub:     { fontSize: fs(13), marginTop: 4 }                                 as TextStyle,
  });
}
