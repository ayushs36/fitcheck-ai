import type { User, SupabaseClient } from "@supabase/supabase-js";

type AppleCredential = { identityToken: string | null; state: string | null };
type Dependencies = {
  auth: Pick<SupabaseClient["auth"], "signInWithIdToken">;
  random: () => string;
  sha256: (value: string) => Promise<string>;
  request: (options: { nonce: string; state: string }) => Promise<AppleCredential>;
};

export async function runAppleSignIn(deps: Dependencies): Promise<User | null> {
  const rawNonce = deps.random();
  const state = deps.random();
  let credential: AppleCredential;
  try {
    credential = await deps.request({ nonce: await deps.sha256(rawNonce), state });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ERR_REQUEST_CANCELED") return null;
    throw error;
  }
  if (credential.state !== state) throw new Error("Apple sign-in response did not match this request.");
  if (!credential.identityToken) throw new Error("Apple did not return a sign-in token.");
  // Supabase verifies Apple's signed token and compares its hashed nonce.
  const { data, error } = await deps.auth.signInWithIdToken({
    provider: "apple", token: credential.identityToken, nonce: rawNonce,
  });
  if (error) throw error;
  if (!data.session || !data.user) throw new Error("Apple sign-in did not complete.");
  return data.user;
}
