# Aayu Pro Paywall — Figma Design Spec for RevenueCat Import

## Overview

This document contains the exact design specifications to recreate the Aayu Pro paywall in Figma for import into RevenueCat's paywall builder. The design uses the dark theme with the Aayu mandala as the hero element.

---

## 1. Canvas Setup

| Property | Value |
|---|---|
| Frame size | 393 × 852 (iPhone 15 Pro) |
| Background | `#1A0D04` (Aayu dark — near-black warm brown) |
| Corner radius | 0 (full-screen modal) |
| Safe area top | 59px |
| Safe area bottom | 34px |
| Content padding horizontal | 24px |

---

## 2. Colour Palette

### Primary colours (use everywhere)

| Token | Hex | Usage |
|---|---|---|
| `bg-dark` | `#1A0D04` | Paywall background |
| `gold-primary` | `#C97B2A` | CTA button, accent text, mandala, badges |
| `gold-dark` | `#A0611E` | CTA gradient end, secondary accent |
| `text-white` | `#FBF7F0` | Primary text (headings, feature names) |
| `text-muted` | `rgba(251,247,240, 0.50)` | Subtitles, secondary descriptions |
| `text-dim` | `rgba(251,247,240, 0.35)` | Feature descriptions, price subtexts |
| `text-faint` | `rgba(251,247,240, 0.20)` | Footer links (Restore, Terms, Privacy) |
| `divider` | `rgba(251,247,240, 0.06)` | Horizontal lines, card borders |

### Feature icon colours

| Feature | Icon bg | Icon stroke | Border |
|---|---|---|---|
| Weight projection | `rgba(232,168,76, 0.10)` | `#E8A84C` | `rgba(232,168,76, 0.15)` |
| Monthly PDF report | `rgba(139,107,191, 0.10)` | `#8B6BBF` | `rgba(139,107,191, 0.15)` |
| Health integration | `rgba(192,80,80, 0.10)` | `#C05050` | `rgba(192,80,80, 0.15)` |
| Advanced body metrics | `rgba(58,170,110, 0.10)` | `#3AAA6E` | `rgba(58,170,110, 0.15)` |
| 22 Pro break-fast meals | `rgba(91,141,217, 0.10)` | `#5B8DD9` | `rgba(91,141,217, 0.15)` |

---

## 3. Typography

All fonts are **system default** (SF Pro on iOS, Roboto on Android).

| Element | Size | Weight | Colour | Letter spacing | Line height |
|---|---|---|---|---|---|
| "AAYU PRO" badge | 11px | Semibold (600) | `#C97B2A` | 1.5px | 14px |
| Main heading | 24px | Medium (500) | `#FBF7F0` | -0.5px | 30px |
| Subtitle | 14px | Regular (400) | `rgba(251,247,240, 0.50)` | 0 | 20px |
| Feature name | 14px | Medium (500) | `#FBF7F0` | 0 | 18px |
| Feature description | 11px | Regular (400) | `rgba(251,247,240, 0.35)` | 0 | 14px |
| Plan label ("Yearly") | 12px | Medium (500) | `rgba(251,247,240, 0.50)` | 0 | 16px |
| Price | 24px | Medium (500) | `#FBF7F0` | -0.8px | 30px |
| Price subtext ("₹62/month") | 11px | Regular (400) | `rgba(251,247,240, 0.35)` | 0 | 14px |
| "SAVE 58%" badge | 9px | Semibold (600) | `#1A0D04` on `#C97B2A` bg | 0.5px | 12px |
| CTA button | 16px | Semibold (600) | `#1A0D04` | -0.2px | 20px |
| Trial reassurance | 11px | Regular (400) | `rgba(251,247,240, 0.30)` | 0 | 14px |
| Footer links | 11px | Regular (400) | `rgba(251,247,240, 0.20)` | 0 | 14px |

---

## 4. Layout Specification (top to bottom)

### 4a. Mandala hero section

| Property | Value |
|---|---|
| Top padding (from safe area) | 40px |
| Alignment | Centre |

**Radial glow (behind mandala):**
- Shape: Circle, 280px diameter
- Fill: Radial gradient from `rgba(201,123,42, 0.10)` centre to transparent edge
- Centre-aligned with mandala
- This is a decorative layer — sits behind the mandala

**Mandala image:**
- Size: 88 × 88px
- Source: Export from app (see Section 7 for export instructions)
- Centred horizontally

**Outer ring (optional decorative):**
- Circle, 120px diameter, centred on mandala
- Stroke: `rgba(201,123,42, 0.08)`, 1px
- No fill

**Spacing below mandala:** 20px

### 4b. Text block

| Element | Value |
|---|---|
| "AAYU PRO" text | 11px, semibold, `#C97B2A`, letter-spacing 1.5px, uppercase |
| Spacing below | 8px |
| Heading: "Unlock deeper insights" | 24px, medium, `#FBF7F0`, letter-spacing -0.5px |
| Spacing below | 4px |
| Subtitle: "Your fasting journey, fully revealed." | 14px, regular, `rgba(251,247,240, 0.50)` |
| Spacing below | 16px |

### 4c. Divider

| Property | Value |
|---|---|
| Width | Full content width (393 - 48 = 345px) |
| Height | 0.5px |
| Colour | `rgba(251,247,240, 0.06)` |
| Spacing below | 16px |

### 4d. Feature list (5 items)

Each feature row:

| Property | Value |
|---|---|
| Row height | ~54px (auto) |
| Row padding vertical | 10px |
| Gap between icon and text | 12px |
| Separator between rows | 0.5px line, `rgba(251,247,240, 0.05)` |
| Last row has no separator | — |

**Icon box (per row):**
- Size: 34 × 34px
- Corner radius: 10px
- Background: See feature icon colour table above
- Border: 0.5px, see feature icon colour table above
- Icon: 16 × 16px Lucide icon, stroke only, 1.8px stroke width
- Icon centred in box

**The 5 features:**

| # | Icon (Lucide name) | Name | Description |
|---|---|---|---|
| 1 | `activity` (heartbeat line) | Weight projection | See where your weight is heading |
| 2 | `file-text` | Monthly PDF report | Score breakdown and next-month plan |
| 3 | `heart` | Health integration | Apple Health and Google Health Connect |
| 4 | `bar-chart-3` | Advanced body metrics | BMR, body composition, trends |
| 5 | `help-circle` | 22 Pro break-fast meals | Multi-cuisine recipes with 3D guides |

**Spacing below feature list:** 16px

### 4e. Divider

Same as 4c.

### 4f. Pricing cards (side by side)

| Property | Value |
|---|---|
| Layout | Horizontal, 2 cards, 8px gap |
| Each card width | (content width - 8) / 2 ≈ 168px |
| Card corner radius | 14px |
| Card padding | 14px vertical, 12px horizontal |
| Content alignment | Centre |

**Yearly card (selected state):**
- Border: 1.5px solid `#C97B2A`
- Background: `rgba(201,123,42, 0.06)`
- "SAVE 58%" badge: positioned absolute, top: -9px, centred horizontally
  - Background: `#C97B2A`
  - Text: `#1A0D04`, 9px, semibold, letter-spacing 0.5px
  - Padding: 2px 10px
  - Corner radius: 6px
- "Yearly" label: 12px, medium, `rgba(251,247,240, 0.50)`
- Price "₹749": 24px, medium, `#FBF7F0`, letter-spacing -0.8px (6px spacing above)
- Subtext "₹62/month": 11px, regular, `rgba(251,247,240, 0.35)` (2px spacing above)

**Monthly card (unselected state):**
- Border: 1px solid `rgba(251,247,240, 0.08)`
- Background: transparent
- "Monthly" label: 12px, medium, `rgba(251,247,240, 0.50)`
- Price "₹149": 24px, medium, `#FBF7F0`
- Subtext: empty (keep spacing consistent with yearly card)

**Spacing below pricing cards:** 16px

### 4g. CTA button

| Property | Value |
|---|---|
| Width | Full content width (345px) |
| Height | 52px |
| Corner radius | 14px |
| Background | Linear gradient 135°: `#C97B2A` → `#A0611E` |
| Shimmer overlay | Linear gradient 135°: `rgba(255,255,255, 0.12)` top-left → transparent centre (subtle) |
| Text | "Start 7-day free trial" |
| Text colour | `#1A0D04` |
| Text size | 16px, semibold (600) |
| Text alignment | Centre |
| Spacing below | 12px |

### 4h. Reassurance text

| Property | Value |
|---|---|
| Text | "No payment now. Cancel anytime during trial." |
| Size | 11px, regular |
| Colour | `rgba(251,247,240, 0.30)` |
| Alignment | Centre |
| Spacing below | 8px |

### 4i. Footer links

| Property | Value |
|---|---|
| Layout | "Restore purchase | Terms | Privacy" |
| Size | 11px, regular |
| Link colour | `rgba(251,247,240, 0.20)`, underlined |
| Separator "|" colour | `rgba(251,247,240, 0.08)` |
| Separator margin | 8px each side |
| Alignment | Centre |
| Spacing below | Bottom safe area |

---

## 5. Close button (top-right)

RevenueCat adds a close/dismiss button automatically. If you need to place one in Figma for visual accuracy:

| Property | Value |
|---|---|
| Position | Top-right, 20px from right edge, in safe area |
| Size | 28 × 28px |
| Shape | Circle |
| Background | `rgba(251,247,240, 0.08)` |
| Icon | "X" or "×", 14px, `rgba(251,247,240, 0.5)` |

---

## 6. States and Variations

### 6a. Monthly selected state

When user taps "Monthly" card:
- Monthly card border → `1.5px solid #C97B2A`, background → `rgba(201,123,42, 0.06)`
- Yearly card border → `1px solid rgba(251,247,240, 0.08)`, background → transparent
- "SAVE 58%" badge stays on yearly card but visually de-emphasised

### 6b. CTA text variations (for A/B testing in RevenueCat)

Design these as hidden layers in Figma so RevenueCat can swap them:
- **Default:** "Start 7-day free trial"
- **Variant B:** "Try Aayu Pro free"
- **Variant C:** "Unlock Pro — 7 days free"

### 6c. Pricing variations

RevenueCat will inject actual store prices dynamically. Use placeholder variables:
- `{{ price_yearly }}` → ₹749 (or $9.99, €8.99 etc.)
- `{{ price_monthly }}` → ₹149 (or $1.99, €1.79 etc.)
- `{{ price_yearly_monthly }}` → ₹62 (yearly ÷ 12, rounded)

---

## 7. Asset Export Instructions

### 7a. Mandala PNG

The mandala needs to be exported from the app as a static PNG for Figma:

1. Open the app in the iOS simulator
2. Navigate to the onboarding screen where the mandala is visible
3. Take a screenshot, or better — render it programmatically:

```tsx
// Temporary dev-only component to export the mandala
import { captureRef } from 'react-native-view-shot';
import { AayuMandala } from '@/components/onboarding/AayuMandala';

// Render at 2x for retina:
<View ref={mandalaRef} style={{ width: 176, height: 176, backgroundColor: 'transparent' }}>
  <AayuMandala size={176} color="#c8872a" animated={false} glow={true} />
</View>

// Then capture:
const uri = await captureRef(mandalaRef, { format: 'png', quality: 1 });
```

Alternatively, recreate the mandala directly in Figma using the SVG geometry from `AayuMandala.tsx`:
- 8 outer petals at 45° intervals, outer radius 84, inner radius 28, width 22
- 8 inner petals at 45° intervals, outer radius 58, inner radius 20, width 15
- Outer ring: 90px radius, 2px stroke, 25% opacity
- Second ring: 96px radius, 1px stroke, 12% opacity
- Inner ring: 24px radius, 2.5px stroke, 70% opacity
- Inner fill ring: 18px radius, filled 10% opacity, 1.5px stroke 40% opacity
- Centre diamond: 11px tall, 72% width ratio
- All strokes and fills use `#C8872A` (mandala gold) at varying opacities

**Export specs:**
- Size: 176 × 176px (displayed at 88pt on 2x screens)
- Format: PNG with transparency
- Background: Transparent
- No watermark, no text

### 7b. Feature icons

Use Lucide icons (https://lucide.dev). Export each at 32 × 32px PNG with the specific stroke colour:

| Icon | Lucide name | Stroke colour | Export filename |
|---|---|---|---|
| Weight projection | `activity` | `#E8A84C` | `icon-weight.png` |
| Monthly report | `file-text` | `#8B6BBF` | `icon-report.png` |
| Health integration | `heart` | `#C05050` | `icon-health.png` |
| Body metrics | `bar-chart-3` | `#3AAA6E` | `icon-metrics.png` |
| Break-fast meals | `book-open` | `#5B8DD9` | `icon-meals.png` |

Stroke width: 1.8px for all icons.

---

## 8. Figma Layer Structure

```
📄 Aayu Pro Paywall (393 × 852)
├── 🔲 Background (#1A0D04, full frame)
├── 📁 Hero Section
│   ├── ⭕ Radial glow (280px, gradient)
│   ├── 🖼️ Mandala image (88 × 88)
│   └── ⭕ Outer ring (120px, 1px stroke)
├── 📁 Text Block
│   ├── 📝 "AAYU PRO" (badge text)
│   ├── 📝 "Unlock deeper insights" (heading)
│   └── 📝 "Your fasting journey, fully revealed." (subtitle)
├── 📁 Divider 1 (0.5px line)
├── 📁 Feature List (auto-layout, vertical, gap: 0)
│   ├── 📁 Feature Row 1 (Weight projection)
│   │   ├── 🔲 Icon box (34px, rounded)
│   │   └── 📁 Text col (name + description)
│   ├── 📁 Feature Row 2 (Monthly PDF report)
│   ├── 📁 Feature Row 3 (Health integration)
│   ├── 📁 Feature Row 4 (Advanced body metrics)
│   └── 📁 Feature Row 5 (22 Pro break-fast meals)
├── 📁 Divider 2 (0.5px line)
├── 📁 Pricing Section (auto-layout, horizontal, gap: 8)
│   ├── 📁 Yearly Card (selected)
│   │   ├── 🔲 Card bg (rounded, gold border)
│   │   ├── 📁 "SAVE 58%" badge
│   │   ├── 📝 "Yearly"
│   │   ├── 📝 "₹749"
│   │   └── 📝 "₹62/month"
│   └── 📁 Monthly Card (unselected)
│       ├── 🔲 Card bg (rounded, dim border)
│       ├── 📝 "Monthly"
│       └── 📝 "₹149"
├── 📁 CTA Button
│   ├── 🔲 Button bg (gradient fill)
│   ├── 🔲 Shimmer overlay
│   └── 📝 "Start 7-day free trial"
├── 📁 Reassurance
│   └── 📝 "No payment now. Cancel anytime during trial."
└── 📁 Footer
    └── 📝 "Restore purchase | Terms | Privacy"
```

---

## 9. RevenueCat Import Checklist

After building the Figma file:

- [ ] Frame named correctly for RevenueCat's Figma plugin
- [ ] All text layers are editable (not flattened) — RevenueCat maps text to variables
- [ ] Price text uses RevenueCat variable placeholders where possible
- [ ] CTA button is identifiable as the purchase action
- [ ] Yearly/Monthly cards are identifiable as product selectors
- [ ] Close button area is defined (or let RevenueCat add its own)
- [ ] Restore purchase link is present (App Store requirement)
- [ ] Terms and Privacy links are present (App Store requirement)
- [ ] Mandala exported as a separate PNG asset and placed in the design
- [ ] All 5 feature icons exported as separate PNG assets
- [ ] Test the import preview in RevenueCat dashboard
- [ ] Verify dark background renders correctly on both iOS and Android
- [ ] Verify pricing updates correctly when RevenueCat injects store prices

---

## 10. RevenueCat Product Mapping

These are the product IDs configured in your RevenueCat dashboard. Map them to the pricing cards:

| Card | Product ID | Entitlement |
|---|---|---|
| Yearly | `aayu_pro_yearly` | `pro` |
| Monthly | `aayu_pro_monthly` | `pro` |
| Lifetime (future) | `aayu_pro_lifetime` | `pro` |

The entitlement identifier is `pro` — this is what your app checks via `hasActiveProEntitlement()`.

---

## 11. Quick Reference — All Hex Codes for Figma

Copy-paste ready:

```
Background:           #1A0D04
Gold primary:         #C97B2A
Gold dark:            #A0611E
Mandala gold:         #C8872A
Text primary:         #FBF7F0
Text muted (50%):     #FBF7F080
Text dim (35%):       #FBF7F059
Text faint (20%):     #FBF7F033
Divider (6%):         #FBF7F00F
Card border (8%):     #FBF7F014

Icon - Weight:        #E8A84C  (bg: #E8A84C1A)
Icon - Report:        #8B6BBF  (bg: #8B6BBF1A)
Icon - Health:        #C05050  (bg: #C050501A)
Icon - Metrics:       #3AAA6E  (bg: #3AAA6E1A)
Icon - Meals:         #5B8DD9  (bg: #5B8DD91A)
```
