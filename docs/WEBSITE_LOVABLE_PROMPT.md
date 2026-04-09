# Aayu — Company Website Prompt for Lovable (V2)

## Overview

Build a premium, single-page company website for **Aayu** — a preventive health technology company building app-based wellness tools. The first product is the **Aayu Fasting App** (live), with more products coming.

**Inspiration reference:** https://home.medvi.org/ — study its layout: company-level hero → product sections with visuals → product lineup → values → footer. Adapt this structure for Aayu, but with our own aesthetic (dark, warm, gold-accented, calm — NOT clinical/white like Medvi).

**Critical framing:** Aayu is a health technology company, not just a fasting app. The website should position the company as building a suite of preventive health tools. Fasting is the first and current product, but the vision is much larger — metabolic health tracking, sleep, stress, movement, and more. The website should feel like visiting the homepage of a serious health company, not a single app's landing page.

**Platform:** Aayu products are purely app-based (iOS + Android). There is no web dashboard. The website exists to explain the vision, showcase the fasting app, and drive app store downloads.

**Domain:** aayu.health (placeholder)
**Company tagline:** "Preventive health for the modern world"
**App tagline:** "Fast smarter. Live longer."

---

## Brand identity

### Colours
- **Primary background (dark sections):** `#0a0604` (near-black, warm)
- **Card backgrounds:** `#141008`
- **Brand gold:** `#c8872a` (logo, brand mark, links, accents)
- **Gold light:** `#e8a84c` (highlights, badges)
- **CTA salmon:** `#d4956a` (primary action buttons ONLY — "Download", "Join Waitlist")
- **Cream text (on dark):** `#f0e0c0`
- **Muted text (on dark):** `rgba(240,224,192,0.5)`
- **Light section background:** `#fdf3e3` (warm parchment — NOT white)
- **Text on light:** `#1e1004` (heading), `rgba(30,16,4,0.6)` (body)
- **Success green:** `#3aaa6e` / `#7AAE79`
- **Info blue:** `#5b8dd9`

**Rule:** Gold `#c8872a` is the brand identity colour — logo, ✦ mark, accents, links. Salmon `#d4956a` is ONLY for tappable action buttons. Never use salmon for branding.

### Typography
- **Display / headings:** Cormorant Garamond (Light 300, Light Italic) — from Google Fonts. Elegant, editorial, premium.
- **Body / UI:** DM Sans (Regular 400, Medium 500) — clean, modern, readable.
- **Brand mark:** "✦ Aayu" — Cormorant Garamond, gold, generous letter-spacing.
- **NEVER** use generic fonts (Inter, Roboto, Arial, system fonts). The typography must feel intentional and premium.

### Logo assets (in `/assets/brand/`)
- **Full logo (dark):** `logo-full-dark.svg` — mandala + "Aayu" + "INTERMITTENT FASTING" (640×128)
- **Full logo (light):** `logo-full-light.svg` — same, brown tones
- **Compact (dark):** `logo-compact-dark.svg` — mandala + "Aayu" only (320×72)
- **Compact (light):** `logo-compact-light.svg`
- **Favicon:** `logo-mark-mono-dark.svg` — mandala mark only, gold (96×96)
- **App icon:** `logo-icon-dark-512.svg` — full mandala, dark bg, rounded (512×512)

The mandala mark is an 8-petal lotus with concentric rings and a centre diamond. All strokes are semi-transparent gold — it feels "drawn" not "filled."

### Design tone
Premium, calm, aspirational. Think: Oura Ring's scientific credibility + Headspace's calm + luxury wellness brand's soul. Clean whitespace, large editorial typography, subtle scroll animations. Nothing aggressive, bouncy, or salesy. The feeling: "This is a serious, beautiful company that knows what it's doing."

---

## Site structure — single page, 8 sections

1. Navigation (sticky)
2. Hero
3. First Product — Aayu Fasting App
4. The science — why fasting works
5. Product lineup — what's coming
6. Company vision
7. Pricing
8. Footer

---

## Section 1 — Navigation (sticky)

Dark background, transparent on scroll until user scrolls past hero.

**Layout:**
- Left: `✦ Aayu` (Cormorant Garamond, gold, letter-spacing)
- Centre: Product · Science · Vision · Pricing (DM Sans, cream, subtle)
- Right: "Download App" button (gold outlined pill, on hover fills gold)

On mobile: hamburger menu with slide-in drawer.

---

## Section 2 — Hero

Full viewport height. Dark background `#0a0604`.
Subtle radial gold glow from top-centre. Large mandala watermark at 3-5% opacity behind text.

**Content (centred):**

Eyebrow tag: `PREVENTIVE HEALTH · EST. 2025` (DM Sans, gold, 12px, letter-spacing 2px)

Main headline (very large, Cormorant Garamond Light 300, cream):
```
"Health is not the absence
 of disease.
 It is the art of living well."
```

Sub-headline (DM Sans, muted, max-width 600px):
```
"Aayu builds tools that help you understand your body —
 combining modern metabolic science with preventive
 health practices trusted for thousands of years."
```

Two CTA buttons side by side:
- Primary: "Download for iOS" (Apple icon, salmon filled `#d4956a`, dark text)
- Secondary: "Download for Android" (Play icon, gold outlined)

Below buttons: `"Free to start · No credit card required"` (muted, 13px)

Social proof line: `"★★★★★ Trusted by early fasters across 40+ countries"` (14px, muted)

Right side (desktop) / below (mobile): Phone mockup showing the Aayu fasting timer screen with ambient gold glow behind it. Use placeholder phone frame.

---

## Section 3 — First product: Aayu Fasting App

Dark section with slightly lighter card background.

Section eyebrow: `OUR FIRST PRODUCT` (gold, small caps, letter-spacing)
Headline (Cormorant Garamond): `"Aayu — Fasting & Metabolic Health"`
Sub: `"The most thoughtfully designed fasting app. Built for people who take their health seriously."` (DM Sans)

**Layout:** Left side phone mockups (2-3 fanned/stacked) + Right side feature list.

**Feature list** (icon + title + description, vertically stacked):

1. **Icon:** Timer/clock SVG
   **Title:** "Intermittent fasting, beautifully tracked"
   **Desc:** "16:8, 18:6, 20:4, OMAD, 5:2, and custom plans. A timer that shows your real-time metabolic zones — from fat burning to deep autophagy."

2. **Icon:** BarChart SVG
   **Title:** "Metabolic Discipline Score"
   **Desc:** "A single 0-100 score that captures your fasting quality. Duration, consistency, circadian alignment, and deep fast depth — all in one number."

3. **Icon:** TrendingDown SVG
   **Title:** "Smart Weight Projection"
   **Desc:** "Based on your actual logged data — not generic formulas. Gets more accurate the more you track. See when you'll hit your goal."

4. **Icon:** FileText SVG
   **Title:** "Monthly health reports"
   **Desc:** "Beautiful PDF reports you can share with your doctor. Metabolic score trends, weight progress, behaviour intelligence, and personalised coaching."

5. **Icon:** Droplets SVG + Activity SVG
   **Title:** "Complete health picture"
   **Desc:** "Beyond fasting — track your weight, water intake, and daily steps. See how they all connect to your metabolic health in one place."

6. **Icon:** Shield SVG
   **Title:** "Safety first"
   **Desc:** "Built-in safeguards for under-18 users, underweight individuals, and pregnancy. Your health always comes first."

Below features: Two download buttons (App Store + Google Play, gold-tinted badges).

---

## Section 4 — The science: why fasting works

Light parchment background `#fdf3e3` for contrast shift.

Section eyebrow: `THE SCIENCE` (gold on light)
Headline (Cormorant Garamond, dark text): `"Why intermittent fasting is the most powerful free health intervention"`

Three cards in a row (dark cards on light bg — creates beautiful contrast):

**Card 1:** "Weight loss without calorie counting"
Stat: `"3-8% body weight loss in 8-12 weeks"` (large, gold)
Body: "Intermittent fasting reduces insulin, unlocks fat stores, and promotes sustainable weight loss without the misery of calorie restriction."
Citation: "Ref: Varady et al., Annual Review of Nutrition, 2021"

**Card 2:** "Metabolic age reversal"
Stat: `"Up to 20x HGH increase during fasting"` (large, gold)
Body: "Extended fasting triggers autophagy — your body's cellular cleanup process — and boosts growth hormone production, effectively turning back your metabolic clock."
Citation: "Ref: de Cabo & Mattson, NEJM, 2019"

**Card 3:** "Reduced disease risk"
Stat: `"Significant improvement in insulin sensitivity"` (large, gold)
Body: "Regular fasting improves blood sugar regulation, reduces inflammation markers, and is associated with lower risk of type 2 diabetes, heart disease, and certain cancers."
Citation: "Ref: Patterson & Sears, Annual Review of Nutrition, 2017"

Below cards — pull quote (large, Cormorant Garamond Italic, dark text):
```
"Fasting is the greatest remedy —
 the physician within."
 — Paracelsus
```

---

## Section 5 — Product lineup: what's coming

Dark section.

Section eyebrow: `WHAT WE'RE BUILDING`
Headline (Cormorant Garamond): `"A complete preventive health suite"`
Sub: `"Fasting is just the beginning"` (DM Sans, muted)

Horizontal scrollable card row (or 3-col grid on desktop). Each card has a status badge.

**Card 1 — LIVE:**
- Icon: Clock SVG (gold)
- Name: "Fasting & Metabolic Health"
- Desc: "Intermittent fasting tracker with metabolic analytics, weight projection, and monthly health reports."
- Badge: `"Available Now"` (green badge `#3aaa6e`)
- CTA: "Download →" (salmon button)

**Card 2 — COMING:**
- Icon: Activity SVG (blue)
- Name: "Metabolic Health Tracker"
- Desc: "Track glucose, HbA1c, and lipid panels over time. Upload your lab reports — AI reads and trends them."
- Badge: `"Coming 2026"` (gold badge)

**Card 3 — COMING:**
- Icon: Moon SVG (purple)
- Name: "Sleep & Recovery"
- Desc: "Correlate your fasting windows with sleep quality. Find your optimal eating cutoff time."
- Badge: `"Coming 2026"` (blue badge)

**Card 4 — COMING:**
- Icon: Brain SVG (purple)
- Name: "Stress & HRV"
- Desc: "HRV tracking reveals why you fast better in low-stress weeks. Breathing exercises built in."
- Badge: `"2027"` (muted badge)

**Card 5 — COMING:**
- Icon: Zap SVG (green)
- Name: "Movement & VO₂ Max"
- Desc: "The strongest longevity predictor, tracked alongside your fasting and metabolic data."
- Badge: `"2027"` (muted badge)

Below cards — waitlist strip (subtle gold gradient border or glow):
```
"Be the first to know when new products launch"
[Join Waitlist →] button (salmon)
```

---

## Section 6 — Company vision

Dark section. Full width. Centred text. Very generous padding.
Faint mandala pattern tiled in background at 3% opacity.

Eyebrow: `OUR VISION`

Large headline (Cormorant Garamond Light, cream):
```
"We are building the preventive
 health platform for the world"
```

Body paragraphs (DM Sans, muted, max-width 600px, centred):
```
"Chronic disease is the defining health crisis of our generation.
 And yet the most effective preventive practice known to science
 — fasting — has been almost entirely ignored by modern health
 technology."

"Aayu exists to change that."

"We build tools grounded in what works — combining the rigour
 of modern metabolic science with preventive health practices
 that have helped humans thrive for thousands of years."
```

Three value cards below (light parchment background section):

**Value 1:**
Mark: `✦`
Title: "Science-led"
Body: "Every feature is grounded in peer-reviewed metabolic research. We don't guess. We verify."

**Value 2:**
Mark: `✦`
Title: "Privacy-first"
Body: "Your health data is yours. EU-compliant infrastructure, no data selling, full deletion rights."

**Value 3:**
Mark: `✦`
Title: "Designed in the UK"
Body: "Built in London for the world. Available on iOS and Android in 40+ countries."

---

## Section 7 — Pricing

Light parchment background.

Headline: `"Simple, transparent pricing"`
Sub: `"Start for free. Upgrade when you're ready."`

**Monthly / Yearly toggle** at top.

**Two pricing tiers side by side:**

### Free tier
- Price: "Free forever"
- Description: "Everything you need to start fasting with confidence"
- Features:
  - Unlimited fasting tracking (12:12 through 18:6)
  - Real-time metabolic zone tracking
  - 7-day Metabolic Discipline Score
  - Weight, water, and steps tracking
  - Fasting consistency insights
  - Insulin sensitivity & autophagy metrics
  - Circadian alignment score
  - Smart notifications
- CTA: "Download Free" (links to app stores)

### Pro tier (highlighted, "Most Popular" badge)
- Price: Show location-aware pricing:
  - UK/Europe: £3.99/month or £24.99/year (save 48%)
  - US: $4.99/month or $29.99/year (save 50%)
  - India: ₹449/month or ₹2,499/year (save 54%)
  - Default: USD
- Description: "Advanced metabolic intelligence for serious fasters"
- Everything in Free, plus:
  - 30-day and 90-day metabolic insights
  - Smart Weight Projection (AI-powered)
  - Monthly PDF health reports
  - Advanced fasting plans (20:4, OMAD, 36h, 5:2, 4:3)
  - Fat burned, inflammation, cellular age estimates
  - HGH boost tracking
  - Deep autophagy hours
  - Gut rest tracking
  - Behaviour intelligence (weekday/weekend patterns)
- CTA: "Start 7-Day Free Trial" (salmon button)
- Fine print: "Cancel anytime. Trial on yearly only. Managed via App Store / Google Play."

**FAQ accordion below:**

Q: "Is the free version really free?" → Yes, unlimited fasting tracking with no trial period or hidden limits.

Q: "What's the 7-day free trial?" → Full Pro access for 7 days on the yearly plan. Cancel before it ends to avoid charges.

Q: "Can I cancel?" → Yes, anytime via App Store or Google Play settings.

Q: "Is my data safe?" → EU-compliant infrastructure (Supabase). No data selling. Full deletion available.

---

## Section 8 — Footer

Dark background. 4-column layout.

**Col 1:**
`✦ Aayu` logo mark
"Preventive health for the modern world"
© 2026 Aayu Health Ltd. All rights reserved.

**Col 2: Products**
- Fasting & Metabolic Health
- Metabolic Tracker (Coming)
- Sleep & Recovery (Coming)
- Aayu Pro

**Col 3: Company**
- Our Vision
- Privacy Policy
- Terms of Service
- Support (support@aayu.health)

**Col 4: Download**
- App Store badge (gold-tinted)
- Google Play badge (gold-tinted)
- "Join Waitlist →"

**Bottom bar:**
"Designed and built in the United Kingdom 🇬🇧"
Social: Twitter/X · Instagram
Medical disclaimer: "Aayu is not a medical device. Consult your healthcare provider before starting any fasting programme."

---

## Design requirements

- **Single page**, smooth scroll between sections with anchor links
- **Fully responsive** — mobile-first (many visitors come from app store links)
- **Subtle scroll-triggered fade-in animations** for each section (Framer Motion or CSS). Nothing bouncy or playful. Calm, breathing transitions.
- **No stock photos** — use geometric/mandala illustrations and phone mockup frames only
- **Hover states** on all interactive elements
- **Gold glow effect** on primary CTA buttons (subtle box-shadow with gold)
- **Font loading:** Google Fonts (Cormorant Garamond + DM Sans)
- **CSS custom properties** for all colours
- **Dark/light section alternation** creates visual rhythm: dark → dark → light → dark → dark → light → light → dark
- **Phone mockup placeholders** — elegant dark frames with Aayu colour scheme. Real screenshots will be provided later.
- **SEO:** Title "Aayu — Preventive Health Technology", Description "Build lasting health with science-backed intermittent fasting. Track fasts, monitor metabolic health, lose weight. Free on iOS and Android."
- **OG Image:** Create a placeholder with dark bg, mandala mark, "Aayu" wordmark

---

## App store links

- iOS: `https://apps.apple.com/app/aayu-intermittent-fasting/id[APP_ID]` (placeholder)
- Android: `https://play.google.com/store/apps/details?id=com.vedicintermittentfasting.app`

---

## Tone of voice

- **Confident and calm** — not salesy or aggressive
- **Science-forward** — "metabolic health", "autophagy", "circadian rhythm", "insulin sensitivity"
- **Aspirational** — this is about living well, not just losing weight
- **Inclusive** — for everyone from beginners to experienced fasters
- **No medical claims** — always "may help", "research suggests", "estimated". Never "cures" or "guarantees"

---

## What NOT to include

- No blog (v2)
- No web dashboard (app-only product)
- No sign-up form on website (sign-up is in-app)
- No chatbot / live chat
- No competitor comparison tables
- No stock photography
- No Vedic-specific branding on the homepage (Vedic calendar is an in-app discovery feature, not the brand identity)

---

## Legal pages (separate routes, minimal design)

| Page | URL | Content |
|------|-----|---------|
| Privacy Policy | /privacy | GDPR-compliant. Data: fasting records, weight, water, steps, profile. No PHI. Supabase EU. Right to erasure. Contact: privacy@aayu.health |
| Terms of Service | /terms | England & Wales law. Medical disclaimer. Under-18 policy. Subscription terms. IP. Liability limits. |
| Support | /support | FAQ + support@aayu.health. "We respond within 24 hours." |
