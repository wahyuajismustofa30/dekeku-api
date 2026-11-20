import { success } from "../../utils/response.js";
import { GitHubClient } from "../../core/github.js";
import { HttpError } from "../../core/errors.js";
import { getAllowedOrigin } from "../../middleware/cors.js";

const CONFIG_MAX_BYTES = 32 * 1024;
const CONFIG_TIMEOUT_MS = 8000;
const OWNER_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const REPO_PATTERN = /^[A-Za-z0-9_.-]{1,100}$/;

const fetchCallerRepositoryConfig = async (origin) => {
  const configUrl = new URL("/config.json", origin);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG_TIMEOUT_MS);

  try {
    const response = await fetch(configUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      redirect: "error",
      credentials: "omit",
      cache: "no-store",
      signal: controller.signal
    });

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

    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > CONFIG_MAX_BYTES) {
      throw new HttpError("Caller repository config is too large", 413);
    }

    let config;
    try {
      config = JSON.parse(text);
    } catch {
      throw new HttpError("Caller repository config is invalid JSON", 422);
    }

    return config?.repository;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    if (err?.name === "AbortError") {
      throw new HttpError("Caller repository config request timed out", 504);
    }
    throw new HttpError("Unable to retrieve caller repository config", 502);
  } finally {
    clearTimeout(timeoutId);
  }
};

export const getRepositoryMetadata = async (request, env) => {
  const origin = request.headers.get("Origin");
  const allowedOrigin = getAllowedOrigin(origin, env);
  if (!allowedOrigin) {
    throw new HttpError("Origin is not allowed", 403);
  }

  const repositoryConfig = await fetchCallerRepositoryConfig(allowedOrigin);
  const owner = repositoryConfig?.username;
  const repo = repositoryConfig?.repo;

  if (
    typeof owner !== "string" ||
    !OWNER_PATTERN.test(owner) ||
    owner.toLowerCase() !== String(env.GITHUB_OWNER || "").toLowerCase() ||
    typeof repo !== "string" ||
    !REPO_PATTERN.test(repo)
  ) {
    throw new HttpError("Caller repository identity is invalid", 422);
  }

  const client = new GitHubClient({
    ...env,
    GITHUB_OWNER: owner,
    GITHUB_REPO: repo
  });
  const data = await client.getRepository();

  if (data.visibility !== "public") {
    throw new HttpError("Caller repository must be public", 403);
  }

  return success({
    name: data.full_name,
    description: data.description,
    url: data.html_url,
    default_branch: data.default_branch,
    visibility: data.visibility,
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
