import {accountStorageKey, type KeyValueStorage} from "../storage/accountStorage.ts";

const key = "fitcheck-coach-offline-access-v1";
const lifetimeMs = 7 * 24 * 60 * 60 * 1000;
type Grant = {version: 1; userId: string; verifiedAt: number};

// The supplied adapter must be platform SecureStore, never AsyncStorage.
// A grant permits local cache access only; it is not authorization for API calls.
export function createOfflineAccess(secureStorage: KeyValueStorage, now = Date.now) {
  async function read(): Promise<Grant | null> {
    const raw = await secureStorage.getItem(key);
    if (raw === null || raw === "null") return null;
    let value: Grant;
    try { value = JSON.parse(raw); } catch { return null; }
    if (!value || value.version !== 1 || typeof value.userId !== "string"
      || !Number.isSafeInteger(value.verifiedAt)) return null;
    try { accountStorageKey(value.userId); } catch { return null; }
    const age = now() - value.verifiedAt;
    return age >= 0 && age < lifetimeMs ? value : null;
  }
  return {
    // Invoke only after online identity verification and successful cache setup.
    async rememberVerifiedAccount(userId: string) {
      accountStorageKey(userId);
      const raw = JSON.stringify({version: 1, userId: userId.toLowerCase(), verifiedAt: now()});
      await secureStorage.setItem(key, raw);
      if (await secureStorage.getItem(key) !== raw) throw new Error("Offline access could not be saved.");
    },
    async allowedAccount(failure: unknown, cachedSessionUserId: string | null) {
      // Never fall back on expired/revoked credentials, 401/403, or unknown errors.
      if (!failure || typeof failure !== "object" || !("name" in failure)
        || failure.name !== "AuthRetryableFetchError") return null;
      if ("status" in failure && failure.status !== 0) return null;
      const grant = await read();
      if (!grant || grant.userId !== cachedSessionUserId?.toLowerCase()) return null;
      return grant.userId;
    },
    async revoke() {
      await secureStorage.setItem(key, "null");
      if (await secureStorage.getItem(key) !== "null") throw new Error("Offline access could not be cleared.");
    },
  };
}
