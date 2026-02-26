import { FastTypeInfo, VedicFastDay } from '@/types/fasting';

export const INTERMITTENT_FAST_TYPES: FastTypeInfo[] = [
  {
    type: 'if_16_8',
    name: '16:8 Fast',
    deity: 'Intermittent',
    duration: 16,
    description: 'The most popular intermittent fasting protocol. Fast for 16 hours, eat within an 8-hour window. Ideal for beginners.',
    benefits: [
      'Boosts fat burning and metabolism',
      'Improves insulin sensitivity',
      'Enhances mental clarity and focus',
      'Easy to maintain long-term',
      'Supports weight management',
    ],
    rules: [
      'Fast for 16 hours (e.g. 8 PM to 12 PM next day)',
      'Water, black coffee, and herbal tea allowed',
      'Eat balanced meals in the 8-hour window',
      'Avoid snacking outside the window',
      'Stay hydrated throughout',
    ],
    icon: '⏱️',
    category: 'intermittent',
  },
  {
    type: 'if_18_6',
    name: '18:6 Fast',
    deity: 'Intermittent',
    duration: 18,
    description: 'A moderately challenging protocol. Fast for 18 hours with a 6-hour eating window. Great for experienced fasters.',
    benefits: [
      'Deeper autophagy activation',
      'Accelerated fat loss',
      'Improved cellular repair',
      'Better hormonal balance',
      'Enhanced energy levels',
    ],
    rules: [
      'Fast for 18 hours (e.g. 6 PM to 12 PM next day)',
      'Only calorie-free drinks during fast',
      'Two balanced meals in eating window',
      'Break fast gently with light food',
      'Listen to your body',
    ],
    icon: '🔄',
    category: 'intermittent',
  },
  {
    type: 'if_20_4',
    name: '20:4 Warrior',
    deity: 'Intermittent',
    duration: 20,
    description: 'The Warrior Diet approach. Fast for 20 hours with a 4-hour eating window. For advanced practitioners.',
    benefits: [
      'Maximum autophagy benefits',
      'Significant fat burning',
      'Heightened mental sharpness',
      'Growth hormone boost',
      'Deep metabolic reset',
    ],
    rules: [
      'Fast for 20 hours, eat in a 4-hour window',
      'Small amounts of raw fruits/veggies allowed during fast',
      'One large meal in the evening',
      'Focus on nutrient-dense foods',
      'Not recommended for beginners',
    ],
    icon: '⚔️',
    category: 'intermittent',
  },
  {
    type: 'if_omad',
    name: 'OMAD',
    deity: 'Intermittent',
    duration: 23,
    description: 'One Meal A Day. The ultimate daily fast — eat one nutritious meal within a 1-hour window.',
    benefits: [
      'Simplifies daily eating decisions',
      'Maximum daily autophagy',
      'Powerful metabolic benefits',
      'Time freedom from cooking',
      'Deep mental discipline',
    ],
    rules: [
      'Eat one complete meal per day',
      'Meal should be nutrient-dense and balanced',
      'Stay hydrated with calorie-free drinks',
      'Choose a consistent meal time',
      'Ensure adequate calorie intake in one sitting',
    ],
    icon: '🍽️',
    category: 'intermittent',
  },
  {
    type: 'if_36',
    name: '36-Hour Fast',
    deity: 'Intermittent',
    duration: 36,
    description: 'An extended fast spanning a full day and night. Powerful for deep cellular repair and metabolic reset.',
    benefits: [
      'Deep autophagy and cellular renewal',
      'Significant insulin reset',
      'Enhanced immune function',
      'Mental clarity and resilience',
      'Profound metabolic benefits',
    ],
    rules: [
      'No food for 36 hours',
      'Water, electrolytes, and herbal tea allowed',
      'Rest and avoid intense exercise',
      'Break fast gently with broth or fruit',
      'Only for experienced fasters',
    ],
    icon: '🌟',
    category: 'intermittent',
  },
];

export const FAST_TYPES: FastTypeInfo[] = [
  {
    type: 'ekadashi',
    name: 'Ekadashi',
    deity: 'Lord Vishnu',
    duration: 24,
    description: 'Observed on the 11th day of each lunar fortnight. One of the most sacred fasts in Vedic tradition, dedicated to Lord Vishnu.',
    benefits: [
      'Purifies mind and body',
      'Enhances spiritual awareness',
      'Removes past karmic debts',
      'Promotes discipline and self-control',
      'Aids digestive system reset',
    ],
    rules: [
      'Begin fast from sunrise to next day sunrise',
      'Avoid grains, beans, and certain vegetables',
      'Fruits, milk, and nuts are permitted (Phalahari)',
      'Spend time in prayer and meditation',
      'Break fast after sunrise next day with grain',
    ],
    icon: '🕉️',
    category: 'vedic',
  },
  {
    type: 'pradosh',
    name: 'Pradosh Vrat',
    deity: 'Lord Shiva',
    duration: 12,
    description: 'Observed on the 13th day of each lunar fortnight during twilight hours. Dedicated to Lord Shiva and Goddess Parvati.',
    benefits: [
      'Removes obstacles and negativity',
      'Brings peace and prosperity',
      'Strengthens willpower',
      'Blesses marital harmony',
      'Grants spiritual merit',
    ],
    rules: [
      'Fast from sunrise until after evening puja',
      'Perform Shiva puja during Pradosh Kaal (twilight)',
      'Fruits and milk are permitted',
      'Chant Om Namah Shivaya',
      'Break fast after evening worship',
    ],
    icon: '🌙',
    category: 'vedic',
  },
  {
    type: 'purnima',
    name: 'Purnima Vrat',
    deity: 'Satyanarayan / Chandra',
    duration: 24,
    description: 'Full moon fasting observed on Purnima. Associated with Satyanarayan puja and lunar energy.',
    benefits: [
      'Balances emotions and mind',
      'Enhances intuition',
      'Promotes gratitude and abundance',
      'Strengthens connection with lunar cycles',
      'Purifies the subtle body',
    ],
    rules: [
      'Fast from sunrise to moonrise',
      'Light food or fruits only',
      'Perform Satyanarayan Katha if possible',
      'Offer water to the moon',
      'Practice meditation during moonrise',
    ],
    icon: '🌕',
    category: 'vedic',
  },
  {
    type: 'amavasya',
    name: 'Amavasya Vrat',
    deity: 'Ancestors (Pitru)',
    duration: 24,
    description: 'New moon fasting for honoring ancestors and performing Pitru Tarpan. A day of introspection.',
    benefits: [
      'Honors and pleases ancestors',
      'Removes Pitru Dosha',
      'Brings inner peace',
      'Supports deep meditation',
      'Cleanses karmic patterns',
    ],
    rules: [
      'Fast from sunrise to next sunrise',
      'Perform Tarpan for ancestors',
      'Avoid non-vegetarian food',
      'Light a diya (lamp) in the evening',
      'Practice silence and reflection',
    ],
    icon: '🌑',
    category: 'vedic',
  },
  {
    type: 'monday',
    name: 'Somvar Vrat',
    deity: 'Lord Shiva',
    duration: 16,
    description: 'Monday fasting dedicated to Lord Shiva. Especially observed during Shravan month for powerful blessings.',
    benefits: [
      'Pleases Lord Shiva',
      'Grants desired life partner',
      'Brings mental peace',
      'Improves focus and discipline',
      'Balances water element in body',
    ],
    rules: [
      'Single meal after sunset',
      'Fruits, milk, and water during the day',
      'Visit Shiva temple if possible',
      'Chant Mahamrityunjaya Mantra',
      'Offer Bilva leaves to Shiva Linga',
    ],
    icon: '🔱',
    category: 'vedic',
  },
  {
    type: 'thursday',
    name: 'Guruvar Vrat',
    deity: 'Lord Vishnu / Brihaspati',
    duration: 16,
    description: 'Thursday fasting dedicated to Lord Vishnu and Guru Brihaspati. Brings wisdom and prosperity.',
    benefits: [
      'Enhances wisdom and learning',
      'Brings financial prosperity',
      'Removes Jupiter-related doshas',
      'Strengthens guru-disciple bond',
      'Promotes righteous living',
    ],
    rules: [
      'Wear yellow clothing',
      'Eat yellow-colored foods (banana, dal)',
      'Single meal preferred',
      'Read Brihaspativar Katha',
      'Donate to Brahmins or the needy',
    ],
    icon: '📿',
    category: 'vedic',
  },
  {
    type: 'saturday',
    name: 'Shanivar Vrat',
    deity: 'Lord Hanuman / Shani Dev',
    duration: 16,
    description: 'Saturday fasting to appease Shani Dev and seek blessings of Lord Hanuman. Removes Saturn-related afflictions.',
    benefits: [
      'Reduces effects of Shani Dosha',
      'Builds resilience and patience',
      'Removes obstacles in career',
      'Grants protection from negativity',
      'Develops inner strength',
    ],
    rules: [
      'Single meal after sunset',
      'Avoid salt in some traditions',
      'Wear black or dark blue clothing',
      'Light a sesame oil lamp',
      'Recite Hanuman Chalisa',
    ],
    icon: '🪔',
    category: 'vedic',
  },
  {
    type: 'nirjala',
    name: 'Nirjala (Waterless)',
    deity: 'Various',
    duration: 24,
    description: 'The most austere form of fasting — no food or water. Typically observed on Nirjala Ekadashi by devoted practitioners.',
    benefits: [
      'Deepest level of purification',
      'Equivalent merit of all Ekadashis combined',
      'Extreme discipline and willpower',
      'Profound spiritual experience',
      'Complete digestive system detox',
    ],
    rules: [
      'No food or water for entire duration',
      'Begin and end with prayers',
      'Rest and avoid physical exertion',
      'Keep mind focused on divine',
      'Break fast carefully with water first',
    ],
    icon: '🧘',
    category: 'vedic',
  },
  {
    type: 'navratri',
    name: 'Navratri Vrat',
    deity: 'Goddess Durga',
    duration: 24,
    description: 'Nine nights of fasting during Navratri, dedicated to nine forms of Goddess Durga. One of the most powerful fasting periods.',
    benefits: [
      'Invokes divine feminine energy',
      'Deep spiritual transformation',
      'Removes negative energies',
      'Enhances devotion and faith',
      'Physical and mental purification',
    ],
    rules: [
      'Satvic food only — no onion, garlic, grains',
      'Kuttu atta, singhara, fruits permitted',
      'Daily worship of Durga',
      'Light a lamp for all nine days',
      'Observe celibacy during the period',
    ],
    icon: '🔥',
    category: 'vedic',
  },
];

interface RawFastEntry {
  date: string;
  name: string;
  type: 'ekadashi' | 'pradosh' | 'purnima' | 'amavasya' | 'monday' | 'thursday' | 'saturday' | 'nirjala' | 'navratri' | 'phalahari' | 'custom' | 'if_16_8' | 'if_18_6' | 'if_20_4' | 'if_omad' | 'if_36' | 'if_custom';
  deity: string;
  significance?: string;
}

const ALL_VEDIC_FAST_DATES_2026: RawFastEntry[] = [
  { date: '2026-01-10', name: 'Pausha Putrada Ekadashi', type: 'ekadashi', deity: 'Lord Vishnu' },
  { date: '2026-01-12', name: 'Pradosh Vrat', type: 'pradosh', deity: 'Lord Shiva' },
  { date: '2026-01-26', name: 'Shattila Ekadashi', type: 'ekadashi', deity: 'Lord Vishnu' },
  { date: '2026-01-27', name: 'Pradosh Vrat', type: 'pradosh', deity: 'Lord Shiva' },
  { date: '2026-01-28', name: 'Masik Shivaratri', type: 'nirjala', deity: 'Lord Shiva', significance: 'Monthly Shivaratri observed on the 14th day of Krishna Paksha. A sacred night to worship Lord Shiva with devotion and fasting.' },
  { date: '2026-02-09', name: 'Jaya Ekadashi', type: 'ekadashi', deity: 'Lord Vishnu' },
  { date: '2026-02-10', name: 'Pradosh Vrat', type: 'pradosh', deity: 'Lord Shiva' },
  { date: '2026-02-24', name: 'Vijaya Ekadashi', type: 'ekadashi', deity: 'Lord Vishnu' },
  { date: '2026-02-26', name: 'Pradosh Vrat', type: 'pradosh', deity: 'Lord Shiva' },
  { date: '2026-02-27', name: 'Masik Shivaratri', type: 'nirjala', deity: 'Lord Shiva', significance: 'Monthly Shivaratri observed on the 14th day of Krishna Paksha. A sacred night to worship Lord Shiva with devotion and fasting.' },
  { date: '2026-03-10', name: 'Amalaki Ekadashi', type: 'ekadashi', deity: 'Lord Vishnu' },
  { date: '2026-03-12', name: 'Pradosh Vrat', type: 'pradosh', deity: 'Lord Shiva' },
  { date: '2026-03-26', name: 'Papamochani Ekadashi', type: 'ekadashi', deity: 'Lord Vishnu' },
  { date: '2026-03-27', name: 'Pradosh Vrat', type: 'pradosh', deity: 'Lord Shiva' },
  { date: '2026-03-28', name: 'Masik Shivaratri', type: 'nirjala', deity: 'Lord Shiva', significance: 'Monthly Shivaratri observed on the 14th day of Krishna Paksha. A sacred night to worship Lord Shiva with devotion and fasting.' },
  { date: '2026-04-09', name: 'Kamada Ekadashi', type: 'ekadashi', deity: 'Lord Vishnu' },
  { date: '2026-04-11', name: 'Pradosh Vrat', type: 'pradosh', deity: 'Lord Shiva' },
  { date: '2026-04-24', name: 'Varuthini Ekadashi', type: 'ekadashi', deity: 'Lord Vishnu' },
  { date: '2026-04-26', name: 'Pradosh Vrat', type: 'pradosh', deity: 'Lord Shiva' },
  { date: '2026-04-27', name: 'Masik Shivaratri', type: 'nirjala', deity: 'Lord Shiva', significance: 'Monthly Shivaratri observed on the 14th day of Krishna Paksha. A sacred night to worship Lord Shiva with devotion and fasting.' },
  { date: '2026-05-08', name: 'Mohini Ekadashi', type: 'ekadashi', deity: 'Lord Vishnu' },
  { date: '2026-05-10', name: 'Pradosh Vrat', type: 'pradosh', deity: 'Lord Shiva' },
  { date: '2026-05-24', name: 'Apara Ekadashi', type: 'ekadashi', deity: 'Lord Vishnu' },
  { date: '2026-05-25', name: 'Pradosh Vrat', type: 'pradosh', deity: 'Lord Shiva' },
  { date: '2026-05-26', name: 'Masik Shivaratri', type: 'nirjala', deity: 'Lord Shiva', significance: 'Monthly Shivaratri observed on the 14th day of Krishna Paksha. A sacred night to worship Lord Shiva with devotion and fasting.' },
  { date: '2026-06-07', name: 'Nirjala Ekadashi', type: 'nirjala', deity: 'Lord Vishnu', significance: 'The most sacred of all Ekadashis. Observing this waterless fast is said to grant the merit of all 24 Ekadashis combined.' },
  { date: '2026-06-09', name: 'Pradosh Vrat', type: 'pradosh', deity: 'Lord Shiva' },
  { date: '2026-06-22', name: 'Yogini Ekadashi', type: 'ekadashi', deity: 'Lord Vishnu' },
  { date: '2026-06-24', name: 'Pradosh Vrat', type: 'pradosh', deity: 'Lord Shiva' },
  { date: '2026-06-25', name: 'Masik Shivaratri', type: 'nirjala', deity: 'Lord Shiva', significance: 'Monthly Shivaratri observed on the 14th day of Krishna Paksha. A sacred night to worship Lord Shiva with devotion and fasting.' },
  { date: '2026-07-07', name: 'Devshayani Ekadashi', type: 'ekadashi', deity: 'Lord Vishnu', significance: 'Marks the beginning of Chaturmas when Lord Vishnu goes to Yogic sleep. A highly auspicious Ekadashi observed with great devotion.' },
  { date: '2026-07-08', name: 'Pradosh Vrat', type: 'pradosh', deity: 'Lord Shiva' },
  { date: '2026-07-21', name: 'Kamika Ekadashi', type: 'ekadashi', deity: 'Lord Vishnu' },
  { date: '2026-07-23', name: 'Pradosh Vrat', type: 'pradosh', deity: 'Lord Shiva' },
  { date: '2026-07-24', name: 'Masik Shivaratri', type: 'nirjala', deity: 'Lord Shiva', significance: 'Monthly Shivaratri observed on the 14th day of Krishna Paksha. A sacred night to worship Lord Shiva with devotion and fasting.' },
  { date: '2026-08-05', name: 'Shravana Putrada Ekadashi', type: 'ekadashi', deity: 'Lord Vishnu', significance: 'Observed during the auspicious Shravan month. Fasting on this day is believed to bless devotees with children and family prosperity.' },
  { date: '2026-08-07', name: 'Pradosh Vrat', type: 'pradosh', deity: 'Lord Shiva' },
  { date: '2026-08-20', name: 'Aja Ekadashi', type: 'ekadashi', deity: 'Lord Vishnu' },
  { date: '2026-08-21', name: 'Pradosh Vrat', type: 'pradosh', deity: 'Lord Shiva' },
  { date: '2026-08-23', name: 'Masik Shivaratri', type: 'nirjala', deity: 'Lord Shiva', significance: 'Monthly Shivaratri observed on the 14th day of Krishna Paksha. A sacred night to worship Lord Shiva with devotion and fasting.' },
  { date: '2026-09-04', name: 'Parsva Ekadashi', type: 'ekadashi', deity: 'Lord Vishnu' },
  { date: '2026-09-05', name: 'Pradosh Vrat', type: 'pradosh', deity: 'Lord Shiva' },
  { date: '2026-09-19', name: 'Indira Ekadashi', type: 'ekadashi', deity: 'Lord Vishnu' },
  { date: '2026-09-21', name: 'Pradosh Vrat', type: 'pradosh', deity: 'Lord Shiva' },
  { date: '2026-09-22', name: 'Masik Shivaratri', type: 'nirjala', deity: 'Lord Shiva', significance: 'Monthly Shivaratri observed on the 14th day of Krishna Paksha. A sacred night to worship Lord Shiva with devotion and fasting.' },
  { date: '2026-09-22', name: 'Navratri Day 1 — Shailaputri', type: 'navratri', deity: 'Goddess Shailaputri', significance: 'First day of Shardiya Navratri. Worship Goddess Shailaputri, the daughter of the Himalayas and first form of Durga, for strength and stability.' },
  { date: '2026-09-23', name: 'Navratri Day 2 — Brahmacharini', type: 'navratri', deity: 'Goddess Brahmacharini', significance: 'Second day of Navratri dedicated to Brahmacharini, the ascetic form of Goddess Parvati. She embodies penance, devotion, and spiritual power.' },
  { date: '2026-09-24', name: 'Navratri Day 3 — Chandraghanta', type: 'navratri', deity: 'Goddess Chandraghanta', significance: 'Third day dedicated to Chandraghanta, adorned with a crescent moon on her forehead. She bestows peace, bravery, and grace.' },
  { date: '2026-09-25', name: 'Navratri Day 4 — Kushmanda', type: 'navratri', deity: 'Goddess Kushmanda', significance: 'Fourth day dedicated to Kushmanda, who created the universe with her divine smile. She is the source of all energy and cosmic power.' },
  { date: '2026-09-26', name: 'Navratri Day 5 — Skandamata', type: 'navratri', deity: 'Goddess Skandamata', significance: 'Fifth day dedicated to Skandamata, the mother of Lord Kartikeya. She blesses devotees with wisdom, power, and liberation.' },
  { date: '2026-09-27', name: 'Navratri Day 6 — Katyayani', type: 'navratri', deity: 'Goddess Katyayani', significance: 'Sixth day dedicated to Katyayani, the warrior form of Durga born to sage Katyayana. She destroys evil and fulfills desires.' },
  { date: '2026-09-28', name: 'Navratri Day 7 — Kaalratri', type: 'navratri', deity: 'Goddess Kaalratri', significance: 'Seventh day dedicated to Kaalratri, the most fierce form of Durga. She destroys all darkness, ignorance, and enemies.' },
  { date: '2026-09-29', name: 'Navratri Day 8 — Mahagauri (Ashtami)', type: 'navratri', deity: 'Goddess Mahagauri', significance: 'Eighth day (Ashtami) dedicated to Mahagauri, the pure and radiant form of Durga. Kanya Puja is performed today to honor young girls as manifestations of the goddess.' },
  { date: '2026-09-30', name: 'Navratri Day 9 — Siddhidatri (Navami)', type: 'navratri', deity: 'Goddess Siddhidatri', significance: 'Ninth and final day (Navami) dedicated to Siddhidatri, the granter of all siddhis (spiritual powers). The nine-day fast concludes today with special prayers.' },
  { date: '2026-10-02', name: 'Dussehra — Vijayadashami', type: 'navratri', deity: 'Goddess Durga / Lord Rama', significance: 'Vijayadashami celebrates the victory of good over evil — Lord Rama\'s victory over Ravana and Goddess Durga\'s victory over Mahishasura. An auspicious day for new beginnings.' },
  { date: '2026-10-03', name: 'Papankusha Ekadashi', type: 'ekadashi', deity: 'Lord Vishnu' },
  { date: '2026-10-05', name: 'Pradosh Vrat', type: 'pradosh', deity: 'Lord Shiva' },
  { date: '2026-10-18', name: 'Rama Ekadashi', type: 'ekadashi', deity: 'Lord Vishnu' },
  { date: '2026-10-20', name: 'Pradosh Vrat', type: 'pradosh', deity: 'Lord Shiva' },
  { date: '2026-10-21', name: 'Masik Shivaratri', type: 'nirjala', deity: 'Lord Shiva', significance: 'Monthly Shivaratri observed on the 14th day of Krishna Paksha. A sacred night to worship Lord Shiva with devotion and fasting.' },
  { date: '2026-11-02', name: 'Devutthana Ekadashi', type: 'ekadashi', deity: 'Lord Vishnu', significance: 'Lord Vishnu awakens from his four-month Yogic sleep on this sacred day. Marks the end of Chaturmas and the beginning of auspicious activities like marriages.' },
  { date: '2026-11-03', name: 'Pradosh Vrat', type: 'pradosh', deity: 'Lord Shiva' },
  { date: '2026-11-17', name: 'Utpanna Ekadashi', type: 'ekadashi', deity: 'Lord Vishnu', significance: 'The birth anniversary of Ekadashi Devi. Observing this fast with devotion is said to destroy all sins and grant salvation.' },
  { date: '2026-11-18', name: 'Pradosh Vrat', type: 'pradosh', deity: 'Lord Shiva' },
  { date: '2026-11-20', name: 'Masik Shivaratri', type: 'nirjala', deity: 'Lord Shiva', significance: 'Monthly Shivaratri observed on the 14th day of Krishna Paksha. A sacred night to worship Lord Shiva with devotion and fasting.' },
  { date: '2026-12-01', name: 'Mokshada Ekadashi', type: 'ekadashi', deity: 'Lord Vishnu', significance: 'One of the most sacred Ekadashis, coinciding with Gita Jayanti. Fasting on this day is said to grant liberation (moksha) to the devotee and their ancestors.' },
  { date: '2026-12-03', name: 'Pradosh Vrat', type: 'pradosh', deity: 'Lord Shiva' },
  { date: '2026-12-17', name: 'Saphala Ekadashi', type: 'ekadashi', deity: 'Lord Vishnu' },
  { date: '2026-12-18', name: 'Pradosh Vrat', type: 'pradosh', deity: 'Lord Shiva' },
  { date: '2026-12-19', name: 'Masik Shivaratri', type: 'nirjala', deity: 'Lord Shiva', significance: 'Monthly Shivaratri observed on the 14th day of Krishna Paksha. A sacred night to worship Lord Shiva with devotion and fasting.' },
  { date: '2026-12-31', name: 'Pausha Putrada Ekadashi', type: 'ekadashi', deity: 'Lord Vishnu' },
];

function buildVedicDays(): VedicFastDay[] {
  const fastTypeInfo = Object.fromEntries(FAST_TYPES.map(f => [f.type, f]));

  return ALL_VEDIC_FAST_DATES_2026.map((entry, index) => {
    const info = fastTypeInfo[entry.type];
    return {
      id: `vfd-2026-${index}`,
      date: entry.date,
      name: entry.name,
      type: entry.type,
      deity: entry.deity,
      description: info?.description ?? '',
      benefits: info?.benefits ?? [],
      rules: info?.rules ?? [],
      significance: entry.significance ?? `Sacred day dedicated to ${entry.deity}. Observing this fast with devotion brings spiritual merit and divine blessings.`,
    };
  });
}

export const UPCOMING_VEDIC_DAYS = buildVedicDays();

export function getNextUpcomingVedicDay(): ReturnType<typeof buildVedicDays>[number] | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const upcoming = UPCOMING_VEDIC_DAYS.filter(day => day.date >= todayStr);
  return upcoming.length > 0 ? upcoming[0] : null;
}

export const VEDIC_QUOTES = [
  { text: 'Fasting is the greatest remedy — the physician within.', source: 'Ayurvedic Wisdom' },
  { text: 'When the body fasts, the soul feasts.', source: 'Vedic Teaching' },
  { text: 'Control of the palate is the first step to self-mastery.', source: 'Mahabharata' },
  { text: 'Through tapas (austerity), one attains the imperishable.', source: 'Mundaka Upanishad' },
  { text: 'The wise one who controls the senses attains immortality.', source: 'Katha Upanishad' },
  { text: 'Discipline is the bridge between intention and accomplishment.', source: 'Bhagavad Gita' },
  { text: 'One who has conquered the self is the ally of the self.', source: 'Bhagavad Gita 6.6' },
  { text: 'Let food be thy medicine and fasting be thy healing.', source: 'Ancient Wisdom' },
];

export interface AutophagyStage {
  hour: number;
  title: string;
  description: string;
  icon: string;
}

export interface AutophagyBenefit {
  title: string;
  description: string;
  icon: string;
  color: string;
}

export const AUTOPHAGY_STAGES: AutophagyStage[] = [
  {
    hour: 0,
    title: 'Fed State',
    description: 'Body is digesting food. Insulin levels are elevated. Cells are in growth mode, using glucose for energy.',
    icon: '🍽️',
  },
  {
    hour: 4,
    title: 'Post-Absorptive',
    description: 'Insulin drops. Body begins transitioning from glucose to stored glycogen. Digestion slows down.',
    icon: '⏳',
  },
  {
    hour: 12,
    title: 'Early Fasting',
    description: 'Glycogen stores begin depleting. Body starts mobilizing fat for energy. Growth hormone rises.',
    icon: '🔄',
  },
  {
    hour: 16,
    title: 'Fat Burning Zone',
    description: 'Significant fat oxidation begins. Ketone production starts. Mild autophagy is triggered as cells begin recycling damaged components.',
    icon: '🔥',
  },
  {
    hour: 18,
    title: 'Autophagy Activation',
    description: 'Autophagy ramps up significantly. Cells actively break down and recycle misfolded proteins, damaged organelles, and cellular debris.',
    icon: '♻️',
  },
  {
    hour: 24,
    title: 'Deep Autophagy',
    description: 'Full autophagy mode. Cells undergo deep cleaning. Old and dysfunctional cellular components are aggressively recycled. Stem cell regeneration begins.',
    icon: '🧬',
  },
  {
    hour: 36,
    title: 'Peak Renewal',
    description: 'Autophagy at peak levels. Immune system regeneration accelerates. Growth hormone surges up to 300%. Profound cellular rejuvenation occurs.',
    icon: '✨',
  },
  {
    hour: 48,
    title: 'Immune Reset',
    description: 'Immune system undergoes significant renewal. Old immune cells are broken down and replaced with new, more efficient ones.',
    icon: '🛡️',
  },
];

export const AUTOPHAGY_BENEFITS: AutophagyBenefit[] = [
  {
    title: 'Cellular Cleanup',
    description: 'Autophagy removes damaged proteins and organelles, preventing accumulation of cellular waste that contributes to aging and disease.',
    icon: '🧹',
    color: '#2E86AB',
  },
  {
    title: 'Anti-Aging',
    description: 'By recycling old cellular components and generating new ones, autophagy slows biological aging at the cellular level. Nobel Prize-winning research confirmed this mechanism.',
    icon: '⏪',
    color: '#8B6DB5',
  },
  {
    title: 'Cancer Prevention',
    description: 'Autophagy can identify and eliminate pre-cancerous cells before they multiply. It removes damaged DNA and dysfunctional mitochondria that could lead to mutations.',
    icon: '🛡️',
    color: '#5B8C5A',
  },
  {
    title: 'Brain Health',
    description: 'Clears toxic protein aggregates (like beta-amyloid and tau) linked to Alzheimer\'s and Parkinson\'s. Promotes neuroplasticity and cognitive function.',
    icon: '🧠',
    color: '#E05A33',
  },
  {
    title: 'Immune Boost',
    description: 'Recycles old immune cells and generates fresh, more effective ones. Enhances the body\'s ability to fight infections and reduce chronic inflammation.',
    icon: '💪',
    color: '#C97B2A',
  },
  {
    title: 'Metabolic Reset',
    description: 'Improves insulin sensitivity, enhances mitochondrial function, and optimizes fat metabolism. Helps reverse metabolic syndrome markers.',
    icon: '⚡',
    color: '#1B7A6E',
  },
  {
    title: 'Heart Protection',
    description: 'Removes damaged proteins from heart muscle cells, reduces arterial plaque buildup, and decreases oxidative stress on the cardiovascular system.',
    icon: '❤️',
    color: '#C25450',
  },
  {
    title: 'Stem Cell Activation',
    description: 'Extended fasting triggers stem cell regeneration, creating entirely new cells to replace damaged tissue. This is the body\'s deepest repair mechanism.',
    icon: '🌱',
    color: '#6C4F82',
  },
];

export const IF_GUIDE_TIPS = [
  { emoji: '🕐', title: 'Start Gradual', text: 'Begin with 12:12, then progress to 16:8. Let your body adapt over 1-2 weeks before extending your fasting window.' },
  { emoji: '💧', title: 'Stay Hydrated', text: 'Drink water, black coffee, or herbal tea during fasting hours. Proper hydration reduces hunger and supports detoxification.' },
  { emoji: '🥗', title: 'Break Fast Wisely', text: 'Start with easily digestible foods — bone broth, fruits, or light salads. Avoid heavy meals immediately after long fasts.' },
  { emoji: '🏃', title: 'Light Exercise', text: 'Walking, yoga, and light stretching during fasting can enhance fat burning. Avoid high-intensity workouts until adapted.' },
  { emoji: '😴', title: 'Prioritize Sleep', text: 'Quality sleep amplifies fasting benefits. Poor sleep raises cortisol and ghrelin, making fasting harder and less effective.' },
  { emoji: '📊', title: 'Track Progress', text: 'Monitor your fasting hours, energy levels, and how you feel. Consistency matters more than perfection.' },
];

export const FAST_TYPE_COLORS: Record<string, string> = {
  ekadashi: '#C97B2A',
  pradosh: '#8B6DB5',
  purnima: '#D4A03C',
  amavasya: '#5A6B7A',
  monday: '#4A90A4',
  thursday: '#D4A03C',
  saturday: '#6B5B73',
  nirjala: '#B85C38',
  navratri: '#C25450',
  phalahari: '#5B8C5A',
  custom: '#8B7355',
  if_16_8: '#2E86AB',
  if_18_6: '#1B7A6E',
  if_20_4: '#E05A33',
  if_omad: '#8B5E3C',
  if_36: '#6C4F82',
  if_custom: '#5A7A8B',
};
