import { HttpError } from "../core/errors.js";

const CURRENT_KEY_ID = "v1";
const ENVELOPE_KEYS = ["version", "algorithm", "keyId", "iv", "ciphertext"];
const MAX_PLAINTEXT_BYTES = 700 * 1024;
const MAX_CIPHERTEXT_BYTES = MAX_PLAINTEXT_BYTES + 64;

const encodeBase64Url = bytes => {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const decodeBase64Url = value => {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
    return Uint8Array.from(binary, char => char.charCodeAt(0));
  } catch {
    return null;
  }
};

const getKey = async secret => {
  const raw = decodeBase64Url(secret);
  if (!raw || raw.byteLength !== 32) throw new HttpError("Encrypted storage is unavailable", 503);
  try {
    return await crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
  } catch {
    throw new HttpError("Encrypted storage is unavailable", 503);
  }
};

const makeAad = (path, version) => new TextEncoder().encode(
  `dekeku-api|dashboard-storage|v${version}|${path}`
);

const validatePath = path => {
  if (typeof path !== "string" || !/^private\/dashboard\/[a-z0-9._-]{1,80}\.json$/.test(path)) {
    throw new HttpError("Invalid encrypted storage context", 500);
  }
};

export const encryptDashboardDocument = async (document, secret, path, keyId = CURRENT_KEY_ID) => {
  validatePath(path);
  if (keyId !== CURRENT_KEY_ID) throw new HttpError("Invalid encryption key identifier", 500);
  let plaintext;
  try {
    const serialized = JSON.stringify(document);
    if (typeof serialized !== "string") throw new Error("not serializable");
    plaintext = new TextEncoder().encode(serialized);
  } catch { throw new HttpError("Dashboard document cannot be serialized", 422); }
  if (plaintext.byteLength > MAX_PLAINTEXT_BYTES) throw new HttpError("Dashboard metadata exceeds the size limit", 413);

  const key = await getKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  try {
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: makeAad(path, 1), tagLength: 128 },
      key,
      plaintext
    );
    return {
      version: 1,
      algorithm: "A256GCM",
      keyId,
      iv: encodeBase64Url(iv),
      ciphertext: encodeBase64Url(new Uint8Array(encrypted))
    };
  } catch {
    throw new HttpError("Dashboard metadata encryption failed", 500);
  }
};

export const decryptDashboardDocument = async (envelope, secret, path) => {
  validatePath(path);
  if (
    !envelope || typeof envelope !== "object" || Array.isArray(envelope) ||
    Object.keys(envelope).length !== ENVELOPE_KEYS.length ||
    ENVELOPE_KEYS.some(key => !Object.prototype.hasOwnProperty.call(envelope, key)) ||
    envelope.version !== 1 || envelope.algorithm !== "A256GCM" ||
    envelope.keyId !== CURRENT_KEY_ID
  ) {
    throw new HttpError("Encrypted dashboard metadata is invalid", 502);
  }
  const iv = decodeBase64Url(envelope.iv);
  const ciphertext = decodeBase64Url(envelope.ciphertext);
  if (!iv || iv.byteLength !== 12 || !ciphertext || ciphertext.byteLength < 16 ||
      ciphertext.byteLength > MAX_CIPHERTEXT_BYTES) {
    throw new HttpError("Encrypted dashboard metadata is invalid", 502);
  }
  const key = await getKey(secret);
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv, additionalData: makeAad(path, envelope.version), tagLength: 128 },
      key,
      ciphertext
    );
    if (plaintext.byteLength > MAX_PLAINTEXT_BYTES) throw new Error("size");
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(plaintext);
    return JSON.parse(decoded);
  } catch {
    throw new HttpError("Encrypted dashboard metadata could not be authenticated", 502);
  }
};

export const DASHBOARD_ENCRYPTED_STORAGE_LIMITS = Object.freeze({
  plaintextBytes: MAX_PLAINTEXT_BYTES,
  ciphertextBytes: MAX_CIPHERTEXT_BYTES,
  ivBytes: 12,
  tagBytes: 16
});
