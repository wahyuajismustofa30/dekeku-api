const textDecoder = new TextDecoder();

export const MAX_FILE_SIZE = 1024 * 1024; // 1 MB

export const ALLOWED_EXTENSIONS = new Set([
  "json", "md", "txt", "html", "css", "js", "csv"
]);

export const SENSITIVE_FILENAMES = new Set([
  "package.json", "package-lock.json", "wrangler.jsonc", "wrangler.toml",
  "readme.md", ".gitignore", "secrets.json", "credentials.json", "config.local"
]);

export const BINARY_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "gif", "webp", "ico", "bmp", "tiff",
  "mp3", "wav", "flac", "ogg",
  "mp4", "webm", "mov", "avi",
  "zip", "rar", "7z", "tar", "gz",
  "pdf", "exe", "dll", "so", "bin"
]);

export const decodeBase64 = (b64) => {
  try {
    const bytes = Uint8Array.from(atob(b64.replace(/\s/g, "")), (c) => c.charCodeAt(0));
    return textDecoder.decode(bytes);
  } catch (err) {
    return null;
  }
};

export const parseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch (err) {
    return null;
  }
};

export const isBinaryFile = (path) => {
  const ext = path.split(".").pop()?.toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
};

export const validatePublicPath = (segments) => {
  // 1. Must start with "public"
  if (segments.length < 2 || segments[0] !== "public") {
    return { valid: false, status: 403, error: "Access restricted to public/ directory" };
  }

  const filename = segments[segments.length - 1].toLowerCase();

  // 2. Reject trailing dots or spaces
  if (filename.endsWith(".") || filename.endsWith(" ")) {
    return { valid: false, status: 400, error: "Invalid filename" };
  }

  // 3. Reject hidden segments (starting with dot)
  if (segments.some(s => s.startsWith("."))) {
    return { valid: false, status: 403, error: "Access to hidden files or directories is restricted" };
  }

  // 4. Reject sensitive filenames
  if (SENSITIVE_FILENAMES.has(filename)) {
    return { valid: false, status: 403, error: "Access to this file is restricted" };
  }

  // 5. Reject environment files
  if (filename === ".env" || filename.startsWith(".env.") || filename === ".dev.vars") {
    return { valid: false, status: 403, error: "Access to environment files is restricted" };
  }

  // 6. Reject keys and credentials
  if (filename.endsWith(".pem") || filename.endsWith(".key") || filename.includes("secret") || filename.includes("credential")) {
    return { valid: false, status: 403, error: "Access to sensitive credentials is restricted" };
  }

  // 7. Rejection by extension (Allowlist)
  const ext = filename.split(".").pop();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { valid: false, status: 403, error: "File extension not allowed" };
  }

  // 8. Explicit binary check (redundant but safe)
  if (BINARY_EXTENSIONS.has(ext)) {
    return { valid: false, status: 403, error: "Access to binary files is restricted" };
  }

  return { valid: true };
};
