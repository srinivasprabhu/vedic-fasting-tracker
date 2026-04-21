import { fs } from '@/constants/theme';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import type { ColorScheme } from '@/constants/colors';
import {
  getNotificationsEnabled,
  enableNotifications,
  disableNotifications,
  getReminderBeforeFastStart,
  setReminderBeforeFastStart,
  getReminderBeforeFastEnd,
  setReminderBeforeFastEnd,
  getWaterRemindersEnabled,
  setWaterRemindersEnabled,
  getMonthlyRecapEnabled,
  setMonthlyRecapEnabled,
  scheduleMonthlyRecap,
  cancelMonthlyRecap,
  syncRecurringNotifications,
} from '@/utils/notifications';
import {
  describePlanReminderSchedule,
  formatWeeklyFastDaysShort,
  profileUsesWeeklyFastDays,
} from '@/utils/fastingPlanSchedule';
import { WeeklyFastDaysModal } from '@/components/WeeklyFastDaysModal';

export default function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const { profile, updateWeeklyFastDays } = useUserProfile();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [masterOn, setMasterOn] = useState(false);
  const [beforeStart, setBeforeStart] = useState(true);
  const [beforeEnd, setBeforeEnd] = useState(true);
  const [water, setWater] = useState(false);
  const [monthlyRecapEnabled, setMonthlyRecapEnabledState] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [showWeeklyDaysEdit, setShowWeeklyDaysEdit] = useState(false);

  useEffect(() => {
    (async () => {
      const [m, a, b, w, r] = await Promise.all([
        getNotificationsEnabled(),
        getReminderBeforeFastStart(),
        getReminderBeforeFastEnd(),
        getWaterRemindersEnabled(),
        getMonthlyRecapEnabled(),
      ]);
      setMasterOn(m);
      setBeforeStart(a);
      setBeforeEnd(b);
      setWater(w);
      setMonthlyRecapEnabledState(r);
      setHydrated(true);
    })();
  }, []);

  const planHint = profile ? describePlanReminderSchedule(profile) : null;
  const hasPlan = !!profile?.plan?.fastHours;
  const weeklyPlan = profileUsesWeeklyFastDays(profile);
  const weeklyTemplateId =
    profile?.plan?.planTemplateId === 'if_5_2' || profile?.plan?.planTemplateId === 'if_4_3'
      ? profile.plan.planTemplateId
      : null;

  const applySync = useCallback(async () => {
    const on = await getNotificationsEnabled();
    if (on) await syncRecurringNotifications(profile);
  }, [profile]);

  const handleMaster = useCallback(
    async (value: boolean) => {
      if (value) {
        const ok = await enableNotifications(profile);
        if (!ok) {
          Alert.alert(
            'Notifications disabled',
            'Allow notifications in system settings to use reminders.',
          );
          return;
        }
        setMasterOn(true);
      } else {
        await disableNotifications();
        setMasterOn(false);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [profile],
  );

  const handleBeforeStart = useCallback(
    async (value: boolean) => {
      await setReminderBeforeFastStart(value);
      setBeforeStart(value);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await applySync();
    },
    [applySync],
  );

  const handleBeforeEnd = useCallback(
    async (value: boolean) => {
      await setReminderBeforeFastEnd(value);
      setBeforeEnd(value);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await applySync();
    },
    [applySync],
  );

  const handleWater = useCallback(
    async (value: boolean) => {
      await setWaterRemindersEnabled(value);
      setWater(value);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await applySync();
    },
    [applySync],
  );

  const handleMonthlyRecapToggle = useCallback(
    async (value: boolean) => {
      setMonthlyRecapEnabledState(value);
      await setMonthlyRecapEnabled(value);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (value) {
        await scheduleMonthlyRecap(profile ?? null);
      } else {
        await cancelMonthlyRecap();
      }
    },
    [profile],
  );

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Stack.Screen
          options={{
            title: 'Notifications',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />
        <Text style={[styles.webNote, { color: colors.textMuted }]}>
          Notifications are not available on web.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '600' as const },
        }}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GENERAL</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Allow notifications</Text>
                <Text style={styles.rowDesc}>Master switch for Aayu reminders</Text>
              </View>
              <Switch
                value={masterOn}
                disabled={!hydrated}
                onValueChange={handleMaster}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FASTING (PLAN-BASED)</Text>
          <View style={styles.card}>
            {!hasPlan && (
              <Text style={[styles.banner, { color: colors.textMuted }]}>
                Complete profile setup with a fasting plan to unlock start/end window reminders. Default
                last meal time is 8:00 PM until you set it in onboarding.
              </Text>
            )}
            {planHint && hasPlan && (
              <Text style={[styles.banner, { color: colors.textMuted }]}>
                Using your {planHint.fastLabel} plan · ~{planHint.beforeStartLabel} (before fast) · ~
                {planHint.beforeEndLabel} (before eating window)
                {planHint.weeklyDaysNote ? `\n${planHint.weeklyDaysNote}` : ''}
              </Text>
            )}
            <View style={[styles.row, !masterOn && styles.rowMuted]}>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>1 hour before fast starts</Text>
                <Text style={styles.rowDesc}>Nudge before your usual fasting window</Text>
              </View>
              <Switch
                value={beforeStart}
                disabled={!hydrated || !masterOn}
                onValueChange={handleBeforeStart}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={[styles.row, !masterOn && styles.rowMuted]}>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>1 hour before fast ends</Text>
                <Text style={styles.rowDesc}>Only while a fast is running — 1h before your target end time</Text>
              </View>
              <Switch
                value={beforeEnd}
                disabled={!hydrated || !masterOn}
                onValueChange={handleBeforeEnd}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            {weeklyPlan && weeklyTemplateId && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={[styles.row, !masterOn && styles.rowMuted]}
                  disabled={!hydrated || !masterOn}
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowWeeklyDaysEdit(true);
                  }}
                >
                  <View style={styles.rowContent}>
                    <Text style={styles.rowLabel}>Fasting days (5:2 / 4:3)</Text>
                    <Text style={styles.rowDesc}>
                      {formatWeeklyFastDaysShort(profile?.plan?.weeklyFastDays) || 'Tap to choose'}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HYDRATION</Text>
          <View style={styles.card}>
            <View style={[styles.row, !masterOn && styles.rowMuted]}>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Water reminders</Text>
                <Text style={styles.rowDesc}>Every 2 hours from 8:00 AM – 8:00 PM</Text>
              </View>
              <Switch
                value={water}
                disabled={!hydrated || !masterOn}
                onValueChange={handleWater}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ALSO INCLUDED</Text>
          <View style={styles.card}>
            <View style={[styles.row, !masterOn && styles.rowMuted]}>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Monthly recap</Text>
                <Text style={styles.rowDesc}>
                  Your recap, delivered on the 1st of each month at 9:00 AM (when you have enough fasts
                  logged for the prior month)
                </Text>
              </View>
              <Switch
                value={monthlyRecapEnabled}
                disabled={!hydrated || !masterOn}
                onValueChange={handleMonthlyRecapToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.divider} />
            <Text style={[styles.footerNote, { color: colors.textMuted }]}>
              With this master switch on, you also get a weekly summary (Sunday ~6 PM). Fast
              milestones and post-fast tips use system notification permission and fire around active
              fasts — they are not controlled by the fasting toggles above.
            </Text>
          </View>
        </View>

        {__DEV__ && (
          <TouchableOpacity
            style={{
              marginTop: 8,
              marginHorizontal: 20,
              padding: 12,
              borderRadius: 8,
              backgroundColor: colors.surface,
              alignItems: 'center',
            }}
            onPress={async () => {
              const NotificationsMod = await import('expo-notifications');
              await NotificationsMod.scheduleNotificationAsync({
                content: {
                  title: 'Your monthly recap is ready ✨',
                  body: 'Tap to see last month\'s recap.',
                  sound: true,
                  data: { type: 'monthly_recap' },
                },
                trigger: {
                  type: NotificationsMod.SchedulableTriggerInputTypes.TIME_INTERVAL,
                  seconds: 5,
                },
              });
              Alert.alert(
                'Test notification scheduled',
                'Will fire in 5 seconds. Lock the device to see it.',
              );
            }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              [DEV] Fire monthly recap test notification
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {weeklyTemplateId && (
        <WeeklyFastDaysModal
          visible={showWeeklyDaysEdit}
          planTemplateId={weeklyTemplateId}
          initialDays={profile?.plan?.weeklyFastDays}
          onClose={() => setShowWeeklyDaysEdit(false)}
          onConfirm={(days) => {
            updateWeeklyFastDays(days);
            setShowWeeklyDaysEdit(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }}
        />
      )}
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    section: { marginBottom: 24 },
    sectionTitle: {
      fontSize: fs(12),
      fontWeight: '600' as const,
      color: colors.textMuted,
      letterSpacing: 1,
      marginBottom: 10,
      marginLeft: 4,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      overflow: 'hidden' as const,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 12,
    },
    rowMuted: { opacity: 0.45 },
    rowContent: { flex: 1 },
    rowLabel: {
      fontSize: fs(16),
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 4,
    },
    rowDesc: {
      fontSize: fs(13),
      color: colors.textMuted,
      lineHeight: 18,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderLight,
      marginLeft: 16,
    },
    banner: {
      fontSize: fs(13),
      lineHeight: 19,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 8,
    },
    footerNote: {
      fontSize: fs(13),
      lineHeight: 20,
      padding: 16,
    },
    bottomSpacer: { height: 24 },
    webNote: { padding: 24, textAlign: 'center' as const },
  });
}
