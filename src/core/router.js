import { getHealth } from "../modules/health/index.js";
import { githubRouter } from "../modules/github/index.js";
import { error } from "../utils/response.js";

export const router = async (request, env) => {
  const { pathname } = new URL(request.url);
  const method = request.method;

  if (method !== "GET") {
    return error("Method Not Allowed", 405);
  }

  if (pathname === "/api/v1/health") {
    return getHealth(request);
  }

  if (pathname.startsWith("/api/v1/github/")) {
    return githubRouter(request, env);
  }

  return error("Not Found", 404);
};
