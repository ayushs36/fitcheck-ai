import AsyncStorage from "@react-native-async-storage/async-storage";
import { DailyLog, MobileAccount, UserSettings, WorkoutSession } from "../types/fitness";

export const MOBILE_STORAGE_KEYS = {
  logs: "fitcheck-mobile:daily-logs:v1",
  workouts: "fitcheck-mobile:workout-sessions:v1",
  settings: "fitcheck-mobile:user-settings:v1",
  account: "fitcheck-mobile:account:v1",
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

export async function loadWorkoutSessions(): Promise<WorkoutSession[]> {
  const rawSessions = await AsyncStorage.getItem(MOBILE_STORAGE_KEYS.workouts);
  if (!rawSessions) {
    return [];
  }

  try {
    const parsedSessions = JSON.parse(rawSessions);
    return Array.isArray(parsedSessions) ? parsedSessions : [];
  } catch {
    return [];
  }
}

export async function saveWorkoutSessions(sessions: WorkoutSession[]): Promise<void> {
  await AsyncStorage.setItem(MOBILE_STORAGE_KEYS.workouts, JSON.stringify(sessions));
}

export async function addWorkoutSession(session: WorkoutSession): Promise<WorkoutSession[]> {
  const sessions = await loadWorkoutSessions();
  const sortedSessions = [...sessions, session].sort((a, b) => b.date.localeCompare(a.date));
  await saveWorkoutSessions(sortedSessions);
  return sortedSessions;
}

export async function upsertWorkoutSession(session: WorkoutSession): Promise<WorkoutSession[]> {
  const sessions = await loadWorkoutSessions();
  const existingIndex = sessions.findIndex((existingSession) => existingSession.id === session.id);
  const nextSessions =
    existingIndex >= 0
      ? sessions.map((existingSession, index) =>
          index === existingIndex ? session : existingSession,
        )
      : [...sessions, session];
  const sortedSessions = nextSessions.sort((a, b) => b.date.localeCompare(a.date));

  await saveWorkoutSessions(sortedSessions);
  return sortedSessions;
}

export async function deleteWorkoutSessionById(id: string): Promise<WorkoutSession[]> {
  const sessions = await loadWorkoutSessions();
  const nextSessions = sessions.filter((session) => session.id !== id);
  await saveWorkoutSessions(nextSessions);
  return nextSessions.slice().sort((a, b) => b.date.localeCompare(a.date));
}

export async function loadRecentWorkoutSessions(limit = 5): Promise<WorkoutSession[]> {
  const sessions = await loadWorkoutSessions();
  return sessions
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

export async function getDailyLogByDate(date: string): Promise<DailyLog | undefined> {
  const logs = await loadDailyLogs();
  return logs.find((log) => log.date === date);
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

export async function deleteDailyLogByDate(date: string): Promise<DailyLog[]> {
  const logs = await loadDailyLogs();
  const nextLogs = logs.filter((log) => log.date !== date);
  await saveDailyLogs(nextLogs);
  return nextLogs.slice().sort((a, b) => b.date.localeCompare(a.date));
}

export async function loadRecentDailyLogs(limit = 7): Promise<DailyLog[]> {
  const logs = await loadDailyLogs();
  return logs
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

export async function loadDailyLogsDescending(): Promise<DailyLog[]> {
  const logs = await loadDailyLogs();
  return logs.slice().sort((a, b) => b.date.localeCompare(a.date));
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

export async function loadMobileAccount(): Promise<MobileAccount | null> {
  const rawAccount = await AsyncStorage.getItem(MOBILE_STORAGE_KEYS.account);
  if (!rawAccount) {
    return null;
  }

  try {
    return JSON.parse(rawAccount) as MobileAccount;
  } catch {
    return null;
  }
}

export async function saveMobileAccount(account: MobileAccount): Promise<void> {
  await AsyncStorage.setItem(MOBILE_STORAGE_KEYS.account, JSON.stringify(account));
}

export async function clearMobileAccount(): Promise<void> {
  await AsyncStorage.removeItem(MOBILE_STORAGE_KEYS.account);
}

export type MobileDataBackup = {
  exportedAt: string;
  logs: DailyLog[];
  workouts: WorkoutSession[];
  settings: UserSettings | null;
  account: MobileAccount | null;
};

export async function loadMobileDataBackup(): Promise<MobileDataBackup> {
  const [logs, workouts, settings, account] = await Promise.all([
    loadDailyLogs(),
    loadWorkoutSessions(),
    loadUserSettings(),
    loadMobileAccount(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    logs,
    workouts,
    settings,
    account,
  };
}

export async function restoreMobileDataBackup(backup: MobileDataBackup): Promise<void> {
  await AsyncStorage.multiSet([
    [MOBILE_STORAGE_KEYS.logs, JSON.stringify(backup.logs)],
    [MOBILE_STORAGE_KEYS.workouts, JSON.stringify(backup.workouts)],
    [MOBILE_STORAGE_KEYS.settings, JSON.stringify(backup.settings)],
    [MOBILE_STORAGE_KEYS.account, JSON.stringify(backup.account)],
  ]);
}

export async function clearMobileData(): Promise<void> {
  await AsyncStorage.multiRemove([
    MOBILE_STORAGE_KEYS.logs,
    MOBILE_STORAGE_KEYS.workouts,
    MOBILE_STORAGE_KEYS.settings,
    MOBILE_STORAGE_KEYS.account,
  ]);
}
