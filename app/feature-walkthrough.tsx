import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing,
  StatusBar, ViewStyle, TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, fs } from '@/constants/theme';
import { WALKTHROUGH_COMPLETE_KEY } from '@/constants/storageKeys';
import { hexAlpha } from '@/constants/colors';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import SlideHowAayuWorks from '@/components/walkthrough/SlideHowAayuWorks';
import SlideMetabolicZones from '@/components/walkthrough/SlideMetabolicZones';
import SlideMetabolicScore from '@/components/walkthrough/SlideMetabolicScore';
import SlideProFeatures from '@/components/walkthrough/SlideProFeatures';
import type { ColorScheme } from '@/constants/colors';

const TOTAL_SLIDES = 4;

export default function FeatureWalkthroughScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const reduceMotion = useReducedMotion();
  const [slide, setSlide] = useState(1);

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(20)).current;

  const animateIn = useCallback(() => {
    if (reduceMotion) {
      contentOpacity.setValue(1);
      contentSlide.setValue(0);
      return;
    }
    contentOpacity.setValue(0);
    contentSlide.setValue(20);
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1, duration: 450, delay: 80,
        easing: Easing.out(Easing.ease), useNativeDriver: true,
      }),
      Animated.timing(contentSlide, {
        toValue: 0, duration: 450, delay: 80,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();
  }, [reduceMotion, contentOpacity, contentSlide]);

  useEffect(() => {
    animateIn();
  }, [slide, animateIn]);

  const handleComplete = useCallback(async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem(WALKTHROUGH_COMPLETE_KEY, 'true');
    router.replace('/(tabs)/(home)' as any);
  }, []);

  const handleNext = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (slide < TOTAL_SLIDES) {
      setSlide(s => s + 1);
    } else {
      void handleComplete();
    }
  }, [slide, handleComplete]);

  const handleBack = useCallback(() => {
    if (slide > 1) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSlide(s => s - 1);
    }
  }, [slide]);

  const handleSkip = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem(WALKTHROUGH_COMPLETE_KEY, 'true');
    router.replace('/(tabs)/(home)' as any);
  }, []);

  const isLastSlide = slide === TOTAL_SLIDES;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />

      <LinearGradient
        colors={isDark
          ? [colors.background, colors.surface, colors.background]
          : [colors.background, colors.surface, colors.background]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />

      <View style={[styles.progressRow, { paddingTop: insets.top + 12 }]}>
        {Array.from({ length: TOTAL_SLIDES }, (_, i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              {
                backgroundColor: i < slide
                  ? colors.text
                  : hexAlpha(colors.text, 0.12),
              },
            ]}
          />
        ))}
      </View>

      <Animated.View style={[
        styles.content,
        { opacity: contentOpacity, transform: [{ translateY: contentSlide }] },
      ]}>
        {slide === 1 && <SlideHowAayuWorks />}
        {slide === 2 && <SlideMetabolicZones />}
        {slide === 3 && <SlideMetabolicScore />}
        {slide === 4 && <SlideProFeatures />}
      </Animated.View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        {slide > 1 ? (
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.surface }]}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
            <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextBtn, {
            backgroundColor: isDark ? colors.text : '#1a0d04',
          }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={[styles.nextLabel, {
            color: isDark ? colors.background : '#fff',
          }]}>
            {isLastSlide ? 'Done' : 'Next'}
          </Text>
          {isLastSlide
            ? <Check size={18} color={isDark ? colors.background : '#fff'} />
            : <ArrowRight size={18} color={isDark ? colors.background : '#fff'} />
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background } as ViewStyle,
    progressRow: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      gap: 6,
      marginBottom: 8,
    } as ViewStyle,
    progressSegment: {
      flex: 1,
      height: 3,
      borderRadius: 1.5,
    } as ViewStyle,
    content: {
      flex: 1,
      paddingHorizontal: 24,
    } as ViewStyle,
    bottomBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: 12,
    } as ViewStyle,
    backBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    skipText: {
      fontFamily: FONTS.bodyRegular,
      fontSize: fs(14),
    } as TextStyle,
    nextBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderRadius: 16,
    } as ViewStyle,
    nextLabel: {
      fontFamily: FONTS.bodyMedium,
      fontSize: fs(16),
      fontWeight: '600',
    } as TextStyle,
  });
}
