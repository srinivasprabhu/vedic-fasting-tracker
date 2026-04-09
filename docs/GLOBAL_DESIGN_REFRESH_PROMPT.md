# Aayu — Global Design System Refresh Prompt

## Context

Aayu is a React Native fasting app built with Expo SDK 54, Expo Router, TypeScript, and uses a dark/light theme system via `contexts/ThemeContext.tsx` with colour tokens in `constants/colors.ts` and `constants/theme.ts`.

A product designer has redesigned the Today page (screenshots provided to the team). We now need to apply this new design language consistently across ALL screens. The goal is to make every screen feel cohesive, premium, and distinctly "designed" — eliminating any AI-generated feel.

## Design language reference (from designer's Today page)

### Core visual patterns

**Cards:** `background: rgba(240,224,192,0.04)`, `border: 1px solid rgba(240,224,192,0.08)`, `border-radius: 16px`, `padding: 16px`. No shadows. No gradients. Subtle, barely-there borders. In light mode, use `background: rgba(44,24,16,0.02)`, `border: 1px solid rgba(44,24,16,0.06)`.

**Icon circles:** Replace ALL emojis with lucide-react-native SVG icons. Icon circles are 28-36px, border-radius 50%, background using feature colour at 10-12% opacity. Icon stroke colour matches the feature colour. Sizes: 14-18px icons.

**Colour hierarchy (critical — do not mix up roles):**

**Brand primary — Gold `#c8872a` (dark) / `#a06820` (light):**
Used for: logo, brand mark ✦, Pro badge, active tab bar, onboarding accents, section highlights, links, gold-tinted elements. This is the Aayu identity colour. It appears in the logo, the mandala, and the wordmark. It must remain the dominant colour.

**CTA / action — Warm salmon `#d4956a`:**
Used ONLY for: primary action buttons ("Begin Fast", "End Fast", "Get Started", "Save"). This colour exists because a gold button doesn't pop enough against the dark gold-tinted background. Salmon provides contrast while staying in the warm family. NEVER use salmon for branding, badges, or decorative elements — only interactive CTAs.

**Feature colours (consistent everywhere):**
- Fasting/timer active: `#e07b30` (warm orange) — timer ring, fasting badge, fasting-related elements
- Weight: `#e8a84c` (light gold) — weight cards, BMI, scale-related
- Water/hydration: `#5b8dd9` (blue) — water ring, hydration cards, water quick-add
- Steps/activity: `#7AAE79` (green) — steps ring, activity cards, steps quick-add
- Autophagy/cellular: `#7B68AE` (purple) — autophagy depth, cellular age, renewal
- Fat burn/inflammation: `#E8913A` (orange) — fat burned, HGH, inflammation
- Heart/health: `#C25450` (red) — heart rate, health concerns, errors

**Important:** The brand gold `#c8872a` and CTA salmon `#d4956a` must never be confused. If something represents the Aayu brand, it's gold. If something is a button the user taps to take action, it's salmon.

**Typography scale (use existing `FONT_SIZES` from theme.ts, scaled by FONT_SCALE 1.2):**
- Timer display: 52px, weight 300, letter-spacing -2
- Hero values: 28px, weight 700
- Card values: 20-24px, weight 700
- Section titles: 16px, weight 700
- Card labels: 11px, weight 600, letter-spacing 0.8-1.2, uppercase
- Body text: 14-15px, weight 400-500
- Sublabels: 9-10px, weight 400, muted colour

**Stat row pattern:** Three equal-width cards in a row, each with: icon circle at top → large value → uppercase label below. Used on Today (streak, hours, completed), Water (remaining, glasses, streak), Steps (to goal, distance, kcal).

**Section header pattern:** Title left-aligned (16px, weight 700) + action link right-aligned (12px, weight 600, accent colour). E.g., "Today's progress" + "Set targets".

**Progress ring pattern:** 180px outer ring, 8px stroke width, feature-coloured progress arc, dot indicator at 12 o'clock position, centre shows: large value → unit → percentage/target. Used for timer, water, steps.

**Badge pattern:** Pill-shaped, centred above content. Background: feature colour at 10% opacity. Border: feature colour at 15%. Text: feature colour, 11px, weight 600, letter-spacing 0.8. E.g., "🔥 FASTING", "READY TO FAST".

**Quick-add buttons:** Equal-width cards in a row. Icon circle on top → value (feature colour, 15px weight 700) → label (9px, muted, uppercase). No emojis.

**CTA button:** Full-width, `border-radius: 14px`, `padding: 15px`, background warm salmon/gold `#d4956a`, text dark `#1a0d04`, weight 600, 16px. Icon left of text.

---

## Screens to update

### 1. Onboarding (`app/onboarding.tsx` + `components/onboarding/*.tsx`)

**Current issues:** 5 slides (too many), emojis as slide icons (🔥, 🌿, 🌙, ✨), 10px tag text too small, Vedic slide contradicts brand positioning.

**Changes:**
- Reduce to 3 slides:
  1. "Welcome to Aayu" — keep mandala visual, tag "SMART FASTING · REAL RESULTS"
  2. "Track your fasts" — replace 🔥 emoji with SVG timer/flame icon in icon circle
  3. "Begin your path" — auth screen with Google/Apple/Guest
- Remove slide 3 "See Your Progress" (merge into slide 2 body text)
- Remove slide 4 "Vedic Tradition" entirely (Vedic is in-app discovery, not brand identity)
- Bump tag font to 12px, body to 17px minimum
- Replace ALL emoji icons with lucide-style SVG icons rendered in icon circles
- Keep the colour-shifting backgrounds (gold → orange → gold) — they're beautiful
- Use consistent card/border patterns from the design system

### 2. Profile Setup (`app/profile-setup.tsx` + `components/profile-setup/*.tsx`)

**Current issues:** Emoji-heavy option cards, inconsistent spacing, some steps use old styling.

**Changes:**
- Replace ALL emojis in option cards with lucide SVG icons in icon circles
  - Goal options: Target icon, Zap icon, Heart icon, Sparkles icon (not 🎯⚡❤️✨)
  - Sex options: Use clean text labels or simple abstract SVG shapes
  - Activity levels: Activity/Running/Dumbbell SVG icons (not emojis)
  - Health concerns: Heart/AlertCircle/Shield SVG icons
  - Safety flags: AlertTriangle/ShieldAlert SVG icons
- Ensure all option cards use the same card pattern: `rgba(240,224,192,0.04)` bg, `rgba(240,224,192,0.08)` border
- CTA buttons use the gold/salmon full-width button pattern
- Progress indicator dots match onboarding style
- Typography: step titles 20px weight 700, descriptions 15px weight 400

### 3. Today page (`app/(tabs)/(home)/index.tsx`)

**This is the reference screen — designer already updated.** Ensure code matches the mockup:
- Timer card is the hero with badge, large timer, progress bar, full-width CTA
- Stats row (streak, hours, completed) with icon circles, no emojis
- "Today's progress" section with hydration card, quick-add buttons
- Steps + Weight side-by-side cards
- Remove "Metabolic Journey · NOT STARTED" card for new users (show only after first fast)
- All icons are lucide SVG, no emojis

### 4. Water Intake (`app/(tabs)/(home)/water.tsx`)

**Current issues:** Emoji icons in quick-add buttons (☕🥤💧🏺), inconsistent card styling.

**Changes:**
- Replace ALL emojis with SVG icons:
  - Cup: coffee cup SVG icon
  - Glass: glass/beaker SVG icon  
  - Bottle: bottle SVG icon
  - Large: jug/pitcher SVG icon
- Ring uses water blue `#5b8dd9` consistently
- Quick-add cards use the standard card pattern with icon circles
- Stat row: REMAINING, GLASSES, STREAK
- Add "Today's log" section showing timestamped entries
- Target pill with edit icon
- All in water blue colour family

### 5. Daily Steps (`app/(tabs)/(home)/steps.tsx`)

**Current issues:** Emoji icons in quick-add buttons (🚶🏃🏆), inconsistent styling.

**Changes:**
- Replace ALL emojis with SVG icons (Zap, Activity, Clock, Award)
- Ring uses steps green `#7AAE79` consistently
- Quick-add cards in 2x2 grid pattern
- 7-day history chart with consistent green bars, today highlighted
- Stat row: TO GOAL, DISTANCE, KCAL
- "Auto-syncing from device sensors" indicator
- All in steps green colour family

### 6. Weight (`app/(tabs)/(home)/weight.tsx`)

**Changes:**
- Ensure card patterns match
- Replace any emojis with SVG icons (Scale, TrendingDown, Target)
- Use gold colour family for weight elements
- Weight chart uses consistent styling

### 7. Journey/Analytics (`app/(tabs)/analytics/index.tsx` or `app/(tabs)/calendar/index.tsx` or `app/(tabs)/daily/index.tsx`)

**Changes based on Journey mockup:**
- Week/Month/All toggle at top (same style as Insights 7D/30D/90D toggle)
- Fasting card: icon circle + title + stats row (fasts, hours, avg) + streak blocks
- Weight card: mini bar chart + delta
- Hydration card: progress bar + daily average
- Steps card: progress bar + daily average
- Milestones section: 3-card row with SVG icons (no emojis), locked/unlocked states
- All cards use consistent pattern, all icons are SVG

### 8. Insights (`app/(tabs)/insights/index.tsx`)

**Current state is mostly good.** Minor changes:
- Replace any remaining emojis with SVG icons in metric cards
- Ensure consistency pills match mockup style
- Pro-locked cards use consistent lock overlay at 55% opacity
- Score ring matches the mockup hero card pattern
- Key stats row uses consistent card pattern

### 9. Settings (`app/settings.tsx`)

**Already redesigned in this session.** Verify:
- InfoRow component uses consistent icon circles
- No emojis anywhere
- Same card pattern throughout

### 10. Fast Complete (`app/fast-complete.tsx`)

**Changes:**
- Replace any celebration emojis with SVG Sparkles/Star icons
- Stat cards use consistent pattern
- CTA button uses full-width pattern

### 11. Did You Know (`app/did-you-know.tsx`)

**Changes:**
- Replace any emojis with SVG icons
- Card pattern matches

### 12. Sign In (`app/sign-in.tsx`)

**Changes:**
- Ensure Google/Apple buttons match onboarding auth button styling
- Use mandala or brand mark as visual element

### 13. Notification Settings (`app/notification-settings.tsx`)

**Changes:**
- Replace any emojis with SVG Bell/Clock icons
- Toggle switches use consistent colours
- Card pattern matches

### 14. Tab Bar (`app/(tabs)/_layout.tsx`)

**Changes:**
- Ensure tab icons are consistent SVG lucide icons (not mixed sources)
- Active state uses warm salmon/orange `#d4956a`
- Inactive uses muted `rgba(240,224,192,0.3)`

### 15. Modals & Components

**`FastPlanPickerModal.tsx`** — Replace any emojis in plan cards with SVG icons
**`MetabolicZoneModal.tsx`** — Replace zone emojis with SVG icons
**`ScoreBreakdownModal.tsx`** — Ensure consistent card patterns
**`SmartProjectionCard.tsx`** — Ensure Pro badge matches
**`MonthlyReportCard.tsx`** — Ensure card pattern matches
**`MetricKnowledgeModal.tsx`** — Replace any emojis
**`FastTimePickerModal.tsx`** — Consistent styling
**`WeeklyFastDaysModal.tsx`** — Consistent styling

---

## Global rules (apply everywhere)

### RULE 1: Zero emojis in the UI
Every single emoji must be replaced with a lucide-react-native SVG icon rendered inside an icon circle. The icon circle provides the colour context. No exceptions.

**Common replacements:**
| Emoji | Replacement | Icon circle colour |
|-------|-------------|-------------------|
| 🔥 | `<Flame size={15} />` | `rgba(224,123,48,0.1)`, stroke `#e07b30` |
| 🌿 | `<Leaf size={15} />` | `rgba(122,174,121,0.1)`, stroke `#7AAE79` |
| 🌙 | `<Moon size={15} />` | `rgba(91,141,217,0.1)`, stroke `#5b8dd9` |
| ✨ | `<Sparkles size={15} />` | `rgba(232,168,76,0.1)`, stroke `#e8a84c` |
| 💧 | `<Droplets size={15} />` | `rgba(91,141,217,0.1)`, stroke `#5b8dd9` |
| 🏆 | `<Trophy size={15} />` | `rgba(232,168,76,0.1)`, stroke `#e8a84c` |
| ❤️ | `<Heart size={15} />` | `rgba(194,84,80,0.1)`, stroke `#C25450` |
| 🎯 | `<Target size={15} />` | `rgba(122,174,121,0.1)`, stroke `#7AAE79` |
| ⚡ | `<Zap size={15} />` | `rgba(232,168,76,0.1)`, stroke `#e8a84c` |
| 🧠 | `<Brain size={15} />` | `rgba(123,104,174,0.1)`, stroke `#7B68AE` |
| 📊 | `<BarChart3 size={15} />` | `rgba(91,141,217,0.1)`, stroke `#5b8dd9` |
| 🎂 | `<Calendar size={15} />` | `rgba(232,168,76,0.1)`, stroke `#e8a84c` |
| ☕ | Coffee cup SVG | `rgba(91,141,217,0.1)`, stroke `#5b8dd9` |
| 🥤 | Glass SVG | `rgba(91,141,217,0.1)`, stroke `#5b8dd9` |
| 🏃 | `<Activity size={15} />` | `rgba(122,174,121,0.1)`, stroke `#7AAE79` |
| ⏱️ | `<Clock size={15} />` | `rgba(224,123,48,0.1)`, stroke `#e07b30` |
| 🪔 | (Remove — Vedic) | N/A |
| ✦ | Keep as text mark for brand only | N/A |
| 🙏 | (Remove — Vedic) | N/A |
| ⚑ | `<Flag size={15} />` | `rgba(196,72,72,0.1)`, stroke `#c44848` |

The `✦` symbol is the ONLY non-SVG icon allowed — it's the Aayu brand mark used in text contexts like "✦ Aayu" or "✦ Pro".

### RULE 2: Consistent card pattern
Every card in the app must use:
```tsx
{
  backgroundColor: colors.card,          // or rgba(240,224,192,0.04) on dark
  borderRadius: 16,                       // 14 for smaller cards
  borderWidth: 1,
  borderColor: colors.borderLight,        // or rgba(240,224,192,0.08)
  padding: 16,                            // 12-14 for compact cards
}
```
No shadows. No gradients. No elevated cards.

### RULE 3: Icon circle pattern
Every icon in a card or row must be inside a circle:
```tsx
{
  width: 34,                              // 28-36 depending on context
  height: 34,
  borderRadius: 17,
  backgroundColor: `${featureColor}15`,   // 8-15% opacity of feature colour
  alignItems: 'center',
  justifyContent: 'center',
}
// Icon: <IconName size={15} color={featureColor} />
```

### RULE 4: Typography consistency
Use the existing `FONT_SIZES` from `constants/theme.ts`. The FONT_SCALE (1.2) is already applied globally in `_layout.tsx`. Key sizes:
- Display/timer: `FONT_SIZES.displayHero` (58) or custom 52px, weight 300
- Hero values: `FONT_SIZES.displayMd` (32), weight 700-800
- Card values: `FONT_SIZES.title` (20) to `FONT_SIZES.titleLarge` (22), weight 700
- Section titles: `FONT_SIZES.subheading` (16), weight 700
- Labels: `FONT_SIZES.label` (11), weight 600, letterSpacing 0.8-1.2, uppercase
- Body: `FONT_SIZES.body` (14) to `FONT_SIZES.bodyLarge` (15), weight 400-500
- Sublabels: `FONT_SIZES.caption` (10), weight 400, muted colour

### RULE 5: Consistent stat row
Three equal cards in a row:
```tsx
<View style={{ flexDirection: 'row', gap: 8 }}>
  <StatCard icon={<Icon />} iconBg="..." value="12" label="DAY STREAK" />
  <StatCard icon={<Icon />} iconBg="..." value="182h" label="TOTAL HOURS" />
  <StatCard icon={<Icon />} iconBg="..." value="24" label="COMPLETED" />
</View>
```

### RULE 6: No Vedic references in primary UI
- Remove "May your practice bring peace and strength" from About
- Remove 🪔 and 🙏 emojis
- "Vedic Tradition" slide removed from onboarding
- Vedic calendar features stay in the app but are not surfaced in primary navigation or branding
- The only allowed spiritual reference is the Aayu mandala (which is abstract enough to be non-denominational)

### RULE 7: CTA button pattern
Primary CTAs:
```tsx
{
  backgroundColor: '#d4956a',  // warm salmon, or colors.primary for less prominent
  borderRadius: 14,
  paddingVertical: 15,
  alignItems: 'center',
  justifyContent: 'center',
}
// Text: color '#1a0d04', weight 600, size 16
```

### RULE 8: Progress bars
```tsx
{
  height: 4,
  borderRadius: 2,
  backgroundColor: 'rgba(240,224,192,0.08)',
}
// Fill: featureColor, same height, borderRadius
```

---

## Files to modify

### Screens (13 files)
1. `app/onboarding.tsx` — Reduce slides, replace emojis, bump typography
2. `app/profile-setup.tsx` — Route through steps (if controller lives here)
3. `app/(tabs)/(home)/index.tsx` — Match designer's Today page exactly
4. `app/(tabs)/(home)/water.tsx` — Replace emojis, match water mockup
5. `app/(tabs)/(home)/steps.tsx` — Replace emojis, match steps mockup
6. `app/(tabs)/(home)/weight.tsx` — Replace emojis, consistent cards
7. `app/(tabs)/analytics/index.tsx` (or equivalent Journey tab) — Match Journey mockup
8. `app/(tabs)/insights/index.tsx` — Minor emoji replacements, consistency pass
9. `app/settings.tsx` — Already redesigned, verify no emojis
10. `app/fast-complete.tsx` — Replace emojis
11. `app/did-you-know.tsx` — Replace emojis
12. `app/sign-in.tsx` — Consistency pass
13. `app/notification-settings.tsx` — Replace emojis

### Components (18+ files)
14. `components/onboarding/OnboardingSlide.tsx` — SVG icons instead of emojis
15. `components/onboarding/AuthButtons.tsx` — Consistent button styling
16. `components/profile-setup/OptionCard.tsx` — SVG icon circles
17. `components/profile-setup/Step*.tsx` (all steps) — Replace emojis
18. `components/CircularTimer.tsx` — Match timer mockup
19. `components/FastPlanPickerModal.tsx` — Replace plan emojis
20. `components/MetabolicZoneModal.tsx` — Replace zone emojis
21. `components/MetabolicZoneRiver.tsx` — Replace zone emojis
22. `components/ScoreBreakdownModal.tsx` — Consistent cards
23. `components/SmartProjectionCard.tsx` — Consistent cards
24. `components/MonthlyReportCard.tsx` — Consistent cards
25. `components/MetricKnowledgeModal.tsx` — Replace emojis
26. `components/ReviewPromptCard.tsx` — Replace emojis
27. `components/ThisWeekCard.tsx` — Consistent pattern
28. `components/DailyDashboardCard.tsx` — Consistent pattern

### Tab layout
29. `app/(tabs)/_layout.tsx` — Consistent tab icons and colours

---

## Priority order

1. **Onboarding** (first impression)
2. **Today page** (most used daily)
3. **Water + Steps** (sub-screens users visit daily)
4. **Profile Setup** (second impression for new users)
5. **Journey page** (weekly usage)
6. **Insights page** (weekly usage)
7. **Modals and overlays** (contextual)
8. **Settings, fast-complete, others** (less frequent)

---

## Testing checklist

After all changes:
- [ ] No emoji characters anywhere in the rendered app (search codebase for emoji unicode ranges)
- [ ] Every icon is from lucide-react-native, rendered inside an icon circle
- [ ] All cards use consistent border/background pattern
- [ ] Typography scale is consistent (no ad-hoc font sizes outside FONT_SIZES)
- [ ] Colour coding is functional (blue=water, green=steps, gold=weight, orange=fasting, purple=autophagy)
- [ ] Onboarding is exactly 3 slides
- [ ] No Vedic references in primary UI (only in Vedic calendar feature)
- [ ] CTA buttons are consistent
- [ ] Light mode and dark mode both work correctly
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] App builds successfully (`npx expo start`)
