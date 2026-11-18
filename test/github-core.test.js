import { test, describe } from "node:test";
import assert from "node:assert";
import worker from "../src/index.js";

const env = {
  GITHUB_TOKEN: "mock-token",
  GITHUB_OWNER: "mock-owner",
  GITHUB_REPO: "mock-repo",
  GITHUB_BRANCH: "main"
};

const mockFetch = (status, body, headers = {}) => {
  return async () => {
    return new Response(JSON.stringify(body), {
      status,
      headers: new Headers({
        "Content-Type": "application/json",
        "x-ratelimit-limit": "5000",
        "x-ratelimit-remaining": "4999",
        ...headers
      })
    });
  };
};

describe("GitHub Core - Full Stack Validation", () => {

  test("GET /api/v1/health - Success with Security Headers", async () => {
    const req = new Request("http://api/api/v1/health");
    const res = await worker.fetch(req, env);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(res.headers.get("X-Content-Type-Options"), "nosniff");
  });

  test("Path Validation - Blocking Malicious Paths", async () => {
    const malicious = ["../secret.json", "folder/%2e%2e/secret.json", "%252e%252e/secret.json", "null\0byte.json"];

    for (const path of malicious) {
      const req = new Request(`http://api/api/v1/github/file?path=${path}`);
      const res = await worker.fetch(req, env);
      const data = await res.json();

      assert.strictEqual(res.status, 400, `Path ${path} should be 400`);
      assert.strictEqual(data.success, false);
      assert.strictEqual(res.headers.get("X-Content-Type-Options"), "nosniff");
    }
  });

  test("Path Validation - Allowing Special but Safe Names", async () => {
    global.fetch = mockFetch(200, { type: "file", content: btoa("{\"status\":\"ok\"}"), path: "folder.../file.json", sha: "abc" });

    const req = new Request("http://api/api/v1/github/file?path=folder.../file.json");
    const res = await worker.fetch(req, env);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
  });

  test("JSON Parsing - 502 for Invalid Upstream JSON", async () => {
    global.fetch = mockFetch(200, {
      type: "file",
      size: 100,
      content: btoa("{ invalid"),
      path: "data.json",
      sha: "sha123"
    });

    const req = new Request("http://api/api/v1/github/file?path=data.json");
    const res = await worker.fetch(req, env);
    const data = await res.json();

    assert.strictEqual(res.status, 502);
    assert.strictEqual(data.error, "Invalid JSON content from upstream");
  });

  test("OPTIONS - Preflight Security Headers", async () => {
    const req = new Request("http://api/api/v1/health", { method: "OPTIONS" });
    const res = await worker.fetch(req, env);

    assert.strictEqual(res.status, 204);
    assert.strictEqual(res.headers.get("X-Content-Type-Options"), "nosniff");
  });
});
