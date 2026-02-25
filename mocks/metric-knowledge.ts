export interface MetricKnowledge {
  id: string;
  title: string;
  emoji: string;
  color: string;
  shortDesc: string;
  science: string;
  howFastingHelps: string;
  vedicPerspective?: string;
  keyFacts: string[];
  sources: string[];
}

export const METRIC_KNOWLEDGE: Record<string, MetricKnowledge> = {
  fatBurned: {
    id: 'fatBurned',
    title: 'Fat Burning',
    emoji: '🔥',
    color: '#E8913A',
    shortDesc: 'Your body switches from glucose to stored fat as its primary energy source during extended fasting.',
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
    emoji: '♻️',
    color: '#7B68AE',
    shortDesc: 'Your cells activate a self-cleaning process that removes damaged proteins and organelles, promoting cellular renewal.',
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
    emoji: '⚡',
    color: '#E8913A',
    shortDesc: 'Fasting dramatically increases Human Growth Hormone production, supporting muscle preservation, fat loss, and tissue repair.',
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
    emoji: '❤️‍🩹',
    color: '#C25450',
    shortDesc: 'Fasting significantly lowers chronic inflammation markers, reducing the root cause of many modern diseases.',
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
    emoji: '💧',
    color: '#2E86AB',
    shortDesc: 'Fasting resets your body\'s insulin response, improving blood sugar regulation and reducing diabetes risk.',
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
    emoji: '🧬',
    color: '#5B8C5A',
    shortDesc: 'Fasting activates anti-aging pathways that can make your cells biologically younger than your chronological age.',
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
    emoji: '🫗',
    color: '#D4A03C',
    shortDesc: 'Giving your digestive system extended rest allows it to repair, reset, and strengthen its function.',
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

  moneySaved: {
    id: 'moneySaved',
    title: 'Money Saved',
    emoji: '💰',
    color: '#5B8C5A',
    shortDesc: 'Fasting naturally reduces food expenses while potentially saving on long-term healthcare costs.',
    science: 'The financial impact of intermittent fasting extends beyond direct meal savings. Reduced caloric intake means lower grocery bills and fewer restaurant expenses. More significantly, the health improvements from consistent fasting — reduced diabetes risk (30-40%), lower cardiovascular disease risk (20-30%), and decreased inflammation — translate to substantial long-term healthcare savings. Studies estimate that preventing Type 2 diabetes alone saves an average of $9,600 per year in medical costs.',
    howFastingHelps: 'Each skipped meal saves an average of ₹150 in direct costs. Over a year of consistent intermittent fasting, this adds up significantly. But the hidden savings are even larger: fewer doctor visits, reduced medication needs, lower health insurance premiums, and avoided hospital stays from preventable chronic diseases.',
    keyFacts: [
      'Average meal cost savings: ₹150 per skipped meal',
      'Preventing diabetes saves ~₹800,000+ per year in medical costs',
      'Reduced snacking eliminates impulse food spending',
      'Long-term healthcare savings compound over decades',
      'Fasting is the most cost-effective health intervention',
    ],
    sources: ['American Diabetes Association, Economic Costs of Diabetes (2018)', 'Bray et al., Annual Review of Medicine (2020)'],
  },

  mealsSkipped: {
    id: 'mealsSkipped',
    title: 'Meals Skipped',
    emoji: '🍽️',
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
    emoji: '🕉️',
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
    emoji: '⚡',
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
    emoji: '📊',
    color: '#4A90A4',
    shortDesc: 'Your body transitions through distinct metabolic states during fasting, each with unique health benefits.',
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
};
