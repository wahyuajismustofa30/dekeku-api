import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";
import { hashPassword } from "../src/utils/hash.js";

const PROJECT_ORIGIN = "https://project.example";
const JWT_SECRET = "project-selector-test-secret";
const ADMIN_PASSWORD = "test-admin-password";
const ROOT_SHA = "a".repeat(40);
const PUBLIC_SHA = "b".repeat(40);
const DATA_SHA = "c".repeat(40);
const FILE_SHA = "d".repeat(40);
const originalFetch = globalThis.fetch;
let ADMIN_HASH;

const env = {
  JWT_SECRET,
  ADMIN_PASSWORD_HASH: "",
  GITHUB_TOKEN: "mock-token",
  GITHUB_OWNER: "mock-owner",
  GITHUB_REPO: "fallback-repo",
  GITHUB_BRANCH: "main",
  ALLOWED_ORIGINS: PROJECT_ORIGIN
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function installMockFetch() {
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    const value = String(url);
    calls.push({ url: value, options });
    if (value === PROJECT_ORIGIN + "/config.json") {
      return jsonResponse({
        schema_version: 1,
        project: { id: "project-demo" },
        repository: { username: "mock-owner", repo: "project-repo" }
      });
    }
    if (value === "https://api.github.com/repos/mock-owner/project-repo") {
      return jsonResponse({
        full_name: "mock-owner/project-repo",
        default_branch: "main",
        visibility: "public",
        html_url: "https://github.com/mock-owner/project-repo"
      });
    }
    if (value === "https://api.github.com/repos/mock-owner/project-repo/branches/main") {
      return jsonResponse({ commit: { commit: { tree: { sha: ROOT_SHA } } } });
    }
    const treePrefix = "https://api.github.com/repos/mock-owner/project-repo/git/trees/";
    if (value.startsWith(treePrefix)) {
      const sha = value.slice(treePrefix.length).split("?")[0];
      const trees = {
        [ROOT_SHA]: { truncated: false, tree: [{ path: "public", type: "tree", mode: "040000", sha: PUBLIC_SHA }] },
        [PUBLIC_SHA]: { truncated: false, tree: [{ path: "data", type: "tree", mode: "040000", sha: DATA_SHA }] },
        [DATA_SHA]: { truncated: false, tree: [{ path: "sample.json", type: "blob", mode: "100644", sha: FILE_SHA, size: 19 }] }
      };
      return trees[sha] ? jsonResponse(trees[sha]) : jsonResponse({ message: "Not Found" }, 404);
    }
    if (value === "https://api.github.com/repos/mock-owner/project-repo/contents/public/data/sample.json?ref=main") {
      return jsonResponse({
        type: "file",
        path: "public/data/sample.json",
        size: 19,
        sha: FILE_SHA,
        content: btoa('{"message":"hello"}'),
        encoding: "base64"
      });
    }
    if (value === "https://api.github.com/repos/mock-owner/project-repo/contents/public/data/created.json" &&
        options.method === "PUT") {
      return jsonResponse({ content: { sha: "e".repeat(40) } });
    }
    throw new Error("Unexpected outbound request: " + value);
  };
  return calls;
}

async function adminToken() {
  const response = await worker.fetch(new Request("https://gateway.example/api/v1/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: ADMIN_PASSWORD })
  }), { ...env, ADMIN_PASSWORD_HASH: ADMIN_HASH });
  assert.equal(response.status, 200);
  return (await response.json()).access_token;
}

before(async () => {
  ADMIN_HASH = await hashPassword(ADMIN_PASSWORD);
});

after(() => {
  globalThis.fetch = originalFetch;
});

test("project selector header can select an allowlisted project without a browser Origin header", async () => {
  const calls = installMockFetch();
  const response = await worker.fetch(new Request("https://gateway.example/api/v1/github/repository", {
    headers: { "X-DEKEKU-Project-Origin": PROJECT_ORIGIN }
  }), { ...env, ADMIN_PASSWORD_HASH: ADMIN_HASH });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.name, "mock-owner/project-repo");
  assert.equal(body.default_branch, "main");
  assert.equal(calls[0].url, PROJECT_ORIGIN + "/config.json");
});

test("an invalid project selector is rejected even when the actual Origin is trusted", async () => {
  const calls = installMockFetch();
  const response = await worker.fetch(new Request("https://gateway.example/api/v1/github/repository", {
    headers: {
      Origin: PROJECT_ORIGIN,
      "X-DEKEKU-Project-Origin": "https://attacker.example"
    }
  }), { ...env, ADMIN_PASSWORD_HASH: ADMIN_HASH });

  assert.equal(response.status, 403);
  assert.equal(calls.length, 0);
});

test("Admin browse uses the selected project header and requires Admin JWT", async () => {
  installMockFetch();
  const token = await adminToken();
  const response = await worker.fetch(new Request("https://gateway.example/api/v1/admin/browse?path=public/data", {
    headers: {
      Authorization: "Bearer " + token,
      "X-DEKEKU-Project-Origin": PROJECT_ORIGIN
    }
  }), { ...env, ADMIN_PASSWORD_HASH: ADMIN_HASH });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.items.length, 1);
  assert.equal(body.items[0].path, "public/data/sample.json");
});

test("Admin JSON file reader returns parsed content and SHA for the selected project", async () => {
  installMockFetch();
  const token = await adminToken();
  const response = await worker.fetch(new Request("https://gateway.example/api/v1/admin/write/file?path=public%2Fdata%2Fsample.json", {
    headers: {
      Authorization: "Bearer " + token,
      "X-DEKEKU-Project-Origin": PROJECT_ORIGIN
    }
  }), { ...env, ADMIN_PASSWORD_HASH: ADMIN_HASH });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.path, "public/data/sample.json");
  assert.equal(body.sha, FILE_SHA);
  assert.deepEqual(body.content, { message: "hello" });
});

test("Admin JSON file reader rejects paths outside the writable JSON area", async () => {
  const calls = installMockFetch();
  const token = await adminToken();
  const response = await worker.fetch(new Request("https://gateway.example/api/v1/admin/write/file?path=public%2Fsecret.json", {
    headers: {
      Authorization: "Bearer " + token,
      "X-DEKEKU-Project-Origin": PROJECT_ORIGIN
    }
  }), { ...env, ADMIN_PASSWORD_HASH: ADMIN_HASH });

  assert.equal(response.status, 403);
  assert.equal(calls.length, 0);
});

test("Admin CREATE writes to the selected project without relying on browser Origin", async () => {
  installMockFetch();
  const token = await adminToken();
  const response = await worker.fetch(new Request("https://gateway.example/api/v1/admin/write/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
      "X-DEKEKU-Project-Origin": PROJECT_ORIGIN
    },
    body: JSON.stringify({
      path: "public/data/created.json",
      content: { created: true }
    })
  }), { ...env, ADMIN_PASSWORD_HASH: ADMIN_HASH });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.path, "public/data/created.json");
  assert.equal(body.sha, "e".repeat(40));
});
