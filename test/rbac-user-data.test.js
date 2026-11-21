import { describe, test } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";
import { validateUserDataPath } from "../src/modules/rbac/user-data.js";
import { signJwt } from "../src/utils/jwt.js";

const SECRET = "rbac-user-data-route-test-secret";
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
const request = (path, method = "GET", token, body) => new Request("https://api.example.test" + path, {
  method,
  headers: {
    ...(token ? { Authorization: "Bearer " + token } : {}),
    ...(body !== undefined ? { "Content-Type": "application/json" } : {})
  },
  body: body === undefined ? undefined : JSON.stringify(body)
});

describe("RBAC-05 User data path boundary", () => {
  test("accepts relative JSON paths and adds the fixed assets/data prefix", () => {
    assert.deepEqual(validateUserDataPath("profile.json"), {
      valid: true,
      path: "assets/data/profile.json"
    });
    assert.deepEqual(validateUserDataPath("settings/site.json"), {
      valid: true,
      path: "assets/data/settings/site.json"
    });
  });

  test("rejects traversal, encoding, absolute paths, and backslashes", () => {
    for (const path of [
      "../private/users.json",
      "folder/../../private/users.json",
      "%2e%2e/private/users.json",
      "%252e%252e/private/users.json",
      "/assets/data/file.json",
      "folder\\file.json",
      "folder//file.json",
      "folder/./file.json",
      ".hidden.json",
      "folder/.hidden/file.json"
    ]) {
      assert.equal(validateUserDataPath(path).valid, false, path);
    }
  });

  test("rejects non-JSON files and empty paths", () => {
    assert.equal(validateUserDataPath("image.png").valid, false);
    assert.equal(validateUserDataPath("").valid, false);
    assert.equal(validateUserDataPath(null).valid, false);
  });
});

describe("RBAC-05 User route authorization", () => {
  test("data endpoint rejects missing authentication", async () => {
    const response = await worker.fetch(request("/api/v1/user/data"), { JWT_SECRET: SECRET });
    assert.equal(response.status, 401);
  });

  test("data endpoint rejects Admin audience token", async () => {
    const token = await tokenFor("dekeku-admin", "admin");
    const response = await worker.fetch(request("/api/v1/user/data", "GET", token), { JWT_SECRET: SECRET });
    assert.equal(response.status, 401);
  });

  test("repository listing rejects missing authentication", async () => {
    const response = await worker.fetch(request("/api/v1/user/repositories"), { JWT_SECRET: SECRET });
    assert.equal(response.status, 401);
  });

  test("data endpoint rejects unsupported methods", async () => {
    const response = await worker.fetch(request("/api/v1/user/data", "PATCH"), { JWT_SECRET: SECRET });
    assert.equal(response.status, 405);
  });
});
