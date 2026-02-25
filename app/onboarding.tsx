import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Moon, Leaf, Sparkles, ArrowRight } from 'lucide-react-native';
import Colors from '@/constants/colors';

const ONBOARDING_KEY = 'vedic_onboarding_complete';

interface OnboardingPage {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  gradientColors: [string, string, string];
  accentColor: string;
}

const pages: OnboardingPage[] = [
  {
    title: 'Vedic\nFasting',
    subtitle: 'Ancient wisdom, modern wellness',
    description:
      'Discover the sacred art of Upavasa — fasting rooted in thousands of years of Vedic tradition.',
    icon: <Flame size={48} color="#FFF7ED" strokeWidth={1.5} />,
    gradientColors: ['#1A0E08', '#3D1D0A', '#2C1206'],
    accentColor: '#E8A04C',
  },
  {
    title: 'Track Your\nJourney',
    subtitle: 'Intermittent & Vedic fasts',
    description:
      'Log every fast — whether it\'s Ekadashi, Pradosh Vrat, or your own intermittent routine. Your body, your rhythm.',
    icon: <Moon size={48} color="#F0E6D8" strokeWidth={1.5} />,
    gradientColors: ['#0D1520', '#1A2A3D', '#0F1A28'],
    accentColor: '#7EB8D4',
  },
  {
    title: 'See Your\nProgress',
    subtitle: 'Analytics that inspire',
    description:
      'Watch your fasting patterns transform into insights — calories burned, streaks earned, and milestones unlocked.',
    icon: <Leaf size={48} color="#E8F0E4" strokeWidth={1.5} />,
    gradientColors: ['#0A1A0D', '#1A3320', '#0F2614'],
    accentColor: '#7CB87A',
  },
  {
    title: 'Begin Your\nPath',
    subtitle: 'Guided by tradition',
    description:
      'Explore the Vedic calendar, learn the significance of each Vrat, and let ancient knowledge guide your fasting practice.',
    icon: <Sparkles size={48} color="#FFF5E6" strokeWidth={1.5} />,
    gradientColors: ['#1A0F1E', '#2D1636', '#1F0E26'],
    accentColor: '#C490D4',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentPage, setCurrentPage] = useState<number>(0);

  const fadeAnims = useRef(pages.map(() => new Animated.Value(0))).current;
  const slideAnims = useRef(pages.map(() => new Animated.Value(40))).current;
  const iconScale = useRef(pages.map(() => new Animated.Value(0.5))).current;
  const iconRotate = useRef(pages.map(() => new Animated.Value(0))).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(30)).current;

  const animatePage = useCallback((index: number) => {
    fadeAnims[index].setValue(0);
    slideAnims[index].setValue(40);
    iconScale[index].setValue(0.5);
    iconRotate[index].setValue(0);

    Animated.parallel([
      Animated.timing(iconScale[index], {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(iconRotate[index], {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(fadeAnims[index], {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnims[index], {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    if (index === pages.length - 1) {
      Animated.sequence([
        Animated.delay(500),
        Animated.parallel([
          Animated.timing(buttonOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(buttonSlide, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      buttonOpacity.setValue(0);
      buttonSlide.setValue(30);
    }
  }, [fadeAnims, slideAnims, iconScale, iconRotate, buttonOpacity, buttonSlide]);

  useEffect(() => {
    animatePage(0);
  }, [animatePage]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const page = Math.round(offsetX / width);
      if (page !== currentPage && page >= 0 && page < pages.length) {
        setCurrentPage(page);
        animatePage(page);
      }
    },
    [currentPage, animatePage]
  );

  const handleGetStarted = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      console.log('Onboarding completed, navigating to dashboard');
    } catch (e) {
      console.log('Failed to save onboarding state:', e);
    }
    router.replace('/(tabs)');
  }, []);

  const handleSkip = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (e) {
      console.log('Failed to save onboarding state:', e);
    }
    router.replace('/(tabs)');
  }, []);

  const handleNext = useCallback(() => {
    if (currentPage < pages.length - 1) {
      scrollRef.current?.scrollTo({
        x: (currentPage + 1) * width,
        animated: true,
      });
    }
  }, [currentPage]);

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true, listener: handleScroll }
        )}
        scrollEventThrottle={16}
        decelerationRate="fast"
        testID="onboarding-scroll"
      >
        {pages.map((page, index) => {
          const spin = iconRotate[index].interpolate({
            inputRange: [0, 1],
            outputRange: ['-30deg', '0deg'],
          });

          return (
            <LinearGradient
              key={index}
              colors={page.gradientColors}
              style={[styles.page, { width, height }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={[styles.pageContent, { paddingTop: insets.top + 20 }]}>
                <View style={styles.topSection}>
                  <Animated.View
                    style={[
                      styles.iconContainer,
                      {
                        borderColor: page.accentColor + '30',
                        transform: [
                          { scale: iconScale[index] },
                          { rotate: spin },
                        ],
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.iconInner,
                        { backgroundColor: page.accentColor + '15' },
                      ]}
                    >
                      {page.icon}
                    </View>
                  </Animated.View>

                  <View style={styles.decorLine}>
                    <View
                      style={[
                        styles.decorDot,
                        { backgroundColor: page.accentColor + '40' },
                      ]}
                    />
                    <View
                      style={[
                        styles.decorBar,
                        { backgroundColor: page.accentColor + '20' },
                      ]}
                    />
                    <View
                      style={[
                        styles.decorDot,
                        { backgroundColor: page.accentColor + '40' },
                      ]}
                    />
                  </View>
                </View>

                <Animated.View
                  style={[
                    styles.textSection,
                    {
                      opacity: fadeAnims[index],
                      transform: [{ translateY: slideAnims[index] }],
                    },
                  ]}
                >
                  <Text style={[styles.subtitle, { color: page.accentColor }]}>
                    {page.subtitle}
                  </Text>
                  <Text style={styles.title}>{page.title}</Text>
                  <Text style={styles.description}>{page.description}</Text>
                </Animated.View>
              </View>
            </LinearGradient>
          );
        })}
      </Animated.ScrollView>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 20) + 10 },
        ]}
      >
        <View style={styles.pagination}>
          {pages.map((_, index) => {
            const dotWidth = scrollX.interpolate({
              inputRange: [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
              ],
              outputRange: [6, 28, 6],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange: [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
              ],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                    backgroundColor:
                      currentPage === pages.length - 1
                        ? pages[pages.length - 1].accentColor
                        : pages[currentPage].accentColor,
                  },
                ]}
              />
            );
          })}
        </View>

        {currentPage < pages.length - 1 ? (
          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipButton}
              testID="onboarding-skip"
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.skipText,
                  { color: pages[currentPage].accentColor + 'AA' },
                ]}
              >
                Skip
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNext}
              style={[
                styles.nextButton,
                { backgroundColor: pages[currentPage].accentColor + '20' },
              ]}
              testID="onboarding-next"
              activeOpacity={0.7}
            >
              <ArrowRight
                size={22}
                color={pages[currentPage].accentColor}
                strokeWidth={2}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <Animated.View
            style={[
              styles.ctaContainer,
              {
                opacity: buttonOpacity,
                transform: [{ translateY: buttonSlide }],
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleGetStarted}
              style={[
                styles.ctaButton,
                { backgroundColor: pages[pages.length - 1].accentColor },
              ]}
              testID="onboarding-get-started"
              activeOpacity={0.85}
            >
              <Text style={styles.ctaText}>Get Started</Text>
              <ArrowRight size={20} color="#FFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  page: {
    flex: 1,
  },
  pageContent: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 56,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    gap: 8,
  },
  decorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  decorBar: {
    width: 48,
    height: 1,
  },
  textSection: {
    alignItems: 'flex-start',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  title: {
    fontSize: 44,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    lineHeight: 52,
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    color: 'rgba(255,255,255,0.55)',
    maxWidth: 300,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    paddingTop: 16,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 28,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  nextButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaContainer: {
    width: '100%',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
