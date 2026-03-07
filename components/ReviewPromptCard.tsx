import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Star, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  onReview: () => void;
  onDismiss: () => void;
}

export default function ReviewPromptCard({ onReview, onDismiss }: Props) {
  const { colors, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const cardBg = isDark ? '#1A1206' : '#FFFBF0';
  const cardBorder = isDark ? '#3D2A10' : '#E8D5B8';
  const starColor = '#D4A03C';
  const btnBg = isDark ? '#C97B2A' : '#C97B2A';

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity style={styles.dismiss} onPress={onDismiss} hitSlop={12}>
        <X size={16} color={colors.textMuted} />
      </TouchableOpacity>

      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={20} color={starColor} fill={starColor} />
        ))}
      </View>

      <Text style={[styles.title, { color: colors.text }]}>Enjoying Aayu?</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        Your feedback helps others discover fasting too. It only takes a moment.
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: btnBg }]}
          onPress={onReview}
          activeOpacity={0.8}
        >
          <Star size={14} color="#FFF" fill="#FFF" />
          <Text style={styles.btnText}>Rate Us</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDismiss} activeOpacity={0.7}>
          <Text style={[styles.laterText, { color: colors.textMuted }]}>Maybe Later</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  dismiss: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  btnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  laterText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
