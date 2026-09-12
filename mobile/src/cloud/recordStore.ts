import type { SupabaseClient } from "@supabase/supabase-js";
import { accountStorageKey } from "../storage/accountStorage.ts";
import { isDailyLog, isWorkoutSession, isUserSettings } from "../storage/validateRecords.ts";
import type { PendingWrite } from "./outbox.ts";
import type { CloudRecord } from "./reconcile.ts";

export class SyncConflictError extends Error {
  constructor() { super("This record changed on another device. Review both versions before syncing."); }
}

export function validatePendingRecord(write: PendingWrite) {
  if (!["daily_log", "workout", "settings"].includes(write.kind)
    || typeof write.recordId !== "string" || !write.recordId || write.recordId.length > 200
    || typeof write.deleted !== "boolean"
    || (write.expectedRevision !== null && (!Number.isSafeInteger(write.expectedRevision) || write.expectedRevision <= 0))) {
    throw new Error("Invalid upload record.");
  }
  if (write.kind === "settings" && write.recordId !== "singleton") throw new Error("Invalid settings key.");
  if (!write.payload || typeof write.payload !== "object" || Array.isArray(write.payload)) throw new Error("Invalid record payload.");
  if (write.deleted) return;
  const valid = write.kind === "daily_log"
    ? isDailyLog(write.payload) && write.payload.date === write.recordId
    : write.kind === "workout"
      ? isWorkoutSession(write.payload) && write.payload.id === write.recordId
      : isUserSettings(write.payload);
  if (!valid) throw new Error("Invalid fitness record. Upload stopped.");
}

export function createCloudRecordStore(client: SupabaseClient, ownerId: string) {
  accountStorageKey(ownerId);
  return {
    async downloadPage(kind: PendingWrite["kind"], after: string | null = null) {
      if (!["daily_log", "workout", "settings"].includes(kind)
        || (after !== null && (typeof after !== "string" || !after || after.length > 200))) {
        throw new Error("Invalid download cursor.");
      }
      const verifyOwner = async () => {
        const { data, error } = await client.auth.getUser();
        if (error) throw error;
        if (data.user?.id !== ownerId) throw new Error("Account changed. Sync stopped.");
      };
      await verifyOwner();
      // Keyset pagination avoids offset shifts when another device inserts rows.
      // Later sync passes start from the beginning to catch edits behind a cursor.
      let query = client.from("mobile_records")
        .select("user_id,kind,record_id,payload,deleted,revision")
        .eq("user_id", ownerId).eq("kind", kind)
        .order("record_id", { ascending: true }).limit(100);
      if (after !== null) query = query.gt("record_id", after);
      const { data, error } = await query;
      if (error) throw error;
      await verifyOwner();
      if (!Array.isArray(data) || data.length > 100) throw new Error("Invalid download page.");
      const seen = new Set<string>();
      const records: CloudRecord[] = [];
      for (const row of data) {
        if (!row || row.user_id !== ownerId || row.kind !== kind
          || !Number.isSafeInteger(row.revision) || row.revision < 1
          || row.record_id === after || seen.has(row.record_id)) {
          throw new Error("Invalid downloaded record. Local data was not changed.");
        }
        validatePendingRecord({ kind: row.kind, recordId: row.record_id,
          payload: row.payload, deleted: row.deleted, expectedRevision: row.revision });
        seen.add(row.record_id);
        records.push(row as CloudRecord);
      }
      return { records, nextCursor: records.length === 100 ? records[99].record_id : null };
    },
    async push(write: PendingWrite): Promise<number> {
      validatePendingRecord(write);
      const { data: identity, error: identityError } = await client.auth.getUser();
      if (identityError) throw identityError;
      if (identity.user?.id !== ownerId) throw new Error("Account changed. Sync stopped.");
      const body = { user_id: ownerId, kind: write.kind, record_id: write.recordId,
        payload: write.payload, deleted: write.deleted };
      const table = client.from("mobile_records");
      const query = write.expectedRevision === null
        ? table.insert(body)
        : table.update({ ...body, revision: write.expectedRevision })
          .eq("user_id", ownerId).eq("kind", write.kind).eq("record_id", write.recordId)
          .eq("revision", write.expectedRevision);
      const { data, error } = await query.select("revision").maybeSingle();
      if (error) {
        if (error.code === "23505" || error.code === "40001") throw new SyncConflictError();
        throw error;
      }
      if (!data) throw new SyncConflictError();
      const revision = Number(data.revision);
      if (!Number.isSafeInteger(revision) || revision !== (write.expectedRevision ?? 0) + 1) {
        throw new Error("Unexpected server revision. Pending edit retained.");
      }
      return revision;
    },
  };
}
