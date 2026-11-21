import { HttpError } from "../../core/errors.js";
import { decodeBase64, MAX_FILE_SIZE } from "../../utils/github-content.js";
import { uint8ArrayToBase64 } from "../../utils/base64.js";

const SHA_PATTERN = /^[a-f0-9]{40}$/i;
const ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;
const USERNAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{2,31}$/;
const HASH_PATTERN = /^pbkdf2:([1-9][0-9]{4,6}):[a-f0-9]{32}:[a-f0-9]{64}$/i;
const OWNER_REPO_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9._-]{0,98}[A-Za-z0-9])?$/;

const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
const isTimestamp = value => typeof value === "string" && Number.isFinite(Date.parse(value));
const hasOnlyKeys = (value, allowed) => Object.keys(value).every(key => allowed.includes(key));

export const PRIVATE_STORAGE_PATHS = Object.freeze({
  users: "private/auth/users.json",
  repositories: "private/repositories/mappings.json"
});

export const validatePrivateStoragePath = path =>
  Object.values(PRIVATE_STORAGE_PATHS).includes(path);

export const validateUsersDocument = document => {
  if (!isObject(document) || document.version !== 1 || !Array.isArray(document.users)) {
    throw new HttpError("Invalid private users document", 422);
  }

  const ids = new Set();
  const usernames = new Set();
  for (const user of document.users) {
    if (!isObject(user) || !hasOnlyKeys(user, [
      "id", "username", "passwordHash", "role", "status", "createdAt", "updatedAt"
    ])) {
      throw new HttpError("Invalid user record", 422);
    }
    if (typeof user.id !== "string" || !ID_PATTERN.test(user.id) || ids.has(user.id)) {
      throw new HttpError("Invalid or duplicate user ID", 422);
    }
    if (typeof user.username !== "string" || !USERNAME_PATTERN.test(user.username)) {
      throw new HttpError("Invalid username in private storage", 422);
    }
    const usernameKey = user.username.toLowerCase();
    if (usernames.has(usernameKey)) throw new HttpError("Duplicate username in private storage", 422);
    const hashMatch = typeof user.passwordHash === "string" ? HASH_PATTERN.exec(user.passwordHash) : null;
    if (!hashMatch || Number(hashMatch[1]) < 10000 || Number(hashMatch[1]) > 1000000) {
      throw new HttpError("Invalid password hash in private storage", 422);
    }
    if (user.role !== "user" || !["active", "disabled"].includes(user.status)) {
      throw new HttpError("Invalid user role or status", 422);
    }
    if (!isTimestamp(user.createdAt) || !isTimestamp(user.updatedAt)) {
      throw new HttpError("Invalid user timestamps", 422);
    }
    ids.add(user.id);
    usernames.add(usernameKey);
  }
  return document;
};

export const normalizeRegisteredOrigin = origin => {
  if (typeof origin !== "string" || origin.length > Origin.MAX_LENGTH) return null;
  try {
    const url = new URL(origin);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.origin !== origin ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) return null;
    return url.origin;
  } catch {
    return null;
  }
};

const Origin = { MAX_LENGTH: 512 };

export const validateRepositoryMappingsDocument = (document, usersDocument = null) => {
  if (!isObject(document) || document.version !== 1 || !Array.isArray(document.repositories)) {
    throw new HttpError("Invalid private repository mappings document", 422);
  }

  const ids = new Set();
  const activeRepositories = new Set();
  const activeOrigins = new Set();
  const knownUsers = usersDocument ? new Set(usersDocument.users.map(user => user.id)) : null;

  for (const mapping of document.repositories) {
    if (!isObject(mapping) || !hasOnlyKeys(mapping, [
      "id", "userId", "owner", "repo", "branch", "origin", "status", "createdAt", "updatedAt"
    ])) {
      throw new HttpError("Invalid repository mapping record", 422);
    }
    if (typeof mapping.id !== "string" || !ID_PATTERN.test(mapping.id) || ids.has(mapping.id)) {
      throw new HttpError("Invalid or duplicate repository mapping ID", 422);
    }
    if (typeof mapping.userId !== "string" || !ID_PATTERN.test(mapping.userId)) {
      throw new HttpError("Invalid repository mapping user ID", 422);
    }
    if (knownUsers && !knownUsers.has(mapping.userId)) {
      throw new HttpError("Repository mapping references an unknown user", 422);
    }
    if (typeof mapping.owner !== "string" || !OWNER_REPO_PATTERN.test(mapping.owner) ||
        typeof mapping.repo !== "string" || !OWNER_REPO_PATTERN.test(mapping.repo)) {
      throw new HttpError("Invalid repository owner or name", 422);
    }
    if (
      typeof mapping.branch !== "string" ||
      mapping.branch.length < 1 ||
      mapping.branch.length > 255 ||
      /[\x00-\x20\x7f~^:?*[]/.test(mapping.branch) ||
      mapping.branch.includes("..") ||
      mapping.branch.includes("//") ||
      mapping.branch.endsWith("/") ||
      mapping.branch.endsWith(".") ||
      mapping.branch.includes("@{")
    ) {
      throw new HttpError("Invalid repository branch", 422);
    }
    if (normalizeRegisteredOrigin(mapping.origin) !== mapping.origin) {
      throw new HttpError("Invalid registered Origin", 422);
    }
    if (!["active", "disabled"].includes(mapping.status)) {
      throw new HttpError("Invalid repository mapping status", 422);
    }
    if (!isTimestamp(mapping.createdAt) || !isTimestamp(mapping.updatedAt)) {
      throw new HttpError("Invalid repository mapping timestamps", 422);
    }

    if (mapping.status === "active") {
      const repositoryKey = `${mapping.owner.toLowerCase()}/${mapping.repo.toLowerCase()}`;
      if (activeRepositories.has(repositoryKey)) {
        throw new HttpError("Repository is already assigned to an active account", 409);
      }
      if (activeOrigins.has(mapping.origin)) {
        throw new HttpError("Origin is already assigned to an active repository", 409);
      }
      activeRepositories.add(repositoryKey);
      activeOrigins.add(mapping.origin);
    }
    ids.add(mapping.id);
  }
  return document;
};

const PRIVATE_DOCUMENTS = Object.freeze({
  users: {
    path: "private/auth/users.json",
    empty: () => ({ version: 1, users: [] }),
    validate: validateUsersDocument
  },
  repositories: {
    path: "private/repositories/mappings.json",
    empty: () => ({ version: 1, repositories: [] }),
    validate: validateRepositoryMappingsDocument
  }
});

const getDocumentConfig = key => {
  const config = PRIVATE_DOCUMENTS[key];
  if (!config) throw new HttpError("Unknown private storage document", 400);
  return config;
};

const encodePath = path => path.split("/").map(encodeURIComponent).join("/");

export const readPrivateDocument = async (githubClient, key, usersDocument = null) => {
  const config = getDocumentConfig(key);
  if (!validatePrivateStoragePath(config.path)) throw new HttpError("Private storage path is not allowed", 500);

  let file;
  try {
    file = await githubClient.request(
      `/contents/${encodePath(config.path)}?ref=${encodeURIComponent(githubClient.branch)}`,
      { method: "GET" }
    );
  } catch (err) {
    if (!(err instanceof HttpError) || err.status !== 404) throw err;
    // A private repository that is missing or inaccessible must not be treated as an empty database.
    await githubClient.getRepository();
    const document = config.empty();
    config.validate(document, usersDocument);
    return { document, sha: null, exists: false, path: config.path };
  }

  if (!file || file.type !== "file" || typeof file.sha !== "string" || !SHA_PATTERN.test(file.sha)) {
    throw new HttpError("Private storage file metadata is invalid", 502);
  }
  if (!Number.isInteger(file.size) || file.size < 0 || file.size > MAX_FILE_SIZE) {
    throw new HttpError("Private storage file exceeds the size limit", 413);
  }

  const raw = typeof file.content === "string" ? decodeBase64(file.content) : null;
  if (raw === null) throw new HttpError("Private storage file is not valid UTF-8", 502);

  let document;
  try { document = JSON.parse(raw); }
  catch { throw new HttpError("Private storage file contains invalid JSON", 502); }
  config.validate(document, usersDocument);
  return { document, sha: file.sha, exists: true, path: config.path };
};

export const writePrivateDocument = async (githubClient, key, document, expectedSha) => {
  const config = getDocumentConfig(key);
  if (!validatePrivateStoragePath(config.path)) throw new HttpError("Private storage path is not allowed", 500);
  config.validate(document);

  if (expectedSha !== null && (typeof expectedSha !== "string" || !SHA_PATTERN.test(expectedSha))) {
    throw new HttpError("A valid current SHA is required to update private storage", 400);
  }

  const serialized = JSON.stringify(document);
  const bytes = new TextEncoder().encode(serialized);
  if (bytes.byteLength > MAX_FILE_SIZE) throw new HttpError("Private storage file exceeds the size limit", 413);

  const body = {
    message: `dekeku-api: update private ${key} storage`,
    content: uint8ArrayToBase64(serialized),
    branch: githubClient.branch
  };
  if (expectedSha !== null) body.sha = expectedSha;

  const result = await githubClient.request(`/contents/${encodePath(config.path)}`, {
    method: "PUT",
    body: JSON.stringify(body)
  });
  const sha = result?.content?.sha;
  if (typeof sha !== "string" || !SHA_PATTERN.test(sha)) {
    throw new HttpError("GitHub did not return a valid private storage SHA", 502);
  }
  return { path: config.path, sha, size: bytes.byteLength };
};
