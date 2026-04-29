// app/(tabs)/(home)/weight.tsx
// Weight tracker screen — log today's weight, see trend toward goal.

import { fs } from '@/constants/theme';
import { useScrollToTop } from '@react-navigation/native';
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Animated, Easing,
  ViewStyle, TextStyle, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Scale, Trash2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { syncWeightEntry } from '@/lib/sync';
import { calcBMI, getBMICategory, bmiCategoryLabel, bmiCategoryColor, kgToLbs, lbsToKg } from '@/utils/calculatePlan';
import type { ColorScheme } from '@/constants/colors';

// ─── Storage ──────────────────────────────────────────────────────────────────

const WEIGHT_LOG_KEY = 'aayu_weight_log';

interface WeightEntry {
  id:    string;
  kg:    number;
  date:  string;   // YYYY-MM-DD
  time:  number;
}

async function loadWeightLog(): Promise<WeightEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(WEIGHT_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveWeightLog(log: WeightEntry[]): Promise<void> {
  try {
    // Keep last 90 entries
    await AsyncStorage.setItem(WEIGHT_LOG_KEY, JSON.stringify(log.slice(0, 90)));
  } catch {}
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ─── Progress ring ────────────────────────────────────────────────────────────

import Svg, { Circle } from 'react-native-svg';

const WeightRing: React.FC<{
  pct:      number;
  current:  number;
  goal:     number;
  unit:     'kg' | 'lbs';
  colors:   ColorScheme;
}> = ({ pct, current, goal, unit, colors }) => {
  const SIZE    = 170;
  const STROKE  = 11;
  const R       = (SIZE - STROKE) / 2;
  const CIRCUMF = 2 * Math.PI * R;
  const fill    = CIRCUMF * Math.min(pct / 100, 1);
  const goldColor = '#e8a84c';

  const disp = (kg: number) => unit === 'lbs' ? kgToLbs(kg).toFixed(1) : kg.toFixed(1);

  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <Circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke={colors.surface} strokeWidth={STROKE} />
          <Circle
            cx={SIZE/2} cy={SIZE/2} r={R}
            fill="none" stroke={goldColor} strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${fill} ${CIRCUMF}`}
            transform={`rotate(-90 ${SIZE/2} ${SIZE/2})`}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={[wr.val, { color: colors.text }]}>{disp(current)}</Text>
          <Text style={[wr.unit, { color: colors.textSecondary }]}>{unit}</Text>
          {goal > 0 && (
            <Text style={[wr.goal, { color: goldColor }]}>
              goal {disp(goal)} {unit}
            </Text>
          )}
          {goal > 0 && (
            <Text style={[wr.pct, { color: goldColor }]}>
              {Math.round(pct)}% there
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const wr = StyleSheet.create({
  val:  { fontSize: fs(34), fontWeight: '700' as const, letterSpacing: -1 } as TextStyle,
  unit: { fontSize: fs(12), fontWeight: '500' as const, marginTop: 2 }      as TextStyle,
  goal: { fontSize: fs(11), marginTop: 3 }                                   as TextStyle,
  pct:  { fontSize: fs(12), fontWeight: '600' as const, marginTop: 2 }      as TextStyle,
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function WeightScreen() {
  const { colors, isDark } = useTheme();
  const { profile, updateBodyMetrics } = useUserProfile();
  const { user, isAuthenticated } = useAuth();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const unit       = profile?.weightUnit ?? 'kg';
  const goalKg     = profile?.goalWeightKg ?? null;
  // startingWeightKg is set once during onboarding and never overwritten
  const startKg    = profile?.startingWeightKg ?? profile?.currentWeightKg ?? null;
  const onboardKg  = profile?.currentWeightKg ?? null;

  const [log, setLog]         = useState<WeightEntry[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(true);
  const weightScrollRef = useRef<ScrollView>(null);
  useScrollToTop(weightScrollRef);

  useEffect(() => {
    loadWeightLog().then((l) => { setLog(l); setLoading(false); });
  }, []);

  // Latest logged weight — fall back to profile current weight
  const latestKg: number | null = log.length > 0 ? log[0].kg : (onboardKg ?? null);
  const todayLogged = log.length > 0 && log[0].date === todayStr();

  // Progress toward goal
  const progressPct = useMemo(() => {
    if (!goalKg || !startKg || !latestKg) return 0;
    if (goalKg >= startKg) return 0;
    return Math.min(100, Math.max(0, ((startKg - latestKg) / (startKg - goalKg)) * 100));
  }, [goalKg, startKg, latestKg]);

  const toGoalKg = latestKg && goalKg ? Math.max(0, latestKg - goalKg) : null;

  // BMI
  const bmi    = latestKg && profile?.heightCm ? calcBMI(latestKg, profile.heightCm) : null;
  const bmiCat = bmi ? getBMICategory(bmi) : null;

  const logWeight = useCallback(async () => {
    const n = parseFloat(inputVal);
    if (isNaN(n) || n <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const kg = unit === 'lbs' ? lbsToKg(n) : n;
    const entry: WeightEntry = { id: `wt_${Date.now()}`, kg, date: todayStr(), time: Date.now() };
    const updated = [entry, ...log.filter((e) => e.date !== todayStr())];
    setLog(updated);
    await saveWeightLog(updated);
    setInputVal('');

    // Sync to Supabase in background
    if (isAuthenticated && user?.id) {
      syncWeightEntry(user.id, entry).catch(() => {});
    }

    // Also update profile so plan stays current
    updateBodyMetrics({
      sex:             profile?.sex ?? 'prefer_not_to_say',
      heightCm:        profile?.heightCm ?? 170,
      currentWeightKg: kg,
      goalWeightKg:    profile?.goalWeightKg,
      weightUnit:      profile?.weightUnit,
      fastingPurpose:  profile?.fastingPurpose,
    });
  }, [inputVal, unit, log, profile, updateBodyMetrics]);

  const deleteEntry = useCallback(async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = log.filter((e) => e.id !== id);
    setLog(updated);
    await saveWeightLog(updated);
  }, [log]);

  const formatEntry = (kg: number) =>
    unit === 'lbs' ? `${kgToLbs(kg).toFixed(1)} lbs` : `${kg.toFixed(1)} kg`;

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  const goldColor = isDark ? '#e8a84c' : '#a06820';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ScrollView
            ref={weightScrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <ChevronLeft size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.title, { color: colors.text }]}>Weight Journey</Text>
            </View>

            {/* Ring */}
            {latestKg && (
              <WeightRing
                pct={progressPct}
                current={latestKg}
                goal={goalKg ?? 0}
                unit={unit}
                colors={colors}
              />
            )}

            {/* Journey progress — Start → Current → Goal */}
            {startKg && goalKg && (
              <View style={[styles.journeyCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <View style={styles.journeyRow}>
                  <View style={styles.journeyPoint}>
                    <Text style={[styles.journeyLabel, { color: colors.textMuted }]}>Start</Text>
                    <Text style={[styles.journeyWeight, { color: colors.textSecondary }]}>{unit === 'lbs' ? kgToLbs(startKg).toFixed(1) : startKg.toFixed(1)}</Text>
                  </View>
                  <View style={{ flex: 1, paddingHorizontal: 8 }}>
                    <View style={[styles.journeyTrack, { backgroundColor: isDark ? 'rgba(200,135,42,0.12)' : 'rgba(200,135,42,0.1)' }]}>
                      <View style={[styles.journeyFill, { width: `${Math.min(100, progressPct)}%`, backgroundColor: goldColor }]} />
                    </View>
                    <Text style={[styles.journeyPctText, { color: goldColor }]}>{Math.round(progressPct)}% of the way</Text>
                  </View>
                  <View style={[styles.journeyPoint, { alignItems: 'flex-end' }]}>
                    <Text style={[styles.journeyLabel, { color: colors.textMuted }]}>Goal</Text>
                    <Text style={[styles.journeyWeight, { color: isDark ? '#7AAE79' : '#187040' }]}>{unit === 'lbs' ? kgToLbs(goalKg).toFixed(1) : goalKg.toFixed(1)}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Stats */}
            <View style={styles.statsRow}>
              {[
                { val: toGoalKg ? (unit === 'lbs' ? `${kgToLbs(toGoalKg).toFixed(1)}` : toGoalKg.toFixed(1)) : '—', lbl: `${unit} to goal` },
                { val: log.length > 0 ? String(log.length) : '0', lbl: 'logs' },
              ].map(({ val, lbl }, i) => (
                <View key={i} style={[styles.statBox, {
                  backgroundColor: isDark ? 'rgba(200,135,42,0.08)' : 'rgba(200,135,42,0.07)',
                  borderColor: isDark ? 'rgba(200,135,42,0.2)' : 'rgba(200,135,42,0.22)',
                }]}>
                  <Text style={[styles.statVal, { color: goldColor }]}>{val}</Text>
                  <Text style={[styles.statLbl, { color: colors.textMuted }]}>{lbl}</Text>
                </View>
              ))}
            </View>

            {/* BMI card */}
            {bmi && (
              <View style={[styles.bmiCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <Text style={[styles.bmiTitle, { color: colors.textMuted }]}>YOUR BMI</Text>
                <View style={styles.bmiRow}>
                  <Text style={[styles.bmiValue, { color: bmiCat ? bmiCategoryColor(bmiCat, isDark) : colors.text }]}>{bmi}</Text>
                  <Text style={[styles.bmiUnit, { color: colors.textMuted }]}>kg/m²</Text>
                  <View style={[styles.bmiBadge, { backgroundColor: `${bmiCat ? bmiCategoryColor(bmiCat, isDark) : goldColor}18`, borderColor: `${bmiCat ? bmiCategoryColor(bmiCat, isDark) : goldColor}40` }]}>
                    <Text style={[styles.bmiBadgeText, { color: bmiCat ? bmiCategoryColor(bmiCat, isDark) : goldColor }]}>{bmiCat ? bmiCategoryLabel(bmiCat) : ''}</Text>
                  </View>
                </View>
                <View style={{ position: 'relative' as const }}>
                  <View style={styles.bmiBar}>
                    <View style={[styles.bmiSeg, { flex: 1.7, backgroundColor: '#5b8dd9' }]} />
                    <View style={[styles.bmiSeg, { flex: 1.5, backgroundColor: '#3aaa6e' }]} />
                    <View style={[styles.bmiSeg, { flex: 1,   backgroundColor: '#e8c05a' }]} />
                    <View style={[styles.bmiSeg, { flex: 1.2, backgroundColor: '#e07b30' }]} />
                    <View style={[styles.bmiSeg, { flex: 2,   backgroundColor: '#e05555' }]} />
                  </View>
                  {/* BMI pointer */}
                  <View style={[
                    styles.bmiPointer,
                    { left: `${Math.min(98, Math.max(2, ((bmi - 15) / (40 - 15)) * 100))}%` },
                  ]}>
                    <View style={[styles.bmiPointerDot, { backgroundColor: bmiCat ? bmiCategoryColor(bmiCat, isDark) : goldColor }]} />
                  </View>
                </View>
                <View style={styles.bmiLabels}>
                  <Text style={[styles.bmiLabelText, { color: colors.textMuted }]}>Under</Text>
                  <Text style={[styles.bmiLabelText, { color: colors.textMuted }]}>Normal</Text>
                  <Text style={[styles.bmiLabelText, { color: colors.textMuted }]}>Over</Text>
                  <Text style={[styles.bmiLabelText, { color: colors.textMuted }]}>Obese</Text>
                </View>
              </View>
            )}

            {/* Log input */}
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              {todayLogged ? "UPDATE TODAY'S WEIGHT" : "LOG TODAY'S WEIGHT"}
            </Text>
            <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <View style={styles.inputRow}>
                <TextInput
                  value={inputVal}
                  onChangeText={setInputVal}
                  keyboardType="decimal-pad"
                  placeholder={latestKg ? formatEntry(latestKg) : (unit === 'lbs' ? '165.0' : '74.0')}
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { color: colors.text }]}
                  returnKeyType="done"
                  onSubmitEditing={logWeight}
                />
                <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>{unit}</Text>
                <TouchableOpacity
                  onPress={logWeight}
                  disabled={!inputVal}
                  style={[styles.logBtn, { backgroundColor: inputVal ? colors.primary : colors.surface }]}
                >
                  <Text style={[styles.logBtnText, { color: inputVal ? colors.textLight : colors.textMuted }]}>
                    Log
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* History */}
            {log.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>HISTORY</Text>
                <View style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                  {log.slice(0, 10).map((entry, i) => (
                    <View
                      key={entry.id}
                      style={[styles.logRow, i < Math.min(log.length, 10) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}
                    >
                      <View style={[styles.logDot, { backgroundColor: goldColor }]} />
                      <View style={styles.logInfo}>
                        <Text style={[styles.logWeight, { color: colors.text }]}>{formatEntry(entry.kg)}</Text>
                        <Text style={[styles.logDate, { color: colors.textMuted }]}>{formatTime(entry.time)}</Text>
                      </View>
                      {i === 0 && (
                        <View style={[styles.todayBadge, { backgroundColor: colors.primaryLight }]}>
                          <Text style={[styles.todayText, { color: colors.primary }]}>Today</Text>
                        </View>
                      )}
                      <TouchableOpacity onPress={() => deleteEntry(entry.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Trash2 size={13} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </>
            )}

            {!latestKg && !loading && (
              <View style={styles.emptyState}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: `${isDark ? '#e8a84c' : '#a06820'}15`, alignItems: 'center' as const, justifyContent: 'center' as const }}>
                  <Scale size={28} color={isDark ? '#e8a84c' : '#a06820'} />
                </View>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>No weight logged yet</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Log your first weight above</Text>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    root:        { flex: 1, backgroundColor: colors.background } as ViewStyle,
    safe:        { flex: 1 }                                      as ViewStyle,
    scroll:      { flex: 1 }                                      as ViewStyle,
    content:     { paddingHorizontal: 20, paddingBottom: 40 }     as ViewStyle,
    header:      { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, marginTop: 12, marginBottom: 8 } as ViewStyle,
    backBtn:     { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const } as ViewStyle,
    title:       { fontSize: fs(22), fontWeight: '700' as const, letterSpacing: -0.3 } as TextStyle,
    journeyCard:   { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 } as ViewStyle,
    journeyRow:    { flexDirection: 'row' as const, alignItems: 'center' as const } as ViewStyle,
    journeyPoint:  { alignItems: 'flex-start' as const } as ViewStyle,
    journeyLabel:  { fontSize: fs(11), fontWeight: '500' as const, marginBottom: 2, textTransform: 'uppercase' as const, letterSpacing: 0.5 } as TextStyle,
    journeyWeight: { fontSize: fs(18), fontWeight: '700' as const, letterSpacing: -0.5 } as TextStyle,
    journeyTrack:  { height: 6, borderRadius: 3, overflow: 'hidden' as const, marginBottom: 4 } as ViewStyle,
    journeyFill:   { height: '100%' as any, borderRadius: 3 } as ViewStyle,
    journeyPctText:{ fontSize: fs(11), fontWeight: '600' as const, textAlign: 'center' as const } as TextStyle,
    bmiCard:       { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 } as ViewStyle,
    bmiTitle:      { fontSize: fs(10), fontWeight: '600' as const, letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' as const } as TextStyle,
    bmiRow:        { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginBottom: 10 } as ViewStyle,
    bmiValue:      { fontSize: fs(28), fontWeight: '700' as const, letterSpacing: -0.5 } as TextStyle,
    bmiUnit:       { fontSize: fs(13), fontWeight: '500' as const } as TextStyle,
    bmiBadge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, marginLeft: 'auto' as any } as ViewStyle,
    bmiBadgeText:  { fontSize: fs(12), fontWeight: '600' as const } as TextStyle,
    bmiBar:        { flexDirection: 'row' as const, height: 8, borderRadius: 4, overflow: 'hidden' as const, marginBottom: 6 } as ViewStyle,
    bmiSeg:        { height: '100%' as any } as ViewStyle,
    bmiPointer:    { position: 'absolute' as const, top: -4, marginLeft: -6 } as ViewStyle,
    bmiPointerDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#fff' } as ViewStyle,
    bmiLabels:     { flexDirection: 'row' as const, justifyContent: 'space-between' as const, marginTop: 4 } as ViewStyle,
    bmiLabelText:  { fontSize: fs(10), fontWeight: '500' as const } as TextStyle,
    statsRow:    { flexDirection: 'row' as const, gap: 8, marginBottom: 14 }       as ViewStyle,
    statBox:     { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10, alignItems: 'center' as const } as ViewStyle,
    statVal:     { fontSize: fs(18), fontWeight: '700' as const, letterSpacing: -0.5 } as TextStyle,
    statLbl:     { fontSize: fs(11), fontWeight: '500' as const, marginTop: 2, textAlign: 'center' as const } as TextStyle,
    sectionTitle:{ fontSize: fs(11), fontWeight: '600' as const, letterSpacing: 0.8, marginBottom: 10 } as TextStyle,
    inputCard:   { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 20 } as ViewStyle,
    inputRow:    { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 } as ViewStyle,
    input:       { flex: 1, fontSize: fs(24), fontWeight: '600' as const, padding: 0 } as TextStyle,
    inputUnit:   { fontSize: fs(14), fontWeight: '500' as const }                      as TextStyle,
    logBtn:      { borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 }  as ViewStyle,
    logBtnText:  { fontSize: fs(14), fontWeight: '600' as const }                      as TextStyle,
    logCard:     { borderRadius: 14, borderWidth: 1, overflow: 'hidden' as const, marginBottom: 16 } as ViewStyle,
    logRow:      { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, padding: 12 } as ViewStyle,
    logDot:      { width: 8, height: 8, borderRadius: 4 }                         as ViewStyle,
    logInfo:     { flex: 1 }                                                       as ViewStyle,
    logWeight:   { fontSize: fs(15), fontWeight: '600' as const }                     as TextStyle,
    logDate:     { fontSize: fs(12), marginTop: 1 }                                   as TextStyle,
    todayBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }    as ViewStyle,
    todayText:   { fontSize: fs(11), fontWeight: '600' as const }                     as TextStyle,
    emptyState:  { alignItems: 'center' as const, paddingVertical: 32 }           as ViewStyle,
    emptyEmoji:  { fontSize: fs(40), marginBottom: 10 }                               as TextStyle,
    emptyText:   { fontSize: fs(15), fontWeight: '600' as const }                     as TextStyle,
    emptySub:    { fontSize: fs(13), marginTop: 4 }                                   as TextStyle,
  });
}
