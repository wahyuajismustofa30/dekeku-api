import { GitHubClient } from "../../core/github.js";
import { HttpError } from "../../core/errors.js";
import { userAuthMiddleware, repositoryOwnershipMiddleware } from "../../middleware/auth.js";
import { error, success } from "../../utils/response.js";
import { uint8ArrayToBase64 } from "../../utils/base64.js";

const MAX_FILE_SIZE = 1024 * 1024;
const MAX_BODY_SIZE = 1153434;
const SHA_PATTERN = /^[a-f0-9]{40}$/i;
const CONTROL_PATTERN = /[\x00-\x1F\x7F]/;

const encodePath = path => path.split("/").map(encodeURIComponent).join("/");

export const validateUserDataPath = path => {
  if (typeof path !== "string" || path.length < 1 || path.length > 512) {
    return { valid: false, status: 400, error: "A relative JSON file path is required" };
  }
  if (path.includes("%") || path.includes("\\") || path.includes("..") ||
      path.includes("//") || path.startsWith("/") || CONTROL_PATTERN.test(path)) {
    return { valid: false, status: 400, error: "Invalid data path" };
  }
  const segments = path.split("/");
  if (segments.some(segment =>
    !segment || segment === "." || segment === ".." || segment.startsWith(".") ||
    segment.endsWith(".") || segment.endsWith(" ") ||
    !/^[A-Za-z0-9][A-Za-z0-9._ -]{0,119}$/.test(segment)
  )) {
    return { valid: false, status: 400, error: "Invalid data path" };
  }
  if (!segments[segments.length - 1].toLowerCase().endsWith(".json")) {
    return { valid: false, status: 403, error: "Only JSON files are allowed" };
  }
  return { valid: true, path: "assets/data/" + segments.join("/") };
};

const readBody = async request => {
  const contentType = request.headers.get("Content-Type") || "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    throw new HttpError("Content-Type must be application/json", 415);
  }
  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_BODY_SIZE) throw new HttpError("Request body is too large", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError("Request body is required", 422);
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_SIZE) {
        await reader.cancel();
        throw new HttpError("Request body is too large", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (!total) throw new HttpError("Request body is required", 422);
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new HttpError("Request body is not valid UTF-8", 422);
  }
  try {
    const body = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body;
  } catch {
    throw new HttpError("Malformed JSON object", 422);
  }
};

const exactKeys = (body, allowed) => {
  if (Object.keys(body).some(key => !allowed.includes(key))) {
    throw new HttpError("Request contains unsupported fields", 422);
  }
};

const validateContent = content => {
  if (content === null || typeof content !== "object") {
    throw new HttpError("JSON content root must be an object or array", 422);
  }
  const serialized = JSON.stringify(content);
  if (typeof serialized !== "string") throw new HttpError("Invalid JSON content", 422);
  const bytes = new TextEncoder().encode(serialized);
  if (bytes.byteLength > MAX_FILE_SIZE) throw new HttpError("File content exceeds 1 MiB", 413);
  return { serialized, size: bytes.byteLength };
};

const decodeFile = file => {
  if (!file || file.type !== "file" || typeof file.sha !== "string" || !SHA_PATTERN.test(file.sha)) {
    throw new HttpError("GitHub file metadata is invalid", 502);
  }
  if (!Number.isInteger(file.size) || file.size < 0 || file.size > MAX_FILE_SIZE) {
    throw new HttpError("File content exceeds 1 MiB", 413);
  }
  if (typeof file.content !== "string") throw new HttpError("GitHub file content is unavailable", 502);
  let bytes;
  try {
    const binary = atob(file.content.replace(/\s/g, ""));
    bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  } catch {
    throw new HttpError("GitHub file content is not valid Base64", 502);
  }
  let source;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new HttpError("GitHub file content is not valid UTF-8", 502);
  }
  let content;
  try { content = JSON.parse(source); }
  catch { throw new HttpError("Stored file does not contain valid JSON", 422); }
  if (content === null || typeof content !== "object") {
    throw new HttpError("Stored JSON root must be an object or array", 422);
  }
  return { content, sha: file.sha, size: file.size };
};

const repositoryClient = (env, repository) => new GitHubClient({
  ...env,
  GITHUB_OWNER: repository.owner,
  GITHUB_REPO: repository.repo,
  GITHUB_BRANCH: repository.branch
});

const resolveOwnedRepository = (request, env, repositoryId, callback) =>
  repositoryOwnershipMiddleware(request, env, callback, repositoryId);

const requireRepoId = value => {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{8,64}$/.test(value)) {
    throw new HttpError("Valid repositoryId is required", 400);
  }
  return value;
};

export const handleUserRepositories = async (request, env) => {
  try {
    const github = new GitHubClient(env);
    const { document: mappings } = await import("../rbac/storage.js").then(module =>
      module.readPrivateDocument(github, "repositories")
    );
    const repositories = mappings.repositories
      .filter(mapping => mapping.userId === request.user.sub && mapping.status === "active")
      .map(({ id, owner, repo, branch, origin }) => ({ id, owner, repo, branch, origin }));
    return success({ repositories });
  } catch (err) {
    if (err instanceof HttpError) return error(err.message, err.status);
    throw err;
  }
};

export const handleUserData = async (request, env) => {
  try {
    const method = request.method;
    const url = new URL(request.url);
    let body = null;
    if (method !== "GET" && method !== "DELETE") {
      body = await readBody(request);
    } else if (method === "DELETE") {
      body = await readBody(request);
    }

    const repositoryId = requireRepoId(
      method === "GET" ? url.searchParams.get("repositoryId") : body.repositoryId
    );
    const rawPath = method === "GET" ? url.searchParams.get("path") : body.path;
    const pathResult = validateUserDataPath(rawPath);
    if (!pathResult.valid) throw new HttpError(pathResult.error, pathResult.status);
    const path = pathResult.path;

    const allowedKeys = method === "POST"
      ? ["repositoryId", "path", "content", "message"]
      : method === "PUT"
        ? ["repositoryId", "path", "content", "sha", "message"]
        : method === "DELETE"
          ? ["repositoryId", "path", "sha", "message"]
          : [];
    if (body) exactKeys(body, allowedKeys);

    return resolveOwnedRepository(request, env, repositoryId, async (authenticatedRequest) => {
      const repository = authenticatedRequest.repository;
      const github = repositoryClient(env, repository);
      const encodedPath = encodePath(path);

      if (method === "GET") {
        const file = await github.request(
          "/contents/" + encodedPath + "?ref=" + encodeURIComponent(github.branch),
          { method: "GET" }
        );
        const decoded = decodeFile(file);
        return success({ repositoryId, path, ...decoded });
      }

      if (method === "POST") {
        const { serialized, size } = validateContent(body.content);
        const result = await github.request("/contents/" + encodedPath, {
          method: "PUT",
          body: JSON.stringify({
            message: typeof body.message === "string" && body.message.length <= 256
              ? body.message : "Create user data file",
            content: uint8ArrayToBase64(serialized),
            branch: github.branch
          })
        });
        const sha = result?.content?.sha;
        if (typeof sha !== "string" || !SHA_PATTERN.test(sha)) {
          throw new HttpError("GitHub did not return a valid file SHA", 502);
        }
        return success({ repositoryId, path, sha, size, message: "File created successfully" }, 201);
      }

      if (method === "PUT") {
        const { serialized, size } = validateContent(body.content);
        if (typeof body.sha !== "string" || !SHA_PATTERN.test(body.sha)) {
          throw new HttpError("A valid current SHA is required for update", 400);
        }
        if (body.message !== undefined && (typeof body.message !== "string" || body.message.length > 256)) {
          throw new HttpError("Commit message must be a string up to 256 characters", 422);
        }
        const result = await github.request("/contents/" + encodedPath, {
          method: "PUT",
          body: JSON.stringify({
            message: body.message || "Update user data file",
            content: uint8ArrayToBase64(serialized),
            sha: body.sha,
            branch: github.branch
          })
        });
        const sha = result?.content?.sha;
        if (typeof sha !== "string" || !SHA_PATTERN.test(sha)) {
          throw new HttpError("GitHub did not return a valid file SHA", 502);
        }
        return success({ repositoryId, path, sha, size, message: "File updated successfully" });
      }

      if (method === "DELETE") {
        if (typeof body.sha !== "string" || !SHA_PATTERN.test(body.sha)) {
          throw new HttpError("A valid current SHA is required for delete", 400);
        }
        if (body.message !== undefined && (typeof body.message !== "string" || body.message.length > 256)) {
          throw new HttpError("Commit message must be a string up to 256 characters", 422);
        }
        const result = await github.request("/contents/" + encodedPath, {
          method: "DELETE",
          body: JSON.stringify({
            message: body.message || "Delete user data file",
            sha: body.sha,
            branch: github.branch
          })
        });
        return success({ repositoryId, path, commit: result?.commit?.sha || null, message: "File deleted successfully" });
      }

      throw new HttpError("Method Not Allowed", 405);
    });
  } catch (err) {
    if (err instanceof HttpError) return error(err.message, err.status);
    throw err;
  }
};

export const userDataRouter = async (request, env) =>
  userAuthMiddleware(request, env, async (req, e) => handleUserData(req, e));

export const userRepositoriesRouter = async (request, env) =>
  userAuthMiddleware(request, env, async (req, e) => handleUserRepositories(req, e));
