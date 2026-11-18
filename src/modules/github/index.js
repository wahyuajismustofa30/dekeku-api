import { getRepositoryMetadata, getBranchMetadata } from "./repositories.js";
import { getFileContent } from "./files.js";
import { error } from "../../utils/response.js";

export const githubRouter = async (request, env) => {
  const { pathname } = new URL(request.url);

  if (pathname === "/api/v1/github/repository") return getRepositoryMetadata(request, env);
  if (pathname === "/api/v1/github/branch") return getBranchMetadata(request, env);
  if (pathname === "/api/v1/github/file") return getFileContent(request, env);

  return error("Not Found", 404);
};
