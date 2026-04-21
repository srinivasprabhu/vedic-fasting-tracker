import { fs } from '@/constants/theme';
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Platform, ViewStyle, TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { useTheme } from '@/contexts/ThemeContext';
import { useFasting } from '@/contexts/FastingContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import {
  generateMonthlyReport,
  markReportGenerated,
  MonthlyReportData,
} from '@/utils/monthly-report';
import { buildReportHTML } from '@/utils/report-html-template';
import RecapScoreHero from '@/components/recap/RecapScoreHero';
import RecapStatsGrid from '@/components/recap/RecapStatsGrid';
import RecapInsightsList from '@/components/recap/RecapInsightsList';
import RecapNextMonthCard from '@/components/recap/RecapNextMonthCard';
import RecapActionButtons from '@/components/recap/RecapActionButtons';
import ShareSummaryModal from '@/components/share/ShareSummaryModal';
import PdfPreviewModal from '@/components/paywall/PdfPreviewModal';
import type { ColorScheme } from '@/constants/colors';

export default function MonthlyRecapScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const { profile, isProUser } = useUserProfile();
  const { presentPaywall } = useRevenueCat();
  const { completedRecords } = useFasting();
  const params = useLocalSearchParams<{ month?: string; year?: string }>();

  const [data, setData] = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const profileNonNull = profile;

    let cancelled = false;

    async function load() {
      const monthRaw = params.month ? parseInt(params.month, 10) : new Date().getMonth() - 1;
      const yearRaw = params.year ? parseInt(params.year, 10) : new Date().getFullYear();
      const normalizedMonth = monthRaw < 0 ? 11 : monthRaw;
      const normalizedYear = monthRaw < 0 ? yearRaw - 1 : yearRaw;

      setLoading(true);
      try {
        const report = await generateMonthlyReport(
          normalizedMonth,
          normalizedYear,
          profileNonNull,
          completedRecords,
        );
        if (!cancelled) setData(report);
      } catch (e) {
        console.warn('[MonthlyRecap] load error:', e);
        if (!cancelled) {
          Alert.alert('Error', 'Could not load your report. Please try again.');
          router.back();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [profile, completedRecords, params.month, params.year]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const handlePreviewUnlock = useCallback(() => {
    setPreviewModalVisible(false);
    setTimeout(() => {
      void presentPaywall();
    }, 250);
  }, [presentPaywall]);

  const handleDownloadPdf = useCallback(async () => {
    if (!data || !profile) return;

    if (!isProUser) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPreviewModalVisible(true);
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGeneratingPdf(true);

    try {
      const Print = await import('expo-print');
      const html = buildReportHTML(data);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await markReportGenerated(data.month, data.year);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Aayu Report — ${data.monthLabel}`,
          UTI: 'com.adobe.pdf',
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.warn('[MonthlyRecap] PDF error:', e);
      Alert.alert('Error', 'Could not generate the PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  }, [data, profile, isProUser]);

  const handleShareSummary = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShareModalVisible(true);
  }, []);

  if (!profile) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <>
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerEyebrow}>MONTH {data.monthNumber} RECAP</Text>
          <Text style={styles.headerTitle}>{data.monthLabel}</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
          <X size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <RecapScoreHero
          score={data.metabolicScore}
          label={data.metabolicLabel}
          prevScore={data.prevMonth?.metabolicScore ?? null}
          isBaseline={data.isBaseline}
        />

        <RecapStatsGrid
          completedFasts={data.completedFasts}
          avgFastDuration={data.avgFastDuration}
          bestStreak={data.bestStreak}
          prevMonth={data.prevMonth}
        />

        <RecapInsightsList insights={data.insights} />

        <RecapNextMonthCard
          projectedScore={data.projectedScore}
          currentScore={data.metabolicScore}
          focusArea={data.nextMonthTargets.focusArea}
          targetFasts={data.nextMonthTargets.targetFasts}
        />

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.actionBar, { backgroundColor: colors.background, borderTopColor: colors.borderLight }]}>
        <RecapActionButtons
          onShare={handleShareSummary}
          onDownload={handleDownloadPdf}
          isProUser={isProUser}
          generatingPdf={generatingPdf}
        />
      </View>
    </SafeAreaView>
    <ShareSummaryModal
      visible={shareModalVisible}
      onClose={() => setShareModalVisible(false)}
      data={data}
    />
    <PdfPreviewModal
      visible={previewModalVisible}
      onClose={() => setPreviewModalVisible(false)}
      onUnlock={handlePreviewUnlock}
      monthLabel={data.monthLabel}
      metabolicScore={data.metabolicScore}
      metabolicLabel={data.metabolicLabel}
      completedFasts={data.completedFasts}
      totalFastingHours={data.totalFastingHours}
      bestStreak={data.bestStreak}
    />
    </>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background } as ViewStyle,
    loadingContainer: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    } as ViewStyle,
    headerTextCol: { flex: 1 } as ViewStyle,
    headerEyebrow: {
      fontSize: fs(10),
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 1.5,
      marginBottom: 4,
    } as TextStyle,
    headerTitle: {
      fontSize: fs(22),
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.5,
    } as TextStyle,
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    scroll: { flex: 1 } as ViewStyle,
    scrollContent: { paddingHorizontal: 20, paddingTop: 24 } as ViewStyle,
    actionBar: {
      position: 'absolute',
      left: 0, right: 0, bottom: 0,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: Platform.OS === 'ios' ? 34 : 20,
      borderTopWidth: 1,
    } as ViewStyle,
  });
}
