export interface MetricKnowledge {
  id: string;
  title: string;
  iconName: string;
  color: string;
  shortDesc: string;
  science: string;
  howFastingHelps: string;
  vedicPerspective?: string;
  /** Educational: what tends to be happening around ~12h into a fast (not personalized). */
  twelveHourGuide?: string;
  /** Optional rough anchor for slow-moving metrics (clearly non-medical). */
  longHorizonGuide?: string;
  keyFacts: string[];
  sources: string[];
}

export const METRIC_KNOWLEDGE: Record<string, MetricKnowledge> = {
  fatBurned: {
    id: 'fatBurned',
    title: 'Fat Burning',
    iconName: 'Flame',
    color: '#E8913A',
    shortDesc: 'Your body switches from glucose to stored fat as its primary energy source during extended fasting.',
    twelveHourGuide:
      'Around ~12 hours, many people are right at the glycogen → fat-burn crossover: lipolysis ramps up and fatty acids start feeding ketone production. The **illustration** above marks that transition—before it, you are still leaning on stored carbs; after it, fat oxidation contributes more with each hour.',
    science: 'During the first 12 hours of fasting, your body depletes its glycogen (sugar) stores in the liver. Once glycogen is exhausted, your body shifts to lipolysis — the breakdown of stored triglycerides in fat cells into free fatty acids and glycerol. These fatty acids are transported to the liver, where they are converted into ketone bodies (beta-hydroxybutyrate, acetoacetate) through a process called ketogenesis. Ketones then serve as an efficient fuel source for the brain and muscles.',
    howFastingHelps: 'Every hour after the 12-hour mark, your body burns approximately 0.14g of fat per kg of body weight. For a 70kg person, that is roughly 10g of fat per hour. Consistent intermittent fasting trains your body to become "metabolically flexible," meaning it can efficiently switch between glucose and fat burning. Over time, this improves your body composition and reduces visceral (belly) fat specifically.',
    vedicPerspective: 'In Ayurveda, this process is called "Agni Deepana" — the kindling of digestive fire. When the body finishes processing food, Agni turns inward to burn Ama (toxins and accumulated waste), purifying the body from within.',
    keyFacts: [
      'Fat burning starts after ~12 hours of fasting',
      '1 gram of fat = 9 calories of energy',
      'The brain can get up to 75% of its energy from ketones',
      'Visceral fat is burned preferentially during fasting',
      'Regular fasting improves metabolic flexibility',
    ],
    sources: ['Anton et al., Obesity (2018)', 'de Cabo & Mattson, NEJM (2019)'],
  },

  autophagy: {
    id: 'autophagy',
    title: 'Autophagy',
    iconName: 'RefreshCw',
    color: '#7B68AE',
    shortDesc: 'Your cells activate a self-cleaning process that removes damaged proteins and organelles, promoting cellular renewal.',
    twelveHourGuide:
      'At ~12 hours you are **before** the window where autophagy is usually described as strongly ramping up (often quoted as ~16h+). Think of ~12h as “preparation”: insulin is lower, AMPK signaling is more active, but meaningful autophagic flux for most people is still ahead—as the timeline suggests.',
    longHorizonGuide:
      'Meaningful cumulative autophagy time builds over **many** fasts. Deep autophagy in research is often associated with **18–24h+** per episode, repeated over weeks—not something a single 12h fast fully captures.',
    science: 'Autophagy (from Greek "auto" = self, "phagein" = to eat) is a cellular recycling mechanism where cells break down and recycle their own damaged or dysfunctional components. This includes misfolded proteins, damaged mitochondria, and intracellular pathogens. The process is regulated by mTOR (mechanistic Target of Rapamycin) and AMPK pathways. When nutrients are scarce (during fasting), mTOR is inhibited and AMPK is activated, triggering autophagy. Yoshinori Ohsumi won the 2016 Nobel Prize in Physiology for discovering the mechanisms of autophagy.',
    howFastingHelps: 'Autophagy begins to ramp up significantly after 16 hours of fasting, reaching peak activity between 24-48 hours. During this window, cells aggressively recycle damaged components, which has been linked to reduced cancer risk, improved neurological health, slower aging, and enhanced immune function. Even regular 16:8 intermittent fasting provides meaningful autophagy benefits.',
    vedicPerspective: 'The Vedic concept of "Shaucha" (purity/cleanliness) extends to the cellular level. Ancient texts describe fasting as a way to purify not just the mind but every cell of the body. Ekadashi fasts, lasting 24+ hours, align perfectly with peak autophagy activation.',
    keyFacts: [
      'Autophagy begins around 16 hours of fasting',
      'Peak activity occurs between 24-48 hours',
      '2016 Nobel Prize was awarded for autophagy research',
      'Reduces risk of neurodegenerative diseases',
      'Helps prevent accumulation of damaged cellular components',
      'May slow the biological aging process',
    ],
    sources: ['Ohsumi Y., Nobel Lecture (2016)', 'Alirezaei et al., Autophagy (2010)', 'Bagherniya et al., Pharmacological Research (2018)'],
  },

  hghBoost: {
    id: 'hghBoost',
    title: 'HGH (Growth Hormone) Boost',
    iconName: 'Zap',
    color: '#E8913A',
    shortDesc: 'Fasting dramatically increases Human Growth Hormone production, supporting muscle preservation, fat loss, and tissue repair.',
    twelveHourGuide:
      'By ~12 hours, insulin has usually fallen enough that **GH secretion can climb** compared to the fed state. You are on the early slope—bigger pulses are often reported deeper into the fast (e.g. overnight into 16–24h), which the bar marks as lying past the 12h notch.',
    science: 'Human Growth Hormone (HGH) is produced by the pituitary gland and plays a critical role in growth, cell repair, metabolism, and body composition. HGH stimulates the liver to produce IGF-1, which promotes cell growth and regeneration. During fasting, two key mechanisms boost HGH: (1) reduced insulin levels remove the suppressive effect on HGH secretion, and (2) increased ghrelin (hunger hormone) directly stimulates HGH release from the pituitary gland. Studies show HGH can increase by up to 2000% (20x) during a 24-hour fast.',
    howFastingHelps: 'After 12 hours of fasting, HGH levels begin to rise significantly. By 24 hours, levels can be 5-20 times higher than baseline. This massive surge helps preserve lean muscle mass during fasting (your body burns fat instead of muscle), accelerates fat metabolism, improves skin elasticity, strengthens bones, and enhances recovery from exercise. The HGH boost is one reason fasted individuals often report better workout recovery.',
    vedicPerspective: 'In Yoga philosophy, this rejuvenating effect is associated with "Ojas" — the vital energy that governs immunity, strength, and vitality. Fasting is said to concentrate and purify Ojas, explaining why practitioners often feel energized rather than depleted after a fast.',
    keyFacts: [
      'HGH can increase up to 2000% during a 24-hour fast',
      'Peaks during sleep while fasting — amplifying overnight repair',
      'Preserves muscle mass during caloric restriction',
      'Accelerates fat metabolism and body recomposition',
      'Declines naturally with age — fasting helps counteract this',
    ],
    sources: ['Hartman et al., JCEM (1992)', 'Ho et al., JCEM (1988)', 'Intermountain Medical Center (2011)'],
  },

  inflammationReduction: {
    id: 'inflammationReduction',
    title: 'Inflammation Reduction',
    iconName: 'HeartPulse',
    color: '#C25450',
    shortDesc: 'Fasting significantly lowers chronic inflammation markers, reducing the root cause of many modern diseases.',
    twelveHourGuide:
      'A single ~12h fast is a **small signal** for inflammation pathways (less post-meal endotoxemia, lower insulin). Noticeable shifts in markers like CRP usually need **weeks of pattern**, not one half-day—use the timeline as “directionally earlier” on the fasting clock.',
    longHorizonGuide:
      'Trials often report meaningful CRP / cytokine changes after **8–12+ weeks** of regular time-restricted eating or alternate-day patterns—not from one long fast alone.',
    science: 'Chronic low-grade inflammation is implicated in nearly every major disease: heart disease, diabetes, cancer, Alzheimer\'s, and autoimmune conditions. Key inflammatory markers include C-reactive protein (CRP), IL-6, TNF-alpha, and NF-kB. During fasting, several anti-inflammatory mechanisms activate: (1) reduced oxidative stress through lower free radical production, (2) decreased production of pro-inflammatory cytokines, (3) activation of SIRT1 and SIRT3 (sirtuins) which suppress inflammation, and (4) the NLRP3 inflammasome is inhibited, reducing the inflammatory cascade.',
    howFastingHelps: 'Studies show that regular intermittent fasting can reduce CRP levels by 30-40% within 8-12 weeks. The anti-inflammatory benefits compound over time with consistent practice. Fasting also promotes the production of beta-hydroxybutyrate (BHB), a ketone body that directly blocks the NLRP3 inflammasome — one of the most potent triggers of systemic inflammation.',
    vedicPerspective: 'Ayurveda identifies excess "Pitta" (fire/heat) as the source of inflammation in the body. Fasting is prescribed as one of the most effective ways to pacify aggravated Pitta, cooling the body and restoring balance to the doshas.',
    keyFacts: [
      'CRP levels can drop 30-40% with consistent fasting',
      'Ketone body BHB directly blocks inflammatory pathways',
      'Reduces risk of heart disease, diabetes, and autoimmune conditions',
      'Anti-inflammatory effects compound with consistency',
      'Even 16:8 fasting shows measurable inflammation reduction',
    ],
    sources: ['Youm et al., Nature Medicine (2015)', 'Faris et al., Nutrition Research (2012)', 'Aksungar et al., Annals of Nutrition & Metabolism (2007)'],
  },

  insulinSensitivity: {
    id: 'insulinSensitivity',
    title: 'Insulin Sensitivity',
    iconName: 'Droplets',
    color: '#2E86AB',
    shortDesc: 'Fasting resets your body\'s insulin response, improving blood sugar regulation and reducing diabetes risk.',
    twelveHourGuide:
      'Around ~12h, circulating insulin is typically **much lower** than after meals; the liver is burning through glycogen. That fasting chemistry is exactly what lets the next meal land on a “quieter” metabolic baseline—illustrated as crossing into the right half of the first day.',
    science: 'Insulin is a hormone that signals cells to absorb glucose from the bloodstream. When you eat frequently, insulin is constantly elevated, and over time cells become "resistant" to its signal — requiring more insulin to achieve the same effect. This is insulin resistance, the precursor to Type 2 diabetes. During fasting, insulin levels drop significantly, allowing cells to resensitize to insulin\'s signal. The enzyme AMPK is activated, improving glucose uptake in muscles. Simultaneously, liver glycogen is depleted, reducing hepatic insulin resistance.',
    howFastingHelps: 'Studies show intermittent fasting can reduce fasting insulin levels by 20-31% and improve insulin sensitivity by up to 50%. The longer and more consistent your fasting practice, the greater the improvement. Your score is calculated from fasting duration, consistency streak, completion rate, and total experience. A score above 70 indicates strong metabolic health.',
    vedicPerspective: 'The concept of "Madhura Rasa" (sweet taste) balance is central to Ayurveda. Excess sweetness in the body leads to "Prameha" (urinary/metabolic disorders). Regular fasting is the ancient prescription for maintaining this balance — essentially what modern science now calls insulin sensitivity.',
    keyFacts: [
      'Fasting can reduce insulin levels by 20-31%',
      'Insulin sensitivity can improve by up to 50%',
      'Lower insulin allows the body to access fat stores',
      'Consistent fasting reverses early insulin resistance',
      'Even skipping breakfast shows measurable improvement in some studies',
    ],
    sources: ['Halberg et al., Journal of Applied Physiology (2005)', 'Sutton et al., Cell Metabolism (2018)', 'Barnosky et al., Obesity Reviews (2014)'],
  },

  cellularAge: {
    id: 'cellularAge',
    title: 'Cellular Age Reduction',
    iconName: 'Dna',
    color: '#5B8C5A',
    shortDesc: 'Fasting activates anti-aging pathways that can make your cells biologically younger than your chronological age.',
    twelveHourGuide:
      'At only ~12h, **repair programs are waking up** (lower insulin, early stress-response pathways), but biological-age-style benefits in studies come from **repeated deep windows**—think many cycles of 16–18h+ rather than a single lunch-to-dinner skip.',
    longHorizonGuide:
      '**Rough anchor (educational, not medical):** Aayu estimates “years younger” from **cumulative hours past 16h** across your fasts. In that model, **~1 year** of biological-age credit ≈ **~1,200** such hours (~100h beyond 16h ≈ **~1 month**). So **~10 days** of credit is on the order of **~30–35** cumulative autophagy-hours in the same model. Real clocks (epigenetic tests) vary widely; use this only to reason about scale.',
    science: 'Biological age is determined by telomere length, epigenetic markers, and cellular damage accumulation. Fasting activates several anti-aging pathways: (1) Sirtuins (SIRT1-7) — proteins that repair DNA and regulate gene expression, (2) Autophagy — removes damaged cellular components, (3) Reduced oxidative stress — less free radical damage to DNA, and (4) Telomere protection — fasting may slow telomere shortening. Additionally, fasting promotes stem cell regeneration, particularly in the immune system, effectively "resetting" aging immune cells.',
    howFastingHelps: 'Every 100 hours spent in autophagy (fasting beyond 16 hours) is estimated to reduce biological age by approximately 1 month. This compounds over time — consistent fasters who accumulate significant autophagy hours can show measurable differences in biological vs. chronological age. The NAD+ pathway, critical for cellular repair, is significantly upregulated during fasting.',
    vedicPerspective: 'The Vedic concept of "Rasayana" (rejuvenation therapy) describes practices that reverse aging and restore youthfulness. Fasting has been considered the most accessible and powerful Rasayana for millennia. The Charaka Samhita specifically recommends periodic fasting for longevity.',
    keyFacts: [
      'Fasting activates all 7 sirtuin anti-aging proteins',
      'NAD+ levels increase during fasting, boosting cellular repair',
      'Stem cell regeneration is triggered after extended fasts',
      'Telomere shortening may be slowed by regular fasting',
      'Autophagy removes age-related cellular damage',
    ],
    sources: ['Longo & Mattson, Cell Metabolism (2014)', 'Cheng et al., Cell Stem Cell (2014)', 'Mitchell et al., Cell Reports (2019)'],
  },

  gutRest: {
    id: 'gutRest',
    title: 'Gut Rest (Agni)',
    iconName: 'Droplet',
    color: '#D4A03C',
    shortDesc: 'Giving your digestive system extended rest allows it to repair, reset, and strengthen its function.',
    twelveHourGuide:
      'By ~12h without food, the **migrating motor complex** has had multiple “cleaning waves”; you are well into digestive rest versus a short post-meal pause. Gut lining turnover and barrier repair scale with **how often** you repeat these longer quiet windows.',
    science: 'The gastrointestinal tract is one of the most metabolically active organs, with the intestinal lining replacing itself every 3-5 days. During fasting, the Migrating Motor Complex (MMC) — a pattern of electrical activity that sweeps through the intestines — becomes fully active. The MMC acts as a "housekeeper," clearing undigested food particles, bacteria, and debris from the small intestine. This process is suppressed during eating and only activates after 4+ hours without food. Extended rest also allows the gut barrier to repair, reducing intestinal permeability ("leaky gut").',
    howFastingHelps: 'Effective gut rest begins after 8 hours of fasting when the digestive system enters full maintenance mode. The longer the fast, the more complete the cleaning and repair cycle. Regular fasting has been shown to improve gut microbiome diversity, reduce bloating and digestive discomfort, strengthen the intestinal barrier, and improve nutrient absorption when eating resumes.',
    vedicPerspective: 'Agni (digestive fire) is considered the foundation of health in Ayurveda. When Agni is strong, food is properly digested and Ama (toxins) do not accumulate. Fasting is the primary method prescribed to strengthen Agni — "Langhana" (lightening therapy). The Ashtanga Hridaya states that periodic fasting keeps Agni blazing bright.',
    keyFacts: [
      'The Migrating Motor Complex only fully activates during fasting',
      'Gut lining replaces itself every 3-5 days — fasting aids this',
      'Reduces Small Intestinal Bacterial Overgrowth (SIBO)',
      'Improves gut microbiome diversity',
      'Strengthens intestinal barrier ("leaky gut" repair)',
      'Enhances nutrient absorption in subsequent meals',
    ],
    sources: ['Deloose et al., Neurogastroenterology & Motility (2012)', 'Cignarella et al., Cell Reports (2018)', 'Li et al., Gut Microbes (2020)'],
  },


  mealsSkipped: {
    id: 'mealsSkipped',
    title: 'Meals Skipped',
    iconName: 'UtensilsCrossed',
    color: '#B85C38',
    shortDesc: 'Each meal you intentionally skip gives your body more time in a fasted, healing state.',
    science: 'The modern habit of eating 3 meals plus snacks keeps the body in a constant fed state, with insulin elevated for 16-18 hours daily. By strategically skipping meals, you extend the fasting window, allowing insulin to drop, fat burning to activate, and cellular repair processes to engage. Research shows that meal frequency reduction (even without calorie counting) leads to improved metabolic markers, weight management, and longevity.',
    howFastingHelps: 'Each skipped meal extends your fasting window by approximately 4-6 hours. This additional fasting time contributes to deeper fat burning, more autophagy activation, and greater HGH production. The key is consistency — regular meal skipping trains your body to efficiently switch between fed and fasted states.',
    keyFacts: [
      'Humans evolved eating 1-2 meals per day, not 3+',
      'Each skipped meal extends fasting by ~4-6 hours',
      'Meal frequency reduction improves metabolic health',
      'No evidence that skipping meals causes metabolic slowdown',
      'Fasted periods allow digestive system rest and repair',
    ],
    sources: ['Mattson et al., PNAS (2014)', 'Longo & Panda, Cell Metabolism (2016)'],
  },

  sattvicScore: {
    id: 'sattvicScore',
    title: 'Sattvic Score',
    iconName: 'Sparkles',
    color: '#7B68AE',
    shortDesc: 'Measures how well your fasting practice aligns with Vedic spiritual principles of purity and discipline.',
    science: 'In Vedic philosophy, Sattva represents purity, harmony, and balance — one of the three Gunas (qualities) that govern all of nature. A Sattvic lifestyle promotes clarity of mind, inner peace, and spiritual growth. The Bhagavad Gita (Chapter 17) describes Sattvic food as that which increases life, purity, strength, health, joy, and cheerfulness. Fasting, especially on auspicious days, is considered one of the highest Sattvic practices.',
    howFastingHelps: 'Your Sattvic score improves through: observing Vedic fasting days (Ekadashi, Pradosh, etc.), maintaining consistency in your practice, building long streaks of discipline, and completing fasts fully. Each component strengthens your connection to the Sattvic lifestyle. The score reflects not just physical fasting but the spiritual intention behind it.',
    vedicPerspective: 'The Chandogya Upanishad states: "Ahara Shuddhi Sattva Shuddhi" — purity of food leads to purity of mind. Fasting is the ultimate expression of food purity, as it transcends even the choice of what to eat. On Ekadashi, Lord Vishnu is said to reside in all grains, making fasting a way to avoid consuming the divine presence.',
    keyFacts: [
      'Three Gunas: Sattva (purity), Rajas (activity), Tamas (inertia)',
      'Ekadashi fasting is mentioned in multiple Puranas',
      '24 Ekadashi days per year — each with unique spiritual significance',
      'Fasting purifies all three levels: body, mind, and spirit',
      'Consistency in practice is valued over intensity in Vedic tradition',
    ],
    sources: ['Bhagavad Gita, Chapter 17', 'Garuda Purana', 'Padma Purana — Ekadashi Mahatmya'],
  },

  pranaEnergy: {
    id: 'pranaEnergy',
    title: 'Prana Energy',
    iconName: 'Zap',
    color: '#5B8C5A',
    shortDesc: 'Fasting enhances vital life force energy, improving mental clarity, physical vitality, and spiritual awareness.',
    science: 'While "Prana" is a Vedic concept, modern science validates its components. Mental clarity improves during fasting due to increased BDNF (Brain-Derived Neurotrophic Factor) production, which enhances neural connections and cognitive function. Physical vitality increases through improved mitochondrial efficiency — fasting triggers mitochondrial biogenesis (creation of new mitochondria) and removes damaged ones through mitophagy. Norepinephrine levels rise during fasting, increasing alertness and energy.',
    howFastingHelps: 'Your Prana scores are calculated from: Mental Clarity (based on average fast duration — longer fasts produce more BDNF), Vitality (based on streak and consistency — regular fasting improves baseline energy), and Spiritual awareness (based on Sattvic score and dedication to practice). These three pillars reflect the holistic benefits of a disciplined fasting practice.',
    vedicPerspective: 'Prana is the cosmic life force that sustains all living beings. The Prasna Upanishad describes Prana as the fundamental energy from which all other life functions arise. Fasting concentrates Prana by redirecting the enormous energy normally used for digestion (up to 30% of total energy) toward healing, meditation, and spiritual practices.',
    keyFacts: [
      'Digestion uses up to 30% of total body energy',
      'BDNF increases by up to 400% during extended fasting',
      'Norepinephrine rises, enhancing focus and alertness',
      'New mitochondria are created during fasting (biogenesis)',
      'Many spiritual traditions use fasting to enhance meditation',
    ],
    sources: ['Mattson et al., Nature Reviews Neuroscience (2018)', 'Prasna Upanishad', 'Anton et al., Ageing Research Reviews (2019)'],
  },

  metabolicZone: {
    id: 'metabolicZone',
    title: 'Metabolic Zones',
    iconName: 'BarChart3',
    color: '#4A90A4',
    shortDesc: 'Your body transitions through distinct metabolic states during fasting, each with unique health benefits.',
    twelveHourGuide:
      'The strip marks **~12h** on a **0→24h** educational timeline. At that point many people are finishing glycogen-heavy use and **entering the fat-burn band** (see zones below). Your personal curve depends on diet, muscle glycogen, sleep, and activity.',
    science: 'As fasting progresses, your metabolism shifts through well-defined phases. In the Anabolic state (0-4h), insulin is high and nutrients are being absorbed. During the Catabolic phase (4-12h), glycogen stores are progressively depleted. Fat Burning begins at 12-18h as lipolysis accelerates. Ketosis (18-24h) marks deep ketone production. Autophagy Peak (24-48h) brings maximum cellular cleansing. Deep Renewal (48h+) triggers stem cell regeneration and profound healing.',
    howFastingHelps: 'Understanding which zone you are in helps you make informed decisions about your fast duration. Each zone offers distinct benefits, and knowing your current state provides motivation to continue. Even reaching the Fat Burning zone (12h+) provides significant health benefits. Longer fasts unlock deeper healing but should be approached gradually.',
    vedicPerspective: 'The progression through metabolic zones mirrors the Vedic concept of "Tapas" (austerity/heat). Just as gold is purified by increasing heat, the body and mind are progressively purified through deeper fasting states. The Yoga Sutras describe Tapas as one of the three pillars of spiritual practice (Kriya Yoga).',
    keyFacts: [
      '0-4h: Digestion and nutrient absorption',
      '4-12h: Glycogen depletion, transition to fasting',
      '12-18h: Fat burning and early ketone production',
      '18-24h: Deep ketosis, significant HGH boost',
      '24-48h: Peak autophagy and cellular renewal',
      '48h+: Stem cell regeneration and deep healing',
    ],
    sources: ['Longo & Mattson, Cell Metabolism (2014)', 'Panda S., The Circadian Code (2018)', 'Yoga Sutras of Patanjali, 2.1'],
  },

  metabolicDiscipline: {
    id: 'metabolicDiscipline',
    title: 'Metabolic Discipline Score',
    iconName: 'BarChart3',
    color: '#5B8C5A',
    shortDesc:
      'Your **Metabolic Discipline Score (0–100)** summarizes how strongly your recent fasting pattern supports depth, consistency, overnight alignment, meaningful long fasts, and streak momentum. It is an **in-app coaching metric** — not a lab result or diagnosis.',
    science:
      'The score blends five weighted pillars, each derived from your completed fasts in the selected time range (and your current streak):\n\n' +
      '• **Duration (30 points)** — How close your average fast length is to the target length from your plan (for example 16 hours).\n' +
      '• **Consistency (25 points)** — How often you complete fasts relative to your plan’s expected frequency in that window.\n' +
      '• **Circadian alignment (20 points)** — How much of your fasting time overlaps quiet overnight hours (roughly 10 PM–6 AM), when biology tolerates extended fasting especially well.\n' +
      '• **Deep fasts (15 points)** — How often you reach 16+ hour windows, which are associated with deeper metabolic and repair signaling for many people.\n' +
      '• **Streak bonus (10 points)** — Momentum for maintaining consecutive days of practice.\n\n' +
      'Together, these capture **discipline and pattern quality**, not a single hormone or blood value.',
    howFastingHelps:
      'Use the score as a **north star** for habits: lengthen averages toward your plan, hit your weekly rhythm, favor windows that include sleep, occasionally push into 16h+ when safe for you, and protect small daily streaks. Tap **See score breakdown** for pillar-by-pillar detail and how your window compares to the prior period.',
    vedicPerspective:
      'In the Vedic tradition, steady practice (**abhyasa**) with self-regulation (**tapas**) turns intention into lasting change. The Metabolic Discipline Score mirrors that idea: not one dramatic fast, but a **repeated, well-timed pattern** that supports clarity of mind and steadiness of metabolism.',
    keyFacts: [
      'Maximum score is 100; components add up from the five pillars described above',
      'Changing the Insights range (7D / 30D / All) recalculates the score from different fast history',
      'This score is separate from the “Insulin Sensitivity” card, which uses a different 0–100 model',
      'Improving overnight overlap often raises the Circadian pillar without longer waking hunger',
      'Use your plan’s target hours and fasts-per-week as the personalized baseline',
    ],
    sources: ['Derived in-app from your fasting log; general physiology: Mattson et al., IF reviews', 'Circadian fasting: Panda, The Circadian Code'],
  },

  lowInsulinTime: {
    id: 'lowInsulinTime',
    title: 'Low-insulin time',
    iconName: 'Clock',
    color: '#2E86AB',
    shortDesc:
      'This stat sums how many hours you spent in completed fasts during the selected Insights period. More cumulative fasted time generally means less exposure to the elevated-insulin fed state across the week or month — a simple way to think about metabolic breathing room.',
    science:
      'After meals, insulin rises to store and distribute nutrients. During fasting, insulin typically trends downward, and fuel shifts toward stored glycogen and then fat. Total hours fasted does not measure insulin directly, but it tracks how much of your life rhythm is spent in the low-insulin fasting arc versus frequent eating.',
    howFastingHelps:
      'Extending or repeating fasting windows (when appropriate for you) increases cumulative low-insulin time without needing a wearable. Pairing this with your Metabolic Discipline Score shows whether you are adding hours in a sustainable, consistent way.',
    vedicPerspective:
      'Ayurveda emphasizes gaps between meals so **Agni** can complete its cycle and **Ama** does not accumulate from constant grazing. Longer quiet windows echo the same principle modern metabolism describes as fewer post-meal insulin spikes.',
    keyFacts: [
      'Uses completed fast duration summed over the same range as the Insights toggle',
      'Does not replace blood tests (fasting insulin, HOMA-IR, etc.)',
      'Works together with meal timing and food quality for overall metabolic health',
    ],
    sources: ['General fasting physiology reviews', 'Insulin dynamics: textbooks of endocrinology & metabolism'],
  },

  deepFastsInsight: {
    id: 'deepFastsInsight',
    title: 'Deep fasts (16h+)',
    iconName: 'Flame',
    color: '#E8913A',
    shortDesc:
      'Deep fasts here are completed fasts of about 16 hours or longer in the selected period. They usually mean you have moved past early post-meal metabolism into stronger fat-mobilization and repair-related signaling for many people.',
    science:
      'Timing varies by person, but many guides place **glycogen use** in the earlier half of a day-long fast and increasing **fat-derived fuel** afterward. Sixteen hours is a practical milestone in intermittent-fasting plans (e.g. 16:8) for stacking more hours in a low-insulin, repair-favorable state.',
    howFastingHelps:
      'The count rewards how often you reach that depth in the window, not one heroic fast. Build gradually, hydrate, and break safely — the Metabolic Discipline “Deep fasts” pillar also reflects this behavior.',
    vedicPerspective:
      'Classical fasting days (e.g. Ekadashi) often imply full-day discipline; the modern 16h milestone is a gentler, daily rhythm that still honors extended digestive rest.',
    keyFacts: [
      'Count includes completed fasts ≥ ~16 hours in the selected range',
      'Not medical advice; medications and conditions change safety — consult your clinician',
    ],
    sources: ['IF trial literature (16:8 and similar)', 'Longo & Mattson, metabolic physiology overviews'],
  },

  circadianAlignment: {
    id: 'circadianAlignment',
    title: 'Circadian alignment',
    iconName: 'Moon',
    color: '#4A90A4',
    shortDesc:
      'This pillar scores how much of your fasting happens during nighttime quiet hours (modeled here as about 10 PM–6 AM local time). Fasting through sleep aligns with circadian biology: digestive load drops when the brain expects rest and repair.',
    science:
      'Core clock genes regulate metabolism, hormone timing, and glucose control. Eating late constantly presses “daytime” signals into the night; shifting more fasting into sleep reduces that friction for many people. The app estimates overlap between each fast and that overnight window and rolls it into your Metabolic Discipline Score.',
    howFastingHelps:
      'Earlier dinners, stable sleep, and windows that end breakfast after morning often raise overlap without extreme duration. Small shifts (even 30–60 minutes) can move this metric over weeks.',
    vedicPerspective:
      'Dinacharya (daily routine) aligns activity, meals, and rest with solar rhythm. Letting the night be a time of sensory and digestive rest matches both circadian science and traditional schedule wisdom.',
    keyFacts: [
      'Uses local timestamps on your completed fasts',
      'One part of the overall score — not a measure of sleep quality by itself',
    ],
    sources: ['Sutton et al., Cell Metabolism (2018) — meal timing', 'Panda, The Circadian Code'],
  },

  fastingConsistency: {
    id: 'fastingConsistency',
    title: 'Fasting consistency',
    iconName: 'Activity',
    color: '#5B8C5A',
    shortDesc:
      'Consistency shows whether you are showing up for your plan: completions this week, streak, and longest fast. The dots are a quick calendar of which days had a completed fast (by end date).',
    science:
      'Behavior change research favors frequency and repeatability over occasional extreme efforts. A rhythm you can keep months-long drives most of the metabolic and inflammatory benefits seen in population studies of time-restricted eating and periodic fasting.',
    howFastingHelps:
      'Aim for predictable windows rather than perfect intensity. The target days line references your plan’s expected fasts per week; your streak rewards consecutive days with practice logged in the app.',
    vedicPerspective:
      'The Gunas teach that steady sattvic effort outperforms irregular bursts of rajasic intensity. Consistency in fasting is treated as training the mind as much as the body.',
    keyFacts: [
      'Weekly dots: Mon–Sun, filled if a completed fast ended on that calendar day',
      'Streak counts consecutive days meeting your practice (app-defined)',
    ],
    sources: ['Habit formation literature', 'Bhagavad Gita on steady practice'],
  },
};
