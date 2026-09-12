import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { getMobileCloudClient } from "./client";
import { runAppleSignIn } from "./appleSignInFlow";
import { runAccountDeletion } from "./accountDeletionFlow";
import { createAccountDeletionRemote } from "./accountDeletionRemote";

let signingIn = false;
export async function signInWithApple() {
  if (signingIn) throw new Error("Sign-in is already in progress.");
  signingIn = true;
  try {
    if (!await AppleAuthentication.isAvailableAsync()) throw new Error("Sign in with Apple is unavailable on this device.");
    const client = getMobileCloudClient();
    return await runAppleSignIn({
      auth: client.auth,
      random: () => Array.from(Crypto.getRandomBytes(32), byte => byte.toString(16).padStart(2, "0")).join(""),
      sha256: value => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value),
      request: options => AppleAuthentication.signInAsync({
        ...options, requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
      }),
    });
  } finally { signingIn = false; }
}

export async function signOutCloudAccount() {
  const { error } = await getMobileCloudClient().auth.signOut({ scope: "local" });
  if (error) throw error;
  // Account-scoped fitness data is retained; the account UI must unmount on sign-out.
}

// Not connected to the UI until post-deletion cleanup and device QA are ready.
export async function confirmAppleAccountDeletion(userId: string, confirmed: boolean) {
  if (!confirmed) throw new Error("Confirm account deletion before continuing.");
  if (signingIn) throw new Error("Apple authentication is already in progress.");
  signingIn = true;
  try {
    if (!await AppleAuthentication.isAvailableAsync()) throw new Error("Sign in with Apple is unavailable on this device.");
    return await runAccountDeletion(userId, confirmed, {
      ...createAccountDeletionRemote(getMobileCloudClient(), userId),
      random: () => Array.from(Crypto.getRandomBytes(32), byte => byte.toString(16).padStart(2, "0")).join(""),
      sha256: value => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value),
      requestApple: options => AppleAuthentication.signInAsync({...options, requestedScopes: []}),
    });
  } finally { signingIn = false; }
}
