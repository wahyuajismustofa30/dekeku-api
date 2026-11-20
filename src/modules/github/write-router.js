import { success, error } from "../../utils/response.js";
import { HttpError } from "../../core/errors.js";
import { GitHubClient } from "../../core/github.js";
import { parseAndValidateBody, validateWritablePath, createFile, updateFile, deleteFile } from "./write.js";

/**
 * CREATE file endpoint
 * POST /api/v1/admin/write/create
 * Body: { path: "public/data/file.json", content: { key: "value" }, message: "commit message" }
 */
export const handleCreate = async (request, env) => {
  try {
    const { path, content, message, finalSize, serialisedContent } = await parseAndValidateBody(request);

    const client = new GitHubClient(env);
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

    const client = new GitHubClient(env);
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
    const client = new GitHubClient(env);
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
