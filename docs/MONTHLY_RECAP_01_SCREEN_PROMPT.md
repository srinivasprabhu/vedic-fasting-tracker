# Step 1: Monthly Recap Screen (the one-pager everyone sees)

## What you're building

A full-screen in-app experience that every user (free and Pro) sees when the monthly report is ready. This is the first touchpoint in the monthly ritual — it shows the user what they accomplished and sells the PDF.

**This is NOT the PDF report.** The PDF stays where it is. This is a new, mobile-native, full-screen experience that appears inside the app.

## User flow

1. User taps "Generate report" button OR lands here from a push notification (step 3) OR taps a new "View your March recap" card on the Insights tab
2. Full-screen modal opens with an animated reveal (score counts up, stats fade in)
3. User scrolls through ~1.5 screens of content: score → stats → insights → "what's next"
4. Two buttons at the bottom: "Share summary" (step 2) and "Download full report" (existing PDF flow, Pro-gated)
5. User dismisses by tapping X in the top-right

## File structure

Create these new files:

```
app/monthly-recap.tsx                       — The full-screen route
components/recap/RecapScoreHero.tsx         — Animated score + delta pill
components/recap/RecapStatsGrid.tsx         — 3 stat tiles
components/recap/RecapInsightsList.tsx      — 3 bullet insights
components/recap/RecapNextMonthCard.tsx     — Projected score + focus area
components/recap/RecapActionButtons.tsx     — Share + Download CTAs
```

## Data source

Use the existing `generateMonthlyReport()` function in `utils/monthly-report.ts`. The `MonthlyReportData` object already has every field you need:

- `metabolicScore` (0-100)
- `metabolicLabel` ("Strong Foundation")
- `prevMonth.metabolicScore` (for delta)
- `completedFasts`, `avgFastDuration`, `bestStreak` (the 3 stat tiles)
- `insights[]` (first 3 for bullet list)
- `projectedScore`, `nextMonthTargets.focusArea` (for "what's next")
- `monthLabel` ("March 2026")

**No new data fetching needed.** The aggregator already does all the work.

---

## Task 1: Create the route file `app/monthly-recap.tsx`

The route needs to receive `month` and `year` as search params (so the same screen works for the current-month report and for re-viewing older months).

```tsx
import { fs } from '@/constants/theme';
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Animated, ViewStyle, TextStyle,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { X, Download, Share2, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { useTheme } from '@/contexts/ThemeContext';
import { useFasting } from '@/contexts/FastingContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import {
  generateMonthlyReport,
  markReportGenerated,
  MonthlyReportData,
} from '@/utils/monthly-report';
import { buildReportHTML } from '@/utils/report-html-template';
import RecapScoreHero from '@/components/recap/RecapScoreHero';
import RecapStatsGrid from '@/components/recap/RecapStatsGrid';
import RecapInsightsList from '@/components/recap/RecapInsightsList';
import RecapNextMonthCard from '@/components/recap/RecapNextMonthCard';
import RecapActionButtons from '@/components/recap/RecapActionButtons';
import type { ColorScheme } from '@/constants/colors';

export default function MonthlyRecapScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const { profile, isProUser } = useUserProfile();
  const { presentPaywall } = useRevenueCat();
  const { completedRecords } = useFasting();
  const params = useLocalSearchParams<{ month?: string; year?: string }>();

  const [data, setData] = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Load report data on mount
  useEffect(() => {
    async function load() {
      if (!profile) return;
      const month = params.month ? parseInt(params.month, 10) : new Date().getMonth() - 1;
      const year = params.year ? parseInt(params.year, 10) : new Date().getFullYear();
      const normalizedMonth = month < 0 ? 11 : month;
      const normalizedYear = month < 0 ? year - 1 : year;

      try {
        const report = await generateMonthlyReport(
          normalizedMonth,
          normalizedYear,
          profile,
          completedRecords,
        );
        setData(report);
      } catch (e) {
        console.warn('[MonthlyRecap] load error:', e);
        Alert.alert('Error', 'Could not load your report. Please try again.');
        router.back();
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profile, completedRecords, params.month, params.year]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    if (!data || !profile) return;

    // Pro gate
    if (!isProUser) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await presentPaywall();
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGeneratingPdf(true);

    try {
      const Print = await import('expo-print');
      const html = buildReportHTML(data);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await markReportGenerated(data.month, data.year);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Aayu Report — ${data.monthLabel}`,
          UTI: 'com.adobe.pdf',
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.warn('[MonthlyRecap] PDF error:', e);
      Alert.alert('Error', 'Could not generate the PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  }, [data, profile, isProUser, presentPaywall]);

  const handleShareSummary = useCallback(async () => {
    // Step 2 of this feature builds the shareable summary card.
    // For now, this button is a placeholder — wire it up in step 2.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Coming soon', 'Share summary card will be available shortly.');
  }, []);

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerEyebrow}>MONTH {data.monthNumber} RECAP</Text>
            <Text style={styles.headerTitle}>{data.monthLabel}</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <RecapScoreHero
            score={data.metabolicScore}
            label={data.metabolicLabel}
            prevScore={data.prevMonth?.metabolicScore ?? null}
            isBaseline={data.isBaseline}
          />

          <RecapStatsGrid
            completedFasts={data.completedFasts}
            avgFastDuration={data.avgFastDuration}
            bestStreak={data.bestStreak}
            prevMonth={data.prevMonth}
          />

          <RecapInsightsList insights={data.insights} />

          <RecapNextMonthCard
            projectedScore={data.projectedScore}
            currentScore={data.metabolicScore}
            focusArea={data.nextMonthTargets.focusArea}
            targetFasts={data.nextMonthTargets.targetFasts}
          />

          <View style={{ height: 120 }} />
        </ScrollView>

        <View style={[styles.actionBar, { backgroundColor: colors.background, borderTopColor: colors.borderLight }]}>
          <RecapActionButtons
            onShare={handleShareSummary}
            onDownload={handleDownloadPdf}
            isProUser={isProUser}
            generatingPdf={generatingPdf}
          />
        </View>
      </SafeAreaView>
    </>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background } as ViewStyle,
    loadingContainer: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    } as ViewStyle,
    headerTextCol: { flex: 1 } as ViewStyle,
    headerEyebrow: {
      fontSize: fs(10),
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 1.5,
      marginBottom: 4,
    } as TextStyle,
    headerTitle: {
      fontSize: fs(22),
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.5,
    } as TextStyle,
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    scroll: { flex: 1 } as ViewStyle,
    scrollContent: { paddingHorizontal: 20, paddingTop: 24 } as ViewStyle,
    actionBar: {
      position: 'absolute',
      left: 0, right: 0, bottom: 0,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: Platform.OS === 'ios' ? 34 : 20,
      borderTopWidth: 1,
    } as ViewStyle,
  });
}
```

---

## Task 2: Create `components/recap/RecapScoreHero.tsx`

Animated circular score gauge with delta pill. Counts up from 0 to the score value over 1.2s. Delta pill shows "+8 pts" in green if improved, "−3 pts" in warning if regressed, or "Baseline" if no previous month exists.

```tsx
import { fs } from '@/constants/theme';
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ViewStyle, TextStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { ColorScheme } from '@/constants/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const SIZE = 180;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMF = 2 * Math.PI * RADIUS;

interface Props {
  score: number;
  label: string;
  prevScore: number | null;
  isBaseline: boolean;
}

export default function RecapScoreHero({ score, label, prevScore, isBaseline }: Props) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const reduceMotion = useReducedMotion();

  const progressAnim = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = React.useState(reduceMotion ? score : 0);

  useEffect(() => {
    if (reduceMotion) {
      progressAnim.setValue(1);
      setDisplayScore(score);
      return;
    }

    const listener = progressAnim.addListener(({ value }) => {
      setDisplayScore(Math.round(value * score));
    });

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1200,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => progressAnim.removeListener(listener);
  }, [score, progressAnim, reduceMotion]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMF, CIRCUMF * (1 - score / 100)],
  });

  // Score colour by tier
  const scoreColor =
    score >= 85 ? colors.success :
    score >= 70 ? '#e8a84c' :
    score >= 50 ? colors.warning :
    colors.textMuted;

  // Delta pill
  const delta = prevScore !== null ? score - prevScore : null;
  const deltaLabel = isBaseline
    ? 'Baseline month'
    : delta === null
    ? null
    : delta === 0
    ? 'Same as last month'
    : delta > 0
    ? `+${delta} pts`
    : `${delta} pts`;
  const deltaColor =
    isBaseline ? colors.primary :
    delta === null ? colors.textMuted :
    delta > 0 ? colors.success :
    delta < 0 ? colors.warning :
    colors.textSecondary;

  return (
    <View style={styles.container}>
      <View style={styles.scoreWrap}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={colors.surface}
            strokeWidth={STROKE}
            fill="none"
          />
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={scoreColor}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMF} ${CIRCUMF}`}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>

        <View style={styles.scoreCenter}>
          <Text style={[styles.scoreValue, { color: scoreColor }]}>{displayScore}</Text>
          <Text style={[styles.scoreMax, { color: colors.textMuted }]}>/ 100</Text>
        </View>
      </View>

      <Text style={[styles.scoreLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.scoreSublabel, { color: colors.textMuted }]}>Metabolic discipline score</Text>

      {deltaLabel && (
        <View style={[styles.deltaPill, { backgroundColor: `${deltaColor}15` }]}>
          <Text style={[styles.deltaText, { color: deltaColor }]}>{deltaLabel}</Text>
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    container: { alignItems: 'center', marginBottom: 32 } as ViewStyle,
    scoreWrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
    scoreCenter: { position: 'absolute', alignItems: 'center' } as ViewStyle,
    scoreValue: { fontSize: fs(56), fontWeight: '800', letterSpacing: -2 } as TextStyle,
    scoreMax: { fontSize: fs(14), fontWeight: '500', marginTop: -6 } as TextStyle,
    scoreLabel: { fontSize: fs(22), fontWeight: '700', marginTop: 18, letterSpacing: -0.3 } as TextStyle,
    scoreSublabel: { fontSize: fs(13), marginTop: 4 } as TextStyle,
    deltaPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, marginTop: 14 } as ViewStyle,
    deltaText: { fontSize: fs(13), fontWeight: '700', letterSpacing: 0.3 } as TextStyle,
  });
}
```

---

## Task 3: Create `components/recap/RecapStatsGrid.tsx`

Three stat tiles in a row: Fasts completed, Avg duration, Best streak. Each shows the value and an optional delta vs previous month.

```tsx
import { fs } from '@/constants/theme';
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Flame, Clock, TrendingUp } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorScheme } from '@/constants/colors';
import type { MonthlyReportData } from '@/utils/monthly-report';

interface Props {
  completedFasts: number;
  avgFastDuration: number;
  bestStreak: number;
  prevMonth: MonthlyReportData['prevMonth'];
}

export default function RecapStatsGrid({ completedFasts, avgFastDuration, bestStreak, prevMonth }: Props) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const fastsDelta = prevMonth ? completedFasts - prevMonth.totalFasts : null;
  const durationDelta = prevMonth ? avgFastDuration - prevMonth.avgFastDuration : null;
  const streakDelta = prevMonth ? bestStreak - prevMonth.bestStreak : null;

  return (
    <View style={styles.grid}>
      <StatTile
        icon={<Flame size={18} color={colors.primary} />}
        iconBg={colors.primaryLight}
        value={String(completedFasts)}
        label="Fasts completed"
        delta={fastsDelta}
        deltaUnit=""
        colors={colors}
      />
      <StatTile
        icon={<Clock size={18} color={colors.accent} />}
        iconBg={colors.accentLight}
        value={`${avgFastDuration.toFixed(1)}h`}
        label="Avg duration"
        delta={durationDelta !== null ? Math.round(durationDelta * 10) / 10 : null}
        deltaUnit="h"
        colors={colors}
      />
      <StatTile
        icon={<TrendingUp size={18} color={colors.warning} />}
        iconBg={colors.warningLight}
        value={String(bestStreak)}
        label="Best streak"
        delta={streakDelta}
        deltaUnit="d"
        colors={colors}
      />
    </View>
  );
}

function StatTile({
  icon, iconBg, value, label, delta, deltaUnit, colors,
}: {
  icon: React.ReactNode;
  iconBg: string;
  value: string;
  label: string;
  delta: number | null;
  deltaUnit: string;
  colors: ColorScheme;
}) {
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const deltaColor = delta === null ? colors.textMuted : delta > 0 ? colors.success : delta < 0 ? colors.warning : colors.textMuted;
  const deltaStr = delta === null ? null : delta === 0 ? '—' : delta > 0 ? `+${delta}${deltaUnit}` : `${delta}${deltaUnit}`;

  return (
    <View style={[styles.tile, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      {deltaStr && (
        <Text style={[styles.delta, { color: deltaColor }]}>{deltaStr} vs last</Text>
      )}
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    grid: { flexDirection: 'row', gap: 10, marginBottom: 28 } as ViewStyle,
    tile: { flex: 1, borderRadius: 16, padding: 14, borderWidth: 1, alignItems: 'flex-start' } as ViewStyle,
    iconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10 } as ViewStyle,
    value: { fontSize: fs(22), fontWeight: '800', letterSpacing: -0.5 } as TextStyle,
    label: { fontSize: fs(11), fontWeight: '500', marginTop: 2 } as TextStyle,
    delta: { fontSize: fs(11), fontWeight: '600', marginTop: 4 } as TextStyle,
  });
}
```

---

## Task 4: Create `components/recap/RecapInsightsList.tsx`

A simple bulleted list of up to 3 personalised insights. If no insights are available, render nothing.

```tsx
import { fs } from '@/constants/theme';
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorScheme } from '@/constants/colors';

interface Props {
  insights: string[];
}

export default function RecapInsightsList({ insights }: Props) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const top = insights.slice(0, 3);
  if (top.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
      <View style={styles.header}>
        <Sparkles size={16} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>What stood out</Text>
      </View>
      {top.map((insight, i) => (
        <View key={i} style={styles.row}>
          <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
          <Text style={[styles.text, { color: colors.textSecondary }]}>{insight}</Text>
        </View>
      ))}
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    card: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 20 } as ViewStyle,
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 } as ViewStyle,
    title: { fontSize: fs(15), fontWeight: '700' } as TextStyle,
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 } as ViewStyle,
    bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 8 } as ViewStyle,
    text: { fontSize: fs(14), lineHeight: 21, flex: 1 } as TextStyle,
  });
}
```

---

## Task 5: Create `components/recap/RecapNextMonthCard.tsx`

The forward-looking card. Shows projected score ("75 → 84") and the focus area for next month.

```tsx
import { fs } from '@/constants/theme';
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Target } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorScheme } from '@/constants/colors';

interface Props {
  projectedScore: number | null;
  currentScore: number;
  focusArea: string;
  targetFasts: number;
}

export default function RecapNextMonthCard({ projectedScore, currentScore, focusArea, targetFasts }: Props) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceWarm, borderColor: colors.primaryLight }]}>
      <View style={styles.header}>
        <Target size={16} color={colors.primary} />
        <Text style={[styles.eyebrow, { color: colors.primary }]}>NEXT MONTH TARGET</Text>
      </View>

      <Text style={[styles.focus, { color: colors.text }]}>{focusArea}</Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        Aim for {targetFasts} fasts. {projectedScore !== null && ` If you do, your score could reach ${projectedScore}.`}
      </Text>

      {projectedScore !== null && (
        <View style={styles.projectionRow}>
          <Text style={[styles.projectionNow, { color: colors.textMuted }]}>{currentScore}</Text>
          <Text style={[styles.projectionArrow, { color: colors.primary }]}>→</Text>
          <Text style={[styles.projectionTarget, { color: colors.primary }]}>{projectedScore}</Text>
          <Text style={[styles.projectionLabel, { color: colors.textMuted }]}>Projected</Text>
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    card: { borderRadius: 16, padding: 18, borderWidth: 1, marginBottom: 20 } as ViewStyle,
    header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 } as ViewStyle,
    eyebrow: { fontSize: fs(10), fontWeight: '700', letterSpacing: 1.2 } as TextStyle,
    focus: { fontSize: fs(18), fontWeight: '700', letterSpacing: -0.3, marginBottom: 6 } as TextStyle,
    sub: { fontSize: fs(13), lineHeight: 19, marginBottom: 14 } as TextStyle,
    projectionRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 } as ViewStyle,
    projectionNow: { fontSize: fs(22), fontWeight: '700' } as TextStyle,
    projectionArrow: { fontSize: fs(18), fontWeight: '700' } as TextStyle,
    projectionTarget: { fontSize: fs(32), fontWeight: '800', letterSpacing: -1 } as TextStyle,
    projectionLabel: { fontSize: fs(11), fontWeight: '600', marginLeft: 6, letterSpacing: 0.5 } as TextStyle,
  });
}
```

---

## Task 6: Create `components/recap/RecapActionButtons.tsx`

Two-button row: Share (secondary) + Download PDF (primary). The Download button shows a Lock icon + "PRO" badge for free users.

```tsx
import { fs } from '@/constants/theme';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Share2, Download, Lock } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorScheme } from '@/constants/colors';

interface Props {
  onShare: () => void;
  onDownload: () => void;
  isProUser: boolean;
  generatingPdf: boolean;
}

export default function RecapActionButtons({ onShare, onDownload, isProUser, generatingPdf }: Props) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.shareBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
        onPress={onShare}
        activeOpacity={0.75}
      >
        <Share2 size={17} color={colors.text} />
        <Text style={[styles.shareLabel, { color: colors.text }]}>Share</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.downloadBtn, { backgroundColor: colors.primary, opacity: generatingPdf ? 0.7 : 1 }]}
        onPress={onDownload}
        disabled={generatingPdf}
        activeOpacity={0.85}
      >
        {generatingPdf ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            {!isProUser && <Lock size={14} color="#fff" />}
            <Download size={17} color="#fff" />
            <Text style={styles.downloadLabel}>
              {isProUser ? 'Download full report' : 'Unlock full report'}
            </Text>
            {!isProUser && (
              <View style={styles.proPill}>
                <Text style={styles.proText}>PRO</Text>
              </View>
            )}
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    row: { flexDirection: 'row', gap: 10 } as ViewStyle,
    shareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderRadius: 14,
      borderWidth: 1,
    } as ViewStyle,
    shareLabel: { fontSize: fs(14), fontWeight: '600' } as TextStyle,
    downloadBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderRadius: 14,
    } as ViewStyle,
    downloadLabel: { fontSize: fs(14), fontWeight: '700', color: '#fff' } as TextStyle,
    proPill: {
      backgroundColor: 'rgba(255,255,255,0.25)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 2,
    } as ViewStyle,
    proText: { fontSize: fs(9), fontWeight: '800', color: '#fff', letterSpacing: 0.5 } as TextStyle,
  });
}
```

---

## Task 7: Wire up the entry point

Update `components/MonthlyReportCard.tsx` to route to the new recap screen instead of immediately generating the PDF.

Find the existing `handleGenerate` function. Replace the body's logic with:

```typescript
const handleGenerate = useCallback(async () => {
  if (!availability.available || availability.month === undefined || availability.year === undefined) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  router.push({
    pathname: '/monthly-recap',
    params: {
      month: String(availability.month),
      year: String(availability.year),
    },
  });
}, [availability]);
```

Also add the router import at the top:
```typescript
import { router } from 'expo-router';
```

The existing `alreadyGenerated` state and the free-user throttle logic can remain — the PDF throttle happens inside the recap screen's download button. But the `handleShare` and `lastPdfPath` state become unused and can be removed if you want to clean up.

Update the primary button label inside the Pro user section from "Generate report" / "Download again" to "View your {monthLabel} recap".

---

## Verification checklist

After implementation:
- [ ] `npx tsc --noEmit` passes
- [ ] Insights tab shows "View your {month} recap" button (Pro user) or a Pro-locked card (free user)
- [ ] Tapping the button opens the full-screen recap modal
- [ ] Score gauge animates from 0 to the actual score over ~1.2s
- [ ] Delta pill shows "+8 pts" / "−3 pts" / "Same as last month" / "Baseline month" correctly
- [ ] Three stat tiles show values with "+N vs last" deltas (when prev month exists)
- [ ] Up to 3 insights appear as bulleted list
- [ ] "Next month target" card shows focus area + projected score
- [ ] Close button (X) dismisses the modal
- [ ] "Share" button shows a placeholder alert (will be wired in step 2)
- [ ] "Download full report" generates the PDF (Pro) or shows paywall (free)
- [ ] Enable "Reduce Motion" in iOS settings → score shows final value without animation

## What this step does NOT do

- It does NOT change the PDF content itself — that's step 4
- It does NOT add the shareable summary card — that's step 2
- It does NOT add the push notification — that's step 3
- It does NOT add the blurred PDF preview — that's step 5
