import { fs } from '@/constants/theme';
import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
  TextStyle,
  Platform,
  type DimensionValue,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { X, Lock, Check, Flame, Clock, TrendingUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorScheme } from '@/constants/colors';

const TEASER_BULLETS = [
  'Your daily rhythm map — exact start & break times',
  'Behaviour intelligence — weekend drop-off, recovery rate',
  'Month-over-month progression with projected score',
  'Personalised next-month plan — 4 specific actions',
];

export interface PdfPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  onUnlock: () => void;
  monthLabel: string;
  metabolicScore: number;
  metabolicLabel: string;
  completedFasts: number;
  totalFastingHours: number;
  bestStreak: number;
}

function PdfPageMockup({
  metabolicScore,
  metabolicLabel,
  completedFasts,
  totalFastingHours,
  bestStreak,
}: Pick<
  PdfPreviewModalProps,
  'metabolicScore' | 'metabolicLabel' | 'completedFasts' | 'totalFastingHours' | 'bestStreak'
>) {
  const hoursLabel =
    totalFastingHours >= 10 ? `${Math.round(totalFastingHours)}h` : `${totalFastingHours.toFixed(1)}h`;
  const barWidths: DimensionValue[] = ['92%', '78%', '85%', '70%'];
  return (
    <View style={mockStyles.mockupCard}>
      <Text style={mockStyles.mockupHeader}>AAYU</Text>
      <Text style={mockStyles.mockupScoreLabel}>METABOLIC DISCIPLINE SCORE</Text>
      <Text style={mockStyles.mockupScoreValue}>{metabolicScore}</Text>
      <Text style={mockStyles.mockupSubLabel} numberOfLines={2}>
        {metabolicLabel}
      </Text>
      <View style={mockStyles.mockupBars}>
        {barWidths.map((w, i) => (
          <View key={i} style={[mockStyles.mockupBar, { width: w }]} />
        ))}
      </View>
      <View style={mockStyles.mockupStats}>
        <View style={mockStyles.mockupStat}>
          <Flame size={14} color="#c8872a" />
          <Text style={mockStyles.mockupStatValue}>{completedFasts}</Text>
        </View>
        <View style={mockStyles.mockupStat}>
          <Clock size={14} color="#c8872a" />
          <Text style={mockStyles.mockupStatValue}>{hoursLabel}</Text>
        </View>
        <View style={mockStyles.mockupStat}>
          <TrendingUp size={14} color="#c8872a" />
          <Text style={mockStyles.mockupStatValue}>{bestStreak}d</Text>
        </View>
      </View>
      <View style={mockStyles.mockupLines}>
        <View style={[mockStyles.mockupLine, { width: '80%' }]} />
        <View style={[mockStyles.mockupLine, { width: '65%' }]} />
        <View style={[mockStyles.mockupLine, { width: '70%' }]} />
      </View>
    </View>
  );
}

const mockStyles = StyleSheet.create({
  mockupCard: {
    flex: 1,
    backgroundColor: '#1a1008',
    padding: 24,
    justifyContent: 'flex-start',
  } as ViewStyle,
  mockupHeader: {
    color: '#c8872a',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
  } as TextStyle,
  mockupScoreLabel: {
    color: '#8c7a6a',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginTop: 20,
    textAlign: 'center',
  } as TextStyle,
  mockupScoreValue: {
    color: '#e8a84c',
    fontSize: 56,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: -2,
    textAlign: 'center',
  } as TextStyle,
  mockupSubLabel: {
    color: '#f0e0c0',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  } as TextStyle,
  mockupBars: { marginTop: 16, gap: 8 } as ViewStyle,
  mockupBar: {
    height: 6,
    backgroundColor: '#c8872a',
    borderRadius: 3,
    opacity: 0.75,
    alignSelf: 'center',
  } as ViewStyle,
  mockupStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 18,
  } as ViewStyle,
  mockupStat: { flexDirection: 'row', alignItems: 'center', gap: 5 } as ViewStyle,
  mockupStatValue: { color: '#f0e0c0', fontSize: 13, fontWeight: '700' } as TextStyle,
  mockupLines: { marginTop: 20, gap: 6, alignItems: 'center' } as ViewStyle,
  mockupLine: { height: 8, backgroundColor: '#4a3020', borderRadius: 4 } as ViewStyle,
});

export default function PdfPreviewModal({
  visible,
  onClose,
  onUnlock,
  monthLabel,
  metabolicScore,
  metabolicLabel,
  completedFasts,
  totalFastingHours,
  bestStreak,
}: PdfPreviewModalProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const handleUnlock = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUnlock();
  }, [onUnlock]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.headerTextCol}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>AAYU PRO</Text>
            <Text style={[styles.title, { color: colors.text }]}>Your full {monthLabel} report</Text>
          </View>
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.surface }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.teaserCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Text style={[styles.teaserLead, { color: colors.textMuted }]}>Your full report includes</Text>
            <Text style={[styles.teaserHeader, { color: colors.text }]}>{"What's inside"}</Text>
            {TEASER_BULLETS.map((text, i) => (
              <View key={i} style={styles.teaserRow}>
                <View style={[styles.teaserCheck, { backgroundColor: colors.successLight }]}>
                  <Check size={12} color={colors.success} />
                </View>
                <Text style={[styles.teaserText, { color: colors.textSecondary }]}>{text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.previewWrap}>
            <Text style={[styles.previewLabel, { color: colors.textMuted }]}>PAGE 1 PREVIEW</Text>
            <View style={[styles.previewImageWrap, { backgroundColor: colors.card }]}>
              <View style={StyleSheet.absoluteFill}>
                <PdfPageMockup
                  metabolicScore={metabolicScore}
                  metabolicLabel={metabolicLabel}
                  completedFasts={completedFasts}
                  totalFastingHours={totalFastingHours}
                  bestStreak={bestStreak}
                />
              </View>
              <BlurView
                intensity={Platform.OS === 'ios' ? 28 : 22}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.previewFade} pointerEvents="none" />
              <View style={styles.lockOverlay} pointerEvents="none">
                <View style={[styles.lockCircle, { backgroundColor: colors.primary }]}>
                  <Lock size={28} color="#fff" />
                </View>
              </View>
            </View>
          </View>

          <Text style={[styles.trustLine, { color: colors.textMuted }]}>
            4–5 pages · personalised insights · PDF you can save and share
          </Text>
        </ScrollView>

        <View
          style={[styles.actionBar, { backgroundColor: colors.background, borderTopColor: colors.borderLight }]}
        >
          <TouchableOpacity
            style={[styles.unlockBtn, { backgroundColor: colors.primary }]}
            onPress={handleUnlock}
            activeOpacity={0.85}
          >
            <Lock size={15} color="#fff" />
            <Text style={styles.unlockLabel}>Unlock Aayu Pro</Text>
          </TouchableOpacity>
          <Text style={[styles.fineprint, { color: colors.textMuted }]}>
            Cancel anytime from Settings. Restores across devices.
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background } as ViewStyle,
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 18,
    } as ViewStyle,
    headerTextCol: { flex: 1, paddingRight: 8 } as ViewStyle,
    eyebrow: {
      fontSize: fs(10),
      fontWeight: '800',
      letterSpacing: 1.5,
      marginBottom: 4,
    } as TextStyle,
    title: {
      fontSize: fs(20),
      fontWeight: '700',
      letterSpacing: -0.3,
    } as TextStyle,
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    scroll: { flex: 1 } as ViewStyle,
    scrollContent: { paddingHorizontal: 20, paddingBottom: 120 } as ViewStyle,
    teaserCard: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 18,
      marginBottom: 20,
    } as ViewStyle,
    teaserLead: {
      fontSize: fs(12),
      fontWeight: '600',
      marginBottom: 4,
    } as TextStyle,
    teaserHeader: {
      fontSize: fs(15),
      fontWeight: '700',
      marginBottom: 14,
    } as TextStyle,
    teaserRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 12,
    } as ViewStyle,
    teaserCheck: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    } as ViewStyle,
    teaserText: { fontSize: fs(13), lineHeight: 19, flex: 1 } as TextStyle,
    previewWrap: { alignItems: 'center', marginBottom: 16 } as ViewStyle,
    previewLabel: {
      fontSize: fs(10),
      fontWeight: '700',
      letterSpacing: 1.5,
      marginBottom: 10,
    } as TextStyle,
    previewImageWrap: {
      width: '100%',
      aspectRatio: 210 / 297,
      borderRadius: 16,
      overflow: 'hidden',
      position: 'relative',
    } as ViewStyle,
    previewFade: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '32%',
      backgroundColor: colors.background,
      opacity: 0.72,
    } as ViewStyle,
    lockOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    lockCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    trustLine: {
      fontSize: fs(12),
      textAlign: 'center',
      marginTop: 4,
    } as TextStyle,
    actionBar: {
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: Platform.OS === 'ios' ? 12 : 18,
      borderTopWidth: 1,
    } as ViewStyle,
    unlockBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 15,
      borderRadius: 14,
    } as ViewStyle,
    unlockLabel: {
      fontSize: fs(15),
      fontWeight: '700',
      color: '#fff',
      letterSpacing: 0.2,
    } as TextStyle,
    fineprint: {
      fontSize: fs(11),
      textAlign: 'center',
      marginTop: 8,
    } as TextStyle,
  });
}
