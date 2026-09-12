export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

const legacyOwnerKey = "fitcheck-coach:legacy-import-owner:v1";
const migrationQueues = new WeakMap<KeyValueStorage, Promise<unknown>>();

export type LocalSnapshot = {
  logs: string | null;
  workouts: string | null;
  settings: string | null;
};

export function accountStorageKey(userId: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    throw new Error("A verified account ID is required.");
  }
  return `fitcheck-coach:user:${userId.toLowerCase()}:snapshot:v1`;
}

function validateSnapshot(snapshot: LocalSnapshot) {
  if (snapshot.logs !== null) validateRecordArray(JSON.parse(snapshot.logs), isDailyLog, log => log.date);
  if (snapshot.workouts !== null) validateRecordArray(JSON.parse(snapshot.workouts), isWorkoutSession, workout => workout.id);
  if (snapshot.settings !== null) {
    const settings: unknown = JSON.parse(snapshot.settings);
    if (!isUserSettings(settings)) {
      throw new Error("Invalid settings; original data was not changed.");
    }
  }
}

// Deliberately has no dependency on the active storage module or cloud client.
// Call only after verified sign-in and explicit confirmation of data ownership.
export function createAccountMigration(storage: KeyValueStorage) {
  return function migrate(userId: string, snapshot: LocalSnapshot, consent: boolean) {
    // Capture the requested snapshot now, not after another import finishes.
    snapshot = { ...snapshot };
    const run = (migrationQueues.get(storage) ?? Promise.resolve()).then(async () => {
      if (!consent) throw new Error("Confirm ownership before importing local logs.");
      const key = accountStorageKey(userId);
      validateSnapshot(snapshot);
      const owner = userId.toLowerCase();
      const existingOwner = await storage.getItem(legacyOwnerKey);
      if (existingOwner !== null && existingOwner !== owner) {
        throw new Error("These device logs are already reserved for another account. Original logs were not changed.");
      }
      if (await storage.getItem(key) !== null) {
        throw new Error("This account already has local data. Import requires a merge.");
      }
      const backupKey = `${key}:before-import`;
      const raw = JSON.stringify(snapshot);
      const previousBackup = await storage.getItem(backupKey);
      if (previousBackup !== null && previousBackup !== raw) {
        throw new Error("An earlier import backup exists. Resolve it before importing again.");
      }
      await storage.setItem(backupKey, raw);
      if (await storage.getItem(backupKey) !== raw) {
        throw new Error("Backup verification failed. Import stopped.");
      }
      // Claim before the destination write so interruption cannot allow a second
      // account to reuse the legacy source. An identical owner may safely retry.
      await storage.setItem(legacyOwnerKey, owner);
      if (await storage.getItem(legacyOwnerKey) !== owner) {
        throw new Error("Ownership verification failed. Import stopped.");
      }
      await storage.setItem(key, raw);
      if (await storage.getItem(key) !== raw) {
        throw new Error("Import verification failed. Original data and backup are retained.");
      }
      return { key, backupKey };
    });
    migrationQueues.set(storage, run.catch(() => undefined));
    return run;
  };
}
import { isDailyLog, isWorkoutSession, isUserSettings, validateRecordArray } from "./validateRecords.ts";
