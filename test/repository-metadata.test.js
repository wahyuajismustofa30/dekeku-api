import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

const env = {
  GITHUB_TOKEN: "test-token",
  GITHUB_OWNER: "wahyuajismustofa30",
  GITHUB_REPO: "dekeku-db",
  GITHUB_BRANCH: "main",
  ALLOWED_ORIGINS: "https://demo.dekeku.my.id,*.dekeku.my.id"
};

const configResponse = (status = 200, body = {
  repository: { username: "wahyuajismustofa30", repo: "demo" }
}) => new Response(
  body === null ? "" : JSON.stringify(body),
  { status, headers: { "Content-Type": "application/json" } }
);

const githubResponse = (status = 200, body = {
  full_name: "wahyuajismustofa30/demo",
  description: "Demo repository",
  html_url: "https://github.com/wahyuajismustofa30/demo",
  default_branch: "main",
  visibility: "public"
}) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Content-Type": "application/json",
    "x-ratelimit-limit": "5000",
    "x-ratelimit-remaining": "4999",
    "x-ratelimit-reset": "123456789"
  }
});

const request = (origin = "https://demo.dekeku.my.id") =>
  new Request("https://api.example.test/api/v1/github/repository", {
    headers: origin ? { Origin: origin } : {}
  });

describe("Caller repository metadata", () => {
  test("loads config.json from the validated Origin and queries that GitHub repository", async () => {
    const calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push({ url: String(url), options });
      if (String(url) === "https://demo.dekeku.my.id/config.json") {
        return configResponse();
      }
      if (String(url) === "https://api.github.com/repos/wahyuajismustofa30/demo") {
        return githubResponse();
      }
      throw new Error("Unexpected outbound URL");
    };

    const response = await worker.fetch(request(), env);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.name, "wahyuajismustofa30/demo");
    assert.equal(calls.length, 2);
    assert.equal(calls[0].options.redirect, "manual");
    assert.equal(calls[0].options.credentials, "omit");
  });

  test("rejects missing Origin before making outbound requests", async () => {
    globalThis.fetch = async () => {
      assert.fail("fetch must not be called");
    };

    const response = await worker.fetch(request(null), env);
    assert.equal(response.status, 403);
  });

  test("rejects an Origin outside the configured allowlist", async () => {
    globalThis.fetch = async () => {
      assert.fail("fetch must not be called");
    };

    const response = await worker.fetch(request("https://attacker.example"), env);
    assert.equal(response.status, 403);
  });

  test("returns 404 when caller config.json does not exist", async () => {
    globalThis.fetch = async () => configResponse(404, null);
    const response = await worker.fetch(request(), env);
    assert.equal(response.status, 404);
  });

  test("rejects malformed config JSON", async () => {
    globalThis.fetch = async () => new Response("{invalid", { status: 200 });
    const response = await worker.fetch(request(), env);
    assert.equal(response.status, 422);
  });

  test("rejects repository owner different from the Worker owner", async () => {
    globalThis.fetch = async () => configResponse(200, {
      repository: { username: "attacker", repo: "demo" }
    });

    const response = await worker.fetch(request(), env);
    assert.equal(response.status, 422);
  });

  test("rejects invalid repository names before GitHub API access", async () => {
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return configResponse(200, {
        repository: { username: "wahyuajismustofa30", repo: "../private" }
      });
    };

    const response = await worker.fetch(request(), env);
    assert.equal(response.status, 422);
    assert.equal(calls, 1);
  });

  test("does not expose metadata for a private repository", async () => {
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return calls === 1
        ? configResponse()
        : githubResponse(200, {
            full_name: "wahyuajismustofa30/demo",
            description: "Demo repository",
            html_url: "https://github.com/wahyuajismustofa30/demo",
            default_branch: "main",
            visibility: "private"
          });
    };

    const response = await worker.fetch(request(), env);
    assert.equal(response.status, 403);
  });
});
