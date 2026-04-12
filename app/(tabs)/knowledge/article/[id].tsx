import { resolveLearnHeroImage } from '@/constants/learnHeroImages';
import { fs, RADIUS } from '@/constants/theme';
import { ArticleRenderer } from '@/components/learn/ArticleRenderer';
import { useTheme } from '@/contexts/ThemeContext';
import { getArticleById, getRelatedArticles } from '@/mocks/learn-registry';
import type { ArticleDifficulty } from '@/types/learn';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  BookOpen,
  ChevronRight,
  Clock,
  FlaskConical,
  Share2,
  Sparkles,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ColorScheme } from '@/constants/colors';

const DIFFICULTY_LABEL: Record<ArticleDifficulty, string> = {
  beginner: 'BEGINNER',
  intermediate: 'INTERMEDIATE',
  advanced: 'ADVANCED',
};

const DIFFICULTY_STYLE: Record<ArticleDifficulty, { bg: string; fg: string; border: string }> = {
  beginner: { bg: '#D8F0DC', fg: '#2F5232', border: '#5B8C5A66' },
  intermediate: { bg: '#FBF0D4', fg: '#7A5214', border: '#D4A03C6E' },
  advanced: { bg: '#EDE4F5', fg: '#4A3560', border: '#6C4F8288' },
};

export default function LearnArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const article = typeof id === 'string' ? getArticleById(id) : undefined;
  const related = article ? getRelatedArticles(article) : [];

  if (!article) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <Stack.Screen options={{ title: 'Article' }} />
        <Text style={[styles.miss, { color: colors.text }]}>Article not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: colors.primary }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const diff = DIFFICULTY_STYLE[article.difficulty];
  const heroBg = isDark ? colors.surfaceWarm : colors.text;
  const heroFgSolid = isDark ? colors.text : colors.textLight;
  const heroImage = resolveLearnHeroImage(article.heroImage);
  const heroFg = heroImage ? '#FFFFFF' : heroFgSolid;

  const heroInner = (
    <>
      <View style={styles.heroTop}>
        <TouchableOpacity
          style={[styles.iconCircle, { backgroundColor: '#FFFFFF22' }]}
          onPress={() => router.back()}
          accessibilityLabel="Back"
        >
          <Text style={{ color: heroFg, fontSize: 22, fontWeight: '600' as const }}>‹</Text>
        </TouchableOpacity>
        <View style={styles.heroTopRight}>
          <TouchableOpacity style={[styles.iconCircle, { backgroundColor: '#FFFFFF22' }]} accessibilityLabel="Share">
            <Share2 size={18} color={heroFg} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconCircle, { backgroundColor: '#FFFFFF22' }]} accessibilityLabel="Save">
            <Sparkles size={18} color={heroFg} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.tagRow}>
        {article.topicTag ? (
          <View style={[styles.tag, { backgroundColor: '#FFFFFF22' }]}>
            <Text style={[styles.tagText, { color: heroImage ? '#FFE8CC' : colors.primary }]}>{article.topicTag}</Text>
          </View>
        ) : null}
        <View style={[styles.tag, { backgroundColor: diff.bg, borderWidth: 1, borderColor: diff.border }]}>
          <Text style={[styles.tagText, { color: diff.fg }]}>{DIFFICULTY_LABEL[article.difficulty]}</Text>
        </View>
      </View>
      <Text style={[styles.title, { color: heroFg }]}>{article.title}</Text>
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Clock size={14} color={heroFg} style={{ opacity: 0.85 }} />
          <Text style={[styles.metaText, { color: heroFg }]}>{article.readMinutes} min read</Text>
        </View>
        {article.badges?.includes('Science-backed') ? (
          <View style={styles.metaItem}>
            <FlaskConical size={14} color={heroFg} style={{ opacity: 0.85 }} />
            <Text style={[styles.metaText, { color: heroFg }]}>Science-backed</Text>
          </View>
        ) : null}
        {article.updatedYear ? (
          <Text style={[styles.metaText, { color: heroFg, opacity: 0.85 }]}>Updated {article.updatedYear}</Text>
        ) : null}
      </View>
    </>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      {heroImage ? (
        <ImageBackground source={heroImage} style={styles.heroImageWrap} imageStyle={styles.heroImage}>
          <LinearGradient
            colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.88)']}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView edges={['top']} style={styles.heroSafeImage}>
            {heroInner}
          </SafeAreaView>
        </ImageBackground>
      ) : (
        <SafeAreaView edges={['top']} style={[styles.heroSafe, { backgroundColor: heroBg }]}>
          {heroInner}
        </SafeAreaView>
      )}

      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.scrollContent,
          isDark && {
            backgroundColor: colors.card,
            marginHorizontal: 16,
            marginTop: 12,
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 32,
            borderRadius: RADIUS.xl,
            borderWidth: 1,
            borderColor: colors.borderLight,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ArticleRenderer blocks={article.blocks} colors={colors} isDark={isDark} />

        {related.length > 0 ? (
          <View style={styles.readNext}>
            <Text style={[styles.readNextTitle, { color: colors.text }]}>Read next</Text>
            {related.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[
                  styles.readCard,
                  {
                    backgroundColor: isDark ? colors.surface : colors.card,
                    borderColor: colors.borderLight,
                  },
                ]}
                onPress={() => router.push(`/knowledge/article/${r.id}` as any)}
                activeOpacity={0.75}
              >
                <View style={[styles.readIcon, { backgroundColor: colors.surface }]}>
                  <BookOpen size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.readCardTitle, { color: colors.text }]} numberOfLines={2}>
                    {r.title}
                  </Text>
                  <Text style={[styles.readCardMeta, { color: colors.textMuted }]}>
                    {DIFFICULTY_LABEL[r.difficulty]} · {r.readMinutes} min read
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    root: { flex: 1 },
    safe: { flex: 1, padding: 20 },
    miss: { fontSize: fs(16), textAlign: 'center' as const, marginTop: 40 },
    backBtn: { marginTop: 16, alignSelf: 'center' as const },
    heroImageWrap: {
      width: '100%' as const,
      minHeight: 260,
    },
    heroImage: {
      resizeMode: 'cover' as const,
    },
    heroSafeImage: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    heroSafe: { paddingHorizontal: 20, paddingBottom: 20 },
    heroTop: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 16,
    },
    heroTopRight: { flexDirection: 'row' as const, gap: 10 },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    tagRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, marginBottom: 12 },
    tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.pill },
    tagText: { fontSize: fs(10), fontWeight: '700' as const, letterSpacing: 0.6 },
    title: { fontSize: fs(26), fontWeight: '700' as const, lineHeight: 32, letterSpacing: -0.5 },
    metaRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 14, marginTop: 14, alignItems: 'center' as const },
    metaItem: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
    metaText: { fontSize: fs(12), fontWeight: '500' as const },
    scroll: { flex: 1 },
    scrollContent: { padding: 20, paddingTop: 20 },
    readNext: { marginTop: 28, gap: 12 },
    readNextTitle: { fontSize: fs(18), fontWeight: '700' as const, marginBottom: 4 },
    readCard: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      padding: 14,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
    },
    readIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    readCardTitle: { fontSize: fs(15), fontWeight: '600' as const },
    readCardMeta: { fontSize: fs(12), marginTop: 4 },
  } as const);
}
