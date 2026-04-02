# Monthly Report V2 — Upgrade Prompt for Cursor

## Context

The monthly PDF report feature (`utils/monthly-report.ts` and `utils/report-html-template.ts`) has been updated with a new `MonthlyReportData` interface in `utils/monthly-report.ts`. The type now includes these new fields that need to be computed in the `generateMonthlyReport()` function and rendered in the HTML template:

### New fields added to MonthlyReportData

```typescript
isBaseline: boolean;           // true for month 1
weeklyBreakdown: { week: number; fasts: number; hours: number }[];
scoreBreakdown: { duration: number; consistency: number; circadian: number; deepFast: number; };
projectedScore: number | null;
timing: { mostCommonStartHour: string | null; mostCommonBreakHour: string | null; overnightAlignmentPct: number; bestWindow: string | null; };
behaviour: { weekdayAdherencePct: number; weekendDropPct: number; recoveryRate: number; bestDays: string[]; } | null;
hasWaterData: boolean;
hasStepsData: boolean;
baseline: { metabolicScore, totalFasts, avgFastDuration, completionRate, bestStreak, weightEnd, scoreBreakdown } | null;
prevMonth.bestStreak: number;  // added to existing prevMonth type
dataGaps: string[];
nextMonthTargets: { targetFasts, targetLongFast, focusArea, retentionHook };
```

The `sinceStart.firstMetabolicScore` field has been removed.

## What needs to happen

### 1. Update `generateMonthlyReport()` in `utils/monthly-report.ts`

Add these new helper functions BEFORE the main generator:

**`computeTimingIntelligence(records: FastRecord[])`** — Calculates average start time, average break time, overnight alignment %, and best window string (e.g. "7:05 PM → 11:20 AM"). Uses `new Date(r.startTime).getHours()` and `.getMinutes()`. Overnight = start after 6pm AND end between 6am-2pm.

**`computeBehaviourIntelligence(heatmap, month, year)`** — Only for month 2+. Computes weekday (Mon-Thu) adherence %, weekend (Fri-Sun) drop-off %, recovery rate (% of times user resumed fasting after a missed day), and best days (sorted by adherence). Uses day-of-week from `new Date(year, month, dayIndex + 1).getDay()`.

**`computeWeeklyBreakdown(heatmap)`** — Splits heatmap into 4-5 week chunks, sums fasts and hours per week. Used for the weekly rhythm chart on page 2 of the PDF.

**`computeProjectedScore(currentScore, completedFasts, consistencyPct)`** — Conservative projection. If consistency < 60%, assume +8 point potential. If < 80%, +5. If >= 80%, +2. Apply diminishing returns for scores > 85. Return null if < 3 fasts.

**`computeNextMonthTargets(data)`** — Returns targetFasts (increase by 50-100% if low, maintain if good), targetLongFast, focusArea (based on biggest weakness), retentionHook (based on behaviour patterns).

**`computeDataGaps(hasWater, hasSteps, weightLogCount)`** — Returns array of human-readable strings for missing data. Show "Hydration data not available this month" instead of raw 0 values.

Then in the main generator, compute all new fields:

```typescript
const isBaseline = monthNumber === 1;
const weeklyBreakdown = computeWeeklyBreakdown(dailyHeatmap);
const timing = computeTimingIntelligence(completedMonthRecords);
const behaviour = !isBaseline ? computeBehaviourIntelligence(dailyHeatmap, month, year) : null;
const scoreBreakdown = { duration: mScore.duration, consistency: mScore.consistency, circadian: mScore.circadian, deepFast: mScore.deepFasts };
const projectedScore = computeProjectedScore(mScore.total, completedFasts, mScore.consistencyPct);
const hasWaterData = waterValues.length > 0;
const hasStepsData = stepsValues.length > 0;
const dataGaps = computeDataGaps(hasWaterData, hasStepsData, monthWeightLogs.length);
```

For the `baseline` field: if `isBaseline` is false, find the earliest month that has fasting records. Compute that month's metabolic score, totalFasts, avgDuration, completionRate, bestStreak, weightEnd, and scoreBreakdown. This is the Month 1 reference point. If `isBaseline` is true, set `baseline: null`.

Add `bestStreak` to the `prevMonth` computation.

Update `generateInsights()` to include behaviour insights (recovery rate, weekday adherence) and to frame Month 1 positively ("This is your baseline foundation").

Update `generateRecommendation()` to be baseline-aware: Month 1 says "This is your baseline month. Focus on pattern detection..." instead of generic advice. Month 2+ includes weekend drop-off specific advice.

### 2. Update `utils/report-html-template.ts`

The HTML template `buildReportHTML()` needs to render 5 pages matching the premium mock v2 PDF design:

**Page 1 — Executive Summary**
- "✦ AAYU" header
- Month title + "Month N · Baseline Foundation" (or "Month N · Progression")
- Metabolic score ring with delta vs baseline: `75 → 88 (+13 vs Month 1)`
- Month snapshot: fasts, hours, avg duration, overnight alignment, best streak
- 4 stat cards below
- Clinical interpretation paragraph (not a data dump — frame it as what the data means)
- If baseline: show "🎉 Your first month with Aayu" celebration card

**Page 2 — Progress & Patterns**
- Weekly rhythm chart (W1, W2, W3, W4 bars)
- Weekly breakdown summary: "Week 1: 1 fast • Week 2: 0 fasts • Week 3: 1 fast • Week 4: 1 fast"
- If baseline: "This is your baseline month. Future reports will compare against this reference."
- If month 2+: Comparison table (Metric | Month 1 | This month | Change) with % changes
- Baseline markers: "Current comfort zone", "Deep fasting tolerance", "Circadian timing", "Biggest growth area"

**Page 3 — Fasting Analysis**
- Daily heatmap (already exists)
- Timing intelligence: most common start, break-fast, overnight alignment, best window
- Deep fasts count, autophagy hours, fat utilization stats
- If month 2+: Behaviour intelligence section with recovery rate, weekday adherence, weekend drop

**Page 4 — Score Breakdown**
- Score component bars: Duration Quality X/30, Consistency X/25, Circadian Alignment X/20, Deep Fast Exposure X/25
- Each with delta vs baseline if available: `Consistency 23/25 (+11 from Month 1)`
- "Fastest ways to improve" bullets (derived from weakest components)
- Projected next month score: `75 → 84`

**Page 5 — Next Month Plan (closing page)**
- "What went well" bullets (from insights)
- "Data gaps" section (using smart empty states, not raw zeros): "Hydration data not available" / "Movement data not synced"
- Next month targets: target fasts, long fast goal, focus area
- Projected score + retention hook + coaching focus
- Footer: "Generated by Aayu on [date]" + medical disclaimer

### Key design principles from the mock

1. **Baseline (Month 1) framing:** Use "Baseline Foundation" language. No shaming for low frequency. Frame as "high-quality foundation" and "pattern detection". Show "🎉 Your first month" celebration.

2. **Progression (Month 2+) framing:** Lean heavily into progress. Show vs-baseline deltas everywhere. The comparison table is "the most emotionally powerful page." Use % changes: "+267% fasts completed."

3. **Smart empty states:** Never show "Water: 0ml" or "Steps: 0". Instead: "Hydration data not available this month" or "Movement data not synced this month. Use smart empty states instead of raw 0 values."

4. **Duration decrease is OK:** If avg duration drops (e.g. 33h → 16h) but frequency increases, label it "More sustainable" — don't show it as a negative delta.

5. **Conservative projections:** `75 → 84` not `75 → 95`. Under-promise, over-deliver.

6. **Score should feel earned:** The score breakdown page should make users feel their score was built through effort, not assigned arbitrarily.

7. **Closing page creates anticipation:** End with next-month targets, projected score, and a "retention hook" that makes the user want to come back to see their next report.

### Theme / styling

Keep the existing dark theme: `#0e0703` bg, `#f0e0c0` text, `#c8872a` gold accent, `#7AAE79` green for positive changes, `#D46060` for negative. Use the same CSS variables already in `report-html-template.ts`.

### Brand assets for PDF

Use the mandala SVG from `assets/brand/logo-mark-mono-dark.svg` as the header mark in the PDF. The mandala is an 8-petal lotus with a centre diamond — embed it as inline SVG in the HTML template header. The current template uses `✦ A A Y U` as text — replace or complement this with the actual mandala SVG for a more polished look.

Colour reference: see `assets/brand/BRAND_GUIDE.md` for the complete colour palette and usage guidelines.

### Files to modify

1. `utils/monthly-report.ts` — Add helper functions, update generator to compute all new fields
2. `utils/report-html-template.ts` — Complete rewrite of `buildReportHTML()` to 5-page layout matching premium mock v2
