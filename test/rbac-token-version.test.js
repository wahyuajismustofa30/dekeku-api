import { afterEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { handleAdminUsers } from "../src/modules/rbac/admin.js";
import { userLogin } from "../src/modules/auth/user-login.js";
import { adminAuthMiddleware, userAuthMiddleware } from "../src/middleware/auth.js";
import { signJwt, verifyJwt } from "../src/utils/jwt.js";
import { hashPassword, verifyPassword } from "../src/utils/hash.js";
import { validateUsersDocument } from "../src/modules/rbac/storage.js";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

const SECRET = "rbac-token-version-test-secret";
const env = {
  JWT_SECRET: SECRET,
  GITHUB_TOKEN: "mock-token",
  GITHUB_OWNER: "central-owner",
  GITHUB_REPO: "dekeku-db",
  GITHUB_BRANCH: "main"
};
const now = () => Math.floor(Date.now() / 1000);
const userRecord = async (overrides = {}) => ({
  id: "usr_1234567890",
  username: "alice",
  passwordHash: await hashPassword("old-password-123"),
  role: "user",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides
});
const fileResponse = (document, sha) => new Response(JSON.stringify({
  type: "file",
  sha,
  size: new TextEncoder().encode(JSON.stringify(document)).byteLength,
  content: btoa(JSON.stringify(document))
}), { status: 200, headers: { "Content-Type": "application/json" } });
const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json" }
});
const tokenFor = async (claims = {}) => {
  const issued = now();
  return signJwt({
    iss: "dekeku-api",
    aud: "dekeku-user",
    sub: "usr_1234567890",
    role: "user",
    iat: issued,
    exp: issued + 1800,
    ...claims
  }, SECRET);
};
const setupGitHub = (users, { conflictOnWrite = false } = {}) => {
  let document = { version: 1, users: [users] };
  let usersSha = "a".repeat(40);
  const repositories = { version: 1, repositories: [] };
  const repositoriesSha = "c".repeat(40);
  globalThis.fetch = async (url, options = {}) => {
    const value = String(url);
    const method = options.method || "GET";
    if (value.includes("/contents/private/auth/users.json")) {
      if (method === "PUT") {
        if (conflictOnWrite) return jsonResponse({ message: "Conflict" }, 409);
        const body = JSON.parse(options.body);
        document = JSON.parse(Buffer.from(body.content, "base64").toString("utf8"));
        usersSha = "b".repeat(40);
        return jsonResponse({ content: { sha: usersSha } });
      }
      return fileResponse(document, usersSha);
    }
    if (value.includes("/contents/private/repositories/mappings.json")) {
      return fileResponse(repositories, repositoriesSha);
    }
    throw new Error("Unexpected GitHub request: " + value);
  };
  return {
    getUsers: () => document,
    getUsersSha: () => usersSha
  };
};
const adminReset = (id, password) => handleAdminUsers(
  new Request("https://api.example.test/api/v1/admin/users/" + id + "/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  }),
  env,
  "/api/v1/admin/users/" + id + "/reset-password"
);
const login = password => userLogin(new Request("https://api.example.test/api/v1/user/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "alice", password })
}), env);
const userRequest = token => new Request("https://api.example.test/api/v1/user/repositories", {
  headers: { Authorization: "Bearer " + token }
});

describe("R-013 immediate User JWT revocation", () => {
  test("legacy user records without tokenVersion remain valid and default to version zero", async () => {
    const account = await userRecord();
    assert.equal(validateUsersDocument({ version: 1, users: [account] }).users[0].tokenVersion, undefined);
    assert.equal(validateUsersDocument({
      version: 1,
      users: [{ ...account, tokenVersion: 0 }]
    }).users[0].tokenVersion, 0);
  });

  test("rejects invalid tokenVersion values in private User records", async () => {
    const account = await userRecord();
    for (const tokenVersion of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1, "1"]) {
      assert.throws(() => validateUsersDocument({
        version: 1,
        users: [{ ...account, tokenVersion }]
      }), /Invalid user token version/);
    }
  });

  test("password reset increments version, revokes old JWT, and allows new login", async () => {
    const account = await userRecord();
    const github = setupGitHub(account);
    const oldToken = await tokenFor(); // no claim: legacy tokens map to version zero

    const resetResponse = await adminReset(account.id, "new-password-456");
    assert.equal(resetResponse.status, 200);
    const stored = github.getUsers().users[0];
    assert.equal(stored.tokenVersion, 1);
    assert.equal(await verifyPassword("new-password-456", stored.passwordHash), true);

    const oldResponse = await userAuthMiddleware(
      userRequest(oldToken), env, async () => new Response("unexpected success")
    );
    assert.equal(oldResponse.status, 401);

    const loginResponse = await login("new-password-456");
    assert.equal(loginResponse.status, 200);
    const loginBody = await loginResponse.json();
    const verified = await verifyJwt(loginBody.access_token, SECRET, {
      iss: "dekeku-api", aud: "dekeku-user", role: "user"
    });
    assert.equal(verified.valid, true);
    assert.equal(verified.payload.tokenVersion, 1);

    const newResponse = await userAuthMiddleware(
      userRequest(loginBody.access_token), env, async () => new Response("accepted")
    );
    assert.equal(newResponse.status, 200);
    assert.equal(await newResponse.text(), "accepted");
  });

  test("Admin JWT remains valid and independent from User tokenVersion", async () => {
    const issued = now();
    const adminToken = await signJwt({
      iss: "dekeku-api", aud: "dekeku-admin", sub: "admin", role: "admin",
      iat: issued, exp: issued + 1800
    }, SECRET);
    const response = await adminAuthMiddleware(
      new Request("https://api.example.test/api/v1/admin/test", {
        headers: { Authorization: "Bearer " + adminToken }
      }),
      env,
      async () => new Response("admin accepted")
    );
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "admin accepted");
  });

  test("SHA conflict during reset does not overwrite the account or increment its version", async () => {
    const account = await userRecord();
    const github = setupGitHub(account, { conflictOnWrite: true });
    const response = await adminReset(account.id, "new-password-456");
    assert.equal(response.status, 409);
    assert.equal(github.getUsers().users[0].tokenVersion, undefined);
    assert.equal(github.getUsers().users[0].passwordHash, account.passwordHash);
    assert.equal(github.getUsersSha(), "a".repeat(40));
  });
});
