import { success, error } from "../../utils/response.js";
import { GitHubClient } from "../../core/github.js";
import { decodeBase64, parseJson, isBinaryFile, MAX_FILE_SIZE } from "../../utils/github-content.js";

export const getFileContent = async (request, env) => {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");

  if (!path) return error("Path parameter is required", 400);
  if (isBinaryFile(path)) return error("Access to binary files is restricted", 403);

  const client = new GitHubClient(env);
  const file = await client.getFile(path);

  if (file.type !== "file") return error("Path is not a file", 400);
  if (file.size > MAX_FILE_SIZE) return error("File size exceeds limit (1 MB)", 413);

  const rawContent = decodeBase64(file.content);
  if (rawContent === null) return error("Failed to decode file content", 500);

  const isJson = path.endsWith(".json");
  const data = isJson ? parseJson(rawContent) : rawContent;

  if (isJson && data === null) {
    return error("Invalid JSON content from upstream", 502);
  }

  return success({
    path: file.path,
    sha: file.sha,
    size: file.size,
    content: data,
    _metadata: { github_ratelimit: client.rateLimit }
  });
};
