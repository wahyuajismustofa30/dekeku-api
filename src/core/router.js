import { getHealth } from "../modules/health/index.js";
import { githubRouter } from "../modules/github/index.js";
import { adminLogin } from "../modules/auth/login.js";
import { error, success } from "../utils/response.js";
import { authMiddleware } from "../middleware/auth.js";

export const router = async (request, env) => {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;

  // 1. Health check (Public)
  if (pathname === "/api/v1/health" && method === "GET") {
    return getHealth(request);
  }

  // 2. Admin Login (Public POST)
  if (pathname === "/api/v1/admin/login") {
    if (method !== "POST") return error("Method Not Allowed", 405);
    return adminLogin(request, env);
  }

  // 3. GitHub Routes (Public GET)
  if (pathname.startsWith("/api/v1/github/")) {
    if (method !== "GET") {
      return error("Method Not Allowed", 405);
    }
    return githubRouter(request, env);
  }

  // 4. Protected Admin Routes
  if (pathname.startsWith("/api/v1/admin/")) {
    return authMiddleware(request, env, async (req, e) => {
      // Test protected endpoint (Fixture)
      if (pathname === "/api/v1/admin/test" && method === "POST") {
        return success({ message: "Authenticated", user: req.user });
      }
      return error("Not Found", 404);
    });
  }

  return error("Not Found", 404);
};
