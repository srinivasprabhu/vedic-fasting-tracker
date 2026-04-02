# Aayu — Website Prompt for Lovable

## Overview

Build a marketing website for **Aayu**, an intermittent fasting app designed and built in the United Kingdom for users worldwide. The website serves as the app's public face — it needs to convert visitors into app downloads and clearly communicate what makes Aayu different from competitors like Zero, Fastic, and Simple.

**Important positioning:** Aayu is NOT a Vedic or spiritual fasting app. It is a science-backed, modern intermittent fasting app that combines fasting tracking with body metrics (weight, water, steps) to give users a complete picture of their metabolic health. Vedic fasting traditions exist as an optional feature within the app — they are not the brand identity.

**Domain:** aayu.health (or aayufast.com — placeholder, replace with actual domain)
**Tagline:** "Fast smarter. Live longer."
**Secondary tagline:** "Science-backed intermittent fasting with real-time metabolic tracking."

---

## Brand Identity

### Colours
- **Primary accent:** Gold `#c8872a` (dark contexts), `#a06820` (light contexts)
- **Dark background:** `#0e0703` (used in app, hero sections)
- **Light background:** `#fdf8f0` (warm off-white for website body)
- **Cream text (on dark):** `#f0e0c0`
- **Success green:** `#7AAE79` (dark), `#3a7a39` (light)
- **Error/warning:** `#D46060`
- **Text on light:** `#1e1004` (heading), `rgba(30,16,4,0.6)` (body)

### Typography
- **Headings:** System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`), weight 300-400 for hero headings (elegant, light), weight 600-700 for section headings
- **Body:** Same font stack, weight 400, 17-18px, generous line-height (1.6-1.7)
- **Brand mark:** "✦ Aayu" with letter-spacing: 2px on the ✦ symbol

### Logo assets (available in `/assets/brand/`)
- **Full logo (dark bg):** `logo-full-dark.svg` — mandala + "Aayu" wordmark + "INTERMITTENT FASTING" descriptor (640×128)
- **Full logo (light bg):** `logo-full-light.svg` — same layout, brown tones for light backgrounds
- **Compact logo (dark bg):** `logo-compact-dark.svg` — mandala + "Aayu" only, for nav bars (320×72)
- **Compact logo (light bg):** `logo-compact-light.svg` — same, for light nav bars
- **Favicon:** `logo-mark-mono-dark.svg` — mandala mark only, gold on transparent (96×96)
- **App icon:** `logo-icon-dark-512.svg` — full mandala on dark bg with rounded corners (512×512)

Use these SVGs directly in the website. The mandala mark is an 8-petal lotus with concentric rings and a centre diamond. All strokes are semi-transparent gold, giving it an elegant "drawn" quality.

### Design Tone
Premium but approachable. Think Oura Ring's website meets Headspace's warmth. Clean whitespace, large typography, subtle animations on scroll. No clutter, no aggressive CTAs. The design should feel like the app itself — thoughtful, calm, and intelligent.

---

## Pages to Build

### 1. Home / Landing Page

**Hero Section (full viewport height)**
- Dark background (#0e0703) with subtle radial gold glow
- "✦ Aayu" brand mark centred top
- Large headline: "Fast smarter. Live longer." (48-56px, weight 300, cream text)
- Subheadline: "Science-backed intermittent fasting with real-time metabolic tracking. Designed in the UK for the world." (18px, muted cream)
- Two CTA buttons side by side:
  - "Download for iOS" (Apple icon, gold button)
  - "Download for Android" (Play icon, outlined button)
- Below CTAs: "Free to start · No credit card required"
- Subtle scroll indicator arrow at bottom

**Social Proof Bar (light background)**
- "Trusted by fasters in 40+ countries"
- Star rating: "4.8 ★★★★★ on the App Store"
- (Placeholder — replace with real numbers once available)

**Feature Section: "Everything you need to fast with confidence"**
Three feature cards in a row (responsive — stacks on mobile):

Card 1: **Track Your Fasts**
- Icon: Timer/clock
- "Start a fast with one tap. Track 16:8, 18:6, 20:4, OMAD, 5:2, or custom durations. See real-time metabolic zones — from fat burning to deep autophagy."

Card 2: **See Your Progress**
- Icon: Chart/trending up
- "Metabolic Discipline Score, fasting consistency, circadian alignment, and deep fast tracking. Watch your health metrics improve week over week."

Card 3: **Complete Health Picture**
- Icon: Heart/pulse
- "Beyond fasting — track your weight, water intake, and daily steps. See how they all connect to your metabolic health in one place."

**Metabolic Intelligence Section (dark background)**
- Headline: "Your personal metabolic intelligence"
- Subheadline: "Aayu doesn't just count hours. It understands your body."
- Feature list (with icons, alternating left-right layout with app screenshots):
  - **Metabolic Discipline Score** — "A single 0-100 score that captures your fasting quality — duration, consistency, circadian alignment, and deep fast depth."
  - **Smart Weight Projection** — "Based on your actual logged data — not generic formulas. Gets more accurate as you track more."
  - **Monthly PDF Reports** — "Beautiful, detailed health reports you can share with your doctor. Metabolic score trends, weight progress, personalised insights."
  - **Safety First** — "Built-in safeguards for under-18 users, underweight users, pregnancy, and medication interactions. Your health comes first."

**How It Works Section (light background)**
Three steps, horizontal on desktop, vertical on mobile:
1. "Set your goal" — "Weight loss, energy, metabolic health, or spiritual practice. Aayu builds a personalised plan in under 2 minutes."
2. "Fast with confidence" — "One-tap timer with real-time metabolic zone tracking. Smart notifications when you hit milestones."
3. "See real results" — "Track your progress with metabolic scores, weight trends, and AI-powered insights that get smarter over time."

**Designed in the UK Section**
- Small section with Union Jack icon or subtle UK reference
- "Designed and built in London, United Kingdom"
- "Available worldwide on iOS and Android"
- "Data stored securely on EU-compliant infrastructure (Supabase)"

**Final CTA Section (dark background)**
- Headline: "Your fasting journey starts here"
- Subheadline: "Join thousands of people transforming their health with science-backed intermittent fasting."
- Download buttons (same as hero)
- "Free forever · Pro available for advanced features"

**Footer**
- ✦ Aayu brand mark
- Links: Home, Features, Pricing, About, Blog (placeholder), Support
- Links: Privacy Policy, Terms of Service, Cookie Policy
- Social: Twitter/X, Instagram (placeholder links)
- "© 2026 Aayu Health Ltd. All rights reserved."
- "Designed and built in the United Kingdom 🇬🇧"
- Small disclaimer: "Aayu is not a medical device and does not provide medical advice. Consult your healthcare provider before starting any fasting programme."

---

### 2. Pricing Page

**URL:** /pricing

**Headline:** "Simple, transparent pricing"
**Subheadline:** "Start for free. Upgrade when you're ready."

**Two pricing tiers side by side:**

#### Free Tier
- **Price:** "Free forever"
- **Description:** "Everything you need to get started with intermittent fasting"
- Features (with checkmarks):
  - Unlimited fasting tracking (all basic plans: 12:12, 13:11, 14:10, 16:8, 17:7, 18:6)
  - Real-time metabolic zone tracking
  - 7-day Metabolic Discipline Score
  - Weight, water, and steps tracking
  - Fasting consistency insights
  - Insulin sensitivity & autophagy depth metrics
  - Basic health metrics
  - Circadian alignment score
  - Notifications and reminders
- CTA: "Download Free" (links to app stores)

#### Pro Tier (highlighted/recommended)
- **Price:** Show localised pricing based on visitor location:
  - **UK/Europe:** "£3.99/month" or "£24.99/year (save 48%)"
  - **US:** "$4.99/month" or "$29.99/year (save 50%)"
  - **India:** "₹449/month" or "₹2,499/year (save 54%)"
  - Default to USD if location cannot be determined
- **Badge:** "Most Popular" or "Best Value" on the yearly option
- **Description:** "Advanced metabolic intelligence for serious fasters"
- Everything in Free, plus:
  - 30-day and 90-day metabolic insights
  - Smart Weight Projection (AI-powered forecast)
  - Monthly PDF health reports (shareable with your doctor)
  - Advanced fasting plans (20:4, 21:3, 22:2, OMAD, 36h)
  - Weekly schedules (5:2, 4:3) with custom fasting days
  - Fat burned estimates
  - Inflammation reduction tracking
  - Cellular age reduction estimates
  - Growth hormone (HGH) boost tracking
  - Deep autophagy hours
  - Gut rest (digestive recovery) tracking
- CTA: "Start 7-Day Free Trial" (yearly) / "Subscribe Monthly"
- Fine print: "Cancel anytime. 7-day free trial on yearly plan only. Subscription managed through Apple App Store or Google Play."

**Pricing toggle:** Monthly / Yearly switch at the top. When yearly is selected, show the per-month equivalent and savings percentage.

**FAQ Section below pricing:**

Q: "Is the free version really free?"
A: "Yes, completely. You can track unlimited fasts, log your weight, water, and steps, and see your 7-day Metabolic Discipline Score — all without paying anything. No trial period, no hidden limits."

Q: "What's included in the 7-day free trial?"
A: "The free trial gives you full access to all Pro features for 7 days. It's only available on the yearly plan. If you don't cancel before the trial ends, you'll be charged for the first year."

Q: "Can I cancel my subscription?"
A: "Yes, anytime. Manage your subscription through your Apple App Store or Google Play settings. Your Pro features remain active until the end of your billing period."

Q: "Is my data safe?"
A: "Your data is stored securely using Supabase, hosted on EU-compliant infrastructure. Fasting records sync across devices when you sign in. We never sell or share your personal data."

Q: "Do you offer a lifetime plan?"
A: "Not yet, but we're considering it. Join our newsletter to be the first to know."

---

### 3. Privacy Policy Page

**URL:** /privacy

Standard privacy policy covering:
- What data we collect (fasting records, weight logs, water/steps data, profile information)
- What we DON'T collect (we don't store medication data, medical diagnoses, or any PHI)
- How data is stored (Supabase, EU-compliant)
- Third-party services (Supabase for database, RevenueCat for subscriptions, Apple/Google for auth)
- Data retention and deletion (user can delete account and all data)
- Cookie policy (minimal — analytics only)
- GDPR compliance (right to access, right to erasure, data portability)
- Contact: privacy@aayu.health (placeholder)
- Company: Aayu Health Ltd, United Kingdom

---

### 4. Terms of Service Page

**URL:** /terms

Standard terms covering:
- App usage terms
- Subscription terms (auto-renewal, cancellation)
- Medical disclaimer: "Aayu is a wellness tracking tool and does not provide medical advice. Fasting may not be suitable for everyone. Consult your healthcare provider before starting any fasting programme, especially if you are under 18, pregnant, breastfeeding, have diabetes, or take medication."
- Under-18 policy: "Users under 18 should only use Aayu under parental guidance. Weight loss features are restricted for users under 18."
- Intellectual property
- Limitation of liability
- Governing law: England and Wales
- Company: Aayu Health Ltd, United Kingdom

---

### 5. Support / Contact Page

**URL:** /support

- Email: support@aayu.health (placeholder)
- FAQ section (can reuse pricing FAQ plus additional):
  - "How do I start a fast?"
  - "How do I change my fasting plan?"
  - "How do I log my weight?"
  - "How do I sync my data across devices?"
  - "How do I cancel my subscription?"
  - "How do I delete my account?"
- Link to app store review pages
- "We typically respond within 24 hours"

---

## Technical Requirements

- **Framework:** Use whatever Lovable supports best (likely React/Next.js)
- **Responsive:** Must work beautifully on mobile (many visitors will come from app store links), tablet, and desktop
- **Performance:** Fast loading, optimised images, minimal JS bundle
- **SEO:** Proper meta tags, Open Graph tags for social sharing, structured data
  - Title: "Aayu — Smart Intermittent Fasting App"
  - Description: "Track your fasts, monitor your metabolic health, and lose weight with science-backed intermittent fasting. Free on iOS and Android."
  - OG Image: App screenshot or hero visual (create a placeholder)
- **Analytics:** Google Analytics 4 (or Plausible/Simple Analytics for privacy-friendly alternative)
- **App Store Links:**
  - iOS: `https://apps.apple.com/app/aayu-intermittent-fasting/id[APP_ID]` (placeholder)
  - Android: `https://play.google.com/store/apps/details?id=com.vedicintermittentfasting.app`
- **Animations:** Subtle scroll-triggered fade-in animations for sections. No heavy animations. Use Framer Motion or CSS transitions.
- **Dark/light sections:** Alternate between dark (#0e0703) and light (#fdf8f0) sections for visual rhythm
- **App screenshots:** Use placeholder phone mockups with app screenshots (I will provide these later). For now, use elegant placeholder boxes with the Aayu colour scheme.

---

## Tone of Voice

- **Professional but warm** — like a doctor who's also your friend
- **Confident without being aggressive** — no "SIGN UP NOW!!!" energy
- **Science-forward** — mention research, use terms like "metabolic health", "autophagy", "circadian rhythm"
- **Inclusive** — "for everyone from beginners to experienced fasters"
- **No medical claims** — always say "estimated", "may help", "research suggests". Never "cures", "treats", "guarantees"

---

## Pages Summary

| Page | URL | Purpose |
|------|-----|---------|
| Home | / | Convert visitors → app downloads |
| Pricing | /pricing | Explain Free vs Pro, show localised pricing |
| Privacy | /privacy | GDPR-compliant privacy policy |
| Terms | /terms | Terms of service, medical disclaimer |
| Support | /support | FAQ + contact email |

---

## What NOT to Include

- No blog (v2 — will add later)
- No user dashboard / web app (the app is mobile-only)
- No sign-up form on the website (sign-up happens in the app)
- No Vedic branding on the homepage (it's an in-app feature, not the brand identity)
- No medical claims or health guarantees
- No competitor comparison table (avoid legal issues)
- No chatbot or live chat (too early)
