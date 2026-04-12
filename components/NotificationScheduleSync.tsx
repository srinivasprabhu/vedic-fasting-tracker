import { useEffect, useMemo, useRef } from 'react';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { getNotificationsEnabled, syncRecurringNotifications } from '@/utils/notifications';

/**
 * Keeps plan-based + water recurring notifications aligned with profile.plan and lastMealTime.
 *
 * Important: we only react to fields that affect notification times (fast window).
 * Using the whole `profile` object as a dependency caused re-sync on every plan tweak
 * (e.g. dailySteps) and could freeze the UI from repeated cancel+schedule bursts.
 */
export function NotificationScheduleSync() {
  const { profile } = useUserProfile();
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const planFingerprint = useMemo(() => {
    if (!profile) return 'none';
    const p = profile.plan;
    const days = (p?.weeklyFastDays ?? []).slice().sort((a, b) => a - b).join(',');
    return [
      profile.lastMealTime ?? '',
      profile.fastWindowStartMinutes ?? '',
      p?.fastHours ?? '',
      p?.fastLabel ?? '',
      p?.planTemplateId ?? '',
      days,
    ].join('\u0001');
  }, [
    profile?.lastMealTime,
    profile?.fastWindowStartMinutes,
    profile?.plan?.fastHours,
    profile?.plan?.fastLabel,
    profile?.plan?.planTemplateId,
    profile?.plan?.weeklyFastDays?.join(','),
  ]);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = setTimeout(() => {
      void (async () => {
        try {
          const enabled = await getNotificationsEnabled();
          if (cancelled || !enabled) return;
          await syncRecurringNotifications(profileRef.current);
        } catch (e) {
          if (__DEV__) console.warn('NotificationScheduleSync:', e);
        }
      })();
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [planFingerprint]);

  return null;
}
