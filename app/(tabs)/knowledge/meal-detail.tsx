import React, { useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  ViewStyle, TextStyle, ImageStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Clock, Flame, Zap, Droplets, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { BREAKFAST_MEALS, getMealImage } from '@/constants/breakfastMeals';
import { FONTS, RADIUS, fs, lh } from '@/constants/theme';
import { hexAlpha } from '@/constants/colors';
import type { ColorScheme } from '@/constants/colors';

export default function MealDetailScreen() {
  const { colors } = useTheme();
  const { isProUser, presentPaywall } = useRevenueCat();
  const { id } = useLocalSearchParams<{ id: string }>();
  const meal = useMemo(() => BREAKFAST_MEALS.find(m => m.id === id), [id]);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const locked = Boolean(meal && !meal.isFree && !isProUser);

  const heroImg = meal ? getMealImage(meal.id) : null;

  const onUnlock = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void presentPaywall();
  }, [presentPaywall]);

  if (!meal) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
              <ChevronLeft size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text, flex: 1, textAlign: 'center' }]}>Meal</Text>
            <View style={{ width: 36 }} />
          </View>
          <Text style={{ color: colors.text, padding: 20, fontFamily: FONTS.bodyRegular }}>Meal not found</Text>
        </SafeAreaView>
      </>
    );
  }

  if (locked) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
              <ChevronLeft size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>Pro meal</Text>
            <View style={{ width: 36 }} />
          </View>
          <View style={[styles.lockedCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <View style={[styles.lockedIcon, { backgroundColor: hexAlpha(colors.primary, 0.1) }]}>
              <Lock size={28} color={colors.primary} />
            </View>
            <Text style={[styles.lockedTitle, { color: colors.text }]}>{meal.name}</Text>
            <Text style={[styles.lockedBody, { color: colors.textSecondary }]}>
              This break-fast meal is part of Aayu Pro. Unlock for the full guide, ingredients, and steps.
            </Text>
            <TouchableOpacity
              style={[styles.unlockBtn, { backgroundColor: colors.primary }]}
              onPress={onUnlock}
              activeOpacity={0.8}
            >
              <Text style={[styles.unlockBtnText, { color: colors.textLight }]}>Unlock with Pro</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
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
          <View
            style={[
              styles.heroWrap,
              heroImg
                ? { backgroundColor: hexAlpha(meal.accentColor, 0.14) }
                : undefined,
            ]}
          >
            {heroImg ? (
              <Image source={heroImg} style={styles.heroImage} resizeMode="cover" />
            ) : (
              <Text style={styles.heroEmoji}>{meal.emoji}</Text>
            )}
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{meal.name}</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>{meal.tagline}</Text>

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
            <View style={[styles.chip, { backgroundColor: colors.surface }]}>
              <Text style={[styles.chipText, { color: colors.textSecondary }]}>{meal.cuisine}</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.surface }]}>
              <Text style={[styles.chipText, { color: colors.textSecondary }]}>
                {meal.diet === 'veg' ? 'Vegetarian' : meal.diet === 'vegan' ? 'Vegan' : 'Non-Veg'}
              </Text>
            </View>
            {meal.fermented ? (
              <View style={[styles.chip, { backgroundColor: hexAlpha('#8b6bbf', 0.12) }]}>
                <Text style={[styles.chipText, { color: '#8b6bbf' }]}>Fermented</Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Text style={[styles.cardHeader, { color: colors.primary }]}>Why it works for breaking a fast</Text>
            <Text style={[styles.cardBody, { color: colors.textSecondary }]}>{meal.whyItWorks}</Text>
          </View>

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

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Ingredients</Text>
            {meal.ingredients.map((ing, i) => (
              <View key={i} style={styles.ingredientRow}>
                <View style={[styles.ingredientBullet, { backgroundColor: hexAlpha(meal.accentColor, 0.3) }]} />
                <Text style={[styles.ingredientText, { color: colors.textSecondary }]}>{ing}</Text>
              </View>
            ))}
          </View>

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
    heroWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
      borderRadius: 20,
      overflow: 'hidden',
      minHeight: 200,
    } as ViewStyle,
    heroImage: { width: '100%' as const, height: 220, borderRadius: 20 } as ImageStyle,
    heroEmoji: { fontSize: 72, paddingVertical: 36 } as TextStyle,
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
    lockedCard: {
      marginHorizontal: 20,
      marginTop: 24,
      padding: 24,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      alignItems: 'center',
    } as ViewStyle,
    lockedIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    } as ViewStyle,
    lockedTitle: {
      fontFamily: FONTS.displayLight,
      fontSize: fs(22),
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 10,
    } as TextStyle,
    lockedBody: {
      fontFamily: FONTS.bodyRegular,
      fontSize: fs(14),
      lineHeight: lh(14, 1.5),
      textAlign: 'center',
      marginBottom: 20,
    } as TextStyle,
    unlockBtn: {
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderRadius: RADIUS.md,
    } as ViewStyle,
    unlockBtnText: {
      fontFamily: FONTS.bodyMedium,
      fontSize: fs(15),
      fontWeight: '700',
    } as TextStyle,
  });
}
