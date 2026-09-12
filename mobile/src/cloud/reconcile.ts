import { validatePendingRecord } from "./recordStore.ts";
import type { PendingWrite, QueuedWrite } from "./outbox.ts";

export type CloudRecord = {
  user_id: string;
  kind: PendingWrite["kind"];
  record_id: string;
  payload: Record<string, unknown>;
  deleted: boolean;
  revision: number;
};
export type SyncConflict = { local: QueuedWrite; remote: CloudRecord };
const key = (kind: string, id: string) => JSON.stringify([kind, id]);

export function validateCloudRecord(row: unknown, ownerId: string): asserts row is CloudRecord {
  if (!row || typeof row !== "object") throw new Error("Invalid cloud record.");
  const record = row as CloudRecord;
  if (record.user_id !== ownerId || !Number.isSafeInteger(record.revision) || record.revision < 1) {
    throw new Error("Cloud record ownership or revision mismatch.");
  }
  validatePendingRecord({ kind: record.kind, recordId: record.record_id,
    payload: record.payload, deleted: record.deleted, expectedRevision: record.revision });
}

// Returns a plan, never writes storage. The caller must persist it atomically
// with current local edits and keep conflicts until the user resolves them.
export function reconcileCloudRecords(ownerId: string, cached: CloudRecord[],
  pending: QueuedWrite[], downloaded: unknown[]) {
  const records = new Map<string, CloudRecord>();
  for (const row of cached) {
    validateCloudRecord(row, ownerId);
    const id = key(row.kind, row.record_id);
    if (records.has(id)) throw new Error("Duplicate cached record.");
    records.set(id, row);
  }
  const edits = new Map<string, QueuedWrite>();
  for (const edit of pending) {
    validatePendingRecord(edit);
    const id = key(edit.kind, edit.recordId);
    if (edits.has(id)) throw new Error("Duplicate pending edit.");
    edits.set(id, edit);
  }
  const seen = new Set<string>();
  const conflicts: SyncConflict[] = [];
  for (const row of downloaded) {
    validateCloudRecord(row, ownerId);
    const id = key(row.kind, row.record_id);
    if (seen.has(id)) throw new Error("Duplicate downloaded record.");
    seen.add(id);
    const previous = records.get(id);
    if (previous && row.revision < previous.revision) continue;
    const edit = edits.get(id);
    if (edit) {
      if (row.revision !== edit.expectedRevision) conflicts.push({ local: edit, remote: row });
      continue;
    }
    records.set(id, row);
  }
  // Missing rows are not interpreted as deletion: downloads can be paginated.
  return { records: [...records.values()], pending: [...pending], conflicts };
}
