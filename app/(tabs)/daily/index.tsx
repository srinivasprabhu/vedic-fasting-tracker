// app/(tabs)/daily/index.tsx
// Full daily tracking tab — water, steps, weight all in one scrollable page.
// Steps auto-counted via expo-sensors Pedometer where available, manual fallback otherwise.

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Animated, Easing, ViewStyle, TextStyle,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Rect, Line, Text as SvgText } from 'react-native-svg';
import { Trash2 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { usePedometer } from '@/hooks/usePedometer';
import { formatWater, calcBMI, getBMICategory, bmiCategoryLabel, bmiCategoryColor, kgToLbs, lbsToKg } from '@/utils/calculatePlan';
import type { ColorScheme } from '@/constants/colors';
import { loadWeekStepBars } from '@/utils/stepsDayStorage';

// ─── Storage helpers ──────────────────────────────────────────────────────────

const todayDateStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const waterDayKey = () => { const d = new Date(); return `aayu_water_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`; };
const WEIGHT_KEY  = 'aayu_weight_log';

interface WaterEntry  { id: string; ml: number; label: string; time: number; }
interface WeightEntry { id: string; kg: number; date: string;  time: number; }

async function loadWater(): Promise<WaterEntry[]> {
  try { const r = await AsyncStorage.getItem(waterDayKey()); return r ? JSON.parse(r) : []; } catch { return []; }
}
async function saveWater(e: WaterEntry[]): Promise<void> {
  try { await AsyncStorage.setItem(waterDayKey(), JSON.stringify(e)); } catch {}
}
async function loadWeightLog(): Promise<WeightEntry[]> {
  try { const r = await AsyncStorage.getItem(WEIGHT_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
async function saveWeightLog(log: WeightEntry[]): Promise<void> {
  try { await AsyncStorage.setItem(WEIGHT_KEY, JSON.stringify(log.slice(0, 90))); } catch {}
}

// ─── Ring ─────────────────────────────────────────────────────────────────────

const Ring: React.FC<{ pct: number; color: string; size?: number; stroke?: number; children: React.ReactNode }> = ({
  pct, color, size = 72, stroke = 5, children,
}) => {
  const R = (size - stroke) / 2;
  const C = 2 * Math.PI * R;
  const fill = C * Math.min(pct / 100, 1);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute' }}>
        <Circle cx={size/2} cy={size/2} r={R} fill="none" stroke={`${color}20`} strokeWidth={stroke} />
        <Circle cx={size/2} cy={size/2} r={R} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={`${fill} ${C}`} transform={`rotate(-90 ${size/2} ${size/2})`} />
      </Svg>
      {children}
    </View>
  );
};

// ─── 7-day bars ───────────────────────────────────────────────────────────────

const MiniWeekBars: React.FC<{
  data: { label: string; steps: number; isToday: boolean }[];
  goal: number; isDark: boolean; color: string;
}> = ({ data, goal, isDark, color }) => {
  const maxVal = Math.max(...data.map(d => d.steps), goal, 1);
  const W = 200; const H = 44; const BW = 20; const GAP = (W - data.length * BW) / (data.length + 1);
  const goalY = H - (goal / maxVal) * H;
  const dimText = isDark ? 'rgba(200,135,42,.35)' : 'rgba(160,104,32,.4)';
  return (
    <Svg width={W} height={H + 14} viewBox={`0 0 ${W} ${H + 14}`}>
      {goal > 0 && <Line x1={0} y1={goalY} x2={W} y2={goalY} stroke={isDark ? 'rgba(200,135,42,.3)' : 'rgba(160,104,32,.3)'} strokeWidth={1} strokeDasharray="3,3" />}
      {data.map((d, i) => {
        const barH = Math.max(0, (d.steps / maxVal) * H);
        const x = GAP + i * (BW + GAP);
        const fill = d.isToday ? color : (d.steps >= goal ? `${color}90` : `${color}35`);
        return (
          <React.Fragment key={d.label}>
            {barH > 0 && <Rect x={x} y={H - barH} width={BW} height={barH} fill={fill} rx={3} />}
            <SvgText x={x + BW/2} y={H + 11} fontSize={8} fill={d.isToday ? (isDark ? '#e8a84c' : '#a06820') : dimText} fontWeight={d.isToday ? '700' : '400'} textAnchor="middle">{d.label}</SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
};

// ─── Section header ───────────────────────────────────────────────────────────

const SectionHead: React.FC<{ emoji: string; title: string; sub: string; colors: ColorScheme }> = ({ emoji, title, sub, colors }) => (
  <View style={{ marginBottom: 10 }}>
    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{emoji} {title}</Text>
    <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{sub}</Text>
  </View>
);

// ─── Water quick-add button ───────────────────────────────────────────────────

const AddBtn: React.FC<{
  emoji: string; label: string; ml: number;
  onPress: () => void; colors: ColorScheme; featured?: boolean;
}> = ({ emoji, label, ml, onPress, colors, featured }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.75}
    style={[qb.wrap, {
      backgroundColor: featured ? 'rgba(91,141,217,.18)' : colors.card,
      borderColor:     featured ? 'rgba(91,141,217,.45)' : colors.borderLight,
    }]}
  >
    <Text style={qb.emoji}>{emoji}</Text>
    <Text style={[qb.ml, { color: '#5b8dd9' }]}>+{ml}ml</Text>
    <Text style={[qb.lbl, { color: colors.textMuted }]}>{label}</Text>
  </TouchableOpacity>
);
const qb = StyleSheet.create({
  wrap:  { flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 10, alignItems: 'center' as const, gap: 3 } as ViewStyle,
  emoji: { fontSize: 18 } as TextStyle,
  ml:    { fontSize: 11, fontWeight: '700' as const } as TextStyle,
  lbl:   { fontSize: 9 } as TextStyle,
});

// ─── Steps quick-add button ───────────────────────────────────────────────────

const StepBtn: React.FC<{
  emoji: string; label: string; steps: number;
  onPress: () => void; colors: ColorScheme;
}> = ({ emoji, label, steps, onPress, colors }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.75}
    style={[sb.wrap, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
  >
    <Text style={sb.emoji}>{emoji}</Text>
    <View>
      <Text style={[sb.steps, { color: colors.success }]}>+{steps >= 1000 ? `${steps/1000}k` : steps}</Text>
      <Text style={[sb.lbl, { color: colors.textMuted }]}>{label}</Text>
    </View>
  </TouchableOpacity>
);
const sb = StyleSheet.create({
  wrap:  { flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, padding: 10, borderWidth: 1, borderRadius: 11 } as ViewStyle,
  emoji: { fontSize: 18 } as TextStyle,
  steps: { fontSize: 12, fontWeight: '700' as const } as TextStyle,
  lbl:   { fontSize: 9 } as TextStyle,
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DailyScreen() {
  const { colors, isDark } = useTheme();
  const { profile, updateBodyMetrics } = useUserProfile();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const waterTarget = profile?.plan?.dailyWaterMl ?? 2500;
  const stepsTarget = profile?.plan?.dailySteps    ?? 8000;
  const weightUnit  = profile?.weightUnit ?? 'kg';
  const goalKg      = profile?.goalWeightKg ?? null;
  const startKg     = profile?.currentWeightKg ?? null;

  // ── Pedometer (auto steps) ─────────────────────────────────────────────────
  const pedometer = usePedometer();

  // ── State ──────────────────────────────────────────────────────────────────
  const [waterEntries, setWaterEntries] = useState<WaterEntry[]>([]);
  const [weekSteps, setWeekSteps]       = useState<{ label: string; steps: number; isToday: boolean }[]>([]);
  const [weightLog, setWeightLog]       = useState<WeightEntry[]>([]);
  const [weightInput, setWeightInput]   = useState('');
  const [stepsInput, setStepsInput]     = useState('');
  const [showStepsInput, setShowStepsInput] = useState(false);

  // Load data on mount
  useEffect(() => {
    Promise.all([loadWater(), loadWeightLog()]).then(([w, wl]) => {
      setWaterEntries(w);
      setWeightLog(wl);
    });
    loadWeekStepBars().then(setWeekSteps);
  }, []);

  // Keep today's bar in the 7-day chart in sync with live pedometer total
  useEffect(() => {
    setWeekSteps(prev => prev.map(d => d.isToday ? { ...d, steps: pedometer.steps } : d));
  }, [pedometer.steps]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const totalWater = useMemo(() => waterEntries.reduce((s, e) => s + e.ml, 0), [waterEntries]);
  const waterPct   = waterTarget > 0 ? (totalWater / waterTarget) * 100 : 0;
  const stepsPct   = stepsTarget > 0 ? (pedometer.steps / stepsTarget) * 100 : 0;

  const latestKg: number | null = weightLog.length > 0 ? weightLog[0].kg : (startKg ?? null);
  const bmi       = latestKg && profile?.heightCm ? calcBMI(latestKg, profile.heightCm) : null;
  const bmiCat    = bmi ? getBMICategory(bmi) : null;
  const bmiColor  = bmiCategoryColor(bmiCat, isDark);
  const weightPct = (goalKg && latestKg && startKg && startKg > goalKg)
    ? Math.min(100, Math.max(0, ((startKg - latestKg) / (startKg - goalKg)) * 100)) : 0;
  const toGoalKg  = latestKg && goalKg ? Math.max(0, latestKg - goalKg) : null;

  // ── Water handlers ─────────────────────────────────────────────────────────
  const addWater = useCallback(async (ml: number, label: string, emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const entry: WaterEntry = { id: `w_${Date.now()}`, ml, label: `${emoji} ${label}`, time: Date.now() };
    const updated = [entry, ...waterEntries];
    setWaterEntries(updated);
    await saveWater(updated);
  }, [waterEntries]);

  const deleteWater = useCallback(async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = waterEntries.filter(e => e.id !== id);
    setWaterEntries(updated);
    await saveWater(updated);
  }, [waterEntries]);

  // ── Steps handlers ─────────────────────────────────────────────────────────
  // addManual layers on top of auto pedometer count
  const handleAddSteps = useCallback(async (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await pedometer.addManual(amount);
  }, [pedometer]);

  const submitManualSteps = useCallback(async () => {
    const n = parseInt(stepsInput, 10);
    if (!isNaN(n) && n > 0) {
      await handleAddSteps(n);
      setStepsInput('');
      setShowStepsInput(false);
    }
  }, [stepsInput, handleAddSteps]);

  // ── Weight handlers ────────────────────────────────────────────────────────
  const logWeight = useCallback(async () => {
    const n = parseFloat(weightInput);
    if (isNaN(n) || n <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const kg = weightUnit === 'lbs' ? lbsToKg(n) : n;
    const entry: WeightEntry = { id: `wt_${Date.now()}`, kg, date: todayDateStr(), time: Date.now() };
    const updated = [entry, ...weightLog.filter(e => e.date !== todayDateStr())];
    setWeightLog(updated);
    await saveWeightLog(updated);
    setWeightInput('');
    if (profile) {
      updateBodyMetrics({
        sex: profile.sex ?? 'prefer_not_to_say',
        heightCm: profile.heightCm ?? 170,
        currentWeightKg: kg,
        goalWeightKg: profile.goalWeightKg,
        weightUnit: profile.weightUnit,
        fastingPurpose: profile.fastingPurpose,
      });
    }
  }, [weightInput, weightUnit, weightLog, profile, updateBodyMetrics]);

  const deleteWeight = useCallback(async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = weightLog.filter(e => e.id !== id);
    setWeightLog(updated);
    await saveWeightLog(updated);
  }, [weightLog]);

  // ── Display helpers ────────────────────────────────────────────────────────
  const fmtTime   = (ts: number) => new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const fmtDate   = (ts: number) => new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const fmtWeight = (kg: number) => weightUnit === 'lbs' ? `${kgToLbs(kg).toFixed(1)} lbs` : `${kg.toFixed(1)} kg`;
  const today     = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  // ── Colors ─────────────────────────────────────────────────────────────────
  const waterColor  = '#5b8dd9';
  const stepsColor  = colors.success;
  const weightColor = isDark ? '#e8a84c' : '#a06820';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.root}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.pageTitle, { color: colors.text }]}>Daily tracking</Text>
              <Text style={[styles.pageDate, { color: colors.textMuted }]}>{today}</Text>
            </View>

            {/* ══ WATER ═══════════════════════════════════════════════════ */}
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: 'rgba(91,141,217,.2)' }]}>
              <SectionHead emoji="💧" title="Water" sub={`${formatWater(waterTarget)} daily target`} colors={colors} />
              <View style={styles.ringRow}>
                <Ring pct={waterPct} color={waterColor} size={80} stroke={6}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.ringPct, { color: waterColor }]}>{Math.round(waterPct)}%</Text>
                    <Text style={[styles.ringLbl, { color: colors.textMuted }]}>done</Text>
                  </View>
                </Ring>
                <View style={styles.statsList}>
                  {[
                    { lbl: 'Logged',    val: formatWater(totalWater),                         clr: colors.text  },
                    { lbl: 'Remaining', val: formatWater(Math.max(0, waterTarget-totalWater)), clr: waterColor   },
                    { lbl: 'Glasses',   val: String(waterEntries.length),                     clr: colors.text  },
                  ].map(({ lbl, val, clr }) => (
                    <View key={lbl} style={styles.statLine}>
                      <Text style={[styles.statLbl, { color: colors.textMuted }]}>{lbl}</Text>
                      <Text style={[styles.statVal, { color: clr }]}>{val}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <Text style={[styles.addTitle, { color: colors.textMuted }]}>QUICK ADD</Text>
              <View style={styles.addRow}>
                <AddBtn emoji="☕" label="Cup"    ml={150} onPress={() => addWater(150,'Cup','☕')}    colors={colors} />
                <AddBtn emoji="🥤" label="Glass"  ml={250} onPress={() => addWater(250,'Glass','🥤')}  colors={colors} featured />
                <AddBtn emoji="💧" label="Bottle" ml={500} onPress={() => addWater(500,'Bottle','💧')} colors={colors} featured />
                <AddBtn emoji="🏺" label="Large"  ml={750} onPress={() => addWater(750,'Large','🏺')}  colors={colors} />
              </View>
              {waterPct >= 100 && (
                <View style={[styles.goalBanner, { backgroundColor: colors.successLight, borderColor: `${colors.success}40` }]}>
                  <Text style={[styles.goalText, { color: colors.success }]}>🎉 Water goal reached!</Text>
                </View>
              )}
              {waterEntries.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <Text style={[styles.addTitle, { color: colors.textMuted }]}>TODAY'S LOG</Text>
                  {waterEntries.slice(0, 5).map((e, i) => (
                    <View key={e.id} style={[styles.logRow, i < Math.min(waterEntries.length,5)-1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}>
                      <View style={[styles.logDot, { backgroundColor: waterColor }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.logName, { color: colors.text }]}>{e.label}</Text>
                        <Text style={[styles.logMeta, { color: colors.textMuted }]}>{fmtTime(e.time)}</Text>
                      </View>
                      <Text style={[styles.logVal, { color: waterColor }]}>{e.ml}ml</Text>
                      <TouchableOpacity onPress={() => deleteWater(e.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Trash2 size={12} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* ══ STEPS ════════════════════════════════════════════════════ */}
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: `${stepsColor}30` }]}>
              <SectionHead
                emoji="👟"
                title="Steps"
                sub={`${pedometer.steps.toLocaleString()} / ${stepsTarget >= 1000 ? `${stepsTarget/1000}k` : stepsTarget} · ${pedometer.sourceLabel}`}
                colors={colors}
              />

              {/* Live badge */}
              {pedometer.available && (
                <View style={[styles.liveBadge, {
                  backgroundColor: pedometer.isLive ? 'rgba(58,170,110,.12)' : 'rgba(200,135,42,.08)',
                  borderColor:     pedometer.isLive ? 'rgba(58,170,110,.3)'  : 'rgba(200,135,42,.2)',
                }]}>
                  <View style={[styles.liveDot, { backgroundColor: pedometer.isLive ? stepsColor : colors.warning }]} />
                  <Text style={[styles.liveTxt, { color: pedometer.isLive ? stepsColor : colors.warning }]}>
                    {pedometer.isLive ? 'Counting automatically from your phone' : 'Motion sensor available · tap to add manually'}
                  </Text>
                </View>
              )}

              <View style={styles.ringRow}>
                <Ring pct={stepsPct} color={stepsColor} size={80} stroke={6}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.ringPct, { color: stepsColor }]}>{Math.round(stepsPct)}%</Text>
                    <Text style={[styles.ringLbl, { color: colors.textMuted }]}>done</Text>
                  </View>
                </Ring>
                <View style={styles.statsList}>
                  {[
                    { lbl: 'Total',     val: pedometer.steps.toLocaleString(),                              clr: colors.text },
                    { lbl: pedometer.available ? 'Phone' : 'Manual', val: pedometer.available ? pedometer.autoSteps.toLocaleString() : pedometer.manualSteps.toLocaleString(), clr: stepsColor },
                    { lbl: 'Calories',  val: `${Math.round(pedometer.steps * 0.05)} kcal`,                 clr: colors.text },
                  ].map(({ lbl, val, clr }) => (
                    <View key={lbl} style={styles.statLine}>
                      <Text style={[styles.statLbl, { color: colors.textMuted }]}>{lbl}</Text>
                      <Text style={[styles.statVal, { color: clr }]}>{val}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {weekSteps.length > 0 && (
                <View style={{ marginBottom: 12, alignItems: 'center' }}>
                  <MiniWeekBars data={weekSteps} goal={stepsTarget} isDark={isDark} color={stepsColor} />
                </View>
              )}

              {/* Quick add — always shown; description changes based on pedometer */}
              <Text style={[styles.addTitle, { color: colors.textMuted }]}>
                {pedometer.available ? 'ADD EXTRA STEPS' : 'QUICK ADD'}
              </Text>
              <View style={[styles.addRow, { marginBottom: 8 }]}>
                <StepBtn emoji="🚶" label="~10 min" steps={1000}  onPress={() => handleAddSteps(1000)}  colors={colors} />
                <StepBtn emoji="🏃" label="~25 min" steps={2500}  onPress={() => handleAddSteps(2500)}  colors={colors} />
              </View>
              <View style={[styles.addRow, { marginBottom: 10 }]}>
                <StepBtn emoji="⚡" label="~50 min" steps={5000}  onPress={() => handleAddSteps(5000)}  colors={colors} />
                <StepBtn emoji="🏆" label="Full day" steps={10000} onPress={() => handleAddSteps(10000)} colors={colors} />
              </View>

              {showStepsInput ? (
                <View style={styles.manualRow}>
                  <TextInput
                    value={stepsInput}
                    onChangeText={setStepsInput}
                    keyboardType="number-pad"
                    placeholder="Enter steps..."
                    placeholderTextColor={colors.textMuted}
                    style={[styles.manualInput, { color: colors.text, borderColor: colors.borderLight }]}
                    autoFocus returnKeyType="done" onSubmitEditing={submitManualSteps}
                  />
                  <TouchableOpacity onPress={submitManualSteps} style={[styles.manualBtn, { backgroundColor: colors.primary }]}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textLight }}>Add</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setShowStepsInput(true)} style={[styles.manualToggle, { borderColor: colors.borderLight }]}>
                  <Text style={[styles.manualToggleText, { color: colors.textSecondary }]}>+ Enter manually</Text>
                </TouchableOpacity>
              )}

              {stepsPct >= 100 && (
                <View style={[styles.goalBanner, { backgroundColor: colors.successLight, borderColor: `${colors.success}40` }]}>
                  <Text style={[styles.goalText, { color: colors.success }]}>🏆 Step goal crushed!</Text>
                </View>
              )}
            </View>

            {/* ══ WEIGHT ═══════════════════════════════════════════════════ */}
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: `${weightColor}30` }]}>
              <SectionHead emoji="⚖️" title="Weight" sub="Log today's weight to track your journey" colors={colors} />
              {latestKg && (
                <View style={styles.weightBoxRow}>
                  <View style={[styles.weightBox, { backgroundColor: isDark ? 'rgba(200,135,42,.07)' : 'rgba(200,135,42,.06)', borderColor: isDark ? 'rgba(200,135,42,.18)' : 'rgba(200,135,42,.2)' }]}>
                    <Text style={[styles.weightBoxVal, { color: colors.text }]}>{fmtWeight(latestKg)}</Text>
                    <Text style={[styles.weightBoxLbl, { color: colors.textMuted }]}>Current</Text>
                  </View>
                  {bmi && (
                    <View style={[styles.weightBox, { backgroundColor: `${bmiColor}15`, borderColor: `${bmiColor}30` }]}>
                      <Text style={[styles.weightBoxVal, { color: bmiColor }]}>{bmi}</Text>
                      <Text style={[styles.weightBoxLbl, { color: bmiColor }]}>{bmiCategoryLabel(bmiCat)}</Text>
                    </View>
                  )}
                  {toGoalKg !== null && goalKg && (
                    <View style={[styles.weightBox, { backgroundColor: 'rgba(58,170,110,.08)', borderColor: 'rgba(58,170,110,.2)' }]}>
                      <Text style={[styles.weightBoxVal, { color: colors.success }]}>
                        {weightUnit === 'lbs' ? kgToLbs(toGoalKg).toFixed(1) : toGoalKg.toFixed(1)}
                      </Text>
                      <Text style={[styles.weightBoxLbl, { color: colors.success }]}>{weightUnit} to goal</Text>
                    </View>
                  )}
                </View>
              )}
              {goalKg && latestKg && weightPct > 0 && (
                <View style={[styles.weightProgress, { backgroundColor: colors.surface }]}>
                  <View style={[styles.weightProgressFill, { width: `${weightPct}%` as any, backgroundColor: weightColor }]} />
                </View>
              )}
              <Text style={[styles.addTitle, { color: colors.textMuted, marginTop: 12 }]}>
                {weightLog.length > 0 && weightLog[0].date === todayDateStr() ? "UPDATE TODAY'S WEIGHT" : "LOG TODAY'S WEIGHT"}
              </Text>
              <View style={styles.manualRow}>
                <TextInput
                  value={weightInput}
                  onChangeText={setWeightInput}
                  keyboardType="decimal-pad"
                  placeholder={latestKg ? fmtWeight(latestKg) : (weightUnit === 'lbs' ? '165.0' : '74.0')}
                  placeholderTextColor={colors.textMuted}
                  style={[styles.manualInput, { color: colors.text, borderColor: colors.borderLight, flex: 1, fontSize: 20 }]}
                  returnKeyType="done" onSubmitEditing={logWeight}
                />
                <Text style={{ fontSize: 13, fontWeight: '500', color: colors.textSecondary, marginHorizontal: 6 }}>{weightUnit}</Text>
                <TouchableOpacity onPress={logWeight} disabled={!weightInput}
                  style={[styles.manualBtn, { backgroundColor: weightInput ? colors.primary : colors.surface }]}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: weightInput ? colors.textLight : colors.textMuted }}>Log</Text>
                </TouchableOpacity>
              </View>
              {weightLog.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <Text style={[styles.addTitle, { color: colors.textMuted }]}>HISTORY</Text>
                  {weightLog.slice(0, 7).map((e, i) => (
                    <View key={e.id} style={[styles.logRow, i < Math.min(weightLog.length,7)-1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}>
                      <View style={[styles.logDot, { backgroundColor: weightColor }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.logName, { color: colors.text }]}>{fmtWeight(e.kg)}</Text>
                        <Text style={[styles.logMeta, { color: colors.textMuted }]}>{fmtDate(e.time)}</Text>
                      </View>
                      {i === 0 && (
                        <View style={[styles.todayBadge, { backgroundColor: colors.primaryLight }]}>
                          <Text style={[styles.todayText, { color: colors.primary }]}>Latest</Text>
                        </View>
                      )}
                      <TouchableOpacity onPress={() => deleteWeight(e.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Trash2 size={12} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={{ height: 32 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    root:               { flex: 1, backgroundColor: colors.background }                  as ViewStyle,
    content:            { paddingHorizontal: 16, paddingBottom: 40 }                     as ViewStyle,
    header:             { paddingTop: 16, paddingBottom: 12 }                            as ViewStyle,
    pageTitle:          { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 }         as TextStyle,
    pageDate:           { fontSize: 12, marginTop: 2 }                                   as TextStyle,
    section:            { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12 } as ViewStyle,
    ringRow:            { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 16, marginBottom: 14 } as ViewStyle,
    ringPct:            { fontSize: 14, fontWeight: '700' as const, textAlign: 'center' as const } as TextStyle,
    ringLbl:            { fontSize: 10, textAlign: 'center' as const, marginTop: 1, textTransform: 'uppercase' as const, letterSpacing: 0.4 } as TextStyle,
    statsList:          { flex: 1, gap: 6 }                                              as ViewStyle,
    statLine:           { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const } as ViewStyle,
    statLbl:            { fontSize: 12 }                                                 as TextStyle,
    statVal:            { fontSize: 13, fontWeight: '600' as const }                     as TextStyle,
    addTitle:           { fontSize: 10, fontWeight: '600' as const, letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' as const } as TextStyle,
    addRow:             { flexDirection: 'row' as const, gap: 6 }                        as ViewStyle,
    goalBanner:         { borderRadius: 10, borderWidth: 1, padding: 10, marginTop: 10, alignItems: 'center' as const } as ViewStyle,
    goalText:           { fontSize: 12, fontWeight: '600' as const }                     as TextStyle,
    liveBadge:          { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 7, borderWidth: 1, borderRadius: 10, padding: 9, marginBottom: 12 } as ViewStyle,
    liveDot:            { width: 7, height: 7, borderRadius: 3.5 }                       as ViewStyle,
    liveTxt:            { fontSize: 12, fontWeight: '500' as const, flex: 1 }            as TextStyle,
    logRow:             { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, paddingVertical: 8 } as ViewStyle,
    logDot:             { width: 7, height: 7, borderRadius: 3.5 }                       as ViewStyle,
    logName:            { fontSize: 12, fontWeight: '500' as const }                     as TextStyle,
    logMeta:            { fontSize: 11, marginTop: 1 }                                   as TextStyle,
    logVal:             { fontSize: 12, fontWeight: '600' as const }                     as TextStyle,
    manualRow:          { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 } as ViewStyle,
    manualInput:        { borderBottomWidth: 1.5, paddingVertical: 6, fontSize: 16, fontWeight: '500' as const } as TextStyle,
    manualBtn:          { borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 } as ViewStyle,
    manualToggle:       { borderWidth: 1, borderStyle: 'dashed' as const, borderRadius: 10, padding: 12, alignItems: 'center' as const } as ViewStyle,
    manualToggleText:   { fontSize: 12, fontWeight: '500' as const }                     as TextStyle,
    weightBoxRow:       { flexDirection: 'row' as const, gap: 8, marginBottom: 10 }      as ViewStyle,
    weightBox:          { flex: 1, borderWidth: 1, borderRadius: 12, padding: 10, alignItems: 'center' as const } as ViewStyle,
    weightBoxVal:       { fontSize: 16, fontWeight: '700' as const }                     as TextStyle,
    weightBoxLbl:       { fontSize: 10, marginTop: 3, textAlign: 'center' as const, textTransform: 'uppercase' as const, letterSpacing: 0.4 } as TextStyle,
    weightProgress:     { height: 5, borderRadius: 3, overflow: 'hidden' as const, marginBottom: 4 } as ViewStyle,
    weightProgressFill: { height: '100%' as any, borderRadius: 3 }                       as ViewStyle,
    todayBadge:         { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }    as ViewStyle,
    todayText:          { fontSize: 10, fontWeight: '600' as const }                      as TextStyle,
  });
}
