/**
 * Encodes Uint8Array or UTF-8 string to Base64 in chunks.
 * Handles payloads > 100KB without throwing RangeError (call stack overflow).
 * @param {Uint8Array|string} input
 * @returns {string} Base64 encoded string
 */
export const uint8ArrayToBase64 = (input) => {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  const CHUNK_SIZE = 0x8000; // 32KB
  const chunks = [];
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
    chunks.push(String.fromCharCode.apply(null, chunk));
  }
  return btoa(chunks.join(""));
};
