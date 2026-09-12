import type { createAccountWorkspace } from "./workspace.ts";
import type { createCloudRecordStore } from "./recordStore.ts";
import { SyncConflictError } from "./recordStore.ts";
import type { PendingWrite } from "./outbox.ts";

type Workspace = ReturnType<typeof createAccountWorkspace>;
type Transport = ReturnType<typeof createCloudRecordStore>;
const kinds: PendingWrite["kind"][] = ["daily_log", "workout", "settings"];
const sameRecord = (kind: string, id: string, otherKind: string, otherId: string) => kind === otherKind && id === otherId;

// One coordinator per account session. Disposal stops further local/network work;
// an already-sent server request may complete, so a later sync must reconcile it.
export function createAccountSync(workspace: Workspace, transport: Transport) {
  let disposed = false;
  let running: Promise<{pending: number; conflicts: number}> | null = null;
  function checkActive() {
    if (disposed) throw new Error("Account session closed. Sync stopped.");
  }
  async function download() {
    for (const kind of kinds) {
      let cursor: string | null = null;
      const seen = new Set<string>();
      do {
        checkActive();
        const page = await transport.downloadPage(kind, cursor);
        checkActive();
        if (page.nextCursor !== null) {
          if (seen.has(page.nextCursor)) throw new Error("Download cursor did not advance.");
          seen.add(page.nextCursor);
        }
        await workspace.receive(page.records);
        cursor = page.nextCursor;
      } while (cursor !== null);
    }
  }
  async function perform() {
    checkActive();
    await download();
    const initial = await workspace.snapshot();
    for (const candidate of initial.pending) {
      checkActive();
      const current = await workspace.snapshot();
      const edit = current.pending.find(item => sameRecord(item.kind, item.recordId, candidate.kind, candidate.recordId));
      if (!edit || current.conflicts.some(item => sameRecord(item.remote.kind, item.remote.record_id, edit.kind, edit.recordId))) continue;
      try {
        checkActive();
        const revision = await transport.push(edit);
        checkActive();
        await workspace.acknowledge(edit, revision);
      } catch (error) {
        if (!(error instanceof SyncConflictError)) throw error;
        // Never force an overwrite by retrying with the latest server revision.
        await download();
      }
    }
    checkActive();
    const final = await workspace.snapshot();
    return {pending: final.pending.length, conflicts: final.conflicts.length};
  }
  return {
    run() {
      if (!running) running = perform().finally(() => { running = null; });
      return running;
    },
    dispose() { disposed = true; },
  };
}
