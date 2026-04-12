import type { ColorScheme } from '@/constants/colors';
import { fs } from '@/constants/theme';
import { useFasting } from '@/contexts/FastingContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { FastRecord } from '@/types/fasting';
import {
  buildDayDrawerForDay,
  computeMonthSummary,
  creditsByDayKey,
  creditsFromEndedFast,
  dayKeyInMonth,
  localDayKeyFromMs,
  type BubbleKind,
  type JourneyCredit,
} from '@/utils/journeyModel';
import { router, Stack } from 'expo-router';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MS_HOUR = 3600000;
/** Minimum hours to count as a “deep fast” for stats and purple grid styling. */
const DEEP_FAST_MIN_HOURS = 18;

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type FilterPill = 'all' | 'completed' | 'partial' | 'missed';

interface GridCell {
  dayKey: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
}

interface Semantics {
  completed: string;
  completedBg: string;
  deep: string;
  deepBg: string;
  partial: string;
  partialBg: string;
  missed: string;
  missedBg: string;
  missedOutline: string;
  active: string;
  activeBg: string;
}

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function buildMondayFirstGrid(year: number, month0: number, todayKey: string): GridCell[] {
  const firstDow = new Date(year, month0, 1).getDay();
  const lead = (firstDow + 6) % 7;
  const dim = new Date(year, month0 + 1, 0).getDate();
  const prevDim = new Date(year, month0, 0).getDate();
  const cells: GridCell[] = [];

  for (let i = 0; i < lead; i++) {
    const d = prevDim - lead + i + 1;
    const t = new Date(year, month0 - 1, d, 12, 0, 0, 0).getTime();
    const dayKey = localDayKeyFromMs(t);
    cells.push({
      dayKey,
      dayOfMonth: d,
      isCurrentMonth: false,
      isToday: dayKey === todayKey,
      isFuture: dayKey > todayKey,
    });
  }

  for (let d = 1; d <= dim; d++) {
    const t = new Date(year, month0, d, 12, 0, 0, 0).getTime();
    const dayKey = localDayKeyFromMs(t);
    cells.push({
      dayKey,
      dayOfMonth: d,
      isCurrentMonth: true,
      isToday: dayKey === todayKey,
      isFuture: dayKey > todayKey,
    });
  }

  const tail = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= tail; i++) {
    const t = new Date(year, month0 + 1, i, 12, 0, 0, 0).getTime();
    const dayKey = localDayKeyFromMs(t);
    cells.push({
      dayKey,
      dayOfMonth: i,
      isCurrentMonth: false,
      isToday: dayKey === todayKey,
      isFuture: dayKey > todayKey,
    });
  }

  return cells;
}

function pickBubbleFromCredits(list: JourneyCredit[]): { kind: BubbleKind; label: string } | null {
  if (!list.length) return null;
  const completed = list.filter((c) => c.kind === 'completed');
  const partial = list.filter((c) => c.kind === 'partial');
  const primary = completed[0] ?? partial[0];
  const kind = primary.kind as BubbleKind;
  const label =
    list.length === 1
      ? primary.bubbleHoursLabel
      : list.map((c) => c.bubbleHoursLabel).join(' · ');
  return { kind, label };
}

function filterAllowsBubble(
  pill: FilterPill,
  kind: BubbleKind | 'missed' | 'rest' | null,
): boolean {
  if (pill === 'all') return true;
  if (kind === null) return false;
  if (pill === 'completed') return kind === 'completed';
  if (pill === 'partial') return kind === 'partial';
  if (pill === 'missed') return kind === 'missed';
  return true;
}

function useCalendarSemantics(colors: ColorScheme, isDark: boolean): Semantics {
  return useMemo(
    () => ({
      completed: colors.success,
      completedBg: colors.successLight,
      deep: isDark ? '#C9B5E8' : '#6C4F82',
      deepBg: isDark ? '#2A2438' : '#F0EBF7',
      partial: isDark ? '#F5E0A0' : '#9A7B16',
      partialBg: isDark ? colors.warningLight : '#FFF8E1',
      missed: colors.textMuted,
      missedBg: 'transparent',
      missedOutline: colors.border,
      active: colors.hydration,
      activeBg: isDark ? '#1A2535' : '#E3EDFA',
    }),
    [colors.success, colors.successLight, colors.warningLight, colors.hydration, colors.textMuted, colors.border, isDark],
  );
}

/** Count ended fasts ≥18h that have at least one credit day in the month. */
function deepFastsInMonthCount(records: FastRecord[], year: number, month0: number): number {
  let count = 0;
  for (const r of records) {
    if (r.endTime === null) continue;
    const h = (r.endTime - r.startTime) / MS_HOUR;
    if (h < DEEP_FAST_MIN_HOURS) continue;
    let touches = false;
    for (const c of creditsFromEndedFast(r)) {
      if (dayKeyInMonth(c.calendarDayKey, year, month0)) touches = true;
    }
    if (!touches) continue;
    count++;
  }
  return count;
}

function fastHoursForDayCredits(list: JourneyCredit[], recordsById: Map<string, FastRecord>): number | null {
  const completed = list.filter((c) => c.kind === 'completed');
  const partial = list.filter((c) => c.kind === 'partial');
  const primary = completed[0] ?? partial[0];
  if (!primary) return null;
  const r = recordsById.get(primary.fastId);
  if (!r?.endTime) return null;
  return (r.endTime - r.startTime) / MS_HOUR;
}

export default function CalendarScreen() {
  const { colors, isDark } = useTheme();
  const sem = useCalendarSemantics(colors, isDark);
  const styles = useMemo(() => makeStyles(), []);

  const { records, activeFast } = useFasting();
  const nowMs = Date.now();
  const todayKey = localDayKeyFromMs(nowMs);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month0, setMonth0] = useState(now.getMonth());
  const [filter, setFilter] = useState<FilterPill>('all');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const monthAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);

  const creditsMap = useMemo(() => creditsByDayKey(records as FastRecord[]), [records]);

  const recordsById = useMemo(() => {
    const m = new Map<string, FastRecord>();
    for (const r of records as FastRecord[]) m.set(r.id, r);
    return m;
  }, [records]);

  const summary = useMemo(
    () => computeMonthSummary(records as FastRecord[], year, month0, nowMs),
    [records, year, month0, nowMs],
  );

  const prevYm = useMemo(
    () => (month0 === 0 ? { y: year - 1, m: 11 } : { y: year, m: month0 - 1 }),
    [year, month0],
  );

  const prevSummary = useMemo(
    () => computeMonthSummary(records as FastRecord[], prevYm.y, prevYm.m, nowMs),
    [records, prevYm.y, prevYm.m, nowMs],
  );

  const prevMonthShort = useMemo(
    () => new Date(prevYm.y, prevYm.m, 1).toLocaleDateString(undefined, { month: 'short' }),
    [prevYm.y, prevYm.m],
  );

  const avgDeltaHours = summary.avgFastHoursRounded - prevSummary.avgFastHoursRounded;

  const deepFastCount = useMemo(
    () => deepFastsInMonthCount(records as FastRecord[], year, month0),
    [records, year, month0],
  );

  const fastsTrendLine = useMemo(() => {
    if (!summary.vsPrevMonthCompleted) return null;
    if (summary.vsPrevMonthCompleted === 'up') return `↑ vs ${prevMonthShort}`;
    if (summary.vsPrevMonthCompleted === 'down') return `↓ vs ${prevMonthShort}`;
    return `— vs ${prevMonthShort}`;
  }, [summary.vsPrevMonthCompleted, prevMonthShort]);

  const avgTrendLine = useMemo(() => {
    if (prevSummary.avgFastHoursRounded === 0 && summary.avgFastHoursRounded === 0) return null;
    if (avgDeltaHours === 0) return `— vs ${prevMonthShort}`;
    return `${avgDeltaHours > 0 ? '↑' : '↓'} ${Math.abs(avgDeltaHours)}h vs ${prevMonthShort}`;
  }, [avgDeltaHours, prevSummary.avgFastHoursRounded, summary.avgFastHoursRounded, prevMonthShort]);

  const filterOptions = useMemo(
    () =>
      [
        {
          key: 'all' as const,
          label: 'All',
          dot: colors.primary,
          chipBgOff: 'transparent' as const,
          chipBorderOff: colors.borderLight,
        },
        {
          key: 'completed' as const,
          label: 'Completed',
          dot: colors.success,
          chipBgOff: `${colors.success}14`,
          chipBorderOff: `${colors.success}4D`,
        },
        {
          key: 'partial' as const,
          label: 'Partial',
          dot: colors.warning,
          chipBgOff: `${colors.warning}18`,
          chipBorderOff: `${colors.warning}55`,
        },
        {
          key: 'missed' as const,
          label: 'Missed',
          dot: isDark ? '#B4A3D6' : '#6C4F82',
          chipBgOff: isDark ? '#B4A3D622' : '#6C4F8218',
          chipBorderOff: isDark ? '#B4A3D655' : '#6C4F8255',
        },
      ] as const,
    [colors.primary, colors.success, colors.warning, colors.borderLight, isDark],
  );

  const grid = useMemo(
    () => buildMondayFirstGrid(year, month0, todayKey),
    [year, month0, todayKey],
  );

  const rows = useMemo(() => {
    const r: GridCell[][] = [];
    for (let i = 0; i < grid.length; i += 7) r.push(grid.slice(i, i + 7));
    return r;
  }, [grid]);

  const bumpMonth = useCallback(() => {
    Animated.sequence([
      Animated.timing(monthAnim, {
        toValue: 0.92,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(monthAnim, {
        toValue: 1,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [monthAnim]);

  const prevMonth = useCallback(() => {
    bumpMonth();
    if (month0 === 0) {
      setMonth0(11);
      setYear((y) => y - 1);
    } else setMonth0((m) => m - 1);
    setSelectedKey(null);
  }, [month0, bumpMonth]);

  const nextMonth = useCallback(() => {
    bumpMonth();
    if (month0 === 11) {
      setMonth0(0);
      setYear((y) => y + 1);
    } else setMonth0((m) => m + 1);
    setSelectedKey(null);
  }, [month0, bumpMonth]);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [filter, selectedKey]);

  const drawerModels = useMemo(() => {
    if (!selectedKey) return null;
    if (activeFast && selectedKey === todayKey) {
      const durMs = nowMs - activeFast.startTime;
      const h = Math.floor(durMs / MS_HOUR);
      const mi = Math.floor((durMs % MS_HOUR) / 60000);
      const anchor = new Date(activeFast.startTime);
      const headerFmt = anchor.toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      });
      return {
        dateLabel: `Today · ${headerFmt}`,
        badge: 'active' as const,
        durationLine: `${h}h ${mi}m`,
        planLine: activeFast.label,
        targetSub: `${Math.round(activeFast.targetDuration / MS_HOUR)}h target`,
        sublineGoal: 'Fast in progress',
      };
    }
    const creds = creditsMap.get(selectedKey) ?? [];
    return buildDayDrawerForDay(selectedKey, creds, recordsById);
  }, [selectedKey, creditsMap, recordsById, activeFast, todayKey, nowMs]);

  const renderCell = (cell: GridCell) => {
    const { dayKey, isCurrentMonth, isToday, isFuture, dayOfMonth } = cell;
    const list = creditsMap.get(dayKey) ?? [];
    let bubbleKind: BubbleKind | 'missed' | 'rest' | null = null;
    let bubbleLabel = '';

    const fromCredits = pickBubbleFromCredits(list);
    const fastH = list.length ? fastHoursForDayCredits(list, recordsById) : null;
    const isDeepCompleted =
      !!fromCredits &&
      fromCredits.kind === 'completed' &&
      fastH !== null &&
      fastH >= DEEP_FAST_MIN_HOURS;

    if (isCurrentMonth && activeFast && isToday) {
      const h = (nowMs - activeFast.startTime) / MS_HOUR;
      bubbleKind = 'active';
      bubbleLabel = h >= 1 ? `${Math.floor(h)}h` : 'Now';
    } else if (fromCredits) {
      bubbleKind = fromCredits.kind;
      bubbleLabel = fromCredits.label;
    } else if (isCurrentMonth && !isFuture && dayKey < todayKey) {
      bubbleKind = 'missed';
      bubbleLabel = '—';
    } else if (isCurrentMonth && !isFuture && dayKey === todayKey && !activeFast) {
      bubbleKind = 'rest';
      bubbleLabel = '';
    }

    const showBubble =
      isCurrentMonth &&
      bubbleKind !== null &&
      bubbleKind !== 'rest' &&
      filterAllowsBubble(filter, bubbleKind);

    const muted = !isCurrentMonth;
    const bubbleFg =
      bubbleKind === 'completed'
        ? isDeepCompleted
          ? sem.deep
          : sem.completed
        : bubbleKind === 'partial'
          ? sem.partial
          : bubbleKind === 'missed'
            ? sem.missed
            : bubbleKind === 'active'
              ? sem.active
              : colors.textMuted;
    const bubbleBg =
      bubbleKind === 'completed'
        ? isDeepCompleted
          ? sem.deepBg
          : sem.completedBg
        : bubbleKind === 'partial'
          ? sem.partialBg
          : bubbleKind === 'missed'
            ? colors.surface
            : bubbleKind === 'active'
              ? sem.activeBg
              : colors.surface;
    const missOutline = bubbleKind === 'missed' ? { borderColor: sem.missedOutline, borderWidth: 1.5 } : {};

    const canPress = isCurrentMonth && (fromCredits || (activeFast && isToday) || bubbleKind === 'missed' || bubbleKind === 'rest');

    const bubbleBorder =
      bubbleKind === 'missed'
        ? missOutline
        : { borderColor: `${bubbleFg}66`, borderWidth: 1 };

    const inner = (
      <View style={[styles.cellInner, isToday && { backgroundColor: colors.primaryLight }]} pointerEvents="box-none">
        <Text
          style={[
            styles.dayNum,
            muted && { color: colors.textSecondary },
            !muted && !isToday && { color: colors.text },
            isToday && { color: colors.primary, fontWeight: '700' as const },
          ]}
        >
          {dayOfMonth}
        </Text>
        {showBubble ? (
          <View style={[styles.bubble, { backgroundColor: bubbleBg }, bubbleBorder]}>
            <Text style={[styles.bubbleText, { color: bubbleFg }]} numberOfLines={2}>
              {bubbleLabel}
            </Text>
          </View>
        ) : null}
      </View>
    );

    if (!isCurrentMonth || !canPress) {
      return (
        <View key={dayKey} style={[styles.cell, muted && { opacity: 0.55 }]}>
          {inner}
        </View>
      );
    }

    return (
      <Pressable
        key={dayKey}
        style={({ pressed }) => [styles.cell, pressed && { opacity: 0.85 }]}
        onPress={() => setSelectedKey((k) => (k === dayKey ? null : dayKey))}
        accessibilityRole="button"
        accessibilityLabel={`${dayKey}, ${bubbleKind ?? 'day'}`}
      >
        {inner}
      </Pressable>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View
          style={[
            styles.headerSticky,
            { backgroundColor: colors.background, borderBottomColor: colors.borderLight },
          ]}
        >
          <View style={styles.topBar}>
            <View style={styles.topBarSide}>
              <Pressable
                onPress={() => router.push('/(tabs)/(home)' as any)}
                style={styles.topLink}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Back to Today"
              >
                <ChevronLeft size={22} color={colors.primary} />
                <Text style={[styles.topLinkText, { color: colors.primary }]}>Today</Text>
              </Pressable>
            </View>
            <View style={styles.topTitleCenter}>
              <Calendar size={22} color={colors.primary} strokeWidth={2} />
              <Text style={[styles.screenTitle, { color: colors.text }]}>Calendar</Text>
            </View>
            <View style={styles.topBarSide} />
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.monthNav}>
            <Pressable
              onPress={prevMonth}
              style={[styles.navRound, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            >
              <ChevronLeft size={22} color={colors.text} />
            </Pressable>
            <Animated.Text style={[styles.monthTitle, { color: colors.text, opacity: monthAnim }]}>
              {MONTHS[month0]} {year}
            </Animated.Text>
            <Pressable
              onPress={nextMonth}
              style={[styles.navRound, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            >
              <ChevronRight size={22} color={colors.text} />
            </Pressable>
          </View>

          <View style={[styles.summaryStrip, { backgroundColor: colors.card }]}>
            <View style={styles.summaryCol}>
              <Text style={[styles.summaryVal, { color: colors.text }]}>{summary.completedFasts}</Text>
              <Text style={[styles.summaryLbl, { color: colors.textMuted }]}>Fasts done</Text>
              {fastsTrendLine ? (
                <Text style={[styles.summaryTrend, { color: colors.primary }]}>{fastsTrendLine}</Text>
              ) : null}
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.borderLight }]} />
            <View style={styles.summaryCol}>
              <Text style={[styles.summaryVal, { color: colors.text }]}>
                {summary.avgFastHoursRounded}h
              </Text>
              <Text style={[styles.summaryLbl, { color: colors.textMuted }]}>Avg fast</Text>
              {avgTrendLine ? (
                <Text style={[styles.summaryTrend, { color: colors.primary }]}>{avgTrendLine}</Text>
              ) : null}
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.borderLight }]} />
            <View style={styles.summaryCol}>
              <Text style={[styles.summaryVal, { color: colors.text }]}>{deepFastCount}</Text>
              <Text style={[styles.summaryLbl, { color: colors.textMuted }]}>Deep fasts</Text>
              <Text style={[styles.summaryTrend, { color: colors.primary }]}>18h+</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
            {filterOptions.map((opt) => {
              const on = filter === opt.key;
              const offBg = opt.key === 'all' ? 'transparent' : opt.chipBgOff;
              const offBorder = opt.key === 'all' ? opt.chipBorderOff : opt.chipBorderOff;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setFilter(opt.key)}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: on ? colors.text : offBg,
                      borderColor: on ? colors.text : offBorder,
                    },
                  ]}
                  accessibilityState={{ selected: on }}
                >
                  <View style={[styles.chipDot, { backgroundColor: opt.dot }]} />
                  <Text
                    style={[
                      styles.pillText,
                      { color: on ? colors.textLight : colors.textSecondary },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.weekHeader}>
            {WEEKDAYS.map((d) => (
              <Text key={d} style={[styles.weekHeadTxt, { color: colors.textSecondary }]}>
                {d}
              </Text>
            ))}
          </View>

          <Animated.View style={{ opacity: monthAnim }}>
            {rows.map((row, ri) => {
              const hasToday = row.some((c) => c.isToday);
              return (
                <View
                  key={ri}
                  style={[
                    styles.weekRow,
                    hasToday && {
                      backgroundColor: colors.surfaceWarm,
                      borderColor: colors.border,
                      borderWidth: 1,
                    },
                  ]}
                >
                  {row.map((c) => renderCell(c))}
                </View>
              );
            })}
          </Animated.View>

          <View
            onLayout={(e) => {
              if (!selectedKey) return;
              const y = e.nativeEvent.layout.y;
              requestAnimationFrame(() => {
                scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
              });
            }}
          >
            {drawerModels && selectedKey ? (
              <View
                style={[
                  styles.drawer,
                  { backgroundColor: colors.card, borderColor: colors.borderLight },
                ]}
              >
                <Text style={[styles.drawerDate, { color: colors.text }]}>{drawerModels.dateLabel}</Text>
                <Text style={[styles.drawerBadge, { color: colors.primary }]}>
                  {drawerModels.badge === 'completed'
                    ? 'Completed'
                    : drawerModels.badge === 'partial'
                      ? 'Partial'
                      : drawerModels.badge === 'active'
                        ? 'In progress'
                        : 'Rest'}
                </Text>
                {drawerModels.durationLine ? (
                  <Text style={[styles.drawerLine, { color: colors.text }]}>{drawerModels.durationLine}</Text>
                ) : null}
                {drawerModels.planLine ? (
                  <Text style={[styles.drawerSub, { color: colors.textSecondary }]}>
                    {drawerModels.planLine} · {drawerModels.targetSub}
                  </Text>
                ) : null}
                <Text style={[styles.drawerGoal, { color: colors.text }]}>{drawerModels.sublineGoal}</Text>
              </View>
            ) : (
              <View style={styles.drawerHint}>
                <Text style={[styles.drawerHintTxt, { color: colors.textMuted }]}>
                  Tap a day to see details. Adjacent-month dates are dimmed.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.legendStrip}>
            <View style={styles.legendItem}>
              <View style={[styles.legDot, { backgroundColor: sem.completed }]} />
              <Text style={[styles.legTxtInline, { color: colors.textSecondary }]}>Completed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legDot, { backgroundColor: colors.warning }]} />
              <Text style={[styles.legTxtInline, { color: colors.textSecondary }]}>
                Partial (12-15H)
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legDot, { backgroundColor: sem.deep }]} />
              <Text style={[styles.legTxtInline, { color: colors.textSecondary }]}>Extended fast</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legDotOutline,
                  {
                    borderColor: colors.textMuted,
                    backgroundColor: isDark ? colors.card : colors.background,
                  },
                ]}
              />
              <Text style={[styles.legTxtInline, { color: colors.textSecondary }]}>Missed / rest</Text>
            </View>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function makeStyles() {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    safe: {
      flex: 1,
    },
    headerSticky: {
      paddingHorizontal: 18,
      paddingTop: 4,
      paddingBottom: 10,
      borderBottomWidth: 1,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    topBarSide: {
      width: 88,
      flexShrink: 0,
    },
    topTitleCenter: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    topLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    topLinkText: {
      fontSize: fs(16),
      fontWeight: '600',
    },
    screenTitle: {
      fontSize: fs(20),
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    scroll: {
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 24,
    },
    monthNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    navRound: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    monthTitle: {
      fontSize: fs(18),
      fontWeight: '600',
    },
    summaryStrip: {
      flexDirection: 'row',
      alignItems: 'stretch',
      borderRadius: 14,
      marginBottom: 12,
      overflow: 'hidden',
    },
    summaryCol: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 0,
    },
    summaryDivider: {
      width: 1,
      alignSelf: 'stretch',
      marginVertical: 10,
    },
    summaryVal: {
      fontSize: fs(17),
      fontWeight: '700',
      textAlign: 'center',
    },
    summaryLbl: {
      fontSize: fs(9),
      fontWeight: '600',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      textAlign: 'center',
      marginTop: 4,
    },
    summaryTrend: {
      fontSize: fs(10),
      fontWeight: '600',
      textAlign: 'center',
      marginTop: 4,
    },
    pillRow: {
      flexDirection: 'row',
      gap: 10,
      paddingVertical: 4,
      marginBottom: 12,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 100,
      borderWidth: 1,
      marginRight: 4,
    },
    chipDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    pillText: {
      fontSize: fs(12),
      fontWeight: '600',
    },
    weekHeader: {
      flexDirection: 'row',
      marginBottom: 6,
    },
    weekHeadTxt: {
      flex: 1,
      textAlign: 'center',
      fontSize: fs(11),
      fontWeight: '500',
      letterSpacing: 0.3,
    },
    weekRow: {
      flexDirection: 'row',
      marginBottom: 6,
      borderRadius: 14,
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
    cell: {
      width: `${100 / 7}%` as any,
      padding: 2,
    },
    cellInner: {
      minHeight: 72,
      borderRadius: 12,
      alignItems: 'center',
      paddingTop: 6,
      paddingHorizontal: 2,
    },
    dayNum: {
      fontSize: fs(13),
      fontWeight: '500',
    },
    bubble: {
      marginTop: 4,
      borderRadius: 10,
      borderWidth: 1,
      paddingHorizontal: 4,
      paddingVertical: 3,
      width: '100%',
      alignItems: 'center',
    },
    bubbleText: {
      fontSize: fs(9),
      fontWeight: '700',
      textAlign: 'center',
      lineHeight: fs(12),
    },
    drawer: {
      marginTop: 16,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
    },
    drawerHint: {
      marginTop: 16,
      padding: 12,
    },
    drawerHintTxt: {
      fontSize: fs(13),
      textAlign: 'center',
    },
    drawerDate: {
      fontSize: fs(18),
      fontWeight: '600',
      marginBottom: 6,
    },
    drawerBadge: {
      fontSize: fs(11),
      fontWeight: '700',
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    drawerLine: {
      fontSize: fs(26),
      fontWeight: '600',
    },
    drawerSub: {
      fontSize: fs(14),
      marginTop: 6,
    },
    drawerGoal: {
      fontSize: fs(14),
      marginTop: 10,
    },
    legendStrip: {
      marginTop: 20,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 12,
      rowGap: 10,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    legDotOutline: {
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 2,
    },
    legTxtInline: {
      fontSize: fs(12),
    },
  });
}
