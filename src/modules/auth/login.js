import { verifyPassword } from "../../utils/hash.js";
import { signJwt } from "../../utils/jwt.js";
import { error, success } from "../../utils/response.js";

/**
 * Admin Login Handler
 */
export const adminLogin = async (request, env) => {
  if (request.method !== "POST") {
    return error("Method Not Allowed", 405);
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return error("Malformed or empty JSON body", 422);
  }

  try {
    const { username, password } = body || {};

    if (!username || !password) {
      return error("Authentication failed", 401);
    }

    const storedHash = env.ADMIN_PASSWORD_HASH;
    const jwtSecret = env.JWT_SECRET;
    const adminUsername = "admin";

    if (!storedHash || !jwtSecret) {
      console.error("Critical configuration missing");
      return error("Internal server error", 500);
    }

    const isValidPassword = await verifyPassword(password, storedHash);
    const isValidUser = username === adminUsername;

    if (!isValidUser || !isValidPassword) {
      return error("Authentication failed", 401);
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: "dekeku-api",
      aud: "dekeku-admin",
      sub: adminUsername,
      role: "admin",
      iat: now,
      exp: now + 1800 
    };

    const token = await signJwt(payload, jwtSecret);

    return success({
      access_token: token,
      token_type: "Bearer",
      expires_in: 1800
    });

  } catch (err) {
    return error("Authentication failed", 401);
  }
};
