import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { Clock, Lock } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, RADIUS, fs, lh } from '@/constants/theme';
import { hexAlpha } from '@/constants/colors';
import { getMealImage, type BreakfastMeal } from '@/constants/breakfastMeals';
import type { ColorScheme } from '@/constants/colors';

interface Props {
  meal: BreakfastMeal;
  onPress: () => void;
  isLocked: boolean;
}

const THUMB = 56;

export default function MealCard({ meal, onPress, isLocked }: Props) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const img = getMealImage(meal.id);

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: colors.borderLight }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.thumbWrap, { backgroundColor: colors.surface }]}>
        {img ? (
          <Image source={img} style={styles.thumbImg} resizeMode="cover" accessibilityLabel="" />
        ) : (
          <Text style={styles.emoji}>{meal.emoji}</Text>
        )}
      </View>

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
          <Text style={[styles.cuisineText, { color: colors.textMuted }]} numberOfLines={1}>
            {meal.cuisine}
          </Text>
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
    thumbWrap: {
      width: THUMB,
      height: THUMB,
      borderRadius: 14,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    thumbImg: {
      width: THUMB,
      height: THUMB,
    } as ImageStyle,
    emoji: { fontSize: 26 } as TextStyle,
    content: { flex: 1, minWidth: 0 } as ViewStyle,
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 } as ViewStyle,
    name: { fontFamily: FONTS.bodyMedium, fontSize: fs(15), fontWeight: '600', flex: 1 } as TextStyle,
    lockBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 } as ViewStyle,
    lockText: { fontFamily: FONTS.bodyMedium, fontSize: fs(8), fontWeight: '800', letterSpacing: 0.5 } as TextStyle,
    tagline: { fontFamily: FONTS.bodyRegular, fontSize: fs(12), lineHeight: lh(12, 1.3), marginBottom: 6 } as TextStyle,
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' } as ViewStyle,
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 } as ViewStyle,
    metaText: { fontFamily: FONTS.bodyRegular, fontSize: fs(11) } as TextStyle,
    cuisineText: { fontFamily: FONTS.bodyRegular, fontSize: fs(11), flexShrink: 1 } as TextStyle,
    bestAfterBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 } as ViewStyle,
    bestAfterText: { fontFamily: FONTS.bodyMedium, fontSize: fs(10), fontWeight: '600' } as TextStyle,
  });
}
