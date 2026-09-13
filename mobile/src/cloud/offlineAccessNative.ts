import * as SecureStore from "expo-secure-store";
import {createOfflineAccess} from "./offlineAccess";

// Separate from the Supabase session key and from all fitness-record storage.
// Startup additionally requires the matching cached session and existing workspace.
export const nativeOfflineAccess = createOfflineAccess({
  getItem: key => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  }),
});
