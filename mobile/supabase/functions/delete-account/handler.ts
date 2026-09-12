// Server-only. Deployment supplies adapters that verify tokens and keep all
// administrator credentials out of the mobile application.
export type DeletionServices = {
  authenticate: (bearer: string) => Promise<{id: string; appleSubject: string} | null>;
  exchangeAppleCode: (code: string) => Promise<{subject: string; refreshToken: string}>;
  revokeAppleToken: (refreshToken: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
};
function response(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {status, headers: {
    "Content-Type": "application/json", "Cache-Control": "no-store",
  }});
}
async function readBody(request: Request) {
  if (Number(request.headers.get("content-length")) > 8192 || !request.body) throw new Error("Invalid body");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const {value, done} = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 8192) { await reader.cancel(); throw new Error("Body too large"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
export function createDeleteAccountHandler(services: DeletionServices) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") return response(405, {error: "method_not_allowed"});
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ") || authorization.length > 8192) return response(401, {error: "sign_in_required"});
    let user;
    try { user = await services.authenticate(authorization.slice(7)); }
    catch { return response(503, {error: "identity_verification_unavailable"}); }
    if (!user?.id || !user.appleSubject) return response(401, {error: "apple_account_required"});
    let body;
    try { body = await readBody(request); }
    catch { return response(400, {error: "invalid_request"}); }
    if (!body || typeof body !== "object" || Array.isArray(body)
      || body.confirmed !== true || typeof body.authorizationCode !== "string"
      || !body.authorizationCode.trim() || body.authorizationCode.length > 4096
      || Object.keys(body).some(key => !["confirmed", "authorizationCode"].includes(key))) {
      return response(400, {error: "deletion_confirmation_required"});
    }
    let apple;
    try { apple = await services.exchangeAppleCode(body.authorizationCode); }
    catch { return response(401, {error: "apple_reauthentication_required"}); }
    if (apple.subject !== user.appleSubject || !apple.refreshToken) return response(403, {error: "apple_account_mismatch"});
    try { await services.revokeAppleToken(apple.refreshToken); }
    catch { return response(503, {error: "apple_revocation_incomplete"}); }
    try { await services.deleteUser(user.id); }
    catch { return response(503, {error: "account_deletion_incomplete", reauthenticateToRetry: true}); }
    return response(200, {deleted: true});
  };
}
