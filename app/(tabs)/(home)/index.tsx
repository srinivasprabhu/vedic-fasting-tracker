import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import * as Haptics from 'expo-haptics';
import { Play, Square, Flame, Clock, Trophy, Settings } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useFasting } from '@/contexts/FastingContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { FAST_TYPES, INTERMITTENT_FAST_TYPES, VEDIC_QUOTES } from '@/mocks/vedic-data';
import CircularTimer from '@/components/CircularTimer';
import FastTimePickerModal from '@/components/FastTimePickerModal';
import MetabolicZoneRiver from '@/components/MetabolicZoneRiver';
import { useFastTimer } from '@/hooks/useFastTimer';
import { FastType, FastCategory } from '@/types/fasting';
import type { ColorScheme } from '@/constants/colors';

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function formatShortDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { activeFast, startFast, endFast, streak, totalHours, completedRecords } = useFasting();
  const { getGreeting, getInitial } = useUserProfile();
  const [showFastPicker, setShowFastPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<FastCategory>('intermittent');
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [pendingFast, setPendingFast] = useState<{ type: FastType; name: string; duration: number } | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pickerAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const quote = VEDIC_QUOTES[Math.floor(Date.now() / 86400000) % VEDIC_QUOTES.length];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const timer = useFastTimer(
    activeFast
      ? {
          startTime: activeFast.startTime,
          onZoneChange: (id, name) => {
            console.log(`Zone changed: ${name} (${id})`);
          },
        }
      : null
  );

  const togglePicker = useCallback(() => {
    const toValue = showFastPicker ? 0 : 1;
    setShowFastPicker(!showFastPicker);
    Animated.spring(pickerAnim, {
      toValue,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [showFastPicker, pickerAnim]);

  const handleFastTypeSelect = useCallback((type: FastType, name: string, duration: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPendingFast({ type, name, duration });
    setShowFastPicker(false);
    Animated.spring(pickerAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
    setShowStartTimePicker(true);
  }, [pickerAnim]);

  const handleStartNow = useCallback(() => {
    if (!pendingFast) return;
    startFast(pendingFast.type, pendingFast.name, pendingFast.duration * 3600000);
    setPendingFast(null);
    console.log('Fast started with current time');
  }, [pendingFast, startFast]);

  const handleStartCustom = useCallback((timestamp: number) => {
    if (!pendingFast) return;
    startFast(pendingFast.type, pendingFast.name, pendingFast.duration * 3600000, timestamp);
    setPendingFast(null);
    console.log('Fast started with custom time:', new Date(timestamp).toLocaleString());
  }, [pendingFast, startFast]);

  const handleEndFast = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowEndTimePicker(true);
  }, []);

  const handleEndNow = useCallback(() => {
    const targetMs = activeFast?.targetDuration ?? 0;
    const completed = timer.elapsedMs >= targetMs * 0.8;
    Haptics.notificationAsync(
      completed
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning
    );
    endFast(completed);
    console.log('Fast ended with current time');
    setTimeout(() => router.push('/fast-complete' as any), 300);
  }, [activeFast, timer.elapsedMs, endFast]);

  const handleEndCustom = useCallback((timestamp: number) => {
    if (!activeFast) return;
    const actualElapsed = timestamp - activeFast.startTime;
    const targetMs = activeFast.targetDuration;
    const completed = actualElapsed >= targetMs * 0.8;
    Haptics.notificationAsync(
      completed
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning
    );
    endFast(completed, timestamp);
    console.log('Fast ended with custom time:', new Date(timestamp).toLocaleString());
    setTimeout(() => router.push('/fast-complete' as any), 300);
  }, [activeFast, endFast]);

  const handleButtonPressIn = useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [buttonScale]);

  const handleButtonPressOut = useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [buttonScale]);

  const progress = activeFast ? timer.elapsedMs / activeFast.targetDuration : 0;
  const remaining = activeFast ? Math.max(0, activeFast.targetDuration - timer.elapsedMs) : 0;

  const pickerTranslate = pickerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <View style={styles.avatarSmall}>
                  <Text style={styles.avatarSmallText}>{getInitial()}</Text>
                </View>
                <View>
                  <Text style={styles.greeting}>Welcome, {getGreeting()}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => router.push('/settings' as any)}
                activeOpacity={0.7}
                testID="settings-button"
              >
                <Settings size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View style={[styles.quoteCard, { opacity: fadeAnim }]}>
            <Text style={styles.quoteText}>"{quote.text}"</Text>
            <Text style={styles.quoteSource}>— {quote.source}</Text>
          </Animated.View>

          <View style={styles.timerSection}>
            <CircularTimer
              progress={progress}
              elapsed={activeFast ? timer.formatted : '00:00:00'}
              remaining={formatShortDuration(remaining)}
              label={activeFast ? activeFast.label : 'Ready to fast'}
              isActive={!!activeFast}
            />

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              {activeFast ? (
                <TouchableOpacity
                  style={styles.stopButton}
                  onPress={handleEndFast}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                  activeOpacity={0.8}
                  testID="stop-fast-button"
                >
                  <Square size={18} color={colors.textLight} fill={colors.textLight} />
                  <Text style={styles.stopButtonText}>End Fast</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={togglePicker}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                  activeOpacity={0.8}
                  testID="start-fast-button"
                >
                  <Play size={18} color={colors.textLight} fill={colors.textLight} />
                  <Text style={styles.startButtonText}>Begin Fast</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          </View>

          {showFastPicker && (
            <Animated.View
              style={[
                styles.pickerSection,
                {
                  opacity: pickerAnim,
                  transform: [{ translateY: pickerTranslate }],
                },
              ]}
            >
              <Text style={styles.pickerTitle}>Choose Your Fast</Text>
              <View style={styles.tabRow}>
                <TouchableOpacity
                  style={[styles.tab, pickerTab === 'intermittent' && styles.tabActive]}
                  onPress={() => setPickerTab('intermittent')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, pickerTab === 'intermittent' && styles.tabTextActive]}>Intermittent</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, pickerTab === 'vedic' && styles.tabActive]}
                  onPress={() => setPickerTab('vedic')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, pickerTab === 'vedic' && styles.tabTextActive]}>Vedic Vrat</Text>
                </TouchableOpacity>
              </View>
              {(pickerTab === 'intermittent' ? INTERMITTENT_FAST_TYPES : FAST_TYPES).map((fast) => (
                <TouchableOpacity
                  key={fast.type}
                  style={styles.fastOption}
                  onPress={() => handleFastTypeSelect(fast.type, fast.name, fast.duration)}
                  activeOpacity={0.7}
                  testID={`fast-option-${fast.type}`}
                >
                  <View style={styles.fastOptionLeft}>
                    <Text style={styles.fastOptionIcon}>{fast.icon}</Text>
                    <View style={styles.fastOptionInfo}>
                      <Text style={styles.fastOptionName}>{fast.name}</Text>
                      <Text style={styles.fastOptionDeity}>
                        {pickerTab === 'vedic' ? `${fast.deity} · ` : ''}{fast.duration}h
                      </Text>
                    </View>
                  </View>
                  <View style={styles.fastOptionArrow}>
                    <Play size={14} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.warningLight }]}>
                <Flame size={18} color={colors.warning} />
              </View>
              <Text style={styles.statValue}>{streak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.primaryLight }]}>
                <Clock size={18} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{Math.round(totalHours)}</Text>
              <Text style={styles.statLabel}>Hours</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.successLight }]}>
                <Trophy size={18} color={colors.success} />
              </View>
              <Text style={styles.statValue}>{completedRecords.filter(r => r.completed).length}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>

          <MetabolicZoneRiver
            hoursElapsed={timer.hoursElapsed}
            isActive={!!activeFast}
            colors={colors}
          />

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>

      <FastTimePickerModal
        visible={showStartTimePicker}
        onClose={() => {
          setShowStartTimePicker(false);
          setPendingFast(null);
        }}
        onSelectNow={handleStartNow}
        onSelectCustom={handleStartCustom}
        title="When did you start fasting?"
      />

      <FastTimePickerModal
        visible={showEndTimePicker}
        onClose={() => setShowEndTimePicker(false)}
        onSelectNow={handleEndNow}
        onSelectCustom={handleEndCustom}
        title="When did you break your fast?"
        maxDate={new Date()}
      />
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 32,
    },
    header: {
      marginTop: 12,
      marginBottom: 16,
    },
    headerRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
    headerLeft: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      flex: 1,
    },
    avatarSmall: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    avatarSmallText: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: '#FFFFFF',
    },
    greeting: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 1,
    },
    title: {
      fontSize: 22,
      fontWeight: '700' as const,
      color: colors.text,
      letterSpacing: -0.3,
    },
    settingsButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    quoteCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 28,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    quoteText: {
      fontSize: 14,
      color: colors.text,
      fontStyle: 'italic' as const,
      lineHeight: 20,
    },
    quoteSource: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 6,
    },
    timerSection: {
      alignItems: 'center' as const,
      marginBottom: 32,
      gap: 24,
    },
    startButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 28,
      gap: 10,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    startButtonText: {
      color: colors.textLight,
      fontSize: 16,
      fontWeight: '600' as const,
    },
    stopButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.accent,
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 28,
      gap: 10,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    stopButtonText: {
      color: colors.textLight,
      fontSize: 16,
      fontWeight: '600' as const,
    },
    pickerSection: {
      marginBottom: 28,
    },
    pickerTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 12,
    },
    tabRow: {
      flexDirection: 'row' as const,
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 3,
      marginBottom: 14,
    },
    tab: {
      flex: 1,
      paddingVertical: 9,
      borderRadius: 8,
      alignItems: 'center' as const,
    },
    tabActive: {
      backgroundColor: colors.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    tabText: {
      fontSize: 13,
      fontWeight: '500' as const,
      color: colors.textMuted,
    },
    tabTextActive: {
      color: colors.text,
      fontWeight: '600' as const,
    },
    fastOptionInfo: {
      flex: 1,
    },
    fastOption: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      backgroundColor: colors.card,
      padding: 14,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    fastOptionLeft: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
    },
    fastOptionIcon: {
      fontSize: 24,
    },
    fastOptionName: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.text,
    },
    fastOptionDeity: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 1,
    },
    fastOptionArrow: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primaryLight,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    statsRow: {
      flexDirection: 'row' as const,
      gap: 10,
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    statIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: 8,
    },
    statValue: {
      fontSize: 22,
      fontWeight: '700' as const,
      color: colors.text,
    },
    statLabel: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.8,
    },

    bottomSpacer: {
      height: 16,
    },

  });
}
