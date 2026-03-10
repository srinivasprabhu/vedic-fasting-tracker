import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NOTIF_PREF_KEY = 'aayu_notifications_enabled';
const DAILY_REMINDER_ID_KEY = 'aayu_daily_reminder_id';
const WEEKLY_SUMMARY_ID_KEY = 'aayu_weekly_summary_id';
const MILESTONE_IDS_KEY = 'aayu_milestone_notif_ids';
const POST_FAST_IDS_KEY = 'aayu_post_fast_notif_ids';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── Permission & Token ─────────────────────────────────────────────

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'd3434280-b838-48ad-b763-529ba87b2693',
    });
    return tokenData.data;
  } catch (e) {
    console.log('Push token error:', e);
    return null;
  }
}

// ─── Preferences ─────────────────────────────────────────────────────

export async function getNotificationsEnabled(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(NOTIF_PREF_KEY);
    return val === 'true';
  } catch { return false; }
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(NOTIF_PREF_KEY, String(enabled));
}

/** Checks OS permission only — for fast milestones & post-fast tips that work for all users. */
async function hasPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/** Checks OS permission AND user opt-in — for daily/weekly recurring reminders. */
async function isOptedIn(): Promise<boolean> {
  if (!(await hasPermission())) return false;
  return getNotificationsEnabled();
}

// ─── Low-level helpers ───────────────────────────────────────────────

async function schedule(
  title: string,
  body: string,
  delaySeconds: number,
  data?: Record<string, string>,
): Promise<string | null> {
  if (delaySeconds <= 0) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true, data },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.round(delaySeconds),
      },
    });
  } catch (e) {
    console.log('Schedule error:', e);
    return null;
  }
}

async function cancelById(id: string): Promise<void> {
  try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
}

async function cancelStoredIds(key: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const ids: string[] = JSON.parse(raw);
      await Promise.all(ids.map(cancelById));
      await AsyncStorage.removeItem(key);
    }
  } catch {}
}

// ─── 1. Active Fast Milestones ───────────────────────────────────────
// Scheduled when a fast starts; cancelled when it ends.

const MILESTONES = [
  {
    hours: 12,
    title: 'Fat Burn Activated 🔥',
    body: 'Your glycogen stores are depleting. Your body is switching to fat for fuel.',
  },
  {
    hours: 16,
    title: 'Ketosis Mode ⚡',
    body: 'Your body is now primarily burning fat and ketones for energy. Mental clarity rising.',
  },
  {
    hours: 24,
    title: 'Autophagy Begins ✨',
    body: 'Cellular cleanup is ramping up. Old, damaged cells are being recycled. HGH rising ~5×.',
  },
  {
    hours: 48,
    title: 'Deep Renewal 💪',
    body: '48 hours in! Deep autophagy active, immune cells regenerating, peak cellular repair.',
  },
];

export async function scheduleActiveFastMilestones(
  startTime: number,
  targetDurationMs: number,
  fastLabel: string,
): Promise<void> {
  if (!(await hasPermission())) return;

  await cancelActiveFastNotifications();

  const now = Date.now();
  const ids: string[] = [];

  for (const m of MILESTONES) {
    const fireAt = startTime + m.hours * 3600_000;
    const delayMs = fireAt - now;
    if (delayMs > 1000) {
      const id = await schedule(m.title, m.body, delayMs / 1000, { type: 'milestone' });
      if (id) ids.push(id);
    }
  }

  const targetFireAt = startTime + targetDurationMs;
  const targetDelay = targetFireAt - now;
  if (targetDelay > 1000) {
    const id = await schedule(
      'Goal Reached! 🎉',
      `You've hit your ${fastLabel} target! End your fast when you're ready.`,
      targetDelay / 1000,
      { type: 'target_reached' },
    );
    if (id) ids.push(id);
  }

  if (ids.length > 0) {
    await AsyncStorage.setItem(MILESTONE_IDS_KEY, JSON.stringify(ids));
  }
}

export async function cancelActiveFastNotifications(): Promise<void> {
  await cancelStoredIds(MILESTONE_IDS_KEY);
}

// ─── 2. Post-Fast Notifications ──────────────────────────────────────
// Scheduled when a fast ends: refuel tip + streak protection.

const REFUEL_DELAY_SECONDS = 2 * 3600; // 2 hours
const STREAK_PROTECTION_SECONDS = 48 * 3600; // 48 hours

export async function schedulePostFastNotifications(streak: number): Promise<void> {
  if (!(await hasPermission())) return;

  await cancelPostFastNotifications();
  const ids: string[] = [];

  const refuelId = await schedule(
    'Refuel Smart 🥗',
    'Break your fast gently — start with water, then light protein. Your gut will thank you.',
    REFUEL_DELAY_SECONDS,
    { type: 'refuel_tip' },
  );
  if (refuelId) ids.push(refuelId);

  if (streak >= 2) {
    const streakId = await schedule(
      'Protect Your Streak 🔥',
      `You have a ${streak}-fast streak going! Start a fast soon to keep it alive.`,
      STREAK_PROTECTION_SECONDS,
      { type: 'streak_protection' },
    );
    if (streakId) ids.push(streakId);
  }

  if (ids.length > 0) {
    await AsyncStorage.setItem(POST_FAST_IDS_KEY, JSON.stringify(ids));
  }
}

export async function cancelPostFastNotifications(): Promise<void> {
  await cancelStoredIds(POST_FAST_IDS_KEY);
}

// ─── 3. Daily Reminder ───────────────────────────────────────────────

const DAILY_MESSAGES = [
  'A 16-hour fast today keeps the doctor away.',
  'Your body is ready for its next reset.',
  'Consistency is the ultimate superpower — fast today.',
  'Give your gut a break. Start a fast when you\'re ready.',
  'Every fast builds discipline. Let\'s go.',
  'Your metabolism thanks you for fasting regularly.',
  'Small daily disciplines lead to big results.',
];

export async function scheduleDailyReminder(): Promise<void> {
  if (Platform.OS === 'web') return;

  await cancelDailyReminder();

  try {
    const msg = DAILY_MESSAGES[new Date().getDay() % DAILY_MESSAGES.length];
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Ready to Fast? 💪',
        body: msg,
        sound: true,
        data: { type: 'daily_reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 18,
        minute: 0,
      },
    });
    await AsyncStorage.setItem(DAILY_REMINDER_ID_KEY, id);
  } catch (e) {
    console.log('Daily reminder error:', e);
  }
}

export async function cancelDailyReminder(): Promise<void> {
  try {
    const id = await AsyncStorage.getItem(DAILY_REMINDER_ID_KEY);
    if (id) {
      await cancelById(id);
      await AsyncStorage.removeItem(DAILY_REMINDER_ID_KEY);
    }
  } catch {}
}

// ─── 4. Weekly Summary ───────────────────────────────────────────────

export async function scheduleWeeklySummary(): Promise<void> {
  if (Platform.OS === 'web') return;

  await cancelWeeklySummary();

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Your Week in Review 📊',
        body: 'Open the app to see your weekly fasting insights.',
        sound: true,
        data: { type: 'weekly_summary' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Sunday
        hour: 18,
        minute: 0,
      },
    });
    await AsyncStorage.setItem(WEEKLY_SUMMARY_ID_KEY, id);
  } catch (e) {
    console.log('Weekly summary error:', e);
  }
}

export async function cancelWeeklySummary(): Promise<void> {
  try {
    const id = await AsyncStorage.getItem(WEEKLY_SUMMARY_ID_KEY);
    if (id) {
      await cancelById(id);
      await AsyncStorage.removeItem(WEEKLY_SUMMARY_ID_KEY);
    }
  } catch {}
}

// ─── 5. Enable / Disable All ─────────────────────────────────────────

export async function enableNotifications(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;

  await setNotificationsEnabled(true);
  await scheduleDailyReminder();
  await scheduleWeeklySummary();
  return true;
}

export async function disableNotifications(): Promise<void> {
  await setNotificationsEnabled(false);
  await cancelDailyReminder();
  await cancelWeeklySummary();
  await cancelActiveFastNotifications();
  await cancelPostFastNotifications();
}

export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.log('Error cancelling all notifications:', e);
  }
}
