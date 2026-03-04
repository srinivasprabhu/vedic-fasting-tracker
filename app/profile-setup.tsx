import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ArrowRight, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { AayuMandala } from '@/components/onboarding/AayuMandala';
import { Step1Name } from '@/components/profile-setup/Step1Name';
import { Step2Gender } from '@/components/profile-setup/Step2Gender';
import {
  Step3Age,
  AgeGroup,
  AGE_GROUP_TO_NUMBER,
} from '@/components/profile-setup/Step3Age';
import { COLORS } from '@/constants/theme';
import type { UserSex } from '@/types/user';

type Step = 'name' | 'sex' | 'age';

const STEP_LABELS: Record<Step, string> = {
  name: 'STEP 1 NAME',
  sex: 'STEP 2 GENDER',
  age: 'STEP 3 AGE',
};

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { profile, updateProfile, isLoading } = useUserProfile();
  const [step, setStep] = useState<Step>('name');

  // If user is signed in and profile already exists (e.g. from Supabase sync), skip to main app
  useEffect(() => {
    if (!isLoading && isAuthenticated && profile?.name?.trim()) {
      router.replace('/(tabs)/(home)' as any);
    }
  }, [isAuthenticated, profile?.name, isLoading]);
  const [name, setName] = useState<string>('');
  const [sex, setSex] = useState<UserSex | null>(null);
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateTransition = useCallback((forward: boolean, callback: () => void) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      slideAnim.setValue(forward ? 40 : -40);
      callback();
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'name' && name.trim().length > 0) {
      animateTransition(true, () => setStep('sex'));
    } else if (step === 'sex' && sex !== null) {
      animateTransition(true, () => setStep('age'));
    } else if (step === 'age' && ageGroup !== null) {
      handleComplete();
    }
  }, [step, name, sex, ageGroup, animateTransition]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'sex') {
      animateTransition(false, () => setStep('name'));
    } else if (step === 'age') {
      animateTransition(false, () => setStep('sex'));
    }
  }, [step, animateTransition]);

  const handleComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const age = ageGroup ? AGE_GROUP_TO_NUMBER[ageGroup] : 25;
    updateProfile({
      name: name.trim(),
      sex: sex ?? 'prefer_not_to_say',
      age,
      createdAt: Date.now(),
    });
    router.replace('/(tabs)/(home)');
  }, [name, sex, ageGroup, updateProfile]);

  const canProceed = (() => {
    if (step === 'name') return name.trim().length > 0;
    if (step === 'sex') return sex !== null;
    if (step === 'age') return ageGroup !== null;
    return false;
  })();

  const stepNumber = step === 'name' ? 1 : step === 'sex' ? 2 : 3;

  return (
    <LinearGradient
      colors={['#1A0E08', '#2C1810', '#1A0F06']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerLeft}>
            {step !== 'name' ? (
              <TouchableOpacity
                onPress={handleBack}
                style={styles.backButton}
                activeOpacity={0.7}
                testID="profile-back"
              >
                <ArrowLeft size={20} color={COLORS.gold} />
              </TouchableOpacity>
            ) : (
              <View style={styles.backButton} />
            )}
            <View style={styles.brandRow}>
              <AayuMandala size={24} color={COLORS.gold} animated={false} />
              <Text style={styles.brandName}>Aayu</Text>
            </View>
          </View>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>{stepNumber} of 3</Text>
          </View>
        </View>

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
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {step === 'name' && (
              <Step1Name
                value={name}
                onChange={setName}
                onSubmit={canProceed ? handleNext : undefined}
              />
            )}
            {step === 'sex' && (
              <Step2Gender value={sex} onChange={setSex} />
            )}
            {step === 'age' && (
              <Step3Age value={ageGroup} onChange={setAgeGroup} />
            )}
          </Animated.View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              paddingBottom: insets.bottom + 24,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.continueButton,
              !canProceed && styles.continueButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!canProceed}
            activeOpacity={0.85}
            testID="profile-continue"
          >
            <Text style={styles.continueText}>
              {step === 'age' ? 'Complete Setup' : 'Continue'}
            </Text>
            <ArrowRight size={20} color="#FFF" strokeWidth={2.5} />
          </TouchableOpacity>

          {step === 'name' && (
            <TouchableOpacity
              onPress={() => {
                updateProfile({
                  name: 'Friend',
                  sex: 'prefer_not_to_say',
                  age: 25,
                  createdAt: Date.now(),
                });
                router.replace('/(tabs)/(home)');
              }}
              style={styles.skipLink}
              activeOpacity={0.7}
              testID="profile-skip"
            >
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.footerLabel}>{STEP_LABELS[step]}</Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(200,135,42,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '300',
    color: COLORS.gold,
    letterSpacing: 2,
  },
  stepIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(200,135,42,0.1)',
  },
  stepText: {
    fontSize: 13,
    color: COLORS.gold,
    fontWeight: '500',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
  },
  content: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingTop: 16,
    alignItems: 'center',
    gap: 12,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    width: '100%',
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skipLink: {
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    color: 'rgba(240,224,192,0.5)',
    fontWeight: '500',
  },
  footerLabel: {
    fontSize: 10,
    color: 'rgba(240,224,192,0.25)',
    letterSpacing: 0.5,
  },
});
