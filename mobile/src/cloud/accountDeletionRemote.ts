import type { SupabaseClient } from "@supabase/supabase-js";

type Client = Pick<SupabaseClient, "auth" | "functions">;

export function createAccountDeletionRemote(client: Client, expectedUserId: string) {
  async function verifiedToken() {
    const {data, error} = await client.auth.getSession();
    if (error || !data.session?.access_token) throw new Error("Sign in again before deleting your account.");
    const token = data.session.access_token;
    const verified = await client.auth.getUser(token);
    if (verified.error || verified.data.user?.id !== expectedUserId) {
      throw new Error("Your signed-in account could not be verified.");
    }
    // Authentication can change while the remote identity request is in flight.
    const current = await client.auth.getSession();
    if (current.error || current.data.session?.user.id !== expectedUserId
      || current.data.session.access_token !== token) {
      throw new Error("Your session changed. Please try again.");
    }
    return token;
  }
  return {
    async verifyAccount() {
      await verifiedToken();
      return expectedUserId;
    },
    async deleteRemote(body: {confirmed: true; authorizationCode: string}): Promise<unknown> {
      const token = await verifiedToken();
      const {data, error} = await client.functions.invoke("delete-account", {
        body, headers: {Authorization: `Bearer ${token}`},
      });
      if (error) throw new Error("Account deletion could not be confirmed.");
      return data;
    },
  };
}
