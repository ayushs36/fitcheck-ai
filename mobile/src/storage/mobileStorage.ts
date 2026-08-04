import AsyncStorage from "@react-native-async-storage/async-storage";
import { DailyLog, UserSettings } from "../types/fitness";

export const MOBILE_STORAGE_KEYS = {
  logs: "fitcheck-mobile:daily-logs:v1",
  settings: "fitcheck-mobile:user-settings:v1",
} as const;

export async function loadDailyLogs(): Promise<DailyLog[]> {
  const rawLogs = await AsyncStorage.getItem(MOBILE_STORAGE_KEYS.logs);
  if (!rawLogs) {
    return [];
  }

  try {
    const parsedLogs = JSON.parse(rawLogs);
    return Array.isArray(parsedLogs) ? parsedLogs : [];
  } catch {
    return [];
  }
}

export async function saveDailyLogs(logs: DailyLog[]): Promise<void> {
  await AsyncStorage.setItem(MOBILE_STORAGE_KEYS.logs, JSON.stringify(logs));
}

export async function upsertDailyLog(log: DailyLog): Promise<DailyLog[]> {
  const logs = await loadDailyLogs();
  const existingIndex = logs.findIndex((existingLog) => existingLog.date === log.date);
  const nextLogs =
    existingIndex >= 0
      ? logs.map((existingLog, index) => (index === existingIndex ? log : existingLog))
      : [...logs, log];

  const sortedLogs = nextLogs.sort((a, b) => a.date.localeCompare(b.date));
  await saveDailyLogs(sortedLogs);
  return sortedLogs;
}

export async function loadUserSettings(): Promise<UserSettings | null> {
  const rawSettings = await AsyncStorage.getItem(MOBILE_STORAGE_KEYS.settings);
  if (!rawSettings) {
    return null;
  }

  try {
    return JSON.parse(rawSettings) as UserSettings;
  } catch {
    return null;
  }
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  await AsyncStorage.setItem(MOBILE_STORAGE_KEYS.settings, JSON.stringify(settings));
}
