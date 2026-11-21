import { verifyJwt } from "../utils/jwt.js";
import { error } from "../utils/response.js";
import { GitHubClient } from "../core/github.js";
import { readPrivateDocument } from "../modules/rbac/storage.js";

const authenticate = async (request, env, next, audience, role) => {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !/^Bearer\s+\S+$/i.test(authHeader)) {
    return error("Authentication required (Bearer token missing)", 401);
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured");
    return error("Internal Server Error (Auth Configuration)", 500);
  }

  const result = await verifyJwt(token, env.JWT_SECRET, {
    iss: "dekeku-api",
    aud: audience,
    role
  });
  if (!result.valid) return error("Authentication failed", 401);

  request.user = result.payload;
  return next(request, env);
};

/**
 * Admin-only authentication. Keep the legacy export for existing routes.
 */
export const adminAuthMiddleware = (request, env, next) =>
  authenticate(request, env, next, "dekeku-admin", "admin");

export const authMiddleware = adminAuthMiddleware;

/**
 * User authentication also checks the current private account status.
 * JWT subject is the immutable user record ID, never a username supplied by a client.
 */
export const userAuthMiddleware = async (request, env, next) => {
  const authenticated = await authenticate(request, env, async (req, e) => {
    const github = new GitHubClient(e);
    const { document } = await readPrivateDocument(github, "users");
    const account = document.users.find(user => user.id === req.user.sub);
    if (!account || account.status !== "active" || account.role !== "user") {
      return error("User account is unavailable", 403);
    }
    req.user.accountId = account.id;
    req.user.username = account.username;
    return next(req, e);
  }, "dekeku-user", "user");

  return authenticated;
};

/**
 * Restrict a User request to an active repository mapping owned by that user.
 * repositoryId must come from the route/query/body only as an opaque mapping ID;
 * owner, repository, branch, and path are always sourced from private storage.
 */
export const repositoryOwnershipMiddleware = async (request, env, next, repositoryId) => {
  if (!request.user || request.user.role !== "user" || !request.user.sub) {
    return error("User authentication required", 401);
  }
  if (typeof repositoryId !== "string" || !/^[A-Za-z0-9_-]{8,64}$/.test(repositoryId)) {
    return error("Invalid repository ID", 400);
  }

  const github = new GitHubClient(env);
  const { document: users } = await readPrivateDocument(github, "users");
  const account = users.users.find(user => user.id === request.user.sub);
  if (!account || account.status !== "active") return error("User account is unavailable", 403);

  const { document: mappings } = await readPrivateDocument(github, "repositories", users);
  const mapping = mappings.repositories.find(item =>
    item.id === repositoryId && item.userId === account.id && item.status === "active"
  );
  if (!mapping) return error("Repository access denied", 403);

  request.repository = Object.freeze({
    id: mapping.id,
    owner: mapping.owner,
    repo: mapping.repo,
    branch: mapping.branch,
    origin: mapping.origin
  });
  return next(request, env);
};
