import { HttpError } from "../../core/errors.js";
import { decodeBase64, MAX_FILE_SIZE } from "../../utils/github-content.js";
import { uint8ArrayToBase64 } from "../../utils/base64.js";
import { decryptDashboardDocument, encryptDashboardDocument } from "../../utils/dashboard-crypto.js";

export const DASHBOARD_STORAGE_PATH = "private/dashboard/projects.json";
const SHA_PATTERN = /^[a-f0-9]{40}$/i;
const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
const hasOnlyKeys = (value, allowed) => Object.keys(value).every(key => allowed.includes(key));

export const emptyDashboardDocument = () => ({ version: 1, projects: [] });

export const validateDashboardDocument = document => {
  if (!isObject(document) || document.version !== 1 || !Array.isArray(document.projects)) {
    throw new HttpError("Invalid dashboard metadata document", 422);
  }
  const ids = new Set();
  const repositories = new Set();
  for (const project of document.projects) {
    if (!isObject(project) || !hasOnlyKeys(project, [
      "id", "owner", "repo", "projectType", "domain", "notes", "createdAt", "updatedAt", "lastCheck"
    ])) throw new HttpError("Invalid dashboard project metadata", 422);
    if (typeof project.id !== "string" || !/^[A-Za-z0-9_-]{8,64}$/.test(project.id) || ids.has(project.id)) {
      throw new HttpError("Invalid or duplicate dashboard project ID", 422);
    }
    if (typeof project.owner !== "string" || !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37})$/.test(project.owner) ||
        typeof project.repo !== "string" || !/^[A-Za-z0-9_.-]{1,100}$/.test(project.repo)) {
      throw new HttpError("Invalid dashboard repository identity", 422);
    }
    const repositoryKey = `${project.owner.toLowerCase()}/${project.repo.toLowerCase()}`;
    if (repositories.has(repositoryKey)) throw new HttpError("Duplicate dashboard repository", 409);
    if (!["website", "invitation", "repository", "other"].includes(project.projectType)) {
      throw new HttpError("Invalid project type", 422);
    }
    if (project.domain !== null && project.domain !== undefined &&
        (typeof project.domain !== "string" || project.domain.length > 253 ||
         !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(project.domain))) {
      throw new HttpError("Invalid project domain", 422);
    }
    if (project.notes !== undefined && (typeof project.notes !== "string" || project.notes.length > 2000)) {
      throw new HttpError("Invalid project notes", 422);
    }
    for (const field of ["createdAt", "updatedAt"]) {
      if (typeof project[field] !== "string" || !Number.isFinite(Date.parse(project[field]))) {
        throw new HttpError("Invalid dashboard project timestamp", 422);
      }
    }
    if (project.lastCheck !== null && project.lastCheck !== undefined && !isObject(project.lastCheck)) {
      throw new HttpError("Invalid dashboard project check result", 422);
    }
    ids.add(project.id);
    repositories.add(repositoryKey);
  }
  return document;
};

const encodePath = path => path.split("/").map(encodeURIComponent).join("/");

export const readDashboardDocument = async (github, env) => {
  if (!env.DB_ENCRYPTION_KEY) throw new HttpError("Encrypted dashboard storage is unavailable", 503);
  let file;
  try {
    file = await github.request(`/contents/${encodePath(DASHBOARD_STORAGE_PATH)}?ref=${encodeURIComponent(github.branch)}`, {
      method: "GET"
    });
  } catch (err) {
    if (!(err instanceof HttpError) || err.status !== 404) throw err;
    await github.getRepository();
    return { document: emptyDashboardDocument(), sha: null, exists: false };
  }
  if (!file || file.type !== "file" || typeof file.sha !== "string" || !SHA_PATTERN.test(file.sha) ||
      !Number.isInteger(file.size) || file.size < 0 || file.size > MAX_FILE_SIZE) {
    throw new HttpError("Encrypted dashboard storage metadata is invalid", 502);
  }
  const raw = typeof file.content === "string" ? decodeBase64(file.content) : null;
  if (raw === null) throw new HttpError("Encrypted dashboard storage is unreadable", 502);
  let envelope;
  try { envelope = JSON.parse(raw); }
  catch { throw new HttpError("Encrypted dashboard storage is invalid", 502); }
  const document = await decryptDashboardDocument(envelope, env.DB_ENCRYPTION_KEY, DASHBOARD_STORAGE_PATH);
  validateDashboardDocument(document);
  return { document, sha: file.sha, exists: true };
};

export const writeDashboardDocument = async (github, env, document, expectedSha) => {
  if (!env.DB_ENCRYPTION_KEY) throw new HttpError("Encrypted dashboard storage is unavailable", 503);
  validateDashboardDocument(document);
  if (expectedSha !== null && (typeof expectedSha !== "string" || !SHA_PATTERN.test(expectedSha))) {
    throw new HttpError("A valid current storage SHA is required", 400);
  }
  const envelope = await encryptDashboardDocument(document, env.DB_ENCRYPTION_KEY, DASHBOARD_STORAGE_PATH);
  const serialized = JSON.stringify(envelope);
  const bytes = new TextEncoder().encode(serialized);
  if (bytes.byteLength > MAX_FILE_SIZE) throw new HttpError("Encrypted dashboard metadata exceeds the storage limit", 413);
  const body = {
    message: "dekeku-api: update encrypted dashboard metadata",
    content: uint8ArrayToBase64(serialized),
    branch: github.branch
  };
  if (expectedSha !== null) body.sha = expectedSha;
  const result = await github.request(`/contents/${encodePath(DASHBOARD_STORAGE_PATH)}`, {
    method: "PUT",
    body: JSON.stringify(body)
  });
  const sha = result?.content?.sha;
  if (typeof sha !== "string" || !SHA_PATTERN.test(sha)) {
    throw new HttpError("GitHub did not return a valid dashboard storage SHA", 502);
  }
  return { sha, size: bytes.byteLength };
};
