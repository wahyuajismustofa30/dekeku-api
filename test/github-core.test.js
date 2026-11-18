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

describe("DEKEKU API Gateway - Public Access Policy", () => {

  test("Positive: Allow public/ files with safe extensions", async () => {
    const files = ["public/config.json", "public/data/site.md", "public/assets/style.css"];
    for (const path of files) {
      global.fetch = mockFetch(200, { type: "file", content: btoa('{"ok":true}'), path, sha: "abc", size: 10 });
      const req = new Request(`http://api/api/v1/github/file?path=${path}`);
      const res = await worker.fetch(req, env);
      const data = await res.json();
      assert.strictEqual(res.status, 200, `Should allow ${path}`);
      assert.strictEqual(data.success, true);
    }
  });

  test("Negative: Deny access outside public/ directory", async () => {
    const denied = ["README.md", "package.json", "src/index.js", "docs/architecture.md"];
    for (const path of denied) {
      const req = new Request(`http://api/api/v1/github/file?path=${path}`);
      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 403, `Should deny ${path} with 403`);
    }
  });

  test("Negative: Deny sensitive files inside public/ (including README case-insensitive)", async () => {
    const sensitive = ["public/.env", "public/.dev.vars", "public/secrets.json", "public/README.md", "public/readme.md", "public/ReadMe.Md"];
    for (const path of sensitive) {
      const req = new Request(`http://api/api/v1/github/file?path=${path}`);
      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 403, `Should deny ${path} with 403`);
    }
  });

  test("Negative: Block empty path segments (//)", async () => {
    const malformed = ["public//config.json", "public///config.json", "public/data//config.json", "public/"];
    for (const path of malformed) {
      const req = new Request(`http://api/api/v1/github/file?path=${path}`);
      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 400, `Should block malformed path ${path} with 400`);
    }
  });

  test("Negative: Deny binary files and unsafe extensions", async () => {
    const unsafe = ["public/image.png", "public/archive.zip", "public/script.py", "public/data.xml"];
    for (const path of unsafe) {
      const req = new Request(`http://api/api/v1/github/file?path=${path}`);
      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 403, `Should deny ${path} with 403`);
    }
  });

  test("Path Traversal Protection", async () => {
    const traversal = ["public/../README.md", "public/%2e%2e/README.md", "public/%252e%252e/README.md"];
    for (const path of traversal) {
      const req = new Request(`http://api/api/v1/github/file?path=${path}`);
      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 400, `Should block traversal ${path} with 400`);
    }
  });

  test("Regression: Metadata endpoints remain accessible", async () => {
    global.fetch = mockFetch(200, { full_name: "repo", name: "main", commit: { sha: "abc" } });

    const repoRes = await worker.fetch(new Request("http://api/api/v1/github/repository"), env);
    assert.strictEqual(repoRes.status, 200);

    const branchRes = await worker.fetch(new Request("http://api/api/v1/github/branch"), env);
    assert.strictEqual(branchRes.status, 200);
  });

  test("X-Content-Type-Options present in all responses", async () => {
    const paths = ["/api/v1/health", "/api/v1/github/file?path=public/config.json", "/api/v1/github/file?path=README.md"];
    for (const path of paths) {
      const res = await worker.fetch(new Request(`http://api${path}`), env);
      assert.strictEqual(res.headers.get("X-Content-Type-Options"), "nosniff");
    }
  });
});
