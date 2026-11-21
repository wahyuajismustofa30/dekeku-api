import { getHealth } from "../modules/health/index.js";
import { githubRouter } from "../modules/github/index.js";
import { adminLogin } from "../modules/auth/login.js";
import { error, success } from "../utils/response.js";
import { authMiddleware } from "../middleware/auth.js";
import { handlePublicSubmit } from "../modules/public/submit.js";
import { getTesterPage } from "../modules/tester/index.js";
import { handleAdminUsers, handleAdminRepositories } from "../modules/rbac/admin.js";

export const router = async (request, env) => {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;

  // 0. Dashboard Tester (Public)
  if ((pathname === "/" || pathname === "/tester") && method === "GET") {
    return getTesterPage(request, env);
  }

  // 1. Health check (Public)
  if (pathname === "/api/v1/health" && method === "GET") {
    return getHealth(request);
  }

  // Public Submission (Guestbook - Public POST)
  if (pathname === "/api/v1/public/submit") {
    if (method !== "POST") return error("Method Not Allowed", 405);
    return handlePublicSubmit(request, env);
  }

    // 2. Admin Login (Public POST)
  if (pathname === "/api/v1/admin/login") {
    if (method !== "POST") return error("Method Not Allowed", 405);
    return adminLogin(request, env);
  }

  // Admin account and repository management (Admin JWT required)
  if (pathname === "/api/v1/admin/users" || pathname.startsWith("/api/v1/admin/users/")) {
    return authMiddleware(request, env, async (req, e) => handleAdminUsers(req, e, pathname));
  }
  if (pathname.startsWith("/api/v1/admin/repositories/")) {
    return authMiddleware(request, env, async (req, e) => handleAdminRepositories(req, e, pathname));
  }

  // 3. GitHub Routes (Public GET only)
  if (pathname.startsWith("/api/v1/github/")) {
    if (method !== "GET") {
      return error("Method Not Allowed", 405);
    }
    return githubRouter(request, env);
  }

  // 4. Protected Admin Write Routes
  if (pathname.startsWith("/api/v1/admin/write/")) {
    return authMiddleware(request, env, async (req, e) => {
      return githubRouter(req, e);
    });
  }

  // 5. Other Protected Admin Routes (for testing/future)
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
