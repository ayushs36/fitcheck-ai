import { createContext, useContext, type ReactNode } from "react";
import * as localStorage from "./mobileStorage";

export type MobileStorage = Omit<typeof localStorage, "MOBILE_STORAGE_KEYS">;
const StorageContext = createContext<MobileStorage>(localStorage);

// The authenticated root must key/remount this provider by account session and
// close the previous account adapter. Never mutate an existing adapter's owner.
export function StorageProvider({storage, children}: {storage: MobileStorage; children: ReactNode}) {
  return <StorageContext.Provider value={storage}>{children}</StorageContext.Provider>;
}

export function useMobileStorage() {
  return useContext(StorageContext);
}
