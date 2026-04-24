# Aayu — Feature Walkthrough (Post-Setup, Pre-Dashboard) — Cursor Prompt

## Overview

Create a 4-slide feature walkthrough screen that appears **once**, immediately after the user completes profile setup and before they see the dashboard for the first time. This teaches users what they'll see in the app and plants awareness of Pro features.

**Inspiration:** Bevel's post-signup walkthrough (Welcome → Strain → Recovery → Sleep). Each slide has a visual gauge/graphic at the top, a title, a description, and expandable "how it works" cards below. Ours follows the same pattern adapted for fasting.

## User flow

```
Profile setup completes → Feature walkthrough (4 slides, NEW) → Dashboard
```

The walkthrough only shows **once** — gated by a `WALKTHROUGH_COMPLETE_KEY` in AsyncStorage. Returning users who have already seen it go directly to the dashboard.

## The 4 slides

| Slide | Title | Visual | Content |
|---|---|---|---|
| 1 | How Aayu works | Aayu mandala icon | Brief orientation: "Aayu tracks your fasting rhythm across four dimensions" + 4 icon-tiles (Metabolic zones, Body score, Hydration, Movement) |
| 2 | Metabolic zones | Horizontal zone timeline bar (animated) | Explains the 6 metabolic phases during a fast. "How zones work" card + "What each zone means" card with icon + name + hour range for each zone |
| 3 | Your metabolic score | Score ring gauge (animated, counts to a sample "78") | Explains MDS. "How the score is built" card listing 4 components: Duration quality, Consistency, Circadian alignment, Deep fast exposure |
| 4 | Go deeper with Pro | 3 Pro feature preview cards | Soft sell — weight projection, monthly PDF report, health integration. Button reads "Continue" (not "Subscribe") |

## File structure

Create these files:

```
app/feature-walkthrough.tsx                           — The screen route
components/walkthrough/WalkthroughSlide.tsx           — Shared slide layout (visual top, content bottom)
components/walkthrough/SlideHowAayuWorks.tsx           — Slide 1 content
components/walkthrough/SlideMetabolicZones.tsx          — Slide 2 content
components/walkthrough/SlideMetabolicScore.tsx          — Slide 3 content
components/walkthrough/SlideProFeatures.tsx             — Slide 4 content
```

---

## Context

**Stack:** React Native, Expo SDK 54, TypeScript, Expo Router v6.

**Existing patterns to match:**
- Profile setup uses `step` state + `Animated` transitions between steps
- Onboarding uses `FlatList` with `pagingEnabled`. Either pattern works here — the step-based approach is simpler for 4 slides.
- Use `fs()`, `lh()` from `@/constants/theme` for font sizes
- Use `useTheme()` for colours — never hardcode
- Use `useReducedMotion()` to skip animations
- Use `FONTS.displayLight` for headings, `FONTS.bodyRegular` for body text
- Use `hexAlpha()` from `@/constants/colors` for transparent colour variants

**Existing assets to reuse:**
- `AayuMandala` component for slide 1 visual
- `METABOLIC_ZONE_PALETTE` from `@/constants/metabolicZones` for zone colours
- Zone data structure from `components/MetabolicZoneRiver.tsx` (zone names, hour ranges, icons)
- Lucide icons: `Waves`, `Flame`, `Zap`, `Brain`, `Sparkles`, `Leaf` for zone icons
- `Clock`, `Target`, `Sunrise`, `Activity` for score component icons
- `TrendingUp`, `FileText`, `Heart` for Pro features

---

## Task 1: Add the storage key

**File:** `constants/storageKeys.ts`

Add:
```typescript
/** Set to 'true' after the user completes the feature walkthrough (shows only once). */
export const WALKTHROUGH_COMPLETE_KEY = 'aayu_walkthrough_complete';
```

---

## Task 2: Update profile-setup to route to the walkthrough

**File:** `app/profile-setup.tsx`

Find the `handleComplete` function. It currently ends with:

```typescript
router.replace('/(tabs)/(home)' as any);
```

Change this single line to:

```typescript
router.replace('/feature-walkthrough' as any);
```

This routes to the walkthrough instead of the dashboard after profile setup completes. The walkthrough itself will route to the dashboard when the user finishes it.

**Also** add the import for the key (used later by _layout to check if walkthrough is done):
```typescript
import { WALKTHROUGH_COMPLETE_KEY } from '@/constants/storageKeys';
```

---

## Task 3: Update root layout to handle the walkthrough gate

**File:** `app/_layout.tsx`

The root layout currently checks if onboarding is complete and if a profile exists to decide where to route on app launch. Add a check for the walkthrough.

Find the section where it decides the initial route (likely checking `ONBOARDING_COMPLETE_KEY` and `PROFILE_STORAGE_KEY`). After the profile check but before routing to `/(tabs)/(home)`, add:

```typescript
import { WALKTHROUGH_COMPLETE_KEY } from '@/constants/storageKeys';

// Inside the routing logic, after confirming profile exists:
const walkthroughDone = await AsyncStorage.getItem(WALKTHROUGH_COMPLETE_KEY);
if (!walkthroughDone) {
  router.replace('/feature-walkthrough' as any);
  return;
}
// ... existing route to /(tabs)/(home)
```

This ensures that if the app is killed during the walkthrough, the user sees it again on next launch (until they complete it).

---

## Task 4: Create the main walkthrough screen

**File:** `app/feature-walkthrough.tsx`

This is a step-based screen (like profile-setup) with 4 slides. It has:
- A segmented progress indicator at the top (4 bars, Bevel-style — not dots)
- Content area (each slide)
- A bottom bar with Back (slide 2+) and Next/Done buttons
- A subtle "Skip" text link on slide 1 for users who want to jump to dashboard

```tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing,
  Platform, StatusBar, ViewStyle, TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, fs } from '@/constants/theme';
import { WALKTHROUGH_COMPLETE_KEY } from '@/constants/storageKeys';
import { hexAlpha } from '@/constants/colors';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import SlideHowAayuWorks from '@/components/walkthrough/SlideHowAayuWorks';
import SlideMetabolicZones from '@/components/walkthrough/SlideMetabolicZones';
import SlideMetabolicScore from '@/components/walkthrough/SlideMetabolicScore';
import SlideProFeatures from '@/components/walkthrough/SlideProFeatures';
import type { ColorScheme } from '@/constants/colors';

const TOTAL_SLIDES = 4;

export default function FeatureWalkthroughScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const reduceMotion = useReducedMotion();
  const [slide, setSlide] = useState(1);

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(20)).current;

  const animateIn = useCallback(() => {
    if (reduceMotion) {
      contentOpacity.setValue(1);
      contentSlide.setValue(0);
      return;
    }
    contentOpacity.setValue(0);
    contentSlide.setValue(20);
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1, duration: 450, delay: 80,
        easing: Easing.out(Easing.ease), useNativeDriver: true,
      }),
      Animated.timing(contentSlide, {
        toValue: 0, duration: 450, delay: 80,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();
  }, [reduceMotion]);

  useEffect(() => { animateIn(); }, [slide]);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (slide < TOTAL_SLIDES) {
      setSlide(s => s + 1);
    } else {
      void handleComplete();
    }
  }, [slide]);

  const handleBack = useCallback(() => {
    if (slide > 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSlide(s => s - 1);
    }
  }, [slide]);

  const handleComplete = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem(WALKTHROUGH_COMPLETE_KEY, 'true');
    router.replace('/(tabs)/(home)' as any);
  }, []);

  const handleSkip = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem(WALKTHROUGH_COMPLETE_KEY, 'true');
    router.replace('/(tabs)/(home)' as any);
  }, []);

  const isLastSlide = slide === TOTAL_SLIDES;
  const styles = React.useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />

      <LinearGradient
        colors={isDark
          ? [colors.background, colors.surface, colors.background]
          : [colors.background, colors.surface, colors.background]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />

      {/* Progress bars (Bevel-style segmented) */}
      <View style={[styles.progressRow, { paddingTop: insets.top + 12 }]}>
        {Array.from({ length: TOTAL_SLIDES }, (_, i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              {
                backgroundColor: i < slide
                  ? colors.text
                  : hexAlpha(colors.text, 0.12),
              },
              i === slide - 1 && { backgroundColor: colors.text },
            ]}
          />
        ))}
      </View>

      {/* Content */}
      <Animated.View style={[
        styles.content,
        { opacity: contentOpacity, transform: [{ translateY: contentSlide }] },
      ]}>
        {slide === 1 && <SlideHowAayuWorks />}
        {slide === 2 && <SlideMetabolicZones />}
        {slide === 3 && <SlideMetabolicScore />}
        {slide === 4 && <SlideProFeatures />}
      </Animated.View>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        {slide > 1 ? (
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.surface }]}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
            <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextBtn, {
            backgroundColor: isDark ? colors.text : '#1a0d04',
          }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={[styles.nextLabel, {
            color: isDark ? colors.background : '#fff',
          }]}>
            {isLastSlide ? 'Done' : 'Next'}
          </Text>
          {isLastSlide
            ? <Check size={18} color={isDark ? colors.background : '#fff'} />
            : <ArrowRight size={18} color={isDark ? colors.background : '#fff'} />
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(colors: ColorScheme, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background } as ViewStyle,
    progressRow: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      gap: 6,
      marginBottom: 8,
    } as ViewStyle,
    progressSegment: {
      flex: 1,
      height: 3,
      borderRadius: 1.5,
    } as ViewStyle,
    content: {
      flex: 1,
      paddingHorizontal: 24,
    } as ViewStyle,
    bottomBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: 12,
    } as ViewStyle,
    backBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    skipText: {
      fontFamily: FONTS.bodyRegular,
      fontSize: fs(14),
    } as TextStyle,
    nextBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderRadius: 16,
    } as ViewStyle,
    nextLabel: {
      fontFamily: FONTS.bodyMedium,
      fontSize: fs(16),
      fontWeight: '600',
    } as TextStyle,
  });
}
```

---

## Task 5: Create `components/walkthrough/SlideHowAayuWorks.tsx`

The orientation slide. Shows the Aayu mandala and 4 feature tiles.

```tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Zap, Droplets, Footprints, Activity } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { AayuMandala } from '@/components/onboarding/AayuMandala';
import { FONTS, SPACING, fs, lh } from '@/constants/theme';
import { hexAlpha } from '@/constants/colors';
import type { ColorScheme } from '@/constants/colors';

const FEATURES = [
  { icon: Zap, label: 'Metabolic zones', sub: 'Real-time fasting phases', color: '#e07b30' },
  { icon: Activity, label: 'Body score', sub: 'Your metabolic discipline', color: '#8b6bbf' },
  { icon: Droplets, label: 'Hydration', sub: 'Daily water tracking', color: '#5b8dd9' },
  { icon: Footprints, label: 'Movement', sub: 'Steps and activity', color: '#3aaa6e' },
];

export default function SlideHowAayuWorks() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={styles.visualWrap}>
        <View style={[styles.glowRing, { borderColor: hexAlpha(colors.primary, 0.15) }]}>
          <AayuMandala size={100} color={colors.primary} animated glow />
        </View>
      </View>

      <Text style={styles.title}>How Aayu works</Text>
      <Text style={styles.body}>
        Here's what you should know to make the most of your fasting journey.
      </Text>

      <View style={styles.grid}>
        {FEATURES.map((f) => (
          <View key={f.label} style={[styles.tile, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <View style={[styles.tileIcon, { backgroundColor: hexAlpha(f.color, 0.12) }]}>
              <f.icon size={20} color={f.color} />
            </View>
            <Text style={[styles.tileLabel, { color: colors.text }]}>{f.label}</Text>
            <Text style={[styles.tileSub, { color: colors.textMuted }]}>{f.sub}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    wrap: { flex: 1, paddingTop: SPACING.xl } as ViewStyle,
    visualWrap: { alignItems: 'center', marginBottom: SPACING.xl + 8 } as ViewStyle,
    glowRing: { width: 140, height: 140, borderRadius: 70, borderWidth: 1, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
    title: { fontFamily: FONTS.displayLight, fontSize: fs(30), color: colors.text, letterSpacing: -0.3, marginBottom: SPACING.xs } as TextStyle,
    body: { fontFamily: FONTS.bodyRegular, fontSize: fs(15), lineHeight: lh(15, 1.45), color: colors.textSecondary, marginBottom: SPACING.xl } as TextStyle,
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 } as ViewStyle,
    tile: { width: '47%' as any, borderRadius: 16, borderWidth: 1, padding: 14 } as ViewStyle,
    tileIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 10 } as ViewStyle,
    tileLabel: { fontFamily: FONTS.bodyMedium, fontSize: fs(14), fontWeight: '600', marginBottom: 2 } as TextStyle,
    tileSub: { fontFamily: FONTS.bodyRegular, fontSize: fs(12), lineHeight: lh(12, 1.3) } as TextStyle,
  });
}
```

---

## Task 6: Create `components/walkthrough/SlideMetabolicZones.tsx`

Explains the metabolic zone timeline with a visual zone bar + explanation cards.

```tsx
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ScrollView, ViewStyle, TextStyle } from 'react-native';
import { Waves, Flame, Zap, Brain, Sparkles, Leaf } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { METABOLIC_ZONE_PALETTE } from '@/constants/metabolicZones';
import { FONTS, SPACING, fs, lh } from '@/constants/theme';
import { hexAlpha } from '@/constants/colors';
import type { ColorScheme } from '@/constants/colors';

const ZONES = [
  { id: 'anabolic', name: 'Fed state', hours: '0–4h', icon: Waves, color: METABOLIC_ZONE_PALETTE.anabolic, desc: 'Digesting food, insulin elevated' },
  { id: 'catabolic', name: 'Catabolic', hours: '4–12h', icon: Flame, color: METABOLIC_ZONE_PALETTE.catabolic, desc: 'Glycogen depleting, fat mobilisation starts' },
  { id: 'fatBurning', name: 'Fat burning', hours: '12–18h', icon: Zap, color: METABOLIC_ZONE_PALETTE.fatBurning, desc: 'Primary fuel switches to stored body fat' },
  { id: 'ketosis', name: 'Ketosis', hours: '18–24h', icon: Brain, color: METABOLIC_ZONE_PALETTE.ketosis, desc: 'Ketone production ramps up, mental clarity' },
  { id: 'autophagy', name: 'Autophagy', hours: '24–48h', icon: Sparkles, color: METABOLIC_ZONE_PALETTE.autophagy, desc: 'Cellular cleanup and renewal accelerates' },
  { id: 'deepRenewal', name: 'Deep renewal', hours: '48h+', icon: Leaf, color: METABOLIC_ZONE_PALETTE.deepRenewal, desc: 'Immune regeneration, stem cell activation' },
];

// Proportional widths for the zone bar (summing to 100)
const BAR_WIDTHS = [10, 20, 20, 18, 20, 12];

export default function SlideMetabolicZones() {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const revealAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) { revealAnim.setValue(1); return; }
    Animated.timing(revealAnim, {
      toValue: 1, duration: 1000, delay: 300,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, [reduceMotion]);

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Visual: zone bar */}
      <View style={styles.barSection}>
        <Text style={[styles.barLabel, { color: colors.textMuted }]}>YOUR FASTING TIMELINE</Text>
        <View style={styles.barContainer}>
          {ZONES.map((z, i) => (
            <Animated.View
              key={z.id}
              style={[
                styles.barSegment,
                {
                  backgroundColor: z.color,
                  width: `${BAR_WIDTHS[i]}%` as any,
                  opacity: revealAnim.interpolate({
                    inputRange: [0, 0.15 + i * 0.14, 0.35 + i * 0.14],
                    outputRange: [0.15, 0.15, 1],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          ))}
        </View>
        <View style={styles.barTimes}>
          <Text style={[styles.barTime, { color: colors.textMuted }]}>0h</Text>
          <Text style={[styles.barTime, { color: colors.textMuted }]}>12h</Text>
          <Text style={[styles.barTime, { color: colors.textMuted }]}>24h</Text>
          <Text style={[styles.barTime, { color: colors.textMuted }]}>48h+</Text>
        </View>
      </View>

      <Text style={styles.title}>Metabolic zones</Text>
      <Text style={styles.body}>
        During a fast, your body progresses through distinct metabolic phases. Aayu tracks which zone you're in and how long you spend there.
      </Text>

      {/* Zone list */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
        <Text style={[styles.cardHeader, { color: colors.textMuted }]}>What each zone means</Text>
        {ZONES.map((z, i) => (
          <View key={z.id} style={[styles.zoneRow, i < ZONES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}>
            <View style={[styles.zoneIconWrap, { backgroundColor: hexAlpha(z.color, 0.12) }]}>
              <z.icon size={18} color={z.color} />
            </View>
            <View style={styles.zoneTextCol}>
              <View style={styles.zoneNameRow}>
                <Text style={[styles.zoneName, { color: colors.text }]}>{z.name}</Text>
                <Text style={[styles.zoneHours, { color: colors.textMuted }]}>{z.hours}</Text>
              </View>
              <Text style={[styles.zoneDesc, { color: colors.textSecondary }]}>{z.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    wrap: { flex: 1 } as ViewStyle,
    scrollContent: { paddingTop: SPACING.lg, paddingBottom: 100 } as ViewStyle,
    barSection: { marginBottom: SPACING.xl } as ViewStyle,
    barLabel: { fontFamily: FONTS.bodyMedium, fontSize: fs(10), fontWeight: '600', letterSpacing: 1.5, marginBottom: 10 } as TextStyle,
    barContainer: { flexDirection: 'row', height: 28, borderRadius: 8, overflow: 'hidden' } as ViewStyle,
    barSegment: { height: '100%' } as ViewStyle,
    barTimes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 } as ViewStyle,
    barTime: { fontFamily: FONTS.bodyRegular, fontSize: fs(10) } as TextStyle,
    title: { fontFamily: FONTS.displayLight, fontSize: fs(28), color: colors.text, letterSpacing: -0.3, marginBottom: SPACING.xs } as TextStyle,
    body: { fontFamily: FONTS.bodyRegular, fontSize: fs(14), lineHeight: lh(14, 1.45), color: colors.textSecondary, marginBottom: SPACING.lg } as TextStyle,
    card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' } as ViewStyle,
    cardHeader: { fontFamily: FONTS.bodyMedium, fontSize: fs(12), fontWeight: '600', letterSpacing: 0.3, padding: 14, paddingBottom: 8 } as TextStyle,
    zoneRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 } as ViewStyle,
    zoneIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
    zoneTextCol: { flex: 1 } as ViewStyle,
    zoneNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } as ViewStyle,
    zoneName: { fontFamily: FONTS.bodyMedium, fontSize: fs(14), fontWeight: '600' } as TextStyle,
    zoneHours: { fontFamily: FONTS.bodyRegular, fontSize: fs(12) } as TextStyle,
    zoneDesc: { fontFamily: FONTS.bodyRegular, fontSize: fs(12), lineHeight: lh(12, 1.35), marginTop: 2 } as TextStyle,
  });
}
```

---

## Task 7: Create `components/walkthrough/SlideMetabolicScore.tsx`

Explains the Metabolic Discipline Score with an animated ring gauge and 4 component cards.

```tsx
import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ScrollView, ViewStyle, TextStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Clock, Target, Sunrise, Flame } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { FONTS, SPACING, fs, lh } from '@/constants/theme';
import { hexAlpha } from '@/constants/colors';
import type { ColorScheme } from '@/constants/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SAMPLE_SCORE = 78;
const SIZE = 160;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMF = 2 * Math.PI * RADIUS;

const COMPONENTS = [
  { icon: Clock, label: 'Duration quality', sub: 'How long your average fast lasts', max: '30 pts', color: '#e07b30' },
  { icon: Target, label: 'Consistency', sub: 'How regularly you fast each week', max: '25 pts', color: '#5b8dd9' },
  { icon: Sunrise, label: 'Circadian alignment', sub: 'How well fasts align with your sleep cycle', max: '20 pts', color: '#d4a017' },
  { icon: Flame, label: 'Deep fast exposure', sub: 'Time spent in ketosis and autophagy zones', max: '25 pts', color: '#8b6bbf' },
];

export default function SlideMetabolicScore() {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(reduceMotion ? SAMPLE_SCORE : 0);

  useEffect(() => {
    if (reduceMotion) {
      progressAnim.setValue(1);
      setDisplayScore(SAMPLE_SCORE);
      return;
    }
    const listener = progressAnim.addListener(({ value }) => {
      setDisplayScore(Math.round(value * SAMPLE_SCORE));
    });
    Animated.timing(progressAnim, {
      toValue: 1, duration: 1200, delay: 300,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
    return () => progressAnim.removeListener(listener);
  }, [reduceMotion]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMF, CIRCUMF * (1 - SAMPLE_SCORE / 100)],
  });

  const scoreColor = '#e8a84c';

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Score gauge */}
      <View style={styles.gaugeWrap}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={hexAlpha(colors.text, 0.08)} strokeWidth={STROKE} fill="none" />
          <AnimatedCircle
            cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
            stroke={scoreColor} strokeWidth={STROKE} fill="none"
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMF} ${CIRCUMF}`}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <View style={styles.gaugeCenter}>
          <Text style={[styles.gaugeValue, { color: scoreColor }]}>{displayScore}</Text>
          <Text style={[styles.gaugeMax, { color: colors.textMuted }]}>/ 100</Text>
        </View>
      </View>

      <Text style={styles.title}>Metabolic score</Text>
      <Text style={styles.body}>
        Your Metabolic Discipline Score measures the quality and consistency of your fasting practice. It's built from four components, scored out of 100.
      </Text>

      {/* How score is calculated */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
        <Text style={[styles.cardHeader, { color: colors.textMuted }]}>How the score is built</Text>
        {COMPONENTS.map((c, i) => (
          <View key={c.label} style={[styles.compRow, i < COMPONENTS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}>
            <View style={[styles.compIconWrap, { backgroundColor: hexAlpha(c.color, 0.12) }]}>
              <c.icon size={18} color={c.color} />
            </View>
            <View style={styles.compTextCol}>
              <Text style={[styles.compLabel, { color: colors.text }]}>{c.label}</Text>
              <Text style={[styles.compSub, { color: colors.textSecondary }]}>{c.sub}</Text>
            </View>
            <Text style={[styles.compMax, { color: colors.textMuted }]}>{c.max}</Text>
          </View>
        ))}
      </View>

      {/* How to interpret */}
      <View style={[styles.interpretCard, { backgroundColor: hexAlpha(scoreColor, 0.06), borderColor: hexAlpha(scoreColor, 0.2) }]}>
        <Text style={[styles.interpretHeader, { color: scoreColor }]}>How to interpret your score</Text>
        <Text style={[styles.interpretBody, { color: colors.textSecondary }]}>
          A high score means you're fasting consistently, at good durations, aligned with your circadian rhythm, and spending meaningful time in deep metabolic zones. Aim for steady improvement month over month — not perfection.
        </Text>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    wrap: { flex: 1 } as ViewStyle,
    scrollContent: { paddingTop: SPACING.lg, paddingBottom: 100 } as ViewStyle,
    gaugeWrap: { alignItems: 'center', marginBottom: SPACING.xl } as ViewStyle,
    gaugeCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
    gaugeValue: { fontFamily: FONTS.displayLight, fontSize: fs(48), fontWeight: '800', letterSpacing: -2 } as TextStyle,
    gaugeMax: { fontFamily: FONTS.bodyRegular, fontSize: fs(13), marginTop: -4 } as TextStyle,
    title: { fontFamily: FONTS.displayLight, fontSize: fs(28), color: colors.text, letterSpacing: -0.3, marginBottom: SPACING.xs } as TextStyle,
    body: { fontFamily: FONTS.bodyRegular, fontSize: fs(14), lineHeight: lh(14, 1.45), color: colors.textSecondary, marginBottom: SPACING.lg } as TextStyle,
    card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 16 } as ViewStyle,
    cardHeader: { fontFamily: FONTS.bodyMedium, fontSize: fs(12), fontWeight: '600', letterSpacing: 0.3, padding: 14, paddingBottom: 8 } as TextStyle,
    compRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 } as ViewStyle,
    compIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
    compTextCol: { flex: 1 } as ViewStyle,
    compLabel: { fontFamily: FONTS.bodyMedium, fontSize: fs(14), fontWeight: '600' } as TextStyle,
    compSub: { fontFamily: FONTS.bodyRegular, fontSize: fs(12), lineHeight: lh(12, 1.3), marginTop: 2 } as TextStyle,
    compMax: { fontFamily: FONTS.bodyMedium, fontSize: fs(12), fontWeight: '600' } as TextStyle,
    interpretCard: { borderRadius: 16, borderWidth: 1, padding: 16 } as ViewStyle,
    interpretHeader: { fontFamily: FONTS.bodyMedium, fontSize: fs(13), fontWeight: '600', marginBottom: 8 } as TextStyle,
    interpretBody: { fontFamily: FONTS.bodyRegular, fontSize: fs(13), lineHeight: lh(13, 1.5) } as TextStyle,
  });
}
```

---

## Task 8: Create `components/walkthrough/SlideProFeatures.tsx`

The soft Pro sell. Shows 3 Pro features with preview cards. Not a hard paywall — just awareness planting. Button says "Continue" to proceed to the dashboard.

```tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, ViewStyle, TextStyle } from 'react-native';
import { TrendingUp, FileText, Heart, Lock, Sparkles } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, fs, lh } from '@/constants/theme';
import { hexAlpha } from '@/constants/colors';
import type { ColorScheme } from '@/constants/colors';

const PRO_FEATURES = [
  {
    icon: TrendingUp,
    title: 'Weight projection',
    description: 'See where your weight is heading based on your fasting consistency and metabolic data.',
    color: '#3aaa6e',
  },
  {
    icon: FileText,
    title: 'Monthly PDF report',
    description: 'A detailed analysis of your fasting journey — score breakdown, behaviour patterns, and personalised next-month plan.',
    color: '#e8a84c',
  },
  {
    icon: Heart,
    title: 'Health integration',
    description: 'Sync with Apple Health or Google Health Connect for steps, weight, and active energy from your wearables.',
    color: '#c05050',
  },
];

export default function SlideProFeatures() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.headerWrap}>
        <View style={[styles.proBadge, { backgroundColor: hexAlpha(colors.primary, 0.12) }]}>
          <Sparkles size={14} color={colors.primary} />
          <Text style={[styles.proBadgeText, { color: colors.primary }]}>AAYU PRO</Text>
        </View>
      </View>

      <Text style={styles.title}>Go deeper</Text>
      <Text style={styles.body}>
        Everything you need is free. When you're ready for more, Pro unlocks advanced insights to accelerate your progress.
      </Text>

      {PRO_FEATURES.map((f) => (
        <View key={f.title} style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <View style={styles.featureHeader}>
            <View style={[styles.featureIconWrap, { backgroundColor: hexAlpha(f.color, 0.12) }]}>
              <f.icon size={22} color={f.color} />
            </View>
            <View style={[styles.lockPill, { backgroundColor: hexAlpha(colors.primary, 0.08) }]}>
              <Lock size={10} color={colors.primary} />
              <Text style={[styles.lockText, { color: colors.primary }]}>PRO</Text>
            </View>
          </View>
          <Text style={[styles.featureTitle, { color: colors.text }]}>{f.title}</Text>
          <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{f.description}</Text>
        </View>
      ))}

      <Text style={[styles.footnote, { color: colors.textMuted }]}>
        You can upgrade anytime from Settings. No commitment required.
      </Text>
    </ScrollView>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    wrap: { flex: 1 } as ViewStyle,
    scrollContent: { paddingTop: SPACING.xl, paddingBottom: 100 } as ViewStyle,
    headerWrap: { flexDirection: 'row', marginBottom: SPACING.md } as ViewStyle,
    proBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 } as ViewStyle,
    proBadgeText: { fontFamily: FONTS.bodyMedium, fontSize: fs(11), fontWeight: '700', letterSpacing: 1.2 } as TextStyle,
    title: { fontFamily: FONTS.displayLight, fontSize: fs(30), color: colors.text, letterSpacing: -0.3, marginBottom: SPACING.xs } as TextStyle,
    body: { fontFamily: FONTS.bodyRegular, fontSize: fs(15), lineHeight: lh(15, 1.45), color: colors.textSecondary, marginBottom: SPACING.xl } as TextStyle,
    featureCard: { borderRadius: 16, borderWidth: 1, padding: 18, marginBottom: 12 } as ViewStyle,
    featureHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } as ViewStyle,
    featureIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
    lockPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 } as ViewStyle,
    lockText: { fontFamily: FONTS.bodyMedium, fontSize: fs(9), fontWeight: '800', letterSpacing: 0.8 } as TextStyle,
    featureTitle: { fontFamily: FONTS.bodyMedium, fontSize: fs(17), fontWeight: '700', letterSpacing: -0.2, marginBottom: 6 } as TextStyle,
    featureDesc: { fontFamily: FONTS.bodyRegular, fontSize: fs(13), lineHeight: lh(13, 1.45) } as TextStyle,
    footnote: { fontFamily: FONTS.bodyRegular, fontSize: fs(12), textAlign: 'center', marginTop: SPACING.md } as TextStyle,
  });
}
```

---

## What NOT to change

1. **Onboarding slides** — Completely untouched by this prompt
2. **Profile setup** — Only the final `router.replace` destination changes (from `/(tabs)/(home)` to `/feature-walkthrough`)
3. **Dashboard/tabs** — No changes to any tab screens
4. **MetabolicZoneRiver component** — We reference its data and colours but don't modify it
5. **RevenueCat / paywall** — The Pro slide is informational only — no paywall is presented here

---

## Verification checklist

- [ ] `npx tsc --noEmit` passes
- [ ] Complete profile setup → screen routes to feature walkthrough (NOT dashboard)
- [ ] 4 progress bars visible at top (Bevel-style segmented, not dots)
- [ ] Slide 1: Mandala icon + "How Aayu works" + 4 feature tiles in 2×2 grid
- [ ] Slide 1: "Skip" text link visible (bottom left, where back button would be)
- [ ] Tap Skip → walkthrough dismissed, dashboard loads
- [ ] Tap Next → slide 2 animates in
- [ ] Slide 2: Zone bar animates with staggered reveal + "What each zone means" card with 6 zones
- [ ] Slide 2: Back arrow visible (bottom left)
- [ ] Slide 3: Score ring counts up from 0 to 78 + "How the score is built" card with 4 components
- [ ] Slide 4: "AAYU PRO" badge + "Go deeper" + 3 Pro feature cards with Lock badges
- [ ] Slide 4: Button reads "Done" with checkmark icon
- [ ] Tap Done → walkthrough marked complete in AsyncStorage → dashboard loads
- [ ] Kill and reopen app → dashboard loads directly (walkthrough does NOT show again)
- [ ] New user: onboarding → profile setup → walkthrough → dashboard (full flow works end to end)
- [ ] Dark mode → all slides render correctly with theme colours
- [ ] Light mode → all slides render correctly with theme colours
- [ ] Enable "Reduce Motion" → no animations, all content appears instantly
- [ ] Zone bar colours match the in-app fasting timer zones exactly (using METABOLIC_ZONE_PALETTE)

## Design notes

**The Pro slide (slide 4) is deliberately soft.** The copy opens with "Everything you need is free" — this builds trust. The Pro features are presented as "when you're ready" additions, not locked essentials. The button says "Continue" not "Subscribe." There's no pricing, no urgency, no countdown timer. This is awareness planting, not a hard sell. The actual paywall lives inside the app when users naturally encounter Pro features.

**The progress bars use Bevel's segmented style** (4 horizontal bars) rather than your onboarding's dot indicators. This visually separates the walkthrough from the onboarding and signals "this is a different kind of experience — learn, don't fill forms."

**Scrollable slides 2-4:** Unlike the onboarding slides which are single-screen, the walkthrough slides have content cards below the fold. These slides are wrapped in `ScrollView` because the zone list (6 items) and component list (4 items) won't fit on smaller phones without scrolling. The scroll content has `paddingBottom: 100` to clear the bottom nav bar.
