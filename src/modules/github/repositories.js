import { success } from "../../utils/response.js";
import { GitHubClient } from "../../core/github.js";
import { HttpError } from "../../core/errors.js";

const CONFIG_MAX_BYTES = 32 * 1024;
const CONFIG_TIMEOUT_MS = 8000;
const OWNER_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const REPO_PATTERN = /^[A-Za-z0-9_.-]{1,100}$/;
const PROJECT_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CONTROL_CHAR_PATTERN = /[\x00-\x1F\x7F]/;

const getTrustedProjectOrigin = (value, env = {}) => {
  if (typeof value !== "string" || !value) return null;

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  // Origin headers must be canonical HTTPS origins, never URLs with paths,
  // credentials, query strings, fragments, or explicit ports.
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.port ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash ||
    parsed.origin !== value
  ) {
    return null;
  }

  if (typeof env.ALLOWED_ORIGINS !== "string") return null;

  // Only exact entries establish a project-to-repository trust boundary.
  // Wildcard entries remain valid for CORS, but are deliberately ignored here.
  const trustedOrigins = env.ALLOWED_ORIGINS
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => {
      if (!entry || entry.startsWith("*.")) return false;
      try {
        const candidate = new URL(entry);
        return (
          candidate.protocol === "https:" &&
          !candidate.username &&
          !candidate.password &&
          !candidate.port &&
          candidate.pathname === "/" &&
          !candidate.search &&
          !candidate.hash &&
          candidate.origin === entry
        );
      } catch {
        return false;
      }
    });

  return trustedOrigins.includes(value) ? value : null;
};

const validateRepositoryConfig = (config, trustedOwner) => {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return false;
  }

  const topLevelKeys = Object.keys(config).sort();
  if (
    topLevelKeys.length !== 3 ||
    topLevelKeys[0] !== "project" ||
    topLevelKeys[1] !== "repository" ||
    topLevelKeys[2] !== "schema_version" ||
    config.schema_version !== 1
  ) {
    return false;
  }

  const project = config.project;
  const repository = config.repository;
  if (
    !project ||
    typeof project !== "object" ||
    Array.isArray(project) ||
    Object.keys(project).length !== 1 ||
    typeof project.id !== "string" ||
    project.id.length < 2 ||
    project.id.length > 48 ||
    !PROJECT_ID_PATTERN.test(project.id) ||
    CONTROL_CHAR_PATTERN.test(project.id)
  ) {
    return false;
  }

  if (
    !repository ||
    typeof repository !== "object" ||
    Array.isArray(repository) ||
    Object.keys(repository).length !== 2 ||
    typeof repository.username !== "string" ||
    !OWNER_PATTERN.test(repository.username) ||
    CONTROL_CHAR_PATTERN.test(repository.username) ||
    repository.username.toLowerCase() !== String(trustedOwner || "").toLowerCase() ||
    typeof repository.repo !== "string" ||
    !REPO_PATTERN.test(repository.repo) ||
    repository.repo === "." ||
    repository.repo === ".." ||
    CONTROL_CHAR_PATTERN.test(repository.repo)
  ) {
    return false;
  }

  return true;
};

const fetchCallerRepositoryConfig = async (origin) => {
  const configUrl = new URL("/config.json", origin);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG_TIMEOUT_MS);
  const startedAt = Date.now();
  let stage = "fetch";

  try {
    const response = await fetch(configUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      redirect: "manual",
      credentials: "omit",
      cache: "no-store",
      signal: controller.signal
    });

    stage = "response";
    console.info("[CALLER_CONFIG] response", {
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get("content-type"),
      contentLength: response.headers.get("content-length"),
      durationMs: Date.now() - startedAt
    });

    if (response.status >= 300 && response.status < 400) {
      throw new HttpError("Caller repository config redirects are not allowed", 502);
    }
    if (response.status === 404) {
      throw new HttpError("Caller repository config not found", 404);
    }
    if (!response.ok) {
      throw new HttpError("Unable to retrieve caller repository config", 502);
    }

    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > CONFIG_MAX_BYTES) {
      throw new HttpError("Caller repository config is too large", 413);
    }

    stage = "read-body";
    const reader = response.body?.getReader();
    if (!reader) {
      throw new HttpError("Caller repository config is empty", 422);
    }

    const chunks = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > CONFIG_MAX_BYTES) {
        await reader.cancel();
        throw new HttpError("Caller repository config is too large", 413);
      }
      chunks.push(value);
    }

    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    let config;
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      config = JSON.parse(text);
    } catch {
      throw new HttpError("Caller repository config is invalid JSON", 422);
    }

    return config;
  } catch (err) {
    if (err instanceof HttpError) throw err;

    console.error("[CALLER_CONFIG] request failed", {
      stage,
      errorName: err?.name || "UnknownError",
      errorMessage: err?.message || "Unknown error",
      durationMs: Date.now() - startedAt
    });

    if (err?.name === "AbortError") {
      throw new HttpError("Caller repository config request timed out", 504);
    }
    throw new HttpError("Unable to retrieve caller repository config", 502);
  } finally {
    clearTimeout(timeoutId);
  }
};

export const resolveProjectRepository = async (request, env) => {
  const origin = request.headers.get("Origin");
  const trustedOrigin = getTrustedProjectOrigin(origin, env);
  if (!trustedOrigin) throw new HttpError("Origin is not trusted for repository discovery", 403);

  const config = await fetchCallerRepositoryConfig(trustedOrigin);
  if (!validateRepositoryConfig(config, env.GITHUB_OWNER)) {
    throw new HttpError("Caller repository config does not match schema v1", 422);
  }

  const owner = config.repository.username;
  const repo = config.repository.repo;
  const discoveryClient = new GitHubClient({ ...env, GITHUB_OWNER: owner, GITHUB_REPO: repo });
  const data = await discoveryClient.getRepository();

  if (data.visibility !== "public") throw new HttpError("Caller repository must be public", 403);

  const expectedFullName = `${owner}/${repo}`;
  if (
    typeof data.full_name !== "string" ||
    data.full_name.toLowerCase() !== expectedFullName.toLowerCase() ||
    typeof data.default_branch !== "string" ||
    !data.default_branch ||
    data.default_branch.length > 255 ||
    CONTROL_CHAR_PATTERN.test(data.default_branch)
  ) throw new HttpError("GitHub repository metadata is invalid", 502);

  // The branch comes only from GitHub metadata; config.json cannot override it.
  // Reuse the validated discovery client and pin every Contents API call
  // to the default branch reported by GitHub.
  discoveryClient.branch = data.default_branch;
  const client = discoveryClient;

  return {
    client,
    metadata: {
      name: data.full_name,
      description: data.description,
      url: data.html_url,
      default_branch: data.default_branch,
      visibility: data.visibility
    }
  };
};

export const getRepositoryMetadata = async (request, env) => {
  const { client, metadata } = await resolveProjectRepository(request, env);
  return success({
    ...metadata,
    _metadata: { github_ratelimit: client.rateLimit }
  });
};

export const getBranchMetadata = async (request, env) => {
  const client = new GitHubClient(env);
  const data = await client.getBranch();
  return success({
    name: data.name,
    commit: data.commit.sha,
    protected: data.protected,
    _metadata: { github_ratelimit: client.rateLimit }
  });
};
