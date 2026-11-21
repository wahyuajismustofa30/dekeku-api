import { afterEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";
import { signJwt } from "../src/utils/jwt.js";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

const SECRET = "rbac-security-review-test-secret";
const env = {
  JWT_SECRET: SECRET,
  GITHUB_TOKEN: "mock-token",
  GITHUB_OWNER: "central-owner",
  GITHUB_REPO: "dekeku-db",
  GITHUB_BRANCH: "main"
};
const now = () => Math.floor(Date.now() / 1000);
const user = (id, username = "alice", status = "active") => ({
  id, username,
  passwordHash: "pbkdf2:100000:" + "a".repeat(32) + ":" + "b".repeat(64),
  role: "user", status,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
});
const mapping = (id, userId, overrides = {}) => ({
  id, userId, owner: "owned-owner", repo: "owned-repo", branch: "release",
  origin: "https://site.example.test", status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides
});
const tokenFor = async (sub = "usr_1234567890", aud = "dekeku-user", role = "user", issued = now()) =>
  signJwt({ iss: "dekeku-api", aud, sub, role, iat: issued, exp: issued + 1800 }, SECRET);
const file = document => ({
  type: "file", sha: "a".repeat(40),
  size: new TextEncoder().encode(JSON.stringify(document)).byteLength,
  content: btoa(JSON.stringify(document))
});
const githubJson = (status, body) => new Response(JSON.stringify(body), {
  status, headers: { "Content-Type": "application/json" }
});
const centralFetch = (users, repositories) => async url => {
  const value = String(url);
  if (value.includes("/contents/private/auth/users.json")) {
    return githubJson(200, file({ version: 1, users }));
  }
  if (value.includes("/contents/private/repositories/mappings.json")) {
    return githubJson(200, file({ version: 1, repositories }));
  }
  return null;
};
const getDataRequest = async (token, repositoryId) => new Request(
  "https://api.example.test/api/v1/user/data?repositoryId=" +
    encodeURIComponent(repositoryId) + "&path=profile.json",
  { headers: { Authorization: "Bearer " + token } }
);

describe("RBAC-09 ownership and repository isolation", () => {
  test("rejects a mapping owned by another User before contacting its repository", async () => {
    const alice = user("usr_1234567890");
    const bob = user("usr_0987654321", "bob");
    const calls = [];
    const central = centralFetch([alice, bob], [
      mapping("rep_bobs_repo_123", bob.id)
    ]);
    globalThis.fetch = async (url, options) => {
      calls.push(String(url));
      const response = await central(url);
      if (response) return response;
      throw new Error("Target repository must not be contacted");
    };

    const token = await tokenFor(alice.id);
    const response = await worker.fetch(await getDataRequest(token, "rep_bobs_repo_123"), env);
    assert.equal(response.status, 403);
    assert.equal(calls.some(url => url.includes("/repos/owned-owner/owned-repo/")), false);
  });

  test("uses only server-mapped owner, repository, and branch for an owned mapping", async () => {
    const alice = user("usr_1234567890");
    const assigned = mapping("rep_alice_repo_123", alice.id);
    const calls = [];
    const central = centralFetch([alice], [assigned]);
    globalThis.fetch = async (url, options) => {
      const value = String(url);
      calls.push({ url: value, method: options.method });
      const response = await central(url);
      if (response) return response;
      if (value.includes("/repos/owned-owner/owned-repo/contents/assets/data/profile.json?ref=release")) {
        return githubJson(200, {
          type: "file", sha: "c".repeat(40),
          size: 13, content: btoa(JSON.stringify({ safe: true }))
        });
      }
      throw new Error("Unexpected upstream request: " + value);
    };

    const token = await tokenFor(alice.id);
    const response = await worker.fetch(await getDataRequest(token, assigned.id), env);
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(data.content, { safe: true });
    assert.equal(calls.some(call => call.url.includes("/repos/central-owner/dekeku-db/")), true);
    assert.equal(calls.some(call => call.url.includes("/repos/owned-owner/owned-repo/contents/assets/data/profile.json?ref=release")), true);
    assert.equal(calls.some(call => call.url.includes("/repos/") && call.url.includes("attacker")), false);
  });

  test("rejects client-supplied repository coordinates and arbitrary path fields", async () => {
    const alice = user("usr_1234567890");
    const calls = [];
    const central = centralFetch([alice], []);
    globalThis.fetch = async url => {
      calls.push(String(url));
      const response = await central(url);
      if (response) return response;
      throw new Error("No target repository access expected");
    };
    const token = await tokenFor(alice.id);
    const response = await worker.fetch(new Request(
      "https://api.example.test/api/v1/user/data",
      {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({
          repositoryId: "rep_alice_repo_123",
          path: "profile.json",
          content: { safe: true },
          owner: "attacker",
          repo: "attacker-repo",
          branch: "main"
        })
      }
    ), env);
    assert.equal(response.status, 422);
    assert.equal(calls.some(url => url.includes("/repos/attacker/")), false);
  });

  test("disabled account is rejected before repository data access", async () => {
    const disabled = user("usr_1234567890", "alice", "disabled");
    let mappingReads = 0;
    globalThis.fetch = async url => {
      const value = String(url);
      if (value.includes("/contents/private/auth/users.json")) {
        return githubJson(200, file({ version: 1, users: [disabled] }));
      }
      if (value.includes("/contents/private/repositories/mappings.json")) mappingReads += 1;
      throw new Error("Repository mapping must not be read for a disabled account");
    };
    const token = await tokenFor(disabled.id);
    const response = await worker.fetch(await getDataRequest(token, "rep_alice_repo_123"), env);
    assert.equal(response.status, 403);
    assert.equal(mappingReads, 0);
  });

  test("expired User JWT is rejected before private storage access", async () => {
    let upstreamCalls = 0;
    globalThis.fetch = async () => {
      upstreamCalls += 1;
      throw new Error("Expired token must not access storage");
    };
    const expired = await tokenFor("usr_1234567890", "dekeku-user", "user", now() - 1900);
    const response = await worker.fetch(
      new Request("https://api.example.test/api/v1/user/repositories", {
        headers: { Authorization: "Bearer " + expired }
      }),
      env
    );
    assert.equal(response.status, 401);
    assert.equal(upstreamCalls, 0);
  });
});
