import { fs } from '@/constants/theme';
import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Platform, Animated, Switch, Linking,
  ViewStyle, TextStyle, DevSettings,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  User, Bell, Info, ChevronRight, Moon, Sun, X, Check,
  Edit3, LogOut, LogIn, Scale, Ruler, Target, Flame,
  Droplets, Activity, Clock, Heart, Star, Mail, Shield,
  FileText, Calendar, Flag, RotateCcw, LineChart,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getNotificationsEnabled } from '@/utils/notifications';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { getAge, calcBMI, getBMICategory, bmiCategoryLabel, kgToLbs, cmToFtIn, formatWater, formatSteps, purposeLabel, activityLabel } from '@/utils/calculatePlan';
import type { WeightUnit } from '@/types/user';
import type { ColorScheme } from '@/constants/colors';
import { ONBOARDING_COMPLETE_KEY, PROFILE_STORAGE_KEY, TRADITIONAL_INSIGHTS_KEY } from '@/constants/storageKeys';
import { uploadLocalRecords } from '@/lib/sync';
import { applyDevFastingSeed } from '@/utils/dev-seed-fasting-history';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function planDisplayName(productId: string): string {
  const id = productId.toLowerCase();
  if (id.includes('lifetime')) return 'Lifetime';
  if (id.includes('year')) return 'Yearly';
  if (id.includes('month')) return 'Monthly';
  return productId;
}

function formatRenewalDate(iso: string | null): string {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }); }
  catch { return iso; }
}

function displayAge(profile: any): string {
  if (profile?.dob) {
    const age = getAge(profile);
    return `${age} years`;
  }
  if (profile?.ageGroup) {
    const labels: Record<string, string> = {
      under_18: 'Under 18', '18_25': '18–25', '26_35': '26–35',
      '36_45': '36–45', '46_55': '46–55', '56_65': '56–65', '65_plus': '65+',
    };
    return labels[profile.ageGroup] ?? 'Not set';
  }
  return 'Not set';
}

function displayWeight(kg: number | undefined, unit: WeightUnit | undefined): string {
  if (!kg) return '—';
  return unit === 'lbs' ? `${kgToLbs(kg).toFixed(1)} lbs` : `${kg.toFixed(1)} kg`;
}

function displayHeight(cm: number | undefined): string {
  if (!cm) return '—';
  return `${cm.toFixed(0)} cm (${cmToFtIn(cm)})`;
}

function displaySex(sex: string | undefined): string {
  if (!sex) return 'Not set';
  return sex === 'male' ? 'Male' : sex === 'female' ? 'Female' : 'Not specified';
}

function fastingWindowDisplay(lastMealTime: string | undefined, fastHours: number | undefined): string | null {
  if (!lastMealTime || !fastHours) return null;
  const mealHourMap: Record<string, number> = { '7pm': 19, '8pm': 20, '9pm': 21, '10pm': 22, 'later': 23 };
  const startHour = mealHourMap[lastMealTime];
  if (!startHour) return null;
  const endHour = (startHour + fastHours) % 24;
  const fmt = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${display} ${period}`;
  };
  return `${fmt(startHour)} → ${fmt(endHour)}`;
}

// ─── Row components ───────────────────────────────────────────────────────────

const InfoRow: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  sublabel?: string;
  colors: ColorScheme;
  onPress?: () => void;
}> = ({ icon, iconBg, label, value, sublabel, colors, onPress }) => {
  const Content = (
    <View style={r.row}>
      <View style={[r.iconWrap, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={r.content}>
        <Text style={[r.label, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[r.value, { color: colors.text }]}>{value}</Text>
        {sublabel && <Text style={[r.sublabel, { color: colors.textMuted }]}>{sublabel}</Text>}
      </View>
      {onPress && <ChevronRight size={16} color={colors.textMuted} />}
    </View>
  );
  if (onPress) {
    return <TouchableOpacity activeOpacity={0.7} onPress={onPress}>{Content}</TouchableOpacity>;
  }
  return Content;
};

const r = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 } as ViewStyle,
  iconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  content: { flex: 1 } as ViewStyle,
  label: { fontSize: fs(11), fontWeight: '500', letterSpacing: 0.3, marginBottom: 1 } as TextStyle,
  value: { fontSize: fs(15), fontWeight: '600' } as TextStyle,
  sublabel: { fontSize: fs(11), marginTop: 1 } as TextStyle,
});

const Divider: React.FC<{ colors: ColorScheme }> = ({ colors }) => (
  <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.borderLight, marginLeft: 60 }} />
);

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const queryClient = useQueryClient();
  const { colors, isDark, toggleTheme, followsSystem } = useTheme();
  const { user, isAuthenticated, signOut } = useAuth();
  const { profile, updateProfile, getInitial, isProUser, toggleProUser } = useUserProfile();
  const {
    hasStoreEntitlement, devProOverride, subscriptionInfo,
    presentPaywall, presentCustomerCenter, restorePurchases,
  } = useRevenueCat();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState(profile?.name ?? '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [traditionalInsights, setTraditionalInsights] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => { Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start(); }, []);
  React.useEffect(() => { getNotificationsEnabled().then(setNotificationsEnabled); }, []);
  useFocusEffect(useCallback(() => { getNotificationsEnabled().then(setNotificationsEnabled); }, []));
  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem(TRADITIONAL_INSIGHTS_KEY).then((v) => {
      setTraditionalInsights(v === '1' || v === 'true');
    });
  }, []));

  const replaySplashAndOnboarding = useCallback(() => {
    Alert.alert(
      'Replay splash + onboarding',
      'Clears onboarding completion on this device and reloads the app. You will see the branded splash, then onboarding. Your profile and account stay on this device unless you use full new-user flow below.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reload',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
            DevSettings.reload();
          },
        },
      ],
    );
  }, []);

  const replayFullNewUserFlow = useCallback(() => {
    Alert.alert(
      'Replay full new-user flow',
      'Clears onboarding completion and local profile data, then reloads. After onboarding you will go to profile setup. Supabase session may still be active—sign out first for a fully clean test.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reload',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove([ONBOARDING_COMPLETE_KEY, PROFILE_STORAGE_KEY]);
            DevSettings.reload();
          },
        },
      ],
    );
  }, []);

  const seedDevFastingHistory = useCallback(() => {
    Alert.alert(
      'Seed ~4 months of fasting data',
      'Adds about 120 days of completed fasts: oldest ~2 weeks 5:2 (Mon/Thu 24h), next ~2 weeks daily 16:8, then daily 18:6. Replaces any previous dev seed rows; your current in-progress fast is kept. Supabase upload runs in the background if you are signed in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Seed',
          onPress: async () => {
            try {
              const n = await applyDevFastingSeed();
              queryClient.invalidateQueries({ queryKey: ['fasting-records'] });
              if (isAuthenticated && user?.id) void uploadLocalRecords(user.id);
              Alert.alert('Done', `Added ${n} synthetic fast records.`);
            } catch (e) {
              console.warn('dev seed fasting', e);
              Alert.alert('Seed failed', String(e));
            }
          },
        },
      ],
    );
  }, [queryClient, isAuthenticated, user?.id]);

  const plan = profile?.plan;
  const weightUnit = profile?.weightUnit ?? 'kg';
  const bmi = (profile?.currentWeightKg && profile?.heightCm) ? calcBMI(profile.currentWeightKg, profile.heightCm) : null;
  const bmiCat = bmi ? getBMICategory(bmi) : null;
  const fastWindow = fastingWindowDisplay(profile?.lastMealTime, plan?.fastHours);

  const handleSaveName = useCallback(() => {
    if (editName.trim().length === 0) { Alert.alert('Name required'); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (profile) updateProfile({ ...profile, name: editName.trim() });
    setEditingName(false);
  }, [editName, profile, updateProfile]);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Your data will remain on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } },
    ]);
  }, [signOut]);

  const goldColor = isDark ? '#e8a84c' : '#a06820';
  const greenColor = isDark ? '#7AAE79' : '#3a7a39';

  return (
    <View style={s.root}>
      <Stack.Screen options={{
        title: 'Settings',
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '600' },
      }} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ─── Profile header ──────────────────────────────────────── */}
          <View style={s.header}>
            <View style={[s.avatar, { backgroundColor: colors.primary }]}>
              <Text style={s.avatarText}>{getInitial()}</Text>
            </View>
            <View style={s.headerMeta}>
              {editingName ? (
                <View style={s.nameEditRow}>
                  <TextInput
                    style={[s.nameInput, { color: colors.text, borderBottomColor: colors.primary }]}
                    value={editName}
                    onChangeText={setEditName}
                    autoFocus maxLength={30}
                    onSubmitEditing={handleSaveName}
                  />
                  <TouchableOpacity onPress={handleSaveName} style={[s.nameBtn, { backgroundColor: colors.primary }]}>
                    <Check size={14} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditingName(false)} style={[s.nameBtn, { backgroundColor: colors.surface }]}>
                    <X size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => { setEditName(profile?.name ?? ''); setEditingName(true); }} style={s.nameRow}>
                  <Text style={[s.profileName, { color: colors.text }]}>{profile?.name ?? 'Friend'}</Text>
                  <Edit3 size={13} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              <Text style={[s.profileSub, { color: colors.textMuted }]}>
                {isProUser && <Text style={{ color: goldColor }}>✦ Pro · </Text>}
                Fasting since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'recently'}
              </Text>
            </View>
          </View>

          {/* ─── Body metrics ────────────────────────────────────────── */}
          <Text style={[s.sectionTitle, { color: colors.textMuted }]}>BODY METRICS</Text>
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <InfoRow icon={<User size={15} color={colors.primary} />} iconBg={colors.primaryLight} label="Sex" value={displaySex(profile?.sex)} colors={colors} />
            <Divider colors={colors} />
            <InfoRow icon={<Calendar size={15} color="#E8913A" />} iconBg={colors.warningLight} label="Age" value={displayAge(profile)} colors={colors} />
            <Divider colors={colors} />
            <InfoRow icon={<Ruler size={15} color="#5b8dd9" />} iconBg="rgba(91,141,217,0.12)" label="Height" value={displayHeight(profile?.heightCm)} colors={colors} />
            <Divider colors={colors} />
            <InfoRow icon={<Scale size={15} color={goldColor} />} iconBg="rgba(232,168,76,0.12)" label="Current weight" value={displayWeight(profile?.currentWeightKg, profile?.weightUnit)} colors={colors}
              onPress={() => router.push('/(tabs)/(home)/weight' as any)} />
            <Divider colors={colors} />
            <InfoRow icon={<Target size={15} color={greenColor} />} iconBg="rgba(122,174,121,0.12)" label="Goal weight" value={profile?.goalWeightKg ? displayWeight(profile.goalWeightKg, profile.weightUnit) : '—'} colors={colors} />
            {bmi && (
              <>
                <Divider colors={colors} />
                <InfoRow icon={<Heart size={15} color="#C25450" />} iconBg="rgba(194,84,80,0.12)" label="BMI" value={`${bmi.toFixed(1)} · ${bmiCategoryLabel(bmiCat)}`} colors={colors} />
              </>
            )}
          </View>

          {/* ─── My plan ─────────────────────────────────────────────── */}
          {plan && (
            <>
              <Text style={[s.sectionTitle, { color: colors.textMuted }]}>MY PLAN</Text>
              <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <InfoRow icon={<Clock size={15} color={goldColor} />} iconBg="rgba(232,168,76,0.12)" label="Fasting plan" value={`${plan.fastLabel} Intermittent Fasting`}
                  sublabel={profile?.fastingPurpose ? purposeLabel(profile.fastingPurpose) : undefined} colors={colors} />
                {fastWindow && (
                  <>
                    <Divider colors={colors} />
                    <InfoRow icon={<Moon size={15} color="#5b8dd9" />} iconBg="rgba(91,141,217,0.12)" label="Fasting window" value={fastWindow}
                      sublabel="Based on your usual last meal" colors={colors} />
                  </>
                )}
                <Divider colors={colors} />
                <InfoRow icon={<Flame size={15} color="#E8913A" />} iconBg="rgba(232,145,58,0.12)" label="Daily calories" value={`${plan.dailyCalories.toLocaleString()} kcal`}
                  sublabel={plan.dailyDeficit > 0 ? `${plan.dailyDeficit} kcal deficit` : undefined} colors={colors} />
                <Divider colors={colors} />
                <InfoRow icon={<Droplets size={15} color="#5b8dd9" />} iconBg="rgba(91,141,217,0.12)" label="Water target" value={formatWater(plan.dailyWaterMl)} colors={colors} />
                <Divider colors={colors} />
                <InfoRow icon={<Activity size={15} color={greenColor} />} iconBg="rgba(122,174,121,0.12)" label="Steps target" value={formatSteps(plan.dailySteps)} colors={colors} />
                {plan.weeksToGoal && (
                  <>
                    <Divider colors={colors} />
                    <InfoRow icon={<Target size={15} color={goldColor} />} iconBg="rgba(232,168,76,0.12)" label="Estimated timeline" value={`~${plan.weeksToGoal} weeks`}
                      sublabel="Based on your current plan" colors={colors} />
                  </>
                )}
                <Divider colors={colors} />
                <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={s.actionRow}>
                  <Text style={[s.actionText, { color: colors.primary }]}>Change fasting plan</Text>
                  <ChevronRight size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ─── App settings ────────────────────────────────────────── */}
          <Text style={[s.sectionTitle, { color: colors.textMuted }]}>APP SETTINGS</Text>
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <View style={r.row}>
              <View style={[r.iconWrap, { backgroundColor: isDark ? colors.warningLight : colors.primaryLight }]}>
                {isDark ? <Moon size={15} color={colors.warning} /> : <Sun size={15} color={colors.primary} />}
              </View>
              <View style={r.content}>
                <Text style={[r.label, { color: colors.textMuted }]}>Appearance</Text>
                <Text style={[r.value, { color: colors.text }]}>{isDark ? 'Dark' : 'Light'}</Text>
                {followsSystem && (
                  <Text style={[r.sublabel, { color: colors.textMuted }]}>
                    Following device appearance
                  </Text>
                )}
              </View>
              <Switch value={isDark} onValueChange={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleTheme(); }}
                trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" />
            </View>
            <Divider colors={colors} />
            <View style={r.row}>
              <View style={[r.iconWrap, { backgroundColor: 'rgba(232,168,76,0.12)' }]}>
                <Flame size={15} color={goldColor} />
              </View>
              <View style={r.content}>
                <Text style={[r.label, { color: colors.textMuted }]}>Traditional daily quotes</Text>
                <Text style={[r.value, { color: colors.text }]}>{traditionalInsights ? 'On' : 'Off'}</Text>
                <Text style={[r.sublabel, { color: colors.textMuted }]}>
                  Classical inspiration on Today (neutral quotes by default)
                </Text>
              </View>
              <Switch
                value={traditionalInsights}
                onValueChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setTraditionalInsights(v);
                  void AsyncStorage.setItem(TRADITIONAL_INSIGHTS_KEY, v ? 'true' : 'false');
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
            <Divider colors={colors} />
            <InfoRow icon={<Bell size={15} color={colors.accent} />} iconBg={colors.accentLight} label="Notifications" value={notificationsEnabled ? 'On' : 'Off'}
              sublabel={notificationsEnabled ? 'Fasting & water reminders' : 'Tap to configure'} colors={colors}
              onPress={() => router.push('/notification-settings' as any)} />
            <Divider colors={colors} />
            <View style={r.row}>
              <View style={[r.iconWrap, { backgroundColor: 'rgba(232,168,76,0.12)' }]}>
                <Scale size={15} color={goldColor} />
              </View>
              <View style={r.content}>
                <Text style={[r.label, { color: colors.textMuted }]}>Weight unit</Text>
                <Text style={[r.value, { color: colors.text }]}>{weightUnit === 'lbs' ? 'Pounds (lbs)' : 'Kilograms (kg)'}</Text>
              </View>
              <Switch value={weightUnit === 'lbs'} onValueChange={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (profile) {
                  const newUnit: WeightUnit = weightUnit === 'kg' ? 'lbs' : 'kg';
                  updateProfile({ ...profile, weightUnit: newUnit });
                }
              }} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" />
            </View>
          </View>

          {/* ─── Subscription ────────────────────────────────────────── */}
          <Text style={[s.sectionTitle, { color: colors.textMuted }]}>SUBSCRIPTION</Text>
          <View style={[s.card, { backgroundColor: colors.card, borderColor: hasStoreEntitlement ? `${greenColor}40` : colors.borderLight }]}>
            {hasStoreEntitlement ? (
              <>
                <InfoRow icon={<Check size={15} color={greenColor} />} iconBg="rgba(122,174,121,0.12)" label="Aayu Pro" value="Active"
                  sublabel={subscriptionInfo
                    ? subscriptionInfo.isLifetime ? 'Lifetime access'
                    : subscriptionInfo.willRenew && subscriptionInfo.expiresDate ? `${planDisplayName(subscriptionInfo.productId)} · Renews ${formatRenewalDate(subscriptionInfo.expiresDate)}`
                    : subscriptionInfo.expiresDate ? `Access until ${formatRenewalDate(subscriptionInfo.expiresDate)}` : planDisplayName(subscriptionInfo.productId)
                    : 'All Pro features unlocked'} colors={colors} />
                <Divider colors={colors} />
                <TouchableOpacity activeOpacity={0.7} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); void presentCustomerCenter(); }} style={s.actionRow}>
                  <Text style={[s.actionText, { color: colors.primary }]}>Manage subscription</Text>
                  <ChevronRight size={16} color={colors.primary} />
                </TouchableOpacity>
              </>
            ) : __DEV__ && devProOverride ? (
              <InfoRow icon={<Text style={{ fontSize: fs(13) }}>✦</Text>} iconBg="rgba(232,168,76,0.12)" label="Pro (dev override)" value="Active via developer toggle" colors={colors} />
            ) : (
              <InfoRow icon={<Text style={{ fontSize: fs(13) }}>✦</Text>} iconBg="rgba(232,168,76,0.12)" label="Aayu Pro" value="Unlock advanced features"
                sublabel="Insights, reports, advanced plans" colors={colors} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); void presentPaywall(); }} />
            )}
            <Divider colors={colors} />
            <TouchableOpacity activeOpacity={0.7} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); void restorePurchases(); }} style={s.actionRow}>
              <Text style={[s.actionText, { color: colors.textSecondary }]}>Restore purchases</Text>
            </TouchableOpacity>
          </View>

          {/* ─── Account ─────────────────────────────────────────────── */}
          <Text style={[s.sectionTitle, { color: colors.textMuted }]}>ACCOUNT</Text>
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            {isAuthenticated && user ? (
              <>
                <InfoRow icon={<User size={15} color={colors.primary} />} iconBg={colors.primaryLight} label="Signed in as" value={user.email ?? 'Account'} colors={colors} />
                <Divider colors={colors} />
                <TouchableOpacity activeOpacity={0.7} onPress={handleSignOut} style={s.actionRow}>
                  <Text style={[s.actionText, { color: colors.error }]}>Sign out</Text>
                </TouchableOpacity>
              </>
            ) : (
              <InfoRow icon={<LogIn size={15} color={colors.primary} />} iconBg={colors.primaryLight} label="Sign in" value="Save your data across devices"
                colors={colors} onPress={() => router.push('/sign-in' as any)} />
            )}
          </View>

          {/* ─── About ───────────────────────────────────────────────── */}
          <Text style={[s.sectionTitle, { color: colors.textMuted }]}>ABOUT</Text>
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <InfoRow icon={<Info size={15} color={colors.primary} />} iconBg={colors.primaryLight} label="Aayu" value="Intermittent Fasting"
              sublabel="Version 1.0.3 · Designed in the United Kingdom" colors={colors} />
            <Divider colors={colors} />
            <InfoRow icon={<Star size={15} color={goldColor} />} iconBg="rgba(232,168,76,0.12)" label="Rate Aayu" value="Leave a review"
              colors={colors} onPress={() => {
                const url = Platform.OS === 'ios'
                  ? 'https://apps.apple.com/app/aayu-intermittent-fasting/id0000000000' // TODO: real ID
                  : 'https://play.google.com/store/apps/details?id=com.vedicintermittentfasting.app';
                Linking.openURL(url);
              }} />
            <Divider colors={colors} />
            <InfoRow icon={<Mail size={15} color="#5b8dd9" />} iconBg="rgba(91,141,217,0.12)" label="Support" value="support@aayu.health"
              colors={colors} onPress={() => Linking.openURL('mailto:support@aayu.health')} />
            <Divider colors={colors} />
            <InfoRow icon={<Shield size={15} color={greenColor} />} iconBg="rgba(122,174,121,0.12)" label="Privacy Policy" value=""
              colors={colors} onPress={() => Linking.openURL('https://aayu.health/privacy')} />
            <Divider colors={colors} />
            <InfoRow icon={<FileText size={15} color={colors.textSecondary} />} iconBg={colors.surface} label="Terms of Service" value=""
              colors={colors} onPress={() => Linking.openURL('https://aayu.health/terms')} />
          </View>

          {/* ─── Developer ───────────────────────────────────────────── */}
          {__DEV__ && (
            <>
              <Text style={[s.sectionTitle, { color: colors.textMuted }]}>DEVELOPER</Text>
              <View style={[s.card, { backgroundColor: colors.card, borderColor: 'rgba(196,72,72,0.4)' }]}>
                <View style={r.row}>
                  <View style={[r.iconWrap, { backgroundColor: 'rgba(196,72,72,0.12)' }]}>
                    <Flag size={15} color="#c44848" />
                  </View>
                  <View style={r.content}>
                    <Text style={[r.label, { color: colors.textMuted }]}>DEV: Override Pro</Text>
                    <Text style={[r.value, { color: colors.text }]}>{devProOverride ? 'On' : 'Off'}</Text>
                  </View>
                  <Switch value={devProOverride} onValueChange={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); void toggleProUser(); }}
                    trackColor={{ false: colors.border, true: '#c44848' }} thumbColor="#fff" />
                </View>
                <Divider colors={colors} />
                <InfoRow
                  icon={<RotateCcw size={15} color="#c44848" />}
                  iconBg="rgba(196,72,72,0.12)"
                  label="Replay splash + onboarding"
                  value="Clears onboarding flag & reloads"
                  colors={colors}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    replaySplashAndOnboarding();
                  }}
                />
                <Divider colors={colors} />
                <InfoRow
                  icon={<RotateCcw size={15} color="#c44848" />}
                  iconBg="rgba(196,72,72,0.12)"
                  label="Replay full new-user flow"
                  value="Clears onboarding + local profile & reloads"
                  colors={colors}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    replayFullNewUserFlow();
                  }}
                />
                <Divider colors={colors} />
                <InfoRow
                  icon={<LineChart size={15} color="#c44848" />}
                  iconBg="rgba(196,72,72,0.12)"
                  label="Seed ~4 months fasting data"
                  value="5:2 → 16:8 → 18:6 (synthetic)"
                  colors={colors}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    seedDevFastingHistory();
                  }}
                />
              </View>
            </>
          )}

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background } as ViewStyle,
    scroll: { paddingHorizontal: 20, paddingBottom: 40 } as ViewStyle,
    header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 24 } as ViewStyle,
    avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
    avatarText: { fontSize: fs(22), fontWeight: '700', color: '#fff' } as TextStyle,
    headerMeta: { flex: 1 } as ViewStyle,
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 } as ViewStyle,
    profileName: { fontSize: fs(20), fontWeight: '700' } as TextStyle,
    profileSub: { fontSize: fs(12), marginTop: 2 } as TextStyle,
    nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 } as ViewStyle,
    nameInput: { flex: 1, fontSize: fs(18), fontWeight: '600', borderBottomWidth: 1.5, paddingVertical: 4 } as TextStyle,
    nameBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
    sectionTitle: { fontSize: fs(11), fontWeight: '600', letterSpacing: 1.2, marginBottom: 8, marginTop: 20, marginLeft: 4 } as TextStyle,
    card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' } as ViewStyle,
    actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 4 } as ViewStyle,
    actionText: { fontSize: fs(14), fontWeight: '600' } as TextStyle,
  });
}
