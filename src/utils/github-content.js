const textDecoder = new TextDecoder();

export const MAX_FILE_SIZE = 1024 * 1024; // 1 MB

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
