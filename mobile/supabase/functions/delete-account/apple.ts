import { createRemoteJWKSet, importPKCS8, jwtVerify, SignJWT, type JWTVerifyGetKey } from "jose";

type Configuration = {teamId: string; keyId: string; clientId: string; privateKey: string};
type Dependencies = {fetch?: typeof fetch; verificationKeys?: JWTVerifyGetKey};
const issuer = "https://appleid.apple.com";

export async function createAppleDeletionService(config: Configuration, dependencies: Dependencies = {}) {
  if (config.teamId !== "XRAARJL4BX" || config.clientId !== "com.ayushs36.fitcheckai"
    || !/^[A-Z0-9]{10}$/.test(config.keyId)) throw new Error("Invalid Apple server configuration.");
  const signingKey = await importPKCS8(config.privateKey, "ES256");
  const verificationKeys = dependencies.verificationKeys ?? createRemoteJWKSet(new URL(`${issuer}/auth/keys`));
  const request = dependencies.fetch ?? fetch;
  async function clientSecret() {
    return new SignJWT({}).setProtectedHeader({alg: "ES256", kid: config.keyId})
      .setIssuer(config.teamId).setSubject(config.clientId).setAudience(issuer)
      .setIssuedAt().setExpirationTime("5m").sign(signingKey);
  }
  async function post(path: "token" | "revoke", fields: Record<string, string>) {
    const result = await request(`${issuer}/auth/${path}`, {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(10000),
      headers: {"Content-Type": "application/x-www-form-urlencoded"},
      body: new URLSearchParams({...fields, client_id: config.clientId, client_secret: await clientSecret()}),
    });
    if (!result.ok) throw new Error("Apple request did not complete.");
    return result;
  }
  return {
    async exchangeAppleCode(code: string) {
      const result = await post("token", {grant_type: "authorization_code", code});
      const tokens = await result.json();
      if (typeof tokens.id_token !== "string" || tokens.id_token.length > 16384
        || typeof tokens.refresh_token !== "string" || !tokens.refresh_token || tokens.refresh_token.length > 8192) {
        throw new Error("Apple did not return valid tokens.");
      }
      const {payload} = await jwtVerify(tokens.id_token, verificationKeys, {
        issuer, audience: config.clientId, algorithms: ["RS256"],
        requiredClaims: ["sub", "iat", "exp"], maxTokenAge: "5m", clockTolerance: 5,
      });
      if (!payload.sub) throw new Error("Missing Apple identity.");
      return {subject: payload.sub, refreshToken: tokens.refresh_token};
    },
    async revokeAppleToken(refreshToken: string) {
      await post("revoke", {token: refreshToken, token_type_hint: "refresh_token"});
    },
  };
}
