import { test, before, after } from "node:test";
import assert from "node:assert";
import worker from "../src/index.js";

const JWT_SECRET = "test-secret-key-1234567890";
const ADMIN_PASSWORD = "secure-password";
const ADMIN_ORIGIN = "https://dekeku.my.id";
const ROOT_SHA = "a".repeat(40);
const PUBLIC_SHA = "b".repeat(40);
const DATA_SHA = "c".repeat(40);
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

function installGitHubMock({ publicTree = [], dataTree = [], defaultBranch = "main", rootTree = null } = {}) {
  const requested = [];
  const trees = new Map([
    [ROOT_SHA, rootTree || {
      truncated: false,
      tree: [{ path: "public", type: "tree", mode: "040000", sha: PUBLIC_SHA }]
    }],
    [PUBLIC_SHA, { truncated: false, tree: publicTree }],
    [DATA_SHA, { truncated: false, tree: dataTree }]
  ]);

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
        default_branch: defaultBranch,
        visibility: "public"
      });
    }

    if (value.endsWith("/branches/" + encodeURIComponent(defaultBranch))) {
      return mockResponse(200, {
        commit: { commit: { tree: { sha: ROOT_SHA } } }
      });
    }

    const treePrefix = "https://api.github.com/repos/mock-owner/mock-repo/git/trees/";
    if (value.startsWith(treePrefix)) {
      const sha = decodeURIComponent(value.slice(treePrefix.length).split("?")[0]);
      if (trees.has(sha)) return mockResponse(200, trees.get(sha));
      return mockResponse(404, { message: "Not Found" });
    }

    return mockResponse(404, { message: "Not Found" });
  };

  return requested;
}

async function getAuthToken(env) {
  const response = await worker.fetch(new Request("http://api/api/v1/admin/login", {
    method: "POST",
    body: JSON.stringify({ username: "admin", password: ADMIN_PASSWORD }),
    headers: { "Content-Type": "application/json" }
  }), env);
  const body = await response.json();
  assert.strictEqual(response.status, 200);
  return body.access_token;
}

async function browse(path = "public", { env = createEnv(), token = null, page = 1, perPage = 50 } = {}) {
  const accessToken = token || await getAuthToken(env);
  const url = new URL("http://api/api/v1/admin/browse");
  url.searchParams.set("path", path);
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", String(perPage));
  return worker.fetch(new Request(url, {
    headers: { Origin: ADMIN_ORIGIN, Authorization: `Bearer ${accessToken}` }
  }), env);
}

before(async () => {
  const { hashPassword } = await import("../src/utils/hash.js");
  ADMIN_HASH = await hashPassword(ADMIN_PASSWORD);
});

after(() => {
  globalThis.fetch = originalFetch;
});

test("requires Admin JWT and GET method", async () => {
  installGitHubMock();
  const env = createEnv();
  const unauthenticated = await worker.fetch(new Request("http://api/api/v1/admin/browse?path=public", {
    headers: { Origin: ADMIN_ORIGIN }
  }), env);
  assert.strictEqual(unauthenticated.status, 401);

  const wrongMethod = await worker.fetch(new Request("http://api/api/v1/admin/browse", {
    method: "POST",
    headers: { Origin: ADMIN_ORIGIN }
  }), env);
  assert.strictEqual(wrongMethod.status, 405);
});

test("uses actual Git Trees metadata and filters symlinks, submodules, hidden and sensitive entries", async () => {
  const requested = installGitHubMock({
    publicTree: [
      { path: "normal.json", type: "blob", mode: "100644", sha: "1".repeat(40), size: 12 },
      { path: "assets", type: "tree", mode: "040000", sha: DATA_SHA, size: 0 },
      { path: "link", type: "blob", mode: "120000", sha: "2".repeat(40), size: 4 },
      { path: "submodule", type: "commit", mode: "160000", sha: "3".repeat(40), size: 0 },
      { path: ".hidden", type: "blob", mode: "100644", sha: "4".repeat(40), size: 2 },
      { path: "secrets.json", type: "blob", mode: "100644", sha: "5".repeat(40), size: 2 },
      { path: "unknown", type: "blob", mode: "999999", sha: "6".repeat(40), size: 2 },
      { path: "unverifiable", type: "blob", sha: "7".repeat(40), size: 2 },
      { path: "nested/forged.json", type: "blob", mode: "100644", sha: "8".repeat(40), size: 2 },
      { path: "missing-sha.json", type: "blob", mode: "100644", size: 2 }
    ]
  });

  const response = await browse();
  const body = await response.json();

  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(body.items.map((item) => item.name), ["normal.json", "assets"]);
  assert.deepStrictEqual(Object.keys(body.items[0]).sort(), ["name", "path", "sha", "size", "type"]);
  assert.ok(requested.some((url) => url.includes("/branches/main")));
  assert.ok(requested.some((url) => url.includes("/git/trees/")));
  assert.ok(!JSON.stringify(body).includes("api.github.com"));
});

test("resolves nested directories by traversing tree SHAs", async () => {
  const requested = installGitHubMock({
    publicTree: [
      { path: "data", type: "tree", mode: "040000", sha: DATA_SHA, size: 0 }
    ],
    dataTree: [
      { path: "items.json", type: "blob", mode: "100644", sha: "8".repeat(40), size: 88 }
    ]
  });

  const response = await browse("public/data");
  const body = await response.json();

  assert.strictEqual(response.status, 200);
  assert.strictEqual(body.path, "public/data");
  assert.strictEqual(body.items.length, 1);
  assert.strictEqual(body.items[0].name, "items.json");
  assert.ok(requested.some((url) => url.endsWith("/git/trees/" + DATA_SHA)));
});

test("paginates the verified tree entries", async () => {
  installGitHubMock({
    publicTree: Array.from({ length: 5 }, (_, index) => ({
      path: `file${index + 1}.json`,
      type: "blob",
      mode: "100644",
      sha: String(index + 1).repeat(40),
      size: 100
    }))
  });

  const first = await (await browse("public", { perPage: 2 })).json();
  const second = await (await browse("public", { page: 2, perPage: 2 })).json();

  assert.strictEqual(first.total_items, 5);
  assert.strictEqual(first.total_pages, 3);
  assert.deepStrictEqual(first.items.map((item) => item.name), ["file1.json", "file2.json"]);
  assert.deepStrictEqual(second.items.map((item) => item.name), ["file3.json", "file4.json"]);
});

test("propagates Git Trees truncated flag", async () => {
  installGitHubMock({
    publicTree: [
      { path: "one.json", type: "blob", mode: "100644", sha: "9".repeat(40), size: 1 }
    ]
  });
  const response = await browse();
  const body = await response.json();
  assert.strictEqual(body.truncated, false);

  installGitHubMock({
    publicTree: [
      { path: "one.json", type: "blob", mode: "100644", sha: "9".repeat(40), size: 1 }
    ]
  });
  const env = createEnv();
  const token = await getAuthToken(env);
  const original = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const value = String(url);
    if (value.includes("/git/trees/" + PUBLIC_SHA)) {
      return mockResponse(200, {
        truncated: true,
        tree: [{ path: "one.json", type: "blob", mode: "100644", sha: "9".repeat(40), size: 1 }]
      });
    }
    return original(url);
  };
  const truncatedResponse = await browse("public", { env, token });
  const truncatedBody = await truncatedResponse.json();
  assert.strictEqual(truncatedBody.truncated, true);
});

test("rejects traversal, hidden paths, and paths outside public/", async () => {
  installGitHubMock();
  const env = createEnv();
  const token = await getAuthToken(env);
  for (const path of ["public/../private", "public%2f..%2fprivate", "public%252f..%252fprivate", "public\\data", "public//data"]) {
    const response = await worker.fetch(new Request(`http://api/api/v1/admin/browse?path=${path}`, {
      headers: { Origin: ADMIN_ORIGIN, Authorization: `Bearer ${token}` }
    }), env);
    assert.strictEqual(response.status, 400, path);
  }
  for (const path of ["src", "private", "package.json", "public/.env", "public/.git", "public/secrets.json"]) {
    const response = await browse(path, { env, token });
    assert.ok(response.status === 403 || response.status === 400, path);
  }
});

test("returns 404 when a requested path is a file rather than a directory", async () => {
  installGitHubMock({
    publicTree: [
      { path: "file.json", type: "blob", mode: "100644", sha: "a".repeat(40), size: 10 }
    ]
  });
  const response = await browse("public/file.json");
  assert.strictEqual(response.status, 404);
});

test("uses the repository default branch, including URL-encoded branch names", async () => {
  const requested = installGitHubMock({ defaultBranch: "release/v2" });
  const response = await browse();
  assert.strictEqual(response.status, 200);
  assert.ok(requested.some((url) => url.includes("/branches/release%2Fv2")));
});
