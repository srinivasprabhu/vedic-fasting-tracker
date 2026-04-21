# Aayu — Onboarding & Profile Setup Refinement — Cursor Prompt

## Overview

Three changes across two files:

1. **Rework onboarding slide 3** — Reframe "Begin Your Path" as "Privacy by design" with sign-in/guest options
2. **Insert Step 1.1** in profile-setup — After name input, show a personalised "Nice to meet you, [name]!" welcome screen
3. **Insert Step 1.2** in profile-setup — After the welcome, show a visual explaining why tracking fasts matters (metabolic zone timeline graphic)

**Slides 1 and 2 of onboarding stay exactly as they are.** No changes to "Welcome to Aayu" or "Track Your Fasts".

---

## Context

**Stack:** React Native, Expo SDK 54, TypeScript, Expo Router v6.

**Files to modify:**
- `app/onboarding.tsx` — Change slide 3 content only
- `app/profile-setup.tsx` — Insert 2 new steps after step 1 (name), bump TOTAL_STEPS from 14 to 16
- Create `components/profile-setup/StepWelcome.tsx` — The personalised greeting
- Create `components/profile-setup/StepWhyTrack.tsx` — The "why tracking matters" visual

**Files NOT to touch:**
- `components/onboarding/OnboardingSlide.tsx` — Slide renderer stays as-is
- `components/onboarding/AuthButtons.tsx` — Auth button component stays as-is
- `components/profile-setup/Step1Name.tsx` — Name input stays as-is
- Any other profile-setup step components

**Design system:**
- Use `fs()` and `lh()` from `@/constants/theme` for all font sizes
- Use `colors` from `useTheme()` — never hardcode colours
- Use `useReducedMotion()` to skip animations when the user has Reduce Motion enabled
- Use `FONTS.displayLight` for headings, `FONTS.bodyRegular` for body text
- Use `hexAlpha()` from `@/constants/colors` for transparent colour variants

---

## Change 1: Rework onboarding slide 3 — "Privacy by design"

**File:** `app/onboarding.tsx`

### 1a. Update the slide data

Find the third slide object in `buildOnboardingSlides()`. It currently reads:

```typescript
{
  id: 'begin',
  tag: 'YOUR JOURNEY STARTS NOW',
  title: 'Begin Your',
  titleAccent: 'Path',
  body: 'Sign in to save your progress across devices, or start as a guest. Your transformation begins now.',
  icon: '',
  iconComponent: <Sparkles size={56} color={colors.primary} strokeWidth={1.5} />,
  ...
}
```

Replace it with:

```typescript
{
  id: 'privacy',
  tag: 'YOUR DATA STAYS YOURS',
  title: 'Privacy by',
  titleAccent: 'Design',
  body: 'Your health data stays on your device. We never sell or share your information. Sign in only to sync across devices — or start as a guest.',
  icon: '',
  iconComponent: <Shield size={56} color={colors.primary} strokeWidth={1.5} />,
  bgColors: isDark
    ? ([colors.background, colors.surface, colors.surfaceWarm] as const)
    : ([colors.background, colors.surface, colors.surfaceWarm] as const),
  accentColor: colors.primary,
  iconBg: iconBgPrimary,
}
```

### 1b. Add the Shield import

At the top of the file, find the lucide-react-native imports:

```typescript
import { Flame, Sparkles, ArrowRight } from 'lucide-react-native';
```

Add `Shield`:

```typescript
import { Flame, Sparkles, ArrowRight, Shield } from 'lucide-react-native';
```

### 1c. No other changes to onboarding.tsx

The `isLastSlide` check, the `AuthButtons` rendering, the `handleSkip`, and all other logic stay exactly the same. The auth buttons (Apple, Google, Continue as guest) already render on the last slide — and slide 3 is still the last slide. Nothing structural changes.

---

## Change 2: Create `components/profile-setup/StepWelcome.tsx`

This is the warm greeting that appears immediately after the user enters their name. It shows "Nice to meet you, [name]!" with a waving hand icon and a brief tagline about Aayu. The screen auto-advances after 2.5 seconds OR the user can tap Continue to proceed immediately.

```tsx
import React, { useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing,
  ViewStyle, TextStyle,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { FONTS, SPACING, fs, lh } from '@/constants/theme';
import { hexAlpha } from '@/constants/colors';

interface StepWelcomeProps {
  name: string;
  onAutoAdvance: () => void;
}

export const StepWelcome: React.FC<StepWelcomeProps> = ({ name, onAutoAdvance }) => {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const handScale = useRef(new Animated.Value(0.5)).current;
  const handOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
      handScale.setValue(1);
      handOpacity.setValue(1);
    } else {
      // Hand appears first
      Animated.parallel([
        Animated.timing(handOpacity, {
          toValue: 1, duration: 400, delay: 100, useNativeDriver: true,
        }),
        Animated.spring(handScale, {
          toValue: 1, delay: 100, speed: 10, bounciness: 10, useNativeDriver: true,
        }),
      ]).start();

      // Text fades in after
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1, duration: 500, delay: 350,
          easing: Easing.out(Easing.ease), useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0, duration: 500, delay: 350,
          easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
      ]).start();
    }

    // Auto-advance after 2.5 seconds
    const timer = setTimeout(() => {
      onAutoAdvance();
    }, 2500);

    return () => clearTimeout(timer);
  }, [reduceMotion, onAutoAdvance]);

  const displayName = name.trim() || 'Friend';

  return (
    <View style={styles.wrap}>
      <Animated.View style={[
        styles.handWrap,
        {
          opacity: handOpacity,
          transform: [{ scale: handScale }],
          backgroundColor: hexAlpha(colors.primary, 0.08),
          borderColor: hexAlpha(colors.primary, 0.18),
        },
      ]}>
        <Text style={styles.handEmoji}>👋</Text>
      </Animated.View>

      <Animated.View style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}>
        <Text style={[styles.heading, { color: colors.text }]}>
          Nice to meet you,{'\n'}{displayName}!
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Aayu is your personal fasting companion — helping you build metabolic discipline with science-backed tracking and insights.
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: 80,
  } as ViewStyle,
  handWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  } as ViewStyle,
  handEmoji: {
    fontSize: 32,
  } as TextStyle,
  heading: {
    fontFamily: FONTS.displayLight,
    fontSize: fs(32),
    lineHeight: lh(32, 1.15),
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: SPACING.md,
  } as TextStyle,
  body: {
    fontFamily: FONTS.bodyRegular,
    fontSize: fs(15),
    lineHeight: lh(15, 1.45),
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  } as TextStyle,
});
```

**Key details:**
- Auto-advances after 2.5s via `onAutoAdvance` callback — this calls `handleNext()` from the parent
- The Continue button in the parent's footer still works (user can tap it to skip ahead immediately)
- If Reduce Motion is enabled, everything appears instantly (no timed delays on content, but the auto-advance timer still runs at 2.5s)
- Uses the user's actual name from the name input step

---

## Change 3: Create `components/profile-setup/StepWhyTrack.tsx`

This step shows a simple visual comparison: an untracked fast (just a basic timer) vs a tracked fast with Aayu (metabolic zones revealed). The metaphor: "When you track, you see what's actually happening in your body."

The visual uses the metabolic zone colours already defined in the app (`ZONE_DEFS` from `useFastTimer.ts`) to show 5 coloured horizontal bands representing the metabolic phases during a 24-hour fast. It's a simplified version of the MetabolicZoneRiver concept.

```tsx
import React, { useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing,
  ViewStyle, TextStyle,
} from 'react-native';
import Svg, { Rect, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { FONTS, SPACING, fs, lh } from '@/constants/theme';
import { hexAlpha } from '@/constants/colors';
import type { ColorScheme } from '@/constants/colors';

const ZONES = [
  { name: 'Fed state',     hours: '0–4h',   color: '#5b8dd9', width: 16 },
  { name: 'Fat burning',   hours: '4–12h',  color: '#d4a017', width: 34 },
  { name: 'Ketosis',       hours: '12–18h', color: '#e07b30', width: 25 },
  { name: 'Deep ketosis',  hours: '18–24h', color: '#c05050', width: 15 },
  { name: 'Autophagy',     hours: '24h+',   color: '#8b6bbf', width: 10 },
];

export const StepWhyTrack: React.FC = () => {
  const { colors, isDark } = useTheme();
  const reduceMotion = useReducedMotion();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const revealAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
      revealAnim.setValue(1);
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 500, delay: 100,
        easing: Easing.out(Easing.ease), useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 500, delay: 100,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();

    // Zone bars reveal with a staggered effect
    Animated.timing(revealAnim, {
      toValue: 1, duration: 800, delay: 500,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, [reduceMotion]);

  const barWidth = revealAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.wrap}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <Text style={styles.heading}>
          See what's happening{'\n'}inside your body
        </Text>
        <Text style={styles.subheading}>
          Every hour of fasting triggers different metabolic phases. Aayu shows you exactly where you are.
        </Text>
      </Animated.View>

      {/* Comparison: Without tracking vs With tracking */}
      <View style={styles.comparisonWrap}>

        {/* WITHOUT tracking — greyed out bar */}
        <View style={styles.comparisonCard}>
          <View style={styles.comparisonHeader}>
            <EyeOff size={14} color={colors.textMuted} />
            <Text style={[styles.comparisonLabel, { color: colors.textMuted }]}>Without tracking</Text>
          </View>
          <View style={[styles.greyBar, { backgroundColor: hexAlpha(colors.textMuted, 0.15) }]}>
            <Text style={[styles.greyBarText, { color: colors.textMuted }]}>Just a timer...</Text>
          </View>
        </View>

        {/* WITH tracking — coloured zone bars */}
        <View style={styles.comparisonCard}>
          <View style={styles.comparisonHeader}>
            <Eye size={14} color={colors.primary} />
            <Text style={[styles.comparisonLabel, { color: colors.primary }]}>With Aayu</Text>
          </View>

          {/* Zone bar — animated reveal */}
          <View style={styles.zoneBarContainer}>
            {ZONES.map((zone, i) => (
              <Animated.View
                key={zone.name}
                style={[
                  styles.zoneSegment,
                  {
                    backgroundColor: zone.color,
                    width: `${zone.width}%` as any,
                    opacity: revealAnim.interpolate({
                      inputRange: [0, 0.3 + i * 0.14, 0.5 + i * 0.14],
                      outputRange: [0, 0, 1],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              />
            ))}
          </View>

          {/* Zone legend */}
          <View style={styles.legendWrap}>
            {ZONES.map((zone) => (
              <View key={zone.name} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: zone.color }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                  {zone.name}
                </Text>
                <Text style={[styles.legendHours, { color: colors.textMuted }]}>
                  {zone.hours}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={styles.footnote}>
          Based on metabolic research. Individual timing may vary.
        </Text>
      </Animated.View>
    </View>
  );
};

function makeStyles(colors: ColorScheme, isDark: boolean) {
  return StyleSheet.create({
    wrap: {
      flex: 1,
      paddingTop: SPACING.xl,
    } as ViewStyle,
    heading: {
      fontFamily: FONTS.displayLight,
      fontSize: fs(28),
      lineHeight: lh(28, 1.15),
      color: colors.text,
      letterSpacing: -0.3,
      marginBottom: SPACING.xs,
    } as TextStyle,
    subheading: {
      fontFamily: FONTS.bodyRegular,
      fontSize: fs(14),
      lineHeight: lh(14, 1.4),
      color: colors.textSecondary,
      marginBottom: SPACING.xl + 8,
    } as TextStyle,
    comparisonWrap: {
      gap: 14,
      marginBottom: SPACING.lg,
    } as ViewStyle,
    comparisonCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.card,
      padding: 14,
    } as ViewStyle,
    comparisonHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 10,
    } as ViewStyle,
    comparisonLabel: {
      fontFamily: FONTS.bodyMedium,
      fontSize: fs(12),
      fontWeight: '600',
      letterSpacing: 0.3,
    } as TextStyle,
    greyBar: {
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    greyBarText: {
      fontFamily: FONTS.bodyRegular,
      fontSize: fs(12),
      fontStyle: 'italic',
    } as TextStyle,
    zoneBarContainer: {
      flexDirection: 'row',
      height: 32,
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 12,
    } as ViewStyle,
    zoneSegment: {
      height: '100%',
    } as ViewStyle,
    legendWrap: {
      gap: 4,
    } as ViewStyle,
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    } as ViewStyle,
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    } as ViewStyle,
    legendText: {
      fontFamily: FONTS.bodyRegular,
      fontSize: fs(12),
      flex: 1,
    } as TextStyle,
    legendHours: {
      fontFamily: FONTS.bodyRegular,
      fontSize: fs(11),
    } as TextStyle,
    footnote: {
      fontFamily: FONTS.bodyRegular,
      fontSize: fs(11),
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: SPACING.sm,
    } as TextStyle,
  });
}
```

**Key details:**
- Shows two comparison cards: a flat grey bar ("Without tracking — just a timer...") vs a colourful metabolic zone bar ("With Aayu")
- Uses the same zone colours as the in-app fasting timer (`#5b8dd9`, `#d4a017`, `#e07b30`, `#c05050`, `#8b6bbf`)
- Zone segments animate in with a staggered reveal (each band fades in left to right)
- Legend below the zone bar explains each phase with dot + name + hour range
- "Based on metabolic research" footnote for honesty
- Fully uses theme tokens — works in both dark and light mode
- Respects `useReducedMotion`

---

## Change 4: Wire the new steps into `app/profile-setup.tsx`

### 4a. Update TOTAL_STEPS

Change:
```typescript
const TOTAL_STEPS = 14;
```
To:
```typescript
const TOTAL_STEPS = 16;
```

### 4b. Add imports

Add at the top with the other step imports:
```typescript
import { StepWelcome }    from '@/components/profile-setup/StepWelcome';
import { StepWhyTrack }   from '@/components/profile-setup/StepWhyTrack';
```

### 4c. Handle auto-advance for the welcome step

Add a callback for the welcome screen's auto-advance feature. Place it near the other handlers (`handleBack`, `handleNext`):

```typescript
const handleWelcomeAutoAdvance = useCallback(() => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  setStep(3); // Advance from step 2 (welcome) to step 3 (why track)
}, []);
```

### 4d. Update the step rendering

Find the section that renders the current step content (probably a `switch` statement or a series of conditionals). The current mapping is:

```
Step 1  → Step1Name (name input)
Step 2  → StepGoal (purpose)
Step 3  → StepSex
Step 4  → StepAge
...etc
```

Insert the two new steps after step 1:

```
Step 1  → Step1Name (name input)        ← unchanged
Step 2  → StepWelcome (NEW)             ← personalised greeting
Step 3  → StepWhyTrack (NEW)            ← why tracking matters visual
Step 4  → StepGoal (purpose)            ← was step 2
Step 5  → StepSex                       ← was step 3
Step 6  → StepAge                       ← was step 4
Step 7  → StepHeight                    ← was step 5
Step 8  → StepCurrentWeight             ← was step 6
Step 9  → StepTargetWeight              ← was step 7
Step 10 → StepActivity                  ← was step 8
Step 11 → StepLastMeal                  ← was step 9
Step 12 → StepHealthConcerns            ← was step 10
Step 13 → StepSafety                    ← was step 11
Step 14 → StepExperience                ← was step 12
Step 15 → StepBuildingPlan              ← was step 13
Step 16 → StepPlanReveal                ← was step 14
```

In the step rendering logic, add:

```tsx
{step === 2 && (
  <StepWelcome
    name={name}
    onAutoAdvance={handleWelcomeAutoAdvance}
  />
)}
{step === 3 && (
  <StepWhyTrack />
)}
```

And shift every existing step number up by 2 (step 2 becomes step 4, step 3 becomes step 5, etc).

### 4e. Update the `canProceed` logic

Find the `canProceed` useMemo. Add cases for the two new steps and shift existing cases:

```typescript
const canProceed = useMemo(() => {
  switch (step) {
    case 1:  return name.trim().length > 0;
    case 2:  return true;   // Welcome screen — always can proceed (also auto-advances)
    case 3:  return true;   // Why track — always can proceed
    case 4:  return purpose !== null && !isMinorWeightLoss;  // was case 2
    case 5:  return sex !== null;                             // was case 3
    case 6:  return age >= 14 && age <= 80;                   // was case 4
    case 7:  return parseFloat(heightCm) > 50;                // was case 5
    case 8:  return parseFloat(currentWeight) > 0;            // was case 6
    case 9:  return !isUnderweightLosingMore;                  // was case 7
    case 10: return activityLevel !== null;                    // was case 8
    case 11: return lastMealTime !== null;                     // was case 9
    case 12: return true;                                      // was case 10
    case 13: return true;                                      // was case 11
    case 14: return fastingLevel !== null;                     // was case 12
    case 15: return false;  // Building plan animation         // was case 13
    case 16: return true;   // Plan reveal                     // was case 14
    default: return false;
  }
}, [step, name, purpose, sex, age, heightCm, currentWeight, isMinorWeightLoss, isUnderweightLosingMore, activityLevel, lastMealTime, fastingLevel]);
```

### 4f. Update the `handleBack` logic

The current `handleBack` has a special case for skipping the building screen:

```typescript
const handleBack = useCallback(() => {
  if (step > 1) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(s => s === 14 ? 12 : s - 1);
  }
}, [step]);
```

Update the building-screen skip to reflect the new numbering:

```typescript
const handleBack = useCallback(() => {
  if (step > 1) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(s => s === 16 ? 14 : s - 1);
  }
}, [step]);
```

### 4g. Update the Continue button visibility

The welcome screen (step 2) should show the Continue button but it's optional (the screen auto-advances). The "why track" screen (step 3) should show Continue normally.

If there's any special logic that hides the Continue button for specific steps (like the building plan animation at the old step 13, now step 15), make sure it references the correct new step number.

Find the Continue button rendering. It probably checks for the building-plan step:

```typescript
// If something like this exists:
{step !== 13 && (
  <TouchableOpacity ... onPress={handleNext}>
    <Text>Continue</Text>
  </TouchableOpacity>
)}
```

Update to:
```typescript
{step !== 15 && (
  <TouchableOpacity ... onPress={handleNext}>
    <Text>Continue</Text>
  </TouchableOpacity>
)}
```

### 4h. Update the progress bar to hide for the welcome step

The welcome screen (step 2) is a transition moment — showing a progress bar with "2/16" feels mechanical and breaks the warmth. Consider hiding the progress bar for step 2 only.

If there's a `SetupHeader` component that shows the progress bar, you can conditionally hide it:

```tsx
{step !== 2 && (
  <SetupHeader
    step={step}
    totalSteps={TOTAL_STEPS}
    onBack={handleBack}
    showBack={step > 1}
  />
)}
```

Or if `SetupHeader` is always rendered, pass a `hideProgress` prop:
```tsx
<SetupHeader
  step={step}
  totalSteps={TOTAL_STEPS}
  onBack={handleBack}
  showBack={step > 1 && step !== 2}
  hideProgress={step === 2}
/>
```

---

## What NOT to change

1. **Onboarding slides 1 and 2** — "Welcome to Aayu" and "Track Your Fasts" stay exactly as they are
2. **AuthButtons component** — The sign-in buttons stay as-is, they just now appear under "Privacy by Design" instead of "Begin Your Path"
3. **Step1Name component** — The name input screen is unchanged
4. **Any step after StepGoal** — All existing steps (sex, age, height, weight, etc.) are unchanged in content, just renumbered
5. **The `handleComplete` function** — This still fires at the final step (now step 16) and saves the profile exactly as before

---

## Verification checklist

### Onboarding
- [ ] Slide 1: "Welcome to Aayu" — unchanged
- [ ] Slide 2: "Track Your Fasts" — unchanged
- [ ] Slide 3: Now shows Shield icon, "Privacy by Design" title, privacy-focused body copy
- [ ] Slide 3: Auth buttons (Apple, Google, Guest) render correctly below the text
- [ ] Tapping "Continue as guest" navigates to profile-setup as before

### Profile setup
- [ ] Step 1: Name input works as before
- [ ] Tap Continue → Step 2: "Nice to meet you, [name]!" greeting appears with wave emoji
- [ ] The greeting auto-advances to step 3 after ~2.5 seconds
- [ ] Tapping Continue during the greeting also advances immediately
- [ ] Step 3: "See what's happening inside your body" screen appears
- [ ] Zone bar animates in with staggered reveal (each coloured segment fades in left to right)
- [ ] The "Without tracking" vs "With Aayu" comparison is clear and readable
- [ ] Tap Continue → Step 4: Purpose selection ("What's your goal?") appears
- [ ] All subsequent steps work normally with correct numbering
- [ ] Progress bar shows correct position (step/16)
- [ ] Progress bar is hidden or neutral on the welcome screen (step 2)
- [ ] Back button from step 3 goes to step 2 (welcome), back from step 2 goes to step 1 (name)
- [ ] Building plan animation still shows at the correct step (now step 15)
- [ ] Plan reveal still shows at the correct step (now step 16)
- [ ] Completing setup saves profile and navigates to home tab
- [ ] Enable "Reduce Motion" → all animations skip, content appears instantly

### Edge cases
- [ ] Empty name → greeting shows "Nice to meet you, Friend!"
- [ ] Very long name → greeting text wraps correctly
- [ ] Dark mode → all screens use correct theme colours
- [ ] Light mode → all screens use correct theme colours
