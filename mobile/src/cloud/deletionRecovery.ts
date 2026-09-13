import {accountStorageKey, type KeyValueStorage} from "../storage/accountStorage.ts";
import {createAccountWorkspace} from "./workspace.ts";

const journalKey = "fitcheck-coach:pending-deletion-cleanup:v1";
const queues = new WeakMap<KeyValueStorage, Promise<unknown>>();

export function createDeletionRecovery(storage: KeyValueStorage, signOutOwner: (id: string) => Promise<void>) {
  function serial<T>(action: () => Promise<T>) {
    const next = (queues.get(storage) ?? Promise.resolve()).then(action);
    queues.set(storage, next.catch(() => undefined));
    return next;
  }
  async function read(): Promise<string[]> {
    const raw = await storage.getItem(journalKey);
    if (raw === null) return [];
    const ids: unknown = JSON.parse(raw);
    if (!Array.isArray(ids) || ids.some(id => typeof id !== "string") || new Set(ids).size !== ids.length) {
      throw new Error("Account cleanup journal needs recovery. Device records were retained.");
    }
    for (const id of ids) accountStorageKey(id);
    return ids;
  }
  async function save(ids: string[]) {
    const raw = JSON.stringify(ids);
    await storage.setItem(journalKey, raw);
    if (await storage.getItem(journalKey) !== raw) throw new Error("Cleanup progress could not be saved.");
  }
  async function finish(ids: string[]) {
    for (const id of [...ids]) {
      await createAccountWorkspace(storage, id).retireAfterConfirmedDeletion({userId: id, deleted: true});
      await signOutOwner(id);
      ids = ids.filter(owner => owner !== id);
      await save(ids);
    }
  }
  return {
    verifyWritable: () => serial(async () => {
      const ids = await read();
      if (ids.length) throw new Error("Finish pending account cleanup before requesting another deletion.");
      await save(ids);
    }),
    // Invoke only after the deletion endpoint explicitly confirms success.
    recordAndFinish(userId: string) {
      accountStorageKey(userId);
      const owner = userId.toLowerCase();
      return serial(async () => {
        const ids = await read();
        if (!ids.includes(owner)) { ids.push(owner); await save(ids); }
        await finish(ids);
      });
    },
    resume: () => serial(async () => finish(await read())),
  };
}
