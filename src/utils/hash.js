const encoder = new TextEncoder();

/**
 * Constant-time string comparison
 */
const constantTimeCompare = (a, b) => {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};

/**
 * PBKDF2 Password Hashing Utility
 * Format: pbkdf2:iterations:salt_hex:hash_hex
 */
export const hashPassword = async (password, iterations = 100000) => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: iterations,
      hash: "SHA-256",
    },
    baseKey,
    256
  );

  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  return `pbkdf2:${iterations}:${saltHex}:${hashHex}`;
};

/**
 * Verify Password against Hash
 */
export const verifyPassword = async (password, storedHash) => {
  if (typeof password !== 'string' || typeof storedHash !== 'string') return false;

  const parts = storedHash.split(':');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;

  const iterations = parseInt(parts[1], 10);
  if (!Number.isFinite(iterations) || iterations < 10000 || iterations > 1000000) {
    return false;
  }

  const saltHex = parts[2];
  if (saltHex.length !== 32) return false; // 16 bytes = 32 hex chars
  const saltBytes = saltHex.match(/.{1,2}/g);
  if (!saltBytes) return false;

  let salt;
  try {
    salt = new Uint8Array(saltBytes.map(byte => {
      const b = parseInt(byte, 16);
      if (isNaN(b)) throw new Error();
      return b;
    }));
  } catch (e) {
    return false;
  }

  const originalHashHex = parts[3];
  if (originalHashHex.length !== 64) return false; // 32 bytes = 64 hex chars

  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: iterations,
      hash: "SHA-256",
    },
    baseKey,
    256
  );

  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  return constantTimeCompare(hashHex, originalHashHex);
};
