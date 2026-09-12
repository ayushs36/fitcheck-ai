import type { DailyLog, UserSettings, WorkoutSession } from "../types/fitness.ts";
import { isDailyLog, isUserSettings, isWorkoutSession } from "../storage/validateRecords.ts";
import type { PendingWrite } from "./outbox.ts";
import { createAccountWorkspace, visibleWorkspaceRecords } from "./workspace.ts";

type Workspace = ReturnType<typeof createAccountWorkspace>;
export type AccountData = ReturnType<typeof createAccountData>;

// Bind one instance to one authenticated session; never reuse it after sign-out.
export function createAccountData(workspace: Workspace) {
  let closed = false;
  let writes: Promise<unknown> = Promise.resolve();
  function active() {
    if (closed) throw new Error("Account session closed. Reopen your account before saving.");
  }
  async function records() {
    active();
    const state = await workspace.snapshot();
    active();
    return visibleWorkspaceRecords(state);
  }
  function serial<T>(action: () => Promise<T>) {
    const run = writes.then(async () => { active(); return action(); });
    writes = run.catch(() => undefined);
    return run;
  }
  async function put(kind: PendingWrite["kind"], recordId: string, payload: Record<string, unknown>, deleted = false, expected?: Record<string, unknown> | null) {
    const state = await workspace.snapshot();
    active();
    const pending = state.pending.find(row => row.kind === kind && row.recordId === recordId);
    const cached = state.records.find(row => row.kind === kind && row.record_id === recordId);
    await workspace.edit({kind, recordId, payload, deleted,
      expectedRevision: pending ? pending.expectedRevision : cached?.revision ?? null}, expected);
    active();
  }
  const api = {
    close() { closed = true; },
    async exportRecords() {
      const rows = await records();
      const logs: DailyLog[] = [];
      const workouts: WorkoutSession[] = [];
      let settings: UserSettings | null = null;
      for (const row of rows) {
        if (row.kind === "daily_log" && isDailyLog(row.payload)) logs.push(row.payload);
        else if (row.kind === "workout" && isWorkoutSession(row.payload)) workouts.push(row.payload);
        else if (row.kind === "settings" && isUserSettings(row.payload)) settings = row.payload;
        else throw new Error("Invalid saved data. Export stopped.");
      }
      return {logs, workouts, settings};
    },
    async loadDailyLogs(): Promise<DailyLog[]> {
      return (await records()).filter(row => row.kind === "daily_log").map(row => {
        if (!isDailyLog(row.payload)) throw new Error("Invalid saved daily log.");
        return row.payload;
      }).sort((a, b) => a.date.localeCompare(b.date));
    },
    upsertDailyLog(log: DailyLog, previous?: DailyLog | null) {
      const captured = JSON.parse(JSON.stringify(log)) as DailyLog;
      const expected = previous === undefined ? undefined : previous === null ? null : JSON.parse(JSON.stringify(previous));
      return serial(async () => {
        if (!isDailyLog(captured)) throw new Error("Invalid daily log. Nothing was saved.");
        await put("daily_log", captured.date, {...captured}, false, expected);
        return api.loadDailyLogs();
      });
    },
    deleteDailyLogByDate(date: string, previous?: DailyLog | null) {
      const expected = previous === undefined ? undefined : previous === null ? null : JSON.parse(JSON.stringify(previous));
      return serial(async () => {
        const existing = (await api.loadDailyLogs()).find(log => log.date === date);
        if (existing) await put("daily_log", date, {...existing}, true, expected);
        return api.loadDailyLogs();
      });
    },
    async loadWorkoutSessions(): Promise<WorkoutSession[]> {
      return (await records()).filter(row => row.kind === "workout").map(row => {
        if (!isWorkoutSession(row.payload)) throw new Error("Invalid saved workout.");
        return row.payload;
      }).sort((a, b) => b.date.localeCompare(a.date));
    },
    upsertWorkoutSession(workout: WorkoutSession, previous?: WorkoutSession | null) {
      const captured = JSON.parse(JSON.stringify(workout)) as WorkoutSession;
      const expected = previous === undefined ? undefined : previous === null ? null : JSON.parse(JSON.stringify(previous));
      return serial(async () => {
        if (!isWorkoutSession(captured)) throw new Error("Invalid workout. Nothing was saved.");
        await put("workout", captured.id, {...captured}, false, expected);
        return api.loadWorkoutSessions();
      });
    },
    deleteWorkoutSessionById(id: string, previous?: WorkoutSession | null) {
      const expected = previous === undefined ? undefined : previous === null ? null : JSON.parse(JSON.stringify(previous));
      return serial(async () => {
        const existing = (await api.loadWorkoutSessions()).find(workout => workout.id === id);
        if (existing) await put("workout", id, {...existing}, true, expected);
        return api.loadWorkoutSessions();
      });
    },
    async loadUserSettings(): Promise<UserSettings | null> {
      const row = (await records()).find(record => record.kind === "settings");
      if (!row) return null;
      if (!isUserSettings(row.payload)) throw new Error("Invalid saved settings.");
      return row.payload;
    },
    saveUserSettings(settings: UserSettings, previous?: UserSettings | null) {
      const captured = JSON.parse(JSON.stringify(settings)) as UserSettings;
      const expected = previous === undefined ? undefined : previous === null ? null : JSON.parse(JSON.stringify(previous));
      return serial(async () => {
        if (!isUserSettings(captured)) throw new Error("Invalid settings. Nothing was saved.");
        await put("settings", "singleton", {...captured}, false, expected);
      });
    },
  };
  return api;
}
