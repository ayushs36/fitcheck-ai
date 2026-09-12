import { createClient } from "@supabase/supabase-js";
import { createAppleDeletionService } from "./apple.ts";
import { createDeleteAccountHandler } from "./handler.ts";
import { createSupabaseDeletionAdapter } from "./supabase.ts";

export async function createDeletionServer(readEnv: (name: string) => string | undefined) {
  function required(name: string) {
    const value = readEnv(name);
    if (!value?.trim()) throw new Error("Missing server configuration.");
    return value;
  }
  const url = required("SUPABASE_URL");
  if (url !== "https://uzjrzjfduzqhfvypmlra.supabase.co") {
    throw new Error("Unexpected mobile server project.");
  }
  const admin = createClient(url, required("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false},
  });
  const apple = await createAppleDeletionService({
    teamId: required("APPLE_TEAM_ID"),
    clientId: required("APPLE_CLIENT_ID"),
    keyId: required("APPLE_KEY_ID"),
    privateKey: required("APPLE_PRIVATE_KEY"),
  });
  return (request: Request) => {
    const account = createSupabaseDeletionAdapter(admin.auth);
    return createDeleteAccountHandler({...apple, ...account})(request);
  };
}
