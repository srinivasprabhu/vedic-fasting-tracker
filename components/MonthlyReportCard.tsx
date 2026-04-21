// components/MonthlyReportCard.tsx
// Card shown in the Insights tab for generating the monthly PDF report.
// Three states: Locked (free), Available (Pro), Already Generated (Pro, this month done).

import { fs } from '@/constants/theme';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  Animated, Easing, Platform,
  ViewStyle, TextStyle,
} from 'react-native';
import { router } from 'expo-router';
import { FileText, Lock, Download, Check, BarChart3 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useFasting } from '@/contexts/FastingContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import {
  getReportAvailability,
  wasReportGeneratedThisMonth,
  ReportAvailability,
} from '@/utils/monthly-report';
import type { ColorScheme } from '@/constants/colors';

// ─── Main component ───────────────────────────────────────────────────────────

export default function MonthlyReportCard() {
  const { colors, isDark } = useTheme();
  const { profile, isProUser } = useUserProfile();
  const { presentPaywall } = useRevenueCat();
  const { completedRecords } = useFasting();

  const [alreadyGenerated, setAlreadyGenerated] = useState(false);

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

  const handleOpenRecap = useCallback(() => {
    if (!availability.available || availability.month === undefined || availability.year === undefined) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/monthly-recap',
      params: {
        month: String(availability.month),
        year: String(availability.year),
      },
    });
  }, [availability]);

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
              onPress={handleOpenRecap}
              style={[s.generateBtn, {
                backgroundColor: isDark ? '#7AAE79' : '#3a7a39',
              }]}
            >
              <Download size={15} color="#fff" />
              <Text style={s.generateText}>
                {availability.monthLabel
                  ? `View your ${availability.monthLabel} recap`
                  : 'View monthly recap'}
              </Text>
            </TouchableOpacity>
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
