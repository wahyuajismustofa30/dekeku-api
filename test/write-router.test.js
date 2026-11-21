import { test, describe, before, after, mock } from "node:test";
import assert from "node:assert";
import worker from "../src/index.js";

const JWT_SECRET = "test-secret-key-1234567890";
const ADMIN_PASSWORD = "secure-password";
let ADMIN_HASH;

// Mock GitHub token for env
const createEnv = (accessToken) => ({
  JWT_SECRET,
  ADMIN_PASSWORD_HASH: ADMIN_HASH,
  GITHUB_TOKEN: "mock-github-token",
  GITHUB_OWNER: "mock-owner",
  GITHUB_REPO: "mock-repo",
  GITHUB_BRANCH: "main",
  ALLOWED_ORIGINS: "https://dekeku.my.id"
});

// Mock fetch globally
const originalFetch = globalThis.fetch;

function mockResponse(status, body, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({
      "x-ratelimit-limit": "5000",
      "x-ratelimit-remaining": "4999",
      "x-ratelimit-reset": "1234567890",
      ...headers
    }),
    json: async () => body
  };
}

function setupMockFetch() {
  const mockFetch = mock.fn(async (url, options) => {
    if (String(url).endsWith("/config.json")) {
      return new Response(JSON.stringify({ repository: { username: "mock-owner", repo: "mock-repo" } }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    const method = options?.method || "GET";
    const path = url.split("repos/mock-owner/mock-repo/")[1] || "";

    // GitHub Contents API responses
    if (method === "PUT" && path.startsWith("contents/")) {
      return mockResponse(200, {
        content: { sha: "newsha1234567890123456789012345678901234567890" },
        commit: { sha: "commitsha1234567890123456789012345678901234567890" }
      });
    }
    if (method === "DELETE" && path.startsWith("contents/")) {
      return mockResponse(200, {
        commit: { sha: "commitsha1234567890123456789012345678901234567890" }
      });
    }

    // GET file - return proper file response
    if (method === "GET" && path.startsWith("contents/")) {
      return mockResponse(200, {
        type: "file",
        path: "public/config.json",
        sha: "a".repeat(40),
        size: 10,
        content: btoa('{"ok":true}'),
        encoding: "base64"
      });
    }

    // GET branch/repository
    if (method === "GET" && path === "branches/main") {
      return mockResponse(200, { name: "main", commit: { sha: "abc" }, protected: true });
    }
    if (method === "GET" && path === "") {
      return mockResponse(200, { full_name: "mock-owner/mock-repo", name: "mock-repo", html_url: "https://github.com/mock-owner/mock-repo", default_branch: "main", visibility: "public" });
    }

    // Default: token validation etc
    return mockResponse(200, {});
  });

  globalThis.fetch = mockFetch;
  return mockFetch;
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

async function getAuthToken(env) {
  const loginReq = new Request("http://api/api/v1/admin/login", {
    method: "POST",
    body: JSON.stringify({ username: "admin", password: ADMIN_PASSWORD }),
    headers: { "Content-Type": "application/json" }
  });
  const loginRes = await worker.fetch(loginReq, env);
  const { access_token } = await loginRes.json();
  return access_token;
}

describe("Write Engine - Router Integration Tests", () => {
  before(async () => {
    const { hashPassword } = await import("../src/utils/hash.js");
    ADMIN_HASH = await hashPassword(ADMIN_PASSWORD);
  });

  after(restoreFetch);

  describe("GET /api/v1/admin/write/sha", () => {
    test("SHA lookup requires authentication", async () => {
      const env = createEnv();
      const req = new Request("http://api/api/v1/admin/write/sha?path=public%2Fdata%2Ftest.json");
      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 401);
    });

    test("SHA lookup returns the current GitHub blob SHA", async () => {
      const mockFetch = setupMockFetch();
      const env = createEnv();
      const token = await getAuthToken(env);
      const req = new Request("http://api/api/v1/admin/write/sha?path=public%2Fdata%2Ftest.json", {
        headers: { Authorization: "Bearer " + token }
      });

      const res = await worker.fetch(req, env);
      const data = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.path, "public/data/test.json");
      assert.strictEqual(data.sha, "a".repeat(40));
      assert.strictEqual(data.message, "File SHA retrieved successfully");
      assert.strictEqual(mockFetch.mock.calls.length, 1);
      assert.strictEqual(mockFetch.mock.calls[0].arguments[1].method, "GET");
      assert.ok(String(mockFetch.mock.calls[0].arguments[0]).includes("/contents/public/data/test.json?ref=main"));

      restoreFetch();
    });

    test("SHA lookup rejects paths outside public/data/", async () => {
      const mockFetch = setupMockFetch();
      const env = createEnv();
      const token = await getAuthToken(env);
      const req = new Request("http://api/api/v1/admin/write/sha?path=public%2Fother.json", {
        headers: { Authorization: "Bearer " + token }
      });

      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 403);
      assert.strictEqual(mockFetch.mock.calls.length, 0);

      restoreFetch();
    });
  });

  describe("POST /api/v1/admin/write/create", () => {
    test("CREATE requires authentication", async () => {
      const env = createEnv();
      const req = new Request("http://api/api/v1/admin/write/create", {
        method: "POST",
        body: JSON.stringify({
          path: "public/data/test.json",
          content: { key: "value" },
          message: "Create test"
        }),
        headers: { "Content-Type": "application/json" }
      });
      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });

    test("CREATE with valid auth - successful", async () => {
      const mockFetch = setupMockFetch();
      const env = createEnv();
      const token = await getAuthToken(env);

      const req = new Request("http://api/api/v1/admin/write/create", {
        method: "POST",
        body: JSON.stringify({
          path: "public/data/new.json",
          content: { title: "Test", data: [1, 2, 3] },
          message: "Create new file"
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const res = await worker.fetch(req, env);
      const data = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.path, "public/data/new.json");
      assert.ok(data.sha);
      assert.strictEqual(data.message, "File created successfully");

      // Verify GitHub API was called with correct params
      const calls = mockFetch.mock.calls;
      assert.ok(calls.length > 0);
      const call = calls[0];
      assert.strictEqual(call.arguments[1].method, "PUT");
      const body = JSON.parse(call.arguments[1].body);
      assert.ok(!body.sha); // CREATE should not have SHA
      assert.ok(body.content); // Base64 content
      assert.ok(body.branch);

      restoreFetch();
    });

    test("CREATE rejects path outside public/data/", async () => {
      const mockFetch = setupMockFetch();
      const env = createEnv();
      const token = await getAuthToken(env);

      const req = new Request("http://api/api/v1/admin/write/create", {
        method: "POST",
        body: JSON.stringify({
          path: "public/test.json", // Not in public/data/
          content: { key: "value" },
          message: "Create test"
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.success, false);

      restoreFetch();
    });

    test("CREATE rejects non-JSON extension", async () => {
      const mockFetch = setupMockFetch();
      const env = createEnv();
      const token = await getAuthToken(env);

      const req = new Request("http://api/api/v1/admin/write/create", {
        method: "POST",
        body: JSON.stringify({
          path: "public/data/test.md",
          content: { key: "value" },
          message: "Create test"
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 403);

      restoreFetch();
    });

    test("CREATE rejects traversal", async () => {
      const mockFetch = setupMockFetch();
      const env = createEnv();
      const token = await getAuthToken(env);

      const req = new Request("http://api/api/v1/admin/write/create", {
        method: "POST",
        body: JSON.stringify({
          path: "public/data/../test.json",
          content: { key: "value" },
          message: "Create test"
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 400);

      restoreFetch();
    });

    test("CREATE rejects content > 1MB", async () => {
      const mockFetch = setupMockFetch();
      const env = createEnv();
      const token = await getAuthToken(env);

      const largeContent = { data: "x".repeat(1100000) };
      const req = new Request("http://api/api/v1/admin/write/create", {
        method: "POST",
        body: JSON.stringify({
          path: "public/data/large.json",
          content: largeContent,
          message: "Create large file"
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 413);

      restoreFetch();
    });

    test("CREATE rejects invalid UTF-8", async () => {
      const mockFetch = setupMockFetch();
      const env = createEnv();
      const token = await getAuthToken(env);

      // Create request with invalid UTF-8 bytes
      const invalidUtf8 = new Uint8Array([0xFF, 0xFE, 0xFD]);
      const req = new Request("http://api/api/v1/admin/write/create", {
        method: "POST",
        body: invalidUtf8,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const res = await worker.fetch(req, env);
      // Should be 422 for invalid UTF-8
      assert.strictEqual(res.status, 422);

      restoreFetch();
    });
  });

  describe("PUT /api/v1/admin/write/update", () => {
    test("UPDATE requires authentication", async () => {
      const env = createEnv();
      const req = new Request("http://api/api/v1/admin/write/update", {
        method: "PUT",
        body: JSON.stringify({
          path: "public/data/test.json",
          content: { key: "updated" },
          sha: "a".repeat(40),
          message: "Update test"
        }),
        headers: { "Content-Type": "application/json" }
      });
      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 401);
    });

    test("UPDATE requires SHA", async () => {
      const mockFetch = setupMockFetch();
      const env = createEnv();
      const token = await getAuthToken(env);

      const req = new Request("http://api/api/v1/admin/write/update", {
        method: "PUT",
        body: JSON.stringify({
          path: "public/data/test.json",
          content: { key: "updated" },
          message: "Update test"
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.ok(data.error.includes("SHA"));

      restoreFetch();
    });

    test("UPDATE with valid auth and SHA - successful", async () => {
      const mockFetch = setupMockFetch();
      const env = createEnv();
      const token = await getAuthToken(env);

      const req = new Request("http://api/api/v1/admin/write/update", {
        method: "PUT",
        body: JSON.stringify({
          path: "public/data/test.json",
          content: { key: "updated", version: 2 },
          sha: "a".repeat(40),
          message: "Update file"
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const res = await worker.fetch(req, env);
      const data = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.path, "public/data/test.json");
      assert.ok(data.sha);
      assert.strictEqual(data.message, "File updated successfully");

      // Verify GitHub API was called with correct params including SHA
      const calls = mockFetch.mock.calls;
      assert.ok(calls.length > 0);
      const call = calls[0];
      const body = JSON.parse(call.arguments[1].body);
      assert.strictEqual(body.sha, "a".repeat(40));

      restoreFetch();
    });

    test("UPDATE rejects invalid SHA format", async () => {
      const mockFetch = setupMockFetch();
      const env = createEnv();
      const token = await getAuthToken(env);

      const req = new Request("http://api/api/v1/admin/write/update", {
        method: "PUT",
        body: JSON.stringify({
          path: "public/data/test.json",
          content: { key: "updated" },
          sha: "invalid-sha",
          message: "Update test"
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 400);

      restoreFetch();
    });

    test("UPDATE rejects path outside public/data/", async () => {
      const mockFetch = setupMockFetch();
      const env = createEnv();
      const token = await getAuthToken(env);

      const req = new Request("http://api/api/v1/admin/write/update", {
        method: "PUT",
        body: JSON.stringify({
          path: "src/test.json",
          content: { key: "updated" },
          sha: "a".repeat(40),
          message: "Update test"
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 403);

      restoreFetch();
    });
  });

  describe("DELETE /api/v1/admin/write/delete", () => {
    test("DELETE requires authentication", async () => {
      const env = createEnv();
      const req = new Request("http://api/api/v1/admin/write/delete", {
        method: "DELETE",
        body: JSON.stringify({
          path: "public/data/test.json",
          sha: "a".repeat(40),
          message: "Delete test"
        }),
        headers: { "Content-Type": "application/json" }
      });
      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 401);
    });

    test("DELETE requires SHA", async () => {
      const mockFetch = setupMockFetch();
      const env = createEnv();
      const token = await getAuthToken(env);

      const req = new Request("http://api/api/v1/admin/write/delete", {
        method: "DELETE",
        body: JSON.stringify({
          path: "public/data/test.json",
          message: "Delete test"
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.ok(data.error.includes("SHA"));

      restoreFetch();
    });

    test("DELETE with valid auth and SHA - successful", async () => {
      const mockFetch = setupMockFetch();
      const env = createEnv();
      const token = await getAuthToken(env);

      const req = new Request("http://api/api/v1/admin/write/delete", {
        method: "DELETE",
        body: JSON.stringify({
          path: "public/data/test.json",
          sha: "b".repeat(40),
          message: "Delete file"
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const res = await worker.fetch(req, env);
      const data = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.path, "public/data/test.json");
      assert.ok(data.sha);
      assert.strictEqual(data.message, "File deleted successfully");

      // Verify GitHub API was called with correct params including SHA
      const calls = mockFetch.mock.calls;
      assert.ok(calls.length > 0);
      const call = calls[0];
      assert.strictEqual(call.arguments[1].method, "DELETE");
      const body = JSON.parse(call.arguments[1].body);
      assert.strictEqual(body.sha, "b".repeat(40));
      assert.ok(!body.content); // DELETE should not have content

      restoreFetch();
    });

    test("DELETE rejects invalid SHA format", async () => {
      const mockFetch = setupMockFetch();
      const env = createEnv();
      const token = await getAuthToken(env);

      const req = new Request("http://api/api/v1/admin/write/delete", {
        method: "DELETE",
        body: JSON.stringify({
          path: "public/data/test.json",
          sha: "not-valid-sha",
          message: "Delete test"
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 400);

      restoreFetch();
    });

    test("DELETE rejects path outside public/data/", async () => {
      const mockFetch = setupMockFetch();
      const env = createEnv();
      const token = await getAuthToken(env);

      const req = new Request("http://api/api/v1/admin/write/delete", {
        method: "DELETE",
        body: JSON.stringify({
          path: "src/test.json",
          sha: "a".repeat(40),
          message: "Delete test"
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 403);

      restoreFetch();
    });
  });

  describe("Regression: Public GET endpoints still work", () => {
    test("GET /api/v1/health is public", async () => {
      const env = createEnv();
      const res = await worker.fetch(new Request("http://api/api/v1/health"), env);
      assert.strictEqual(res.status, 200);
    });

    test("GET /api/v1/github/file requires no auth", async () => {
      const mockFetch = setupMockFetch();
      const env = createEnv();

      const req = new Request("http://api/api/v1/github/file?path=public/config.json");
      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 200);

      restoreFetch();
    });

    test("GET /api/v1/github/repository is public", async () => {
      const mockFetch = setupMockFetch();
      const env = createEnv();

      const res = await worker.fetch(new Request("http://api/api/v1/github/repository", { headers: { Origin: "https://dekeku.my.id" } }), env);
      assert.strictEqual(res.status, 200);

      restoreFetch();
    });

    test("POST to /api/v1/github/file is rejected (public write not allowed)", async () => {
      const env = createEnv();
      const req = new Request("http://api/api/v1/github/file", {
        method: "POST",
        body: JSON.stringify({ path: "public/data/test.json" }),
        headers: { "Content-Type": "application/json" }
      });
      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 405); // Method Not Allowed
    });
  });

  describe("No secret leakage in responses", () => {
    test("Error responses don't contain GitHub token", async () => {
      const mockFetch = mock.fn(() => mockResponse(401, { message: "Bad credentials" }));
      globalThis.fetch = mockFetch;

      const env = createEnv();
      const token = await getAuthToken(env);

      const req = new Request("http://api/api/v1/admin/write/create", {
        method: "POST",
        body: JSON.stringify({
          path: "public/data/test.json",
          content: { key: "value" },
          message: "test"
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const res = await worker.fetch(req, env);
      const data = await res.json();

      assert.ok(!JSON.stringify(data).includes("mock-github-token"));

      restoreFetch();
    });
  });
});
