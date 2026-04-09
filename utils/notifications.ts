import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { UserProfile } from '@/types/user';
import {
  buildPlanScheduleInput,
  getReminderHourBeforeFastStart,
  jsWeekdayToExpoCalendarWeekday,
} from '@/utils/fastingPlanSchedule';

const NOTIF_PREF_KEY = 'aayu_notifications_enabled';
const DAILY_REMINDER_ID_KEY = 'aayu_daily_reminder_id';
const WEEKLY_SUMMARY_ID_KEY = 'aayu_weekly_summary_id';
const MILESTONE_IDS_KEY = 'aayu_milestone_notif_ids';
const POST_FAST_IDS_KEY = 'aayu_post_fast_notif_ids';

/** Sub-preferences (free tier). */
const REMINDER_BEFORE_START_KEY = 'aayu_notif_before_fast_start';
const REMINDER_BEFORE_END_KEY = 'aayu_notif_before_fast_end';
const WATER_REMINDERS_ENABLED_KEY = 'aayu_notif_water_enabled';

/** JSON string array of notification ids (supports multiple weekdays for 5:2 / 4:3). */
const BEFORE_FAST_START_IDS_KEY = 'aayu_before_fast_start_notif_ids';
/** Legacy recurring “before fast end” ids (daily/weekly); cleared on sync — no longer scheduled. */
const BEFORE_FAST_END_IDS_KEY = 'aayu_before_fast_end_notif_ids';
/** Single id: 1h-before-end for the *current* fast only (cancelled when fast ends or toggle off). */
const BEFORE_FAST_END_ACTIVE_ID_KEY = 'aayu_before_fast_end_active_id';
/** Legacy single-id storage (migrated on cancel). */
const LEGACY_BEFORE_FAST_START_ID_KEY = 'aayu_before_fast_start_notif_id';
const LEGACY_BEFORE_FAST_END_ID_KEY = 'aayu_before_fast_end_notif_id';
const WATER_NOTIF_IDS_KEY = 'aayu_water_notif_ids';

/** Water reminders: every 2 hours from 8:00 through 20:00 (local). */
const WATER_REMINDER_HOURS = [8, 10, 12, 14, 16, 18, 20] as const;

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

// ─── Plan-based & water reminder preferences ───────────────────────────────

export async function getReminderBeforeFastStart(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(REMINDER_BEFORE_START_KEY);
    if (v === null) return true;
    return v === 'true';
  } catch {
    return true;
  }
}

export async function setReminderBeforeFastStart(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(REMINDER_BEFORE_START_KEY, String(enabled));
}

export async function getReminderBeforeFastEnd(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(REMINDER_BEFORE_END_KEY);
    if (v === null) return true;
    return v === 'true';
  } catch {
    return true;
  }
}

export async function setReminderBeforeFastEnd(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(REMINDER_BEFORE_END_KEY, String(enabled));
}

export async function getWaterRemindersEnabled(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(WATER_REMINDERS_ENABLED_KEY);
    if (v === null) return false;
    return v === 'true';
  } catch {
    return false;
  }
}

export async function setWaterRemindersEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(WATER_REMINDERS_ENABLED_KEY, String(enabled));
}

async function cancelBeforeFastStartNotifications(): Promise<void> {
  await cancelStoredIds(BEFORE_FAST_START_IDS_KEY);
  try {
    const legacy = await AsyncStorage.getItem(LEGACY_BEFORE_FAST_START_ID_KEY);
    if (legacy) {
      await cancelById(legacy);
      await AsyncStorage.removeItem(LEGACY_BEFORE_FAST_START_ID_KEY);
    }
  } catch {}
}

async function cancelBeforeFastEndNotifications(): Promise<void> {
  await cancelStoredIds(BEFORE_FAST_END_IDS_KEY);
  try {
    const legacy = await AsyncStorage.getItem(LEGACY_BEFORE_FAST_END_ID_KEY);
    if (legacy) {
      await cancelById(legacy);
      await AsyncStorage.removeItem(LEGACY_BEFORE_FAST_END_ID_KEY);
    }
  } catch {}
}

async function cancelScheduledBeforeFastEndForActiveFast(): Promise<void> {
  try {
    const id = await AsyncStorage.getItem(BEFORE_FAST_END_ACTIVE_ID_KEY);
    if (id) {
      await cancelById(id);
      await AsyncStorage.removeItem(BEFORE_FAST_END_ACTIVE_ID_KEY);
    }
  } catch {}
}

async function cancelWaterReminderNotifications(): Promise<void> {
  await cancelStoredIds(WATER_NOTIF_IDS_KEY);
}

/**
 * Reschedules plan-based daily reminders + water slots.
 * Call when: notifications toggled on, plan/profile changes, or sub-toggle changes.
 * Requires OS permission + master notifications enabled.
 */
export async function syncRecurringNotifications(profile: UserProfile | null): Promise<void> {
  if (Platform.OS === 'web') return;
  if (!(await hasPermission())) return;
  if (!(await getNotificationsEnabled())) return;

  await cancelBeforeFastStartNotifications();
  await cancelBeforeFastEndNotifications();
  await cancelWaterReminderNotifications();
  await cancelDailyReminder();

  const planInput = buildPlanScheduleInput(profile);
  const beforeStart = await getReminderBeforeFastStart();
  const beforeEnd = await getReminderBeforeFastEnd();
  const waterOn = await getWaterRemindersEnabled();

  // Per-fast “eating window soon” lives in BEFORE_FAST_END_ACTIVE_ID_KEY; drop it if user turned this off.
  if (!beforeEnd) {
    await cancelScheduledBeforeFastEndForActiveFast();
  }

  if (planInput && beforeStart) {
    const startIds: string[] = [];
    const startHour = getReminderHourBeforeFastStart(planInput.lastMealHour);
    if (planInput.mode === 'weekly' && planInput.weeklyFastDays?.length) {
      for (const jsDay of planInput.weeklyFastDays) {
        try {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Fast starts in 1 hour ⏳',
              body: `Wind down eating — your ${planInput.fastLabel} fast day begins soon.`,
              sound: true,
              data: { type: 'before_fast_start' },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: jsWeekdayToExpoCalendarWeekday(jsDay),
              hour: startHour,
              minute: 0,
            },
          });
          startIds.push(id);
        } catch (e) {
          console.log('Before fast start (weekly) schedule error:', e);
        }
      }
    } else {
      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Fast starts in 1 hour ⏳',
            body: `Wind down eating — your ${planInput.fastLabel} fast begins soon.`,
            sound: true,
            data: { type: 'before_fast_start' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: startHour,
            minute: 0,
          },
        });
        startIds.push(id);
      } catch (e) {
        console.log('Before fast start schedule error:', e);
      }
    }
    if (startIds.length > 0) {
      await AsyncStorage.setItem(BEFORE_FAST_START_IDS_KEY, JSON.stringify(startIds));
    }
  }

  // “Before fast end” is no longer a recurring calendar trigger — it is scheduled per fast in
  // scheduleActiveFastMilestones (1h before *this* fast’s target) so it does not fire after an early end.

  if (waterOn) {
    const ids: string[] = [];
    const bodies = [
      'Hydration supports your fast — take a sip.',
      'Water break — your cells will thank you.',
      'Stay light and clear. Time for some water.',
    ];
    for (let i = 0; i < WATER_REMINDER_HOURS.length; i++) {
      const h = WATER_REMINDER_HOURS[i];
      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Water reminder',
            body: bodies[i % bodies.length],
            sound: true,
            data: { type: 'water_reminder' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: h,
            minute: 0,
          },
        });
        ids.push(id);
      } catch (e) {
        console.log('Water reminder schedule error:', e);
      }
    }
    if (ids.length > 0) {
      await AsyncStorage.setItem(WATER_NOTIF_IDS_KEY, JSON.stringify(ids));
    }
  }

  try {
    await scheduleWeeklySummary();
  } catch (e) {
    console.log('Weekly summary reschedule error:', e);
  }
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
    title: 'Fat Burn Activated',
    body: 'Your glycogen stores are depleting. Your body is switching to fat for fuel.',
  },
  {
    hours: 16,
    title: 'Ketosis Mode',
    body: 'Your body is now primarily burning fat and ketones for energy. Mental clarity rising.',
  },
  {
    hours: 24,
    title: 'Autophagy Begins ✨',
    body: 'Cellular cleanup is ramping up. Old, damaged cells are being recycled. HGH rising ~5×.',
  },
  {
    hours: 48,
    title: 'Deep Renewal',
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

  // 1 hour before this fast’s planned end — only while this fast is active (cancelled on endFast).
  if ((await getReminderBeforeFastEnd()) && (await getNotificationsEnabled())) {
    const eatingWindowSoonAt = startTime + targetDurationMs - 3600_000;
    const beforeEndDelayMs = eatingWindowSoonAt - now;
    if (beforeEndDelayMs > 1000) {
      const id = await schedule(
        'Eating window soon',
        `About 1 hour until you can break your ${fastLabel} fast.`,
        beforeEndDelayMs / 1000,
        { type: 'before_fast_end' },
      );
      if (id) {
        try {
          await AsyncStorage.setItem(BEFORE_FAST_END_ACTIVE_ID_KEY, id);
        } catch {}
      }
    }
  }

  const targetFireAt = startTime + targetDurationMs;
  const targetDelay = targetFireAt - now;
  if (targetDelay > 1000) {
    const id = await schedule(
      'Goal Reached!',
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
  await cancelScheduledBeforeFastEndForActiveFast();
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
    'Refuel Smart',
    'Break your fast gently — start with water, then light protein. Your gut will thank you.',
    REFUEL_DELAY_SECONDS,
    { type: 'refuel_tip' },
  );
  if (refuelId) ids.push(refuelId);

  if (streak >= 2) {
    const streakId = await schedule(
      'Protect Your Streak',
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
        title: 'Ready to Fast?',
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
        title: 'Your Week in Review',
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

export async function enableNotifications(profile?: UserProfile | null): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;

  await setNotificationsEnabled(true);
  await syncRecurringNotifications(profile ?? null);
  return true;
}

export async function disableNotifications(): Promise<void> {
  await setNotificationsEnabled(false);
  await cancelDailyReminder();
  await cancelWeeklySummary();
  await cancelBeforeFastStartNotifications();
  await cancelBeforeFastEndNotifications();
  await cancelWaterReminderNotifications();
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
