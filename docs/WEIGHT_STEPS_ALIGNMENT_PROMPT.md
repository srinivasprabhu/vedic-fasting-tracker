# Aayu — Weight Steps Visual Alignment + Unit Conversion Fix

## Overview

Fix 3 issues across the current weight and target weight profile-setup steps:

1. **Bug: Unit switch doesn't convert weight values** — switching kg→lbs keeps the number the same instead of converting it
2. **Visual: Target weight BMI card missing the colour scale bar** — current weight has the full BMI strip with animated needle; target weight only shows a plain number
3. **Visual: Typography and spacing inconsistencies** between the two screens

---

## Context

**Files to modify:**
- `app/profile-setup.tsx` — Add unit conversion handler
- `components/profile-setup/StepCurrentWeight.tsx` — Minor typography fix
- `components/profile-setup/StepTargetWeight.tsx` — Add BMI scale bar, fix typography

**Current state:**
- `currentWeight` and `targetWeight` are stored as strings in `profile-setup.tsx` state
- `weightUnit` is stored separately
- When unit changes, only `weightUnit` updates — the weight strings stay the same (the bug)
- Current weight screen has a `BMIScale` component; target weight screen does not

---

## Fix 1: Unit conversion in `profile-setup.tsx`

**File:** `app/profile-setup.tsx`

The current `onUnitChange` prop passes `setWeightUnit` directly. This only changes the unit label — not the value. When a user sets 82kg then switches to lbs, they expect to see ~181 lbs, not 82 lbs.

### 1a. Create a conversion handler

Find the state declarations:
```typescript
const [currentWeight, setCurrentWeight] = useState('80');
const [targetWeight, setTargetWeight]   = useState('75');
const [weightUnit, setWeightUnit]       = useState<WeightUnit>('kg');
```

Add a handler below them (before the `plan` useMemo):

```typescript
const handleUnitChange = useCallback((newUnit: WeightUnit) => {
  if (newUnit === weightUnit) return;

  // Convert current weight
  const cw = parseFloat(currentWeight);
  if (!isNaN(cw) && cw > 0) {
    const converted = newUnit === 'lbs'
      ? Math.round(cw * 2.20462)    // kg → lbs
      : Math.round(cw / 2.20462);   // lbs → kg
    setCurrentWeight(String(converted));
  }

  // Convert target weight
  const tw = parseFloat(targetWeight);
  if (!isNaN(tw) && tw > 0) {
    const converted = newUnit === 'lbs'
      ? Math.round(tw * 2.20462)
      : Math.round(tw / 2.20462);
    setTargetWeight(String(converted));
  }

  setWeightUnit(newUnit);
}, [weightUnit, currentWeight, targetWeight]);
```

### 1b. Pass the handler instead of the raw setter

Find where `StepCurrentWeight` is rendered (inside the `renderStep` function):

```tsx
case 8: return <StepCurrentWeight value={currentWeight} onChange={setCurrentWeight} heightCm={heightCm} unit={weightUnit} onUnitChange={setWeightUnit} />;
```

Change `onUnitChange={setWeightUnit}` to:

```tsx
case 8: return <StepCurrentWeight value={currentWeight} onChange={setCurrentWeight} heightCm={heightCm} unit={weightUnit} onUnitChange={handleUnitChange} />;
```

Note: the step number may be 8 or different depending on your current numbering — find the `StepCurrentWeight` render case regardless of the number.

### 1c. Verify decimal state resets on conversion

When the unit changes, the decimal portion (e.g. ".4" in "82.4") should reset because `Math.round` produces an integer. The current `decimal` state lives inside `StepCurrentWeight`, not in the parent. Since we're replacing the entire `currentWeight` string with a rounded integer (e.g. "181"), the decimal will naturally clear on the next render because `parseInt("181")` produces 181 and the component re-mounts with the new value.

However, if the component doesn't remount (React reuses the instance), the `decimal` state will be stale. To be safe, add a `useEffect` inside `StepCurrentWeight` that clears the decimal when the value changes externally:

**File:** `components/profile-setup/StepCurrentWeight.tsx`

Find the `decimal` state:
```typescript
const [decimal, setDecimal] = useState('');
```

Add a useEffect right below it:
```typescript
// Clear decimal when the integer part changes (e.g. unit conversion)
useEffect(() => {
  const parts = value.split('.');
  if (parts.length < 2 || parts[1] === '') {
    setDecimal('');
  }
}, [value]);
```

---

## Fix 2: Add BMI scale bar to target weight screen

**File:** `components/profile-setup/StepTargetWeight.tsx`

### 2a. Import the BMIScale component

The `BMIScale` component is defined inside `StepCurrentWeight.tsx` as a private component. To reuse it, either:

**Option A (recommended):** Extract `BMIScale` into its own file `components/profile-setup/BMIScale.tsx` and import it in both steps. This is cleaner.

**Option B (simpler):** Duplicate the compact version of BMIScale inside StepTargetWeight. This avoids touching StepCurrentWeight.

Go with **Option A**. Create `components/profile-setup/BMIScale.tsx`:

```tsx
import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing,
  ViewStyle, TextStyle,
} from 'react-native';
import { FONTS, fs } from '@/constants/theme';

interface BMIScaleProps {
  bmi: number;
  isDark: boolean;
  compact?: boolean;
}

export const BMIScale: React.FC<BMIScaleProps> = ({ bmi, isDark, compact }) => {
  const minBMI = 10, maxBMI = 40;
  const pct = Math.min(100, Math.max(0, ((bmi - minBMI) / (maxBMI - minBMI)) * 100));
  const needleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(needleAnim, {
      toValue: pct,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const barHeight = compact ? 5 : 8;
  const needleHeight = compact ? 9 : 14;
  const needleWidth = compact ? 2 : 3;

  return (
    <View style={{ marginTop: compact ? 4 : 6 }}>
      <View style={[styles.bar, { height: barHeight }]}>
        <View style={[styles.seg, { flex: 1.7, backgroundColor: '#5b8dd9' }]} />
        <View style={[styles.seg, { flex: 1.5, backgroundColor: '#3aaa6e' }]} />
        <View style={[styles.seg, { flex: 1, backgroundColor: '#e8c05a' }]} />
        <View style={[styles.seg, { flex: 1.2, backgroundColor: '#e07b30' }]} />
        <View style={[styles.seg, { flex: 2, backgroundColor: '#e05555' }]} />
      </View>
      <View style={[styles.needleTrack, { height: needleHeight }]}>
        <Animated.View style={[styles.needle, {
          width: needleWidth,
          height: needleHeight,
          marginLeft: -needleWidth / 2,
          left: needleAnim.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
          }),
        }]} />
      </View>
      {!compact && (
        <View style={styles.labels}>
          {['Under', 'Normal', 'Over', 'Obese'].map((l) => (
            <Text
              key={l}
              style={[styles.lbl, {
                color: isDark ? 'rgba(200,135,42,.4)' : 'rgba(160,104,32,.45)',
              }]}
            >
              {l}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
  } as ViewStyle,
  seg: {
    height: '100%' as any,
  } as ViewStyle,
  needleTrack: {
    position: 'relative',
  } as ViewStyle,
  needle: {
    position: 'absolute',
    borderRadius: 2,
    backgroundColor: '#fff',
    top: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
  } as ViewStyle,
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  } as ViewStyle,
  lbl: {
    fontFamily: FONTS.bodyRegular,
    fontSize: fs(10),
  } as TextStyle,
});
```

### 2b. Update StepCurrentWeight to import from the new file

**File:** `components/profile-setup/StepCurrentWeight.tsx`

Remove the inline `BMIScale` component and its styles (`bs`, `bsc` StyleSheet blocks). Replace with:

```typescript
import { BMIScale } from './BMIScale';
```

The usage stays the same:
```tsx
<BMIScale bmi={bmi} isDark={isDark} compact />
```

### 2c. Add BMIScale to StepTargetWeight

**File:** `components/profile-setup/StepTargetWeight.tsx`

Add the import:
```typescript
import { BMIScale } from './BMIScale';
```

Find the target BMI card (the `previewCard` View). Add the BMIScale component inside it, right after the `previewRow`:

Current:
```tsx
<View style={s.previewRow}>
  <View style={s.previewValRow}>
    <Text style={[s.previewBig, { color: green }]}>{targetBmi}</Text>
    <Text style={[s.previewUnit, ...]}>kg/m²</Text>
  </View>
  <View style={[s.previewBadge, ...]}>
    ...
  </View>
</View>
```

Add after the closing `</View>` of `previewRow`:
```tsx
<BMIScale bmi={targetBmi} isDark={isDark} compact />
```

---

## Fix 3: Typography and spacing alignment

### 3a. Match heading font sizes

**File:** `components/profile-setup/StepTargetWeight.tsx`

Change the heading style:
```typescript
// Before:
heading: { fontFamily: FONTS.displayLight, fontSize: fs(36), lineHeight: lh(36), ... }
accent:  { fontFamily: FONTS.displayItalic, fontSize: fs(36), lineHeight: lh(36) }

// After:
heading: { fontFamily: FONTS.displayLight, fontSize: fs(32), lineHeight: lh(32), ... }
accent:  { fontFamily: FONTS.displayItalic, fontSize: fs(32), lineHeight: lh(32) }
```

This matches `StepCurrentWeight`'s `fs(32)`.

### 3b. Match icon wrapper spacing

**File:** `components/profile-setup/StepTargetWeight.tsx`

Change the `iconWrap` style:
```typescript
// Before:
iconWrap: { ... marginBottom: SPACING.lg }

// After:
iconWrap: { ... marginBottom: SPACING.md }
```

This matches `StepCurrentWeight`'s `SPACING.md`.

### 3c. Align the BMI card eyebrow style

The current weight card uses:
```
bmiEyebrow: { fontSize: fs(9), letterSpacing: .12, textTransform: 'uppercase' }
```

The target weight card uses:
```
previewLabel: { fontSize: fs(10), letterSpacing: .14, textTransform: 'uppercase' }
```

Change `previewLabel` to match:
```typescript
previewLabel: { fontFamily: FONTS.bodyMedium, fontSize: fs(9), letterSpacing: .12, fontWeight: '500', marginBottom: 4, textTransform: 'uppercase' }
```

### 3d. Match the paddingTop

Current weight: `paddingTop: SPACING.lg`
Target weight: `paddingTop: SPACING.xl`

Change target weight to:
```typescript
paddingTop: SPACING.lg
```

---

## What NOT to change

1. **Colour coding** — Current weight uses gold/amber, target weight uses green. This is intentional and correct — different accent colours help the user distinguish "where I am" vs "where I want to be."
2. **The RulerPicker component** — No changes to the ruler itself.
3. **BMI calculation logic** — `calcBMI`, `getBMICategory`, etc. stay as-is.
4. **The Target weight checkmark** — The green ✓ on "Normal" in the target weight badge is a nice touch. Keep it.

---

## Verification checklist

### Unit conversion
- [ ] Set current weight to 82 in kg
- [ ] Switch to lbs → ruler jumps to ~181 (not 82)
- [ ] Switch back to kg → ruler returns to ~82 (slight rounding OK)
- [ ] The decimal clears when switching units (no stale ".4" showing)
- [ ] Target weight also converts: if it was 75kg, switching to lbs shows ~165
- [ ] BMI value stays the same regardless of unit (BMI is always computed in metric)

### Visual alignment
- [ ] Current weight heading: "Current weight" at fs(32)
- [ ] Target weight heading: "Target weight" at fs(32) — same size
- [ ] Both icon circles have the same spacing below them (SPACING.md)
- [ ] Both BMI cards have: eyebrow label, value + unit + badge, colour scale bar with needle
- [ ] Target weight BMI card needle animates to the correct position as the ruler scrolls
- [ ] Both eyebrow labels ("YOUR BMI" / "TARGET BMI") use fs(9) with matching letter spacing
- [ ] Swiping from current weight → target weight feels visually continuous (no jarring layout shift)

### Edge cases
- [ ] Very light weight (30kg / 66lbs) — BMI scale shows needle at the left
- [ ] Very heavy weight (180kg / 400lbs) — BMI scale shows needle at the right
- [ ] Missing height (empty or < 50cm) — BMI card doesn't render on either screen
- [ ] Dark mode — both cards use correct theme colours
- [ ] Light mode — same check
