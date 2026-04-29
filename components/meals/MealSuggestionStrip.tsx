import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, RADIUS, fs } from '@/constants/theme';
import { BREAKFAST_MEALS } from '@/constants/breakfastMeals';

interface Props {
  /** Current fast duration in hours when fasting; 0 when not fasting (drives daily rotation). */
  fastDurationHours: number;
  /** Mid-fast copy vs idle copy. */
  isFasting: boolean;
}

const stripStyles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginTop: 12,
    marginBottom: 8,
  } as ViewStyle,
  emoji: { fontSize: 22 } as TextStyle,
  textCol: { flex: 1, minWidth: 0 } as ViewStyle,
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

export default function MealSuggestionStrip({ fastDurationHours, isFasting }: Props) {
  const { colors } = useTheme();

  const meal = useMemo(() => {
    if (fastDurationHours >= 24) {
      return BREAKFAST_MEALS.find(m => m.id === 'bone-broth-starter') ?? BREAKFAST_MEALS[0];
    }
    const freeMeals = BREAKFAST_MEALS.filter(m => m.isFree);
    const dayIndex = new Date().getDate() % freeMeals.length;
    return freeMeals[dayIndex];
  }, [fastDurationHours]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/(home)/meals' as any);
  };

  const label = isFasting ? 'Plan your break-fast' : 'Break-fast idea';

  return (
    <TouchableOpacity
      style={[stripStyles.strip, { borderColor: colors.borderLight, backgroundColor: colors.card }]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      <Text style={stripStyles.emoji}>{meal.emoji}</Text>
      <View style={stripStyles.textCol}>
        <Text style={[stripStyles.label, { color: colors.primary }]}>{label}</Text>
        <Text style={[stripStyles.name, { color: colors.text }]} numberOfLines={1}>
          {meal.name}
          <Text style={[stripStyles.meta, { color: colors.textMuted }]}>  ·  {meal.prepMinutes} min</Text>
        </Text>
      </View>
      <ChevronRight size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}
