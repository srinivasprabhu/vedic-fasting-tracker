import { useScrollToTop } from '@react-navigation/native';
import React, { useState, useCallback, useMemo, useRef } from 'react';
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
import {
  BREAKFAST_MEALS,
  DIET_FILTERS,
  type DietFilterKey,
} from '@/constants/breakfastMeals';
import MealCard from '@/components/meals/MealCard';
import { FONTS, fs, lh } from '@/constants/theme';
import { hexAlpha } from '@/constants/colors';
import type { ColorScheme } from '@/constants/colors';

export default function MealsListScreen() {
  const { colors } = useTheme();
  const { isProUser, presentPaywall } = useRevenueCat();
  const [activeDiet, setActiveDiet] = useState<DietFilterKey>('all');
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const listScrollRef = useRef<ScrollView>(null);
  useScrollToTop(listScrollRef);

  const filteredMeals = useMemo(() => {
    return BREAKFAST_MEALS.filter(m => {
      if (activeDiet === 'fermented') {
        if (!m.fermented) return false;
      } else if (activeDiet !== 'all') {
        if (m.diet !== activeDiet) return false;
      }
      return true;
    });
  }, [activeDiet]);

  const handleMealPress = useCallback((mealId: string, isFree: boolean) => {
    if (!isFree && !isProUser) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      void presentPaywall();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/(tabs)/(home)/meal-detail', params: { id: mealId } } as any);
  }, [isProUser, presentPaywall]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
            <ChevronLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Break-fast meals</Text>
            <Text style={styles.headerSub}>Curated meals to ease your body out of fasting</Text>
            {/* <Text style={styles.headerSubLine2}>Free & Pro options available</Text> */}
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {DIET_FILTERS.map(f => {
            const isActive = activeDiet === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, isActive && { backgroundColor: colors.text }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveDiet(f.key);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterLabel, { color: isActive ? colors.background : colors.textSecondary }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          ref={listScrollRef}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
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
              teaserPro={!isProUser && !meal.isFree}
              onPress={() => handleMealPress(meal.id, meal.isFree)}
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
    headerSub: { fontFamily: FONTS.bodyRegular, fontSize: fs(13), color: colors.textMuted, marginTop: 2, lineHeight: lh(13, 1.35) } as TextStyle,
    headerSubLine2: { fontFamily: FONTS.bodyRegular, fontSize: fs(13), color: colors.textMuted, marginTop: 4, lineHeight: lh(13, 1.35) } as TextStyle,
    filterScroll: { maxHeight: 44 } as ViewStyle,
    filterRow: { paddingHorizontal: 20, gap: 8, paddingVertical: 6 } as ViewStyle,
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 10,
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
