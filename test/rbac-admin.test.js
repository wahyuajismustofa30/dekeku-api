import { describe, test } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";
import { signJwt } from "../src/utils/jwt.js";

const SECRET = "rbac-admin-route-test-secret";
const env = { JWT_SECRET: SECRET };
const now = () => Math.floor(Date.now() / 1000);
const tokenFor = async (aud, role) => {
  const issued = now();
  return signJwt({
    iss: "dekeku-api",
    aud,
    sub: role === "admin" ? "admin" : "usr_1234567890",
    role,
    iat: issued,
    exp: issued + 1800
  }, SECRET);
};
const request = (path, method = "GET", token) => new Request("https://api.example.test" + path, {
  method,
  headers: token ? { Authorization: "Bearer " + token } : {}
});

describe("RBAC-03 Admin management route protection", () => {
  test("account collection rejects requests without Admin JWT", async () => {
    const response = await worker.fetch(request("/api/v1/admin/users"), env);
    assert.equal(response.status, 401);
  });

  test("repository mapping endpoint rejects User audience tokens", async () => {
    const token = await tokenFor("dekeku-user", "user");
    const response = await worker.fetch(request("/api/v1/admin/repositories/rep_12345678", "DELETE", token), env);
    assert.equal(response.status, 401);
  });

  test("nested reset-password endpoint rejects missing authentication", async () => {
    const response = await worker.fetch(request("/api/v1/admin/users/usr_12345678/reset-password", "POST"), env);
    assert.equal(response.status, 401);
  });
});
