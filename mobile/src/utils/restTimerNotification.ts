import * as Notifications from "expo-notifications";

export async function scheduleRestTimerNotification(seconds: number) {
  if (seconds <= 0) return null;
  const permissions = await Notifications.getPermissionsAsync();
  const authorization = permissions.granted
    ? permissions
    : await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: false, allowSound: true },
      });
  if (!authorization.granted) return null;

  return Notifications.scheduleNotificationAsync({
    content: { title: "Rest complete", body: "Ready for your next set.", sound: "default" },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: false },
  });
}

export async function cancelRestTimerNotification(notificationId: string | null) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // A delivered notification is already gone and needs no cleanup.
  }
}
