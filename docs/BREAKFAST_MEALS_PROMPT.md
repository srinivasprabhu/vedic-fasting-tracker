# Aayu — Break-Fast Meals Guide — Cursor Prompt

## Overview

Add a curated "Break-fast meals" section to the Learn tab — 20 meals specifically designed for breaking a fast, with 5 free and 15 Pro-gated. Also add a "Suggested first meal" card on the fast-complete screen.

This is a **static content feature** — no backend, no user input, no meal planning, no favouriting. It's a hardcoded JSON data file, a list screen, and a detail screen.

## Why this feature exists

The first meal after a fast is the most anxious moment for fasters — especially beginners. Breaking a 16-hour fast with the wrong food can cause bloating, glucose spikes, and undo metabolic benefits. No fasting app currently provides curated first-meal guidance. This is Aayu's unique take: not a recipe app, but a "break your fast right" guide.

---

## Context

**Stack:** React Native, Expo SDK 54, TypeScript, Expo Router v6.

**Existing structure:**
- Learn tab lives at `app/(tabs)/knowledge/` with articles and a quiz
- Fast-complete screen is at `app/fast-complete.tsx`
- Pro gating via `useRevenueCat()` → `isProUser` and `presentPaywall()`
- Design tokens: `fs()`, `lh()`, `FONTS`, `SPACING`, `RADIUS` from `@/constants/theme`
- Colours via `useTheme()` → `colors` (ColorScheme), `hexAlpha()` from `@/constants/colors`
- Icons from `lucide-react-native`

**Files to create:**
```
constants/breakfastMeals.ts                    — The 20 meal data entries
app/(tabs)/knowledge/meals.tsx                 — List screen (all meals)
app/(tabs)/knowledge/meal-detail.tsx           — Detail screen (single meal)
components/meals/MealCard.tsx                  — Compact card for list view
components/meals/MealSuggestionStrip.tsx        — Compact strip for Today page
```

**Files to modify:**
```
app/(tabs)/knowledge/index.tsx                 — Add "Break-fast meals" section
app/(tabs)/(home)/index.tsx                    — Add meal suggestion strip below YesterdayCard
```

---

## Task 1: Create the meal data — `constants/breakfastMeals.ts`

This is the heart of the feature — 20 curated meals. Each entry has a fasting-specific rationale ("why it works"), not just generic recipe info.

```typescript
// constants/breakfastMeals.ts
// 20 curated break-fast meals — static data, no backend.
// First 5 are free, remaining 15 are Pro-only.

export interface BreakfastMeal {
  id: string;
  name: string;
  /** One-line selling point visible in the list view */
  tagline: string;
  /** Why this meal is specifically good for breaking a fast */
  whyItWorks: string;
  /** Prep time in minutes */
  prepMinutes: number;
  /** Difficulty: 'easy' | 'medium' */
  difficulty: 'easy' | 'medium';
  /** Category for filtering */
  category: 'quick' | 'light' | 'substantial' | 'plant-based';
  /** Best after which fast length */
  bestAfter: 'any' | '16h+' | '24h+';
  /** Approximate calories */
  calories: number;
  /** Macro breakdown */
  macros: {
    protein: number;   // grams
    carbs: number;     // grams
    fats: number;      // grams
  };
  /** Simple ingredient list (strings, not structured) */
  ingredients: string[];
  /** Short step-by-step instructions (3-5 steps max) */
  steps: string[];
  /** Whether this meal is free or Pro-only */
  isFree: boolean;
  /** Emoji icon for the list card (food emoji) */
  emoji: string;
  /** Accent colour for the card (matches food type) */
  accentColor: string;
}

export const BREAKFAST_MEALS: BreakfastMeal[] = [
  // ─── FREE MEALS (5) ────────────────────────────────────────────────────────

  {
    id: 'greek-yoghurt-bowl',
    name: 'Greek yoghurt power bowl',
    tagline: 'Protein-rich, gut-friendly, ready in 3 minutes',
    whyItWorks: 'Greek yoghurt delivers 15-20g of protein with live probiotics that support gut restoration after a fast. The berries provide antioxidants without spiking blood sugar, and nuts add healthy fats for sustained energy.',
    prepMinutes: 3,
    difficulty: 'easy',
    category: 'quick',
    bestAfter: 'any',
    calories: 320,
    macros: { protein: 22, carbs: 28, fats: 14 },
    ingredients: [
      '200g Greek yoghurt (full-fat)',
      'Handful of mixed berries (blueberries, raspberries)',
      '1 tbsp honey or maple syrup',
      '2 tbsp walnuts or almonds, roughly chopped',
      '1 tbsp chia seeds',
    ],
    steps: [
      'Spoon Greek yoghurt into a bowl.',
      'Top with berries, chopped nuts, and chia seeds.',
      'Drizzle with honey. Eat slowly — your stomach has been resting.',
    ],
    isFree: true,
    emoji: '🫐',
    accentColor: '#7B68AE',
  },
  {
    id: 'avocado-eggs',
    name: 'Avocado and soft scrambled eggs',
    tagline: 'The classic break-fast — healthy fats meet protein',
    whyItWorks: 'Eggs are one of the most bioavailable protein sources, easy on a resting gut. Avocado provides monounsaturated fats that stabilise blood sugar and keep you satiated. Together they prevent the post-fast glucose spike that causes crashes.',
    prepMinutes: 8,
    difficulty: 'easy',
    category: 'light',
    bestAfter: 'any',
    calories: 380,
    macros: { protein: 18, carbs: 12, fats: 28 },
    ingredients: [
      '2 large eggs',
      '1/2 ripe avocado, sliced',
      '1 slice sourdough or whole grain bread',
      'Salt, pepper, chilli flakes to taste',
      '1 tsp butter or olive oil',
    ],
    steps: [
      'Heat butter in a pan over low-medium heat.',
      'Crack eggs into the pan, stir gently with a spatula for soft curds (2-3 minutes).',
      'Toast the bread. Top with avocado slices and the scrambled eggs.',
      'Season with salt, pepper, and chilli flakes.',
    ],
    isFree: true,
    emoji: '🥑',
    accentColor: '#3aaa6e',
  },
  {
    id: 'bone-broth-starter',
    name: 'Warm bone broth with ginger',
    tagline: 'The gentlest way to break a long fast',
    whyItWorks: 'Bone broth is the gold standard for breaking extended fasts (20h+). It\'s liquid, rich in collagen and electrolytes, and extremely easy to digest. The ginger calms any nausea and stimulates digestive enzymes. Start with a cup 30 minutes before your main meal.',
    prepMinutes: 5,
    difficulty: 'easy',
    category: 'quick',
    bestAfter: '24h+',
    calories: 45,
    macros: { protein: 6, carbs: 2, fats: 1 },
    ingredients: [
      '250ml bone broth (chicken, beef, or vegetable)',
      '1 tsp fresh ginger, grated (or 1/2 tsp ground)',
      'Pinch of sea salt',
      'Squeeze of lemon juice (optional)',
    ],
    steps: [
      'Heat bone broth in a small pot until steaming (not boiling).',
      'Stir in grated ginger and a pinch of salt.',
      'Pour into a mug. Sip slowly over 10-15 minutes.',
      'Wait 20-30 minutes before eating a solid meal.',
    ],
    isFree: true,
    emoji: '🍵',
    accentColor: '#d4a017',
  },
  {
    id: 'banana-almond-smoothie',
    name: 'Banana almond protein smoothie',
    tagline: 'Blend and go — easy digestion, high protein',
    whyItWorks: 'Blended food is pre-broken-down, making it gentle on a resting digestive system. The banana provides quick potassium replenishment (often depleted during fasting), almond butter adds healthy fats and protein, and the cinnamon helps regulate blood sugar response.',
    prepMinutes: 4,
    difficulty: 'easy',
    category: 'quick',
    bestAfter: 'any',
    calories: 340,
    macros: { protein: 16, carbs: 38, fats: 16 },
    ingredients: [
      '1 ripe banana',
      '1 tbsp almond butter',
      '200ml almond milk (or any milk)',
      '1 scoop protein powder (optional)',
      '1/2 tsp cinnamon',
      'Handful of ice',
    ],
    steps: [
      'Add all ingredients to a blender.',
      'Blend until smooth (30-40 seconds).',
      'Pour and drink slowly. If using protein powder, use a gentle plant-based or whey isolate.',
    ],
    isFree: true,
    emoji: '🍌',
    accentColor: '#e8a84c',
  },
  {
    id: 'overnight-oats',
    name: 'Overnight oats with seeds',
    tagline: 'Prepare tonight, break fast tomorrow — zero effort',
    whyItWorks: 'Soaked oats are softer and easier to digest than cooked ones. The slow-release carbs prevent blood sugar spikes. Seeds (chia, flax) provide omega-3 fatty acids and fibre. This is the perfect "I don\'t want to cook when I\'m hungry" option.',
    prepMinutes: 5,
    difficulty: 'easy',
    category: 'quick',
    bestAfter: 'any',
    calories: 350,
    macros: { protein: 14, carbs: 42, fats: 14 },
    ingredients: [
      '50g rolled oats',
      '150ml milk of choice',
      '1 tbsp chia seeds',
      '1 tbsp flaxseeds',
      '1 tsp honey',
      'Handful of berries or sliced banana (to serve)',
    ],
    steps: [
      'Combine oats, milk, chia seeds, flaxseeds, and honey in a jar or bowl.',
      'Stir well. Cover and refrigerate overnight (or at least 4 hours).',
      'In the morning, top with fresh fruit. Eat cold or warm gently.',
    ],
    isFree: true,
    emoji: '🫙',
    accentColor: '#5b8dd9',
  },

  // ─── PRO MEALS (15) ────────────────────────────────────────────────────────

  {
    id: 'salmon-greens',
    name: 'Pan-seared salmon with wilted greens',
    tagline: 'Omega-3 powerhouse for deep recovery',
    whyItWorks: 'Salmon is one of the best sources of omega-3 fatty acids, which reduce inflammation amplified during fasting. The protein supports muscle preservation. Wilted spinach or kale adds iron and magnesium — minerals often depleted during extended fasts.',
    prepMinutes: 18,
    difficulty: 'medium',
    category: 'substantial',
    bestAfter: '16h+',
    calories: 420,
    macros: { protein: 35, carbs: 8, fats: 28 },
    ingredients: [
      '150g salmon fillet',
      'Large handful of spinach or kale',
      '1 tbsp olive oil',
      '1 clove garlic, sliced',
      'Lemon wedge',
      'Salt and pepper',
    ],
    steps: [
      'Pat salmon dry, season with salt and pepper.',
      'Heat olive oil in a pan over medium-high heat.',
      'Place salmon skin-side down. Cook 4 minutes, flip, cook 3 more minutes.',
      'Remove salmon. In the same pan, add garlic, then spinach. Wilt for 1-2 minutes.',
      'Plate greens, top with salmon, squeeze lemon over.',
    ],
    isFree: false,
    emoji: '🐟',
    accentColor: '#e07b30',
  },
  {
    id: 'lentil-dal',
    name: 'Simple lentil dal',
    tagline: 'Plant protein, deeply nourishing, one pot',
    whyItWorks: 'Lentils provide high plant-based protein with fibre that feeds beneficial gut bacteria reactivating after a fast. The turmeric is anti-inflammatory, and the slow-cooked texture is gentle on digestion. A staple break-fast meal in fasting traditions worldwide.',
    prepMinutes: 25,
    difficulty: 'medium',
    category: 'plant-based',
    bestAfter: '16h+',
    calories: 380,
    macros: { protein: 22, carbs: 48, fats: 8 },
    ingredients: [
      '100g red lentils, rinsed',
      '1 small onion, diced',
      '1 tsp turmeric',
      '1 tsp cumin',
      '1 tbsp coconut oil or ghee',
      '400ml water',
      'Salt to taste',
      'Fresh coriander to garnish',
    ],
    steps: [
      'Heat oil in a pot. Sauté onion until soft (3-4 min).',
      'Add turmeric and cumin, stir for 30 seconds.',
      'Add lentils and water. Bring to a boil, then simmer for 18-20 minutes until soft.',
      'Mash slightly for creamier texture. Season with salt.',
      'Serve warm, garnished with fresh coriander. Pair with rice or flatbread if desired.',
    ],
    isFree: false,
    emoji: '🍲',
    accentColor: '#d4a017',
  },
  {
    id: 'chicken-sweet-potato',
    name: 'Grilled chicken with roasted sweet potato',
    tagline: 'Lean protein + complex carbs for sustained energy',
    whyItWorks: 'Chicken breast is lean, high-quality protein that\'s easy to digest. Sweet potato provides complex carbs with a low glycaemic index, meaning steady energy without a sugar crash. Together they replenish glycogen stores depleted during fasting.',
    prepMinutes: 28,
    difficulty: 'medium',
    category: 'substantial',
    bestAfter: '16h+',
    calories: 450,
    macros: { protein: 38, carbs: 40, fats: 12 },
    ingredients: [
      '150g chicken breast',
      '1 medium sweet potato, cubed',
      '1 tbsp olive oil',
      '1 tsp paprika',
      'Salt, pepper, garlic powder',
      'Handful of rocket or mixed greens',
    ],
    steps: [
      'Preheat oven to 200°C. Toss sweet potato cubes with half the oil and paprika. Roast 20 min.',
      'Season chicken with salt, pepper, garlic powder.',
      'Heat remaining oil in a pan. Cook chicken 5-6 min per side until done.',
      'Slice chicken. Serve over roasted sweet potato with greens.',
    ],
    isFree: false,
    emoji: '🍗',
    accentColor: '#e07b30',
  },
  {
    id: 'miso-soup-tofu',
    name: 'Miso soup with silken tofu',
    tagline: 'Japanese tradition — fermented, gentle, warming',
    whyItWorks: 'Miso is a fermented food rich in probiotics that reactivate gut bacteria after fasting. Silken tofu adds soft protein. The warm broth rehydrates and the seaweed provides iodine and minerals. Traditionally used in Japanese eating after fasting periods.',
    prepMinutes: 10,
    difficulty: 'easy',
    category: 'plant-based',
    bestAfter: 'any',
    calories: 120,
    macros: { protein: 10, carbs: 12, fats: 4 },
    ingredients: [
      '2 tbsp white miso paste',
      '400ml water',
      '100g silken tofu, cubed',
      '1 sheet nori, torn into strips',
      '1 spring onion, thinly sliced',
      '1 tsp wakame seaweed (dried)',
    ],
    steps: [
      'Heat water until just below boiling. Remove from heat.',
      'Dissolve miso paste into the water (don\'t boil — it kills probiotics).',
      'Add tofu cubes and wakame. Let sit for 2 minutes.',
      'Serve in a bowl, topped with nori strips and spring onion.',
    ],
    isFree: false,
    emoji: '🍜',
    accentColor: '#c05050',
  },
  {
    id: 'egg-veggie-frittata',
    name: 'Vegetable frittata',
    tagline: 'One pan, all the nutrients, feeds your whole window',
    whyItWorks: 'A frittata packs eggs (protein + choline), vegetables (micronutrients + fibre), and can be made ahead. The combination of protein and fibre creates strong satiety signals, preventing the overeating that often follows a fast.',
    prepMinutes: 20,
    difficulty: 'medium',
    category: 'light',
    bestAfter: 'any',
    calories: 360,
    macros: { protein: 24, carbs: 10, fats: 26 },
    ingredients: [
      '4 eggs, beaten',
      '1/2 courgette, diced',
      '1/2 red pepper, diced',
      'Handful of cherry tomatoes, halved',
      '30g feta cheese, crumbled',
      '1 tbsp olive oil',
      'Salt, pepper, dried oregano',
    ],
    steps: [
      'Preheat grill/broiler. Heat olive oil in an oven-safe pan over medium heat.',
      'Sauté courgette and pepper for 3-4 minutes.',
      'Pour beaten eggs over vegetables. Add tomatoes and feta. Cook undisturbed for 5 min.',
      'Transfer pan under grill for 3-4 minutes until top is golden and set.',
      'Slide onto a plate. Cut into wedges. Can be eaten warm or cold.',
    ],
    isFree: false,
    emoji: '🍳',
    accentColor: '#e8a84c',
  },
  {
    id: 'chia-pudding',
    name: 'Coconut chia pudding',
    tagline: 'Make it the night before, wake up to a ready meal',
    whyItWorks: 'Chia seeds absorb 10x their weight in liquid, creating a gel that slows digestion and prevents blood sugar spikes. The coconut milk provides medium-chain triglycerides (MCTs) — fats that are quickly converted to energy, bridging the transition from fasted to fed state.',
    prepMinutes: 5,
    difficulty: 'easy',
    category: 'plant-based',
    bestAfter: 'any',
    calories: 280,
    macros: { protein: 8, carbs: 22, fats: 18 },
    ingredients: [
      '3 tbsp chia seeds',
      '200ml coconut milk',
      '1 tsp vanilla extract',
      '1 tsp maple syrup',
      'Mango or passion fruit to serve',
    ],
    steps: [
      'Mix chia seeds, coconut milk, vanilla, and maple syrup in a jar.',
      'Stir well, then stir again after 5 minutes (prevents clumping).',
      'Refrigerate overnight or at least 3 hours.',
      'Top with fresh fruit before eating.',
    ],
    isFree: false,
    emoji: '🥥',
    accentColor: '#8b6bbf',
  },
  {
    id: 'turkey-lettuce-wraps',
    name: 'Turkey lettuce wraps',
    tagline: 'High protein, no bread bloat, satisfying crunch',
    whyItWorks: 'Lean ground turkey provides high protein with minimal fat. Using lettuce instead of bread avoids the refined carbs that cause post-fast bloating. The crunch of fresh vegetables triggers satiety signals faster than soft food.',
    prepMinutes: 12,
    difficulty: 'easy',
    category: 'light',
    bestAfter: 'any',
    calories: 300,
    macros: { protein: 30, carbs: 8, fats: 16 },
    ingredients: [
      '150g ground turkey',
      '4 large butter lettuce leaves',
      '1/2 avocado, sliced',
      '1 small carrot, julienned',
      '1 tbsp soy sauce or tamari',
      '1 tsp sesame oil',
      'Lime wedge',
    ],
    steps: [
      'Cook ground turkey in a pan with soy sauce and sesame oil (5-6 min).',
      'Wash and dry lettuce leaves — these are your wraps.',
      'Fill each leaf with turkey, avocado, and carrot.',
      'Squeeze lime over. Roll and eat with your hands.',
    ],
    isFree: false,
    emoji: '🥬',
    accentColor: '#3aaa6e',
  },
  {
    id: 'sweet-potato-soup',
    name: 'Roasted sweet potato soup',
    tagline: 'Warming, easy to digest, naturally sweet',
    whyItWorks: 'Blended soups are one of the easiest foods for a resting gut to process. Sweet potato is rich in beta-carotene and fibre. The warming temperature stimulates digestive enzymes. Ideal as a first food after a longer fast before moving to solids.',
    prepMinutes: 30,
    difficulty: 'medium',
    category: 'plant-based',
    bestAfter: '16h+',
    calories: 240,
    macros: { protein: 6, carbs: 38, fats: 8 },
    ingredients: [
      '2 medium sweet potatoes, peeled and cubed',
      '1 small onion, diced',
      '500ml vegetable broth',
      '1 tbsp coconut oil',
      '1 tsp ground cumin',
      'Salt, pepper',
      'Pumpkin seeds to garnish',
    ],
    steps: [
      'Heat coconut oil. Sauté onion for 3 min, add cumin.',
      'Add sweet potato and broth. Bring to boil, then simmer 20 min until soft.',
      'Blend until smooth with an immersion blender (or transfer to a blender).',
      'Season with salt and pepper. Serve topped with pumpkin seeds.',
    ],
    isFree: false,
    emoji: '🍠',
    accentColor: '#e07b30',
  },
  {
    id: 'cottage-cheese-plate',
    name: 'Cottage cheese and fruit plate',
    tagline: 'No cooking — open, plate, eat',
    whyItWorks: 'Cottage cheese is casein protein, which digests slowly and provides sustained amino acid release — perfect after a fast when your body is primed for protein absorption. Paired with fruit for quick vitamins and natural sugars.',
    prepMinutes: 2,
    difficulty: 'easy',
    category: 'quick',
    bestAfter: 'any',
    calories: 280,
    macros: { protein: 26, carbs: 24, fats: 8 },
    ingredients: [
      '200g cottage cheese',
      '1 peach or pear, sliced (or seasonal fruit)',
      '1 tbsp pumpkin seeds',
      'Drizzle of honey',
      'Pinch of cinnamon',
    ],
    steps: [
      'Spoon cottage cheese onto a plate or into a bowl.',
      'Arrange sliced fruit alongside.',
      'Sprinkle with pumpkin seeds and cinnamon, drizzle with honey.',
    ],
    isFree: false,
    emoji: '🍑',
    accentColor: '#e8a84c',
  },
  {
    id: 'shakshuka',
    name: 'Simple shakshuka',
    tagline: 'Eggs poached in spiced tomato — warming and rich',
    whyItWorks: 'The tomato base is acidic enough to stimulate digestive juices after a fast. Eggs provide high-quality protein. The spices (cumin, paprika) have anti-inflammatory properties. Eaten with a piece of bread, it provides a balanced macronutrient profile.',
    prepMinutes: 20,
    difficulty: 'medium',
    category: 'substantial',
    bestAfter: '16h+',
    calories: 340,
    macros: { protein: 18, carbs: 20, fats: 22 },
    ingredients: [
      '400g tin of chopped tomatoes',
      '2 eggs',
      '1 small onion, diced',
      '1 clove garlic, minced',
      '1 tsp cumin, 1 tsp paprika',
      '1 tbsp olive oil',
      'Fresh parsley or coriander',
      'Bread for serving',
    ],
    steps: [
      'Heat olive oil. Sauté onion and garlic until soft (3 min).',
      'Add spices, stir 30 seconds. Pour in tomatoes, simmer 8-10 min.',
      'Make two wells in the sauce. Crack an egg into each.',
      'Cover and cook 5-6 minutes until whites are set but yolks are runny.',
      'Garnish with herbs. Serve with bread for dipping.',
    ],
    isFree: false,
    emoji: '🍅',
    accentColor: '#c05050',
  },
  {
    id: 'protein-omelette',
    name: 'Spinach and mushroom omelette',
    tagline: 'Classic protein-forward meal, endlessly adaptable',
    whyItWorks: 'Eggs are the most bioavailable protein source. Mushrooms provide B vitamins and selenium, supporting energy production post-fast. Spinach adds iron. The simplicity means you can eat within minutes of ending your fast.',
    prepMinutes: 10,
    difficulty: 'easy',
    category: 'light',
    bestAfter: 'any',
    calories: 310,
    macros: { protein: 22, carbs: 4, fats: 24 },
    ingredients: [
      '3 eggs, beaten',
      'Handful of baby spinach',
      '4-5 mushrooms, sliced',
      '1 tbsp butter',
      'Salt, pepper',
      '20g cheese (optional)',
    ],
    steps: [
      'Heat butter in a non-stick pan. Sauté mushrooms 3 min.',
      'Add spinach, wilt for 30 seconds. Remove vegetables, set aside.',
      'Pour beaten eggs into the same pan. Cook until edges set (2 min).',
      'Add vegetables (and cheese if using) to one half. Fold and cook 1 more minute.',
    ],
    isFree: false,
    emoji: '🥚',
    accentColor: '#3aaa6e',
  },
  {
    id: 'quinoa-bowl',
    name: 'Quinoa and roasted vegetable bowl',
    tagline: 'Complete plant protein with all 9 amino acids',
    whyItWorks: 'Quinoa is a rare complete plant protein — it contains all 9 essential amino acids, making it as effective as animal protein for post-fast recovery. Roasted vegetables add fibre and micronutrients. Tahini dressing provides healthy fats.',
    prepMinutes: 25,
    difficulty: 'medium',
    category: 'plant-based',
    bestAfter: '16h+',
    calories: 410,
    macros: { protein: 16, carbs: 48, fats: 18 },
    ingredients: [
      '80g quinoa, rinsed',
      '1 courgette, cubed',
      '1 red pepper, cubed',
      '1 tbsp olive oil',
      '1 tbsp tahini',
      'Lemon juice, salt, pepper',
      'Handful of rocket',
    ],
    steps: [
      'Cook quinoa per package directions (usually 15 min). Fluff with a fork.',
      'Toss vegetables with olive oil, salt, pepper. Roast at 200°C for 18 min.',
      'Mix tahini with lemon juice and a splash of water for dressing.',
      'Bowl: quinoa base, roasted veg, rocket, drizzle tahini dressing.',
    ],
    isFree: false,
    emoji: '🥗',
    accentColor: '#5b8dd9',
  },
  {
    id: 'sardines-toast',
    name: 'Sardines on sourdough toast',
    tagline: 'Omega-3 bomb — underrated, affordable, powerful',
    whyItWorks: 'Sardines are one of the most nutrient-dense foods: omega-3s, calcium (from the bones), vitamin D, and B12. They\'re anti-inflammatory and rich in protein. Sourdough is fermented bread that\'s easier to digest than regular bread.',
    prepMinutes: 5,
    difficulty: 'easy',
    category: 'light',
    bestAfter: 'any',
    calories: 340,
    macros: { protein: 24, carbs: 22, fats: 18 },
    ingredients: [
      '1 tin sardines in olive oil',
      '2 slices sourdough bread',
      '1/2 lemon',
      'Handful of cherry tomatoes, halved',
      'Fresh parsley',
      'Chilli flakes (optional)',
    ],
    steps: [
      'Toast the sourdough.',
      'Drain sardines slightly (keep some oil). Place on toast.',
      'Mash lightly with a fork. Top with tomatoes and parsley.',
      'Squeeze lemon over, add chilli flakes if desired.',
    ],
    isFree: false,
    emoji: '🐠',
    accentColor: '#5b8dd9',
  },
  {
    id: 'apple-pb-rice-cake',
    name: 'Apple slices with almond butter on rice cakes',
    tagline: 'Sweet, crunchy, zero cooking — the 2-minute break-fast',
    whyItWorks: 'When you\'re hungry and need to eat NOW. Rice cakes are ultra-light on the stomach. Almond butter provides protein and healthy fats. Apple adds natural sweetness and fibre. This bridges the gap before a proper meal.',
    prepMinutes: 2,
    difficulty: 'easy',
    category: 'quick',
    bestAfter: 'any',
    calories: 260,
    macros: { protein: 8, carbs: 32, fats: 12 },
    ingredients: [
      '2 rice cakes',
      '2 tbsp almond butter',
      '1 apple, thinly sliced',
      'Drizzle of honey',
      'Pinch of sea salt',
    ],
    steps: [
      'Spread almond butter on rice cakes.',
      'Arrange apple slices on top.',
      'Drizzle with honey and a tiny pinch of sea salt.',
    ],
    isFree: false,
    emoji: '🍎',
    accentColor: '#c05050',
  },
  {
    id: 'turmeric-scramble',
    name: 'Anti-inflammatory turmeric egg scramble',
    tagline: 'Golden eggs — powerful recovery food',
    whyItWorks: 'Turmeric contains curcumin, a potent anti-inflammatory compound that pairs with the protein absorption benefits of eggs post-fast. Black pepper increases curcumin absorption by 2000%. This is breakfast as medicine.',
    prepMinutes: 8,
    difficulty: 'easy',
    category: 'light',
    bestAfter: '16h+',
    calories: 290,
    macros: { protein: 20, carbs: 4, fats: 22 },
    ingredients: [
      '3 eggs',
      '1/2 tsp turmeric',
      'Pinch of black pepper (essential for absorption)',
      '1 tbsp butter or ghee',
      'Handful of spinach',
      'Salt to taste',
    ],
    steps: [
      'Beat eggs with turmeric, black pepper, and salt.',
      'Melt butter in a pan over low-medium heat.',
      'Pour in eggs, add spinach. Stir gently for soft, golden curds (3 min).',
      'Serve immediately. The colour should be a deep gold.',
    ],
    isFree: false,
    emoji: '🌿',
    accentColor: '#d4a017',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const FREE_MEAL_COUNT = BREAKFAST_MEALS.filter(m => m.isFree).length;
export const PRO_MEAL_COUNT = BREAKFAST_MEALS.filter(m => !m.isFree).length;

export const MEAL_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'quick', label: 'Quick' },
  { key: 'light', label: 'Light' },
  { key: 'substantial', label: 'Hearty' },
  { key: 'plant-based', label: 'Plant-based' },
] as const;

/** Pick a random free meal to suggest on the fast-complete screen. */
export function getRandomFreeMeal(): BreakfastMeal {
  const free = BREAKFAST_MEALS.filter(m => m.isFree);
  return free[Math.floor(Math.random() * free.length)];
}

/** Pick a meal appropriate for the fast duration. */
export function getSuggestedMeal(fastDurationHours: number): BreakfastMeal {
  const free = BREAKFAST_MEALS.filter(m => m.isFree);
  if (fastDurationHours >= 24) {
    // For long fasts, prefer the bone broth
    return free.find(m => m.id === 'bone-broth-starter') ?? free[0];
  }
  if (fastDurationHours >= 16) {
    // For standard IF fasts, rotate through all free meals
    return free[Math.floor(Math.random() * free.length)];
  }
  // For shorter fasts, suggest something quick
  const quick = free.filter(m => m.category === 'quick');
  return quick.length > 0 ? quick[Math.floor(Math.random() * quick.length)] : free[0];
}
```

---

## Task 2: Create `components/meals/MealCard.tsx`

Compact card for the list view. Shows the 3D meal image (with emoji fallback), name, tagline, prep time, and "best after" badge. Pro meals show a lock icon.

```tsx
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { Clock, Lock } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS, fs, lh } from '@/constants/theme';
import { hexAlpha } from '@/constants/colors';
import { getMealImage } from '@/constants/breakfastMeals';
import type { BreakfastMeal } from '@/constants/breakfastMeals';
import type { ColorScheme } from '@/constants/colors';

interface Props {
  meal: BreakfastMeal;
  onPress: () => void;
  isLocked: boolean;
}

export default function MealCard({ meal, onPress, isLocked }: Props) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const image = getMealImage(meal.id);

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: colors.borderLight }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Image or emoji fallback */}
      {image ? (
        <Image source={image} style={styles.mealImage} />
      ) : (
        <View style={[styles.emojiWrap, { backgroundColor: colors.surface }]}>
          <Text style={styles.emoji}>{meal.emoji}</Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {meal.name}
          </Text>
          {isLocked && (
            <View style={[styles.lockBadge, { backgroundColor: hexAlpha(colors.primary, 0.1) }]}>
              <Lock size={9} color={colors.primary} />
              <Text style={[styles.lockText, { color: colors.primary }]}>PRO</Text>
            </View>
          )}
        </View>
        <Text style={[styles.tagline, { color: colors.textSecondary }]} numberOfLines={1}>
          {meal.tagline}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock size={11} color={colors.textMuted} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>{meal.prepMinutes} min</Text>
          </View>
          <View style={[styles.bestAfterBadge, { backgroundColor: hexAlpha(meal.accentColor, 0.1) }]}>
            <Text style={[styles.bestAfterText, { color: meal.accentColor }]}>
              {meal.bestAfter === 'any' ? 'Any fast' : meal.bestAfter}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 14,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      backgroundColor: colors.card,
      marginBottom: 10,
    } as ViewStyle,
    mealImage: {
      width: 56,
      height: 56,
      borderRadius: 14,
    } as ImageStyle,
    emojiWrap: {
      width: 56,
      height: 56,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    emoji: { fontSize: 28 } as TextStyle,
    content: { flex: 1 } as ViewStyle,
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 } as ViewStyle,
    name: { fontFamily: FONTS.bodyMedium, fontSize: fs(15), fontWeight: '600', flex: 1 } as TextStyle,
    lockBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 } as ViewStyle,
    lockText: { fontFamily: FONTS.bodyMedium, fontSize: fs(8), fontWeight: '800', letterSpacing: 0.5 } as TextStyle,
    tagline: { fontFamily: FONTS.bodyRegular, fontSize: fs(12), lineHeight: lh(12, 1.3), marginBottom: 6 } as TextStyle,
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 } as ViewStyle,
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 } as ViewStyle,
    metaText: { fontFamily: FONTS.bodyRegular, fontSize: fs(11) } as TextStyle,
    bestAfterBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 } as ViewStyle,
    bestAfterText: { fontFamily: FONTS.bodyMedium, fontSize: fs(10), fontWeight: '600' } as TextStyle,
  });
}
```

---

## Task 3: Create the list screen — `app/(tabs)/knowledge/meals.tsx`

A scrollable list of all 20 meals with a category filter (All / Quick / Light / Hearty / Plant-based). Free meals render normally, Pro meals show a lock icon. Tapping a locked meal presents the paywall.

```tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ViewStyle, TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { ChevronLeft, UtensilsCrossed } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { BREAKFAST_MEALS, MEAL_CATEGORIES, FREE_MEAL_COUNT, PRO_MEAL_COUNT } from '@/constants/breakfastMeals';
import MealCard from '@/components/meals/MealCard';
import { FONTS, SPACING, fs, lh } from '@/constants/theme';
import { hexAlpha } from '@/constants/colors';
import type { ColorScheme } from '@/constants/colors';

type CategoryFilter = typeof MEAL_CATEGORIES[number]['key'];

export default function MealsListScreen() {
  const { colors } = useTheme();
  const { isProUser, presentPaywall } = useRevenueCat();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const filteredMeals = useMemo(() => {
    if (activeCategory === 'all') return BREAKFAST_MEALS;
    return BREAKFAST_MEALS.filter(m => m.category === activeCategory);
  }, [activeCategory]);

  const handleMealPress = useCallback((mealId: string, isFree: boolean) => {
    if (!isFree && !isProUser) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      void presentPaywall();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/(tabs)/knowledge/meal-detail', params: { id: mealId } } as any);
  }, [isProUser, presentPaywall]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
            <ChevronLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Break-fast meals</Text>
            <Text style={styles.headerSub}>
              {FREE_MEAL_COUNT} free · {PRO_MEAL_COUNT} with Pro
            </Text>
          </View>
        </View>

        {/* Category filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {MEAL_CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.filterChip, isActive && { backgroundColor: colors.text }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveCategory(cat.key);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterLabel, { color: isActive ? colors.background : colors.textSecondary }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Meal list */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Intro text */}
          <View style={[styles.introCard, { backgroundColor: hexAlpha(colors.primary, 0.05), borderColor: hexAlpha(colors.primary, 0.15) }]}>
            <UtensilsCrossed size={16} color={colors.primary} />
            <Text style={[styles.introText, { color: colors.textSecondary }]}>
              How you break your fast matters as much as the fast itself. These meals are curated for gentle digestion and metabolic recovery.
            </Text>
          </View>

          {filteredMeals.map(meal => (
            <MealCard
              key={meal.id}
              meal={meal}
              onPress={() => handleMealPress(meal.id, meal.isFree)}
              isLocked={!meal.isFree && !isProUser}
            />
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background } as ViewStyle,
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 } as ViewStyle,
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
    headerTextCol: { flex: 1 } as ViewStyle,
    headerTitle: { fontFamily: FONTS.displayLight, fontSize: fs(22), fontWeight: '700', color: colors.text, letterSpacing: -0.3 } as TextStyle,
    headerSub: { fontFamily: FONTS.bodyRegular, fontSize: fs(13), color: colors.textMuted, marginTop: 2 } as TextStyle,
    filterScroll: { maxHeight: 44 } as ViewStyle,
    filterRow: { paddingHorizontal: 20, gap: 8, paddingVertical: 6 } as ViewStyle,
    filterChip: {
      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
      backgroundColor: colors.surface,
    } as ViewStyle,
    filterLabel: { fontFamily: FONTS.bodyMedium, fontSize: fs(13), fontWeight: '600' } as TextStyle,
    list: { flex: 1 } as ViewStyle,
    listContent: { paddingHorizontal: 20, paddingTop: 12 } as ViewStyle,
    introCard: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 10,
      padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 16,
    } as ViewStyle,
    introText: { fontFamily: FONTS.bodyRegular, fontSize: fs(13), lineHeight: lh(13, 1.5), flex: 1 } as TextStyle,
  });
}
```

---

## Task 4: Create the detail screen — `app/(tabs)/knowledge/meal-detail.tsx`

Full-screen view for a single meal. Shows the 3D image hero (with emoji fallback), all info: why it works, ingredients, steps, macros, and metadata. Scrollable.

```tsx
import React, { useMemo } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity,
  ViewStyle, TextStyle, ImageStyle, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Clock, Flame, Zap, Droplets, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BREAKFAST_MEALS, getMealImage } from '@/constants/breakfastMeals';
import { FONTS, SPACING, RADIUS, fs, lh } from '@/constants/theme';
import { hexAlpha } from '@/constants/colors';
import type { ColorScheme } from '@/constants/colors';

const { width: SCREEN_W } = Dimensions.get('window');

export default function MealDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const meal = useMemo(() => BREAKFAST_MEALS.find(m => m.id === id), [id]);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const image = meal ? getMealImage(meal.id) : null;

  if (!meal) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: colors.text, padding: 20 }}>Meal not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
            <ChevronLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{meal.name}</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero — 3D image or emoji fallback */}
          {image ? (
            <View style={[styles.heroImageWrap, { backgroundColor: hexAlpha(meal.accentColor, 0.08) }]}>
              <Image source={image} style={styles.heroImage} resizeMode="contain" />
            </View>
          ) : (
            <View style={styles.heroWrap}>
              <Text style={styles.heroEmoji}>{meal.emoji}</Text>
            </View>
          )}

          <Text style={[styles.title, { color: colors.text }]}>{meal.name}</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>{meal.tagline}</Text>

          {/* Meta chips */}
          <View style={styles.chipRow}>
            <View style={[styles.chip, { backgroundColor: colors.surface }]}>
              <Clock size={12} color={colors.textMuted} />
              <Text style={[styles.chipText, { color: colors.textSecondary }]}>{meal.prepMinutes} min</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.surface }]}>
              <Text style={[styles.chipText, { color: colors.textSecondary }]}>{meal.difficulty === 'easy' ? 'Easy' : 'Medium'}</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: hexAlpha(meal.accentColor, 0.1) }]}>
              <Text style={[styles.chipText, { color: meal.accentColor }]}>
                {meal.bestAfter === 'any' ? 'Any fast' : `Best after ${meal.bestAfter}`}
              </Text>
            </View>
          </View>

          {/* Why it works */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Text style={[styles.cardHeader, { color: colors.primary }]}>Why it works for breaking a fast</Text>
            <Text style={[styles.cardBody, { color: colors.textSecondary }]}>{meal.whyItWorks}</Text>
          </View>

          {/* Macros */}
          <View style={styles.macroRow}>
            <View style={[styles.macroTile, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <Flame size={16} color="#e07b30" />
              <Text style={[styles.macroValue, { color: colors.text }]}>{meal.calories}</Text>
              <Text style={[styles.macroLabel, { color: colors.textMuted }]}>kcal</Text>
            </View>
            <View style={[styles.macroTile, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <Zap size={16} color="#c05050" />
              <Text style={[styles.macroValue, { color: colors.text }]}>{meal.macros.protein}g</Text>
              <Text style={[styles.macroLabel, { color: colors.textMuted }]}>protein</Text>
            </View>
            <View style={[styles.macroTile, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <Droplets size={16} color="#d4a017" />
              <Text style={[styles.macroValue, { color: colors.text }]}>{meal.macros.carbs}g</Text>
              <Text style={[styles.macroLabel, { color: colors.textMuted }]}>carbs</Text>
            </View>
            <View style={[styles.macroTile, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <Droplets size={16} color="#5b8dd9" />
              <Text style={[styles.macroValue, { color: colors.text }]}>{meal.macros.fats}g</Text>
              <Text style={[styles.macroLabel, { color: colors.textMuted }]}>fats</Text>
            </View>
          </View>

          {/* Ingredients */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Ingredients</Text>
            {meal.ingredients.map((ing, i) => (
              <View key={i} style={styles.ingredientRow}>
                <View style={[styles.ingredientBullet, { backgroundColor: hexAlpha(meal.accentColor, 0.3) }]} />
                <Text style={[styles.ingredientText, { color: colors.textSecondary }]}>{ing}</Text>
              </View>
            ))}
          </View>

          {/* Steps */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>How to make it</Text>
            {meal.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.stepNumber, { backgroundColor: hexAlpha(meal.accentColor, 0.12) }]}>
                  <Text style={[styles.stepNumberText, { color: meal.accentColor }]}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.textSecondary }]}>{step}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background } as ViewStyle,
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 } as ViewStyle,
    backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
    headerTitle: { fontFamily: FONTS.bodyMedium, fontSize: fs(16), fontWeight: '600', flex: 1, textAlign: 'center' } as TextStyle,
    scroll: { flex: 1 } as ViewStyle,
    scrollContent: { paddingHorizontal: 20, paddingTop: 16 } as ViewStyle,
    heroImageWrap: {
      width: SCREEN_W - 40,
      height: SCREEN_W * 0.55,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: 18,
      overflow: 'hidden',
    } as ViewStyle,
    heroImage: {
      width: '75%' as any,
      height: '75%' as any,
    } as ImageStyle,
    heroWrap: { alignItems: 'center', marginBottom: 18 } as ViewStyle,
    heroEmoji: { fontSize: 64 } as TextStyle,
    title: { fontFamily: FONTS.displayLight, fontSize: fs(26), fontWeight: '700', letterSpacing: -0.3, marginBottom: 6 } as TextStyle,
    tagline: { fontFamily: FONTS.bodyRegular, fontSize: fs(15), lineHeight: lh(15, 1.4), marginBottom: 16 } as TextStyle,
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 } as ViewStyle,
    chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 } as ViewStyle,
    chipText: { fontFamily: FONTS.bodyMedium, fontSize: fs(12), fontWeight: '600' } as TextStyle,
    card: { borderRadius: RADIUS.lg, borderWidth: 1, padding: 16, marginBottom: 14 } as ViewStyle,
    cardHeader: { fontFamily: FONTS.bodyMedium, fontSize: fs(13), fontWeight: '700', marginBottom: 8, letterSpacing: 0.1 } as TextStyle,
    cardBody: { fontFamily: FONTS.bodyRegular, fontSize: fs(14), lineHeight: lh(14, 1.55) } as TextStyle,
    sectionTitle: { fontFamily: FONTS.bodyMedium, fontSize: fs(16), fontWeight: '700', marginBottom: 12 } as TextStyle,
    macroRow: { flexDirection: 'row', gap: 8, marginBottom: 14 } as ViewStyle,
    macroTile: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center', gap: 4 } as ViewStyle,
    macroValue: { fontFamily: FONTS.displayLight, fontSize: fs(18), fontWeight: '700' } as TextStyle,
    macroLabel: { fontFamily: FONTS.bodyRegular, fontSize: fs(10) } as TextStyle,
    ingredientRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 } as ViewStyle,
    ingredientBullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7 } as ViewStyle,
    ingredientText: { fontFamily: FONTS.bodyRegular, fontSize: fs(14), lineHeight: lh(14, 1.4), flex: 1 } as TextStyle,
    stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 } as ViewStyle,
    stepNumber: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
    stepNumberText: { fontFamily: FONTS.bodyMedium, fontSize: fs(13), fontWeight: '700' } as TextStyle,
    stepText: { fontFamily: FONTS.bodyRegular, fontSize: fs(14), lineHeight: lh(14, 1.5), flex: 1, paddingTop: 3 } as TextStyle,
  });
}
```

---

## Task 5: Create `components/meals/MealSuggestionStrip.tsx`

A compact tappable strip shown on the Today page, below the YesterdayCard. It shows a rotating meal suggestion based on the user's current or last fast, and links to the full meals list. This is ~60px tall — the same visual weight as the stats row, not a full card.

The strip shows a different meal each day (deterministic based on the day of the month, not random — so it doesn't change on re-render). When the user is actively fasting, the copy reads "Plan your break-fast". When not fasting, it reads "Break-fast idea".

```tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { ChevronRight, UtensilsCrossed } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, RADIUS, fs } from '@/constants/theme';
import { hexAlpha } from '@/constants/colors';
import { BREAKFAST_MEALS, getSuggestedMeal } from '@/constants/breakfastMeals';
import type { ColorScheme } from '@/constants/colors';

interface Props {
  /** Current or last fast duration in hours (used for context-aware suggestion). 0 if no fast. */
  fastDurationHours: number;
  /** Whether the user is currently mid-fast. Changes the copy. */
  isFasting: boolean;
}

export default function MealSuggestionStrip({ fastDurationHours, isFasting }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Deterministic daily rotation — same meal all day, changes next day
  const meal = useMemo(() => {
    if (fastDurationHours >= 24) {
      // For long fasts, always suggest bone broth
      return BREAKFAST_MEALS.find(m => m.id === 'bone-broth-starter') ?? BREAKFAST_MEALS[0];
    }
    // Rotate through free meals based on day of month
    const freeMeals = BREAKFAST_MEALS.filter(m => m.isFree);
    const dayIndex = new Date().getDate() % freeMeals.length;
    return freeMeals[dayIndex];
  }, [fastDurationHours]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/knowledge/meals' as any);
  };

  const label = isFasting ? 'Plan your break-fast' : 'Break-fast idea';

  return (
    <TouchableOpacity style={[styles.strip, { borderColor: colors.borderLight }]} onPress={handlePress} activeOpacity={0.75}>
      <Text style={styles.emoji}>{meal.emoji}</Text>
      <View style={styles.textCol}>
        <Text style={[styles.label, { color: colors.primary }]}>{label}</Text>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {meal.name}
          <Text style={[styles.meta, { color: colors.textMuted }]}>  ·  {meal.prepMinutes} min</Text>
        </Text>
      </View>
      <ChevronRight size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    strip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      backgroundColor: colors.card,
      marginTop: 12,
      marginBottom: 8,
    } as ViewStyle,
    emoji: { fontSize: 22 } as TextStyle,
    textCol: { flex: 1 } as ViewStyle,
    label: {
      fontFamily: FONTS.bodyMedium,
      fontSize: fs(10),
      fontWeight: '700',
      letterSpacing: 0.8,
      marginBottom: 1,
    } as TextStyle,
    name: {
      fontFamily: FONTS.bodyMedium,
      fontSize: fs(13),
      fontWeight: '600',
    } as TextStyle,
    meta: {
      fontFamily: FONTS.bodyRegular,
      fontSize: fs(12),
      fontWeight: '400',
    } as TextStyle,
  });
}
```

---

## Task 6: Add "Break-fast meals" section to the Learn tab

**File:** `app/(tabs)/knowledge/index.tsx`

Add a new section card that links to the meals list. Place it near the top of the Learn tab — after any hero/featured content but before the article list. It should be prominent since it's a unique feature.

Find a suitable location in the render (probably after the featured article strip or the quiz card). Add:

```tsx
import { UtensilsCrossed, ChevronRight } from 'lucide-react-native';

// ... inside the ScrollView content:

{/* Break-fast meals section */}
<TouchableOpacity
  style={[styles.mealsSection, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
  onPress={() => router.push('/(tabs)/knowledge/meals' as any)}
  activeOpacity={0.75}
>
  <View style={[styles.mealsSectionIcon, { backgroundColor: hexAlpha(colors.primary, 0.1) }]}>
    <UtensilsCrossed size={22} color={colors.primary} />
  </View>
  <View style={styles.mealsSectionText}>
    <Text style={[styles.mealsSectionTitle, { color: colors.text }]}>Break-fast meals</Text>
    <Text style={[styles.mealsSectionSub, { color: colors.textSecondary }]}>
      20 meals curated for how you break your fast
    </Text>
  </View>
  <ChevronRight size={18} color={colors.textMuted} />
</TouchableOpacity>
```

Add the styles to the StyleSheet:

```typescript
mealsSection: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 14,
  padding: 16,
  borderRadius: 16,
  borderWidth: 1,
  marginBottom: 20,
} as ViewStyle,
mealsSectionIcon: {
  width: 48,
  height: 48,
  borderRadius: 24,
  alignItems: 'center',
  justifyContent: 'center',
} as ViewStyle,
mealsSectionText: {
  flex: 1,
} as ViewStyle,
mealsSectionTitle: {
  fontFamily: FONTS.bodyMedium,
  fontSize: fs(16),
  fontWeight: '700',
  marginBottom: 2,
} as TextStyle,
mealsSectionSub: {
  fontFamily: FONTS.bodyRegular,
  fontSize: fs(13),
} as TextStyle,
```

---

## Task 7: Add the meal suggestion strip to the Today page

**File:** `app/(tabs)/(home)/index.tsx`

### 7a. Import the strip component

Add at the top with other imports:

```typescript
import MealSuggestionStrip from '@/components/meals/MealSuggestionStrip';
```

### 7b. Place it below the YesterdayCard

Find where YesterdayCard is rendered:

```tsx
{/* Yesterday motivation card */}
{yesterdayData && completedFastCount > 0 && (
  <YesterdayCard data={yesterdayData} />
)}
```

Add the strip directly below it (still inside the ScrollView):

```tsx
{/* Yesterday motivation card */}
{yesterdayData && completedFastCount > 0 && (
  <YesterdayCard data={yesterdayData} />
)}

{/* Break-fast meal suggestion */}
{completedFastCount > 0 && (
  <MealSuggestionStrip
    fastDurationHours={activeFast ? timer.hoursElapsed : 0}
    isFasting={!!activeFast}
  />
)}
```

**Why `completedFastCount > 0`:** Same gate as YesterdayCard — don't show to brand-new users who haven't completed a single fast yet. Once they've fasted once, the strip is always visible on the Today page.

**Why `timer.hoursElapsed` when fasting:** During a fast, the strip says "Plan your break-fast" and suggests a meal appropriate for the current fast duration. For 24h+ fasts, it shows bone broth. For standard fasts, it rotates daily through free meals.

**Why `0` when not fasting:** When not fasting, `fastDurationHours: 0` triggers the daily rotation logic (day of month modulo free meal count), showing a different suggestion each day.

### 7c. Do NOT add the strip to fast-complete screen

The fast-complete screen (`app/fast-complete.tsx`) is unchanged. No meal suggestion there — the Today page strip is the sole entry point.

### 7d. Do NOT remove the meals entry from the Learn tab

The "Break-fast meals" card on the Learn tab (Task 6) stays. Users can discover the full meal list from two places: the Today page strip (quick access) and the Learn tab (browsing context). The strip links to `/(tabs)/knowledge/meals` which is the same list screen either way.

---

## What NOT to build

1. **No meal plan / meal calendar** — Users don't schedule which break-fast meal to eat
2. **No favouriting / saving** — It's 30 items, they can scroll
3. **No user-submitted recipes** — This is curated content, not a platform
4. **No nutritional database / barcode scanning** — That's MyFitnessPal's job
5. **No "Add to meal plan" button** — No meal plan exists, this is a reference guide
6. **No search** — 30 items with category filters. Search is overkill.
7. **No supplement or medication timing advice** — Food only.
8. **No watermark on images** — The app shell provides brand context. Only add an "aayu.app" mark if sharing is implemented later.

---

## Verification checklist

- [ ] `npx tsc --noEmit` passes
- [ ] Learn tab shows "Break-fast meals" card with fork icon and "20 meals curated..." text
- [ ] Tapping it opens the meals list with 20 entries
- [ ] Category filters (All / Quick / Light / Hearty / Plant-based) work correctly
- [ ] First 5 meals show without a lock icon
- [ ] Remaining 15 show a "PRO" lock badge
- [ ] Tapping a free meal opens the detail screen
- [ ] Tapping a locked meal (as free user) presents the paywall
- [ ] Detail screen shows: **3D image hero** (or emoji fallback if image missing), name, tagline, chips (prep time + difficulty + best after), "Why it works" card, macro tiles (4 across), ingredients list, numbered steps
- [ ] MealCard in list view shows 3D thumbnail (56×56 rounded) or emoji fallback
- [ ] Missing images gracefully fall back to emoji (no crash, no broken image icon)
- [ ] Pro user sees all 20 meals unlocked
- [ ] Today page shows meal suggestion strip below YesterdayCard
- [ ] Strip shows "Plan your break-fast" copy when a fast is active
- [ ] Strip shows "Break-fast idea" copy when not fasting
- [ ] Strip rotates to a different meal each day (same meal all day, changes at midnight)
- [ ] For 24h+ fasts, strip shows bone broth
- [ ] Tapping the strip navigates to the full meals list
- [ ] Strip only shows after user has completed at least 1 fast
- [ ] Fast-complete screen is unchanged (no meal suggestion there)
- [ ] Back navigation works from detail → list → Learn tab
- [ ] Dark mode renders correctly across all screens
- [ ] Light mode renders correctly across all screens
