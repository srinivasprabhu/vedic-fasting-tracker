// components/MonthlyReportCard.tsx
// Card shown in the Insights tab for generating the monthly PDF report.
// Three states: Locked (free), Available (Pro), Already Generated (Pro, this month done).

import { fs } from '@/constants/theme';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  Animated, Easing, ActivityIndicator, Share, Platform,
  ViewStyle, TextStyle,
} from 'react-native';
import { FileText, Lock, Download, Check, Share2, BarChart3 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { useTheme } from '@/contexts/ThemeContext';
import { useFasting } from '@/contexts/FastingContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import {
  getReportAvailability,
  generateMonthlyReport,
  wasReportGeneratedThisMonth,
  markReportGenerated,
  ReportAvailability,
} from '@/utils/monthly-report';
import { buildReportHTML } from '@/utils/report-html-template';
import type { ColorScheme } from '@/constants/colors';

// ─── PDF generation ───────────────────────────────────────────────────────────
// We use expo-print to convert HTML → PDF, then expo-sharing to share.

async function generatePDF(html: string, _fileName: string): Promise<string | null> {
  try {
    const Print = await import('expo-print');
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    // expo-print returns a temp file URI that works with expo-sharing directly
    return uri;
  } catch (e) {
    console.warn('PDF generation failed:', e);
    return null;
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MonthlyReportCard() {
  const { colors, isDark } = useTheme();
  const { profile, isProUser } = useUserProfile();
  const { presentPaywall } = useRevenueCat();
  const { completedRecords } = useFasting();

  const [generating, setGenerating] = useState(false);
  const [alreadyGenerated, setAlreadyGenerated] = useState(false);
  const [lastPdfPath, setLastPdfPath] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }).start();
  }, []);

  // Check availability
  const availability: ReportAvailability = getReportAvailability(profile, completedRecords);

  // Check if already generated this month
  useEffect(() => {
    if (availability.month !== undefined && availability.year !== undefined) {
      wasReportGeneratedThisMonth(availability.month, availability.year).then(setAlreadyGenerated);
    }
  }, [availability.month, availability.year]);

  const handleGenerate = useCallback(async () => {
    if (!availability.available || !profile || availability.month === undefined || availability.year === undefined) return;

    // Free users: once per month
    if (!isProUser && alreadyGenerated) {
      Alert.alert(
        'Report already generated',
        `You've already generated your ${availability.monthLabel} report. Upgrade to Aayu Pro for unlimited report downloads.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGenerating(true);

    try {
      // 1. Aggregate data
      const reportData = await generateMonthlyReport(
        availability.month,
        availability.year,
        profile,
        completedRecords,
      );

      // 2. Build HTML
      const html = buildReportHTML(reportData);

      // 3. Generate PDF
      const fileName = `Aayu_Report_${reportData.monthLabel.replace(/\s/g, '_')}.pdf`;
      const pdfPath = await generatePDF(html, fileName);

      if (!pdfPath) {
        Alert.alert('Error', 'Failed to generate PDF. Please try again.');
        setGenerating(false);
        return;
      }

      setLastPdfPath(pdfPath);

      // 4. Mark as generated (for free user throttling)
      await markReportGenerated(availability.month, availability.year);
      setAlreadyGenerated(true);

      // 5. Share
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfPath, {
          mimeType: 'application/pdf',
          dialogTitle: `Aayu Monthly Report — ${reportData.monthLabel}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Report Ready', `Your report has been saved to ${pdfPath}`);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.warn('Report generation error:', e);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [availability, profile, completedRecords, isProUser, alreadyGenerated]);

  const handleShare = useCallback(async () => {
    if (!lastPdfPath) return;
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(lastPdfPath, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
        });
      }
    } catch {}
  }, [lastPdfPath]);

  // ── Locked state (free users) ─────────────────────────────────────────────
  if (!isProUser && !availability.available) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={() => void presentPaywall()}>
        <Animated.View style={[s.card, { opacity: fadeAnim, backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <View style={s.headerRow}>
            <View style={s.headerLeft}>
              <FileText size={16} color="#e8a84c" />
              <Text style={[s.title, { color: colors.text }]}>Monthly Report</Text>
            </View>
            <View style={s.proBadge}>
              <Lock size={9} color="#e8a84c" />
              <Text style={s.proText}>PRO</Text>
            </View>
          </View>
          <View style={[s.lockedBody, { backgroundColor: isDark ? 'rgba(232,168,76,0.04)' : 'rgba(200,135,42,0.03)' }]}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(232,168,76,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <BarChart3 size={18} color="#e8a84c" />
            </View>
            <Text style={[s.lockedTitle, { color: colors.text }]}>Monthly PDF Report</Text>
            <Text style={[s.lockedText, { color: colors.textMuted }]}>
              {availability.reason || 'Get a detailed analysis of your fasting journey delivered as a beautiful PDF report.'}
            </Text>
          </View>
          <Text style={[s.lockedFooter, { color: colors.textMuted }]}>
            Tap to upgrade to Pro and generate monthly reports
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  // ── Free user: available but locked ───────────────────────────────────────
  if (!isProUser && availability.available) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={() => void presentPaywall()}>
        <Animated.View style={[s.card, { opacity: fadeAnim, backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <View style={s.headerRow}>
            <View style={s.headerLeft}>
              <FileText size={16} color="#e8a84c" />
              <Text style={[s.title, { color: colors.text }]}>Monthly Report</Text>
            </View>
            <View style={s.proBadge}>
              <Lock size={9} color="#e8a84c" />
              <Text style={s.proText}>PRO</Text>
            </View>
          </View>
          <Text style={[s.availText, { color: colors.textSecondary }]}>
            Your {availability.monthLabel} report is ready. Tap to upgrade to Pro and download it.
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  // ── Pro user: available ───────────────────────────────────────────────────
  return (
    <Animated.View style={[s.card, { opacity: fadeAnim, backgroundColor: colors.card, borderColor: isDark ? 'rgba(122,174,121,0.2)' : 'rgba(58,122,57,0.15)' }]}>
      <View style={s.headerRow}>
        <View style={s.headerLeft}>
          <FileText size={16} color="#7AAE79" />
          <Text style={[s.title, { color: colors.text }]}>Monthly Report</Text>
        </View>
        {alreadyGenerated ? (
          <View style={[s.doneBadge, { backgroundColor: 'rgba(122,174,121,0.12)' }]}>
            <Check size={10} color="#7AAE79" />
            <Text style={[s.doneText, { color: '#7AAE79' }]}>Generated</Text>
          </View>
        ) : (
          <View style={[s.readyBadge, { backgroundColor: 'rgba(122,174,121,0.12)' }]}>
            <Text style={[s.readyText, { color: '#7AAE79' }]}>READY</Text>
          </View>
        )}
      </View>

      {availability.available ? (
        <>
          <Text style={[s.availText, { color: colors.textSecondary }]}>
            {alreadyGenerated
              ? `Your ${availability.monthLabel} report has been generated.`
              : `Your ${availability.monthLabel} report is ready to download.`}
          </Text>

          <View style={s.actionRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleGenerate}
              disabled={generating}
              style={[s.generateBtn, {
                backgroundColor: generating ? colors.surface : (isDark ? '#7AAE79' : '#3a7a39'),
              }]}
            >
              {generating ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <Download size={15} color="#fff" />
                  <Text style={s.generateText}>
                    {alreadyGenerated ? 'Download again' : 'Generate report'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {alreadyGenerated && lastPdfPath && (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleShare}
                style={[s.shareBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              >
                <Share2 size={15} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {!isProUser && (
            <Text style={[s.freeNote, { color: colors.textMuted }]}>
              Free tier: 1 report per month. Pro users can regenerate anytime.
            </Text>
          )}
        </>
      ) : (
        <Text style={[s.availText, { color: colors.textMuted }]}>
          {availability.reason}
        </Text>
      )}
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 } as ViewStyle,
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } as ViewStyle,
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 } as ViewStyle,
  title: { fontSize: fs(15), fontWeight: '700' } as TextStyle,
  proBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(232,168,76,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 } as ViewStyle,
  proText: { fontSize: fs(9), fontWeight: '800', color: '#e8a84c', letterSpacing: 0.8 } as TextStyle,
  doneBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 } as ViewStyle,
  doneText: { fontSize: fs(9), fontWeight: '700', letterSpacing: 0.5 } as TextStyle,
  readyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 } as ViewStyle,
  readyText: { fontSize: fs(9), fontWeight: '800', letterSpacing: 0.8 } as TextStyle,
  availText: { fontSize: fs(13), lineHeight: 18, marginBottom: 12 } as TextStyle,
  actionRow: { flexDirection: 'row', gap: 8, alignItems: 'center' } as ViewStyle,
  generateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 } as ViewStyle,
  generateText: { fontSize: fs(14), fontWeight: '600', color: '#fff' } as TextStyle,
  shareBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  freeNote: { fontSize: fs(10), textAlign: 'center', marginTop: 8 } as TextStyle,
  lockedBody: { borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 8 } as ViewStyle,
  lockedTitle: { fontSize: fs(14), fontWeight: '600', marginBottom: 4 } as TextStyle,
  lockedText: { fontSize: fs(12), textAlign: 'center', lineHeight: 17, paddingHorizontal: 8 } as TextStyle,
  lockedFooter: { fontSize: fs(11), textAlign: 'center' } as TextStyle,
});
