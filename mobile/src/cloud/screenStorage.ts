import type { MobileStorage } from "../storage/StorageProvider";
import type { AccountSession } from "./session.ts";

// No method falls back to legacy storage. Unsupported bulk operations fail closed
// until an account-aware import/delete flow is provided by the account screen.
export function createAccountScreenStorage(session: AccountSession, onSaved: () => void): MobileStorage {
  const data = session.data;
  const changed = async <T>(operation: Promise<T>) => {
    const result = await operation;
    onSaved();
    return result;
  };
  const unavailable = async () => { throw new Error("Use the account data controls. Legacy replacement is disabled for cloud accounts."); };
  return {
    loadDailyLogs: data.loadDailyLogs,
    saveDailyLogs: unavailable,
    loadDailyLogsDescending: async () => (await data.loadDailyLogs()).reverse(),
    loadRecentDailyLogs: async (limit = 7) => (await data.loadDailyLogs()).reverse().slice(0, limit),
    getDailyLogByDate: async date => (await data.loadDailyLogs()).find(log => log.date === date),
    upsertDailyLog: (log, previous = null) => changed(data.upsertDailyLog(log, previous)),
    deleteDailyLogByDate: (date, previous = null) => changed(data.deleteDailyLogByDate(date, previous)),
    loadWorkoutSessions: data.loadWorkoutSessions,
    loadRecentWorkoutSessions: async (limit = 5) => (await data.loadWorkoutSessions()).slice(0, limit),
    saveWorkoutSessions: unavailable,
    addWorkoutSession: workout => changed(data.upsertWorkoutSession(workout, null)),
    upsertWorkoutSession: (workout, previous = null) => changed(data.upsertWorkoutSession(workout, previous)),
    deleteWorkoutSessionById: (id, previous = null) => changed(data.deleteWorkoutSessionById(id, previous)),
    loadUserSettings: data.loadUserSettings,
    saveUserSettings: (settings, previous = null) => changed(data.saveUserSettings(settings, previous)),
    loadMobileAccount: async () => { await data.loadUserSettings(); return null; },
    saveMobileAccount: unavailable,
    clearMobileAccount: () => session.signOut(),
    loadMobileDataBackup: async () => {
      const snapshot = await data.exportRecords();
      return {...snapshot, exportedAt: new Date().toISOString(), account: null};
    },
    restoreMobileDataBackup: unavailable,
    clearMobileData: unavailable,
  };
}
