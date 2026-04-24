import { fs } from '@/constants/theme';
import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  FlatList,
  ViewStyle,
  TextStyle,
  StatusBar,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { syncOnSignIn } from '@/lib/sync';
import { AayuMandala } from '@/components/onboarding/AayuMandala';
import { OnboardingSlide } from '@/components/onboarding/OnboardingSlide';
import { AuthButtons } from '@/components/onboarding/AuthButtons';
import type { OnboardingSlideData } from '@/components/onboarding/types';
import { Flame, Sparkles, ArrowRight, Shield } from 'lucide-react-native';
import { ONBOARDING_COMPLETE_KEY, PROFILE_STORAGE_KEY } from '@/constants/storageKeys';
import type { ColorScheme } from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';

const { width: W, height: H } = Dimensions.get('window');

function buildOnboardingSlides(colors: ColorScheme, isDark: boolean): OnboardingSlideData[] {
  const iconBgPrimary = isDark ? `${colors.primary}1F` : `${colors.primary}24`;
  const iconBgStreak = isDark ? `${colors.streakAccent}1F` : `${colors.streakAccent}24`;

  return [
    {
      id: 'brand',
      tag: 'SMART FASTING · REAL RESULTS',
      title: 'Welcome to',
      titleAccent: 'Aayu',
      body: 'Your personal fasting companion — track, learn, and transform your health with science-backed intermittent fasting.',
      icon: '✦',
      bgColors: isDark
        ? ([colors.surfaceWarm, colors.surface, colors.background] as const)
        : ([colors.background, colors.surface, colors.surfaceWarm] as const),
      accentColor: colors.primary,
      iconBg: iconBgPrimary,
    },
    {
      id: 'tracking',
      tag: 'EFFORTLESS TRACKING',
      title: 'Track Your',
      titleAccent: 'Fasts',
      body: 'Start a fast with one tap. Track your preferred protocol — 16:8, 18:6, OMAD, or custom. Watch streaks grow and unlock metabolic insights along the way.',
      icon: '',
      iconComponent: <Flame size={56} color={colors.streakAccent} strokeWidth={1.5} />,
      bgColors: isDark
        ? ([colors.surfaceWarm, colors.surface, colors.background] as const)
        : ([colors.surfaceWarm, colors.surface, colors.background] as const),
      accentColor: colors.streakAccent,
      iconBg: iconBgStreak,
    },
    {
      id: 'privacy',
      tag: 'YOUR DATA STAYS YOURS',
      title: 'Privacy by',
      titleAccent: 'Design',
      body: 'Your health data stays on your device. We never sell or share your information. Sign in only to sync across devices — or start as a guest.',
      icon: '',
      iconComponent: <Shield size={56} color={colors.primary} strokeWidth={1.5} />,
      bgColors: isDark
        ? ([colors.background, colors.surface, colors.surfaceWarm] as const)
        : ([colors.background, colors.surface, colors.surfaceWarm] as const),
      accentColor: colors.primary,
      iconBg: iconBgPrimary,
    },
  ];
}

export default function OnboardingScreen() {
  const { colors, isDark } = useTheme();
  const slides = useMemo(() => buildOnboardingSlides(colors, isDark), [colors, isDark]);
  const insets = useSafeAreaInsets();
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const [authLoading, setAuthLoading] = useState<'google' | 'apple' | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;
  const iconScale = useRef(new Animated.Value(0.7)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;

  const isLastSlide = activeIndex === slides.length - 1;
  const isBrandSlide = activeIndex === 0;

  const animateSlideIn = useCallback(() => {
    contentOpacity.setValue(0);
    contentSlide.setValue(24);
    iconScale.setValue(0.75);
    iconOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 500,
        delay: 80,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: 1,
        delay: 80,
        speed: 12,
        bounciness: 8,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 550,
        delay: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(contentSlide, {
        toValue: 0,
        duration: 550,
        delay: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentOpacity, contentSlide, iconScale, iconOpacity]);

  useEffect(() => {
    animateSlideIn();
  }, [activeIndex, animateSlideIn]);

  const goToNext = useCallback(() => {
    if (activeIndex < slides.length - 1) {
      const next = activeIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIndex(next);
    }
  }, [activeIndex, slides.length]);

  const handleSkip = useCallback(() => {
    const last = slides.length - 1;
    flatListRef.current?.scrollToIndex({ index: last, animated: true });
    setActiveIndex(last);
  }, [slides.length]);

  /** After sign-in: sync profile from Supabase, then go to tabs if profile exists, else profile-setup. */
  const completeOnboardingAfterSignIn = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (userId) {
        await syncOnSignIn(userId);
        const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        const profile = stored ? JSON.parse(stored) : null;
        const hasProfile = profile?.name && String(profile.name).trim().length > 0;
        await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
        if (hasProfile) {
          router.replace('/(tabs)/(home)' as any);
          return;
        }
      }
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      router.replace('/profile-setup' as any);
    } catch (e) {
      console.log('Failed to complete onboarding after sign-in:', e);
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      router.replace('/profile-setup' as any);
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      router.replace('/profile-setup' as any);
    } catch (e) {
      console.log('Failed to save onboarding state:', e);
      router.replace('/profile-setup' as any);
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthLoading('google');
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        Alert.alert(
          'Sign In',
          error.message || 'Could not sign in with Google. You can continue as guest.',
          [{ text: 'OK' }]
        );
        return;
      }
      await completeOnboardingAfterSignIn();
    } catch (e) {
      console.error(e);
      Alert.alert('Sign In', 'Something went wrong. You can continue as guest.');
    } finally {
      setAuthLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    setAuthLoading('apple');
    try {
      const { error } = await signInWithApple();
      if (error) {
        Alert.alert(
          'Sign In',
          error.message || 'Could not sign in with Apple. You can continue as guest.',
          [{ text: 'OK' }]
        );
        return;
      }
      await completeOnboardingAfterSignIn();
    } catch (e) {
      console.error(e);
      Alert.alert('Sign In', 'Something went wrong. You can continue as guest.');
    } finally {
      setAuthLoading(null);
    }
  };

  const currentSlide = slides[activeIndex];
  const slideA11yLabel = `${currentSlide.tag}. ${currentSlide.title} ${currentSlide.titleAccent ?? ''}. ${currentSlide.body}`;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />

      <LinearGradient
        colors={currentSlide.bgColors as [string, string, string]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />

      <Animated.View
        style={[
          styles.ambientGlow,
          { backgroundColor: currentSlide.accentColor },
        ]}
      />

      <View style={[styles.brandHeader, { paddingTop: insets.top + 12 }]}>
        <AayuMandala
          size={28}
          color={currentSlide.accentColor}
          animated={isBrandSlide}
        />
        <Text style={[styles.brandName, { color: currentSlide.accentColor }]}>
          Aayu
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: W,
          offset: W * index,
          index,
        })}
        renderItem={({ item, index }) => (
          <OnboardingSlide
            slide={item}
            isActive={index === activeIndex}
            isBrandSlide={index === 0}
            iconOpacity={iconOpacity}
            iconScale={iconScale}
          />
        )}
        style={styles.pager}
      />

      <Animated.View
        style={[
          styles.textBlock,
          {
            paddingBottom: insets.bottom + (isLastSlide ? 260 : 100),
            opacity: contentOpacity,
            transform: [{ translateY: contentSlide }],
          },
        ]}
        pointerEvents="none"
        accessible
        accessibilityRole="summary"
        accessibilityLabel={slideA11yLabel}
        accessibilityLiveRegion="polite"
      >
        <Text style={[styles.tag, { color: currentSlide.accentColor }]}>
          {currentSlide.tag}
        </Text>

        <Text style={[styles.title, { color: colors.text }]}>
          {currentSlide.title}{' '}
          {currentSlide.titleAccent && (
            <Text style={[styles.titleAccent, { color: currentSlide.accentColor }]}>
              {currentSlide.titleAccent}
            </Text>
          )}
        </Text>

        <Text style={[styles.body, { color: colors.textSecondary }]}>{currentSlide.body}</Text>
      </Animated.View>

      <View style={[styles.dotsRow, { bottom: insets.bottom + (isLastSlide ? 255 : 92) }]}>
        {slides.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              flatListRef.current?.scrollToIndex({ index: i, animated: true });
              setActiveIndex(i);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Go to slide ${i + 1} of ${slides.length}`}
            accessibilityState={{ selected: i === activeIndex }}
            hitSlop={{ top: 14, bottom: 14, left: 8, right: 8 }}
          >
            <Animated.View
              style={[
                styles.dot,
                i === activeIndex
                  ? [styles.dotActive, { backgroundColor: currentSlide.accentColor }]
                  : [
                      styles.dotInactive,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255,255,255,0.22)'
                          : 'rgba(44,24,16,0.22)',
                      },
                    ],
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {!isLastSlide ? (
        <View style={[styles.navRow, { bottom: insets.bottom + 32 }]}>
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipBtn}
            accessibilityRole="button"
            accessibilityLabel="Skip introduction"
            accessibilityHint="Jumps to sign-in on the last slide"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 12 }}
          >
            <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goToNext}
            style={[styles.nextBtn, { backgroundColor: currentSlide.accentColor }]}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Next slide"
            accessibilityHint={`Slide ${activeIndex + 1} of ${slides.length}`}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <ArrowRight size={22} color={colors.textLight} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.authWrap, { paddingBottom: insets.bottom + 24, marginTop: 20 }]}>
          <AuthButtons
            onGoogleSignIn={handleGoogleSignIn}
            onAppleSignIn={handleAppleSignIn}
            onContinueAsGuest={completeOnboarding}
            googleLoading={authLoading === 'google'}
            appleLoading={authLoading === 'apple'}
            accentColor={currentSlide.accentColor}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  } as ViewStyle,

  ambientGlow: {
    position: 'absolute',
    top: H * 0.1,
    left: W * 0.1,
    right: W * 0.1,
    height: H * 0.4,
    borderRadius: H * 0.2,
    opacity: 0.06,
  } as ViewStyle,

  brandHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 8,
  } as ViewStyle,

  brandName: {
    fontSize: fs(20),
    letterSpacing: 2,
    fontWeight: '300',
  } as TextStyle,

  pager: {
    flex: 1,
  } as ViewStyle,

  textBlock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
  } as ViewStyle,

  tag: {
    fontSize: fs(12),
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  } as TextStyle,

  title: {
    fontSize: fs(46),
    fontWeight: '300',
    lineHeight: 52,
    marginBottom: 16,
    letterSpacing: 0.3,
  } as TextStyle,

  titleAccent: {
    fontSize: fs(46),
    fontWeight: '300',
    lineHeight: 52,
  } as TextStyle,

  body: {
    fontSize: fs(17),
    lineHeight: 26,
  } as TextStyle,

  dotsRow: {
    position: 'absolute',
    left: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,

  dot: {
    height: 4,
    borderRadius: 2,
  } as ViewStyle,

  dotActive: {
    width: 24,
  } as ViewStyle,

  dotInactive: {
    width: 6,
  } as ViewStyle,

  navRow: {
    position: 'absolute',
    left: 28,
    right: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,

  skipBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 12,
    paddingRight: 16,
  } as ViewStyle,

  skipText: {
    fontSize: fs(15),
  } as TextStyle,

  nextBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: Platform.OS === 'android' ? 4 : 8,
  } as ViewStyle,

  authWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  } as ViewStyle,
});
