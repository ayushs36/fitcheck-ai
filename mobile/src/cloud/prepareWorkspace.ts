import { accountStorageKey, createAccountMigration, type KeyValueStorage, type LocalSnapshot } from "../storage/accountStorage.ts";
import { createAccountWorkspace } from "./workspace.ts";

export async function needsWorkspaceSetup(storage: KeyValueStorage, ownerId: string) {
  return await storage.getItem(`${accountStorageKey(ownerId)}:workspace:v1`) === null;
}

export async function prepareAccountWorkspace(storage: KeyValueStorage, ownerId: string,
  choice: "separate" | "import", snapshot?: LocalSnapshot) {
  if (!await needsWorkspaceSetup(storage, ownerId)) throw new Error("Workspace already exists. Existing records were not replaced.");
  const workspace = createAccountWorkspace(storage, ownerId);
  if (choice === "separate") {
    await workspace.receive([]);
    return;
  }
  if (choice !== "import" || !snapshot) throw new Error("Choose whether to import device records.");
  const key = accountStorageKey(ownerId);
  const source = await storage.getItem(key);
  if (source === null) {
    await createAccountMigration(storage)(ownerId, snapshot, true);
  } else if (source !== JSON.stringify(snapshot) || source !== await storage.getItem(`${key}:before-import`)) {
    throw new Error("An earlier import differs from device data. Backups were preserved; merge is required.");
  }
  await workspace.importVerifiedBackup();
}
