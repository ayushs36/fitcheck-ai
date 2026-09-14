import type { SupabaseClient } from "@supabase/supabase-js";
import { accountStorageKey, type KeyValueStorage } from "../storage/accountStorage.ts";
import { createAccountData } from "./accountData.ts";
import { createCloudRecordStore } from "./recordStore.ts";
import { createAccountSync } from "./sync.ts";
import { createAccountWorkspace } from "./workspace.ts";
import { createDeletionRecovery } from "./deletionRecovery.ts";
import type {createOfflineAccess} from "./offlineAccess.ts";
import {parseWebLogExport} from "./webLogImport.ts";

// The caller must finish any explicitly approved legacy import before opening.
// Authentication is verified remotely; a local profile/email never grants access.
export async function openAccountSession(client: SupabaseClient, storage: KeyValueStorage, offlineAccess?: ReturnType<typeof createOfflineAccess>) {
  const { data: identity, error } = await client.auth.getUser();
  let offline = false;
  let user: {id: string; email?: string} | null = identity.user;
  if (error) {
    const cached = offlineAccess ? await client.auth.getSession() : null;
    const allowed = cached && !cached.error ? await offlineAccess?.allowedAccount(error, cached.data.session?.user.id ?? null) : null;
    if (!allowed) throw error;
    if (await storage.getItem(`${accountStorageKey(allowed)}:workspace:v1`) === null) throw new Error("Connect to restore this account before using it offline.");
    user = {id: allowed};
    offline = true;
  }
  if (!user) throw new Error("Sign in before opening account data.");
  accountStorageKey(user.id);
  const workspace = createAccountWorkspace(storage, user.id);
  const data = createAccountData(workspace);
  const sync = createAccountSync(workspace, createCloudRecordStore(client, user.id));
  let closed = false;
  let deleting = false;
  let unsubscribe = () => {};
  const listeners = new Set<() => void>();
  function close() {
    if (closed) return;
    closed = true;
    sync.dispose();
    data.close();
    unsubscribe();
    for (const listener of listeners) listener();
    listeners.clear();
  }
  function active() {
    if (closed) throw new Error("Account session closed.");
  }
  const subscription = client.auth.onAuthStateChange((event, session) => {
    // Keep this callback synchronous: awaiting auth calls inside it can deadlock.
    if (event === "SIGNED_OUT" || (session && session.user.id !== user.id)) close();
  });
  unsubscribe = () => subscription.data.subscription.unsubscribe();
  if (closed) unsubscribe();
  try {
    // Close the race between the first identity lookup and listener registration.
    if (offline) {
      const cached = await client.auth.getSession();
      if (cached.error || cached.data.session?.user.id !== user.id) throw new Error("Account changed while opening.");
    } else {
      const { data: verified, error: verificationError } = await client.auth.getUser();
      if (verificationError) throw verificationError;
      if (verified.user?.id !== user.id) throw new Error("Account changed while opening.");
    }
    active();
    await workspace.snapshot();
    if (!offline && await data.loadUserSettings()) await offlineAccess?.rememberVerifiedAccount(user.id);
    active();
  } catch (failure) {
    close();
    throw failure;
  }
  return {
    userId: user.id,
    email: user.email ?? null,
    get isOffline() { return offline; },
    data,
    close,
    onClosed(listener: () => void) {
      if (closed) { listener(); return () => {}; }
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    async previewWebImport(raw: string) {
      active();
      const input = parseWebLogExport(raw);
      const plan = await workspace.previewWebImport(input);
      active();
      return {...plan, workouts: input.workouts.filter(workout => plan.dates.includes(workout.date)).length,
        assumedGoalDays: input.assumedGoalDays};
    },
    async importWebLogs(raw: string, approvedDates: string[]) {
      active();
      if (deleting) throw new Error("Account deletion is in progress.");
      const verified = await client.auth.getUser();
      if (verified.error || verified.data.user?.id !== user.id) throw new Error("Connect and sign in to this account before importing.");
      active();
      return workspace.importWebLogs(parseWebLogExport(raw), approvedDates, () => {
        active();
        if (deleting) throw new Error("Account deletion is in progress.");
      });
    },
    async synchronize() {
      active();
      if (offline) {
        const verified = await client.auth.getUser();
        if (verified.error) {
          if (verified.error.status === 401 || verified.error.status === 403) {
            close();
            await offlineAccess?.revoke();
          }
          throw verified.error;
        }
        if (verified.data.user?.id !== user.id) {
          close();
          await offlineAccess?.revoke();
          throw new Error("Sign in again before syncing this account.");
        }
        active();
      }
      const result = await sync.run();
      active();
      if (await data.loadUserSettings()) await offlineAccess?.rememberVerifiedAccount(user.id);
      offline = false;
      return result;
    },
    async conflicts() {
      active();
      const state = await workspace.snapshot();
      active();
      return state.conflicts;
    },
    async resolveConflict(...args: Parameters<typeof workspace.resolve>) {
      active();
      await workspace.resolve(...args);
      active();
    },
    async signOut() {
      active();
      if (deleting) throw new Error("Wait for account deletion to finish before signing out.");
      // Lock the UI/storage immediately, even if remote/local auth cleanup fails.
      close();
      let offlineCleanupFailed = false;
      try { await offlineAccess?.revoke(); }
      catch { offlineCleanupFailed = true; }
      const { error: signOutError } = await client.auth.signOut({scope: "local"});
      if (signOutError) throw signOutError;
      if (offlineCleanupFailed) throw new Error("Signed out, but offline permission cleanup needs attention. Account records were retained.");
    },
    async deleteAccount(confirmRemote: (userId: string) => Promise<"cancelled" | "deleted">) {
      active();
      if (deleting) throw new Error("Account deletion is already in progress.");
      deleting = true;
      try {
        await offlineAccess?.revoke();
        const result = await confirmRemote(user.id);
        if (result === "cancelled") return result;
        if (result !== "deleted") throw new Error("Account deletion was not confirmed. Device records were retained.");
        close();
        try {
          await createDeletionRecovery(storage, async id => {
            const current = await client.auth.getSession();
            if (current.error) throw current.error;
            if (current.data.session?.user.id === id) {
              const result = await client.auth.signOut({scope: "local"});
              if (result.error) throw result.error;
            }
          }).recordAndFinish(user.id);
        } catch {
          throw new Error("Your cloud account was deleted. Device cache cleanup needs attention. Reopen the app to retry saved cleanup; if this persists, contact support. Do not repeat cloud account deletion.");
        }
        return "deleted" as const;
      } finally { deleting = false; }
    },
  };
}

export type AccountSession = Awaited<ReturnType<typeof openAccountSession>>;
