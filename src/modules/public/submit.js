import { HttpError } from "../../core/errors.js";
import { GitHubClient } from "../../core/github.js";
import { getAllowedOrigin } from "../../middleware/cors.js";
import { success } from "../../utils/response.js";
import { readPrivateDocument } from "../rbac/storage.js";

const MAX_BODY_SIZE = 15360;
const MAX_FILE_SIZE = 1024 * 1024;
const MAX_WRITE_ATTEMPTS = 3;
const GUESTBOOK_PATH = "assets/data/bukutamu.json";
const SHA_PATTERN = /^[a-f0-9]{40}$/i;

const readJsonBody = async request => {
  const contentType = request.headers.get("Content-Type") || "";
  if (!/^application\/json(?:\s*;|\s*$)/i.test(contentType)) {
    throw new HttpError("Content-Type must be application/json", 415);
  }

  const rawLength = request.headers.get("Content-Length");
  if (rawLength !== null) {
    if (!/^(0|[1-9][0-9]*)$/.test(rawLength)) {
      throw new HttpError("Invalid Content-Length", 400);
    }
    if (Number(rawLength) > MAX_BODY_SIZE) throw new HttpError("Payload too large", 413);
  }

  const reader = request.body?.getReader();
  if (!reader) throw new HttpError("Request body is required", 400);
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_SIZE) {
        await reader.cancel();
        throw new HttpError("Payload too large", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (!total) throw new HttpError("Request body is required", 400);

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let source;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new HttpError("Request body is not valid UTF-8", 400);
  }
  try {
    const body = JSON.parse(source);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("JSON object required");
    }
    return body;
  } catch {
    throw new HttpError("Invalid JSON object", 400);
  }
};

const resolveRepository = async (request, env) => {
  const origin = getAllowedOrigin(request.headers.get("Origin"), env);
  if (!origin) throw new HttpError("A valid allowlisted Origin is required", 403);

  // The private database is always read from the configured central repository.
  const database = new GitHubClient(env);
  const { document: users } = await readPrivateDocument(database, "users");
  const { document: mappings } = await readPrivateDocument(database, "repositories", users);
  const mapping = mappings.repositories.find(item =>
    item.status === "active" && item.origin === origin
  );
  if (!mapping) throw new HttpError("Origin is not registered for Guestbook submission", 403);

  // Repository coordinates come only from the validated private mapping.
  return {
    github: new GitHubClient({
      ...env,
      GITHUB_OWNER: mapping.owner,
      GITHUB_REPO: mapping.repo,
      GITHUB_BRANCH: mapping.branch
    })
  };
};

const decodeGuestbookFile = file => {
  if (!file || file.type !== "file" || typeof file.sha !== "string" || !SHA_PATTERN.test(file.sha)) {
    throw new HttpError("Guestbook storage metadata is invalid", 502);
  }
  if (!Number.isInteger(file.size) || file.size < 0 || file.size > MAX_FILE_SIZE) {
    throw new HttpError("Guestbook storage exceeds the 1 MB limit", 413);
  }
  if (typeof file.content !== "string") {
    throw new HttpError("Guestbook storage content is unavailable", 502);
  }

  let bytes;
  try {
    const binary = atob(file.content.replace(/\s/g, ""));
    bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  } catch {
    throw new HttpError("Guestbook storage is not valid Base64", 502);
  }

  let source;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new HttpError("Guestbook storage is not valid UTF-8", 502);
  }

  let entries;
  try {
    entries = JSON.parse(source);
  } catch {
    throw new HttpError("Guestbook storage contains invalid JSON", 502);
  }
  if (!Array.isArray(entries)) {
    throw new HttpError("Guestbook storage must contain a JSON array", 502);
  }
  return { entries, sha: file.sha };
};

const readEntries = async github => {
  const file = await github.request(
    "/contents/" + GUESTBOOK_PATH.split("/").map(encodeURIComponent).join("/") +
      "?ref=" + encodeURIComponent(github.branch),
    { method: "GET" }
  );
  return decodeGuestbookFile(file);
};

const validatePayload = body => {
  if (Object.keys(body).some(key => !["name", "message", "email"].includes(key))) {
    throw new HttpError("Request contains unsupported fields", 422);
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!name || name.length > 100) {
    throw new HttpError("Field 'name' is required and must be between 1 and 100 characters", 422);
  }
  if (!message || message.length > 1000) {
    throw new HttpError("Field 'message' is required and must be between 1 and 1000 characters", 422);
  }

  let email = "";
  if (body.email !== undefined) {
    if (typeof body.email !== "string" || body.email.length > 254) {
      throw new HttpError("Invalid 'email' format", 422);
    }
    email = body.email.trim();
  }
  return {
    name,
    message,
    ...(email ? { email } : {}),
    createdAt: new Date().toISOString()
  };
};

export const handlePublicSubmit = async (request, env) => {
  if (request.method !== "POST") throw new HttpError("Method Not Allowed", 405);

  const body = await readJsonBody(request);
  const submission = validatePayload(body);
  const { github } = await resolveRepository(request, env);

  // Do not mistake an inaccessible/missing mapped repository for an empty Guestbook.
  const targetRepository = await github.getRepository();
  if (!targetRepository || targetRepository.private !== false) {
    throw new HttpError("Mapped website repository must be public", 403);
  }

  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt += 1) {
    let entries = [];
    let sha = null;
    let exists = true;
    try {
      const current = await readEntries(github);
      entries = current.entries;
      sha = current.sha;
    } catch (err) {
      if (err.status !== 404) throw err;
      exists = false;
    }

    entries.push(submission);
    const serialized = JSON.stringify(entries, null, 2);
    const bytes = new TextEncoder().encode(serialized);
    if (bytes.byteLength > MAX_FILE_SIZE) {
      throw new HttpError("Guestbook file has reached its 1 MB storage limit", 413);
    }

    try {
      const result = exists
        ? await github.putFile(GUESTBOOK_PATH, bytes, sha, "Append public guestbook entry")
        : await github.createFile(GUESTBOOK_PATH, bytes, "Create public guestbook");
      return success({
        message: "Submission successful",
        file: "bukutamu.json",
        path: GUESTBOOK_PATH,
        count: entries.length,
        sha: result.content?.sha
      }, 201);
    } catch (err) {
      if (err.status !== 409) throw err;
    }
  }

  throw new HttpError("Guestbook is busy; please retry the submission", 409);
};
