import { accountStorageKey, type KeyValueStorage } from "../storage/accountStorage.ts";
import { isDailyLog, isWorkoutSession, isUserSettings, validateRecordArray } from "../storage/validateRecords.ts";
import type { PendingWrite, QueuedWrite } from "./outbox.ts";
import { validatePendingRecord } from "./recordStore.ts";
import { reconcileCloudRecords, validateCloudRecord, type CloudRecord, type SyncConflict } from "./reconcile.ts";

type WorkspaceDocument = {
  version: 1;
  ownerId: string;
  nextSequence: number;
  records: CloudRecord[];
  pending: QueuedWrite[];
  conflicts: SyncConflict[];
};
const locks = new WeakMap<KeyValueStorage, Map<string, Promise<unknown>>>();
const identity = (kind: string, id: string) => JSON.stringify([kind, id]);
const rowKey = (row: CloudRecord) => identity(row.kind, row.record_id);
const editKey = (edit: PendingWrite) => identity(edit.kind, edit.recordId);
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function samePayload(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((value, index) => samePayload(value, b[index]));
  }
  const left = a as Record<string, unknown>, right = b as Record<string, unknown>;
  return Object.keys(left).length === Object.keys(right).length
    && Object.keys(left).every(key => Object.prototype.hasOwnProperty.call(right, key) && samePayload(left[key], right[key]));
}

// One document commits cached records, pending edits and conflicts together.
// It never reads or changes legacy device keys. The caller supplies a verified owner.
export function createAccountWorkspace(storage: KeyValueStorage, ownerId: string) {
  const key = `${accountStorageKey(ownerId)}:workspace:v1`;
  const owner = ownerId.toLowerCase();
  let accountLocks = locks.get(storage);
  if (!accountLocks) { accountLocks = new Map(); locks.set(storage, accountLocks); }
  const queues = accountLocks;
  function serial<T>(action: () => Promise<T>): Promise<T> {
    const run = (queues.get(key) ?? Promise.resolve()).then(action);
    queues.set(key, run.catch(() => undefined));
    return run;
  }
  function validate(document: WorkspaceDocument) {
    if (!document || document.version !== 1 || document.ownerId !== owner
      || !Number.isSafeInteger(document.nextSequence) || document.nextSequence < 1
      || !Array.isArray(document.records) || !Array.isArray(document.pending)
      || !Array.isArray(document.conflicts)) throw new Error("Account workspace needs recovery.");
    reconcileCloudRecords(owner, document.records, document.pending, []);
    const sequences = new Set<number>();
    for (const edit of document.pending) {
      if (!Number.isSafeInteger(edit.sequence) || edit.sequence < 1 || edit.sequence >= document.nextSequence
        || sequences.has(edit.sequence)) throw new Error("Invalid pending edit sequence.");
      sequences.add(edit.sequence);
    }
    const conflicts = new Set<string>();
    for (const conflict of document.conflicts) {
      validateCloudRecord(conflict.remote, owner);
      const id = rowKey(conflict.remote);
      const edit = document.pending.find(item => editKey(item) === id);
      if (!edit || JSON.stringify(edit) !== JSON.stringify(conflict.local) || conflicts.has(id)) {
        throw new Error("Invalid saved conflict.");
      }
      conflicts.add(id);
    }
  }
  async function read(): Promise<WorkspaceDocument> {
    const raw = await storage.getItem(key);
    if (raw === null) return {version: 1, ownerId: owner, nextSequence: 1, records: [], pending: [], conflicts: []};
    const document = JSON.parse(raw) as WorkspaceDocument;
    if (document && "accountDeleted" in document && document.accountDeleted === true) {
      throw new Error("This account was deleted. Its device workspace cannot be reopened.");
    }
    validate(document);
    return document;
  }
  async function save(document: WorkspaceDocument) {
    validate(document);
    const raw = JSON.stringify(document);
    await storage.setItem(key, raw);
    if (await storage.getItem(key) !== raw) throw new Error("Account save could not be verified. Sync stopped.");
  }
  return {
    snapshot: () => serial(read),
    retireAfterConfirmedDeletion(receipt: {userId: string; deleted: boolean}) {
      const confirmed = receipt.deleted === true && receipt.userId.toLowerCase() === owner;
      return serial(async () => {
        if (!confirmed) throw new Error("Verified deletion of this account is required before clearing its workspace.");
        // Retain a marker instead of removing the key: delayed writers must fail,
        // not interpret a missing document as permission to create an empty one.
        const marker = JSON.stringify({version: 1, ownerId: owner, accountDeleted: true});
        await storage.setItem(key, marker);
        if (await storage.getItem(key) !== marker) {
          throw new Error("Account deletion succeeded, but device cleanup could not be verified.");
        }
      });
    },
    importVerifiedBackup() {
      return serial(async () => {
        if (await storage.getItem(key) !== null) throw new Error("This account workspace already exists. Import requires a merge.");
        const importKey = accountStorageKey(owner);
        const source = await storage.getItem(importKey);
        const backup = await storage.getItem(`${importKey}:before-import`);
        if (source === null || backup !== source) throw new Error("A verified account import backup is required.");
        const snapshot = JSON.parse(source);
        if (!snapshot || typeof snapshot !== "object") throw new Error("Invalid import backup.");
        const logs = snapshot.logs === null ? [] : JSON.parse(snapshot.logs);
        const workouts = snapshot.workouts === null ? [] : JSON.parse(snapshot.workouts);
        validateRecordArray(logs, isDailyLog, log => log.date);
        validateRecordArray(workouts, isWorkoutSession, workout => workout.id);
        const settings = snapshot.settings === null ? null : JSON.parse(snapshot.settings);
        if (settings !== null && !isUserSettings(settings)) throw new Error("Invalid settings backup.");
        const document = await read();
        const add = (kind: PendingWrite["kind"], recordId: string, payload: Record<string, unknown>) => {
          document.pending.push({kind, recordId, payload, deleted: false, expectedRevision: null, sequence: document.nextSequence++});
        };
        for (const log of logs) add("daily_log", log.date, {...log});
        for (const workout of workouts) add("workout", workout.id, {...workout});
        if (settings) add("settings", "singleton", {...settings});
        await save(document);
      });
    },
    edit(write: PendingWrite, expectedPayload?: Record<string, unknown> | null) {
      const captured = copy(write);
      const expected = expectedPayload === undefined ? undefined : copy(expectedPayload);
      return serial(async () => {
        validatePendingRecord(captured);
        const document = await read();
        const id = editKey(captured);
        if (document.conflicts.some(item => rowKey(item.remote) === id)) throw new Error("Resolve this record's conflict before editing.");
        const existing = document.pending.find(item => editKey(item) === id);
        const cached = document.records.find(item => rowKey(item) === id);
        const visible = existing ? (existing.deleted ? null : existing.payload) : cached && !cached.deleted ? cached.payload : null;
        if (expected !== undefined && !samePayload(visible, expected)) {
          throw new Error("This record changed since you opened it. Your draft was kept; reopen the latest record before saving.");
        }
        const base = existing ? existing.expectedRevision : cached?.revision ?? null;
        if (captured.expectedRevision !== base) throw new Error("This record changed. Reload it before saving.");
        if (document.nextSequence >= Number.MAX_SAFE_INTEGER) throw new Error("Edit sequence limit reached.");
        const entry = {...captured, sequence: document.nextSequence++};
        document.pending = [...document.pending.filter(item => editKey(item) !== id), entry];
        await save(document);
        return entry;
      });
    },
    receive(rows: CloudRecord[]) {
      const captured = copy(rows);
      return serial(async () => {
        const document = await read();
        const result = reconcileCloudRecords(owner, document.records, document.pending, captured);
        const conflicts = new Map(document.conflicts.map(item => [rowKey(item.remote), item]));
        for (const conflict of result.conflicts) {
          const old = conflicts.get(rowKey(conflict.remote));
          if (!old || old.remote.revision <= conflict.remote.revision) conflicts.set(rowKey(conflict.remote), conflict);
        }
        await save({...document, records: result.records, conflicts: [...conflicts.values()]});
      });
    },
    acknowledge(sent: QueuedWrite, revision: number) {
      const captured = copy(sent);
      return serial(async () => {
        validatePendingRecord(captured);
        if (revision !== (captured.expectedRevision ?? 0) + 1 || !Number.isSafeInteger(revision)) throw new Error("Invalid upload receipt.");
        const document = await read();
        const id = editKey(captured);
        const current = document.pending.find(item => editKey(item) === id);
        if (!current || current.expectedRevision !== captured.expectedRevision) return;
        if (document.conflicts.some(item => rowKey(item.remote) === id)) {
          throw new Error("A conflict arrived during upload. Review both versions before continuing.");
        }
        if (current.sequence < captured.sequence) throw new Error("Invalid upload sequence.");
        const remote: CloudRecord = {user_id: owner, kind: captured.kind, record_id: captured.recordId,
          payload: captured.payload, deleted: captured.deleted, revision};
        document.records = [...document.records.filter(item => rowKey(item) !== id), remote];
        document.pending = document.pending.flatMap(item => editKey(item) !== id ? [item]
          : item.sequence === captured.sequence ? [] : [{...item, expectedRevision: revision}]);
        document.conflicts = document.conflicts.filter(item => rowKey(item.remote) !== id);
        await save(document);
      });
    },
    resolve(kind: PendingWrite["kind"], recordId: string, remoteRevision: number, choice: "local" | "remote") {
      return serial(async () => {
        if (choice !== "local" && choice !== "remote") throw new Error("Choose which version to keep.");
        const document = await read();
        const id = identity(kind, recordId);
        const conflict = document.conflicts.find(item => rowKey(item.remote) === id);
        if (!conflict || conflict.remote.revision !== remoteRevision) throw new Error("Conflict changed. Review the latest versions.");
        document.records = [...document.records.filter(item => rowKey(item) !== id), conflict.remote];
        document.pending = document.pending.filter(item => editKey(item) !== id);
        if (choice === "local") {
          if (document.nextSequence >= Number.MAX_SAFE_INTEGER) throw new Error("Edit sequence limit reached.");
          document.pending.push({...conflict.local, expectedRevision: remoteRevision, sequence: document.nextSequence++});
        }
        document.conflicts = document.conflicts.filter(item => rowKey(item.remote) !== id);
        await save(document);
      });
    },
  };
}

// Pending payloads are the local version, not a second independently saved copy.
export function visibleWorkspaceRecords(document: Pick<WorkspaceDocument, "records" | "pending">) {
  const rows = new Map<string, PendingWrite>(document.records.map(row => [rowKey(row), {kind: row.kind, recordId: row.record_id,
    payload: row.payload, deleted: row.deleted, expectedRevision: row.revision}]));
  for (const edit of document.pending) rows.set(editKey(edit), edit);
  return [...rows.values()].filter(row => !row.deleted);
}
