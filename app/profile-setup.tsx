import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
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
import { ArrowRight, ArrowLeft, User, Sparkles } from 'lucide-react-native';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { UserSex } from '@/types/user';

type Step = 'name' | 'sex' | 'age';

const SEX_OPTIONS: { value: UserSex; label: string; emoji: string }[] = [
  { value: 'male', label: 'Male', emoji: '🧘‍♂️' },
  { value: 'female', label: 'Female', emoji: '🧘‍♀️' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say', emoji: '🙏' },
];

const AGE_RANGES = [
  { label: 'Under 18', value: 16 },
  { label: '18–25', value: 22 },
  { label: '26–35', value: 30 },
  { label: '36–45', value: 40 },
  { label: '46–55', value: 50 },
  { label: '56–65', value: 60 },
  { label: '65+', value: 70 },
];

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const { updateProfile } = useUserProfile();
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState<string>('');
  const [sex, setSex] = useState<UserSex | null>(null);
  const [age, setAge] = useState<number | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0.33)).current;

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

  const animateProgress = useCallback((toValue: number) => {
    Animated.timing(progressAnim, {
      toValue,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'name' && name.trim().length > 0) {
      animateTransition(true, () => setStep('sex'));
      animateProgress(0.66);
    } else if (step === 'sex' && sex !== null) {
      animateTransition(true, () => setStep('age'));
      animateProgress(1);
    } else if (step === 'age' && age !== null) {
      handleComplete();
    }
  }, [step, name, sex, age, animateTransition, animateProgress]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'sex') {
      animateTransition(false, () => setStep('name'));
      animateProgress(0.33);
    } else if (step === 'age') {
      animateTransition(false, () => setStep('sex'));
      animateProgress(0.66);
    }
  }, [step, animateTransition, animateProgress]);

  const handleComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateProfile({
      name: name.trim(),
      sex: sex ?? 'prefer_not_to_say',
      age: age ?? 25,
      createdAt: Date.now(),
    });
    console.log('Profile setup complete, navigating to tabs');
    router.replace('/(tabs)/(home)');
  }, [name, sex, age, updateProfile]);

  const canProceed = useMemo(() => {
    if (step === 'name') return name.trim().length > 0;
    if (step === 'sex') return sex !== null;
    if (step === 'age') return age !== null;
    return false;
  }, [step, name, sex, age]);

  const stepTitle = useMemo(() => {
    if (step === 'name') return 'What do we\ncall you?';
    if (step === 'sex') return 'Tell us about\nyourself';
    return 'How old\nare you?';
  }, [step]);

  const stepSubtitle = useMemo(() => {
    if (step === 'name') return 'This helps personalize your fasting journey';
    if (step === 'sex') return 'Some fasting traditions vary by gender';
    return 'We\'ll tailor recommendations to your age group';
  }, [step]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

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
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>

          <View style={styles.topRow}>
            {step !== 'name' ? (
              <TouchableOpacity
                onPress={handleBack}
                style={styles.backButton}
                activeOpacity={0.7}
                testID="profile-back"
              >
                <ArrowLeft size={20} color="#B8956A" />
              </TouchableOpacity>
            ) : (
              <View style={styles.backButton} />
            )}
            <View style={styles.stepIndicator}>
              <Text style={styles.stepText}>
                {step === 'name' ? '1' : step === 'sex' ? '2' : '3'} of 3
              </Text>
            </View>
          </View>

          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.iconCircle}>
              {step === 'name' && <User size={32} color="#E8A04C" strokeWidth={1.5} />}
              {step === 'sex' && <Sparkles size={32} color="#E8A04C" strokeWidth={1.5} />}
              {step === 'age' && <Text style={styles.iconEmoji}>🕉️</Text>}
            </View>

            <Text style={styles.title}>{stepTitle}</Text>
            <Text style={styles.subtitle}>{stepSubtitle}</Text>

            {step === 'name' && (
              <View style={styles.inputSection}>
                <TextInput
                  style={styles.nameInput}
                  placeholder="Your name"
                  placeholderTextColor="#6E5540"
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => canProceed && handleNext()}
                  testID="profile-name-input"
                  maxLength={30}
                />
                <View style={styles.inputUnderline} />
              </View>
            )}

            {step === 'sex' && (
              <View style={styles.optionsList}>
                {SEX_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionCard,
                      sex === option.value && styles.optionCardSelected,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSex(option.value);
                    }}
                    activeOpacity={0.7}
                    testID={`profile-sex-${option.value}`}
                  >
                    <Text style={styles.optionEmoji}>{option.emoji}</Text>
                    <Text
                      style={[
                        styles.optionLabel,
                        sex === option.value && styles.optionLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {sex === option.value && (
                      <View style={styles.checkDot} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {step === 'age' && (
              <View style={styles.ageGrid}>
                {AGE_RANGES.map((range) => (
                  <TouchableOpacity
                    key={range.value}
                    style={[
                      styles.ageChip,
                      age === range.value && styles.ageChipSelected,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setAge(range.value);
                    }}
                    activeOpacity={0.7}
                    testID={`profile-age-${range.value}`}
                  >
                    <Text
                      style={[
                        styles.ageChipText,
                        age === range.value && styles.ageChipTextSelected,
                      ]}
                    >
                      {range.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Animated.View>

          <View style={styles.bottomSection}>
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
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(232, 160, 76, 0.15)',
    borderRadius: 2,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E8A04C',
    borderRadius: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(232, 160, 76, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(232, 160, 76, 0.1)',
  },
  stepText: {
    fontSize: 13,
    color: '#B8956A',
    fontWeight: '500' as const,
  },
  content: {
    flex: 1,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(232, 160, 76, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232, 160, 76, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  iconEmoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#F2E5D0',
    lineHeight: 44,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#8B7355',
    lineHeight: 22,
    marginBottom: 36,
  },
  inputSection: {
    marginBottom: 32,
  },
  nameInput: {
    fontSize: 28,
    color: '#F2E5D0',
    fontWeight: '600' as const,
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  inputUnderline: {
    height: 2,
    backgroundColor: 'rgba(232, 160, 76, 0.3)',
    borderRadius: 1,
  },
  optionsList: {
    gap: 12,
    marginBottom: 32,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 160, 76, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(232, 160, 76, 0.15)',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 14,
  },
  optionCardSelected: {
    backgroundColor: 'rgba(232, 160, 76, 0.15)',
    borderColor: '#E8A04C',
  },
  optionEmoji: {
    fontSize: 24,
  },
  optionLabel: {
    fontSize: 17,
    color: '#8B7355',
    fontWeight: '500' as const,
    flex: 1,
  },
  optionLabelSelected: {
    color: '#F2E5D0',
  },
  checkDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E8A04C',
  },
  ageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 32,
  },
  ageChip: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(232, 160, 76, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(232, 160, 76, 0.15)',
  },
  ageChipSelected: {
    backgroundColor: 'rgba(232, 160, 76, 0.15)',
    borderColor: '#E8A04C',
  },
  ageChipText: {
    fontSize: 15,
    color: '#8B7355',
    fontWeight: '500' as const,
  },
  ageChipTextSelected: {
    color: '#F2E5D0',
  },
  bottomSection: {
    paddingTop: 20,
    alignItems: 'center',
    gap: 16,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8A04C',
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
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  skipLink: {
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    color: '#6E5540',
    fontWeight: '500' as const,
  },
});
