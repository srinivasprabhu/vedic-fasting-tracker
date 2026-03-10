import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing,
  TouchableOpacity, KeyboardAvoidingView,
  Platform, StatusBar, ViewStyle, TextStyle,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Step1Name }   from '@/components/profile-setup/Step1Name';
import { Step2Age }    from '@/components/profile-setup/Step2Age';
import { Step3Level }  from '@/components/profile-setup/Step3Level';
import { Step4Path }   from '@/components/profile-setup/Step4Path';
import { SetupHeader } from '@/components/profile-setup/SetupHeader';
import { useTheme }    from '@/contexts/ThemeContext';
import { useAuth }     from '@/contexts/AuthContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { FONTS, SPACING } from '@/constants/theme';
import type { AgeGroup, FastingLevel, FastingPath } from '@/types/user';

const TOTAL_STEPS = 4;

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { isAuthenticated } = useAuth();
  const { profile, updateProfile, isLoading } = useUserProfile();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
  const [fastingLevel, setFastingLevel] = useState<FastingLevel | null>(null);
  const [fastingPath, setFastingPath] = useState<FastingPath>('if');

  useEffect(() => {
    if (!isLoading && isAuthenticated && profile?.name?.trim()) {
      router.replace('/(tabs)/(home)' as any);
    }
  }, [isAuthenticated, profile?.name, isLoading]);

  const progressAnim   = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide   = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: step / TOTAL_STEPS,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [step]);

  const animateIn = useCallback(() => {
    contentOpacity.setValue(0);
    contentSlide.setValue(18);
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1, duration: 480, delay: 60,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(contentSlide, {
        toValue: 0, duration: 480, delay: 60,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentOpacity, contentSlide]);

  useEffect(() => { animateIn(); }, [step]);
  useEffect(() => { animateIn(); }, []);

  const handleBack = useCallback(() => {
    if (step > 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep((s) => s - 1);
    }
  }, [step]);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      handleComplete();
    }
  }, [step, name, ageGroup, fastingLevel, fastingPath]);

  const handleComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateProfile({
      name: name.trim() || 'Friend',
      ageGroup,
      fastingLevel,
      fastingPath,
      createdAt: Date.now(),
    });
    router.replace('/(tabs)/(home)' as any);
  }, [name, ageGroup, fastingLevel, fastingPath, updateProfile]);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateProfile({
      name: 'Friend',
      ageGroup: null,
      fastingLevel: null,
      fastingPath: 'if',
      createdAt: Date.now(),
    });
    router.replace('/(tabs)/(home)' as any);
  }, [updateProfile]);

  const canProceed = (() => {
    switch (step) {
      case 1: return name.trim().length > 0;
      case 2: return ageGroup !== null;
      case 3: return fastingLevel !== null;
      case 4: return true;
      default: return false;
    }
  })();

  const ctaLabel = step === TOTAL_STEPS ? 'Complete Setup' : 'Continue';

  const bgColors = isDark
    ? ['#1a0d04', '#0e0703', '#070402'] as const
    : ['#fdf3e3', '#faf0e4', '#f8edd8'] as const;

  const goldColor = isDark ? '#c8872a' : '#a06820';
  const goldLight = isDark ? '#e8a84c' : '#b07020';

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Step1Name
            value={name}
            onChange={setName}
            onSubmit={canProceed ? handleNext : undefined}
          />
        );
      case 2:
        return (
          <Step2Age
            value={ageGroup}
            onChange={setAgeGroup}
          />
        );
      case 3:
        return (
          <Step3Level
            value={fastingLevel}
            onChange={setFastingLevel}
          />
        );
      case 4:
        return (
          <Step4Path
            value={fastingPath}
            onChange={setFastingPath}
          />
        );
      default:
        return null;
    }
  };

  const rootBg = isDark ? '#0a0604' : '#fdf3e3';

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: rootBg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />

      <LinearGradient
        colors={bgColors}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />

      <View style={[
        styles.ambientGlow,
        { backgroundColor: goldColor, opacity: isDark ? 0.04 : 0.035 },
      ]} />

      <View style={[styles.progressTrack, { top: insets.top }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: goldLight,
              shadowColor: goldLight,
            },
          ]}
        />
      </View>

      <SetupHeader
        step={step}
        total={TOTAL_STEPS}
        onBack={step > 1 ? handleBack : undefined}
        style={{ paddingTop: insets.top + 12 }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.stepWrap,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentSlide }],
            },
          ]}
        >
          {renderStep()}
        </Animated.View>
      </ScrollView>

      <View style={[styles.bottomWrap, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          activeOpacity={canProceed ? 0.85 : 1}
          onPress={canProceed ? handleNext : undefined}
          style={[
            styles.ctaBtn,
            {
              backgroundColor: canProceed
                ? isDark ? goldColor : '#b07020'
                : 'rgba(200,135,42,0.18)',
              shadowColor: goldColor,
              shadowOpacity: canProceed ? (isDark ? 0.35 : 0.25) : 0,
            },
          ]}
        >
          <Text style={[
            styles.ctaText,
            {
              color: canProceed
                ? isDark ? '#1a0d04' : '#fff8ed'
                : 'rgba(200,135,42,0.4)',
            },
          ]}>
            {ctaLabel} →
          </Text>
        </TouchableOpacity>

        {step === 1 && (
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipBtn}
          >
            <Text style={[
              styles.skipText,
              { color: isDark ? 'rgba(240,224,192,0.28)' : 'rgba(60,35,10,0.28)' },
            ]}>
              Skip for now
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1 }                                    as ViewStyle,
  ambientGlow:   {
    position: 'absolute', top: '10%', left: '5%', right: '5%',
    height: '40%', borderRadius: 300,
  }                                                             as ViewStyle,
  progressTrack: {
    position: 'absolute', left: 0, right: 0, height: 3,
    backgroundColor: 'rgba(200,135,42,0.12)', zIndex: 10,
  }                                                             as ViewStyle,
  progressFill:  {
    height: '100%', borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 4,
  }                                                             as ViewStyle,
  scrollContent: {
    flexGrow: 1,
  }                                                             as ViewStyle,
  stepWrap:      {
    flex: 1, paddingHorizontal: 24, paddingTop: 12,
  }                                                             as ViewStyle,
  bottomWrap:    { paddingHorizontal: 24, paddingTop: 12 }      as ViewStyle,
  ctaBtn:        {
    borderRadius: 16, paddingVertical: 17, alignItems: 'center',
    shadowOffset: { width: 0, height: 6 }, shadowRadius: 14,
    elevation: Platform.OS === 'android' ? 4 : 8,
  }                                                             as ViewStyle,
  ctaText:       {
    fontFamily: FONTS.bodyMedium, fontSize: 16,
    fontWeight: '600', letterSpacing: 0.2,
  }                                                             as TextStyle,
  skipBtn:       { alignItems: 'center', paddingVertical: 14 }  as ViewStyle,
  skipText:      { fontFamily: FONTS.bodyRegular, fontSize: 13 } as TextStyle,
});
