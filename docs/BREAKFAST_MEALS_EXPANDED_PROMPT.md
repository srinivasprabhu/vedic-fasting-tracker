# Aayu — Break-Fast Meals: Expanded Menu + Diet Filters — Cursor Prompt

## Overview

Expand the break-fast meals from 20 to 30, add multi-cuisine coverage (Indian, Mediterranean, Japanese, Mexican, Middle Eastern), replace the single `category` filter with two independent filter rows: **diet type** (All / Veg / Non-Veg / Vegan / Fermented) and **meal type** (All / Quick / Light / Hearty), and add 3D clay-style hero images for each meal. 8 meals free, 22 Pro-only.

## Image assets

**Location:** All meal images go in `assets/images/meals/` directory. Create this directory.

**Naming convention:** `{meal-id}.png` — e.g. `avocado-eggs.png`, `moong-dal-khichdi.png`, `kimchi-tofu-soup.png`.

**Specs for the images (prepare before importing):**
- Format: PNG or WebP (WebP preferred for smaller bundle)
- Size: 600×600px (displayed at ~300px, 2x for retina sharpness)
- Target file size: 40-80KB each after compression (use tinypng.com or `sharp` CLI)
- Style: 3D claymorphic renders on a clean background (the background colour should be similar to the meal's `accentColor` at low saturation)
- Total budget: ~1.5-2.5MB for all 30 images

**Important:** If some images aren't ready yet, the code should handle missing images gracefully — show the emoji fallback instead of crashing. The `image` field is optional (`ImageSourcePropType | null`).

---

## What changes

### 1. Update the `BreakfastMeal` interface

**File:** `constants/breakfastMeals.ts`

Replace the single `category` field with two separate fields:

```typescript
export type DietTag = 'veg' | 'non-veg' | 'vegan';
export type MealType = 'quick' | 'light' | 'substantial';

import { ImageSourcePropType } from 'react-native';

export interface BreakfastMeal {
  id: string;
  name: string;
  tagline: string;
  whyItWorks: string;
  prepMinutes: number;
  difficulty: 'easy' | 'medium';
  /** Diet classification */
  diet: DietTag;
  /** Whether this is a fermented food (overlaps with diet — can be veg + fermented) */
  fermented: boolean;
  /** Meal weight / effort */
  mealType: MealType;
  /** Cuisine origin */
  cuisine: string;
  bestAfter: 'any' | '16h+' | '24h+';
  calories: number;
  macros: { protein: number; carbs: number; fats: number };
  ingredients: string[];
  steps: string[];
  isFree: boolean;
  emoji: string;
  accentColor: string;
  /** 3D clay-style hero image. null = use emoji fallback. */
  image: ImageSourcePropType | null;
}
```

**Key changes from current:**
- `category` → split into `diet` (veg/non-veg/vegan) + `mealType` (quick/light/substantial)
- Added `fermented: boolean` as a standalone flag (because fermented is orthogonal to diet — you can have fermented + veg, fermented + vegan, fermented + non-veg)
- Added `cuisine: string` for display ("Indian", "Japanese", "Mediterranean", etc.)
- Added `image: ImageSourcePropType | null` for 3D clay-style hero images

### 1b. Add the image require map

At the top of `constants/breakfastMeals.ts`, after the interface definition, add a centralised image map. Using `require()` for static images is mandatory in React Native — dynamic paths don't work.

```typescript
// ── Image map — require() must use static string literals ────────────────────
// If an image file doesn't exist yet, set the entry to null.
// The UI will fall back to the emoji.

const MEAL_IMAGES: Record<string, ImageSourcePropType | null> = {
  'greek-yoghurt-bowl':     tryRequire(() => require('@/assets/images/meals/greek-yoghurt-bowl.png')),
  'avocado-eggs':           tryRequire(() => require('@/assets/images/meals/avocado-eggs.png')),
  'bone-broth-starter':     tryRequire(() => require('@/assets/images/meals/bone-broth-starter.png')),
  'moong-dal-khichdi':      tryRequire(() => require('@/assets/images/meals/moong-dal-khichdi.png')),
  'banana-almond-smoothie': tryRequire(() => require('@/assets/images/meals/banana-almond-smoothie.png')),
  'overnight-oats':         tryRequire(() => require('@/assets/images/meals/overnight-oats.png')),
  'idli-chutney':           tryRequire(() => require('@/assets/images/meals/idli-chutney.png')),
  'miso-soup-tofu':         tryRequire(() => require('@/assets/images/meals/miso-soup-tofu.png')),
  'dahi-poha':              tryRequire(() => require('@/assets/images/meals/dahi-poha.png')),
  'ragi-porridge':          tryRequire(() => require('@/assets/images/meals/ragi-porridge.png')),
  'pesarattu':              tryRequire(() => require('@/assets/images/meals/pesarattu.png')),
  'upma-vegetables':        tryRequire(() => require('@/assets/images/meals/upma-vegetables.png')),
  'curd-rice':              tryRequire(() => require('@/assets/images/meals/curd-rice.png')),
  'pongal':                 tryRequire(() => require('@/assets/images/meals/pongal.png')),
  'shakshuka':              tryRequire(() => require('@/assets/images/meals/shakshuka.png')),
  'hummus-plate':           tryRequire(() => require('@/assets/images/meals/hummus-plate.png')),
  'labneh-za-atar':         tryRequire(() => require('@/assets/images/meals/labneh-za-atar.png')),
  'lentil-soup-lebanese':   tryRequire(() => require('@/assets/images/meals/lentil-soup-lebanese.png')),
  'ochazuke':               tryRequire(() => require('@/assets/images/meals/ochazuke.png')),
  'kimchi-tofu-soup':       tryRequire(() => require('@/assets/images/meals/kimchi-tofu-soup.png')),
  'natto-rice':             tryRequire(() => require('@/assets/images/meals/natto-rice.png')),
  'salmon-greens':          tryRequire(() => require('@/assets/images/meals/salmon-greens.png')),
  'chicken-sweet-potato':   tryRequire(() => require('@/assets/images/meals/chicken-sweet-potato.png')),
  'egg-veggie-frittata':    tryRequire(() => require('@/assets/images/meals/egg-veggie-frittata.png')),
  'chia-pudding':           tryRequire(() => require('@/assets/images/meals/chia-pudding.png')),
  'turkey-lettuce-wraps':   tryRequire(() => require('@/assets/images/meals/turkey-lettuce-wraps.png')),
  'black-bean-bowl':        tryRequire(() => require('@/assets/images/meals/black-bean-bowl.png')),
  'huevos-rancheros':       tryRequire(() => require('@/assets/images/meals/huevos-rancheros.png')),
  'sauerkraut-bowl':        tryRequire(() => require('@/assets/images/meals/sauerkraut-bowl.png')),
  'dosa-sambar':            tryRequire(() => require('@/assets/images/meals/dosa-sambar.png')),
};

/**
 * Safe require wrapper — returns null if the image file doesn't exist yet.
 * This prevents build crashes while images are being created incrementally.
 */
function tryRequire(fn: () => ImageSourcePropType): ImageSourcePropType | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

/** Look up the image for a meal ID. Returns null if not found. */
export function getMealImage(id: string): ImageSourcePropType | null {
  return MEAL_IMAGES[id] ?? null;
}
```

Then in each meal entry, set `image: getMealImage('avocado-eggs')` (or simply reference the map inline). The simplest approach: don't put `image` in each data object at all — instead, have the components call `getMealImage(meal.id)` at render time. This avoids duplicating the map.

**Alternative (simpler, recommended):** Remove the `image` field from the interface entirely and instead export a `getMealImage(id: string)` function. Components call it when they need the image. This keeps the data array clean and avoids the `require()` call being inside the array literal (which Metro bundler can struggle with).

Update the interface:

```typescript
export interface BreakfastMeal {
  id: string;
  name: string;
  tagline: string;
  whyItWorks: string;
  prepMinutes: number;
  difficulty: 'easy' | 'medium';
  diet: DietTag;
  fermented: boolean;
  mealType: MealType;
  cuisine: string;
  bestAfter: 'any' | '16h+' | '24h+';
  calories: number;
  macros: { protein: number; carbs: number; fats: number };
  ingredients: string[];
  steps: string[];
  isFree: boolean;
  emoji: string;
  accentColor: string;
  // No `image` field — use getMealImage(id) instead
}
```

### 2. Update the filter categories

Replace the existing `MEAL_CATEGORIES` constant with two filter arrays:

```typescript
export const DIET_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'veg', label: 'Veg' },
  { key: 'non-veg', label: 'Non-Veg' },
  { key: 'vegan', label: 'Vegan' },
  { key: 'fermented', label: 'Fermented' },
] as const;

export const MEAL_TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'quick', label: 'Quick' },
  { key: 'light', label: 'Light' },
  { key: 'substantial', label: 'Hearty' },
] as const;

export type DietFilterKey = typeof DIET_FILTERS[number]['key'];
export type MealTypeFilterKey = typeof MEAL_TYPE_FILTERS[number]['key'];
```

Remove the old `MEAL_CATEGORIES` constant.

### 3. Update the meal count constants

```typescript
export const FREE_MEAL_COUNT = BREAKFAST_MEALS.filter(m => m.isFree).length;  // 8
export const PRO_MEAL_COUNT = BREAKFAST_MEALS.filter(m => !m.isFree).length;  // 22
```

---

## The 30 meals

Replace the entire `BREAKFAST_MEALS` array. Organise the data in this order: free meals first (8), then Pro meals (22) grouped loosely by cuisine.

### FREE meals (8) — diverse, universally accessible

```typescript
// 1. Greek yoghurt bowl (existing — update fields)
{
  id: 'greek-yoghurt-bowl',
  name: 'Greek yoghurt power bowl',
  tagline: 'Protein-rich, gut-friendly, ready in 3 minutes',
  whyItWorks: 'Greek yoghurt delivers 15-20g of protein with live probiotics that support gut restoration after a fast. The berries provide antioxidants without spiking blood sugar, and nuts add healthy fats for sustained energy.',
  prepMinutes: 3, difficulty: 'easy', diet: 'veg', fermented: true, mealType: 'quick',
  cuisine: 'Mediterranean', bestAfter: 'any', calories: 320,
  macros: { protein: 22, carbs: 28, fats: 14 },
  ingredients: ['200g Greek yoghurt (full-fat)', 'Handful of mixed berries', '1 tbsp honey', '2 tbsp walnuts or almonds, chopped', '1 tbsp chia seeds'],
  steps: ['Spoon Greek yoghurt into a bowl.', 'Top with berries, chopped nuts, and chia seeds.', 'Drizzle with honey. Eat slowly — your stomach has been resting.'],
  isFree: true, emoji: '🫐', accentColor: '#7B68AE',
},

// 2. Avocado eggs (existing — update fields)
{
  id: 'avocado-eggs',
  name: 'Avocado and soft scrambled eggs',
  tagline: 'The classic break-fast — healthy fats meet protein',
  whyItWorks: 'Eggs are one of the most bioavailable protein sources, easy on a resting gut. Avocado provides monounsaturated fats that stabilise blood sugar and keep you satiated. Together they prevent the post-fast glucose spike that causes crashes.',
  prepMinutes: 8, difficulty: 'easy', diet: 'veg', fermented: false, mealType: 'light',
  cuisine: 'Western', bestAfter: 'any', calories: 380,
  macros: { protein: 18, carbs: 12, fats: 28 },
  ingredients: ['2 large eggs', '1/2 ripe avocado, sliced', '1 slice sourdough bread', 'Salt, pepper, chilli flakes', '1 tsp butter or olive oil'],
  steps: ['Heat butter in a pan over low-medium heat.', 'Crack eggs, stir gently for soft curds (2-3 min).', 'Toast bread. Top with avocado and eggs.', 'Season with salt, pepper, chilli flakes.'],
  isFree: true, emoji: '🥑', accentColor: '#3aaa6e',
},

// 3. Bone broth (existing — update fields)
{
  id: 'bone-broth-starter',
  name: 'Warm bone broth with ginger',
  tagline: 'The gentlest way to break a long fast',
  whyItWorks: 'Bone broth is the gold standard for breaking extended fasts (20h+). It\'s liquid, rich in collagen and electrolytes, and extremely easy to digest. The ginger calms nausea and stimulates digestive enzymes. Start with a cup 30 minutes before your main meal.',
  prepMinutes: 5, difficulty: 'easy', diet: 'non-veg', fermented: false, mealType: 'quick',
  cuisine: 'Universal', bestAfter: '24h+', calories: 45,
  macros: { protein: 6, carbs: 2, fats: 1 },
  ingredients: ['250ml bone broth (chicken, beef, or vegetable)', '1 tsp fresh ginger, grated', 'Pinch of sea salt', 'Squeeze of lemon juice (optional)'],
  steps: ['Heat bone broth until steaming (not boiling).', 'Stir in grated ginger and salt.', 'Pour into a mug. Sip slowly over 10-15 minutes.', 'Wait 20-30 min before eating a solid meal.'],
  isFree: true, emoji: '🍵', accentColor: '#d4a017',
},

// 4. Khichdi — NEW (Indian, veg, gentle on stomach)
{
  id: 'moong-dal-khichdi',
  name: 'Moong dal khichdi',
  tagline: 'India\'s original recovery food — light, warm, complete',
  whyItWorks: 'Khichdi has been Ayurveda\'s go-to recovery meal for centuries. Moong dal is the easiest legume to digest, rice provides gentle carbs, and the turmeric + cumin aid digestion. It\'s a complete protein when dal and rice are combined. The soft texture is perfect for a resting gut.',
  prepMinutes: 20, difficulty: 'easy', diet: 'vegan', fermented: false, mealType: 'light',
  cuisine: 'Indian', bestAfter: '16h+', calories: 320,
  macros: { protein: 14, carbs: 48, fats: 6 },
  ingredients: ['1/2 cup moong dal, washed', '1/4 cup rice, washed', '1 tsp ghee or oil', '1/2 tsp turmeric', '1/2 tsp cumin seeds', '3 cups water', 'Salt to taste', 'Squeeze of lemon'],
  steps: ['Heat ghee, add cumin seeds until they splutter.', 'Add washed dal and rice, stir for 1 minute.', 'Add water, turmeric, and salt. Bring to boil.', 'Simmer covered on low for 15-18 min until soft and porridge-like.', 'Squeeze lemon on top. Eat warm.'],
  isFree: true, emoji: '🍚', accentColor: '#d4a017',
},

// 5. Banana almond smoothie (existing — update fields)
{
  id: 'banana-almond-smoothie',
  name: 'Banana almond protein smoothie',
  tagline: 'Blend and go — easy digestion, high protein',
  whyItWorks: 'Blended food is pre-broken-down, making it gentle on a resting digestive system. Banana provides potassium replenishment (often depleted during fasting), almond butter adds healthy fats and protein, and cinnamon helps regulate blood sugar response.',
  prepMinutes: 4, difficulty: 'easy', diet: 'vegan', fermented: false, mealType: 'quick',
  cuisine: 'Universal', bestAfter: 'any', calories: 340,
  macros: { protein: 16, carbs: 38, fats: 16 },
  ingredients: ['1 ripe banana', '1 tbsp almond butter', '200ml almond milk', '1 scoop protein powder (optional)', '1/2 tsp cinnamon', 'Handful of ice'],
  steps: ['Add all ingredients to a blender.', 'Blend until smooth (30-40 seconds).', 'Pour and drink slowly.'],
  isFree: true, emoji: '🍌', accentColor: '#e8a84c',
},

// 6. Overnight oats (existing — update fields)
{
  id: 'overnight-oats',
  name: 'Overnight oats with seeds',
  tagline: 'Prepare tonight, break fast tomorrow — zero effort',
  whyItWorks: 'Soaked oats are softer and easier to digest than cooked ones. The slow-release carbs prevent blood sugar spikes. Seeds provide omega-3 fatty acids and fibre. The perfect "I don\'t want to cook when I\'m hungry" option.',
  prepMinutes: 5, difficulty: 'easy', diet: 'veg', fermented: false, mealType: 'quick',
  cuisine: 'Western', bestAfter: 'any', calories: 350,
  macros: { protein: 14, carbs: 42, fats: 14 },
  ingredients: ['50g rolled oats', '150ml milk of choice', '1 tbsp chia seeds', '1 tbsp flaxseeds', '1 tsp honey', 'Berries or banana to serve'],
  steps: ['Combine oats, milk, seeds, and honey in a jar.', 'Stir well, then stir again after 5 minutes.', 'Refrigerate overnight (or at least 4 hours).', 'Top with fresh fruit before eating.'],
  isFree: true, emoji: '🫙', accentColor: '#5b8dd9',
},

// 7. Idli with chutney — NEW (Indian, veg, fermented)
{
  id: 'idli-chutney',
  name: 'Steamed idli with coconut chutney',
  tagline: 'Fermented, steamed, feather-light — the South Indian way',
  whyItWorks: 'Idli batter is fermented overnight, making it rich in probiotics that reactivate gut bacteria after a fast. Steaming (not frying) keeps it extremely light. The rice-dal combination provides complete protein. Coconut chutney adds healthy fats. This is arguably the most gut-friendly solid food on earth.',
  prepMinutes: 5, difficulty: 'easy', diet: 'vegan', fermented: true, mealType: 'light',
  cuisine: 'Indian', bestAfter: 'any', calories: 250,
  macros: { protein: 10, carbs: 36, fats: 8 },
  ingredients: ['4 idlis (from ready batter or pre-made)', '2 tbsp coconut chutney', '1 tbsp sambhar (optional)', 'Pinch of gunpowder / milagai podi (optional)'],
  steps: ['Steam idlis for 10-12 min (or microwave pre-made ones for 2 min).', 'Serve with coconut chutney on the side.', 'Add sambhar or a dash of milagai podi with sesame oil for extra flavour.', 'Eat slowly — the fermented batter is doing digestive work for you.'],
  isFree: true, emoji: '🫓', accentColor: '#3aaa6e',
},

// 8. Miso soup with tofu (existing — update fields)
{
  id: 'miso-soup-tofu',
  name: 'Miso soup with silken tofu',
  tagline: 'Japanese tradition — fermented, gentle, warming',
  whyItWorks: 'Miso is a fermented food rich in probiotics that reactivate gut bacteria after fasting. Silken tofu adds soft protein. The warm broth rehydrates and the seaweed provides iodine and minerals. Traditionally used in Japanese eating after fasting periods.',
  prepMinutes: 10, difficulty: 'easy', diet: 'vegan', fermented: true, mealType: 'light',
  cuisine: 'Japanese', bestAfter: 'any', calories: 120,
  macros: { protein: 10, carbs: 12, fats: 4 },
  ingredients: ['2 tbsp white miso paste', '400ml water', '100g silken tofu, cubed', '1 sheet nori, torn', '1 spring onion, sliced', '1 tsp wakame seaweed'],
  steps: ['Heat water until just below boiling. Remove from heat.', 'Dissolve miso paste into the water (don\'t boil — kills probiotics).', 'Add tofu cubes and wakame. Let sit 2 minutes.', 'Top with nori and spring onion.'],
  isFree: true, emoji: '🍜', accentColor: '#c05050',
},
```

### PRO meals (22) — multi-cuisine coverage

```typescript
// ─── INDIAN CUISINE (6 Pro meals) ─────────────────────────────────────────

{
  id: 'dahi-poha',
  name: 'Curd poha with peanuts',
  tagline: 'Flattened rice with yoghurt — light, tangy, probiotic',
  whyItWorks: 'Poha (flattened rice) is pre-processed and very easy to digest. Curd adds probiotics and protein. Peanuts provide crunch and healthy fats. Curry leaves and mustard seeds stimulate digestive enzymes. A classic Maharashtrian breakfast adapted perfectly for breaking a fast.',
  prepMinutes: 10, difficulty: 'easy', diet: 'veg', fermented: true, mealType: 'quick',
  cuisine: 'Indian', bestAfter: 'any', calories: 290,
  macros: { protein: 12, carbs: 38, fats: 10 },
  ingredients: ['1 cup poha (flattened rice), rinsed', '3 tbsp curd/yoghurt', '1 tbsp peanuts', '1/2 tsp mustard seeds', 'Few curry leaves', '1 tsp oil', 'Salt, turmeric, lemon juice'],
  steps: ['Rinse poha in water, drain, and let sit 5 min to soften.', 'Heat oil, splutter mustard seeds and curry leaves.', 'Add peanuts, fry 1 minute. Add poha and turmeric, mix gently.', 'Remove from heat, fold in curd, squeeze lemon, season with salt.'],
  isFree: false, emoji: '🥣', accentColor: '#d4a017',
},
{
  id: 'ragi-porridge',
  name: 'Ragi malt porridge',
  tagline: 'Finger millet superfood — calcium-rich, naturally sweet',
  whyItWorks: 'Ragi (finger millet) is one of the highest calcium sources among grains — critical after fasting when mineral absorption is primed. Its high fibre content prevents blood sugar spikes. The warm porridge texture is gentle on the stomach. A staple break-fast food in Karnataka and Tamil Nadu.',
  prepMinutes: 12, difficulty: 'easy', diet: 'vegan', fermented: false, mealType: 'light',
  cuisine: 'Indian', bestAfter: 'any', calories: 220,
  macros: { protein: 8, carbs: 40, fats: 4 },
  ingredients: ['3 tbsp ragi flour', '250ml water', '100ml milk (or coconut milk)', '1 tbsp jaggery or palm sugar', '1/4 tsp cardamom powder', 'Pinch of salt'],
  steps: ['Mix ragi flour with 100ml cold water to make a smooth paste.', 'Boil remaining water + milk. Slowly pour ragi paste in, stirring continuously.', 'Cook on low heat for 5-7 min, stirring, until thick and porridge-like.', 'Add jaggery and cardamom. Serve warm.'],
  isFree: false, emoji: '🥛', accentColor: '#8b6bbf',
},
{
  id: 'pesarattu',
  name: 'Pesarattu (moong dal dosa)',
  tagline: 'High-protein Andhra crepe — no fermentation needed',
  whyItWorks: 'Unlike regular dosa which needs overnight fermentation, pesarattu is made from soaked moong dal ground into batter — ready in hours. Moong dal is the most easily digestible legume, providing complete plant protein. The ginger in the batter aids digestion. Pair with ginger chutney for a powerful digestive kickstart.',
  prepMinutes: 15, difficulty: 'medium', diet: 'vegan', fermented: false, mealType: 'light',
  cuisine: 'Indian', bestAfter: '16h+', calories: 280,
  macros: { protein: 16, carbs: 34, fats: 8 },
  ingredients: ['1 cup green moong dal, soaked 4 hours', '2 green chillies', '1 inch ginger', 'Salt to taste', '1 tsp oil for cooking', 'Ginger chutney to serve'],
  steps: ['Grind soaked moong dal with chillies, ginger, and salt into a smooth batter.', 'Heat a tawa/pan, spread batter thin like a dosa.', 'Drizzle oil around edges, cook until golden (2-3 min).', 'Fold and serve with ginger chutney or coconut chutney.'],
  isFree: false, emoji: '🫓', accentColor: '#3aaa6e',
},
{
  id: 'upma-vegetables',
  name: 'Rava upma with vegetables',
  tagline: 'Semolina comfort food — warm, filling, 12 minutes',
  whyItWorks: 'Rava (semolina) is easily digestible and provides quick energy after a fast. The tempering of mustard seeds, curry leaves, and green chillies stimulates agni (digestive fire). Adding vegetables ensures micronutrient replenishment. Light enough for any fast length.',
  prepMinutes: 12, difficulty: 'easy', diet: 'veg', fermented: false, mealType: 'light',
  cuisine: 'Indian', bestAfter: 'any', calories: 300,
  macros: { protein: 8, carbs: 42, fats: 12 },
  ingredients: ['1/2 cup rava (semolina), dry-roasted', '1 cup mixed vegetables (beans, carrot, peas), finely chopped', '1 tsp mustard seeds', 'Few curry leaves', '1-2 green chillies, slit', '1 tbsp ghee', '1.5 cups water', 'Salt, lemon juice', 'Cashews (optional)'],
  steps: ['Heat ghee, add mustard seeds, curry leaves, chillies, and cashews.', 'Add vegetables, sauté 2-3 minutes.', 'Add water and salt, bring to boil.', 'Slowly add roasted rava while stirring continuously to avoid lumps.', 'Cover, cook on low 3-4 min. Squeeze lemon, fluff with fork.'],
  isFree: false, emoji: '🍛', accentColor: '#e8a84c',
},
{
  id: 'curd-rice',
  name: 'Curd rice (thayir sadam)',
  tagline: 'South Indian comfort — cooling, probiotic, instantly calming',
  whyItWorks: 'Curd rice is arguably the gentlest solid food in Indian cuisine. The yoghurt provides probiotics and protein, the rice is pre-cooked and soft, and the tempering of mustard seeds and curry leaves aids digestion. It\'s cooling — important because fasting can increase body heat. The go-to recovery meal across Tamil Nadu.',
  prepMinutes: 5, difficulty: 'easy', diet: 'veg', fermented: true, mealType: 'quick',
  cuisine: 'Indian', bestAfter: 'any', calories: 280,
  macros: { protein: 10, carbs: 40, fats: 8 },
  ingredients: ['1 cup cooked rice (leftover works great)', '1/2 cup curd/yoghurt', '2 tbsp milk', '1 tsp mustard seeds', 'Few curry leaves', '1 green chilli, chopped', '1 tsp oil', 'Salt, pomegranate seeds (optional)'],
  steps: ['Mix rice with curd, milk, and salt. Mash lightly for creamy texture.', 'Heat oil, splutter mustard seeds, curry leaves, and chilli.', 'Pour tempering over curd rice, mix gently.', 'Garnish with pomegranate seeds. Serve at room temperature.'],
  isFree: false, emoji: '🍚', accentColor: '#5b8dd9',
},
{
  id: 'pongal',
  name: 'Ven pongal',
  tagline: 'Temple food — moong dal and rice with pepper and ghee',
  whyItWorks: 'Ven pongal is temple prasadam across South India — specifically designed to be eaten after fasting during festivals. The dal-rice combination provides complete protein. Black pepper and cumin stimulate digestion. Ghee carries fat-soluble nutrients and soothes the gut lining. This is food designed for breaking fasts.',
  prepMinutes: 20, difficulty: 'medium', diet: 'veg', fermented: false, mealType: 'substantial',
  cuisine: 'Indian', bestAfter: '16h+', calories: 360,
  macros: { protein: 12, carbs: 46, fats: 14 },
  ingredients: ['1/4 cup moong dal', '1/2 cup rice', '2.5 cups water', '1 tsp black peppercorns, crushed', '1 tsp cumin seeds', '1 inch ginger, grated', '2 tbsp ghee', '8-10 cashews', 'Curry leaves, salt'],
  steps: ['Dry roast moong dal until golden. Wash dal and rice together.', 'Pressure cook dal + rice with water for 3-4 whistles until mushy.', 'Heat ghee, add cumin, pepper, ginger, cashews, and curry leaves.', 'Pour tempering into the cooked dal-rice, mix well.', 'Serve hot with coconut chutney.'],
  isFree: false, emoji: '🍲', accentColor: '#d4a017',
},

// ─── MEDITERRANEAN / MIDDLE EASTERN (4 Pro meals) ─────────────────────────

{
  id: 'shakshuka',
  name: 'Simple shakshuka',
  tagline: 'Eggs poached in spiced tomato — warming and rich',
  whyItWorks: 'The tomato base is acidic enough to stimulate digestive juices after a fast. Eggs provide high-quality protein. The spices (cumin, paprika) have anti-inflammatory properties.',
  prepMinutes: 20, difficulty: 'medium', diet: 'veg', fermented: false, mealType: 'substantial',
  cuisine: 'Middle Eastern', bestAfter: '16h+', calories: 340,
  macros: { protein: 18, carbs: 20, fats: 22 },
  ingredients: ['400g chopped tomatoes', '2 eggs', '1 small onion, diced', '1 garlic clove', '1 tsp cumin, 1 tsp paprika', '1 tbsp olive oil', 'Parsley or coriander', 'Bread for dipping'],
  steps: ['Heat oil. Sauté onion and garlic until soft.', 'Add spices, stir 30 seconds. Pour in tomatoes, simmer 8-10 min.', 'Make wells, crack eggs in. Cover, cook 5-6 min.', 'Garnish with herbs. Serve with bread.'],
  isFree: false, emoji: '🍅', accentColor: '#c05050',
},
{
  id: 'hummus-plate',
  name: 'Hummus plate with vegetables and pita',
  tagline: 'Chickpea protein with olive oil — Mediterranean classic',
  whyItWorks: 'Hummus provides plant protein from chickpeas and healthy fats from tahini and olive oil. The fibre content slows glucose absorption. Raw vegetables add enzymes that support digestion. The combination is satisfying without being heavy on a resting gut.',
  prepMinutes: 5, difficulty: 'easy', diet: 'vegan', fermented: false, mealType: 'quick',
  cuisine: 'Mediterranean', bestAfter: 'any', calories: 350,
  macros: { protein: 14, carbs: 36, fats: 18 },
  ingredients: ['100g hummus', '1 whole wheat pita, warmed', 'Cucumber, carrot, bell pepper sticks', '1 tbsp olive oil', 'Paprika, sumac (optional)', 'Few olives'],
  steps: ['Spread hummus on a plate or bowl.', 'Drizzle with olive oil and sprinkle paprika.', 'Arrange pita wedges and vegetable sticks around.', 'Add olives on the side.'],
  isFree: false, emoji: '🫘', accentColor: '#e8a84c',
},
{
  id: 'labneh-za-atar',
  name: 'Labneh with za\'atar and olive oil',
  tagline: 'Strained yoghurt — thicker, creamier, more probiotic',
  whyItWorks: 'Labneh is strained yoghurt with 2-3x the probiotic concentration of regular yoghurt. The straining removes lactose, making it easier to digest. Za\'atar (thyme, sesame, sumac) has antiseptic properties. Olive oil provides monounsaturated fats. A Levantine break-fast tradition.',
  prepMinutes: 3, difficulty: 'easy', diet: 'veg', fermented: true, mealType: 'quick',
  cuisine: 'Middle Eastern', bestAfter: 'any', calories: 260,
  macros: { protein: 16, carbs: 14, fats: 18 },
  ingredients: ['150g labneh (or thick Greek yoghurt)', '1 tbsp za\'atar spice blend', '1 tbsp extra virgin olive oil', 'Flatbread or pita', 'Cherry tomatoes, cucumber (optional)'],
  steps: ['Spread labneh on a plate.', 'Drizzle generously with olive oil.', 'Sprinkle za\'atar over the top.', 'Serve with warm flatbread and fresh vegetables.'],
  isFree: false, emoji: '🫒', accentColor: '#3aaa6e',
},
{
  id: 'lentil-soup-lebanese',
  name: 'Lebanese red lentil soup',
  tagline: 'Silky, spiced, deeply nourishing — one pot',
  whyItWorks: 'Red lentils dissolve when cooked, creating a silky soup that\'s gentle on digestion. High in plant protein and fibre. The cumin and lemon combination stimulates digestive enzymes. Warm soups are among the best first foods after extended fasts.',
  prepMinutes: 25, difficulty: 'medium', diet: 'vegan', fermented: false, mealType: 'substantial',
  cuisine: 'Middle Eastern', bestAfter: '16h+', calories: 300,
  macros: { protein: 18, carbs: 42, fats: 6 },
  ingredients: ['1 cup red lentils', '1 onion, diced', '2 garlic cloves', '1 tsp cumin', '1/2 tsp turmeric', '4 cups vegetable broth', '1 tbsp olive oil', 'Lemon juice, salt'],
  steps: ['Sauté onion and garlic in olive oil until soft.', 'Add cumin and turmeric, stir 30 seconds.', 'Add lentils and broth, bring to boil.', 'Simmer 20 min until lentils dissolve. Blend partially.', 'Finish with lemon juice and salt.'],
  isFree: false, emoji: '🍲', accentColor: '#e07b30',
},

// ─── JAPANESE / KOREAN (3 Pro meals) ──────────────────────────────────────

{
  id: 'ochazuke',
  name: 'Ochazuke (rice in green tea)',
  tagline: 'Japanese minimalism — rice, tea, umami, done',
  whyItWorks: 'Ochazuke is the lightest possible solid meal. Warm green tea over rice is extremely gentle on digestion. The tea provides catechins (antioxidants) and the umami toppings (nori, wasabi) stimulate appetite naturally. A traditional Japanese break-fast food after morning meditation retreats.',
  prepMinutes: 5, difficulty: 'easy', diet: 'vegan', fermented: false, mealType: 'quick',
  cuisine: 'Japanese', bestAfter: '24h+', calories: 180,
  macros: { protein: 6, carbs: 36, fats: 2 },
  ingredients: ['1 bowl cooked rice', '200ml hot green tea (sencha)', '1 sheet nori, torn', '1 tsp sesame seeds', 'Wasabi or pickled plum (optional)', 'Soy sauce dash'],
  steps: ['Place warm rice in a bowl.', 'Pour hot green tea over the rice.', 'Top with nori, sesame seeds, and wasabi.', 'Add a tiny dash of soy sauce. Eat immediately.'],
  isFree: false, emoji: '🍵', accentColor: '#3aaa6e',
},
{
  id: 'kimchi-tofu-soup',
  name: 'Kimchi jjigae (kimchi tofu stew)',
  tagline: 'Korean fermented powerhouse — warming, probiotic, hearty',
  whyItWorks: 'Kimchi is one of the most probiotic-rich fermented foods. The spice generates heat that stimulates digestive fire. Tofu provides gentle protein. The combination of fermented vegetables and warm broth is specifically designed for gut reactivation — Koreans traditionally eat this after periods of restricted eating.',
  prepMinutes: 18, difficulty: 'medium', diet: 'vegan', fermented: true, mealType: 'substantial',
  cuisine: 'Korean', bestAfter: '16h+', calories: 280,
  macros: { protein: 16, carbs: 18, fats: 14 },
  ingredients: ['200g aged kimchi, chopped', '150g firm tofu, cubed', '1 spring onion, sliced', '1 tsp sesame oil', '1 tsp gochugaru (chilli flakes)', '2 cups water or vegetable stock', '1 tsp soy sauce'],
  steps: ['Heat sesame oil, sauté kimchi for 2-3 min.', 'Add water/stock, gochugaru, and soy sauce. Bring to boil.', 'Add tofu cubes, simmer 10-12 min.', 'Garnish with spring onion. Serve with rice if desired.'],
  isFree: false, emoji: '🍲', accentColor: '#c05050',
},
{
  id: 'natto-rice',
  name: 'Natto over warm rice',
  tagline: 'Japan\'s fermented soybean — an acquired taste, powerful probiotics',
  whyItWorks: 'Natto is the most probiotic-dense food on earth — one serving contains billions of Bacillus subtilis. It\'s also the richest food source of vitamin K2, which supports bone health. The slimy texture is unusual but the gut benefits after fasting are unmatched. Traditionally eaten as the first meal of the day in Japan.',
  prepMinutes: 3, difficulty: 'easy', diet: 'vegan', fermented: true, mealType: 'quick',
  cuisine: 'Japanese', bestAfter: 'any', calories: 240,
  macros: { protein: 18, carbs: 30, fats: 8 },
  ingredients: ['1 pack natto (50g)', '1 bowl warm rice', '1 tsp soy sauce', '1 tsp karashi (Japanese mustard)', '1 spring onion, finely sliced', '1 raw egg yolk (optional)'],
  steps: ['Stir natto vigorously with chopsticks until stringy and frothy.', 'Add soy sauce and mustard, stir again.', 'Place natto over warm rice.', 'Top with spring onion (and egg yolk if using).'],
  isFree: false, emoji: '🫘', accentColor: '#8b6bbf',
},

// ─── WESTERN / GENERAL (5 Pro meals) ─────────────────────────────────────

{
  id: 'salmon-greens',
  name: 'Pan-seared salmon with wilted greens',
  tagline: 'Omega-3 powerhouse for deep recovery',
  whyItWorks: 'Salmon is one of the best sources of omega-3 fatty acids, which reduce inflammation amplified during fasting. The protein supports muscle preservation. Wilted spinach or kale adds iron and magnesium — minerals often depleted during extended fasts.',
  prepMinutes: 18, difficulty: 'medium', diet: 'non-veg', fermented: false, mealType: 'substantial',
  cuisine: 'Western', bestAfter: '16h+', calories: 420,
  macros: { protein: 35, carbs: 8, fats: 28 },
  ingredients: ['150g salmon fillet', 'Large handful of spinach or kale', '1 tbsp olive oil', '1 garlic clove, sliced', 'Lemon wedge', 'Salt, pepper'],
  steps: ['Pat salmon dry, season with salt and pepper.', 'Heat olive oil over medium-high heat.', 'Cook salmon skin-down 4 min, flip, 3 more min.', 'Remove salmon. Add garlic and spinach to same pan, wilt 1-2 min.', 'Plate greens, top with salmon, squeeze lemon.'],
  isFree: false, emoji: '🐟', accentColor: '#e07b30',
},
{
  id: 'chicken-sweet-potato',
  name: 'Grilled chicken with roasted sweet potato',
  tagline: 'Lean protein + complex carbs for sustained energy',
  whyItWorks: 'Chicken breast is lean, high-quality protein that\'s easy to digest. Sweet potato provides complex carbs with a low glycaemic index, meaning steady energy without a crash. Together they replenish glycogen stores depleted during fasting.',
  prepMinutes: 28, difficulty: 'medium', diet: 'non-veg', fermented: false, mealType: 'substantial',
  cuisine: 'Western', bestAfter: '16h+', calories: 450,
  macros: { protein: 38, carbs: 40, fats: 12 },
  ingredients: ['150g chicken breast', '1 medium sweet potato, cubed', '1 tbsp olive oil', '1 tsp paprika', 'Salt, pepper, garlic powder', 'Handful of rocket'],
  steps: ['Preheat oven to 200°C. Toss sweet potato with half the oil and paprika. Roast 20 min.', 'Season chicken with salt, pepper, garlic powder.', 'Cook chicken 5-6 min per side.', 'Slice chicken. Serve over sweet potato with greens.'],
  isFree: false, emoji: '🍗', accentColor: '#e07b30',
},
{
  id: 'egg-veggie-frittata',
  name: 'Vegetable frittata',
  tagline: 'One pan, all the nutrients, feeds your whole window',
  whyItWorks: 'A frittata packs eggs (protein + choline), vegetables (micronutrients + fibre), and can be made ahead. The combination of protein and fibre creates strong satiety signals, preventing overeating after a fast.',
  prepMinutes: 20, difficulty: 'medium', diet: 'veg', fermented: false, mealType: 'light',
  cuisine: 'Western', bestAfter: 'any', calories: 360,
  macros: { protein: 24, carbs: 10, fats: 26 },
  ingredients: ['4 eggs, beaten', '1/2 courgette, diced', '1/2 red pepper, diced', 'Cherry tomatoes, halved', '30g feta cheese', '1 tbsp olive oil', 'Salt, pepper, oregano'],
  steps: ['Preheat grill. Heat oil in an oven-safe pan.', 'Sauté courgette and pepper 3-4 min.', 'Pour eggs over veg. Add tomatoes and feta. Cook 5 min.', 'Transfer under grill 3-4 min until golden.', 'Slide onto plate, cut into wedges.'],
  isFree: false, emoji: '🍳', accentColor: '#e8a84c',
},
{
  id: 'chia-pudding',
  name: 'Coconut chia pudding',
  tagline: 'Make it tonight, wake up to a ready meal',
  whyItWorks: 'Chia seeds absorb 10x their weight in liquid, creating a gel that slows digestion and prevents blood sugar spikes. Coconut milk provides MCTs — fats quickly converted to energy, bridging the transition from fasted to fed.',
  prepMinutes: 5, difficulty: 'easy', diet: 'vegan', fermented: false, mealType: 'quick',
  cuisine: 'Western', bestAfter: 'any', calories: 280,
  macros: { protein: 8, carbs: 22, fats: 18 },
  ingredients: ['3 tbsp chia seeds', '200ml coconut milk', '1 tsp vanilla extract', '1 tsp maple syrup', 'Mango or passion fruit to serve'],
  steps: ['Mix chia seeds, coconut milk, vanilla, and maple syrup.', 'Stir well, then again after 5 minutes.', 'Refrigerate overnight or 3+ hours.', 'Top with fresh fruit.'],
  isFree: false, emoji: '🥥', accentColor: '#8b6bbf',
},
{
  id: 'turkey-lettuce-wraps',
  name: 'Turkey lettuce wraps',
  tagline: 'High protein, no bread bloat, satisfying crunch',
  whyItWorks: 'Lean turkey provides high protein with minimal fat. Lettuce instead of bread avoids refined carbs that cause post-fast bloating. The crunch triggers satiety signals faster than soft food.',
  prepMinutes: 12, difficulty: 'easy', diet: 'non-veg', fermented: false, mealType: 'light',
  cuisine: 'Western', bestAfter: 'any', calories: 300,
  macros: { protein: 30, carbs: 8, fats: 16 },
  ingredients: ['150g ground turkey', '4 butter lettuce leaves', '1/2 avocado, sliced', '1 carrot, julienned', '1 tbsp soy sauce', '1 tsp sesame oil', 'Lime wedge'],
  steps: ['Cook turkey with soy sauce and sesame oil (5-6 min).', 'Wash and dry lettuce leaves.', 'Fill each leaf with turkey, avocado, carrot.', 'Squeeze lime. Roll and eat.'],
  isFree: false, emoji: '🥬', accentColor: '#3aaa6e',
},

// ─── MEXICAN / LATIN (2 Pro meals) ───────────────────────────────────────

{
  id: 'black-bean-bowl',
  name: 'Black bean and avocado bowl',
  tagline: 'Fibre-rich, plant-powered, Mexican-inspired',
  whyItWorks: 'Black beans provide plant protein with resistant starch — a type of fibre that feeds beneficial gut bacteria reactivating after a fast. Avocado adds healthy fats for satiety. Lime juice aids iron absorption from the beans. A complete meal with all macros balanced.',
  prepMinutes: 10, difficulty: 'easy', diet: 'vegan', fermented: false, mealType: 'substantial',
  cuisine: 'Mexican', bestAfter: '16h+', calories: 400,
  macros: { protein: 18, carbs: 46, fats: 16 },
  ingredients: ['200g cooked black beans (or 1 tin, drained)', '1/2 avocado, diced', '1/2 cup cooked rice', '2 tbsp salsa or pico de gallo', 'Lime juice', 'Handful of coriander', 'Pinch of cumin'],
  steps: ['Warm black beans with a pinch of cumin and salt.', 'Layer rice in a bowl, top with beans.', 'Add diced avocado and salsa.', 'Squeeze lime, garnish with coriander.'],
  isFree: false, emoji: '🫘', accentColor: '#5b8dd9',
},
{
  id: 'huevos-rancheros',
  name: 'Huevos rancheros (ranch-style eggs)',
  tagline: 'Mexican breakfast classic — eggs on tortilla with salsa',
  whyItWorks: 'The combination of eggs (protein), beans (fibre + plant protein), and corn tortilla (slow-release carbs) creates a perfectly balanced macronutrient profile for breaking a fast. The tomato salsa stimulates digestive juices. A traditional Mexican morning meal after overnight fasting.',
  prepMinutes: 15, difficulty: 'medium', diet: 'veg', fermented: false, mealType: 'substantial',
  cuisine: 'Mexican', bestAfter: '16h+', calories: 420,
  macros: { protein: 22, carbs: 34, fats: 22 },
  ingredients: ['2 eggs', '2 small corn tortillas', '100g refried beans or black beans', '4 tbsp salsa roja', '1/4 avocado, sliced', '1 tbsp oil', 'Coriander, salt'],
  steps: ['Warm tortillas in a dry pan. Set aside.', 'Fry eggs sunny-side-up in oil (2-3 min).', 'Warm beans in the same pan.', 'Layer: tortilla → beans → egg → salsa → avocado.', 'Garnish with coriander.'],
  isFree: false, emoji: '🌮', accentColor: '#c05050',
},

// ─── FERMENTED SPECIALTIES (2 Pro meals) ──────────────────────────────────

{
  id: 'sauerkraut-bowl',
  name: 'Sauerkraut and egg bowl',
  tagline: 'German fermented cabbage — tangy, probiotic, simple',
  whyItWorks: 'Sauerkraut is raw fermented cabbage with billions of lactobacillus probiotics. Eating it as the first food after a fast floods your gut with beneficial bacteria when the gut lining is most receptive. The eggs add protein. Keep the sauerkraut raw (not cooked) to preserve the live cultures.',
  prepMinutes: 8, difficulty: 'easy', diet: 'veg', fermented: true, mealType: 'light',
  cuisine: 'German', bestAfter: 'any', calories: 250,
  macros: { protein: 16, carbs: 8, fats: 18 },
  ingredients: ['3 tbsp raw sauerkraut (unpasteurised)', '2 eggs, soft-boiled or scrambled', '1 slice rye bread or sourdough', '1 tsp mustard (optional)', 'Black pepper'],
  steps: ['Soft-boil eggs (6.5 min) or scramble gently.', 'Toast the bread.', 'Plate eggs on toast, add sauerkraut on the side (do NOT heat it).', 'Add mustard and pepper.'],
  isFree: false, emoji: '🥬', accentColor: '#d4a017',
},
{
  id: 'dosa-sambar',
  name: 'Plain dosa with sambar',
  tagline: 'Fermented rice-dal crepe — crispy, probiotic, iconic',
  whyItWorks: 'Dosa batter is fermented for 8-12 hours, creating a naturally probiotic food. The fermentation breaks down anti-nutrients in rice and dal, making minerals more bioavailable. Sambar (lentil-vegetable stew) adds protein and fibre. The crispy texture stimulates salivary enzymes. The most popular break-fast food across South India for fasting days.',
  prepMinutes: 10, difficulty: 'medium', diet: 'vegan', fermented: true, mealType: 'light',
  cuisine: 'Indian', bestAfter: 'any', calories: 300,
  macros: { protein: 12, carbs: 42, fats: 10 },
  ingredients: ['2 ladles dosa batter (ready-made or homemade)', '1 cup sambar', '2 tbsp coconut chutney', '1 tsp oil or ghee for cooking'],
  steps: ['Heat a tawa/flat pan. Spread a ladle of batter in a circular motion.', 'Drizzle oil around edges. Cook until golden and crispy (2-3 min).', 'Fold dosa. Serve with sambar and coconut chutney.', 'Repeat for the second dosa.'],
  isFree: false, emoji: '🫓', accentColor: '#e07b30',
},
```

---

## Task 2: Update the filter system in the meals list screen

**File:** `app/(tabs)/knowledge/meals.tsx`

Replace the single category filter with two independent filter rows:

### 2a. Update imports

```typescript
import {
  BREAKFAST_MEALS, DIET_FILTERS, MEAL_TYPE_FILTERS,
  FREE_MEAL_COUNT, PRO_MEAL_COUNT,
  DietFilterKey, MealTypeFilterKey,
} from '@/constants/breakfastMeals';
```

### 2b. Replace state and filtering logic

Remove:
```typescript
const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
```

Replace with:
```typescript
const [activeDiet, setActiveDiet] = useState<DietFilterKey>('all');
const [activeMealType, setActiveMealType] = useState<MealTypeFilterKey>('all');
```

Update the filtering:
```typescript
const filteredMeals = useMemo(() => {
  return BREAKFAST_MEALS.filter(m => {
    // Diet filter
    if (activeDiet === 'fermented') {
      if (!m.fermented) return false;
    } else if (activeDiet !== 'all') {
      if (m.diet !== activeDiet) return false;
    }
    // Meal type filter
    if (activeMealType !== 'all') {
      if (m.mealType !== activeMealType) return false;
    }
    return true;
  });
}, [activeDiet, activeMealType]);
```

### 2c. Render two filter rows

Replace the single `ScrollView` filter strip with two rows:

```tsx
{/* Diet filter */}
<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow} style={styles.filterScroll}>
  {DIET_FILTERS.map(f => {
    const isActive = activeDiet === f.key;
    return (
      <TouchableOpacity
        key={f.key}
        style={[styles.filterChip, isActive && { backgroundColor: colors.text }]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveDiet(f.key); }}
        activeOpacity={0.7}
      >
        <Text style={[styles.filterLabel, { color: isActive ? colors.background : colors.textSecondary }]}>{f.label}</Text>
      </TouchableOpacity>
    );
  })}
</ScrollView>

{/* Meal type filter */}
<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow} style={styles.filterScrollSecondary}>
  {MEAL_TYPE_FILTERS.map(f => {
    const isActive = activeMealType === f.key;
    return (
      <TouchableOpacity
        key={f.key}
        style={[styles.filterChipOutline, isActive && { borderColor: colors.text, backgroundColor: hexAlpha(colors.text, 0.06) }]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveMealType(f.key); }}
        activeOpacity={0.7}
      >
        <Text style={[styles.filterLabel, { color: isActive ? colors.text : colors.textMuted }]}>{f.label}</Text>
      </TouchableOpacity>
    );
  })}
</ScrollView>
```

Add the secondary filter styles:
```typescript
filterScrollSecondary: { maxHeight: 40, marginTop: -2 } as ViewStyle,
filterChipOutline: {
  paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10,
  borderWidth: 1, borderColor: colors.borderLight,
} as ViewStyle,
```

### 2d. Update the header subtitle

Change:
```tsx
<Text style={styles.headerSub}>{FREE_MEAL_COUNT} free · {PRO_MEAL_COUNT} with Pro</Text>
```

To show cuisine breadth:
```tsx
<Text style={styles.headerSub}>
  {BREAKFAST_MEALS.length} meals · {FREE_MEAL_COUNT} free · Indian, Japanese, Mediterranean & more
</Text>
```

---

## Task 3: Add cuisine badge to `MealCard`

**File:** `components/meals/MealCard.tsx`

Add a small cuisine label in the meta row. Find the `metaRow` section and add:

```tsx
<View style={styles.metaRow}>
  <View style={styles.metaItem}>
    <Clock size={11} color={colors.textMuted} />
    <Text style={[styles.metaText, { color: colors.textMuted }]}>{meal.prepMinutes} min</Text>
  </View>
  <Text style={[styles.cuisineText, { color: colors.textMuted }]}>{meal.cuisine}</Text>
  <View style={[styles.bestAfterBadge, { backgroundColor: hexAlpha(meal.accentColor, 0.1) }]}>
    <Text style={[styles.bestAfterText, { color: meal.accentColor }]}>
      {meal.bestAfter === 'any' ? 'Any fast' : meal.bestAfter}
    </Text>
  </View>
</View>
```

Add the style:
```typescript
cuisineText: { fontFamily: FONTS.bodyRegular, fontSize: fs(11) } as TextStyle,
```

---

## Task 4: Add cuisine and diet badges to `meal-detail.tsx`

**File:** `app/(tabs)/knowledge/meal-detail.tsx`

Add a diet badge and cuisine tag to the chip row. After the existing "best after" chip, add:

```tsx
<View style={[styles.chip, { backgroundColor: colors.surface }]}>
  <Text style={[styles.chipText, { color: colors.textSecondary }]}>{meal.cuisine}</Text>
</View>
<View style={[styles.chip, { backgroundColor: colors.surface }]}>
  <Text style={[styles.chipText, { color: colors.textSecondary }]}>
    {meal.diet === 'veg' ? 'Vegetarian' : meal.diet === 'vegan' ? 'Vegan' : 'Non-Veg'}
  </Text>
</View>
{meal.fermented && (
  <View style={[styles.chip, { backgroundColor: hexAlpha('#8b6bbf', 0.1) }]}>
    <Text style={[styles.chipText, { color: '#8b6bbf' }]}>Fermented</Text>
  </View>
)}
```

---

## Task 5: Update existing meals in the array

All 20 existing meals need their `category` field replaced with the new `diet`, `fermented`, `mealType`, and `cuisine` fields. Here's the mapping:

| Existing meal | diet | fermented | mealType | cuisine |
|---|---|---|---|---|
| greek-yoghurt-bowl | veg | true | quick | Mediterranean |
| avocado-eggs | veg | false | light | Western |
| bone-broth-starter | non-veg | false | quick | Universal |
| banana-almond-smoothie | vegan | false | quick | Universal |
| overnight-oats | veg | false | quick | Western |
| salmon-greens | non-veg | false | substantial | Western |
| lentil-dal | vegan | false | substantial | Indian |
| chicken-sweet-potato | non-veg | false | substantial | Western |
| miso-soup-tofu | vegan | true | light | Japanese |
| egg-veggie-frittata | veg | false | light | Western |
| chia-pudding | vegan | false | quick | Western |
| turkey-lettuce-wraps | non-veg | false | light | Western |
| sweet-potato-soup | vegan | false | substantial | Western |
| cottage-cheese-plate | veg | false | quick | Western |
| shakshuka | veg | false | substantial | Middle Eastern |
| protein-omelette | veg | false | light | Western |
| quinoa-bowl | vegan | false | substantial | Western |
| sardines-toast | non-veg | false | light | Mediterranean |
| apple-pb-rice-cake | vegan | false | quick | Western |
| turmeric-scramble | veg | false | light | Western |

For any existing meals that are being **replaced** by the new 30-meal list above (because the new list already includes updated versions), simply remove the old entry from the array. The new 30-meal list in Task 1 above contains updated versions of the meals worth keeping.

---

## Verification checklist

- [ ] `npx tsc --noEmit` passes — especially check that `category` field references are fully replaced with `diet` + `mealType`
- [ ] 30 meals in the data file (count the array)
- [ ] 8 free meals, 22 Pro meals
- [ ] Two filter rows visible on the meals list screen: Diet (All/Veg/Non-Veg/Vegan/Fermented) and Meal type (All/Quick/Light/Hearty)
- [ ] Selecting "Veg" shows only vegetarian and egg-based meals
- [ ] Selecting "Vegan" shows only plant-based meals (no eggs, no dairy)
- [ ] Selecting "Non-Veg" shows only meat/fish meals
- [ ] Selecting "Fermented" shows: yoghurt bowl, idli, miso soup, curd poha, curd rice, kimchi jjigae, natto, sauerkraut bowl, dosa, labneh
- [ ] Selecting "Quick" shows only ≤5 min prep meals
- [ ] Combining filters works: "Vegan" + "Quick" shows a subset
- [ ] Indian meals present: khichdi, idli, curd poha, ragi porridge, pesarattu, upma, curd rice, pongal, dosa
- [ ] Japanese meals present: miso soup, ochazuke, natto
- [ ] Korean meals present: kimchi jjigae
- [ ] Middle Eastern meals present: shakshuka, hummus plate, labneh, lentil soup
- [ ] Mexican meals present: black bean bowl, huevos rancheros
- [ ] Detail screen shows cuisine tag and diet badge
- [ ] Fermented meals show a purple "Fermented" badge on the detail screen
- [ ] Today page strip still works (rotates through the 8 free meals)

### Image verification
- [ ] `assets/images/meals/` directory exists
- [ ] MealCard shows 3D image thumbnail (56×56 rounded) when image file exists
- [ ] MealCard shows emoji fallback when image file is missing (no crash)
- [ ] Detail screen shows large 3D image hero with tinted background when image exists
- [ ] Detail screen shows large emoji when image is missing
- [ ] `getMealImage()` returns null gracefully for missing files (tryRequire wrapper works)
- [ ] Images render correctly in both dark and light mode
- [ ] No watermark or Aayu logo on any meal images

## Cuisine coverage summary

| Cuisine | Count | Meals |
|---|---|---|
| Indian | 9 | Khichdi, Idli, Curd poha, Ragi porridge, Pesarattu, Upma, Curd rice, Pongal, Dosa |
| Western | 7 | Avocado eggs, Overnight oats, Salmon, Chicken, Frittata, Chia pudding, Turkey wraps |
| Japanese | 3 | Miso soup, Ochazuke, Natto |
| Middle Eastern | 4 | Shakshuka, Hummus plate, Labneh, Lentil soup |
| Mediterranean | 1 | Greek yoghurt bowl |
| Korean | 1 | Kimchi jjigae |
| Mexican | 2 | Black bean bowl, Huevos rancheros |
| German | 1 | Sauerkraut bowl |
| Universal | 2 | Bone broth, Banana smoothie |

| Diet | Count |
|---|---|
| Veg (incl. eggs/dairy) | 13 |
| Vegan | 10 |
| Non-Veg | 5 |
| Fermented (cross-tag) | 10 |
