import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { signJwt } from "../src/utils/jwt.js";
import {
  adminAuthMiddleware,
  authMiddleware,
  userAuthMiddleware,
  repositoryOwnershipMiddleware
} from "../src/middleware/auth.js";

const SECRET = "rbac-test-secret-with-sufficient-length";
const now = () => Math.floor(Date.now() / 1000);
const makeToken = (aud, role) => {
  const issued = now();
  return signJwt({
    iss: "dekeku-api",
    aud,
    sub: role === "admin" ? "admin" : "user_12345678",
    role,
    iat: issued,
    exp: issued + 1800
  }, SECRET);
};
const requestWith = token => new Request("https://api.example.test/api/v1/protected", {
  headers: { Authorization: `Bearer ${token}` }
});
const env = { JWT_SECRET: SECRET };

describe("RBAC-02 role and audience isolation", () => {
  test("legacy authMiddleware remains the Admin middleware", () => {
    assert.equal(authMiddleware, adminAuthMiddleware);
  });

  test("Admin middleware rejects a correctly signed User token", async () => {
    const token = await makeToken("dekeku-user", "user");
    const response = await adminAuthMiddleware(requestWith(token), env, async () => new Response("next"));
    assert.equal(response.status, 401);
  });

  test("User middleware rejects a correctly signed Admin token", async () => {
    const token = await makeToken("dekeku-admin", "admin");
    const response = await userAuthMiddleware(requestWith(token), env, async () => new Response("next"));
    assert.equal(response.status, 401);
  });

  test("repository ownership middleware rejects missing or non-User identity", async () => {
    const response = await repositoryOwnershipMiddleware(
      new Request("https://api.example.test/"),
      env,
      async () => new Response("next"),
      "repo_12345678"
    );
    assert.equal(response.status, 401);
  });

  test("repository ownership middleware validates opaque mapping IDs", async () => {
    const request = new Request("https://api.example.test/");
    request.user = { sub: "user_12345678", role: "user" };
    const response = await repositoryOwnershipMiddleware(
      request,
      env,
      async () => new Response("next"),
      "../private"
    );
    assert.equal(response.status, 400);
  });
});
