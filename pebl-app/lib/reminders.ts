import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// A local, on-device daily reminder for the evening check-in. No push server involved.

const CHANNEL = 'checkin';

export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Asks for permission if needed. Returns false if the person said no. */
export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/** Replaces any existing reminder with one at 'HH:MM' every day. */
export async function scheduleDailyReminder(time: string) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Evening check-in',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const [hour, minute] = time.split(':').map(Number);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'How did today feel?',
      body: 'A ten-second check-in. Skipping is fine.',
      data: { url: '/checkin' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: CHANNEL },
  });
}

export async function cancelReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
