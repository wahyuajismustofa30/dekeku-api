import { GitHubClient } from "../../core/github.js";
import { HttpError } from "../../core/errors.js";
import { success } from "../../utils/response.js";
import { decodeBase64 } from "../../utils/github-content.js";
import {
  readDashboardDocument,
  writeDashboardDocument,
  validateDashboardDocument
} from "./dashboard-storage.js";

const MAX_REPOSITORIES = 1000;
const OWNER_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const REPO_PATTERN = /^[A-Za-z0-9_.-]{1,100}$/;
const PROJECT_TYPES = new Set(["website", "invitation", "repository", "other"]);
const now = () => new Date().toISOString();
const safeError = error => ({
  message: error instanceof HttpError ? error.message : "Upstream request failed",
  status: error instanceof HttpError ? error.status : 502
});

const githubFetch = async (env, url) => {
  if (!env.GITHUB_TOKEN || !env.GITHUB_OWNER) throw new HttpError("GitHub configuration is missing", 500);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "dekeku-api-gateway",
        "X-GitHub-Api-Version": "2022-11-28"
      },
      signal: controller.signal
    });
    if (!response.ok) {
      const status = response.status === 404 ? 404 : response.status === 409 ? 409 :
        response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0" ? 429 : 502;
      throw new HttpError(status === 404 ? "Repository resource not found" :
        status === 409 ? "Repository resource conflict" :
        status === 429 ? "GitHub rate limit exceeded" : "GitHub request failed", status);
    }
    return response;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(error?.name === "AbortError" ? "GitHub request timed out" : "GitHub request failed",
      error?.name === "AbortError" ? 504 : 502);
  } finally {
    clearTimeout(timeout);
  }
};

export const discoverPublicRepositories = async env => {
  const owner = env.GITHUB_OWNER;
  if (!OWNER_PATTERN.test(owner || "")) throw new HttpError("Configured GitHub owner is invalid", 500);
  const repositories = [];
  for (let page = 1; page <= 10; page += 1) {
    const response = await githubFetch(env,
      `https://api.github.com/users/${encodeURIComponent(owner)}/repos?type=public&sort=updated&direction=desc&per_page=100&page=${page}`);
    const batch = await response.json();
    if (!Array.isArray(batch)) throw new HttpError("GitHub repository listing is invalid", 502);
    for (const item of batch) {
      if (item.owner?.login?.toLowerCase() !== owner.toLowerCase() || item.private !== false) continue;
      if (typeof item.name !== "string" || !REPO_PATTERN.test(item.name) ||
          typeof item.default_branch !== "string" || !item.default_branch) continue;
      repositories.push({
        id: item.id,
        name: item.name,
        fullName: item.full_name,
        owner: item.owner.login,
        url: item.html_url,
        visibility: item.visibility || "public",
        archived: Boolean(item.archived),
        defaultBranch: item.default_branch,
        updatedAt: item.updated_at || null,
        description: typeof item.description === "string" ? item.description.slice(0, 500) : null
      });
    }
    if (batch.length < 100) return repositories.slice(0, MAX_REPOSITORIES);
  }
  throw new HttpError("Repository discovery exceeded the configured safety limit", 413);
};

const readRepoPath = async (env, repository, path) => {
  const client = new GitHubClient({
    ...env,
    GITHUB_OWNER: repository.owner,
    GITHUB_REPO: repository.name,
    GITHUB_BRANCH: repository.defaultBranch
  });
  return client.getDirectoryContents(path);
};

const validatePublicConfig = (config, owner, repo) => {
  if (!config || typeof config !== "object" || Array.isArray(config) ||
      config.schema_version !== 1 || Object.keys(config).sort().join(",") !== "project,repository,schema_version") return false;
  if (!config.project || typeof config.project !== "object" || Array.isArray(config.project) ||
      Object.keys(config.project).length !== 1 ||
      typeof config.project.id !== "string" || config.project.id.length < 2 ||
      config.project.id.length > 48 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(config.project.id)) return false;
  if (!config.repository || typeof config.repository !== "object" || Array.isArray(config.repository) ||
      Object.keys(config.repository).length !== 2 ||
      typeof config.repository.username !== "string" ||
      typeof config.repository.repo !== "string" ||
      !OWNER_PATTERN.test(config.repository.username) ||
      !REPO_PATTERN.test(config.repository.repo) ||
      config.repository.username.toLowerCase() !== owner.toLowerCase() ||
      config.repository.repo.toLowerCase() !== repo.toLowerCase()) return false;
  return true;
};

const inspectFile = async (env, repository, path) => {
  try {
    const item = await readRepoPath(env, repository, path);
    if (!item || item.type !== "file") return { exists: false, valid: false, error: "Expected a file" };
    const raw = decodeBase64(item.content || "");
    if (raw === null) return { exists: true, valid: false, error: "File content is not valid UTF-8" };
    if (path === "config.json") {
      try {
        const config = JSON.parse(raw);
        return { exists: true, valid: validatePublicConfig(config, repository.owner, repository.name) };
      } catch {
        return { exists: true, valid: false, error: "Invalid JSON" };
      }
    }
    if (path === "CNAME") {
      const domain = raw.trim();
      const valid = domain.length <= 253 &&
        /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(domain);
      return { exists: true, valid, content: domain.slice(0, 253), ...(valid ? {} : { error: "Invalid CNAME domain" }) };
    }
    return { exists: true, valid: true };
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) return { exists: false, valid: false };
    throw error;
  }
};

const inspectDirectory = async (env, repository, path) => {
  try {
    const item = await readRepoPath(env, repository, path);
    return { exists: Array.isArray(item) || item?.type === "dir", valid: true };
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) return { exists: false, valid: false };
    throw error;
  }
};

export const inspectPublicRepository = async (env, repository) => {
  const checkedAt = now();
  const result = {
    checkedAt,
    stage: "repository",
    status: "active",
    config: { exists: false, valid: false },
    cname: { exists: false, valid: false, domain: null },
    assetsData: { exists: false, valid: false },
    error: null
  };
  try {
    const config = await inspectFile(env, repository, "config.json");
    result.config = config;
    result.stage = "cname";
    const cname = await inspectFile(env, repository, "CNAME");
    result.cname = { exists: cname.exists, valid: cname.valid, domain: cname.content || null };
    result.stage = "assets-data";
    result.assetsData = await inspectDirectory(env, repository, "assets/data");
    if (repository.archived) result.status = "inactive";
    else if ((config.exists && !config.valid) || (cname.exists && !cname.valid)) result.status = "problematic";
    return result;
  } catch (error) {
    result.status = "problematic";
    result.error = { ...safeError(error), stage: result.stage };
    return result;
  }
};

const parseBody = async request => {
  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > 65536) throw new HttpError("Request body is too large", 413);
  let body;
  try { body = await request.json(); } catch { throw new HttpError("Invalid JSON request body", 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new HttpError("Invalid request body", 400);
  return body;
};

export const handleDashboardRepositories = async (request, env) => {
  const [repositories, stored] = await Promise.all([
    discoverPublicRepositories(env),
    readDashboardDocument(new GitHubClient(env), env)
  ]);
  const metadata = new Map(stored.document.projects.map(project =>
    [`${project.owner.toLowerCase()}/${project.repo.toLowerCase()}`, project]));
  const items = repositories.map(repository => {
    const project = metadata.get(repository.fullName.toLowerCase()) || null;
    return { ...repository, projectType: project?.projectType || "other",
      domain: project?.domain || null, notes: project?.notes || "",
      lastCheck: project?.lastCheck || null, metadataExists: Boolean(project) };
  });
  return success({ items, total: items.length, storageSha: stored.sha });
};

export const handleDashboardMetadata = async (request, env) => {
  const body = await parseBody(request);
  const github = new GitHubClient(env);
  const stored = await readDashboardDocument(github, env);
  if (!Object.prototype.hasOwnProperty.call(body, "sha") || body.sha !== stored.sha) throw new HttpError("Dashboard metadata changed; reload before saving", 409);
  const owner = env.GITHUB_OWNER;
  const repo = body.repo;
  if (typeof repo !== "string" || !REPO_PATTERN.test(repo) ||
      !PROJECT_TYPES.has(body.projectType)) throw new HttpError("Invalid project metadata", 422);
  const discovered = await discoverPublicRepositories(env);
  const target = discovered.find(item => item.name.toLowerCase() === repo.toLowerCase());
  if (!target) throw new HttpError("Only discovered public repositories can be managed", 404);
  const timestamp = now();
  const index = stored.document.projects.findIndex(item =>
    item.owner.toLowerCase() === owner.toLowerCase() && item.repo.toLowerCase() === target.name.toLowerCase());
  const previous = index >= 0 ? stored.document.projects[index] : null;
  const project = {
    id: previous?.id || crypto.randomUUID().replace(/-/g, "").slice(0, 24),
    owner,
    repo: target.name,
    projectType: body.projectType,
    domain: body.domain === undefined ? previous?.domain || null : body.domain,
    notes: body.notes === undefined ? previous?.notes || "" : body.notes,
    createdAt: previous?.createdAt || timestamp,
    updatedAt: timestamp,
    lastCheck: previous?.lastCheck || null
  };
  const next = [...stored.document.projects];
  if (index >= 0) next[index] = project; else next.push(project);
  const document = { version: 1, projects: next };
  validateDashboardDocument(document);
  const saved = await writeDashboardDocument(github, env, document, stored.sha);
  return success({ project, sha: saved.sha });
};

export const handleDashboardBulkType = async (request, env) => {
  const body = await parseBody(request);
  if (!Array.isArray(body.repositories) || body.repositories.length < 1 ||
      body.repositories.length > 100 || !PROJECT_TYPES.has(body.projectType) ||
      body.repositories.some(repo => typeof repo !== "string" || !REPO_PATTERN.test(repo)) ||
      new Set(body.repositories.map(repo => repo.toLowerCase())).size !== body.repositories.length) {
    throw new HttpError("Invalid bulk project type request", 422);
  }
  const github = new GitHubClient(env);
  const stored = await readDashboardDocument(github, env);
  if (body.sha !== stored.sha) throw new HttpError("Dashboard metadata changed; reload before saving", 409);
  const discovered = await discoverPublicRepositories(env);
  const allowed = new Set(discovered.map(item => item.name.toLowerCase()));
  if (body.repositories.some(repo => !allowed.has(repo.toLowerCase()))) {
    throw new HttpError("Bulk update contains an unknown or non-public repository", 422);
  }
  const timestamp = now();
  const existing = new Map(stored.document.projects.map(item => [item.repo.toLowerCase(), item]));
  const projects = [...stored.document.projects];
  for (const repo of body.repositories) {
    const previous = existing.get(repo.toLowerCase());
    if (previous) {
      previous.projectType = body.projectType;
      previous.updatedAt = timestamp;
    } else {
      projects.push({
        id: crypto.randomUUID().replace(/-/g, "").slice(0, 24),
        owner: env.GITHUB_OWNER,
        repo: discovered.find(item => item.name.toLowerCase() === repo.toLowerCase()).name,
        projectType: body.projectType,
        domain: null,
        notes: "",
        createdAt: timestamp,
        updatedAt: timestamp,
        lastCheck: null
      });
    }
  }
  const document = { version: 1, projects };
  validateDashboardDocument(document);
  const saved = await writeDashboardDocument(github, env, document, stored.sha);
  return success({ updated: body.repositories.length, sha: saved.sha });
};

export const handleDashboardExport = async (request, env) => {
  const body = await parseBody(request);
  if (!Array.isArray(body.repositories) || body.repositories.length < 1 ||
      body.repositories.length > 1000 ||
      body.repositories.some(repo => typeof repo !== "string" || !REPO_PATTERN.test(repo))) {
    throw new HttpError("Invalid export selection", 422);
  }
  const [repositories, stored] = await Promise.all([
    discoverPublicRepositories(env),
    readDashboardDocument(new GitHubClient(env), env)
  ]);
  const selected = new Set(body.repositories.map(repo => repo.toLowerCase()));
  const metadata = new Map(stored.document.projects.map(project => [project.repo.toLowerCase(), project]));
  const items = repositories.filter(repo => selected.has(repo.name.toLowerCase())).map(repo => ({
    name: repo.name,
    fullName: repo.fullName,
    url: repo.url,
    visibility: repo.visibility,
    archived: repo.archived,
    defaultBranch: repo.defaultBranch,
    updatedAt: repo.updatedAt,
    projectType: metadata.get(repo.name.toLowerCase())?.projectType || "other",
    domain: metadata.get(repo.name.toLowerCase())?.domain || null
  }));
  return success({ items, exportedAt: now() });
};
