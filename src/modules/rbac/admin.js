import { GitHubClient } from "../../core/github.js";
import { HttpError } from "../../core/errors.js";
import { hashPassword } from "../../utils/hash.js";
import { error, success } from "../../utils/response.js";
import {
  readPrivateDocument,
  writePrivateDocument,
  validateUsersDocument,
  validateRepositoryMappingsDocument,
  normalizeRegisteredOrigin
} from "../rbac/storage.js";

const USERNAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{2,31}$/;
const OWNER_REPO_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9._-]{0,98}[A-Za-z0-9])?$/;
const PASSWORD_MIN = 12;
const PASSWORD_MAX = 128;
const BODY_MAX = 16 * 1024;

const parseBody = async request => {
  const contentType = request.headers.get("Content-Type") || "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    throw new HttpError("Content-Type must be application/json", 415);
  }
  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > BODY_MAX) throw new HttpError("Request body is too large", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError("Request body is required", 422);
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > BODY_MAX) {
        await reader.cancel();
        throw new HttpError("Request body is too large", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  let text;
  try {
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
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

const requireExactKeys = (body, keys) => {
  if (Object.keys(body).some(key => !keys.includes(key))) {
    throw new HttpError("Request contains unsupported fields", 422);
  }
};

const newId = prefix => prefix + crypto.randomUUID().replaceAll("-", "");
const timestamp = () => new Date().toISOString();
const userPublic = user => ({
  id: user.id,
  username: user.username,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});
const mappingPublic = mapping => ({
  id: mapping.id,
  userId: mapping.userId,
  owner: mapping.owner,
  repo: mapping.repo,
  branch: mapping.branch,
  origin: mapping.origin,
  status: mapping.status,
  createdAt: mapping.createdAt,
  updatedAt: mapping.updatedAt
});

const getId = pathname => {
  const segment = pathname.split("/").pop();
  if (!segment || segment.includes("%")) throw new HttpError("Invalid resource ID", 400);
  let decoded;
  try { decoded = decodeURIComponent(segment); } catch { throw new HttpError("Invalid resource ID", 400); }
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(decoded)) throw new HttpError("Invalid resource ID", 400);
  return decoded;
};

const getStorage = async env => {
  const github = new GitHubClient(env);
  const users = await readPrivateDocument(github, "users");
  const repositories = await readPrivateDocument(github, "repositories", users.document);
  return { github, users, repositories };
};

export const handleAdminUsers = async (request, env, pathname) => {
  try {
    const { github, users } = await getStorage(env);
    const method = request.method;

    if (pathname === "/api/v1/admin/users" && method === "POST") {
      const body = await parseBody(request);
      requireExactKeys(body, ["username", "password"]);
      if (typeof body.username !== "string" || !USERNAME_PATTERN.test(body.username)) {
        throw new HttpError("Invalid username", 422);
      }
      if (typeof body.password !== "string" || body.password.length < PASSWORD_MIN || body.password.length > PASSWORD_MAX) {
        throw new HttpError("Password must be 12–128 characters", 422);
      }
      if (users.document.users.some(user => user.username.toLowerCase() === body.username.toLowerCase())) {
        throw new HttpError("Username is already registered", 409);
      }
      const now = timestamp();
      const user = {
        id: newId("usr_"),
        username: body.username,
        passwordHash: await hashPassword(body.password),
        role: "user",
        status: "active",
        createdAt: now,
        updatedAt: now
      };
      const next = { ...users.document, users: [...users.document.users, user] };
      validateUsersDocument(next);
      const written = await writePrivateDocument(github, "users", next, users.sha);
      return success({ user: userPublic(user), storage: { path: written.path, sha: written.sha } }, 201);
    }

    if (pathname === "/api/v1/admin/users" && method === "GET") {
      return success({ users: users.document.users.map(userPublic) });
    }

    const userId = getId(pathname);
    const user = users.document.users.find(item => item.id === userId);
    if (!user) throw new HttpError("User not found", 404);

    if (pathname === "/api/v1/admin/users/" + userId && method === "GET") {
      const { repositories } = await getStorage(env);
      return success({
        user: userPublic(user),
        repositories: repositories.document.repositories
          .filter(item => item.userId === userId)
          .map(mappingPublic)
      });
    }

    if (pathname === "/api/v1/admin/users/" + userId && method === "PATCH") {
      const body = await parseBody(request);
      requireExactKeys(body, ["status"]);
      if (!["active", "disabled"].includes(body.status)) throw new HttpError("Status must be active or disabled", 422);
      const updated = { ...user, status: body.status, updatedAt: timestamp() };
      const next = {
        ...users.document,
        users: users.document.users.map(item => item.id === userId ? updated : item)
      };
      validateUsersDocument(next);
      const written = await writePrivateDocument(github, "users", next, users.sha);
      return success({ user: userPublic(updated), storage: { path: written.path, sha: written.sha } });
    }

    if (pathname === "/api/v1/admin/users/" + userId + "/reset-password" && method === "POST") {
      const body = await parseBody(request);
      requireExactKeys(body, ["password"]);
      if (typeof body.password !== "string" || body.password.length < PASSWORD_MIN || body.password.length > PASSWORD_MAX) {
        throw new HttpError("Password must be 12–128 characters", 422);
      }
      const updated = { ...user, passwordHash: await hashPassword(body.password), updatedAt: timestamp() };
      const next = {
        ...users.document,
        users: users.document.users.map(item => item.id === userId ? updated : item)
      };
      validateUsersDocument(next);
      const written = await writePrivateDocument(github, "users", next, users.sha);
      return success({ user: userPublic(updated), storage: { path: written.path, sha: written.sha } });
    }

    if (pathname === "/api/v1/admin/users/" + userId + "/repositories" && method === "POST") {
      const body = await parseBody(request);
      requireExactKeys(body, ["owner", "repo", "branch", "origin"]);
      if (typeof body.owner !== "string" || !OWNER_REPO_PATTERN.test(body.owner) ||
          typeof body.repo !== "string" || !OWNER_REPO_PATTERN.test(body.repo)) {
        throw new HttpError("Invalid repository owner or name", 422);
      }
      const mapping = {
        id: newId("rep_"),
        userId,
        owner: body.owner,
        repo: body.repo,
        branch: body.branch,
        origin: body.origin,
        status: "active",
        createdAt: timestamp(),
        updatedAt: timestamp()
      };
      const next = { ...repositories.document, repositories: [...repositories.document.repositories, mapping] };
      validateRepositoryMappingsDocument(next, users.document);
      const written = await writePrivateDocument(github, "repositories", next, repositories.sha, users.document);
      return success({ repository: mappingPublic(mapping), storage: { path: written.path, sha: written.sha } }, 201);
    }

    if (pathname === "/api/v1/admin/users/" + userId + "/repositories" && method === "GET") {
      return success({
        repositories: repositories.document.repositories
          .filter(item => item.userId === userId)
          .map(mappingPublic)
      });
    }

    throw new HttpError("Not Found", 404);
  } catch (err) {
    if (err instanceof HttpError) return error(err.message, err.status);
    throw err;
  }
};

export const handleAdminRepositories = async (request, env, pathname) => {
  try {
    const { github, users, repositories } = await getStorage(env);
    const repositoryId = getId(pathname);
    const mapping = repositories.document.repositories.find(item => item.id === repositoryId);
    if (!mapping) throw new HttpError("Repository mapping not found", 404);

    if (request.method === "PATCH" || request.method === "DELETE") {
      let status = "disabled";
      if (request.method === "PATCH") {
        const body = await parseBody(request);
        requireExactKeys(body, ["status"]);
        if (!["active", "disabled"].includes(body.status)) throw new HttpError("Status must be active or disabled", 422);
        status = body.status;
      }
      const updated = { ...mapping, status, updatedAt: timestamp() };
      const next = {
        ...repositories.document,
        repositories: repositories.document.repositories.map(item => item.id === repositoryId ? updated : item)
      };
      validateRepositoryMappingsDocument(next, users.document);
      const written = await writePrivateDocument(github, "repositories", next, repositories.sha, users.document);
      return success({ repository: mappingPublic(updated), storage: { path: written.path, sha: written.sha } });
    }

    throw new HttpError("Method Not Allowed", 405);
  } catch (err) {
    if (err instanceof HttpError) return error(err.message, err.status);
    throw err;
  }
};
