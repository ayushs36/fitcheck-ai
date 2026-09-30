import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

export type DailyReminder = {
  enabled: boolean;
  hour: number;
  notificationId?: string;
};

const DEFAULT_HOUR = 20;

function storageKey(userId: string) {
  return `fitcheck:daily-reminder:${userId}`;
}

export async function loadDailyReminder(userId: string): Promise<DailyReminder> {
  const stored = await AsyncStorage.getItem(storageKey(userId));
  if (!stored) return { enabled: false, hour: DEFAULT_HOUR };

  try {
    const value = JSON.parse(stored) as Partial<DailyReminder>;
    const hour = Number.isInteger(value.hour) && value.hour! >= 0 && value.hour! <= 23
      ? value.hour!
      : DEFAULT_HOUR;
    return {
      enabled: Boolean(value.enabled),
      hour,
      notificationId: typeof value.notificationId === "string" ? value.notificationId : undefined,
    };
  } catch {
    return { enabled: false, hour: DEFAULT_HOUR };
  }
}

export async function scheduleDailyReminder(userId: string, hour: number) {
  const permissions = await Notifications.getPermissionsAsync();
  const granted = permissions.granted
    ? permissions
    : await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: false, allowSound: true },
      });
  if (!granted.granted) {
    throw new Error("Notifications are off. Enable them in iPhone Settings to use a daily reminder.");
  }

  const current = await loadDailyReminder(userId);
  if (current.notificationId) {
    await Notifications.cancelScheduledNotificationAsync(current.notificationId);
  }
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "FitCheck Coach",
      body: "Take a moment to log today's check-in.",
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
    },
  });
  const reminder: DailyReminder = { enabled: true, hour, notificationId };
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(reminder));
  return reminder;
}

export async function disableDailyReminder(userId: string) {
  const current = await loadDailyReminder(userId);
  if (current.notificationId) {
    await Notifications.cancelScheduledNotificationAsync(current.notificationId);
  }
  await AsyncStorage.removeItem(storageKey(userId));
}
