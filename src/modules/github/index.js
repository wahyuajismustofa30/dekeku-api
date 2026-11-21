import { getRepositoryMetadata, getBranchMetadata } from "./repositories.js";
import { getFileContent } from "./files.js";
import { handleCreate, handleUpdate, handleDelete, handleGetSha } from "./write-router.js";
import { error } from "../../utils/response.js";

export const githubRouter = async (request, env) => {
  const { pathname } = new URL(request.url);
  const method = request.method;

  // Public GET endpoints
  if (method === "GET") {
    if (pathname === "/api/v1/admin/write/sha") return handleGetSha(request, env);
    if (pathname === "/api/v1/github/repository") return getRepositoryMetadata(request, env);
    if (pathname === "/api/v1/github/branch") return getBranchMetadata(request, env);
    if (pathname === "/api/v1/github/file") return getFileContent(request, env);
    return error("Not Found", 404);
  }

  // Protected write endpoints (require auth via router)
  if (pathname === "/api/v1/admin/write/create" && method === "POST") {
    return handleCreate(request, env);
  }
  if (pathname === "/api/v1/admin/write/update" && method === "PUT") {
    return handleUpdate(request, env);
  }
  if (pathname === "/api/v1/admin/write/delete" && method === "DELETE") {
    return handleDelete(request, env);
  }

  return error("Not Found", 404);
};
