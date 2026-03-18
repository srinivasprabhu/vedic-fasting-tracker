import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  Share,
  ScrollView,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import {
  X,
  Trophy,
  Clock,
  Flame,
  Zap,
  Heart,
  Share2,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Copy,
  Check,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/contexts/ThemeContext';
import { useFasting } from '@/contexts/FastingContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import type { ColorScheme } from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatDurationLong(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getMetabolicZone(durationHours: number): { name: string; icon: string; color: string; description: string } {
  if (durationHours >= 24) return { name: 'Deep Autophagy', icon: '🧬', color: '#8B5CF6', description: 'Cellular renewal at peak levels' };
  if (durationHours >= 18) return { name: 'Autophagy', icon: '✨', color: '#3B82F6', description: 'Cells are recycling damaged components' };
  if (durationHours >= 14) return { name: 'Fat Burning', icon: '🔥', color: '#F59E0B', description: 'Body is actively burning fat stores' };
  if (durationHours >= 8) return { name: 'Ketosis', icon: '⚡', color: '#10B981', description: 'Transitioning to ketone energy' };
  return { name: 'Glycogen Depletion', icon: '🌙', color: '#6366F1', description: 'Depleting sugar reserves' };
}

function getMotivationalMessage(completed: boolean, durationHours: number): string {
  if (!completed) return 'Every effort counts. Your discipline grows stronger each time.';
  if (durationHours >= 24) return 'Incredible discipline! You achieved a deep fast. Your body thanks you.';
  if (durationHours >= 16) return 'Amazing dedication! You unlocked powerful health benefits.';
  if (durationHours >= 12) return 'Great job! You gave your body the rest it needed.';
  return 'Well done! Consistency is the key to transformation.';
}

function getCompletionMessage(
  completed: boolean,
  durationHours: number,
  targetHours: number
): { title: string; subtitle: string; detailMessage?: string } {
  const metTarget = completed || durationHours >= targetHours * 0.8;

  if (durationHours < 5) {
    return {
      title: 'Every Step Counts',
      subtitle: 'Each fast builds discipline. Try extending a bit longer next time.',
    };
  }
  if (durationHours < 12 && !metTarget) {
    return {
      title: 'Good Progress',
      subtitle: 'You gave your body meaningful rest. Keep building.',
    };
  }
  return {
    title: 'Congratulations!',
    subtitle: 'Fast Completed 🙏',
    detailMessage: getMotivationalMessage(completed, durationHours),
  };
}

export default function FastCompleteScreen() {
  const { colors, isDark } = useTheme();
  const { lastCompletedFast, clearLastCompleted, streak, completedRecords } = useFasting();
  const { profile } = useUserProfile();
  const userName = profile?.name ?? '';
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const shareCardRef = useRef<View>(null);

  const confettiAnims = useRef(
    Array.from({ length: 12 }, () => ({
      translateY: new Animated.Value(-60),
      translateX: new Animated.Value(0),
      opacity: new Animated.Value(1),
      rotate: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(60)).current;
  const cardScale = useRef(new Animated.Value(0.85)).current;
  const trophyBounce = useRef(new Animated.Value(0)).current;
  const statsSlide = useRef(new Animated.Value(40)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(30)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
        Animated.timing(slideUp, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(trophyBounce, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }),
        ...confettiAnims.map((anim, i) =>
          Animated.parallel([
            Animated.timing(anim.scale, { toValue: 1, duration: 300, delay: i * 40, useNativeDriver: true }),
            Animated.timing(anim.translateY, {
              toValue: 300 + Math.random() * 200,
              duration: 1800 + Math.random() * 800,
              delay: i * 40,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(anim.translateX, {
              toValue: (Math.random() - 0.5) * SCREEN_WIDTH * 0.8,
              duration: 1800 + Math.random() * 800,
              delay: i * 40,
              useNativeDriver: true,
            }),
            Animated.timing(anim.rotate, {
              toValue: (Math.random() - 0.5) * 4,
              duration: 1800,
              delay: i * 40,
              useNativeDriver: true,
            }),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 800,
              delay: i * 40 + 1200,
              useNativeDriver: true,
            }),
          ])
        ),
      ]),
      Animated.parallel([
        Animated.timing(statsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(statsSlide, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(buttonOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(buttonSlide, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const fast = lastCompletedFast;

  const durationMs = fast ? (fast.endTime ?? Date.now()) - fast.startTime : 0;
  const durationHours = durationMs / 3600000;
  const targetMs = fast?.targetDuration ?? 1;
  const targetHours = targetMs / 3600000;
  const completionPct = Math.min(100, Math.round((durationMs / targetMs) * 100));
  const zone = getMetabolicZone(durationHours);
  const completionMessage = getCompletionMessage(fast?.completed ?? false, durationHours, targetHours);
  const totalCompleted = completedRecords.filter(r => r.completed).length;

  const handleShareImage = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (Platform.OS === 'web') {
        const shareText = buildShareText();
        if (navigator.share) {
          try {
            await navigator.share({ text: shareText });
            return;
          } catch (webShareErr) {
            console.log('Web Share API failed, falling back to clipboard:', webShareErr);
          }
        }
        try {
          await Clipboard.setStringAsync(shareText);
          Alert.alert('Copied!', 'Achievement text copied to clipboard. Paste it anywhere to share!');
        } catch (clipErr) {
          console.log('Clipboard fallback failed:', clipErr);
          Alert.alert('Share', shareText);
        }
        return;
      }
      const uri = await captureRef(shareCardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      console.log('Captured share card:', uri);
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your fasting achievement',
        });
      } else {
        const shareText = buildShareText();
        await Share.share({ message: shareText });
      }
    } catch (e) {
      console.log('Share failed:', e);
      try {
        const shareText = buildShareText();
        await Clipboard.setStringAsync(shareText);
        Alert.alert('Copied!', 'Achievement text copied to clipboard.');
      } catch (fallbackErr) {
        console.log('All share methods failed:', fallbackErr);
      }
    }
  }, [fast, durationMs, completionPct, streak, zone]);

  const buildShareText = useCallback(() => {
    if (!fast) return '';
    const nameStr = userName ? `\n👤 ${userName}` : '';
    return `🪷 Vedic Intermittent Fasting Achievement!${nameStr}\n\n🏆 ${fast.label}\n⏱️ Duration: ${formatDurationLong(durationMs)}\n📊 ${completionPct}% completed\n🔥 ${streak} day streak\n${zone.icon} Zone: ${zone.name}\n\nFasting with discipline 🙏\n#VedicIntermittentFasting #VedicFasting #Health`;
  }, [fast, durationMs, completionPct, streak, zone]);

  const handleClose = useCallback(() => {
    clearLastCompleted();
    router.back();
  }, [clearLastCompleted]);

  if (!fast) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No fast data available</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const trophyScale = trophyBounce.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1.2, 1],
  });

  const confettiEmojis = ['🎉', '✨', '🌟', '🔥', '💪', '🙏', '🪷', '⭐', '🎊', '💫', '🌸', '🪷'];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark
          ? ['#1A0E05', '#2A1508', '#1A0E05'] as [string, string, string]
          : ['#FDF6ED', '#FEF0D9', '#FDF6ED'] as [string, string, string]
        }
        style={StyleSheet.absoluteFill}
      />

      {confettiAnims.map((anim, i) => (
        <Animated.View
          key={`confetti-${i}`}
          style={[
            styles.confetti,
            {
              left: SCREEN_WIDTH * 0.1 + (SCREEN_WIDTH * 0.8 * (i / confettiAnims.length)),
              opacity: anim.opacity,
              transform: [
                { translateY: anim.translateY },
                { translateX: anim.translateX },
                { rotate: anim.rotate.interpolate({ inputRange: [-4, 4], outputRange: ['-720deg', '720deg'] }) },
                { scale: anim.scale },
              ],
            },
          ]}
        >
          <Text style={styles.confettiEmoji}>{confettiEmojis[i % confettiEmojis.length]}</Text>
        </Animated.View>
      ))}

      <TouchableOpacity style={styles.closeIcon} onPress={handleClose} activeOpacity={0.7} testID="close-completion">
        <X size={22} color={colors.textSecondary} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.heroSection, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          <Animated.View style={[styles.trophyContainer, { transform: [{ scale: trophyScale }] }]}>
            <View style={[styles.trophyGlow, { backgroundColor: fast.completed ? colors.warning + '20' : colors.primary + '20' }]}>
              <View style={[styles.trophyInner, { backgroundColor: fast.completed ? colors.warning + '30' : colors.primary + '30' }]}>
                {fast.completed ? (
                  <Trophy size={48} color={colors.warning} />
                ) : (
                  <Heart size={48} color={colors.primary} />
                )}
              </View>
            </View>
          </Animated.View>

          <Text style={styles.heroTitle}>
            {completionMessage.title}
          </Text>
          <Text style={styles.heroTitleSub}>
            {completionMessage.subtitle}
          </Text>
          {completionMessage.detailMessage ? (
            <Text style={styles.heroSubtitle}>
              {completionMessage.detailMessage}
            </Text>
          ) : null}
        </Animated.View>

        <Animated.View
          ref={shareCardRef}
          collapsable={false}
          style={[styles.shareCard, { opacity: fadeIn, transform: [{ scale: cardScale }] }]}
        >
          <LinearGradient
            colors={isDark
              ? ['#2A1A08', '#1E1208', '#2A1508'] as [string, string, string]
              : ['#FFFBF5', '#FFF5E6', '#FFFBF5'] as [string, string, string]
            }
            style={styles.shareCardGradient}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardBrandRow}>
                <Image source={require('@/assets/images/mandala-icon.png')} style={styles.brandIcon} />
                <Text style={styles.cardBrand}>Vedic Fasting</Text>
              </View>
              <View style={[styles.completionBadge, { backgroundColor: fast.completed ? colors.success + '18' : colors.warning + '18' }]}>
                <Text style={[styles.completionBadgeText, { color: fast.completed ? colors.success : colors.warning }]}>
                  {completionPct}%
                </Text>
              </View>
            </View>

            <Text style={styles.cardFastName}>{fast.label}</Text>
            <Text style={styles.cardDate}>
              {formatDate(fast.startTime)} · {formatTime(fast.startTime)} → {formatTime(fast.endTime ?? Date.now())}
            </Text>

            <View style={styles.durationRow}>
              <View style={styles.durationBlock}>
                <Text style={styles.durationValue}>{formatDurationLong(durationMs)}</Text>
                <Text style={styles.durationLabel}>Duration</Text>
              </View>
              <View style={styles.durationDivider} />
              <View style={styles.durationBlock}>
                <Text style={styles.durationValue}>{formatDurationLong(targetMs)}</Text>
                <Text style={styles.durationLabel}>Target</Text>
              </View>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, completionPct)}%` as any,
                      backgroundColor: completionPct >= 100 ? colors.success : completionPct >= 80 ? colors.warning : colors.primary,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.zoneCard}>
              <Text style={styles.zoneIcon}>{zone.icon}</Text>
              <View style={styles.zoneInfo}>
                <Text style={[styles.zoneName, { color: zone.color }]}>{zone.name}</Text>
                <Text style={styles.zoneDesc}>{zone.description}</Text>
              </View>
            </View>

            <View style={styles.miniStats}>
              <View style={styles.miniStat}>
                <Flame size={14} color={colors.warning} />
                <Text style={styles.miniStatValue}>{streak}</Text>
                <Text style={styles.miniStatLabel}>Streak</Text>
              </View>
              <View style={styles.miniStat}>
                <Trophy size={14} color={colors.success} />
                <Text style={styles.miniStatValue}>{totalCompleted}</Text>
                <Text style={styles.miniStatLabel}>Total</Text>
              </View>
              <View style={styles.miniStat}>
                <Zap size={14} color={colors.primary} />
                <Text style={styles.miniStatValue}>{Math.round(durationHours * 10) / 10}h</Text>
                <Text style={styles.miniStatLabel}>Fasted</Text>
              </View>
            </View>

            {userName ? (
              <View style={styles.userBadge}>
                <View style={styles.userBadgeAvatar}>
                  <Text style={styles.userBadgeInitial}>{userName.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.userBadgeName}>{userName}</Text>
              </View>
            ) : null}

            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterText}>🙏 Fasting with discipline</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={[styles.statsSection, { opacity: statsOpacity, transform: [{ translateY: statsSlide }] }]}>
          <View style={styles.insightRow}>
            <View style={[styles.insightCard, { backgroundColor: colors.warningLight }]}>
              <TrendingUp size={18} color={colors.warning} />
              <Text style={[styles.insightValue, { color: colors.warning }]}>
                {Math.round(durationHours * 12)} cal
              </Text>
              <Text style={styles.insightLabel}>Est. Burned</Text>
            </View>
            <View style={[styles.insightCard, { backgroundColor: colors.successLight }]}>
              <Sparkles size={18} color={colors.success} />
              <Text style={[styles.insightValue, { color: colors.success }]}>
                {durationHours >= 16 ? 'Active' : durationHours >= 12 ? 'Starting' : 'Building'}
              </Text>
              <Text style={styles.insightLabel}>Autophagy</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.actionsSection, { opacity: buttonOpacity, transform: [{ translateY: buttonSlide }] }]}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareImage}
            activeOpacity={0.8}
            testID="share-button"
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark] as [string, string]}
              style={styles.shareButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Share2 size={20} color="#FFF" />
              <Text style={styles.shareButtonText}>Share Achievement</Text>
              <ChevronRight size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleClose}
            activeOpacity={0.7}
            testID="done-button"
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ColorScheme, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 40,
    },
    closeIcon: {
      position: 'absolute' as const,
      top: 52,
      right: 20,
      zIndex: 10,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    confetti: {
      position: 'absolute' as const,
      top: 0,
      zIndex: 5,
    },
    confettiEmoji: {
      fontSize: 22,
    },
    heroSection: {
      alignItems: 'center' as const,
      marginBottom: 24,
      paddingTop: 8,
    },
    trophyContainer: {
      marginBottom: 20,
    },
    trophyGlow: {
      width: 120,
      height: 120,
      borderRadius: 60,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    trophyInner: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    heroTitle: {
      fontSize: 28,
      fontWeight: '800' as const,
      color: colors.text,
      letterSpacing: -0.5,
      marginBottom: 4,
    },
    heroTitleSub: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    heroSubtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center' as const,
      lineHeight: 22,
      paddingHorizontal: 16,
    },
    shareCard: {
      borderRadius: 20,
      overflow: 'hidden' as const,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.borderLight,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.4 : 0.1,
      shadowRadius: 24,
      elevation: 8,
    },
    shareCardGradient: {
      padding: 22,
    },
    cardHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 16,
    },
    cardBrandRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
    },
    brandIcon: {
      width: 24,
      height: 24,
      borderRadius: 6,
    },
    cardBrand: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.textSecondary,
      letterSpacing: 0.5,
    },
    userBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
      marginBottom: 12,
      paddingVertical: 8,
      paddingHorizontal: 14,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      borderRadius: 20,
      alignSelf: 'center' as const,
    },
    userBadgeAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    userBadgeInitial: {
      fontSize: 12,
      fontWeight: '700' as const,
      color: '#FFFFFF',
    },
    userBadgeName: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.text,
      letterSpacing: 0.3,
    },
    completionBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    completionBadgeText: {
      fontSize: 14,
      fontWeight: '700' as const,
    },
    cardFastName: {
      fontSize: 22,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 4,
    },
    cardDate: {
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: 20,
    },
    durationRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
      borderRadius: 14,
      padding: 16,
      marginBottom: 16,
    },
    durationBlock: {
      flex: 1,
      alignItems: 'center' as const,
    },
    durationValue: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: colors.text,
    },
    durationLabel: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 4,
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
    },
    durationDivider: {
      width: 1,
      height: 36,
      backgroundColor: colors.borderLight,
    },
    progressBarContainer: {
      marginBottom: 18,
    },
    progressBarBg: {
      height: 8,
      borderRadius: 4,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      overflow: 'hidden' as const,
    },
    progressBarFill: {
      height: 8,
      borderRadius: 4,
    },
    zoneCard: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
      borderRadius: 12,
      padding: 14,
      marginBottom: 18,
      gap: 12,
    },
    zoneIcon: {
      fontSize: 28,
    },
    zoneInfo: {
      flex: 1,
    },
    zoneName: {
      fontSize: 15,
      fontWeight: '700' as const,
      marginBottom: 2,
    },
    zoneDesc: {
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 16,
    },
    miniStats: {
      flexDirection: 'row' as const,
      justifyContent: 'space-around' as const,
      marginBottom: 16,
    },
    miniStat: {
      alignItems: 'center' as const,
      gap: 4,
    },
    miniStatValue: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.text,
    },
    miniStatLabel: {
      fontSize: 11,
      color: colors.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.8,
    },
    cardFooter: {
      alignItems: 'center' as const,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    cardFooterText: {
      fontSize: 12,
      color: colors.textMuted,
      letterSpacing: 0.3,
    },
    statsSection: {
      marginBottom: 20,
    },
    insightRow: {
      flexDirection: 'row' as const,
      gap: 12,
    },
    insightCard: {
      flex: 1,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center' as const,
      gap: 8,
    },
    insightValue: {
      fontSize: 18,
      fontWeight: '700' as const,
    },
    insightLabel: {
      fontSize: 12,
      color: colors.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.8,
    },
    actionsSection: {
      gap: 12,
    },
    shareButton: {
      borderRadius: 16,
      overflow: 'hidden' as const,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    shareButtonGradient: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: 16,
      gap: 10,
    },
    shareButtonText: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: '#FFFFFF',
      flex: 1,
      textAlign: 'center' as const,
    },
    doneButton: {
      alignItems: 'center' as const,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    doneButtonText: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.textSecondary,
    },
    bottomSpacer: {
      height: 20,
    },
    errorText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center' as const,
      marginTop: 100,
    },
    closeBtn: {
      alignSelf: 'center' as const,
      marginTop: 20,
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: colors.primary,
      borderRadius: 12,
    },
    closeBtnText: {
      color: '#FFF',
      fontWeight: '600' as const,
    },
  });
}
