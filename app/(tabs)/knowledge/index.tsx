import { resolveLearnHeroImage } from '@/constants/learnHeroImages';
import { fs, RADIUS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import {
  LEARN_ARTICLE_SUMMARIES,
  LEARN_IF_COMPARISON,
  LEARN_QUIZ,
  filterArticleSummaries,
} from '@/mocks/learn-registry';
import type { ArticleDifficulty, ArticleSummary, LearnSectionId } from '@/types/learn';
import { useRouter } from 'expo-router';
import {
  Activity,
  Bean,
  BookOpen,
  Brain,
  Calendar,
  ChevronRight,
  CircleDot,
  Clock,
  Dna,
  Droplets,
  HelpCircle,
  Moon,
  Search,
  Star,
  Timer,
  User,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ColorScheme } from '@/constants/colors';

const DIFFICULTY_OPTIONS: {
  key: ArticleDifficulty | 'all';
  label: string;
  dot: string;
  chipBgOff: string;
  chipBorderOff: string;
}[] = [
  { key: 'all', label: 'All', dot: '#C97B2A', chipBgOff: 'transparent', chipBorderOff: '' },
  { key: 'beginner', label: 'Beginner', dot: '#5B8C5A', chipBgOff: '#5B8C5A14', chipBorderOff: '#5B8C5A4D' },
  { key: 'intermediate', label: 'Intermediate', dot: '#D4A03C', chipBgOff: '#D4A03C18', chipBorderOff: '#D4A03C55' },
  { key: 'advanced', label: 'Advanced', dot: '#6C4F82', chipBgOff: '#6C4F8218', chipBorderOff: '#6C4F8255' },
];

const HUB_SECTION_ORDER: LearnSectionId[] = ['on_a_fast', 'hormones_longevity', 'gut_brain', 'protocols'];

const HUB_SECTION_CONFIG: Record<
  LearnSectionId,
  { title: string; Icon: LucideIcon; circle: string; iconColor: string }
> = {
  start_here: { title: 'Start here', Icon: Star, circle: '#C97B2A20', iconColor: '#C97B2A' },
  on_a_fast: { title: 'Your body on a fast', Icon: User, circle: '#2E86AB20', iconColor: '#2E86AB' },
  hormones_longevity: {
    title: 'Hormones & longevity',
    Icon: CircleDot,
    circle: '#2A9D8F20',
    iconColor: '#2A9D8F',
  },
  gut_brain: { title: 'Gut, brain & beyond', Icon: Brain, circle: '#D946A620', iconColor: '#D946A6' },
  protocols: { title: 'IF methods compared', Icon: Timer, circle: '#C97B2A20', iconColor: '#C97B2A' },
};

const HUB_ROW_ICONS: Record<string, LucideIcon> = {
  BookOpen,
  Clock,
  Droplets,
  Timer,
  Activity,
  Moon,
  Dna,
  Brain,
  Bean,
};

function difficultyLabel(d: ArticleDifficulty): string {
  return d === 'beginner' ? 'Beginner' : d === 'intermediate' ? 'Intermediate' : 'Advanced';
}

function difficultyPillStyle(d: ArticleDifficulty): { bg: string; fg: string; border: string } {
  if (d === 'beginner') return { bg: '#D8F0DC', fg: '#2F5232', border: '#5B8C5A66' };
  if (d === 'intermediate') return { bg: '#FBF0D4', fg: '#7A5214', border: '#D4A03C6E' };
  return { bg: '#EDE4F5', fg: '#4A3560', border: '#6C4F8288' };
}

function featureDifficultyBadge(d: ArticleDifficulty): { bg: string; fg: string } {
  if (d === 'beginner') return { bg: '#5B8C5A', fg: '#FFFFFF' };
  if (d === 'intermediate') return { bg: '#E8C96A', fg: '#4A3410' };
  return { bg: '#6C4F82', fg: '#FFFFFF' };
}

export default function KnowledgeScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<ArticleDifficulty | 'all'>('all');

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const filtered = useMemo(
    () => filterArticleSummaries(LEARN_ARTICLE_SUMMARIES, { query: search, difficulty }),
    [search, difficulty],
  );

  const featured = useMemo(() => filtered.filter((s) => s.featured), [filtered]);

  const bySection = useCallback(
    (sid: LearnSectionId) => filtered.filter((s) => s.sectionIds.includes(sid)),
    [filtered],
  );

  const openArticle = (id: string) => {
    router.push(`/knowledge/article/${id}` as any);
  };

  const renderArticleRow = (item: ArticleSummary) => {
    const dc = difficultyPillStyle(item.difficulty);
    const RowIcon = (item.hubIcon && HUB_ROW_ICONS[item.hubIcon]) || BookOpen;
    const tint = item.hubIconColor ?? colors.primary;
    const iconBg = item.hubIconColor ? `${item.hubIconColor}24` : colors.surface;
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
        onPress={() => openArticle(item.id)}
        activeOpacity={0.75}
      >
        <View style={[styles.listIcon, { backgroundColor: iconBg }]}>
          <RowIcon size={18} color={tint} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.listTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.listSub, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.subtitle}
          </Text>
        </View>
        <View style={[styles.levelPill, { backgroundColor: dc.bg, borderColor: dc.border }]}>
          <Text style={[styles.levelPillText, { color: dc.fg }]}>{difficultyLabel(item.difficulty)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const darkCardBg = isDark ? colors.surfaceWarm : colors.text;
  const onDarkCard = isDark ? colors.text : colors.textLight;

  const renderFeatured = ({ item }: { item: ArticleSummary }) => {
    const fb = featureDifficultyBadge(item.difficulty);
    const hero = resolveLearnHeroImage(item.heroImage);
    const fg = hero ? '#FFFFFF' : onDarkCard;
    const cardBody = (
      <>
        <View style={[styles.featureBadge, { backgroundColor: fb.bg }]}>
          <Text style={[styles.featureBadgeText, { color: fb.fg }]}>{difficultyLabel(item.difficulty)}</Text>
        </View>
        <Text style={[styles.featureTitle, { color: fg }]} numberOfLines={3}>
          {item.title}
        </Text>
        <View style={styles.featureMeta}>
          <Clock size={14} color={fg} style={{ opacity: 0.9 }} />
          <Text style={[styles.featureMetaText, { color: fg }]}>{item.readMinutes} min read</Text>
        </View>
      </>
    );
    return (
      <TouchableOpacity
        style={[styles.featureCard, hero ? styles.featureCardHero : { backgroundColor: darkCardBg }]}
        onPress={() => openArticle(item.id)}
        activeOpacity={0.85}
      >
        {hero ? (
          <ImageBackground source={hero} style={styles.featureHeroBg} imageStyle={styles.featureHeroImage}>
            <LinearGradient
              colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.88)']}
              style={styles.featureHeroGradient}
            >
              {cardBody}
            </LinearGradient>
          </ImageBackground>
        ) : (
          cardBody
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.headRow}>
            <View>
              <Text style={[styles.screenTitle, { color: colors.text }]}>Learn</Text>
              <Text style={[styles.screenSub, { color: colors.textSecondary }]}>Wisdom for body, mind & spirit.</Text>
            </View>
          </View>


          <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Search size={18} color={colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search articles, topics..."
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.text }]}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {DIFFICULTY_OPTIONS.map((opt) => {
              const on = difficulty === opt.key;
              const offBg = opt.key === 'all' ? 'transparent' : opt.chipBgOff;
              const offBorder = opt.key === 'all' ? colors.border : opt.chipBorderOff;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setDifficulty(opt.key)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: on ? colors.text : offBg,
                      borderColor: on ? colors.text : offBorder,
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  <View style={[styles.chipDot, { backgroundColor: opt.dot }]} />
                  <Text
                    style={[
                      styles.chipLabel,
                      { color: on ? colors.textLight : colors.textSecondary },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {featured.length > 0 ? (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHead}>
              <View style={styles.sectionHeadLeft}>
                <View
                  style={[
                    styles.sectionIconWrap,
                    { backgroundColor: HUB_SECTION_CONFIG.start_here.circle },
                  ]}
                >
                  <Star size={18} color={HUB_SECTION_CONFIG.start_here.iconColor} />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {HUB_SECTION_CONFIG.start_here.title}
                </Text>
              </View>
            </View>
            <FlatList
              horizontal
              data={featured}
              keyExtractor={(x) => x.id}
              renderItem={renderFeatured}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 8 }}
            />
          </View>
        ) : null}

        {HUB_SECTION_ORDER.map((sid) => {
          const items = bySection(sid);
          const cfg = HUB_SECTION_CONFIG[sid];
          const SectionIcon = cfg.Icon;
          if (sid === 'protocols') {
            return (
              <View key={sid} style={styles.sectionBlock}>
                <View style={styles.sectionHead}>
                  <View style={styles.sectionHeadLeft}>
                    <View style={[styles.sectionIconWrap, { backgroundColor: cfg.circle }]}>
                      <SectionIcon size={18} color={cfg.iconColor} />
                    </View>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{cfg.title}</Text>
                  </View>
                </View>
                {items.map((item) => renderArticleRow(item))}                
                <View style={[styles.compareCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                  <View style={styles.compareHead}>
                    <Text style={[styles.compareHeadTitle, { color: colors.text }]}>
                      Which protocol is right for you?
                    </Text>
                    {(() => {
                      const b = difficultyPillStyle('beginner');
                      return (
                        <View
                          style={[
                            styles.compareBadge,
                            { backgroundColor: b.bg, borderColor: b.border },
                          ]}
                        >
                          <Text style={[styles.compareBadgeText, { color: b.fg }]}>BEGINNER</Text>
                        </View>
                      );
                    })()}
                  </View>
                  {LEARN_IF_COMPARISON.map((row) => (
                    <View key={row.key} style={styles.compareRow}>
                      <View style={[styles.compareDot, { backgroundColor: row.dot }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.compareRowTitle, { color: colors.text }]}>{row.title}</Text>
                        <Text style={[styles.compareRowBody, { color: colors.textSecondary }]}>{row.body}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            );
          }
          if (items.length === 0) return null;
          return (
            <View key={sid} style={styles.sectionBlock}>
              <View style={styles.sectionHead}>
                <View style={styles.sectionHeadLeft}>
                  <View style={[styles.sectionIconWrap, { backgroundColor: cfg.circle }]}>
                    <SectionIcon size={18} color={cfg.iconColor} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{cfg.title}</Text>
                </View>
              </View>
              {items.map((item) => renderArticleRow(item))}
            </View>
          );
        })}

        <TouchableOpacity
          style={[styles.quizBanner, { backgroundColor: darkCardBg }]}
          onPress={() => router.push('/knowledge/quiz' as any)}
          activeOpacity={0.85}
        >
          <View style={[styles.quizIcon, { backgroundColor: '#FFFFFF22' }]}>
            <HelpCircle size={26} color={onDarkCard} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.quizTitle, { color: onDarkCard }]}>{LEARN_QUIZ.title}</Text>
            <Text style={[styles.quizSub, { color: onDarkCard, opacity: 0.9 }]}>
              {LEARN_QUIZ.questions.length} questions · ~{LEARN_QUIZ.estimatedMinutes} min
            </Text>
          </View>
          <ChevronRight size={22} color={onDarkCard} />
        </TouchableOpacity>

        <View style={{ height: 28 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    root: { flex: 1 },
    safe: { paddingHorizontal: 20, paddingBottom: 8 },
    headRow: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 14,
    },
    screenTitle: { fontSize: fs(28), fontWeight: '700' as const, letterSpacing: -0.5 },
    screenSub: { fontSize: fs(14), marginTop: 4 },
    vedicLink: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      padding: 14,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      marginBottom: 14,
    },
    vedicLinkIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    vedicLinkTitle: { fontSize: fs(15), fontWeight: '600' as const },
    vedicLinkSub: { fontSize: fs(12), marginTop: 4 },
    searchRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      marginBottom: 12,
    },
    searchInput: { flex: 1, fontSize: fs(15), padding: 0 },
    chipsRow: { flexDirection: 'row' as const, gap: 10, paddingVertical: 4 },
    chip: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: RADIUS.pill,
      borderWidth: 1,
    },
    chipDot: { width: 7, height: 7, borderRadius: 4 },
    chipLabel: { fontSize: fs(12), fontWeight: '600' as const },
    scroll: { paddingHorizontal: 20, paddingTop: 8 },
    sectionBlock: { marginBottom: 22 },
    sectionHead: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 12,
    },
    sectionHeadLeft: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 10,
      flex: 1,
    },
    sectionIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    sectionTitle: { fontSize: fs(17), fontWeight: '700' as const },
    featureCard: {
      width: 280,
      padding: 18,
      borderRadius: RADIUS.xl,
      minHeight: 140,
      justifyContent: 'space-between' as const,
      overflow: 'hidden' as const,
    },
    featureCardHero: {
      padding: 0,
      minHeight: 168,
    },
    featureHeroBg: {
      flex: 1,
      minHeight: 168,
      borderRadius: RADIUS.xl,
      overflow: 'hidden' as const,
    },
    featureHeroImage: {
      borderRadius: RADIUS.xl,
      resizeMode: 'cover' as const,
    },
    featureHeroGradient: {
      flex: 1,
      minHeight: 168,
      padding: 18,
      justifyContent: 'space-between' as const,
    },
    featureBadge: { alignSelf: 'flex-start' as const, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.pill },
    featureBadgeText: { fontSize: fs(10), fontWeight: '700' as const, letterSpacing: 0.6 },
    featureTitle: { fontSize: fs(18), fontWeight: '700' as const, lineHeight: 24, marginTop: 12 },
    featureMeta: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginTop: 12 },
    featureMetaText: { fontSize: fs(12), fontWeight: '500' as const },
    listCard: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      padding: 14,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      marginBottom: 10,
    },
    listIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    listTitle: { fontSize: fs(15), fontWeight: '600' as const },
    listSub: { fontSize: fs(12), marginTop: 4, lineHeight: 16 },
    levelPill: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: RADIUS.pill,
      borderWidth: 1,
    },
    levelPillText: { fontSize: fs(10), fontWeight: '700' as const },
    compareCard: { padding: 16, borderRadius: RADIUS.xl, borderWidth: 1 },
    compareHead: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 14 },
    compareHeadTitle: { fontSize: fs(16), fontWeight: '700' as const, flex: 1, marginRight: 12 },
    compareBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.pill, borderWidth: 1 },
    compareBadgeText: { fontSize: fs(10), fontWeight: '700' as const },
    compareRow: { flexDirection: 'row' as const, gap: 12, marginBottom: 12 },
    compareDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
    compareRowTitle: { fontSize: fs(14), fontWeight: '700' as const },
    compareRowBody: { fontSize: fs(13), lineHeight: 18, marginTop: 2 },
    quizBanner: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 14,
      padding: 18,
      borderRadius: RADIUS.xl,
      marginTop: 4,
    },
    quizIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center' as const, justifyContent: 'center' as const },
    quizTitle: { fontSize: fs(17), fontWeight: '700' as const },
    quizSub: { fontSize: fs(13), marginTop: 6 },
  });
}
