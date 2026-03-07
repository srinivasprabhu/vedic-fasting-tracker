import React, { useRef, useState, useCallback, useEffect } from 'react';
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
import { COLORS } from '@/constants/theme';

const ONBOARDING_KEY = 'vedic_onboarding_complete';
const PROFILE_KEY = 'vedic_user_profile';

const { width: W, height: H } = Dimensions.get('window');

const SLIDES: OnboardingSlideData[] = [
  {
    id: 'brand',
    tag: 'SMART FASTING · REAL RESULTS',
    title: 'Welcome to',
    titleAccent: 'Aayu',
    body: 'Your personal fasting companion — track, learn, and transform your health with science-backed intermittent fasting.',
    icon: '✦',
    bgColors: ['#1a0d04', '#0e0703', '#070402'],
    accentColor: '#c8872a',
    iconBg: 'rgba(200,135,42,0.12)',
  },
  {
    id: 'tracking',
    tag: 'EFFORTLESS TRACKING',
    title: 'Track Your',
    titleAccent: 'Fasts',
    body: 'Start a fast with one tap. Track 16:8, 18:6, 20:4, OMAD, or custom durations. Your body, your rhythm.',
    icon: '🔥',
    bgColors: ['#1f0d02', '#130802', '#0a0501'],
    accentColor: '#e07b30',
    iconBg: 'rgba(224,123,48,0.12)',
  },
  {
    id: 'progress',
    tag: 'INSIGHTS THAT INSPIRE',
    title: 'See Your',
    titleAccent: 'Progress',
    body: 'Watch your fasting patterns come alive — streaks, autophagy tracking, metabolic insights, and milestones unlocked.',
    icon: '🌿',
    bgColors: ['#041208', '#020d05', '#010803'],
    accentColor: '#3aaa6e',
    iconBg: 'rgba(58,170,110,0.12)',
  },
  {
    id: 'vedic',
    tag: 'ANCIENT WISDOM · OPTIONAL',
    title: 'Vedic',
    titleAccent: 'Tradition',
    body: 'Explore the Vedic fasting calendar — Ekadashi, Pradosh Vrat, and more. Follow thousands of years of tradition, if you choose.',
    icon: '🌙',
    bgColors: ['#050f18', '#030b12', '#02070d'],
    accentColor: '#5b8dd9',
    iconBg: 'rgba(91,141,217,0.12)',
  },
  {
    id: 'begin',
    tag: 'YOUR JOURNEY STARTS NOW',
    title: 'Begin Your',
    titleAccent: 'Path',
    body: 'Set your fasting path — intermittent, Vedic, or both. We\'ll personalise your experience from there.',
    icon: '✨',
    bgColors: ['#0e0905', '#0a0703', '#070502'],
    accentColor: '#c8872a',
    iconBg: 'rgba(200,135,42,0.1)',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const [authLoading, setAuthLoading] = useState<'google' | 'apple' | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;
  const iconScale = useRef(new Animated.Value(0.7)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;

  const isLastSlide = activeIndex === SLIDES.length - 1;
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
    if (activeIndex < SLIDES.length - 1) {
      const next = activeIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIndex(next);
    }
  }, [activeIndex]);

  const handleSkip = useCallback(() => {
    const last = SLIDES.length - 1;
    flatListRef.current?.scrollToIndex({ index: last, animated: true });
    setActiveIndex(last);
  }, []);

  /** After sign-in: sync profile from Supabase, then go to tabs if profile exists, else profile-setup. */
  const completeOnboardingAfterSignIn = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (userId) {
        await syncOnSignIn(userId);
        const stored = await AsyncStorage.getItem(PROFILE_KEY);
        const profile = stored ? JSON.parse(stored) : null;
        const hasProfile = profile?.name && String(profile.name).trim().length > 0;
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        if (hasProfile) {
          router.replace('/(tabs)/(home)' as any);
          return;
        }
      }
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      router.replace('/profile-setup' as any);
    } catch (e) {
      console.log('Failed to complete onboarding after sign-in:', e);
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      router.replace('/profile-setup' as any);
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
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

  const currentSlide = SLIDES[activeIndex];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

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
        data={SLIDES}
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
      >
        <Text style={[styles.tag, { color: currentSlide.accentColor }]}>
          {currentSlide.tag}
        </Text>

        <Text style={styles.title}>
          {currentSlide.title}{' '}
          {currentSlide.titleAccent && (
            <Text style={[styles.titleAccent, { color: currentSlide.accentColor }]}>
              {currentSlide.titleAccent}
            </Text>
          )}
        </Text>

        <Text style={styles.body}>{currentSlide.body}</Text>
      </Animated.View>

      <View style={[styles.dotsRow, { bottom: insets.bottom + (isLastSlide ? 255 : 92) }]}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              flatListRef.current?.scrollToIndex({ index: i, animated: true });
              setActiveIndex(i);
            }}
          >
            <Animated.View
              style={[
                styles.dot,
                i === activeIndex
                  ? [styles.dotActive, { backgroundColor: currentSlide.accentColor }]
                  : styles.dotInactive,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {!isLastSlide ? (
        <View style={[styles.navRow, { bottom: insets.bottom + 32 }]}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goToNext}
            style={[styles.nextBtn, { backgroundColor: currentSlide.accentColor }]}
            activeOpacity={0.85}
          >
            <Text style={styles.nextArrow}>→</Text>
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
    backgroundColor: COLORS.bg,
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
    fontSize: 20,
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
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.18,
    textTransform: 'uppercase',
    marginBottom: 10,
  } as TextStyle,

  title: {
    fontSize: 46,
    fontWeight: '300',
    color: COLORS.cream,
    lineHeight: 52,
    marginBottom: 16,
    letterSpacing: 0.3,
  } as TextStyle,

  titleAccent: {
    fontSize: 46,
    fontWeight: '300',
    lineHeight: 52,
  } as TextStyle,

  body: {
    fontSize: 15,
    color: 'rgba(240,224,192,0.65)',
    lineHeight: 24,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    paddingVertical: 12,
    paddingRight: 16,
  } as ViewStyle,

  skipText: {
    fontSize: 15,
    color: 'rgba(240,224,192,0.4)',
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
    elevation: 8,
  } as ViewStyle,

  nextArrow: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '500',
  } as TextStyle,

  authWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  } as ViewStyle,
});
