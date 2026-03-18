import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Animated,
  Switch,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  User,
  Bell,
  Info,
  ChevronRight,
  Moon,
  Sun,
  X,
  Check,
  Edit3,
  LogOut,
  LogIn,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import {
  getNotificationsEnabled,
  enableNotifications,
  disableNotifications,
} from '@/utils/notifications';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import type { AgeGroup, FastingLevel, FastingPath } from '@/types/user';
import type { ColorScheme } from '@/constants/colors';

const AGE_OPTIONS: { id: AgeGroup; label: string }[] = [
  { id: 'under_18', label: 'Under 18' },
  { id: '18_25',    label: '18–25' },
  { id: '26_35',    label: '26–35' },
  { id: '36_45',    label: '36–45' },
  { id: '46_55',    label: '46–55' },
  { id: '56_65',    label: '56–65' },
  { id: '65_plus',  label: '65+' },
];

const LEVEL_OPTIONS: { id: FastingLevel; label: string }[] = [
  { id: 'beginner',     label: '🌱 Beginner' },
  { id: 'intermediate', label: '⚡ Intermediate' },
  { id: 'experienced',  label: '🦅 Experienced' },
];

const PATH_OPTIONS: { id: FastingPath; label: string }[] = [
  { id: 'if',    label: '⏱️ IF Only' },
  { id: 'vedic', label: '🪔 Vedic' },
  { id: 'both',  label: '✨ Both' },
];

function getAgeLabel(ageGroup: AgeGroup | null | undefined): string {
  if (!ageGroup) return 'Not set';
  return AGE_OPTIONS.find(o => o.id === ageGroup)?.label ?? 'Not set';
}

function getLevelLabel(level: FastingLevel | null | undefined): string {
  if (!level) return 'Not set';
  return LEVEL_OPTIONS.find(o => o.id === level)?.label ?? 'Not set';
}

function getPathLabel(path: FastingPath | undefined): string {
  if (!path) return 'IF Only';
  return PATH_OPTIONS.find(o => o.id === path)?.label ?? 'IF Only';
}

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, isAuthenticated, signOut } = useAuth();
  const { profile, updateProfile, getInitial, isProUser, toggleProUser } = useUserProfile();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [editingProfile, setEditingProfile] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>(profile?.name ?? '');
  const [editAgeGroup, setEditAgeGroup] = useState<AgeGroup | null>(profile?.ageGroup ?? null);
  const [editLevel, setEditLevel] = useState<FastingLevel | null>(profile?.fastingLevel ?? null);
  const [editPath, setEditPath] = useState<FastingPath>(profile?.fastingPath ?? 'if');

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    getNotificationsEnabled().then(setNotificationsEnabled);
  }, []);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleEditProfile = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditName(profile?.name ?? '');
    setEditAgeGroup(profile?.ageGroup ?? null);
    setEditLevel(profile?.fastingLevel ?? null);
    setEditPath(profile?.fastingPath ?? 'if');
    setEditingProfile(true);
  }, [profile]);

  const handleSaveProfile = useCallback(() => {
    if (editName.trim().length === 0) {
      Alert.alert('Name required', 'Please enter your name to continue.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateProfile({
      name: editName.trim(),
      ageGroup: editAgeGroup,
      fastingLevel: editLevel,
      fastingPath: editPath,
      currency: profile?.currency,
      createdAt: profile?.createdAt ?? Date.now(),
    });
    setEditingProfile(false);
  }, [editName, editAgeGroup, editLevel, editPath, profile, updateProfile]);

  const handleCancelEdit = useCallback(() => {
    setEditingProfile(false);
  }, []);

  const handleToggleNotifications = useCallback(async (value: boolean) => {
    if (value) {
      const granted = await enableNotifications();
      if (!granted) {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device settings to receive fast reminders.'
        );
        return;
      }
      setNotificationsEnabled(true);
    } else {
      await disableNotifications();
      setNotificationsEnabled(false);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const initial = getInitial();

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Your data will remain on this device. Sign in again to sync across devices.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  }, [signOut]);

  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          title: 'Settings',
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
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <Text style={styles.profileName}>{profile?.name ?? 'Friend'}</Text>
            <Text style={styles.profileJoined}>
              Fasting since {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
                : 'recently'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ACCOUNT</Text>
            <View style={styles.card}>
              {isAuthenticated && user ? (
                <>
                  <View style={styles.row}>
                    <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
                      <User size={16} color={colors.primary} />
                    </View>
                    <View style={styles.rowContent}>
                      <Text style={styles.rowLabel}>Signed in</Text>
                      <Text style={styles.rowValue}>
                        {user.email ?? user.app_metadata?.provider ?? 'Account'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.divider} />
                  <TouchableOpacity
                    style={styles.editRow}
                    onPress={handleSignOut}
                    activeOpacity={0.7}
                  >
                    <LogOut size={16} color={colors.error} />
                    <Text style={[styles.editRowText, { color: colors.error }]}>
                      Sign Out
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => router.push('/sign-in' as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
                    <LogIn size={16} color={colors.primary} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowLabel}>Sign in to sync</Text>
                    <Text style={styles.rowDesc}>Save your data across devices</Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROFILE</Text>
            {editingProfile ? (
              <View style={styles.editCard}>
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Name</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Your name"
                    placeholderTextColor={colors.textMuted}
                    maxLength={30}
                    autoFocus
                    testID="settings-edit-name"
                  />
                </View>

                <View style={styles.editDivider} />

                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Age</Text>
                  <View style={styles.editChips}>
                    {AGE_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt.id}
                        style={[
                          styles.editChip,
                          editAgeGroup === opt.id && styles.editChipActive,
                        ]}
                        onPress={() => setEditAgeGroup(opt.id)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.editChipText,
                            editAgeGroup === opt.id && styles.editChipTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.editDivider} />

                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Fasting Level</Text>
                  <View style={styles.editChips}>
                    {LEVEL_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt.id}
                        style={[
                          styles.editChip,
                          editLevel === opt.id && styles.editChipActive,
                        ]}
                        onPress={() => setEditLevel(opt.id)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.editChipText,
                            editLevel === opt.id && styles.editChipTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.editDivider} />

                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Fasting Path</Text>
                  <View style={styles.editChips}>
                    {PATH_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt.id}
                        style={[
                          styles.editChip,
                          editPath === opt.id && styles.editChipActive,
                        ]}
                        onPress={() => setEditPath(opt.id)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.editChipText,
                            editPath === opt.id && styles.editChipTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.editDivider} />

                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelEdit}
                    activeOpacity={0.7}
                  >
                    <X size={16} color={colors.textMuted} />
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveProfile}
                    activeOpacity={0.85}
                  >
                    <Check size={16} color="#FFF" />
                    <Text style={styles.saveText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.card}>
                <View style={styles.row}>
                  <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
                    <User size={16} color={colors.primary} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowLabel}>Name</Text>
                    <Text style={styles.rowValue}>{profile?.name ?? 'Not set'}</Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <View style={[styles.rowIcon, { backgroundColor: colors.warningLight }]}>
                    <Text style={{ fontSize: 14 }}>🎂</Text>
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowLabel}>Age</Text>
                    <Text style={styles.rowValue}>
                      {getAgeLabel(profile?.ageGroup)}
                    </Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <View style={[styles.rowIcon, { backgroundColor: colors.successLight }]}>
                    <Text style={{ fontSize: 14 }}>🔥</Text>
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowLabel}>Fasting Level</Text>
                    <Text style={styles.rowValue}>
                      {getLevelLabel(profile?.fastingLevel)}
                    </Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <View style={[styles.rowIcon, { backgroundColor: colors.accentLight }]}>
                    <Text style={{ fontSize: 14 }}>🌿</Text>
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowLabel}>Fasting Path</Text>
                    <Text style={styles.rowValue}>
                      {getPathLabel(profile?.fastingPath)}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />
                <TouchableOpacity
                  style={styles.editRow}
                  onPress={handleEditProfile}
                  activeOpacity={0.7}
                  testID="settings-edit-profile"
                >
                  <Edit3 size={16} color={colors.primary} />
                  <Text style={styles.editRowText}>Edit Profile</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PREFERENCES</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: isDark ? colors.warningLight : colors.primaryLight }]}>
                  {isDark
                    ? <Moon size={16} color={colors.warning} />
                    : <Sun size={16} color={colors.primary} />
                  }
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Dark Mode</Text>
                  <Text style={styles.rowDesc}>Switch between light and dark theme</Text>
                </View>
                <Switch
                  value={isDark}
                  onValueChange={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleTheme();
                  }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                  testID="settings-dark-mode"
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: colors.accentLight }]}>
                  <Bell size={16} color={colors.accent} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Fast Reminders</Text>
                  <Text style={styles.rowDesc}>Never miss your fasting window!</Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                  testID="settings-notifications"
                />
              </View>
            </View>
          </View>

          {/* Dev / Testing section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DEVELOPER</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: 'rgba(232,168,76,0.15)' }]}>
                  <Text style={{ fontSize: 14 }}>✦</Text>
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Aayu Pro</Text>
                  <Text style={styles.rowDesc}>{isProUser ? 'Pro features unlocked' : 'Free tier — toggle to test Pro'}</Text>
                </View>
                <Switch
                  value={isProUser}
                  onValueChange={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    toggleProUser();
                  }}
                  trackColor={{ false: colors.border, true: '#e8a84c' }}
                  thumbColor="#FFFFFF"
                  testID="settings-pro-toggle"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ABOUT</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
                  <Info size={16} color={colors.primary} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Aayu - Fasting App</Text>
                  <Text style={styles.rowDesc}>Version 1.0.0</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.aboutText}>
                <Text style={styles.aboutDesc}>
                Your personal fasting companion — track, learn, and transform your health with science-backed intermittent fasting..
                </Text>
                <Text style={styles.aboutTagline}>
                  🙏 May your practice bring peace and strength
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    profileHeader: {
      alignItems: 'center' as const,
      paddingVertical: 28,
    },
    avatarCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: 14,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    avatarText: {
      fontSize: 32,
      fontWeight: '700' as const,
      color: '#FFFFFF',
    },
    profileName: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 4,
    },
    profileJoined: {
      fontSize: 13,
      color: colors.textMuted,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 12,
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
      padding: 16,
      gap: 14,
    },
    rowIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    rowContent: {
      flex: 1,
    },
    rowLabel: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.text,
    },
    rowValue: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 1,
    },
    rowDesc: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 1,
    },
    divider: {
      height: 1,
      backgroundColor: colors.borderLight,
      marginLeft: 66,
    },
    editRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: 14,
      gap: 8,
    },
    editRowText: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.primary,
    },
    editCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.primary + '40',
      padding: 16,
    },
    editField: {
      marginBottom: 4,
    },
    editLabel: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.textMuted,
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    editInput: {
      fontSize: 18,
      color: colors.text,
      fontWeight: '600' as const,
      paddingVertical: 8,
      paddingHorizontal: 0,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    editChips: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 8,
    },
    editChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    editChipActive: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    editChipText: {
      fontSize: 13,
      color: colors.textMuted,
      fontWeight: '500' as const,
    },
    editChipTextActive: {
      color: colors.primary,
      fontWeight: '600' as const,
    },
    editDivider: {
      height: 1,
      backgroundColor: colors.borderLight,
      marginVertical: 14,
    },
    editActions: {
      flexDirection: 'row' as const,
      justifyContent: 'flex-end' as const,
      gap: 12,
      marginTop: 16,
    },
    cancelButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.surface,
      gap: 6,
    },
    cancelText: {
      fontSize: 14,
      color: colors.textMuted,
      fontWeight: '500' as const,
    },
    saveButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.primary,
      gap: 6,
    },
    saveText: {
      fontSize: 14,
      color: '#FFFFFF',
      fontWeight: '600' as const,
    },
    aboutText: {
      padding: 16,
    },
    aboutDesc: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: 12,
    },
    aboutTagline: {
      fontSize: 13,
      color: colors.textMuted,
      fontStyle: 'italic' as const,
    },
    bottomSpacer: {
      height: 20,
    },
  });
}
