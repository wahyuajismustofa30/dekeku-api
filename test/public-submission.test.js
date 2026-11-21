import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

describe("Public Submission Module (RBAC Guestbook)", () => {
  const env = {
    GITHUB_TOKEN: "mock-token",
    GITHUB_OWNER: "testowner",
    GITHUB_REPO: "dekeku-db",
    GITHUB_BRANCH: "main",
    ALLOWED_ORIGINS: "https://example.com,*.dekeku.my.id"
  };

  const user = {
    id: "user_123456",
    username: "alice",
    passwordHash: "pbkdf2:100000:" + "a".repeat(32) + ":" + "b".repeat(64),
    role: "user",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  };
  const mapping = {
    id: "map_123456",
    userId: user.id,
    owner: "site-owner",
    repo: "site-repo",
    branch: "main",
    origin: "https://example.com",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  };

  const request = (body, origin = "https://example.com") => new Request(
    "https://api.example.test/api/v1/public/submit",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(origin ? { Origin: origin } : {})
      },
      body: JSON.stringify(body)
    }
  );
  const githubResponse = (status, body) => new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
  const fileResponse = (entries, sha) => ({
    type: "file",
    size: new TextEncoder().encode(JSON.stringify(entries)).byteLength,
    content: btoa(JSON.stringify(entries)),
    sha
  });

  const isCentral = url => String(url).includes("/repos/testowner/dekeku-db/");
  const isUsers = url => String(url).includes("/contents/private/auth/users.json");
  const isMappings = url => String(url).includes("/contents/private/repositories/mappings.json");
  const isTargetRepo = url => String(url).includes("/repos/site-owner/site-repo");
  const isTargetFile = url => String(url).includes("/contents/assets/data/bukutamu.json");

  const privateDatabaseFetch = (url, options) => {
    if (isUsers(url)) return githubResponse(200, {
      type: "file", size: 2, content: btoa(JSON.stringify({ version: 1, users: [user] })),
      sha: "1".repeat(40)
    });
    if (isMappings(url)) return githubResponse(200, {
      type: "file", size: 2,
      content: btoa(JSON.stringify({ version: 1, repositories: [mapping] })),
      sha: "2".repeat(40)
    });
    return null;
  };

  test("creates assets/data/bukutamu.json in the mapped website repository", async () => {
    const calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push({ url: String(url), method: options.method });
      const privateResponse = privateDatabaseFetch(url, options);
      if (privateResponse) return privateResponse;
      if (isTargetRepo(url) && options.method === "GET" && !String(url).includes("/contents/")) {
        return githubResponse(200, { full_name: "site-owner/site-repo", private: false });
      }
      if (isTargetFile(url) && options.method === "GET") {
        return githubResponse(404, { message: "Not Found" });
      }
      if (isTargetFile(url) && options.method === "PUT") {
        const payload = JSON.parse(options.body);
        assert.equal(payload.branch, "main");
        assert.equal(payload.sha, undefined);
        const entries = JSON.parse(atob(payload.content));
        assert.equal(entries.length, 1);
        assert.equal(entries[0].name, "John Doe");
        return githubResponse(201, { content: { sha: "a".repeat(40) } });
      }
      throw new Error("Unexpected GitHub request: " + options.method + " " + url);
    };

    const response = await worker.fetch(request({
      name: "John Doe", message: "Hello DEKEKU", email: "john@example.com"
    }), env);
    const data = await response.json();
    assert.equal(response.status, 201);
    assert.equal(data.success, true);
    assert.equal(data.path, "assets/data/bukutamu.json");
    assert.equal(data.count, 1);
    assert.ok(calls.some(call => call.url.includes("/repos/site-owner/site-repo/contents/assets/data/bukutamu.json")));
    assert.equal(calls.some(call => call.url.includes("/contents/public/data/")), false);
    assert.ok(calls.some(call => isCentral(call.url)));
  });

  test("appends existing entries using current SHA in mapped repository", async () => {
    let putBody;
    globalThis.fetch = async (url, options) => {
      const privateResponse = privateDatabaseFetch(url, options);
      if (privateResponse) return privateResponse;
      if (isTargetRepo(url) && options.method === "GET" && !String(url).includes("/contents/")) {
        return githubResponse(200, { full_name: "site-owner/site-repo", private: false });
      }
      if (isTargetFile(url) && options.method === "GET") {
        return githubResponse(200, fileResponse(
          [{ name: "Existing", message: "Old" }], "b".repeat(40)
        ));
      }
      if (isTargetFile(url) && options.method === "PUT") {
        putBody = JSON.parse(options.body);
        return githubResponse(200, { content: { sha: "c".repeat(40) } });
      }
      throw new Error("Unexpected GitHub request: " + options.method + " " + url);
    };

    const response = await worker.fetch(request(
      { name: "New", message: "New message" }
    ), env);
    const data = await response.json();
    const entries = JSON.parse(atob(putBody.content));
    assert.equal(response.status, 201);
    assert.equal(data.path, "assets/data/bukutamu.json");
    assert.equal(data.count, 2);
    assert.equal(putBody.sha, "b".repeat(40));
    assert.equal(entries[0].name, "Existing");
    assert.equal(entries[1].name, "New");
  });

  test("re-reads latest file after SHA conflict and retries at most three times", async () => {
    let reads = 0;
    let writes = 0;
    globalThis.fetch = async (url, options) => {
      const privateResponse = privateDatabaseFetch(url, options);
      if (privateResponse) return privateResponse;
      if (isTargetRepo(url) && options.method === "GET" && !String(url).includes("/contents/")) {
        return githubResponse(200, { full_name: "site-owner/site-repo", private: false });
      }
      if (isTargetFile(url) && options.method === "GET") {
        reads += 1;
        if (reads === 1) return githubResponse(404, { message: "Not Found" });
        return githubResponse(200, fileResponse(
          [{ name: "Concurrent", message: "Saved" }], "e".repeat(40)
        ));
      }
      if (isTargetFile(url) && options.method === "PUT") {
        writes += 1;
        if (writes === 1) return githubResponse(409, { message: "Conflict" });
        const payload = JSON.parse(options.body);
        assert.equal(payload.sha, "e".repeat(40));
        assert.equal(JSON.parse(atob(payload.content)).length, 2);
        return githubResponse(200, { content: { sha: "f".repeat(40) } });
      }
      throw new Error("Unexpected GitHub request: " + options.method + " " + url);
    };

    const response = await worker.fetch(request({ name: "Retry", message: "Safe retry" }), env);
    assert.equal(response.status, 201);
    assert.equal(reads, 2);
    assert.equal(writes, 2);
  });

  test("rejects unregistered Origin without accessing a website repository", async () => {
    let targetCalls = 0;
    globalThis.fetch = async (url, options) => {
      if (isUsers(url)) return githubResponse(200, {
        type: "file", size: 2, content: btoa(JSON.stringify({ version: 1, users: [user] })),
        sha: "1".repeat(40)
      });
      if (isMappings(url)) return githubResponse(200, {
        type: "file", size: 2, content: btoa(JSON.stringify({ version: 1, repositories: [] })),
        sha: "2".repeat(40)
      });
      if (isTargetRepo(url)) targetCalls += 1;
      throw new Error("Unexpected GitHub request");
    };

    const response = await worker.fetch(request(
      { name: "A", message: "B" }, "https://example.com"
    ), env);
    assert.equal(response.status, 403);
    assert.equal(targetCalls, 0);
  });

  test("rejects missing or unapproved Origin before GitHub access", async () => {
    let called = false;
    globalThis.fetch = async () => { called = true; throw new Error("unexpected GitHub request"); };
    const missing = await worker.fetch(request({ name: "A", message: "B" }, null), env);
    const denied = await worker.fetch(request({ name: "A", message: "B" }, "https://evil.example"), env);
    assert.equal(missing.status, 403);
    assert.equal(denied.status, 403);
    assert.equal(called, false);
  });

  test("rejects invalid payload, unsupported fields, and content type", async () => {
    const invalid = await worker.fetch(request({ name: "John" }), env);
    assert.equal(invalid.status, 422);
    const extra = await worker.fetch(request({ name: "John", message: "Hi", repository: "attacker/repo" }), env);
    assert.equal(extra.status, 422);
    const badType = new Request("https://api.example.test/api/v1/public/submit", {
      method: "POST",
      headers: { "Content-Type": "text/plain", Origin: "https://example.com" },
      body: "test"
    });
    assert.equal((await worker.fetch(badType, env)).status, 415);
  });


  test("rejects a private mapped repository because Guestbook reads are static/public", async () => {
    let fileCalls = 0;
    globalThis.fetch = async (url, options) => {
      const privateResponse = privateDatabaseFetch(url, options);
      if (privateResponse) return privateResponse;
      if (isTargetRepo(url) && options.method === "GET" && !String(url).includes("/contents/")) {
        return githubResponse(200, { full_name: "site-owner/site-repo", private: true });
      }
      if (isTargetFile(url)) fileCalls += 1;
      throw new Error("Unexpected GitHub request");
    };
    const response = await worker.fetch(request({ name: "A", message: "B" }), env);
    assert.equal(response.status, 403);
    assert.equal(fileCalls, 0);
  });

  test("does not create a file when the mapped repository is missing or inaccessible", async () => {
    let writes = 0;
    globalThis.fetch = async (url, options) => {
      const privateResponse = privateDatabaseFetch(url, options);
      if (privateResponse) return privateResponse;
      if (isTargetRepo(url) && options.method === "GET" && !String(url).includes("/contents/")) {
        return githubResponse(404, { message: "Not Found" });
      }
      if (options.method === "PUT") writes += 1;
      throw new Error("Unexpected GitHub request");
    };
    const response = await worker.fetch(request({ name: "A", message: "B" }), env);
    assert.equal(response.status, 404);
    assert.equal(writes, 0);
  });

  test("GET returns 405 Method Not Allowed", async () => {
    const response = await worker.fetch(new Request(
      "https://api.example.test/api/v1/public/submit"
    ), env);
    assert.equal(response.status, 405);
  });
});
