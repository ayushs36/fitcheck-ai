import { createClient, processLock, type SupabaseClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { AppState, Platform } from "react-native";
import { validateCloudConfig } from "./config";

declare const process: { env: {
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
} };

let client: SupabaseClient | undefined;

// Lazy initialization keeps the existing local-only app offline until integration.
export function getMobileCloudClient(): SupabaseClient {
  if (client) return client;
  if (Platform.OS === "web") throw new Error("Mobile cloud login requires the native app.");
  const config = validateCloudConfig(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  const storage = {
    getItem: (key: string) => SecureStore.getItemAsync(key),
    setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }),
    removeItem: (key: string) => SecureStore.deleteItemAsync(key),
  };
  client = createClient(config.url, config.key, {
    auth: { storage, storageKey: "fitcheck-coach-auth-v1", lock: processLock,
      persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  return client;
}

// The root account provider must call this once and dispose it on unmount.
export function watchCloudSessionLifecycle() {
  const auth = getMobileCloudClient().auth;
  const update = (state: string) => {
    if (state === "active") auth.startAutoRefresh();
    else auth.stopAutoRefresh();
  };
  update(AppState.currentState);
  const subscription = AppState.addEventListener("change", update);
  return () => { subscription.remove(); auth.stopAutoRefresh(); };
}
