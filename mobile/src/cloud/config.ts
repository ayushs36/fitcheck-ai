export const MOBILE_PROJECT_URL = "https://uzjrzjfduzqhfvypmlra.supabase.co";

export function validateCloudConfig(url: string | undefined, key: string | undefined) {
  if (!url || !key) throw new Error("Cloud accounts are not configured in this build.");
  if (url !== MOBILE_PROJECT_URL) throw new Error("Unexpected mobile backend project.");
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) {
    throw new Error("Mobile configuration requires a publishable key, never a server secret.");
  }
  return { url, key };
}
