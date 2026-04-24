# Aayu — Replace StepWhyTrack with Hero Inspiration Screen

## What you're changing

Replace the verbose "See what's happening inside your body" metabolic zone comparison screen (Step 3 of profile setup) with a simpler, motivational hero-image screen. The metabolic zone education now lives in the feature walkthrough (post-setup), so this profile-setup step no longer needs to teach — it just needs to inspire.

## Why

The current StepWhyTrack shows a "Without tracking vs With Aayu" zone bar comparison with a 5-item legend. The feature walkthrough (slide 2) already has a more detailed version with the same zone bar, 6 zones, descriptions, and hour ranges. Showing both is redundant. This step should instead be an emotional beat — "you made the right choice to start" — before the user dives into 12 steps of profile questions.

## What the new screen looks like

A full-bleed hero image (the cellular renewal visual at `assets/images/setup-hero.png`) taking up the top ~55% of the screen, with a bold headline and a short supporting line below it. Minimal, confident, warm. Similar energy to the screenshot reference: "Renew from within. Science agrees."

**Copy:**
- Headline: "Renew from within.\nScience agrees."
- Body: "Fasting activates your body's natural ability to heal and regenerate. Let's set up your personal plan."

No zone bars, no comparison cards, no legends. Just the image, the words, and the Continue button.

---

## File to modify

**`components/profile-setup/StepWhyTrack.tsx`** — Replace the entire component body. Keep the file name and export so `profile-setup.tsx` doesn't need any import changes.

## New component

```tsx
import React, { useRef, useEffect } from 'react';
import {
  View, Text, Image, StyleSheet, Animated, Easing,
  ViewStyle, TextStyle, ImageStyle, Dimensions,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { FONTS, SPACING, fs, lh } from '@/constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');

// The hero image placed at assets/images/setup-hero.png
const HERO_IMAGE = require('@/assets/images/setup-hero.png');

export const StepWhyTrack: React.FC = () => {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const imgScale = useRef(new Animated.Value(1.08)).current;
  const imgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
      imgScale.setValue(1);
      imgOpacity.setValue(1);
      return;
    }

    // Image fades in with a subtle scale-down (1.08 → 1.0)
    Animated.parallel([
      Animated.timing(imgOpacity, {
        toValue: 1, duration: 600, delay: 100,
        easing: Easing.out(Easing.ease), useNativeDriver: true,
      }),
      Animated.timing(imgScale, {
        toValue: 1, duration: 800, delay: 100,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();

    // Text fades in after image
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 500, delay: 400,
        easing: Easing.out(Easing.ease), useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 500, delay: 400,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();
  }, [reduceMotion]);

  return (
    <View style={styles.wrap}>
      {/* Hero image — full width, top portion of screen */}
      <Animated.View style={[
        styles.imageWrap,
        {
          opacity: imgOpacity,
          transform: [{ scale: imgScale }],
        },
      ]}>
        <Image
          source={HERO_IMAGE}
          style={styles.heroImage}
          resizeMode="cover"
        />
        {/* Bottom fade so the image blends into the background */}
        <View style={[styles.imageFade, { backgroundColor: colors.background }]} />
      </Animated.View>

      {/* Text content */}
      <Animated.View style={[
        styles.textWrap,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}>
        <Text style={[styles.heading, { color: colors.text }]}>
          Renew from within.{'\n'}Science agrees.
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Fasting activates your body's natural ability to heal and regenerate. Let's set up your personal plan.
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  } as ViewStyle,

  imageWrap: {
    width: SCREEN_W,
    height: SCREEN_W * 0.95,
    marginLeft: -24, // Counteract the parent paddingHorizontal: 24 from profile-setup.tsx
    marginTop: -12,  // Counteract the parent paddingTop from stepWrap
    overflow: 'hidden',
    position: 'relative',
  } as ViewStyle,

  heroImage: {
    width: '100%',
    height: '100%',
  } as ImageStyle,

  imageFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    opacity: 0.9,
  } as ViewStyle,

  textWrap: {
    paddingHorizontal: 4,
    marginTop: -20,
  } as ViewStyle,

  heading: {
    fontFamily: FONTS.displayLight,
    fontSize: fs(32),
    lineHeight: lh(32, 1.12),
    letterSpacing: -0.5,
    marginBottom: SPACING.sm,
  } as TextStyle,

  body: {
    fontFamily: FONTS.bodyRegular,
    fontSize: fs(15),
    lineHeight: lh(15, 1.5),
  } as TextStyle,
});
```

---

## Key details

**Image sizing:** The image fills the full screen width and takes ~95% of screen width as height (roughly square-ish, adjusted for the cellular visual). The `marginLeft: -24` compensates for the parent's `paddingHorizontal: 24` so the image truly bleeds edge-to-edge. Check `profile-setup.tsx` for the exact padding value — if it's different from 24, adjust the negative margin to match.

**Bottom fade:** A gradient-like solid overlay at the bottom of the image blends it into the background. This uses the theme's `colors.background` so it works in both dark and light mode. The opacity is 0.9 (not 1.0) for a softer blend.

**Animation:** The image enters with a subtle scale-down (1.08 → 1.0) creating a gentle "zoom out to reveal" effect. The text fades in 300ms after the image. Both skip entirely when Reduce Motion is enabled.

**Copy rationale:** "Renew from within. Science agrees." is short, confident, and matches the visual. The subtext bridges to the next action ("Let's set up your personal plan") which primes the user for the profile questions ahead.

---

## What NOT to change

1. **`app/profile-setup.tsx`** — No import changes needed. It already imports `StepWhyTrack` from the same path. Step numbering stays at 16 steps. The `canProceed` case for step 3 already returns `true`.
2. **Feature walkthrough** — Untouched. The metabolic zone education now lives exclusively there.
3. **StepWelcome** — Untouched. The greeting still auto-advances to this step.
4. **Any other profile-setup step** — No changes.

---

## Verification checklist

- [ ] `npx tsc --noEmit` passes
- [ ] Step 1: enter name → Step 2: "Nice to meet you!" auto-advances → Step 3: hero image screen appears
- [ ] Hero image fills the top portion of the screen, edge-to-edge
- [ ] Image has a smooth bottom fade into the background colour
- [ ] "Renew from within. Science agrees." text is visible below the image
- [ ] "Let's set up your personal plan." subtext is visible
- [ ] Continue button works and advances to Step 4 (goal selection)
- [ ] Back button from Step 4 returns to this screen (hero image visible)
- [ ] Dark mode: image renders correctly, text is readable, fade uses dark background
- [ ] Light mode: same checks — fade uses light background
- [ ] Enable "Reduce Motion": image and text appear instantly (no scale/fade animation)
- [ ] No duplicate zone bar content anywhere in the setup flow (the old comparison cards are gone)
- [ ] The feature walkthrough (post-setup) still has the full metabolic zones slide — no data was lost, it just moved

## Image note

The hero image at `assets/images/setup-hero.png` is ~1.1MB. This is fine for a profile-setup screen shown once. If bundle size becomes a concern later, the image can be compressed to ~400KB with minimal quality loss using a tool like `sharp` or `tinypng`. Not a priority now.
