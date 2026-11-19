const encoder = new TextEncoder();

/**
 * Base64URL encode a buffer or string
 */
const base64UrlEncode = (data) => {
  const base64 = typeof data === "string" ? btoa(data) : btoa(String.fromCharCode(...new Uint8Array(data)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

/**
 * Base64URL decode to string
 */
const base64UrlDecode = (str) => {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return atob(str);
};

/**
 * Verify HS256 JWT Signature and Claims
 */
export const verifyJwt = async (token, secret, options = {}) => {
  if (!token || !secret) return { valid: false, error: "Missing token or secret" };

  const parts = token.split(".");
  if (parts.length !== 3) return { valid: false, error: "Invalid token format" };

  const [headerB64, payloadB64, signatureB64] = parts;

  try {
    // 1. Verify Header (Algorithm must be HS256)
    const header = JSON.parse(base64UrlDecode(headerB64));
    if (header.alg !== "HS256" || header.typ !== "JWT") {
      return { valid: false, error: "Unsupported algorithm or token type" };
    }

    // 2. Verify Signature
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signature = Uint8Array.from(base64UrlDecode(signatureB64), c => c.charCodeAt(0));
    const data = encoder.encode(`${headerB64}.${payloadB64}`);

    const isValidSig = await crypto.subtle.verify("HMAC", key, signature, data);
    if (!isValidSig) return { valid: false, error: "Invalid signature" };

    // 3. Verify Claims
    const payload = JSON.parse(base64UrlDecode(payloadB64));
    const now = Math.floor(Date.now() / 1000);
    const clockSkew = 30; // 30 seconds tolerance

    // iat (issued at) validation
    if (typeof payload.iat !== 'number' || !Number.isFinite(payload.iat)) {
      return { valid: false, error: "Missing or invalid iat" };
    }
    if (payload.iat > now + clockSkew) {
      return { valid: false, error: "Token issued in the future" };
    }

    // exp (expiration) validation
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
      return { valid: false, error: "Missing or invalid exp" };
    }
    if (payload.exp <= payload.iat) {
      return { valid: false, error: "Expiration must be after issued-at" };
    }
    if (payload.exp < now - clockSkew) {
      return { valid: false, error: "Token expired" };
    }

    // exp - iat validation (max 30 minutes)
    if (payload.exp - payload.iat > 1800) {
      return { valid: false, error: "Token duration exceeds 30 minutes" };
    }

    // Issuer
    if (options.iss && payload.iss !== options.iss) {
      return { valid: false, error: "Invalid issuer" };
    }

    // Audience
    if (options.aud && payload.aud !== options.aud) {
      return { valid: false, error: "Invalid audience" };
    }

    // Subject
    if (!payload.sub || typeof payload.sub !== 'string') {
      return { valid: false, error: "Missing or invalid subject" };
    }

    // Role
    if (options.role && payload.role !== options.role) {
      return { valid: false, error: "Invalid role" };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: "Token parsing failed" };
  }
};

/**
 * Sign HS256 JWT
 */
export const signJwt = async (payload, secret) => {
  const header = { alg: "HS256", typ: "JWT" };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const data = encoder.encode(`${headerB64}.${payloadB64}`);

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, data);
  const signatureB64 = base64UrlEncode(signature);

  return `${headerB64}.${payloadB64}.${signatureB64}`;
};
