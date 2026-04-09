# Aayu Brand Assets Reference

## Location
All brand assets are in `/assets/brand/`

## Asset inventory

### App icons (512x512, rounded corners)
| File | Background | Use |
|------|-----------|-----|
| `logo-icon-dark-512.svg` | Dark (#0e0703) | App Store, Play Store, dark contexts |
| `logo-icon-light-512.svg` | Light (#fdf8f0) | Light contexts, alternate icon |

**App Store requirement:** Export at 1024x1024 PNG (no alpha) for Apple. 512x512 PNG for Google Play.

### Full logo (mandala + wordmark + descriptor)
| File | Theme | Dimensions | Use |
|------|-------|-----------|-----|
| `logo-full-dark.svg` | Dark (cream text) | 640×128 | Website header (dark sections), marketing, App Store screenshots |
| `logo-full-light.svg` | Light (dark text) | 640×128 | Website header (light sections), print, invoices |

Layout: `[mandala mark]  Aayu` + `INTERMITTENT FASTING` below

### Compact wordmark (mandala + name only)
| File | Theme | Dimensions | Use |
|------|-------|-----------|-----|
| `logo-compact-dark.svg` | Dark | 320×72 | In-app navigation bar, small headers |
| `logo-compact-light.svg` | Light | 320×72 | Light website pages, email headers |

Layout: `[mandala mark]  Aayu` (no descriptor line)

### Mandala mark only (monochrome outline)
| File | Theme | Dimensions | Use |
|------|-------|-----------|-----|
| `logo-mark-mono-dark.svg` | Gold on transparent | 96×96 | Favicon, PDF report watermark, social avatar |
| `logo-mark-mono-light.svg` | Dark brown on transparent | 96×96 | Print, embossing, letterhead |
| `logo-mark-reversed.svg` | White on transparent | 96×96 | Use on coloured/gold backgrounds, merchandise |

## Colour palette

### Primary
| Name | Dark context | Light context | Use |
|------|-------------|---------------|-----|
| Brand gold | `#c8872a` | `#a06820` | Logo, brand mark ✦, Pro badge, active tab, links, onboarding accents. This is the identity colour. |
| CTA salmon | `#d4956a` | `#c4845a` | Primary action buttons ONLY (Begin Fast, End Fast, Get Started, Save). Provides contrast against dark gold bg. |
| Background | `#0e0703` | `#fdf8f0` | App/website background |
| Text | `#f0e0c0` (cream) | `#1e1004` | Primary text |
| Text muted | `rgba(240,224,192,0.55)` | `rgba(30,16,4,0.5)` | Secondary text |

**Rule:** Gold = brand identity. Salmon = interactive CTA. Never mix their roles.

### Semantic
| Name | Dark | Light | Use |
|------|------|-------|-----|
| Success | `#7AAE79` | `#3a7a39` | Positive metrics, weight loss, completion |
| Warning | `#E8C05A` | `#a06820` | Caution states |
| Error | `#D46060` | `#c05050` | Negative metrics, safety warnings |
| Info blue | `#5b8dd9` | `#2255b0` | Water tracking, informational |
| Purple | `#7B68AE` | `#5a4a8a` | Autophagy, cellular metrics |

### Feature colours
| Feature | Colour | Use |
|---------|--------|-----|
| Fasting timer | `#c8872a` gold | Timer ring, fasting-related UI |
| Water | `#5b8dd9` blue | Water cards, hydration metrics |
| Steps | `#7AAE79` green | Steps tracking, activity |
| Weight | `#e8a84c` gold | Weight cards, BMI |
| Autophagy | `#7B68AE` purple | Autophagy depth, cellular renewal |
| Fat burn | `#E8913A` orange | Fat burned, HGH, inflammation |

## Typography
- **Brand name:** Weight 300 (light), letter-spacing 6-10px
- **Descriptor:** Weight 400, letter-spacing 3-5px, 50-55% opacity
- **Font stack:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

## Brand mark
The ✦ symbol is used as a shorthand brand mark in text contexts:
- `✦ Aayu` — in-app headers, website nav
- `✦ A A Y U` — PDF report headers (spaced letters)

## Mandala design elements
- 8-petal lotus with two concentric rings (outer larger, inner smaller)
- Outer circular ring at ~95% radius
- Centre circle with diamond core
- Diamond shape at absolute centre (the "seed" of the mandala)
- All strokes are semi-transparent (opacity 0.4-0.8 depending on context)
- Fill is always very low opacity (0.08-0.22) — the mandala feels "drawn" not "filled"

## Where assets are used

| Context | Asset | How |
|---------|-------|-----|
| App splash screen | `AayuMandala.tsx` component | Animated (rotating, pulsing) |
| Onboarding slides | `AayuMandala.tsx` | With colour tinting per slide |
| Monthly PDF report | Inline SVG in `report-html-template.ts` | Static mandala in header |
| Website hero | `logo-full-dark.svg` | Static, in dark hero section |
| Website nav | `logo-compact-light.svg` | Scroll-aware (compact when scrolled) |
| Website favicon | `logo-mark-mono-dark.svg` | Exported as 32×32 ICO/PNG |
| App Store listing | `logo-icon-dark-512.svg` | Exported as PNG |
| Social media avatar | `logo-mark-mono-dark.svg` | Circular crop |
| Email signature | `logo-compact-light.svg` | Inline in email footer |
