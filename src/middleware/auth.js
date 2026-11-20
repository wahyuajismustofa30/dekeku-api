import { verifyJwt } from "../utils/jwt.js";
import { error } from "../utils/response.js";

/**
 * Authentication Middleware
 */
export const authMiddleware = async (request, env, next) => {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return error("Authentication required (Bearer token missing)", 401);
  }

  const token = authHeader.split(" ")[1];
  const jwtSecret = env.JWT_SECRET;

  if (!jwtSecret) {
    console.error("JWT_SECRET is not configured");
    return error("Internal Server Error (Auth Configuration)", 500);
  }

  const result = await verifyJwt(token, jwtSecret, {
    iss: "dekeku-api",
    aud: "dekeku-admin"
  });

  if (!result.valid) {
    return error(`Authentication failed: ${result.error}`, 401);
  }

  if (result.payload.role !== "admin") {
    return error("Forbidden: Insufficient privileges", 403);
  }

  // Attach verified user to request object
  request.user = result.payload;

  return next(request, env);
};
