import { test, describe } from "node:test";
import assert from "node:assert";
import worker from "../src/index.js";

describe("Public Submission Module (Guestbook - Phase 2.3)", () => {
  const env = {
    GITHUB_TOKEN: "ghp_testtoken123",
    GITHUB_OWNER: "testowner",
    GITHUB_REPO: "testrepo",
    GITHUB_BRANCH: "main",
    ALLOWED_ORIGINS: "https://example.com"
  };

  test("POST /api/v1/public/submit with valid payload succeeds", async () => {
    // Mock global fetch for GitHub API
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
      assert.strictEqual(options.method, "PUT");
      assert.ok(url.includes("/contents/public/data/guestbook/sub_"));
      const body = JSON.parse(options.body);
      assert.strictEqual(body.branch, "main");
      assert.ok(body.message.includes("Public guestbook submission"));

      return new Response(JSON.stringify({
        content: {
          name: "sub_123.json",
          path: "public/data/guestbook/sub_123.json",
          sha: "abc123sha"
        }
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    };

    try {
      const req = new Request("http://api/api/v1/public/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Origin": "https://example.com"
        },
        body: JSON.stringify({
          name: "John Doe",
          message: "Hello DEKEKU Gateway!",
          email: "john@example.com"
        })
      });

      const res = await worker.fetch(req, env);
      const data = await res.json();

      assert.strictEqual(res.status, 201);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.message, "Submission successful");
      assert.ok(data.file.startsWith("sub_"));
      assert.strictEqual(data.sha, "abc123sha");
    } finally {
      global.fetch = originalFetch;
    }
  });

  test("POST /api/v1/public/submit rejects missing name or message", async () => {
    const req = new Request("http://api/api/v1/public/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "John" }) // missing message
    });

    const res = await worker.fetch(req, env);
    const data = await res.json();

    assert.strictEqual(res.status, 422);
    assert.strictEqual(data.success, false);
    assert.ok(data.error.includes("message"));
  });

  test("POST /api/v1/public/submit rejects invalid content-type", async () => {
    const req = new Request("http://api/api/v1/public/submit", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "test"
    });

    const res = await worker.fetch(req, env);
    assert.strictEqual(res.status, 415);
  });

  test("GET /api/v1/public/submit returns 405 Method Not Allowed", async () => {
    const req = new Request("http://api/api/v1/public/submit", {
      method: "GET"
    });

    const res = await worker.fetch(req, env);
    assert.strictEqual(res.status, 405);
  });
});
