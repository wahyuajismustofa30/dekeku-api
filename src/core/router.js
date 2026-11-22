import { handleBrowse } from "../modules/github/browse.js";

import { getHealth } from "../modules/health/index.js";

import { githubRouter } from "../modules/github/index.js";

import { adminLogin } from "../modules/auth/login.js";

import { userLogin } from "../modules/auth/user-login.js";

import { error, success } from "../utils/response.js";

import { authMiddleware } from "../middleware/auth.js";

import { handlePublicSubmit } from "../modules/public/submit.js";
import { handlePublicData } from "../modules/public/index.js";

import { getTesterPage } from "../modules/tester/index.js";

import { handleAdminUsers, handleAdminRepositories } from "../modules/rbac/admin.js";

import { userDataRouter, userRepositoriesRouter } from "../modules/rbac/user-data.js";
import {
  handleDashboardRepositories,
  handleDashboardMetadata,
  handleDashboardBulkType,
  handleDashboardExport
} from "../modules/admin/dashboard.js";
import { handleDashboardRefresh } from "../modules/admin/refresh.js";
import { getAdminDashboardPage } from "../modules/admin/dashboard-page.js";



export const router = async (request, env) => {

  const url = new URL(request.url);

  const pathname = url.pathname;

  const method = request.method;



  // Admin Dashboard shell (public page; all data APIs are Admin-JWT protected).
  if (pathname === "/admin" && method === "GET") return getAdminDashboardPage();

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

  // Extensible public data resources. Resource names are resolved only by the
  // server-side registry; clients cannot supply repository coordinates or paths.
  const publicDataMatch = pathname.match(/^\/api\/v1\/public\/data\/([a-z0-9-]+)$/);
  if (publicDataMatch) {
    if (method !== "POST") return error("Method Not Allowed", 405);
    return handlePublicData(request, env, publicDataMatch[1]);
  }



    // 2. Admin Login (Public POST)

  if (pathname === "/api/v1/admin/login") {

    if (method !== "POST") return error("Method Not Allowed", 405);

    return adminLogin(request, env);

  }



  // User Login (Public POST; issues a User-audience JWT)

  if (pathname === "/api/v1/user/login") {

    if (method !== "POST") return error("Method Not Allowed", 405);

    return userLogin(request, env);

  }



  // User repository listing and data CRUD (User JWT + ownership checks)

  if (pathname === "/api/v1/user/repositories") {

    if (method !== "GET") return error("Method Not Allowed", 405);

    return userRepositoriesRouter(request, env);

  }

  if (pathname === "/api/v1/user/data") {

    if (!["GET", "POST", "PUT", "DELETE"].includes(method)) {

      return error("Method Not Allowed", 405);

    }

    return userDataRouter(request, env);

  }




  // Admin Dashboard APIs (all routes require an Admin JWT).
  if (pathname === "/api/v1/admin/dashboard/repositories") {
    if (method !== "GET") return error("Method Not Allowed", 405);
    return authMiddleware(request, env, async (req, e) => handleDashboardRepositories(req, e));
  }
  if (pathname === "/api/v1/admin/dashboard/metadata") {
    if (method !== "POST") return error("Method Not Allowed", 405);
    return authMiddleware(request, env, async (req, e) => handleDashboardMetadata(req, e));
  }
  if (pathname === "/api/v1/admin/dashboard/bulk-type") {
    if (method !== "POST") return error("Method Not Allowed", 405);
    return authMiddleware(request, env, async (req, e) => handleDashboardBulkType(req, e));
  }
  if (pathname === "/api/v1/admin/dashboard/export") {
    if (method !== "POST") return error("Method Not Allowed", 405);
    return authMiddleware(request, env, async (req, e) => handleDashboardExport(req, e));
  }
  if (pathname.startsWith("/api/v1/admin/dashboard/refresh/")) {
    const action = pathname.slice("/api/v1/admin/dashboard/refresh/".length);
    if (!["state", "start", "cancel", "retry"].includes(action)) return error("Not Found", 404);
    if ((action === "state" && method !== "GET") || (action !== "state" && method !== "POST")) {
      return error("Method Not Allowed", 405);
    }
    return authMiddleware(request, env, async (req, e) => handleDashboardRefresh(req, e, action));
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



  

  // Admin Browse Endpoint (Admin JWT required)

  if (pathname === "/api/v1/admin/browse") {

    if (method !== "GET") return error("Method Not Allowed", 405);

    return authMiddleware(request, env, async (req, e) => handleBrowse(req, e));

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
