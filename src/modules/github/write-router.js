import { success, error } from "../../utils/response.js";
import { HttpError } from "../../core/errors.js";
import { resolveProjectRepository } from "./repositories.js";
import { parseAndValidateBody, validateWritablePath, createFile, updateFile, deleteFile } from "./write.js";
import { decodeBase64, MAX_FILE_SIZE } from "../../utils/github-content.js";

/**
 * GET an existing writable JSON file's parsed content and current SHA.
 * GET /api/v1/admin/write/file?path=public/data/file.json
 */
export const handleGetFile = async (request, env) => {
  const path = new URL(request.url).searchParams.get("path");
  if (!path || typeof path !== "string") {
    throw new HttpError("Path parameter is required", 400);
  }

  const pathValidation = validateWritablePath(path);
  if (!pathValidation.valid) {
    throw new HttpError(pathValidation.error, pathValidation.status);
  }

  const { client } = await resolveProjectRepository(request, env);
  const file = await client.getFile(path);
  if (file.type !== "file") {
    throw new HttpError("Path is not a file", 400);
  }
  if (!Number.isFinite(file.size) || file.size > MAX_FILE_SIZE) {
    throw new HttpError("File size exceeds limit (1 MB)", 413);
  }

  const rawContent = decodeBase64(file.content);
  if (rawContent === null) {
    throw new HttpError("Failed to decode file content", 502);
  }

  let content;
  try {
    content = JSON.parse(rawContent);
  } catch {
    throw new HttpError("Invalid JSON content from upstream", 502);
  }
  if (typeof content !== "object" || content === null) {
    throw new HttpError("JSON root must be object or array", 502);
  }
  if (typeof file.sha !== "string" || !/^[0-9a-fA-F]{40}$/.test(file.sha)) {
    throw new HttpError("Unable to retrieve a valid file SHA", 502);
  }

  return success({
    path,
    sha: file.sha,
    size: file.size,
    content,
    message: "File content retrieved successfully",
    _metadata: { github_ratelimit: client.rateLimit }
  });
};

/**
 * GET current GitHub Blob SHA for an existing writable JSON file.
 * GET /api/v1/admin/write/sha?path=public/data/file.json
 */
export const handleGetSha = async (request, env) => {/**
 * GET current GitHub Blob SHA for an existing writable JSON file.
 * GET /api/v1/admin/write/sha?path=public/data/file.json
 */
export const handleGetSha = async (request, env) => {
  const path = new URL(request.url).searchParams.get("path");
  if (!path || typeof path !== "string") {
    throw new HttpError("Path parameter is required", 400);
  }

  const pathValidation = validateWritablePath(path);
  if (!pathValidation.valid) {
    throw new HttpError(pathValidation.error, pathValidation.status);
  }

  const { client } = await resolveProjectRepository(request, env);
  const file = await client.getFile(path);
  if (file.type !== "file") {
    throw new HttpError("Path is not a file", 400);
  }

  const sha = file.sha;
  if (typeof sha !== "string" || !/^[0-9a-fA-F]{40}$/.test(sha)) {
    throw new HttpError("Unable to retrieve a valid file SHA", 502);
  }

  return success({
    path,
    sha,
    message: "File SHA retrieved successfully",
    _metadata: { github_ratelimit: client.rateLimit }
  });
};

/**
 * CREATE file endpoint
 * POST /api/v1/admin/write/create
 * Body: { path: "public/data/file.json", content: { key: "value" }, message: "commit message" }
 */
export const handleCreate = async (request, env) => {
  try {
    const { path, content, message, finalSize, serialisedContent } = await parseAndValidateBody(request);

    const { client } = await resolveProjectRepository(request, env);
    const result = await createFile(client, path, serialisedContent, message || "Create file");

    return success({
      path,
      sha: result.content.sha,
      size: finalSize,
      message: "File created successfully",
      _metadata: { github_ratelimit: client.rateLimit }
    });
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError("Create operation failed", 500);
  }
};

/**
 * UPDATE file endpoint
 * PUT /api/v1/admin/write/update
 * Body: { path: "public/data/file.json", content: { key: "value" }, sha: "sha...", message: "commit message" }
 */
export const handleUpdate = async (request, env) => {
  try {
    const data = await parseAndValidateBody(request);
    const { path, content, message, finalSize, serialisedContent } = data;

    // Validate SHA is provided for UPDATE
    const sha = data.sha;
    if (!sha || typeof sha !== "string") {
      throw new HttpError("SHA is required for update operation", 400);
    }

    const { client } = await resolveProjectRepository(request, env);
    const result = await updateFile(client, path, serialisedContent, sha, message || "Update file");

    return success({
      path,
      sha: result.content.sha,
      size: finalSize,
      message: "File updated successfully",
      _metadata: { github_ratelimit: client.rateLimit }
    });
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError("Update operation failed", 500);
  }
};

/**
 * DELETE file endpoint
 * DELETE /api/v1/admin/write/delete
 * Body: { path: "public/data/file.json", sha: "sha...", message: "commit message" }
 */
export const handleDelete = async (request, env) => {
  try {
    // 1. Content-Type check (allows parameters like ; charset=utf-8)
    const contentType = request.headers.get("Content-Type") || "";
    if (!contentType.toLowerCase().startsWith("application/json")) {
      throw new HttpError("Content-Type must be application/json", 415);
    }

    // 2. Read and parse body
    const bodyText = await request.text();
    if (!bodyText) {
      throw new HttpError("Request body is required", 400);
    }

    let data;
    try {
      data = JSON.parse(bodyText);
    } catch (e) {
      throw new HttpError("Invalid JSON", 422);
    }

    // 3. Validate structure
    const { path, sha, message } = data;
    if (!path || typeof path !== "string") {
      throw new HttpError("Path is required", 400);
    }

    if (message !== undefined && (typeof message !== "string" || message.length > 256)) {
      throw new HttpError("Commit message must be a string up to 256 characters", 400);
    }

    // 4. Validate writable path
    const pathValidation = validateWritablePath(path);
    if (!pathValidation.valid) {
      throw new HttpError(pathValidation.error, pathValidation.status);
    }

    // 5. Validate SHA
    if (!sha || typeof sha !== "string") {
      throw new HttpError("SHA is required for delete operation", 400);
    }

    const SHA_REGEX = /^[0-9a-fA-F]{40}$/;
    if (!SHA_REGEX.test(sha)) {
      throw new HttpError("Invalid SHA format", 400);
    }

    // 6. Perform DELETE
    const { client } = await resolveProjectRepository(request, env);
    const result = await deleteFile(client, path, sha, message || "Delete file");

    return success({
      path,
      sha: result.commit.sha,
      message: "File deleted successfully",
      _metadata: { github_ratelimit: client.rateLimit }
    });
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError("Delete operation failed", 500);
  }
};
