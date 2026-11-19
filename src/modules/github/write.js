import { HttpError } from "../../core/errors.js";

const MAX_BODY_SIZE = 1153434; // 1.1 MB
const MAX_FILE_SIZE = 1048576; // 1 MB

/**
 * Validates path for writable access (public/data/ only, .json only)
 */
export const validateWritablePath = (path) => {
  if (typeof path !== "string" || !path.startsWith("public/data/")) {
    return { valid: false, status: 403, error: "Access restricted to public/data/ directory" };
  }

  // Strict path validation: no encoding, no backslashes, no traversal
  if (path.includes("%") || path.includes("\\") || path.includes("..") || path.includes("//")) {
    return { valid: false, status: 400, error: "Invalid path" };
  }

  if (/[\\x00-\\x1F\\x7F]/.test(path)) {
    return { valid: false, status: 400, error: "Invalid characters in path" };
  }

  if (!path.endsWith(".json")) {
    return { valid: false, status: 403, error: "Only .json files allowed" };
  }

  return { valid: true };
};

/**
 * Parses and validates request body for write operations
 */
export const parseAndValidateBody = async (request) => {
  // 1. Content-Type check
  if (request.headers.get("Content-Type") !== "application/json") {
    throw new HttpError("Content-Type must be application/json", 415);
  }

  // 2. Early Content-Length check
  const contentLength = parseInt(request.headers.get("Content-Length") || "0");
  if (contentLength > MAX_BODY_SIZE) {
    throw new HttpError("Payload too large", 413);
  }

  // 3. Streaming body parsing
  const reader = request.body.getReader();
  let totalBytes = 0;
  const chunks = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > MAX_BODY_SIZE) {
        await reader.cancel();
        throw new HttpError("Payload too large", 413);
      }
      chunks.push(value);
    }
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError("Failed to read request body", 400);
  }

  if (totalBytes === 0) throw new HttpError("Empty request body", 400);

  // Combine bytes
  const bodyBytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bodyBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  // 4. Decode UTF-8
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bodyBytes);
  } catch (e) {
    throw new HttpError("Invalid UTF-8 encoding", 422);
  }

  // 5. Parse JSON
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new HttpError("Invalid JSON", 422);
  }

  // 6. Validate structure (Root must be object or array)
  if (typeof data !== "object" || data === null) {
    throw new HttpError("Root must be object or array", 422);
  }

  // 7. Validate path and content size
  const pathValidation = validateWritablePath(data.path);
  if (!pathValidation.valid) {
    throw new HttpError(pathValidation.error, pathValidation.status);
  }

  // Measure final file size (serialised JSON)
  const serialisedContent = JSON.stringify(data.content);
  const finalSize = new TextEncoder().encode(serialisedContent).byteLength;

  if (finalSize > MAX_FILE_SIZE) {
    throw new HttpError("File content too large", 413);
  }

  return { ...data, finalSize, serialisedContent };
};

/**
 * Creates a new file (CREATE operation)
 * Note: GitHub will return 409 if file already exists since we don't provide SHA
 */
export const createFile = async (githubClient, path, content, message) => {
  // Encode content to Base64
  const encoder = new TextEncoder();
  const contentBytes = encoder.encode(content);
  const base64Content = btoa(String.fromCharCode(...contentBytes));

  // Prepare request body (no SHA for create)
  const body = {
    message,
    content: base64Content,
    branch: githubClient.branch
  };

  // Encode path for URL
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");

  return githubClient.request(`/contents/${encodedPath}`, {
    method: "PUT",
    body: JSON.stringify(body)
  });
};

/**
 * Updates an existing file (UPDATE operation) - requires SHA
 */
export const updateFile = async (githubClient, path, content, sha, message) => {
  // Validate SHA
  const SHA_REGEX = /^[0-9a-fA-F]{40}$/;
  if (typeof sha !== "string" || !SHA_REGEX.test(sha)) {
    throw new HttpError("Invalid SHA format", 400);
  }

  // Encode content to Base64
  const encoder = new TextEncoder();
  const contentBytes = encoder.encode(content);
  const base64Content = btoa(String.fromCharCode(...contentBytes));

  // Prepare request body with SHA
  const body = {
    message,
    content: base64Content,
    sha,
    branch: githubClient.branch
  };

  // Encode path for URL
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");

  return githubClient.request(`/contents/${encodedPath}`, {
    method: "PUT",
    body: JSON.stringify(body)
  });
};

/**
 * Deletes a file (DELETE operation) - requires SHA
 */
export const deleteFile = async (githubClient, path, sha, message) => {
  // Validate SHA
  const SHA_REGEX = /^[0-9a-fA-F]{40}$/;
  if (typeof sha !== "string" || !SHA_REGEX.test(sha)) {
    throw new HttpError("Invalid SHA format", 400);
  }

  // Prepare request body with SHA
  const body = {
    message,
    sha,
    branch: githubClient.branch
  };

  // Encode path for URL
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");

  return githubClient.request(`/contents/${encodedPath}`, {
    method: "DELETE",
    body: JSON.stringify(body)
  });
};
