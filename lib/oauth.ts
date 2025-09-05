import { googleOAuthConfig } from "./config";
import { encodeBase64urlNoPadding } from "./encoding";
import { Google } from "./google";
import { validateIdToken } from "./token";

export function generateState(): string {
  const randomValues = new Uint8Array(32);
  crypto.getRandomValues(randomValues);
  return encodeBase64urlNoPadding(randomValues);
}

export function generateCodeVerifier(): string {
  const randomValues = new Uint8Array(32);
  crypto.getRandomValues(randomValues);
  return encodeBase64urlNoPadding(randomValues);
}

export function generateNonce(): string {
  const randomValues = new Uint8Array(32);
  crypto.getRandomValues(randomValues);
  return encodeBase64urlNoPadding(randomValues);
}

async function validateGoogleIdToken(
  idToken: string,
  nonce: string,
): Promise<object> {
  return validateIdToken(idToken, googleOAuthConfig.clientId, nonce);
}

export const google = new Google(
  googleOAuthConfig.clientId,
  googleOAuthConfig.clientSecret,
  googleOAuthConfig.redirectUrl,
);

google.validateIdToken = validateGoogleIdToken;
