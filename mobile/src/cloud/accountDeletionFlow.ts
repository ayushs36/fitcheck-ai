type AppleCredential = {state: string | null; authorizationCode: string | null};
type Dependencies = {
  verifyAccount: () => Promise<string | null>;
  random: () => string;
  sha256: (value: string) => Promise<string>;
  requestApple: (options: {state: string; nonce: string}) => Promise<AppleCredential>;
  deleteRemote: (body: {confirmed: true; authorizationCode: string}) => Promise<unknown>;
};

// This flow deliberately has no storage deletion or sign-in dependency. A fresh
// Apple prompt must never create a new Supabase account during account deletion.
export async function runAccountDeletion(
  expectedUserId: string,
  confirmed: boolean,
  dependencies: Dependencies,
): Promise<"cancelled" | "deleted"> {
  if (!confirmed || !expectedUserId) throw new Error("Confirm account deletion before continuing.");
  async function verify() {
    if (await dependencies.verifyAccount() !== expectedUserId) {
      throw new Error("Your signed-in account changed. Reopen Account and try again.");
    }
  }
  await verify();
  const state = dependencies.random();
  const nonce = await dependencies.sha256(dependencies.random());
  let credential: AppleCredential;
  try { credential = await dependencies.requestApple({state, nonce}); }
  catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ERR_REQUEST_CANCELED") return "cancelled";
    throw new Error("Apple confirmation did not complete. Your records have not been cleared.");
  }
  if (credential.state !== state || !credential.authorizationCode?.trim()) {
    throw new Error("Apple confirmation could not be verified. Please try again.");
  }
  await verify();
  let result: unknown;
  try {
    result = await dependencies.deleteRemote({confirmed: true, authorizationCode: credential.authorizationCode});
  } catch {
    throw new Error("Account deletion could not be confirmed. Device records were retained; check your connection before trying again.");
  }
  if (!result || typeof result !== "object" || !("deleted" in result) || result.deleted !== true) {
    throw new Error("The server did not confirm account deletion. Device records were retained.");
  }
  return "deleted";
}
