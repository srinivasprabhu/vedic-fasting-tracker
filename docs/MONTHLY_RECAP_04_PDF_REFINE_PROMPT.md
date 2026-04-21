# Step 4: Refine the PDF to 5 Pages

## What you're building

A tightened version of the existing 7-page PDF report, cut down to 5 pages with no loss of meaningful information. The current PDF has two problems: (1) the first two pages say the same thing in two different layouts, and (2) the "Fasting Analysis" and "Score Breakdown" pages overlap on biological proxies and score components.

**This is a polish step, not a redesign.** The visual style (dark theme, gold accents, Aayu branding) stays identical. We're cutting duplication and tightening the narrative flow.

## Current → Target structure

| Current page | Current content | Action |
|---|---|---|
| 1 (light) | Baseline intro + score + stats + breakdown + timing | **CUT** — duplicates page 2 |
| 2 (dark) | Same info as page 1 in dark theme | Keep → becomes page 1 |
| 3 | Weekly bars + baseline insights + week-by-week | Keep → becomes page 2 |
| 4 | Daily rhythm map + timing + biological proxies | Merge with page 5 → becomes page 3 |
| 5 | Score breakdown + projection + component summary | Merge with page 4 → becomes page 3 |
| 6 | Month 3 progress + score line chart + comparison table | Keep → becomes page 4 |
| 7 | Behavior intelligence + adherence pattern + routine | Keep → becomes part of page 4 |
| 8 | Month 4 prescription + what went well + needs attention | Keep → becomes page 5 |

**Final 5-page structure:**

1. **Hero** — Score, label, 3 stats, score breakdown, next-month projection (merged content of current pages 1-2 and 5)
2. **Patterns** — Weekly bars, week-by-week tiles, baseline insights
3. **Fasting analysis** — Daily rhythm map, timing intelligence, biological proxies (no score breakdown here anymore — moved to page 1)
4. **Progress & behavior** — Month-over-month comparison + behaviour intelligence + weekly adherence pattern
5. **Next month plan** — Prescription + what went well + needs attention + closing CTA

---

## Task 1: Understand the existing template structure

**File:** `utils/report-html-template.ts`

This file generates the HTML for the PDF. The structure is:
- `buildReportHTML(data)` — the entry point that assembles all pages
- Individual page functions (probably named like `page1HTML`, `page2HTML`, or inlined)
- Shared CSS at the top of the generated HTML
- SVG helpers: `scoreRingSVG`, `heatmapSVG`, `weightChartSVG`, etc.

Before making changes, read the file fully and identify:
1. Where each page starts and ends in the HTML string
2. Which helper functions render which visual elements
3. The page-break CSS (probably `page-break-after: always` or `page-break-before: always`)

Tell Cursor: "Read `utils/report-html-template.ts` end-to-end and map out which code blocks render which pages before making any changes."

---

## Task 2: Remove the duplicate light-theme intro page

The current PDF has a light cream-background page that repeats everything the following dark page shows. Delete this entire page's HTML block. The dark version is more premium and matches the app's aesthetic.

After deletion, the first page should be the dark-themed one with:
- "Aayu" header + month label
- Large "75 METABOLIC SCORE" on the left
- "Strong Foundation" title + explanation on the right
- Best streak + overnight alignment stats
- 3-stat row (fasts, total hours, avg duration)
- Score breakdown bars
- Timing intelligence cards
- "What went well" + "Data not synced"
- "Next month target" footer with projected score

**But wait** — this page is quite dense. Splitting it into a cleaner 2-column "hero" feels better. Restructure the first page to:

**TOP HALF (above the fold in a PDF viewer):**
- Header with Aayu logo + "MONTH N RECAP"
- Score label ("Strong Foundation")
- Giant score number with delta pill
- Description sentence ("Your first month established...")

**BOTTOM HALF:**
- Score breakdown bars (moved from page 5)
- 3 stat tiles (fasts, total hours, avg duration)
- Projected next month score (moved from page 5)

This means page 1 now combines the emotional hero AND the score breakdown. The user understands their score AND its components in one glance, on the first page.

---

## Task 3: Merge "Fasting Analysis" and "Score Breakdown" pages

Currently page 4 is "Fasting Analysis" (rhythm map, timing, biological proxies) and page 5 is "Score Breakdown" (score components, projection).

Since the score breakdown moved to page 1 in the previous task, page 5 becomes redundant. Delete it entirely. Page 4 becomes the new page 3 and contains only:
- Daily rhythm map (the horizontal bar showing fasting vs eating window)
- Timing intelligence (start time, break time, overnight alignment)
- Biological proxies (deep fasts, autophagy, fat utilized)
- Preferred rhythm summary band

This makes page 3 a focused "fasting analysis" page with no score duplication.

---

## Task 4: Consolidate behaviour intelligence onto page 4

Currently page 6 is "Month 3 Progress" (comparison table + line chart) and page 7 is "Behavior Intelligence" (adherence pattern + routine).

Merge both onto a single page 4:

**TOP HALF:**
- "Month 3 Progress" title + score delta pill ("+13 pts vs Month 1 Baseline")
- Score progression line chart (Month 1 → Goal)
- Comparison table (fasts, hours, duration, streak)

**BOTTOM HALF:**
- "Behavior Intelligence" mini-section
- Weekly adherence bar chart (Mon-Sun %)
- "Consistency Profile" + "Best-Performing Routine" side-by-side boxes

This page is dense but scannable. The narrative reads: "Here's how you grew (top), here's the pattern behind the growth (bottom)."

**Important:** Only render this page if `data.prevMonth` or `data.sinceStart` exists. If the user is on their baseline month, page 4 should be skipped entirely (PDF goes from page 3 → page 5, renumbered to 4 pages total).

---

## Task 5: Clean up page 5 (Next Month Plan)

Currently page 8. Becomes page 5 (or page 4 for baseline users). Keep the existing content:
- Projected score band
- "Retention Hook" + "Coaching Focus" stat tiles
- Recommended Next-Month Plan (4 numbered steps)
- "What went well" + "Needs attention" side-by-side
- "Ready for Month N+1?" closing band with "Open Aayu App" CTA

**One small improvement:** the "Open Aayu App" button currently does nothing when tapped in a PDF viewer. Change the button's text to something less actionable — "See you next month" or "Keep going" — because a button-styled element that doesn't do anything is a UX smell.

---

## Task 6: Fix the page counter

Currently the footer shows "Page N of 7" across all pages. After these changes, it should show "Page N of 5" (or "Page N of 4" for baseline users).

Find the page-count generation logic. It's probably a constant or a string template. Make it dynamic based on whether the comparison page gets rendered:

```typescript
const totalPages = data.prevMonth || data.sinceStart ? 5 : 4;
```

Then replace every instance of `"Page X of 7"` with a dynamic value that uses the correct total.

---

## Task 7: Adjust page-break CSS to ensure clean splits

After restructuring, verify that each page content block ends with a CSS rule that forces a page break. Look for something like:

```css
.page {
  page-break-after: always;
  min-height: 100vh;
}
```

Make sure:
- Each of the 4-5 pages has this class
- The LAST page does NOT have `page-break-after` (so the PDF doesn't have a trailing blank page)
- Content within a page doesn't exceed the height constraint (which would cause mid-page breaks in awkward places)

Test by generating the PDF and scrolling through all pages — each should be one logical screen of content, no orphaned headings, no content bleeding onto the next page.

---

## Task 8: Verify baseline-month rendering

Month 1 users have `data.isBaseline === true` and `data.prevMonth === null`. Their PDF should:
- Page 1: Hero + score breakdown + stats (same as normal) but the "next month projection" section might show a range rather than a specific projected number
- Page 2: Patterns (same as normal)
- Page 3: Fasting analysis (same as normal)
- Page 4: Next month plan (SKIP the comparison page since there's no previous month to compare against)

Check the existing code for any conditional rendering based on `isBaseline`. Preserve the "Baseline Foundation" framing and "Your first month..." language for these users.

---

## Task 9: Keep the visual style identical

Do NOT change:
- Fonts, colours, or brand elements
- SVG chart rendering functions (`scoreRingSVG`, `heatmapSVG`, etc.)
- The Aayu logo mark SVG
- The dark theme background (`#1a1008` or similar)
- The gold accent colour (`#c8872a`)
- Page margins, padding, or overall card aesthetic

This task is PURELY about removing duplication and merging pages. Any visual changes would count as a redesign and go in a separate branch.

---

## Verification checklist

Generate a PDF for a test user and check:
- [ ] Total page count is 5 (or 4 for baseline month) — NOT 7
- [ ] Page 1 shows score + breakdown + stats on a single cohesive page
- [ ] No duplicate stats between pages (e.g., "33.3h" doesn't appear on 3 different pages)
- [ ] Baseline users (month 1) get 4 pages, skipping the comparison page
- [ ] Non-baseline users (month 2+) get 5 pages
- [ ] Page footer shows correct "Page N of 5" or "Page N of 4"
- [ ] No orphaned headings or mid-sentence page breaks
- [ ] Final page ends cleanly with no trailing blank page
- [ ] All existing data still appears somewhere in the PDF (nothing lost)

## Testing approach

Since this is purely a PDF change, you can test by:
1. Generate a PDF for a user with 3+ fasts in the most recent month
2. Open it in a PDF viewer (iOS Files, macOS Preview, etc.)
3. Scroll through each page
4. Compare to the old 7-page version to confirm no information was lost

If you have access to the `dev-seed-fasting-history.ts` utility, use it to seed a user with 3 months of fake data so you can test the comparison page.

## What this step does NOT do

- Does NOT change the in-app recap screen (step 1)
- Does NOT change the shareable card (step 2)
- Does NOT add the blurred preview (step 5)
- Does NOT change which data is aggregated — `utils/monthly-report.ts` stays as-is. Only `utils/report-html-template.ts` changes.
