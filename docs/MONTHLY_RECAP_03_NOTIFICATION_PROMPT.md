# Step 3: Monthly Recap Notification (the ritual trigger)

## What you're building

A local push notification scheduled for 9:00 AM on the 1st of every month. When tapped, it deep-links to the Monthly Recap screen showing the previous month's data.

**Why this matters:** Right now the report is available whenever the user thinks to generate it, which means most users will never generate one. Apps like Spotify Wrapped and Strava's yearly review create habits because they *arrive* — they claim a moment in the user's attention. Your monthly report needs the same treatment.

## User flow

1. **Notification fires** at 9:00 AM local time on the 1st of every month
2. **Tap notification** → app opens directly to `/monthly-recap` (with last month's data)
3. **Recap screen loads** — same screen as step 1, no new UI needed

## Design decisions

- **9:00 AM local time** — not too early (6am feels intrusive), not too late (people are already at work by 10am). 9am is when people check their phones over coffee.
- **1st of every month** — a natural anchor. The report covers the PREVIOUS month (so on April 1st, it shows March's data).
- **Only fires if there's data** — if the user had fewer than 3 fasts last month, no notification fires. The existing `getReportAvailability()` check handles this.
- **Respects master notification toggle** — if the user has disabled notifications entirely in Settings, we don't fire.
- **User-controlled** — add a sub-toggle in `notification-settings.tsx` so users can opt out of monthly-recap notifications specifically while keeping other notifications.

---

## Task 1: Add a new notification preference key

**File:** `utils/notifications.ts`

Add to the top of the file with the other preference keys:

```typescript
const MONTHLY_RECAP_ENABLED_KEY = 'aayu_notif_monthly_recap';
const MONTHLY_RECAP_NOTIF_ID_KEY = 'aayu_monthly_recap_notif_id';
```

Add getter/setter functions (near the other preference getters like `getReminderBeforeFastStart`):

```typescript
export async function getMonthlyRecapEnabled(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(MONTHLY_RECAP_ENABLED_KEY);
    if (v === null) return true; // default ON
    return v === 'true';
  } catch {
    return true;
  }
}

export async function setMonthlyRecapEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(MONTHLY_RECAP_ENABLED_KEY, String(enabled));
}
```

---

## Task 2: Add the scheduler function

**File:** `utils/notifications.ts`

Add these functions (near `scheduleWeeklySummary` which follows a similar pattern):

```typescript
// ─── Monthly Recap Notification ──────────────────────────────────────────────
// Fires at 9:00 AM on the 1st of every month. Deep-links to the recap screen.

const MONTHLY_RECAP_MESSAGES = [
  'Your last month\'s recap is ready.',
  'See how you did last month.',
  'Your monthly fasting story is ready to open.',
  'Last month in review — tap to see your score.',
];

export async function scheduleMonthlyRecap(): Promise<void> {
  if (Platform.OS === 'web') return;

  await cancelMonthlyRecap();

  if (!(await hasPermission())) return;
  if (!(await getNotificationsEnabled())) return;
  if (!(await getMonthlyRecapEnabled())) return;

  try {
    // Pick a message based on the current month to add variety
    const now = new Date();
    const msg = MONTHLY_RECAP_MESSAGES[now.getMonth() % MONTHLY_RECAP_MESSAGES.length];

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Your monthly recap is ready ✨',
        body: msg,
        sound: true,
        data: { type: 'monthly_recap' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        day: 1,         // 1st of the month
        hour: 9,        // 9 AM
        minute: 0,
        repeats: true,  // Repeat every month automatically
      },
    });

    await AsyncStorage.setItem(MONTHLY_RECAP_NOTIF_ID_KEY, id);
  } catch (e) {
    if (__DEV__) console.log('[notifications] Monthly recap schedule error:', e);
  }
}

export async function cancelMonthlyRecap(): Promise<void> {
  try {
    const id = await AsyncStorage.getItem(MONTHLY_RECAP_NOTIF_ID_KEY);
    if (id) {
      await cancelById(id);
      await AsyncStorage.removeItem(MONTHLY_RECAP_NOTIF_ID_KEY);
    }
  } catch {}
}
```

---

## Task 3: Wire into the existing sync function

**File:** `utils/notifications.ts`

The existing `syncRecurringNotifications()` function already handles scheduling/rescheduling all recurring notifications. Add the monthly recap scheduler at the end of it, after `scheduleWeeklySummary()`:

Find this section:

```typescript
  try {
    await scheduleWeeklySummary();
  } catch (e) {
    console.log('Weekly summary reschedule error:', e);
  }
}
```

Replace with:

```typescript
  try {
    await scheduleWeeklySummary();
  } catch (e) {
    console.log('Weekly summary reschedule error:', e);
  }

  try {
    await scheduleMonthlyRecap();
  } catch (e) {
    console.log('Monthly recap reschedule error:', e);
  }
}
```

Also update `disableNotifications()` to cancel the monthly recap. Find this function:

```typescript
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
```

Add a line for `cancelMonthlyRecap`:

```typescript
export async function disableNotifications(): Promise<void> {
  await setNotificationsEnabled(false);
  await cancelDailyReminder();
  await cancelWeeklySummary();
  await cancelMonthlyRecap();
  await cancelBeforeFastStartNotifications();
  await cancelBeforeFastEndNotifications();
  await cancelWaterReminderNotifications();
  await cancelActiveFastNotifications();
  await cancelPostFastNotifications();
}
```

---

## Task 4: Handle notification tap → deep link to recap

**File:** `app/_layout.tsx`

This is where notification taps get routed. Find the existing `Notifications.addNotificationResponseReceivedListener` handler (if there isn't one, add it inside the root layout's useEffect). Add handling for the `monthly_recap` type.

If there's no existing listener, add this inside the root layout component's useEffect:

```typescript
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

// Inside the root layout component:
useEffect(() => {
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const type = response.notification.request.content.data?.type;

    if (type === 'monthly_recap') {
      // Deep-link to the recap screen. Pass no params — it defaults to last month.
      router.push('/monthly-recap');
    }
    // Other notification types can be handled here too (milestones, reminders, etc.)
  });

  return () => responseSubscription.remove();
}, []);
```

If there IS already a handler, just add the new `if (type === 'monthly_recap')` branch to the existing switch/if-else.

---

## Task 5: Add a sub-toggle in notification settings

**File:** `app/notification-settings.tsx`

This file should have existing toggles like "Remind before fast start" and "Water reminders". Add a new toggle for "Monthly recap".

**Find an existing toggle pattern** in the file — probably something like:

```tsx
<SettingRow
  label="Remind before fast ends"
  value={beforeEndEnabled}
  onValueChange={handleBeforeEndToggle}
/>
```

**Add a similar row for the monthly recap.** At the top, add imports:

```typescript
import {
  getMonthlyRecapEnabled,
  setMonthlyRecapEnabled,
  scheduleMonthlyRecap,
  cancelMonthlyRecap,
} from '@/utils/notifications';
```

Add state for the toggle (alongside the other useState calls for existing preferences):

```typescript
const [monthlyRecapEnabled, setMonthlyRecapEnabledState] = useState(true);
```

Load the preference in the existing useEffect (where other prefs are loaded):

```typescript
getMonthlyRecapEnabled().then(setMonthlyRecapEnabledState);
```

Add a handler (alongside similar handlers):

```typescript
const handleMonthlyRecapToggle = useCallback(async (value: boolean) => {
  setMonthlyRecapEnabledState(value);
  await setMonthlyRecapEnabled(value);
  if (value) {
    await scheduleMonthlyRecap();
  } else {
    await cancelMonthlyRecap();
  }
}, []);
```

Add the toggle row in the appropriate section (probably grouped with "Weekly summary" or at the bottom of the list):

```tsx
<SettingRow
  label="Monthly recap"
  sublabel="Your recap, delivered on the 1st of each month"
  value={monthlyRecapEnabled}
  onValueChange={handleMonthlyRecapToggle}
/>
```

Use whatever component/JSX pattern the existing toggles use. If they're plain `<Switch>` components inside a row, match that style.

---

## Task 6: Add a dev-only "fire test notification" button

**File:** `app/notification-settings.tsx`

Testing monthly notifications is a pain because you can't wait a month. Add a dev-only button that fires a test notification in 5 seconds so you can validate the deep link works.

Wrap it in `__DEV__`:

```tsx
{__DEV__ && (
  <TouchableOpacity
    style={{
      marginTop: 16,
      padding: 12,
      borderRadius: 8,
      backgroundColor: colors.surface,
      alignItems: 'center',
    }}
    onPress={async () => {
      const Notifications = await import('expo-notifications');
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Your monthly recap is ready ✨',
          body: 'Tap to see last month\'s recap.',
          sound: true,
          data: { type: 'monthly_recap' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 5,
        },
      });
      Alert.alert('Test notification scheduled', 'Will fire in 5 seconds. Lock the device to see it.');
    }}
  >
    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
      [DEV] Fire monthly recap test notification
    </Text>
  </TouchableOpacity>
)}
```

---

## Verification checklist

- [ ] `npx tsc --noEmit` passes
- [ ] Settings → Notification preferences shows a new "Monthly recap" toggle
- [ ] Toggle is ON by default for existing users (new users too)
- [ ] Toggling OFF then back ON reschedules the notification (check via `console.log` in scheduler)
- [ ] Disabling the master notification toggle cancels the monthly recap
- [ ] Dev-only test button is visible only in debug builds
- [ ] Tapping the test button → lock phone → wait 5 seconds → notification appears
- [ ] Tapping the notification opens the app directly to `/monthly-recap`
- [ ] The recap screen shows last month's data (not the current month)
- [ ] After tapping, the recap can be dismissed normally with the X button

## Things to know about calendar triggers

iOS and Android both support `CALENDAR` triggers with `repeats: true` natively. The OS handles firing the notification even if the app has been killed — you do NOT need a background task or push server. This is pure local scheduling.

If the user has their phone off at exactly 9:00 AM on the 1st, iOS will deliver the notification when they next unlock. Android behaviour varies by OEM (some aggressive battery optimisers may delay or skip). This is a known Android limitation and not something we can fix from JS.

## What this step does NOT do

- It does NOT fire notifications retroactively for users who had the app before this feature shipped — they'll get their first recap notification on the next 1st of the month after they update.
- It does NOT change the PDF (step 4) or add the blurred preview (step 5).
- It does NOT send remote push notifications — everything is local. If you ever want to A/B test message copy across users, that would require a remote push infrastructure (not needed for MVP).

## First-install UX note

A user who installs the app on, say, March 15th won't get their first monthly recap notification until April 1st. That's fine — the full recap screen is accessible anytime via the "View your March recap" button in the Insights tab once they've completed 3+ fasts. The notification is the retention trigger for month-2+ users.
