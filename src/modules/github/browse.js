import { success } from "../../utils/response.js";
import { HttpError } from "../../core/errors.js";
import { SENSITIVE_FILENAMES } from "../../utils/github-content.js";
import { resolveProjectRepository } from "./repositories.js";

const SENSITIVE_PATTERNS = [
  /\.env(?:\..+)?$/i,
  /\.dev\.vars$/i,
  /\.pem$/i,
  /\.key$/i,
  /secret/i,
  /credential/i
];

export const validateBrowsePath = (rawPath) => {
  if (rawPath === undefined || rawPath === null || rawPath === "") {
    return { valid: true, path: "public", segments: ["public"] };
  }

  if (typeof rawPath !== "string") {
    return { valid: false, status: 400, error: "Invalid path parameter" };
  }

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(decodeURIComponent(rawPath));
  } catch {
    try {
      decodedPath = decodeURIComponent(rawPath);
    } catch {
      return { valid: false, status: 400, error: "Malformed path encoding" };
    }
  }

  if (decodedPath.includes("\\") || /[\x00-\x1F\x7F]/.test(decodedPath)) {
    return { valid: false, status: 400, error: "Invalid file path" };
  }

  if (decodedPath.startsWith("/") || decodedPath.includes("//")) {
    return { valid: false, status: 400, error: "Invalid file path" };
  }

  const rawSegments = decodedPath.split("/");
  if (rawSegments.length > 1 && rawSegments[rawSegments.length - 1] === "") {
    rawSegments.pop();
  }

  if (rawSegments.some((s) => s === "" || s === "." || s === "..")) {
    return { valid: false, status: 400, error: "Invalid file path" };
  }

  if (rawSegments.length < 1 || rawSegments[0] !== "public") {
    return { valid: false, status: 403, error: "Access restricted to public/ directory" };
  }

  if (rawSegments.some((s) => s.startsWith("."))) {
    return { valid: false, status: 403, error: "Access to hidden files or directories is restricted" };
  }

  for (const seg of rawSegments) {
    const lower = seg.toLowerCase();
    if (SENSITIVE_FILENAMES.has(lower)) {
      return { valid: false, status: 403, error: "Access to sensitive files is restricted" };
    }
    if (SENSITIVE_PATTERNS.some((pattern) => pattern.test(lower))) {
      return { valid: false, status: 403, error: "Access to sensitive files is restricted" };
    }
  }

  const normalizedPath = rawSegments.join("/");
  return { valid: true, path: normalizedPath, segments: rawSegments };
};

export const handleBrowse = async (request, env) => {
  const url = new URL(request.url);
  const rawPath = url.searchParams.get("path");

  const pathValidation = validateBrowsePath(rawPath);
  if (!pathValidation.valid) {
    throw new HttpError(pathValidation.error, pathValidation.status);
  }

  const rawPage = url.searchParams.get("page");
  const rawPerPage = url.searchParams.get("per_page");

  let page = 1;
  if (rawPage !== null && rawPage !== "") {
    page = Number(rawPage);
    if (!Number.isInteger(page) || page < 1) {
      throw new HttpError("Invalid page parameter", 400);
    }
  }

  let per_page = 50;
  if (rawPerPage !== null && rawPerPage !== "") {
    per_page = Number(rawPerPage);
    if (!Number.isInteger(per_page) || per_page < 1) {
      throw new HttpError("Invalid per_page parameter", 400);
    }
    if (per_page > 100) {
      per_page = 100;
    }
  }

  const { client } = await resolveProjectRepository(request, env);

  let rawItems;
  try {
    rawItems = await client.getDirectoryContents(pathValidation.path);
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) {
      throw new HttpError("Directory not found", 404);
    }
    throw err;
  }

  if (!Array.isArray(rawItems)) {
    throw new HttpError("Path is not a directory", 400);
  }

  const UPSTREAM_MAX_ITEMS = 1000;
  const isUpstreamTruncated = rawItems.length > UPSTREAM_MAX_ITEMS;

  const filteredItems = [];
  for (const item of rawItems) {
    if (!item || typeof item !== "object") continue;

    if (item.type !== "file" && item.type !== "dir") {
      continue;
    }

    const name = typeof item.name === "string" ? item.name : "";
    if (!name) continue;

    if (name.startsWith(".")) continue;

    if (name.includes("\\") || /[\x00-\x1F\x7F]/.test(name)) continue;

    const lowerName = name.toLowerCase();
    if (SENSITIVE_FILENAMES.has(lowerName)) continue;
    if (SENSITIVE_PATTERNS.some((p) => p.test(lowerName))) continue;

    const itemPath = typeof item.path === "string" ? item.path : "";
    if (!itemPath || !itemPath.startsWith("public")) continue;

    filteredItems.push({
      name: item.name,
      path: item.path,
      type: item.type,
      size: typeof item.size === "number" ? item.size : 0,
      sha: typeof item.sha === "string" ? item.sha : ""
    });
  }

  const truncated = isUpstreamTruncated || filteredItems.length > UPSTREAM_MAX_ITEMS;
  const safeItems = filteredItems.slice(0, UPSTREAM_MAX_ITEMS);

  const totalItems = safeItems.length;
  const totalPages = Math.ceil(totalItems / per_page) || 1;
  const startIndex = (page - 1) * per_page;
  const paginatedItems = safeItems.slice(startIndex, startIndex + per_page);

  return success({
    path: pathValidation.path,
    page,
    per_page,
    total_items: totalItems,
    total_pages: totalPages,
    truncated,
    items: paginatedItems,
    _metadata: { github_ratelimit: client.rateLimit }
  });
};
