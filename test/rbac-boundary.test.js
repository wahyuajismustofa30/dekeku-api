import { afterEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";
import { GitHubClient } from "../src/core/github.js";
import { validatePrivateStoragePath } from "../src/modules/rbac/storage.js";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

const env = {
  GITHUB_TOKEN: "boundary-test-token",
  GITHUB_OWNER: "test-owner",
  GITHUB_REPO: "test-repo",
  GITHUB_BRANCH: "main",
  JWT_SECRET: "boundary-test-jwt-secret",
  ALLOWED_ORIGINS: "https://example.test"
};

describe("RBAC-06 private/public data boundary", () => {
  test("private storage allowlist contains only the two fixed private documents", () => {
    assert.equal(validatePrivateStoragePath("private/auth/users.json"), true);
    assert.equal(validatePrivateStoragePath("private/repositories/mappings.json"), true);
    for (const path of [
      "private/",
      "private/auth/other.json",
      "private/auth/users.json/extra",
      "assets/data/users.json",
      "public/data/users.json",
      "../private/auth/users.json"
    ]) {
      assert.equal(validatePrivateStoragePath(path), false, path);
    }
  });

  test("public GitHub file endpoint rejects private and User data paths before upstream access", async () => {
    let upstreamCalls = 0;
    globalThis.fetch = async () => {
      upstreamCalls += 1;
      return new Response(JSON.stringify({ type: "file", content: btoa("{}"), sha: "a".repeat(40), size: 2 }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    };

    const denied = [
      { path: "private/auth/users.json", status: 403 },
      { path: "private/repositories/mappings.json", status: 403 },
      { path: "assets/data/bukutamu.json", status: 403 },
      { path: "assets/data/statistik.json", status: 403 },
      { path: "public/../private/auth/users.json", status: 400 },
      { path: "public/%252e%252e/private/auth/users.json", status: 400 },
      { path: "public/.internal/file.json", status: 403 }
    ];

    for (const item of denied) {
      const url = new URL("https://api.example.test/api/v1/github/file");
      url.searchParams.set("path", item.path);
      const response = await worker.fetch(new Request(url), env);
      assert.equal(response.status, item.status, item.path);
    }
    assert.equal(upstreamCalls, 0, "rejected paths must not reach GitHub");
  });

  test("GitHubClient rejects non-public paths before making a request", async () => {
    let upstreamCalls = 0;
    globalThis.fetch = async () => {
      upstreamCalls += 1;
      return new Response("{}", { status: 200 });
    };
    const client = new GitHubClient(env);

    for (const path of [
      "private/auth/users.json",
      "private/repositories/mappings.json",
      "assets/data/bukutamu.json",
      "assets%2Fdata%2Fbukutamu.json"
    ]) {
      await assert.rejects(client.getFile(path), error => error.status === 403);
    }
    assert.equal(upstreamCalls, 0);
  });

  test("Admin and User routes remain authenticated while Guest submit remains public", async () => {
    const admin = await worker.fetch(new Request("https://api.example.test/api/v1/admin/users"), env);
    assert.equal(admin.status, 401);

    const user = await worker.fetch(new Request("https://api.example.test/api/v1/user/repositories"), env);
    assert.equal(user.status, 401);

    const guest = await worker.fetch(new Request("https://api.example.test/api/v1/public/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Guest", message: "Hello" })
    }), env);
    assert.equal(guest.status, 403, "Guest route is public but still requires an allowlisted Origin");
  });
});
