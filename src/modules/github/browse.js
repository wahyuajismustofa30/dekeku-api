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

  // Resolve the directory through Git Trees so every child has authoritative
  // Git mode/type metadata. Contents API entries alone cannot reliably prove
  // that a blob is not a symlink.
  let treeResponse;
  try {
    const branch = await client.getBranch(client.branch);
    let treeSha = branch?.commit?.commit?.tree?.sha;
    if (typeof treeSha !== "string" || !/^[0-9a-f]{40}$/i.test(treeSha)) {
      throw new HttpError("Unable to verify repository tree", 502);
    }

    for (const segment of pathValidation.segments) {
      const parentTree = await client.getTree(treeSha);
      if (!parentTree || !Array.isArray(parentTree.tree) || parentTree.truncated === true) {
        throw new HttpError("Unable to verify directory tree", 502);
      }

      const directory = parentTree.tree.find((entry) =>
        entry && entry.path === segment && entry.type === "tree" && entry.mode === "040000"
      );
      if (!directory || typeof directory.sha !== "string" || !/^[0-9a-f]{40}$/i.test(directory.sha)) {
        throw new HttpError("Directory not found", 404);
      }
      treeSha = directory.sha;
    }

    treeResponse = await client.getTree(treeSha);
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) {
      throw new HttpError("Directory not found", 404);
    }
    throw err;
  }

  if (!treeResponse || !Array.isArray(treeResponse.tree)) {
    throw new HttpError("Unable to verify directory tree", 502);
  }

  const rawItems = treeResponse.tree.map((entry) => {
    if (!entry || typeof entry !== "object" || typeof entry.path !== "string") return entry;
    const name = entry.path;
    return {
      ...entry,
      name,
      path: `${pathValidation.path}/${name}`
    };
  });
  const isUpstreamTruncated = Boolean(treeResponse.truncated) || rawItems.length >= 1000;

  const UPSTREAM_MAX_ITEMS = 1000;
  const filteredItems = [];

  for (const item of rawItems) {
    if (!item || typeof item !== "object") continue;

    const mode = typeof item.mode === "string" ? item.mode : "";
    // Git Trees metadata is mandatory: fail closed for entries without a known mode.
    if (!mode) continue;
    if (mode === "120000" || mode === "160000") {
      continue;
    }

    const type = typeof item.type === "string" ? item.type : "";
    if (type === "symlink" || type === "submodule" || type === "commit") {
      continue;
    }

    if (item.target !== undefined && item.target !== null) {
      continue;
    }
    if (item.submodule_git_url !== undefined && item.submodule_git_url !== null) {
      continue;
    }
    if (typeof item.git_url === "string" && item.git_url.includes("/commits/")) {
      continue;
    }

    let normalizedType = null;
    if (type === "file" || type === "blob" || mode === "100644" || mode === "100755") {
      normalizedType = "file";
    } else if (type === "dir" || type === "tree" || mode === "040000") {
      normalizedType = "dir";
    }

    if (!normalizedType) {
      continue;
    }

    if (mode !== "") {
      if (normalizedType === "file" && mode !== "100644" && mode !== "100755") {
        continue;
      }
      if (normalizedType === "dir" && mode !== "040000") {
        continue;
      }
    }

    const itemPath = typeof item.path === "string" ? item.path : "";
    let name = typeof item.name === "string" ? item.name : "";
    if (!name && itemPath) {
      name = itemPath.split("/").pop() || "";
    }

    if (!name) continue;

    if (name.startsWith(".")) continue;

    if (name.includes("\\") || /[\x00-\x1F\x7F]/.test(name)) continue;

    const lowerName = name.toLowerCase();
    if (SENSITIVE_FILENAMES.has(lowerName)) continue;
    if (SENSITIVE_PATTERNS.some((p) => p.test(lowerName))) continue;

    const expectedPath = `${pathValidation.path}/${name}`;
    if (!itemPath || itemPath !== expectedPath) continue;

    filteredItems.push({
      name,
      path: expectedPath,
      type: normalizedType,
      size: typeof item.size === "number" ? item.size : 0,
      sha: typeof item.sha === "string" ? item.sha : ""
    });
  }

  const truncated = isUpstreamTruncated || rawItems.length > UPSTREAM_MAX_ITEMS || filteredItems.length > UPSTREAM_MAX_ITEMS;
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
