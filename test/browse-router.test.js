import { test, describe, before, after, mock } from "node:test";
import assert from "node:assert";
import worker from "../src/index.js";

const JWT_SECRET = "test-secret-key-1234567890";
const ADMIN_PASSWORD = "secure-password";
const ADMIN_ORIGIN = "https://dekeku.my.id";
let ADMIN_HASH;

const createEnv = (accessToken) => ({
  JWT_SECRET,
  ADMIN_PASSWORD_HASH: ADMIN_HASH,
  GITHUB_TOKEN: "mock-github-token",
  GITHUB_OWNER: "mock-owner",
  GITHUB_REPO: "mock-repo",
  GITHUB_BRANCH: "main",
  ALLOWED_ORIGINS: "https://dekeku.my.id"
});

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

describe("PUB-004 Public Repository File Browser Router", () => {
  before(async () => {
    const { hashPassword } = await import("../src/utils/hash.js");
    ADMIN_HASH = await hashPassword(ADMIN_PASSWORD);
  });

  after(() => {
    globalThis.fetch = originalFetch;
  });

  describe("Authentication and HTTP Method", () => {
    test("requires authentication for /api/v1/admin/browse", async () => {
      const env = createEnv();
      const req = new Request("http://api/api/v1/admin/browse?path=public", {
        headers: { Origin: ADMIN_ORIGIN }
      });
      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 401);
    });

    test("rejects non-GET methods on /api/v1/admin/browse", async () => {
      const env = createEnv();
      const req = new Request("http://api/api/v1/admin/browse", {
        method: "POST",
        headers: { Origin: ADMIN_ORIGIN }
      });
      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 405);
    });
  });

  describe("Directory Browsing and Subdirectories", () => {
    test("lists public/ directory with metadata and default path", async () => {
      const calls = [];
      globalThis.fetch = mock.fn(async (url, options) => {
        calls.push({ url: String(url), options });
        if (String(url).endsWith("/config.json")) {
          return new Response(JSON.stringify({
            schema_version: 1,
            project: { id: "dekeku" },
            repository: { username: "mock-owner", repo: "mock-repo" }
          }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        if (String(url) === "https://api.github.com/repos/mock-owner/mock-repo") {
          return mockResponse(200, {
            full_name: "mock-owner/mock-repo",
            default_branch: "main",
            visibility: "public"
          });
        }
        if (String(url).includes("/contents/public?ref=main")) {
          return mockResponse(200, [
            { name: "data", path: "public/data", sha: "1".repeat(40), size: 0, type: "dir", download_url: null },
            { name: "index.json", path: "public/index.json", sha: "2".repeat(40), size: 120, type: "file", download_url: "https://example.com" }
          ]);
        }
        return mockResponse(404, { message: "Not found" });
      });

      const env = createEnv();
      const token = await getAuthToken(env);

      const req = new Request("http://api/api/v1/admin/browse", {
        headers: { Origin: ADMIN_ORIGIN, Authorization: `Bearer ${token}` }
      });

      const res = await worker.fetch(req, env);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.path, "public");
      assert.strictEqual(body.page, 1);
      assert.strictEqual(body.per_page, 50);
      assert.strictEqual(body.total_items, 2);
      assert.strictEqual(body.total_pages, 1);
      assert.strictEqual(body.truncated, false);
      assert.strictEqual(body.items.length, 2);
      assert.deepStrictEqual(body.items[0], {
        name: "data",
        path: "public/data",
        type: "dir",
        size: 0,
        sha: "1".repeat(40)
      });

      globalThis.fetch = originalFetch;
    });

    test("navigates subdirectory public/data", async () => {
      globalThis.fetch = mock.fn(async (url) => {
        if (String(url).endsWith("/config.json")) {
          return new Response(JSON.stringify({
            schema_version: 1,
            project: { id: "dekeku" },
            repository: { username: "mock-owner", repo: "mock-repo" }
          }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        if (String(url) === "https://api.github.com/repos/mock-owner/mock-repo") {
          return mockResponse(200, {
            full_name: "mock-owner/mock-repo",
            default_branch: "main",
            visibility: "public"
          });
        }
        if (String(url).includes("/contents/public/data?ref=main")) {
          return mockResponse(200, [
            { name: "items.json", path: "public/data/items.json", sha: "3".repeat(40), size: 300, type: "file" }
          ]);
        }
        return mockResponse(404, { message: "Not found" });
      });

      const env = createEnv();
      const token = await getAuthToken(env);

      const req = new Request("http://api/api/v1/admin/browse?path=public/data", {
        headers: { Origin: ADMIN_ORIGIN, Authorization: `Bearer ${token}` }
      });

      const res = await worker.fetch(req, env);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.path, "public/data");
      assert.strictEqual(body.items.length, 1);
      assert.strictEqual(body.items[0].name, "items.json");

      globalThis.fetch = originalFetch;
    });
  });

  describe("Pagination", () => {
    test("paginates directory items correctly", async () => {
      const items = Array.from({ length: 5 }, (_, i) => ({
        name: `file${i + 1}.json`,
        path: `public/file${i + 1}.json`,
        sha: "a".repeat(40),
        size: 100,
        type: "file"
      }));

      globalThis.fetch = mock.fn(async (url) => {
        if (String(url).endsWith("/config.json")) {
          return new Response(JSON.stringify({
            schema_version: 1,
            project: { id: "dekeku" },
            repository: { username: "mock-owner", repo: "mock-repo" }
          }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        if (String(url) === "https://api.github.com/repos/mock-owner/mock-repo") {
          return mockResponse(200, {
            full_name: "mock-owner/mock-repo",
            default_branch: "main",
            visibility: "public"
          });
        }
        if (String(url).includes("/contents/public?ref=main")) {
          return mockResponse(200, items);
        }
        return mockResponse(404, {});
      });

      const env = createEnv();
      const token = await getAuthToken(env);

      const req1 = new Request("http://api/api/v1/admin/browse?path=public&page=1&per_page=2", {
        headers: { Origin: ADMIN_ORIGIN, Authorization: `Bearer ${token}` }
      });
      const res1 = await worker.fetch(req1, env);
      const body1 = await res1.json();

      assert.strictEqual(res1.status, 200);
      assert.strictEqual(body1.page, 1);
      assert.strictEqual(body1.per_page, 2);
      assert.strictEqual(body1.total_items, 5);
      assert.strictEqual(body1.total_pages, 3);
      assert.strictEqual(body1.items.length, 2);
      assert.strictEqual(body1.items[0].name, "file1.json");
      assert.strictEqual(body1.items[1].name, "file2.json");

      const req2 = new Request("http://api/api/v1/admin/browse?path=public&page=2&per_page=2", {
        headers: { Origin: ADMIN_ORIGIN, Authorization: `Bearer ${token}` }
      });
      const res2 = await worker.fetch(req2, env);
      const body2 = await res2.json();

      assert.strictEqual(body2.page, 2);
      assert.strictEqual(body2.items.length, 2);
      assert.strictEqual(body2.items[0].name, "file3.json");

      globalThis.fetch = originalFetch;
    });

    test("clamps per_page to 100 max and rejects invalid page/per_page", async () => {
      const env = createEnv();
      const token = await getAuthToken(env);

      const reqInvalidPage = new Request("http://api/api/v1/admin/browse?path=public&page=0", {
        headers: { Origin: ADMIN_ORIGIN, Authorization: `Bearer ${token}` }
      });
      const resPage = await worker.fetch(reqInvalidPage, env);
      assert.strictEqual(resPage.status, 400);

      const reqInvalidPerPage = new Request("http://api/api/v1/admin/browse?path=public&per_page=abc", {
        headers: { Origin: ADMIN_ORIGIN, Authorization: `Bearer ${token}` }
      });
      const resPerPage = await worker.fetch(reqInvalidPerPage, env);
      assert.strictEqual(resPerPage.status, 400);
    });
  });

  describe("Security and Path Validation", () => {
    test("rejects path traversal attempts", async () => {
      const env = createEnv();
      const token = await getAuthToken(env);

      const invalidPaths = [
        "public/../private",
        "public%2f..%2fprivate",
        "public%252f..%252fprivate",
        "public\\data",
        "public/data%00",
        "public//data"
      ];

      for (const p of invalidPaths) {
        const req = new Request(`http://api/api/v1/admin/browse?path=${p}`, {
          headers: { Origin: ADMIN_ORIGIN, Authorization: `Bearer ${token}` }
        });
        const res = await worker.fetch(req, env);
        assert.strictEqual(res.status, 400, `Path ${p} must be rejected with 400`);
      }
    });

    test("rejects paths outside public/", async () => {
      const env = createEnv();
      const token = await getAuthToken(env);

      const forbiddenPaths = ["src", "private", "package.json", "docs"];

      for (const p of forbiddenPaths) {
        const req = new Request(`http://api/api/v1/admin/browse?path=${p}`, {
          headers: { Origin: ADMIN_ORIGIN, Authorization: `Bearer ${token}` }
        });
        const res = await worker.fetch(req, env);
        assert.strictEqual(res.status, 403, `Path ${p} must be rejected with 403`);
      }
    });

    test("rejects hidden and sensitive path requests", async () => {
      const env = createEnv();
      const token = await getAuthToken(env);

      const sensitivePaths = [
        "public/.git",
        "public/secrets.json",
        "public/sub/app.key",
        "public/.env"
      ];

      for (const p of sensitivePaths) {
        const req = new Request(`http://api/api/v1/admin/browse?path=${p}`, {
          headers: { Origin: ADMIN_ORIGIN, Authorization: `Bearer ${token}` }
        });
        const res = await worker.fetch(req, env);
        assert.strictEqual(res.status, 403, `Path ${p} must be rejected with 403`);
      }
    });

    test("filters out hidden, sensitive, symlink, and submodule items from response", async () => {
      globalThis.fetch = mock.fn(async (url) => {
        if (String(url).endsWith("/config.json")) {
          return new Response(JSON.stringify({
            schema_version: 1,
            project: { id: "dekeku" },
            repository: { username: "mock-owner", repo: "mock-repo" }
          }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        if (String(url) === "https://api.github.com/repos/mock-owner/mock-repo") {
          return mockResponse(200, {
            full_name: "mock-owner/mock-repo",
            default_branch: "main",
            visibility: "public"
          });
        }
        if (String(url).includes("/contents/public?ref=main")) {
          return mockResponse(200, [
            { name: "normal.json", path: "public/normal.json", sha: "1".repeat(40), size: 10, type: "file", mode: "100644" },
            { name: ".hidden", path: "public/.hidden", sha: "2".repeat(40), size: 10, type: "file" },
            { name: "secrets.json", path: "public/secrets.json", sha: "3".repeat(40), size: 10, type: "file" },
            { name: "package.json", path: "public/package.json", sha: "4".repeat(40), size: 10, type: "file" },
            { name: "link", path: "public/link", sha: "5".repeat(40), size: 0, type: "symlink" },
            { name: "submod", path: "public/submod", sha: "6".repeat(40), size: 0, type: "submodule" },
            { name: "sym_mode", path: "public/sym_mode", sha: "a".repeat(40), size: 0, type: "blob", mode: "120000" },
            { name: "sub_mode", path: "public/sub_mode", sha: "b".repeat(40), size: 0, type: "commit", mode: "160000" },
            { name: "unverifiable", path: "public/unverifiable", sha: "c".repeat(40), size: 0, type: "custom", mode: "999999" },
            { name: "fake_symlink", path: "public/fake_symlink", sha: "7".repeat(40), size: 0, type: "file", target: "../private" },
            { name: "fake_submod", path: "public/fake_submod", sha: "8".repeat(40), size: 0, type: "dir", submodule_git_url: "git@github.com:evil/repo.git" }
          ]);
        }
        return mockResponse(404, {});
      });

      const env = createEnv();
      const token = await getAuthToken(env);

      const req = new Request("http://api/api/v1/admin/browse?path=public", {
        headers: { Origin: ADMIN_ORIGIN, Authorization: `Bearer ${token}` }
      });

      const res = await worker.fetch(req, env);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.items.length, 1);
      assert.strictEqual(body.items[0].name, "normal.json");
      assert.strictEqual(body.items[0].type, "file");

      globalThis.fetch = originalFetch;
    });

    test("rejects items whose path does not match exact child path of requested directory", async () => {
      globalThis.fetch = mock.fn(async (url) => {
        if (String(url).endsWith("/config.json")) {
          return new Response(JSON.stringify({
            schema_version: 1,
            project: { id: "dekeku" },
            repository: { username: "mock-owner", repo: "mock-repo" }
          }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        if (String(url) === "https://api.github.com/repos/mock-owner/mock-repo") {
          return mockResponse(200, {
            full_name: "mock-owner/mock-repo",
            default_branch: "main",
            visibility: "public"
          });
        }
        if (String(url).includes("/contents/public/data?ref=main")) {
          return mockResponse(200, [
            { name: "valid.json", path: "public/data/valid.json", sha: "1".repeat(40), size: 10, type: "file" },
            { name: "mismatched.json", path: "public/outside/mismatched.json", sha: "2".repeat(40), size: 10, type: "file" },
            { name: "spoofed.json", path: "public/data_fake/spoofed.json", sha: "3".repeat(40), size: 10, type: "file" }
          ]);
        }
        return mockResponse(404, {});
      });

      const env = createEnv();
      const token = await getAuthToken(env);

      const req = new Request("http://api/api/v1/admin/browse?path=public/data", {
        headers: { Origin: ADMIN_ORIGIN, Authorization: `Bearer ${token}` }
      });

      const res = await worker.fetch(req, env);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.items.length, 1);
      assert.strictEqual(body.items[0].name, "valid.json");
      assert.strictEqual(body.items[0].path, "public/data/valid.json");

      globalThis.fetch = originalFetch;
    });
  });

  describe("Upstream Truncation and Item Limits", () => {
    test("returns truncated: false when directory has fewer than 1000 items", async () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        name: `item${i}.json`,
        path: `public/item${i}.json`,
        sha: "0".repeat(40),
        size: 10,
        type: "file",
        mode: "100644"
      }));

      globalThis.fetch = mock.fn(async (url) => {
        if (String(url).endsWith("/config.json")) {
          return new Response(JSON.stringify({
            schema_version: 1,
            project: { id: "dekeku" },
            repository: { username: "mock-owner", repo: "mock-repo" }
          }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        if (String(url) === "https://api.github.com/repos/mock-owner/mock-repo") {
          return mockResponse(200, {
            full_name: "mock-owner/mock-repo",
            default_branch: "main",
            visibility: "public"
          });
        }
        return mockResponse(200, items);
      });

      const env = createEnv();
      const token = await getAuthToken(env);

      const req = new Request("http://api/api/v1/admin/browse?path=public", {
        headers: { Origin: ADMIN_ORIGIN, Authorization: `Bearer ${token}` }
      });

      const res = await worker.fetch(req, env);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.truncated, false);
      assert.strictEqual(body.total_items, 50);

      globalThis.fetch = originalFetch;
    });

    test("sets truncated: true when Contents API returns exactly 1000 items", async () => {
      const items = Array.from({ length: 1000 }, (_, i) => ({
        name: `item${i}.json`,
        path: `public/item${i}.json`,
        sha: "0".repeat(40),
        size: 5,
        type: "file",
        mode: "100644"
      }));

      globalThis.fetch = mock.fn(async (url) => {
        if (String(url).endsWith("/config.json")) {
          return new Response(JSON.stringify({
            schema_version: 1,
            project: { id: "dekeku" },
            repository: { username: "mock-owner", repo: "mock-repo" }
          }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        if (String(url) === "https://api.github.com/repos/mock-owner/mock-repo") {
          return mockResponse(200, {
            full_name: "mock-owner/mock-repo",
            default_branch: "main",
            visibility: "public"
          });
        }
        return mockResponse(200, items);
      });

      const env = createEnv();
      const token = await getAuthToken(env);

      const req = new Request("http://api/api/v1/admin/browse?path=public", {
        headers: { Origin: ADMIN_ORIGIN, Authorization: `Bearer ${token}` }
      });

      const res = await worker.fetch(req, env);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.truncated, true);
      assert.strictEqual(body.total_items, 1000);

      globalThis.fetch = originalFetch;
    });

    test("sets truncated: true when Git Trees API object has truncated: true", async () => {
      const treeResponse = {
        sha: "master-sha",
        truncated: true,
        tree: [
          { name: "a.json", path: "public/a.json", sha: "1".repeat(40), size: 10, type: "blob", mode: "100644" },
          { name: "b", path: "public/b", sha: "2".repeat(40), size: 0, type: "tree", mode: "040000" }
        ]
      };

      globalThis.fetch = mock.fn(async (url) => {
        if (String(url).endsWith("/config.json")) {
          return new Response(JSON.stringify({
            schema_version: 1,
            project: { id: "dekeku" },
            repository: { username: "mock-owner", repo: "mock-repo" }
          }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        if (String(url) === "https://api.github.com/repos/mock-owner/mock-repo") {
          return mockResponse(200, {
            full_name: "mock-owner/mock-repo",
            default_branch: "main",
            visibility: "public"
          });
        }
        return mockResponse(200, treeResponse);
      });

      const env = createEnv();
      const token = await getAuthToken(env);

      const req = new Request("http://api/api/v1/admin/browse?path=public", {
        headers: { Origin: ADMIN_ORIGIN, Authorization: `Bearer ${token}` }
      });

      const res = await worker.fetch(req, env);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.truncated, true);
      assert.strictEqual(body.total_items, 2);
      assert.strictEqual(body.items[0].type, "file");
      assert.strictEqual(body.items[1].type, "dir");

      globalThis.fetch = originalFetch;
    });
  });

  describe("Upstream Error and Type Edge Cases", () => {
    test("returns 404 when directory is not found upstream", async () => {
      globalThis.fetch = mock.fn(async (url) => {
        if (String(url).endsWith("/config.json")) {
          return new Response(JSON.stringify({
            schema_version: 1,
            project: { id: "dekeku" },
            repository: { username: "mock-owner", repo: "mock-repo" }
          }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        if (String(url) === "https://api.github.com/repos/mock-owner/mock-repo") {
          return mockResponse(200, {
            full_name: "mock-owner/mock-repo",
            default_branch: "main",
            visibility: "public"
          });
        }
        return mockResponse(404, { message: "Not Found" });
      });

      const env = createEnv();
      const token = await getAuthToken(env);

      const req = new Request("http://api/api/v1/admin/browse?path=public/nonexistent", {
        headers: { Origin: ADMIN_ORIGIN, Authorization: `Bearer ${token}` }
      });

      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 404);

      globalThis.fetch = originalFetch;
    });

    test("returns 400 when upstream response is not an array or tree object", async () => {
      globalThis.fetch = mock.fn(async (url) => {
        if (String(url).endsWith("/config.json")) {
          return new Response(JSON.stringify({
            schema_version: 1,
            project: { id: "dekeku" },
            repository: { username: "mock-owner", repo: "mock-repo" }
          }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        if (String(url) === "https://api.github.com/repos/mock-owner/mock-repo") {
          return mockResponse(200, {
            full_name: "mock-owner/mock-repo",
            default_branch: "main",
            visibility: "public"
          });
        }
        return mockResponse(200, {
          name: "file.json",
          path: "public/file.json",
          sha: "a".repeat(40),
          size: 10,
          type: "file"
        });
      });

      const env = createEnv();
      const token = await getAuthToken(env);

      const req = new Request("http://api/api/v1/admin/browse?path=public/file.json", {
        headers: { Origin: ADMIN_ORIGIN, Authorization: `Bearer ${token}` }
      });

      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 400);

      globalThis.fetch = originalFetch;
    });
  });

  describe("Resolver Repository and Default Branch Usage", () => {
    test("uses repository identity and custom default branch from resolver", async () => {
      const queriedUrls = [];
      globalThis.fetch = mock.fn(async (url) => {
        queriedUrls.push(String(url));
        if (String(url).endsWith("/config.json")) {
          return new Response(JSON.stringify({
            schema_version: 1,
            project: { id: "custom-proj" },
            repository: { username: "mock-owner", repo: "custom-repo" }
          }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        if (String(url) === "https://api.github.com/repos/mock-owner/custom-repo") {
          return mockResponse(200, {
            full_name: "mock-owner/custom-repo",
            default_branch: "release-v2",
            visibility: "public"
          });
        }
        if (String(url).includes("/contents/public?ref=release-v2")) {
          return mockResponse(200, [
            { name: "v2.json", path: "public/v2.json", sha: "9".repeat(40), size: 20, type: "file" }
          ]);
        }
        return mockResponse(404, {});
      });

      const env = createEnv();
      const token = await getAuthToken(env);

      const req = new Request("http://api/api/v1/admin/browse?path=public", {
        headers: { Origin: ADMIN_ORIGIN, Authorization: `Bearer ${token}` }
      });

      const res = await worker.fetch(req, env);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.items[0].name, "v2.json");
      assert.ok(queriedUrls.some((u) => u.includes("/repos/mock-owner/custom-repo/contents/public?ref=release-v2")));

      globalThis.fetch = originalFetch;
    });
  });
});
