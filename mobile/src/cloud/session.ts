import type { SupabaseClient } from "@supabase/supabase-js";
import { accountStorageKey, type KeyValueStorage } from "../storage/accountStorage.ts";
import { createAccountData } from "./accountData.ts";
import { createCloudRecordStore } from "./recordStore.ts";
import { createAccountSync } from "./sync.ts";
import { createAccountWorkspace } from "./workspace.ts";

// The caller must finish any explicitly approved legacy import before opening.
// Authentication is verified remotely; a local profile/email never grants access.
export async function openAccountSession(client: SupabaseClient, storage: KeyValueStorage) {
  const { data: identity, error } = await client.auth.getUser();
  if (error) throw error;
  const user = identity.user;
  if (!user) throw new Error("Sign in before opening account data.");
  accountStorageKey(user.id);
  const workspace = createAccountWorkspace(storage, user.id);
  const data = createAccountData(workspace);
  const sync = createAccountSync(workspace, createCloudRecordStore(client, user.id));
  let closed = false;
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
    const { data: verified, error: verificationError } = await client.auth.getUser();
    if (verificationError) throw verificationError;
    if (verified.user?.id !== user.id) throw new Error("Account changed while opening.");
    active();
    await workspace.snapshot();
    active();
  } catch (failure) {
    close();
    throw failure;
  }
  return {
    userId: user.id,
    email: user.email ?? null,
    data,
    close,
    onClosed(listener: () => void) {
      if (closed) { listener(); return () => {}; }
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    async synchronize() {
      active();
      const result = await sync.run();
      active();
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
      // Lock the UI/storage immediately, even if remote/local auth cleanup fails.
      close();
      const { error: signOutError } = await client.auth.signOut({scope: "local"});
      if (signOutError) throw signOutError;
    },
  };
}

export type AccountSession = Awaited<ReturnType<typeof openAccountSession>>;
