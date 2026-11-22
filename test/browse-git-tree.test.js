import { test, before, after } from "node:test";
import assert from "node:assert";
import worker from "../src/index.js";

const JWT_SECRET = "test-secret-key-1234567890";
const ADMIN_PASSWORD = "secure-password";
const ADMIN_ORIGIN = "https://dekeku.my.id";
let ADMIN_HASH;
const originalFetch = globalThis.fetch;

const createEnv = () => ({
  JWT_SECRET,
  ADMIN_PASSWORD_HASH: ADMIN_HASH,
  GITHUB_TOKEN: "mock-github-token",
  GITHUB_OWNER: "mock-owner",
  GITHUB_REPO: "mock-repo",
  GITHUB_BRANCH: "main",
  ALLOWED_ORIGINS: ADMIN_ORIGIN
});

function mockResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({
      "x-ratelimit-limit": "5000",
      "x-ratelimit-remaining": "4999",
      "x-ratelimit-reset": "1234567890"
    }),
    json: async () => body
  };
}

async function getAuthToken(env) {
  const response = await worker.fetch(new Request("http://api/api/v1/admin/login", {
    method: "POST",
    body: JSON.stringify({ username: "admin", password: ADMIN_PASSWORD }),
    headers: { "Content-Type": "application/json" }
  }), env);
  const body = await response.json();
  return body.access_token;
}

before(async () => {
  const { hashPassword } = await import("../src/utils/hash.js");
  ADMIN_HASH = await hashPassword(ADMIN_PASSWORD);
});

after(() => {
  globalThis.fetch = originalFetch;
});

test("browse uses real Git Trees metadata and excludes symlinks/submodules", async () => {
  const requested = [];
  globalThis.fetch = async (url) => {
    const value = String(url);
    requested.push(value);

    if (value.endsWith("/config.json")) {
      return new Response(JSON.stringify({
        schema_version: 1,
        project: { id: "dekeku" },
        repository: { username: "mock-owner", repo: "mock-repo" }
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (value === "https://api.github.com/repos/mock-owner/mock-repo") {
      return mockResponse(200, {
        full_name: "mock-owner/mock-repo",
        default_branch: "main",
        visibility: "public"
      });
    }
    if (value.endsWith("/branches/main")) {
      return mockResponse(200, {
        commit: { commit: { tree: { sha: "a".repeat(40) } } }
      });
    }
    if (value.endsWith("/git/trees/" + "a".repeat(40))) {
      return mockResponse(200, {
        truncated: false,
        tree: [{ path: "public", type: "tree", mode: "040000", sha: "b".repeat(40) }]
      });
    }
    if (value.endsWith("/git/trees/" + "b".repeat(40))) {
      return mockResponse(200, {
        truncated: false,
        tree: [
          { path: "normal.json", type: "blob", mode: "100644", sha: "1".repeat(40), size: 12 },
          { path: "link", type: "blob", mode: "120000", sha: "2".repeat(40), size: 4 },
          { path: "submodule", type: "commit", mode: "160000", sha: "3".repeat(40), size: 0 },
          { path: "assets", type: "tree", mode: "040000", sha: "4".repeat(40), size: 0 }
        ]
      });
    }
    return mockResponse(404, { message: "Not Found" });
  };

  const env = createEnv();
  const token = await getAuthToken(env);
  const response = await worker.fetch(new Request("http://api/api/v1/admin/browse?path=public", {
    headers: { Origin: ADMIN_ORIGIN, Authorization: `Bearer ${token}` }
  }), env);
  const body = await response.json();

  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(body.items.map((item) => item.name), ["normal.json", "assets"]);
  assert.strictEqual(body.items[0].type, "file");
  assert.strictEqual(body.items[1].type, "dir");
  assert.ok(requested.some((url) => url.includes("/git/trees/")));
  assert.ok(!JSON.stringify(body).includes("api.github.com"));
});

test("browse propagates Git Trees truncation", async () => {
  globalThis.fetch = async (url) => {
    const value = String(url);
    if (value.endsWith("/config.json")) {
      return new Response(JSON.stringify({
        schema_version: 1,
        project: { id: "dekeku" },
        repository: { username: "mock-owner", repo: "mock-repo" }
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (value === "https://api.github.com/repos/mock-owner/mock-repo") {
      return mockResponse(200, { full_name: "mock-owner/mock-repo", default_branch: "main", visibility: "public" });
    }
    if (value.endsWith("/branches/main")) {
      return mockResponse(200, { commit: { commit: { tree: { sha: "a".repeat(40) } } } });
    }
    if (value.endsWith("/git/trees/" + "a".repeat(40))) {
      return mockResponse(200, { truncated: false, tree: [{ path: "public", type: "tree", mode: "040000", sha: "b".repeat(40) }] });
    }
    if (value.endsWith("/git/trees/" + "b".repeat(40))) {
      return mockResponse(200, { truncated: true, tree: [
        { path: "one.json", type: "blob", mode: "100644", sha: "1".repeat(40), size: 1 }
      ] });
    }
    return mockResponse(404, {});
  };

  const env = createEnv();
  const token = await getAuthToken(env);
  const response = await worker.fetch(new Request("http://api/api/v1/admin/browse?path=public", {
    headers: { Origin: ADMIN_ORIGIN, Authorization: `Bearer ${token}` }
  }), env);
  const body = await response.json();

  assert.strictEqual(response.status, 200);
  assert.strictEqual(body.truncated, true);
});
