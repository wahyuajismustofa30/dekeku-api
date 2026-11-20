import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

describe("Public Submission Module (Guestbook)", () => {
  const env = {
    GITHUB_TOKEN: "mock-token", GITHUB_OWNER: "testowner",
    GITHUB_REPO: "dekeku-db", GITHUB_BRANCH: "main",
    ALLOWED_ORIGINS: "https://example.com,*.dekeku.my.id"
  };
  const request = (body, origin = "https://example.com") => new Request(
    "https://api.example.test/api/v1/public/submit",
    { method: "POST", headers: {
      "Content-Type": "application/json", ...(origin ? { Origin: origin } : {})
    }, body: JSON.stringify(body) }
  );
  const githubResponse = (status, body) => new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json" }
  });

  test("creates one hostname-scoped array file on first submission", async () => {
    let calls = 0;
    globalThis.fetch = async (url, options) => {
      calls += 1;
      if (options.method === "GET") return githubResponse(404, { message: "Not Found" });
      assert.match(String(url), /contents\/public\/data\/example\.com\/bukutamu\.json/);
      const payload = JSON.parse(options.body);
      assert.equal(payload.branch, "main");
      assert.equal(payload.sha, undefined);
      const entries = JSON.parse(atob(payload.content));
      assert.equal(entries.length, 1);
      assert.equal(entries[0].name, "John Doe");
      return githubResponse(201, { content: { sha: "a".repeat(40) } });
    };
    const response = await worker.fetch(request({
      name: "John Doe", message: "Hello DEKEKU", email: "john@example.com"
    }), env);
    const data = await response.json();
    assert.equal(response.status, 201);
    assert.equal(data.success, true);
    assert.equal(data.path, "public/data/example.com/bukutamu.json");
    assert.equal(data.count, 1);
    assert.equal(calls, 2);
  });

  test("appends existing entries using current blob SHA", async () => {
    let putBody;
    globalThis.fetch = async (url, options) => {
      if (options.method === "GET") return githubResponse(200, {
        content: btoa(JSON.stringify([{ name: "Existing", message: "Old" }])),
        sha: "b".repeat(40)
      });
      putBody = JSON.parse(options.body);
      return githubResponse(200, { content: { sha: "c".repeat(40) } });
    };
    const response = await worker.fetch(request(
      { name: "New", message: "New message" }, "https://sub.dekeku.my.id"
    ), env);
    const data = await response.json();
    const entries = JSON.parse(atob(putBody.content));
    assert.equal(response.status, 201);
    assert.equal(data.path, "public/data/sub.dekeku.my.id/bukutamu.json");
    assert.equal(data.count, 2);
    assert.equal(putBody.sha, "b".repeat(40));
    assert.equal(entries[0].name, "Existing");
    assert.equal(entries[1].name, "New");
  });

  test("re-reads latest data after SHA conflict", async () => {
    let reads = 0, writes = 0;
    globalThis.fetch = async (url, options) => {
      if (options.method === "GET") {
        reads += 1;
        const entries = reads === 1 ? [] : [{ name: "Concurrent", message: "Saved" }];
        return githubResponse(200, {
          content: btoa(JSON.stringify(entries)),
          sha: (reads === 1 ? "d" : "e").repeat(40)
        });
      }
      writes += 1;
      if (writes === 1) return githubResponse(409, { message: "Conflict" });
      const payload = JSON.parse(options.body);
      assert.equal(payload.sha, "e".repeat(40));
      assert.equal(JSON.parse(atob(payload.content)).length, 2);
      return githubResponse(200, { content: { sha: "f".repeat(40) } });
    };
    const response = await worker.fetch(request({ name: "Retry", message: "Safe retry" }), env);
    assert.equal(response.status, 201);
    assert.equal(reads, 2);
    assert.equal(writes, 2);
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

  test("rejects invalid payload and content type", async () => {
    const invalid = await worker.fetch(request({ name: "John" }), env);
    assert.equal(invalid.status, 422);
    const badType = new Request("https://api.example.test/api/v1/public/submit", {
      method: "POST", headers: {
        "Content-Type": "text/plain", Origin: "https://example.com"
      }, body: "test"
    });
    assert.equal((await worker.fetch(badType, env)).status, 415);
  });

  test("GET returns 405 Method Not Allowed", async () => {
    const response = await worker.fetch(new Request(
      "https://api.example.test/api/v1/public/submit"
    ), env);
    assert.equal(response.status, 405);
  });
});
