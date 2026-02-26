import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') {
    console.log('Push notifications not supported on web');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'd3434280-b838-48ad-b763-529ba87b2693',
    });

    console.log('Expo Push Token:', tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.log('Error registering for push notifications:', error);
    return null;
  }
}

export async function scheduleFastingReminder(
  title: string,
  body: string,
  delaySeconds: number
): Promise<string | null> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: delaySeconds,
      },
    });
    console.log('Scheduled notification:', id);
    return id;
  } catch (error) {
    console.log('Error scheduling notification:', error);
    return null;
  }
}

export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All scheduled notifications cancelled');
  } catch (error) {
    console.log('Error cancelling notifications:', error);
  }
}
