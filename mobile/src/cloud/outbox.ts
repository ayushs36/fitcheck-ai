import { accountStorageKey, type KeyValueStorage } from "../storage/accountStorage.ts";

export type PendingWrite = {
  kind: "daily_log" | "workout" | "settings";
  recordId: string;
  payload: Record<string, unknown>;
  deleted: boolean;
  expectedRevision: number | null;
};
export type QueuedWrite = PendingWrite & { sequence: number };
type QueueDocument = { nextSequence: number; writes: QueuedWrite[] };
const identity = (write: PendingWrite) => JSON.stringify([write.kind, write.recordId]);

function validWrite(write: unknown): write is QueuedWrite {
  if (!write || typeof write !== "object") return false;
  const value = write as QueuedWrite;
  return ["daily_log", "workout", "settings"].includes(value.kind)
    && typeof value.recordId === "string" && value.recordId.length > 0 && value.recordId.length <= 200
    && (value.kind !== "settings" || value.recordId === "singleton")
    && value.payload !== null && typeof value.payload === "object" && !Array.isArray(value.payload)
    && typeof value.deleted === "boolean" && Number.isSafeInteger(value.sequence) && value.sequence > 0
    && (value.expectedRevision === null || (Number.isSafeInteger(value.expectedRevision) && value.expectedRevision > 0));
}

// Keep one instance per signed-in account. Never change its owner after creation.
export function createOutbox(storage: KeyValueStorage, userId: string) {
  const key = `${accountStorageKey(userId)}:outbox`;
  let queue: Promise<unknown> = Promise.resolve();
  function serial<T>(action: () => Promise<T>): Promise<T> {
    const result = queue.then(action);
    queue = result.catch(() => undefined);
    return result;
  }
  async function read(): Promise<QueueDocument> {
    const raw = await storage.getItem(key);
    if (raw === null) return { nextSequence: 1, writes: [] };
    const document = JSON.parse(raw) as QueueDocument;
    if (!document || !Number.isSafeInteger(document.nextSequence) || document.nextSequence < 1
      || !Array.isArray(document.writes) || !document.writes.every(validWrite)
      || document.writes.some(write => write.sequence >= document.nextSequence)
      || new Set(document.writes.map(identity)).size !== document.writes.length) {
      throw new Error("Upload queue needs recovery. No pending edits were removed.");
    }
    return document;
  }
  async function save(document: QueueDocument) {
    await storage.setItem(key, JSON.stringify(document));
  }
  return {
    list: () => serial(async () => (await read()).writes),
    enqueue(write: PendingWrite) {
      // Snapshot the edit before yielding to avoid caller mutation during I/O.
      const copy = JSON.parse(JSON.stringify(write)) as PendingWrite;
      return serial(async () => {
        const document = await read();
        const entry = { ...copy, sequence: document.nextSequence };
        if (!validWrite(entry) || document.nextSequence >= Number.MAX_SAFE_INTEGER) {
          throw new Error("Invalid pending edit.");
        }
        const previous = document.writes.find(item => identity(item) === identity(entry));
        if (previous && previous.expectedRevision !== entry.expectedRevision) {
          throw new Error("Resolve the existing pending edit before changing its base revision.");
        }
        await save({ nextSequence: document.nextSequence + 1,
          writes: [...document.writes.filter(item => identity(item) !== identity(entry)), entry] });
        return entry;
      });
    },
    acknowledge(sent: QueuedWrite, serverRevision: number) {
      return serial(async () => {
        if (!Number.isSafeInteger(serverRevision) || serverRevision <= (sent.expectedRevision ?? 0)) {
          throw new Error("Invalid upload acknowledgement.");
        }
        const document = await read();
        const current = document.writes.find(item => identity(item) === identity(sent));
        if (!current || current.expectedRevision !== sent.expectedRevision) return;
        // Keep edits made while this request was in flight, rebasing only after success.
        const writes = document.writes.flatMap(item => {
          if (identity(item) !== identity(sent)) return [item];
          return item.sequence === sent.sequence ? [] : [{ ...item, expectedRevision: serverRevision }];
        });
        await save({ ...document, writes });
      });
    },
  };
}
