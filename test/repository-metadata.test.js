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

const validConfig = {
  schema_version: 1,
  project: { id: "demo" },
  repository: { username: "wahyuajismustofa30", repo: "demo" }
};

const configResponse = (status = 200, body = validConfig) => new Response(
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

  test("accepts any HTTPS subdomain covered by the configured wildcard", async () => {
    const calls = [];
    globalThis.fetch = async (url) => {
      calls.push(String(url));
      return String(url) === "https://shop.dekeku.my.id/config.json"
        ? configResponse()
        : githubResponse();
    };

    const response = await worker.fetch(request("https://shop.dekeku.my.id"), env);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.name, "wahyuajismustofa30/demo");
    assert.deepEqual(calls, [
      "https://shop.dekeku.my.id/config.json",
      "https://api.github.com/repos/wahyuajismustofa30/demo"
    ]);
  });

  test("accepts nested HTTPS subdomains covered by the configured wildcard", async () => {
    globalThis.fetch = async (url) => String(url).endsWith("/config.json")
      ? configResponse()
      : githubResponse();

    const response = await worker.fetch(request("https://store.eu.dekeku.my.id"), env);
    assert.equal(response.status, 200);
  });

  test("rejects lookalike domains outside the wildcard DNS boundary", async () => {
    globalThis.fetch = async () => {
      assert.fail("untrusted lookalike domain must not trigger outbound requests");
    };

    const response = await worker.fetch(request("https://notdekeku.my.id"), env);
    assert.equal(response.status, 403);
  });

  test("wildcard does not authorize the apex domain by itself", async () => {
    globalThis.fetch = async () => {
      assert.fail("wildcard must not authorize the apex domain");
    };

    const response = await worker.fetch(request("https://dekeku.my.id"), {
      ...env,
      ALLOWED_ORIGINS: "*.dekeku.my.id"
    });
    assert.equal(response.status, 403);
  });

  test("wildcard subdomain trust still requires canonical HTTPS Origin", async () => {
    globalThis.fetch = async () => {
      assert.fail("invalid Origin must not trigger outbound requests");
    };

    for (const origin of [
      "http://shop.dekeku.my.id",
      "https://shop.dekeku.my.id:8443",
      "https://shop.dekeku.my.id/path",
      "https://shop.dekeku.my.id.evil.example"
    ]) {
      const response = await worker.fetch(request(origin), env);
      assert.equal(response.status, 403, origin);
    }
  });

  test("rejects unsupported schema versions and missing required fields", async () => {
    const invalidConfigs = [
      { ...validConfig, schema_version: 2 },
      { project: validConfig.project, repository: validConfig.repository },
      { ...validConfig, project: { id: "Invalid Project" } },
      { ...validConfig, project: { id: "demo\n" } },
      { ...validConfig, repository: { ...validConfig.repository, username: "wahyuajismustofa30\n" } },
      { ...validConfig, repository: { ...validConfig.repository, repo: "demo\n" } },
      { ...validConfig, repository: { ...validConfig.repository, repo: "." } },
      { ...validConfig, repository: { ...validConfig.repository, repo: ".." } },
      { ...validConfig, extra: true },
      { ...validConfig, repository: { ...validConfig.repository, extra: true } }
    ];

    for (const invalidConfig of invalidConfigs) {
      let calls = 0;
      globalThis.fetch = async () => {
        calls += 1;
        return configResponse(200, invalidConfig);
      };

      const response = await worker.fetch(request(), env);
      assert.equal(response.status, 422);
      assert.equal(calls, 1, "invalid config must be rejected before GitHub API access");
    }
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
      ...validConfig,
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
        ...validConfig,
        repository: { username: "wahyuajismustofa30", repo: "../private" }
      });
    };

    const response = await worker.fetch(request(), env);
    assert.equal(response.status, 422);
    assert.equal(calls, 1);
  });

  test("rejects GitHub metadata that does not match the requested repository", async () => {
    globalThis.fetch = async (url) => String(url).endsWith("/config.json")
      ? configResponse()
      : githubResponse(200, {
          full_name: "wahyuajismustofa30/other",
          description: "Unexpected repository",
          html_url: "https://github.com/wahyuajismustofa30/other",
          default_branch: "main",
          visibility: "public"
        });

    const response = await worker.fetch(request(), env);
    assert.equal(response.status, 502);
  });

  test("rejects GitHub metadata without a valid default branch", async () => {
    globalThis.fetch = async (url) => String(url).endsWith("/config.json")
      ? configResponse()
      : githubResponse(200, {
          full_name: "wahyuajismustofa30/demo",
          description: "Demo repository",
          html_url: "https://github.com/wahyuajismustofa30/demo",
          default_branch: "",
          visibility: "public"
        });

    const response = await worker.fetch(request(), env);
    assert.equal(response.status, 502);
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
