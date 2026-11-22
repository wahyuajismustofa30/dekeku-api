import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

describe("Public Data API and Guestbook legacy alias", () => {
  const env = {
    GITHUB_TOKEN: "mock-token",
    GITHUB_OWNER: "testowner",
    GITHUB_REPO: "worker-config",
    GITHUB_BRANCH: "main",
    ALLOWED_ORIGINS: "https://example.com"
  };

  const config = {
    schema_version: 1,
    project: { id: "example-project" },
    repository: { username: "testowner", repo: "site-repo" }
  };
  const sha = "a".repeat(40);
  const request = (path, body, origin = "https://example.com", method = "POST") =>
    new Request("https://api.example.test" + path, {
      method,
      headers: {
        ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
        ...(origin ? { Origin: origin } : {})
      },
      ...(method === "POST" ? { body: JSON.stringify(body) } : {})
    });
  const githubResponse = (status, body) => new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
  const fileResponse = (entries, fileSha) => {
    const source = JSON.stringify(entries, null, 2);
    return {
      type: "file",
      size: new TextEncoder().encode(source).byteLength,
      content: btoa(source),
      sha: fileSha
    };
  };

  const installFetch = ({ existingEntries = null, privateRepo = false } = {}) => {
    const calls = [];
    globalThis.fetch = async (url, options = {}) => {
      const target = String(url);
      calls.push({ url: target, method: options.method });
      if (target === "https://example.com/config.json") {
        return new Response(JSON.stringify(config), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      if (target === "https://api.github.com/repos/testowner/site-repo") {
        return githubResponse(200, {
          full_name: "testowner/site-repo",
          visibility: privateRepo ? "private" : "public",
          default_branch: "main"
        });
      }
      if (target.includes("/contents/assets/data/bukutamu.json")) {
        if (options.method === "GET") {
          if (existingEntries === null) return githubResponse(404, { message: "Not Found" });
          return githubResponse(200, fileResponse(existingEntries, sha));
        }
        if (options.method === "PUT") {
          const payload = JSON.parse(options.body);
          assert.equal(payload.branch, "main");
          const entries = JSON.parse(atob(payload.content));
          if (existingEntries !== null) assert.equal(payload.sha, sha);
          else assert.equal(payload.sha, undefined);
          assert.ok(entries.length >= 1);
          return githubResponse(201, { content: { sha: "b".repeat(40) } });
        }
      }
      throw new Error("Unexpected request: " + options.method + " " + target);
    };
    return calls;
  };

  test("POST /public/data/guestbook writes using Project Origin config and no JWT", async () => {
    const calls = installFetch();
    const response = await worker.fetch(request(
      "/api/v1/public/data/guestbook",
      { name: "John Doe", message: "Hello DEKEKU" }
    ), env);
    const data = await response.json();
    assert.equal(response.status, 201);
    assert.equal(data.success, true);
    assert.equal(data.resource, "guestbook");
    assert.equal(data.path, "assets/data/bukutamu.json");
    assert.equal(data.count, 1);
    assert.ok(calls.some((call) => call.url === "https://example.com/config.json"));
    assert.ok(calls.some((call) => call.url.includes("/repos/testowner/site-repo/contents/assets/data/bukutamu.json")));
    assert.equal(calls.some((call) => call.url.includes("/repos/testowner/worker-config/contents/private/")), false);
  });

  test("legacy /public/submit is an alias to the same Guestbook engine", async () => {
    installFetch();
    const response = await worker.fetch(request(
      "/api/v1/public/submit",
      { name: "Legacy", message: "Still supported" }
    ), env);
    const data = await response.json();
    assert.equal(response.status, 201);
    assert.equal(data.resource, "guestbook");
    assert.equal(data.path, "assets/data/bukutamu.json");
  });

  test("appends to the existing array with its current SHA", async () => {
    const calls = installFetch({ existingEntries: [{ name: "Existing", message: "Old" }] });
    const response = await worker.fetch(request(
      "/api/v1/public/data/guestbook",
      { name: "New", message: "New message" }
    ), env);
    assert.equal(response.status, 201);
    assert.ok(calls.some((call) => call.method === "PUT"));
  });

  test("rejects unknown resources without contacting config or GitHub", async () => {
    let calls = 0;
    globalThis.fetch = async () => { calls += 1; throw new Error("unexpected fetch"); };
    const response = await worker.fetch(request(
      "/api/v1/public/data/not-registered",
      { name: "A", message: "B" }
    ), env);
    assert.equal(response.status, 404);
    assert.equal(calls, 0);
  });

  test("rejects missing or untrusted Origin before config fetch", async () => {
    let calls = 0;
    globalThis.fetch = async () => { calls += 1; throw new Error("unexpected fetch"); };
    const missing = await worker.fetch(request(
      "/api/v1/public/data/guestbook", { name: "A", message: "B" }, null
    ), env);
    const denied = await worker.fetch(request(
      "/api/v1/public/data/guestbook", { name: "A", message: "B" }, "https://evil.example"
    ), env);
    assert.equal(missing.status, 403);
    assert.equal(denied.status, 403);
    assert.equal(calls, 0);
  });

  test("rejects malformed payload and unsupported client-controlled fields", async () => {
    const invalid = await worker.fetch(request(
      "/api/v1/public/data/guestbook", { name: "Only name" }
    ), env);
    assert.equal(invalid.status, 422);
    const extra = await worker.fetch(request(
      "/api/v1/public/data/guestbook",
      { name: "A", message: "B", repository: "attacker/repo" }
    ), env);
    assert.equal(extra.status, 422);
  });

  test("rejects private project repositories before storage access", async () => {
    const calls = installFetch({ privateRepo: true });
    const response = await worker.fetch(request(
      "/api/v1/public/data/guestbook", { name: "A", message: "B" }
    ), env);
    assert.equal(response.status, 403);
    assert.equal(calls.some((call) => call.url.includes("/contents/assets/data/bukutamu.json")), false);
  });

  test("requires POST on both routes", async () => {
    const generic = await worker.fetch(request(
      "/api/v1/public/data/guestbook", null, "https://example.com", "GET"
    ), env);
    const legacy = await worker.fetch(request(
      "/api/v1/public/submit", null, "https://example.com", "GET"
    ), env);
    assert.equal(generic.status, 405);
    assert.equal(legacy.status, 405);
  });

  test("rejects request bodies above the resource byte limit", async () => {
    let calls = 0;
    globalThis.fetch = async () => { calls += 1; throw new Error("unexpected fetch"); };
    const oversized = new Request("https://api.example.test/api/v1/public/data/guestbook", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://example.com" },
      body: " ".repeat(15361)
    });
    const response = await worker.fetch(oversized, env);
    assert.equal(response.status, 413);
    assert.equal(calls, 0);
  });

  test("fails closed when project config does not match schema v1", async () => {
    let githubCalls = 0;
    globalThis.fetch = async (url) => {
      if (String(url) === "https://example.com/config.json") {
        return new Response(JSON.stringify({ ...config, schema_version: 2 }), {
          status: 200, headers: { "Content-Type": "application/json" }
        });
      }
      githubCalls += 1;
      throw new Error("unexpected GitHub call");
    };
    const response = await worker.fetch(request(
      "/api/v1/public/data/guestbook", { name: "A", message: "B" }
    ), env);
    assert.equal(response.status, 422);
    assert.equal(githubCalls, 0);
  });

  test("re-reads the document after a SHA conflict and retries safely", async () => {
    let reads = 0;
    let writes = 0;
    globalThis.fetch = async (url, options = {}) => {
      const target = String(url);
      if (target === "https://example.com/config.json") {
        return new Response(JSON.stringify(config), {
          status: 200, headers: { "Content-Type": "application/json" }
        });
      }
      if (target === "https://api.github.com/repos/testowner/site-repo") {
        return githubResponse(200, {
          full_name: "testowner/site-repo", visibility: "public", default_branch: "main"
        });
      }
      if (target.includes("/contents/assets/data/bukutamu.json")) {
        if (options.method === "GET") {
          reads += 1;
          const entries = reads === 1
            ? [{ name: "Before conflict", message: "Old" }]
            : [{ name: "Concurrent", message: "Saved" }];
          return githubResponse(200, fileResponse(entries, reads === 1 ? "c".repeat(40) : "d".repeat(40)));
        }
        if (options.method === "PUT") {
          writes += 1;
          if (writes === 1) return githubResponse(409, { message: "Conflict" });
          const payload = JSON.parse(options.body);
          assert.equal(payload.sha, "d".repeat(40));
          assert.equal(JSON.parse(atob(payload.content))[0].name, "Concurrent");
          return githubResponse(200, { content: { sha: "e".repeat(40) } });
        }
      }
      throw new Error("Unexpected request: " + options.method + " " + target);
    };
    const response = await worker.fetch(request(
      "/api/v1/public/data/guestbook", { name: "Retry", message: "Safe retry" }
    ), env);
    assert.equal(response.status, 201);
    assert.equal(reads, 2);
    assert.equal(writes, 2);
  });

  test("rejects malformed stored JSON array before writing", async () => {
    let writes = 0;
    globalThis.fetch = async (url, options = {}) => {
      const target = String(url);
      if (target === "https://example.com/config.json") {
        return new Response(JSON.stringify(config), {
          status: 200, headers: { "Content-Type": "application/json" }
        });
      }
      if (target === "https://api.github.com/repos/testowner/site-repo") {
        return githubResponse(200, {
          full_name: "testowner/site-repo", visibility: "public", default_branch: "main"
        });
      }
      if (target.includes("/contents/assets/data/bukutamu.json")) {
        if (options.method === "GET") {
          return githubResponse(200, fileResponse({ not: "an array" }, "f".repeat(40)));
        }
        writes += 1;
      }
      throw new Error("Unexpected request: " + options.method + " " + target);
    };
    const response = await worker.fetch(request(
      "/api/v1/public/data/guestbook", { name: "A", message: "B" }
    ), env);
    assert.equal(response.status, 502);
    assert.equal(writes, 0);
  });

  test("does not match path traversal or nested resource names", async () => {
    let calls = 0;
    globalThis.fetch = async () => { calls += 1; throw new Error("unexpected fetch"); };
    const traversal = await worker.fetch(request(
      "/api/v1/public/data/../guestbook", { name: "A", message: "B" }
    ), env);
    const nested = await worker.fetch(request(
      "/api/v1/public/data/guestbook/extra", { name: "A", message: "B" }
    ), env);
    assert.equal(traversal.status, 404);
    assert.equal(nested.status, 404);
    assert.equal(calls, 0);
  });

  test("public route ignores the File Manager project-origin override header", async () => {
    let calls = 0;
    globalThis.fetch = async () => { calls += 1; throw new Error("unexpected fetch"); };
    const spoofed = new Request("https://api.example.test/api/v1/public/data/guestbook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://evil.example",
        "X-DEKEKU-Project-Origin": "https://example.com"
      },
      body: JSON.stringify({ name: "A", message: "B" })
    });
    const response = await worker.fetch(spoofed, env);
    assert.equal(response.status, 403);
    assert.equal(calls, 0);
  });
});
