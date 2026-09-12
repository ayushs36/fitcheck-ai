import type { SupabaseClient } from "@supabase/supabase-js";
import type { DeletionServices } from "./handler.ts";

type AuthClient = {
  getUser: SupabaseClient["auth"]["getUser"];
  admin: Pick<SupabaseClient["auth"]["admin"], "deleteUser">;
};

// Create this adapter per request, never share an authenticated deletion target.
export function createSupabaseDeletionAdapter(auth: AuthClient): Pick<DeletionServices, "authenticate" | "deleteUser"> {
  let verifiedId: string | null = null;
  return {
    async authenticate(bearer: string) {
      verifiedId = null;
      if (!bearer.trim()) return null;
      const { data, error } = await auth.getUser(bearer);
      if (error) {
        if (error.status === 401 || error.status === 403) return null;
        throw new Error("Account verification unavailable.");
      }
      const user = data.user;
      if (!user || user.is_anonymous) return null;
      const identities = user.identities?.filter(identity => identity.provider === "apple") ?? [];
      if (identities.length !== 1) return null;
      const identity = identities[0];
      const subject = identity.identity_data?.sub;
      if (identity.user_id !== user.id || typeof subject !== "string" || !subject.trim()) return null;
      // Never derive Apple's subject from client-editable user_metadata or email.
      verifiedId = user.id;
      return { id: user.id, appleSubject: subject };
    },
    async deleteUser(id: string) {
      if (!verifiedId || id !== verifiedId) throw new Error("Account was not verified for deletion.");
      verifiedId = null;
      const { error } = await auth.admin.deleteUser(id, false);
      if (error) throw new Error("Account deletion unavailable.");
    },
  };
}
