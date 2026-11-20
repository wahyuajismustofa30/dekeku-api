import { HttpError } from "../../core/errors.js";
import { GitHubClient } from "../../core/github.js";
import { getAllowedOrigin } from "../../middleware/cors.js";
import { decodeBase64 } from "../../utils/github-content.js";
import { success } from "../../utils/response.js";

const MAX_BODY_SIZE = 15360;
const MAX_FILE_SIZE = 1024 * 1024;
const MAX_WRITE_ATTEMPTS = 3;

const getGuestbookPath = (request, env) => {
  const allowedOrigin = getAllowedOrigin(request.headers.get("Origin"), env);
  if (!allowedOrigin) throw new HttpError("A valid allowlisted Origin is required", 403);
  const hostname = new URL(allowedOrigin).hostname.toLowerCase();
  return `public/data/${hostname}/bukutamu.json`;
};

const readEntries = async (github, path) => {
  const file = await github.getFile(path);
  if (!file || typeof file.content !== "string" || typeof file.sha !== "string") {
    throw new HttpError("Guestbook storage response is invalid", 502);
  }
  const decoded = decodeBase64(file.content);
  if (decoded === null) throw new HttpError("Guestbook storage is not valid UTF-8", 502);
  let entries;
  try { entries = JSON.parse(decoded); }
  catch { throw new HttpError("Guestbook storage contains invalid JSON", 502); }
  if (!Array.isArray(entries)) throw new HttpError("Guestbook storage must contain a JSON array", 502);
  return { entries, sha: file.sha };
};

export const handlePublicSubmit = async (request, env) => {
  if (request.method !== "POST") throw new HttpError("Method Not Allowed", 405);

  const filePath = getGuestbookPath(request, env);
  const contentType = request.headers.get("Content-Type") || "";
  if (!/^application\/json(?:\s*;|\s*$)/i.test(contentType)) {
    throw new HttpError("Content-Type must be application/json", 415);
  }
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_SIZE) {
    throw new HttpError("Payload too large", 413);
  }

  let bodyText;
  try { bodyText = await request.text(); }
  catch { throw new HttpError("Invalid request body", 400); }
  if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_SIZE) {
    throw new HttpError("Payload too large", 413);
  }

  let data;
  try { data = JSON.parse(bodyText); }
  catch { throw new HttpError("Invalid JSON", 400); }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new HttpError("Request body must be a JSON object", 400);
  }

  const name = typeof data.name === "string" ? data.name.trim() : "";
  const message = typeof data.message === "string" ? data.message.trim() : "";
  if (!name || name.length > 100) {
    throw new HttpError("Field 'name' is required and must be between 1 and 100 characters", 422);
  }
  if (!message || message.length > 1000) {
    throw new HttpError("Field 'message' is required and must be between 1 and 1000 characters", 422);
  }
  let email = "";
  if (data.email !== undefined) {
    if (typeof data.email !== "string" || data.email.length > 254) {
      throw new HttpError("Invalid 'email' format", 422);
    }
    email = data.email.trim();
  }

  const submission = {
    name, message, ...(email ? { email } : {}),
    createdAt: new Date().toISOString()
  };
  const github = new GitHubClient(env);
  let lastConflict;

  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt += 1) {
    let entries = [];
    let sha = null;
    let exists = true;
    try {
      const current = await readEntries(github, filePath);
      entries = current.entries;
      sha = current.sha;
    } catch (err) {
      if (err.status !== 404) throw err;
      exists = false;
    }

    entries.push(submission);
    const bytes = new TextEncoder().encode(JSON.stringify(entries, null, 2));
    if (bytes.byteLength > MAX_FILE_SIZE) {
      throw new HttpError("Guestbook file has reached its 1 MB storage limit", 413);
    }

    try {
      const result = exists
        ? await github.putFile(filePath, bytes, sha, "Append public guestbook entry")
        : await github.createFile(filePath, bytes, "Create public guestbook");
      return success({
        message: "Submission successful",
        file: "bukutamu.json",
        path: filePath,
        count: entries.length,
        sha: result.content?.sha
      }, 201);
    } catch (err) {
      if (err.status !== 409) throw err;
      lastConflict = err;
    }
  }

  throw new HttpError("Guestbook is busy; please retry the submission", 409, { cause: lastConflict });
};
