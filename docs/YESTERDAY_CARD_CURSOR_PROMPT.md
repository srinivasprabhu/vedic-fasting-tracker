# Aayu — Yesterday Motivation Card — Cursor Implementation Prompt

## Overview

Create a new component `YesterdayCard` that shows the user a personalised summary of yesterday's activity (fasting, water, steps) with a motivational nudge for today. This card replaces the quote card on the Today page.

**Design principle:** Always lead with the win. Never shame. Make today's action concrete and specific.

---

## Context — existing codebase details

**Stack:** React Native, Expo SDK 54, Expo Router, TypeScript, AsyncStorage for local data.

**Existing data sources (all available — no new APIs needed):**

1. **Yesterday's fasting records:** `completedRecords` from `useFasting()` context. Each record has `startTime` (epoch ms), `endTime` (epoch ms | null), `completed` (boolean), `targetDuration` (ms), `label` (string). Filter records where `startTime` or `endTime` falls within yesterday's date range.

2. **Yesterday's water:** AsyncStorage key format `aayu_water_${year}_${month}_${day}`. The value is a JSON array of `{ id, ml, label, time }` entries. To get yesterday's water: use yesterday's date to construct the key, load and sum the `ml` values.

3. **Yesterday's steps:** Use `loadDayTotal(date)` from `utils/stepsDayStorage.ts`. Pass yesterday's date. Returns a number.

4. **User targets (for comparison):**
   - Water target: `profile?.plan?.dailyWaterMl ?? 2500`
   - Steps target: `profile?.plan?.dailySteps ?? 8000`
   - Fast target hours: `profile?.plan?.fastHours ?? 16`

5. **Streak:** `streak` from `useFasting()` context (number).

**Colour tokens (from `constants/colors.ts` ColorScheme):**
- Fasting/streak: `colors.streakAccent` (#E07B30 dark, #E07B30 light)
- Water: `colors.hydration` (#6B9AE8 dark, #5B8DD9 light)
- Steps: `colors.success` (#7AAE79 dark, #5B8C5A light)
- Gold/primary: `colors.primary`
- Card bg: `colors.card`
- Surface: `colors.surface`
- Borders: `colors.borderLight`, `colors.border`
- Text: `colors.text`, `colors.textSecondary`, `colors.textMuted`

**Typography:** Use `fs()` from `constants/theme.ts` for all font sizes (applies the FONT_SCALE). Use `hexAlpha()` from `constants/colors.ts` for alpha-blended colours.

**Icons:** Use `lucide-react-native`. Already installed.

**Dark/light mode:** Use `useTheme()` → `{ colors, isDark }`. All colours come from the ColorScheme — no hardcoded hex values except for computed backgrounds via `hexAlpha()`.

---

## Task 1: Create `components/YesterdayCard.tsx`

### Interface

```typescript
interface YesterdayData {
  /** Hours fasted yesterday (0 if no fast). Computed from completedRecords. */
  fastHours: number;
  /** Whether yesterday's fast met the target (≥80% of plan duration). */
  fastCompleted: boolean;
  /** Whether the user fasted at all yesterday. */
  didFast: boolean;
  /** Yesterday's total water in ml. */
  waterMl: number;
  /** Yesterday's total steps. */
  steps: number;
  /** User's daily water target in ml. */
  waterTarget: number;
  /** User's daily steps target. */
  stepsTarget: number;
  /** User's fast plan hours (e.g. 16 for 16:8). */
  fastTargetHours: number;
  /** Current streak count. */
  streak: number;
}

interface YesterdayCardProps {
  data: YesterdayData;
}
```

### Nudge generation logic

Create a pure function `generateNudge(data: YesterdayData)` that returns `{ headline: string; body: string; icon: 'zap' | 'droplet' | 'sunrise' | 'star'; accentColor: string }`.

The function should evaluate yesterday's data and pick the most relevant nudge:

**Priority 1 — All targets hit (fast completed + water ≥ 90% + steps ≥ 80%):**
- headline: `"Strong day yesterday"`
- body: `"You hit your fasting and water targets. ${streak > 1 ? `Keep your ${streak}-day streak alive tonight.` : 'Build on this momentum tonight.'}"` 
- icon: `'zap'`
- accentColor: use `success` colour

**Priority 2 — Good fast, low water (fast completed, water < 60%):**
- headline: `"Great fast, hydration needs a boost"`
- body: `"You fasted ${fastHours}h but only drank ${waterFormatted}. Aim for ${waterTargetFormatted} today — hydration supports longer fasts."`
- icon: `'droplet'`
- accentColor: use `hydration` colour

**Priority 3 — Good fast, low steps (fast completed, steps < 50%):**
- headline: `"Solid fast, let's move more today"`
- body: `"Your ${fastHours}h fast was on point. Adding more movement today can amplify fat oxidation during your next window."`
- icon: `'zap'`
- accentColor: use `success` colour

**Priority 4 — Fast completed but nothing else notable:**
- headline: `"${fastHours}h fast completed"`
- body: `"Every completed window supports insulin sensitivity and metabolic flexibility. ${streak > 1 ? `${streak} days strong.` : 'Keep going.'}"` 
- icon: `'star'`
- accentColor: use `primary` colour

**Priority 5 — No fast, but good water/steps:**
- headline: `"Rest days build resilience"`
- body: Dynamic based on what they did: `"You still hit ${stepsFormatted} steps${waterPct >= 80 ? ' and stayed hydrated' : ''}. Ready for a fresh fast tonight."`
- icon: `'sunrise'`
- accentColor: use `primary` colour

**Priority 6 — No fast, low everything:**
- headline: `"Today is a fresh page"`
- body: `"One slow day doesn't undo your progress. Start small — a glass of water and a ${fastTargetHours}h fast tonight."`
- icon: `'sunrise'`
- accentColor: use `primary` colour

### Card layout

The card has two sections separated by a thin divider:

**Top section — Yesterday stats (3 chips in a row):**

Each chip shows: icon circle (22x22) → value (14px bold) → label (8px muted uppercase).

- Chip 1: Fasting — icon `Clock`, value = `"16.2h"` or `"Rest day"` (muted if no fast). Show green checkmark badge (12x12, top-right corner) if `fastCompleted`.
- Chip 2: Water — icon `Droplet`, value = `"2.6L"` or `"0.3L"`. Show green checkmark if waterMl ≥ waterTarget * 0.9.
- Chip 3: Steps — icon `Footprints`, value = `"8.2k"` or `"1.2k"`. Show green checkmark if steps ≥ stepsTarget * 0.8.

If the user didn't fast, chip 1 should use muted styling (lower opacity, "Rest day" text instead of hours).

**Bottom section — Today nudge:**

Icon circle (28x28) with the nudge's accent colour → headline (13px, weight 600, `colors.text`) → body (11px, weight 400, `colors.textSecondary`).

### Styling

- Card: `borderRadius: RADIUS.lg (16)`, `borderWidth: 1`, `borderColor: colors.border` (for the warm tint — use `isDark ? '#3D2010' : colors.border`), `backgroundColor: isDark ? '#1A0D06' : colors.surfaceWarm`, `padding: 14`
- Top row label: "YESTERDAY" + formatted date (e.g., "Sun, 13 Apr")
- Chips: `borderRadius: RADIUS.md (12)`, `backgroundColor` from `hexAlpha(colors.text, 0.025)`, `borderWidth: 1`, `borderColor` from `hexAlpha(colors.text, 0.05)`, `padding: 8 6`, `flex: 1`
- Divider: `height: 1`, `backgroundColor` from `hexAlpha(colors.text, 0.04)`, `marginVertical: 10`
- Use `fs()` for all font sizes
- Use `hexAlpha()` for all computed opacity colours
- No hardcoded hex colours for text/bg — always derive from `colors.*`

### Formatting helpers (inside the component file)

```typescript
function formatFastHours(h: number): string {
  return h >= 1 ? `${Math.round(h * 10) / 10}h` : `${Math.round(h * 60)}m`;
}

function formatWaterShort(ml: number): string {
  return ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml`;
}

function formatStepsShort(steps: number): string {
  return steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : String(steps);
}
```

### Accessibility

- Card should have `accessibilityLabel` summarising yesterday: `"Yesterday: fasted 16.2 hours, drank 2.6 litres, 8200 steps"`
- Each chip should be `accessibilityElementsHidden={true}` (the card-level label covers them)

---

## Task 2: Create `utils/yesterdayData.ts`

A utility that computes yesterday's data from existing sources. This keeps the data-loading logic out of the component.

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadDayTotal } from './stepsDayStorage';
import type { FastRecord } from '@/types/fasting';

export interface YesterdayData {
  fastHours: number;
  fastCompleted: boolean;
  didFast: boolean;
  waterMl: number;
  steps: number;
  waterTarget: number;
  stepsTarget: number;
  fastTargetHours: number;
  streak: number;
}

function yesterdayDateRange(): { start: number; end: number; date: Date } {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const end = new Date(yesterday);
  end.setHours(23, 59, 59, 999);
  return { start: yesterday.getTime(), end: end.getTime(), date: yesterday };
}

function waterKeyForDate(d: Date): string {
  return `aayu_water_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
}

export async function loadYesterdayData(
  completedRecords: FastRecord[],
  opts: {
    waterTarget: number;
    stepsTarget: number;
    fastTargetHours: number;
    streak: number;
  },
): Promise<YesterdayData> {
  const { start, end, date } = yesterdayDateRange();

  // 1. Yesterday's fasts — records that ended yesterday
  const yesterdayFasts = completedRecords.filter((r) => {
    if (!r.endTime) return false;
    return r.endTime >= start && r.endTime <= end;
  });
  const didFast = yesterdayFasts.length > 0;
  const fastHours = yesterdayFasts.reduce((sum, r) => {
    const duration = (r.endTime! - r.startTime) / 3_600_000;
    return sum + Math.max(0, duration);
  }, 0);
  const fastCompleted = yesterdayFasts.some((r) => r.completed);

  // 2. Yesterday's water
  let waterMl = 0;
  try {
    const raw = await AsyncStorage.getItem(waterKeyForDate(date));
    if (raw) {
      const entries: { ml: number }[] = JSON.parse(raw);
      waterMl = entries.reduce((s, e) => s + (e.ml ?? 0), 0);
    }
  } catch {}

  // 3. Yesterday's steps
  let steps = 0;
  try {
    steps = await loadDayTotal(date);
  } catch {}

  return {
    fastHours,
    fastCompleted,
    didFast,
    waterMl,
    steps,
    waterTarget: opts.waterTarget,
    stepsTarget: opts.stepsTarget,
    fastTargetHours: opts.fastTargetHours,
    streak: opts.streak,
  };
}
```

---

## Task 3: Update `app/(tabs)/(home)/index.tsx`

### 3a. Add imports

Add at the top with other imports:
```typescript
import YesterdayCard from '@/components/YesterdayCard';
import { loadYesterdayData, type YesterdayData } from '@/utils/yesterdayData';
```

### 3b. Add state

Inside `HomeScreen`, add state for yesterday data:
```typescript
const [yesterdayData, setYesterdayData] = useState<YesterdayData | null>(null);
```

### 3c. Load yesterday data in useFocusEffect

Inside the existing `useFocusEffect` callback (where water and weight are loaded), add at the end:

```typescript
// Yesterday's motivation data
loadYesterdayData(completedRecords, {
  waterTarget,
  stepsTarget,
  fastTargetHours: plan?.fastHours ?? 16,
  streak,
}).then(setYesterdayData);
```

**Important:** This must go inside the existing `useFocusEffect` callback, NOT in a new useEffect. The data should refresh every time the screen gains focus.

### 3d. Replace the quote card with YesterdayCard

Find the quote card JSX (near the bottom of the ScrollView):
```tsx
{/* Quote — moved to bottom for better content priority */}
<Animated.View style={[styles.quoteCard, { opacity: fadeAnim, backgroundColor: colors.surface, borderLeftColor: colors.primary }]}>
  <Text style={[styles.quoteText, { color: colors.text }]}>"{quote.text}"</Text>
  <Text style={[styles.quoteSrc, { color: colors.textSecondary }]}>— {quote.source}</Text>
</Animated.View>
```

Replace it with:
```tsx
{/* Yesterday motivation card */}
{yesterdayData && completedFastCount > 0 && (
  <YesterdayCard data={yesterdayData} />
)}
```

**Important:** Only show the card if `completedFastCount > 0` — new users with zero fasts don't have a yesterday to show. They already have the welcome card in the stats row.

### 3e. Clean up unused imports

After removing the quote card, these may become unused — remove if so:
- `VEDIC_QUOTES` and `NEUTRAL_DAILY_QUOTES` imports
- `TRADITIONAL_INSIGHTS_KEY` import  
- `traditionalInsights` state variable
- `quote` useMemo
- `quoteCard`, `quoteText`, `quoteSrc` styles from `makeStyles`

**BUT:** Check first if `traditionalInsights` or `VEDIC_QUOTES` are used elsewhere in the file (e.g., for notifications or other features). Only remove if they become completely unused after removing the quote card.

---

## Task 4: DO NOT touch these files

- `components/AayuInsightCard.tsx` — stays as-is on Journey page
- `app/(tabs)/analytics/index.tsx` — stays as-is
- `components/CircularTimer.tsx` — no changes
- `components/MetabolicZoneRiver.tsx` — no changes
- Any other component or screen not mentioned above

---

## Implementation notes

1. **All numbers must be rounded for display.** Never show `16.23333h` — use `Math.round(h * 10) / 10` for one decimal.

2. **Use `fs()` for every `fontSize` value.** The app uses a global font scale via this function.

3. **Use `hexAlpha()` for computed opacity colours.** Example: `hexAlpha(colors.text, 0.04)` not `rgba(...)` strings. This ensures proper colour token usage in both themes.

4. **The card should NOT import from `mocks/vedic-data.ts`** — it generates its own motivational text from the nudge function.

5. **Date formatting for the header:** Use `toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })` for "Sun, 13 Apr" format.

6. **The `generateNudge` function must be deterministic** — same input always produces same output. No randomness.

7. **Water formatting:** If `≥ 1000ml` show as `"X.XL"`, otherwise `"Xml"`. Use `toFixed(1)` for litre values.

8. **Steps formatting:** If `≥ 1000` show as `"X.Xk"`, otherwise just the number.

9. **The green checkmark badge** on chips: use `Check` icon from lucide at size 7, strokeWidth 3, colour `colors.success`, inside a 12x12 circle with `backgroundColor: hexAlpha(colors.success, 0.15)`, positioned `position: 'absolute', top: 4, right: 4`.

10. **The "Rest day" state for fasting chip:** The text should be `"Rest day"` with `fontSize: fs(11)` (slightly smaller than the numeric value) and the entire chip should have `opacity: 0.5` or use `hexAlpha(colors.text, 0.25)` for the value colour.

---

## Verification checklist

After implementation:
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] Card shows correctly for user with completed fasts (yesterday data visible)
- [ ] Card is hidden for new users with zero completed fasts
- [ ] "Rest day" state renders correctly when user didn't fast yesterday
- [ ] Green checkmarks appear on chips that hit targets
- [ ] Nudge text changes based on yesterday's data pattern
- [ ] Card looks correct in both dark and light mode
- [ ] No remaining references to the old quote card JSX or unused quote-related imports
- [ ] `quoteCard`, `quoteText`, `quoteSrc` styles removed from makeStyles (if no longer used)
- [ ] The card uses `fs()` for all font sizes
- [ ] No hardcoded hex colours — everything from `colors.*` or `hexAlpha()`
