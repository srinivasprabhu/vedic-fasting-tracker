import type {
  ArticleBlock,
  ArticleDetail,
  ArticleDifficulty,
  ArticleSummary,
  LearnQuiz,
  LearnSectionId,
} from '@/types/learn';
import {
  AUTOPHAGY_BENEFITS,
  AUTOPHAGY_STAGES,
  IF_GUIDE_TIPS,
  INTERMITTENT_FAST_TYPES,
} from '@/mocks/vedic-data';

/** Fasting-friendly & breaks lists (formerly inline on Learn tab). */
export const LEARN_FASTING_FRIENDLY_ITEMS = [
  {
    icon: 'Droplets',
    title: 'Water',
    desc: 'Plain still or sparkling water. Zero calories, no insulin response. Essential for hydration and electrolyte balance.',
    science: 'No metabolic impact.',
    color: '#2E86AB',
  },
  {
    icon: 'Coffee',
    title: 'Black Coffee',
    desc: 'No sugar, cream, or milk. Coffee alone has ~2–5 calories per cup and does not trigger insulin or break autophagy.',
    science: 'Studies show caffeine may enhance fat oxidation and ketone production during fasting.',
    color: '#8B7355',
  },
  {
    icon: 'Leaf',
    title: 'Plain Tea',
    desc: 'Green, black, white, or herbal tea — no milk, honey, or sugar. Zero calories.',
    science: 'Green tea catechins may support autophagy; polyphenols have no metabolic impact.',
    color: '#5B8C5A',
  },
  {
    icon: 'Sparkles',
    title: 'Salt',
    desc: 'A pinch of salt in water helps maintain electrolytes. Especially useful during longer fasts.',
    science: 'Sodium has no calories; prevents hyponatremia.',
    color: '#C97B2A',
  },
  {
    icon: 'Droplets',
    title: 'Sparkling Water',
    desc: 'Unflavored or naturally flavored (no sweeteners). Same as still water.',
    science: 'No calories; no insulin response.',
    color: '#2E86AB',
  },
  {
    icon: 'Zap',
    title: 'Electrolytes (No Sugar)',
    desc: 'Sodium, potassium, magnesium in water — without sweeteners or calories.',
    science: 'Replenishes minerals lost during fasting; no metabolic impact.',
    color: '#1B7A6E',
  },
] as const;

export const LEARN_BREAKS_FAST_LABELS = [
  'Milk, cream, butter',
  'Honey, sugar, syrup',
  'Juice, soda, sweetened drinks',
  'Bone broth, soup',
  'Nuts, seeds, coconut oil',
  'Lemon juice (if > 1 tbsp)',
] as const;

export const LEARN_GRAY_AREA_COPY =
  'Some debate exists around artificial sweeteners (e.g. stevia, aspartame) and small amounts of lemon or ACV. Research is mixed — some studies show minimal insulin response; others suggest caution. For strict autophagy, stick to water, black coffee, and plain tea.';

function buildAutophagyBlocks(): ArticleBlock[] {
  const timelineItems = AUTOPHAGY_STAGES.map((s) => ({
    rangeLabel: s.hour === 0 ? `0h` : `${s.hour}h`,
    title: s.title,
    body: s.description,
  }));

  const benefitBlocks: ArticleBlock[] = AUTOPHAGY_BENEFITS.map((b) => ({
    type: 'benefitCard' as const,
    title: b.title,
    body: b.description,
    accentColor: b.color,
  }));

  return [
    {
      type: 'keyInsight',
      title: 'KEY INSIGHT',
      text:
        'Your cells have a built-in recycling system. Fasting is one of the most reliable ways to activate autophagy — the science earned a Nobel Prize in 2016.',
    },
    {
      type: 'paragraph',
      text:
        'Autophagy (from Greek “self-eating”) is your body’s cellular recycling system. Discovered by Yoshinori Ohsumi (2016 Nobel Prize), it ramps up during fasting and underlies many of fasting’s long-term benefits.',
    },
    { type: 'heading', level: 2, text: 'What is autophagy?' },
    {
      type: 'paragraph',
      text:
        'During autophagy, cells break down damaged proteins and organelles and recycle the parts. **mTOR** (growth signaling) quiets down, while **AMPK** (energy sensor) helps switch the cell toward repair and cleanup.',
    },
    {
      type: 'quote',
      text:
        'Mechanistic studies show fasting and nutrient deprivation are potent triggers for autophagic flux across tissues.',
      citation: 'PMC — mechanistic insights into fasting-induced autophagy (review literature)',
    },
    { type: 'heading', level: 2, text: 'Fasting timeline' },
    {
      type: 'timeline',
      title: 'What happens hour by hour',
      items: timelineItems,
    },
    { type: 'heading', level: 2, text: 'Why it matters' },
    ...benefitBlocks,
    {
      type: 'statPair',
      left: {
        value: '16h+',
        label: 'Typical window where meaningful autophagy signaling ramps up in many protocols',
        source: 'Consensus teaching aids; individual variation applies',
      },
      right: {
        value: 'Months',
        label:
          'Sustained time-restricted eating may be needed to observe durable metabolic and cellular markers in humans',
        source: 'Varies by study design',
      },
    },
    {
      type: 'heading',
      level: 2,
      text: 'Why does fasting trigger it?',
    },
    {
      type: 'scienceCallout',
      title: 'mTOR pathway',
      body:
        'Fasting inhibits mTOR (growth signaling), helping shift cells from “build mode” toward recycling and repair.',
    },
    {
      type: 'scienceCallout',
      title: 'AMPK activation',
      body:
        'Low nutrient availability activates AMPK, a master regulator that supports mitochondrial quality control and autophagy.',
    },
    {
      type: 'mythFact',
      myth: 'You need to fast for many days straight to get any autophagy benefit.',
      fact:
        'Many people use daily fasting windows (e.g. 16:8) consistently over weeks and months — the key is sustained practice and appropriate medical supervision.',
    },
  ];
}

function buildIfMethodsBlocks(): ArticleBlock[] {
  const intro = INTERMITTENT_FAST_TYPES.find((f) => f.type === 'if_16_8');
  const protocolBlocks: ArticleBlock[] = INTERMITTENT_FAST_TYPES.map((f) => ({
    type: 'protocol' as const,
    name: f.name,
    hoursLabel: `${f.duration}h target window`,
    description: f.description,
    benefits: f.benefits,
    rules: f.rules,
  }));

  const tips: ArticleBlock[] = IF_GUIDE_TIPS.map((t) => ({
    type: 'tip' as const,
    title: t.title,
    body: t.text,
  }));

  return [
    {
      type: 'keyInsight',
      title: 'KEY INSIGHT',
      text:
        'Intermittent fasting is less about which foods you eat and more about when you eat. Start gentle (12:12), then extend the fasted window as it feels sustainable.',
    },
    {
      type: 'paragraph',
      text:
        'Intermittent fasting (IF) is a time-restricted eating pattern backed by modern science. It works with many cultural practices that honor cycles of feasting and rest.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Popular protocols',
    },
    ...(intro
      ? [
          {
            type: 'paragraph' as const,
            text: `${intro.name} remains the most common entry point: ${intro.description}`,
          },
        ]
      : []),
    ...protocolBlocks,
    { type: 'heading', level: 2, text: 'Getting started' },
    ...tips,
    {
      type: 'mythFact',
      myth: 'You must skip breakfast to “do IF correctly.”',
      fact:
        'Your eating window can slide — what matters is a consistent fasting window that fits your life and health goals.',
    },
  ];
}

function buildFoodsBlocks(): ArticleBlock[] {
  const safeBlocks: ArticleBlock[] = LEARN_FASTING_FRIENDLY_ITEMS.map((it) => ({
    type: 'foodItem' as const,
    title: it.title,
    description: it.desc,
    scienceNote: it.science,
  }));

  return [
    {
      type: 'keyInsight',
      title: 'KEY INSIGHT',
      text:
        'During a fast, anything with meaningful calories usually triggers a metabolic response. The list below reflects widely accepted “won’t break the fast” options for water fasting–style windows.',
    },
    {
      type: 'paragraph',
      text:
        'When in doubt, plain water is always safe. Black coffee and plain tea are commonly used; add-ins like milk, sweeteners, or juice shift you out of a clean fast.',
    },
    { type: 'heading', level: 2, text: 'Generally safe during a fast' },
    { type: 'paragraph', text: 'Zero or negligible calories — no insulin spike expected.' },
    ...safeBlocks,
    { type: 'heading', level: 2, text: 'Usually breaks a fast' },
    { type: 'breaksRow', items: [...LEARN_BREAKS_FAST_LABELS] },
    { type: 'heading', level: 2, text: 'Gray area' },
    { type: 'paragraph', text: LEARN_GRAY_AREA_COPY },
  ];
}

function buildPlaceholderBlocks(heading: string): ArticleBlock[] {
  return [
    { type: 'heading', level: 2, text: heading },
    {
      type: 'paragraph',
      text:
        'Full content for this guide is coming soon. This placeholder preview keeps the Learn hub structured like the final experience.',
    },
    {
      type: 'keyInsight',
      title: 'NOTE',
      text: 'You will see research highlights, practical tips, and links to related articles here in a future update.',
    },
  ];
}

const ARTICLE_LEARN_AUTOPHAGY: ArticleDetail = {
  id: 'learn-autophagy',
  title: "Autophagy: your body's cellular self-cleaning system",
  subtitle: 'Timeline, benefits, and how fasting flips the switch',
  difficulty: 'intermediate',
  readMinutes: 8,
  sectionIds: ['on_a_fast', 'start_here'],
  featured: true,
  hubIcon: 'Clock',
  hubIconColor: '#E85D4C',
  topicTag: 'AUTOPHAGY',
  badges: ['Science-backed'],
  updatedYear: 2025,
  relatedIds: ['learn-if-methods', 'learn-foods'],
  blocks: buildAutophagyBlocks(),
};

const ARTICLE_LEARN_IF: ArticleDetail = {
  id: 'learn-if-methods',
  title: 'Intermittent fasting protocols',
  subtitle: '16:8 through extended windows — compare and start safely',
  difficulty: 'beginner',
  readMinutes: 12,
  sectionIds: ['protocols', 'start_here'],
  featured: true,
  hubIcon: 'Timer',
  hubIconColor: '#C97B2A',
  topicTag: 'IF METHODS',
  badges: ['Science-backed'],
  updatedYear: 2025,
  relatedIds: ['learn-autophagy', 'learn-foods'],
  blocks: buildIfMethodsBlocks(),
};

const ARTICLE_LEARN_FOODS: ArticleDetail = {
  id: 'learn-foods',
  title: 'What you can drink (and what breaks a fast)',
  subtitle: 'Safe options, hard stops, and gray areas',
  difficulty: 'beginner',
  readMinutes: 6,
  sectionIds: ['on_a_fast', 'start_here'],
  featured: true,
  hubIcon: 'Droplets',
  hubIconColor: '#2E86AB',
  topicTag: 'NUTRITION',
  badges: ['Science-backed'],
  updatedYear: 2025,
  relatedIds: ['learn-autophagy', 'learn-if-methods'],
  blocks: buildFoodsBlocks(),
};

const ARTICLE_LEARN_HGH: ArticleDetail = {
  id: 'learn-hgh',
  title: 'HGH: the repair hormone',
  subtitle: 'How growth hormone shifts during fasting — overview coming soon',
  difficulty: 'intermediate',
  readMinutes: 7,
  sectionIds: ['hormones_longevity'],
  topicTag: 'HORMONES',
  hubIcon: 'Activity',
  hubIconColor: '#2E86AB',
  relatedIds: ['learn-cortisol', 'learn-sirtuins', 'learn-autophagy'],
  blocks: buildPlaceholderBlocks('Human growth hormone'),
};

const ARTICLE_LEARN_CORTISOL: ArticleDetail = {
  id: 'learn-cortisol',
  title: 'Cortisol & your circadian rhythm',
  subtitle: 'Stress timing, sleep, and how fasting interacts — overview coming soon',
  difficulty: 'intermediate',
  readMinutes: 8,
  sectionIds: ['hormones_longevity'],
  topicTag: 'HORMONES',
  hubIcon: 'Moon',
  hubIconColor: '#D4A03C',
  relatedIds: ['learn-hgh', 'learn-sirtuins', 'learn-autophagy'],
  blocks: buildPlaceholderBlocks('Cortisol and circadian rhythm'),
};

const ARTICLE_LEARN_SIRTUINS: ArticleDetail = {
  id: 'learn-sirtuins',
  title: 'Sirtuins & spermidine',
  subtitle: 'Longevity pathways linked to fasting — deep dive coming soon',
  difficulty: 'advanced',
  readMinutes: 9,
  sectionIds: ['hormones_longevity'],
  topicTag: 'LONGEVITY',
  hubIcon: 'Dna',
  hubIconColor: '#6C4F82',
  relatedIds: ['learn-hgh', 'learn-cortisol', 'learn-autophagy'],
  blocks: buildPlaceholderBlocks('Sirtuins and spermidine'),
};

const ARTICLE_LEARN_GUT: ArticleDetail = {
  id: 'learn-gut-microbiome',
  title: 'Fasting and your gut microbiome',
  subtitle: 'Digestive rest, diversity, and what we know so far — overview coming soon',
  difficulty: 'intermediate',
  readMinutes: 8,
  sectionIds: ['gut_brain'],
  topicTag: 'GUT HEALTH',
  relatedIds: ['learn-bdnf', 'learn-foods', 'learn-autophagy'],
  blocks: buildPlaceholderBlocks('Gut microbiome'),
  hubIcon: 'Bean',
  hubIconColor: '#2A9D8F',
};

const ARTICLE_LEARN_BDNF: ArticleDetail = {
  id: 'learn-bdnf',
  title: 'BDNF: fasting grows your brain',
  subtitle: 'Neurotrophic factors and cognitive benefits — overview coming soon',
  difficulty: 'advanced',
  readMinutes: 7,
  sectionIds: ['gut_brain'],
  topicTag: 'BRAIN',
  relatedIds: ['learn-gut-microbiome', 'learn-autophagy', 'learn-hgh'],
  blocks: buildPlaceholderBlocks('BDNF and fasting'),
  hubIcon: 'Brain',
  hubIconColor: '#D946A6',
};

export const LEARN_ARTICLES: ArticleDetail[] = [
  ARTICLE_LEARN_AUTOPHAGY,
  ARTICLE_LEARN_IF,
  ARTICLE_LEARN_FOODS,
  ARTICLE_LEARN_HGH,
  ARTICLE_LEARN_CORTISOL,
  ARTICLE_LEARN_SIRTUINS,
  ARTICLE_LEARN_GUT,
  ARTICLE_LEARN_BDNF,
];

export const LEARN_ARTICLE_SUMMARIES: ArticleSummary[] = LEARN_ARTICLES.map((a) => ({
  id: a.id,
  title: a.title,
  subtitle: a.subtitle,
  difficulty: a.difficulty,
  readMinutes: a.readMinutes,
  sectionIds: a.sectionIds,
  featured: a.featured,
  topicTag: a.topicTag,
  hubIcon: a.hubIcon,
  hubIconColor: a.hubIconColor,
}));

/** Hub card — quick protocol comparison (subset of 16:8, 18:6, 5:2, OMAD). */
export const LEARN_IF_COMPARISON = [
  {
    key: '16:8',
    title: '16:8 — The gateway fast',
    body: 'Eat in an 8h window. Most studied, easiest for many beginners.',
    dot: '#5B8C5A',
  },
  {
    key: '18:6',
    title: '18:6 — Deep fat burn',
    body: 'Longer fasted window; often used when comfortable with 16:8.',
    dot: '#D4A03C',
  },
  {
    key: '5:2',
    title: '5:2 — Two low-calorie days',
    body: 'Five days normal eating; two days with reduced intake — plan carefully.',
    dot: '#E05A33',
  },
  {
    key: 'OMAD',
    title: 'OMAD — One meal a day',
    body: 'Advanced for most people — needs nutrient-dense meals and monitoring.',
    dot: '#6C4F82',
  },
] as const;

export function getArticleById(id: string): ArticleDetail | undefined {
  return LEARN_ARTICLES.find((a) => a.id === id);
}

export function getRelatedArticles(article: ArticleDetail): ArticleSummary[] {
  return article.relatedIds
    .map((rid) => LEARN_ARTICLE_SUMMARIES.find((s) => s.id === rid))
    .filter((s): s is ArticleSummary => s != null);
}

export function filterArticleSummaries(
  summaries: ArticleSummary[],
  opts: { query: string; difficulty: ArticleDifficulty | 'all'; sectionId?: LearnSectionId },
): ArticleSummary[] {
  let out = summaries;
  const q = opts.query.trim().toLowerCase();
  if (q) {
    out = out.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q) ||
        (s.topicTag?.toLowerCase().includes(q) ?? false),
    );
  }
  if (opts.difficulty !== 'all') {
    out = out.filter((s) => s.difficulty === opts.difficulty);
  }
  const sid = opts.sectionId;
  if (sid) {
    out = out.filter((s) => s.sectionIds.includes(sid));
  }
  return out;
}

export const LEARN_QUIZ: LearnQuiz = {
  id: 'fasting-basics',
  title: 'Fasting knowledge quiz',
  subtitle: '5 quick checks on metabolism and timing',
  estimatedMinutes: 3,
  questions: [
    {
      id: 'q1',
      prompt: 'At what point does your body start meaningful fat burning during a fast?',
      hint: 'Think about what happens to your glycogen stores first.',
      options: [
        { key: 'A', text: 'Within 2 hours of your last meal' },
        { key: 'B', text: 'After 12–16 hours, once glycogen is depleted' },
        { key: 'C', text: 'Only after 3 days of fasting' },
        { key: 'D', text: 'It begins immediately when insulin spikes' },
      ],
      correctKey: 'B',
      feedbackWrong:
        'The body burns glycogen (stored glucose) first — often roughly a 12–16h supply for many adults. Fat burning ramps up as stores run low.',
      feedbackRight: 'Exactly. Glycogen is used first; fat becomes a major fuel later in the fast.',
      source: 'General physiology references',
    },
    {
      id: 'q2',
      prompt: 'Which drink is most consistent with a “clean” water fast?',
      options: [
        { key: 'A', text: 'Latte with oat milk' },
        { key: 'B', text: 'Plain black coffee' },
        { key: 'C', text: 'Fruit juice' },
        { key: 'D', text: 'Sweetened electrolyte powder' },
      ],
      correctKey: 'B',
      feedbackWrong:
        'Calories and sugars in milk, juice, or sweetened mixes trigger metabolic signaling. Black coffee is widely used with minimal calories.',
      source: 'Clinical fasting education summaries',
    },
    {
      id: 'q3',
      prompt: 'Autophagy is best described as:',
      options: [
        { key: 'A', text: 'Only muscle loss from fasting' },
        { key: 'B', text: 'Cellular recycling and cleanup of damaged parts' },
        { key: 'C', text: 'A type of ketone body' },
        { key: 'D', text: 'The same as diabetic ketoacidosis' },
      ],
      correctKey: 'B',
      feedbackWrong:
        'Autophagy is the cell’s way of breaking down and recycling damaged components — distinct from generic “weight loss” or ketoacidosis.',
      source: 'Nobel Prize background — Ohsumi, autophagy',
    },
    {
      id: 'q4',
      prompt: 'A sustainable way to begin intermittent fasting is:',
      options: [
        { key: 'A', text: 'Start with OMAD on day one' },
        { key: 'B', text: 'Skip all fluids for 24h' },
        { key: 'C', text: 'Shorter overnight fast (e.g. 12:12), then extend gradually' },
        { key: 'D', text: 'Fast until dizzy — push through' },
      ],
      correctKey: 'C',
      feedbackWrong:
        'Gradual windows, hydration, and medical guidance when needed are safer starting points than extreme day-one protocols.',
      source: 'IF clinician guidance',
    },
    {
      id: 'q5',
      prompt: 'Breaking a long fast is often safest by:',
      options: [
        { key: 'A', text: 'Large pizza immediately' },
        { key: 'B', text: 'Light, easy-to-digest food first; reintroduce gradually' },
        { key: 'C', text: 'Only alcohol' },
        { key: 'D', text: 'Skipping rehydration' },
      ],
      correctKey: 'B',
      feedbackWrong:
        'A gentle refeed reduces GI distress and electrolyte swings after longer fasts.',
      source: 'Fasting refeed practices',
    },
  ],
};
