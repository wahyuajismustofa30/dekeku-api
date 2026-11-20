import test, { afterEach } from "node:test";
import assert from "node:assert";
import worker from "../src/index.js";

const originalGlobalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalGlobalFetch;
});

const BASE_URL = "https://dekeku-api-dev.wahyuajismustofa30.workers.dev";

const mockEnv = {
  GITHUB_TOKEN: "mock-token",
  GITHUB_OWNER: "wahyuajismustofa30",
  GITHUB_REPO: "dekeku-api",
  GITHUB_BRANCH: "main",
  ALLOWED_ORIGINS: "https://dekeku.my.id,*.dekeku.my.id"
};

test("DEKEKU API Gateway - Live Remote & Simulation Test Suite", async (t) => {
  
  // --- PART 1: LIVE REMOTE TESTS ---
  await t.test("Live: GET /api/v1/health returns online status", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/health`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.status, "online");
  });

  await t.test("Live: GET /api/v1/github/repository returns repository metadata", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/github/repository`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(typeof data.name, "string");
  });

  await t.test("Live: POST /api/v1/public/submit with valid payload succeeds", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/public/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "Simulation Remote Tester",
        message: "Hello from combined live & simulation test suite!"
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.success, true);
  });

  await t.test("Live: POST /api/v1/public/submit rejects missing fields with 422", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/public/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "Incomplete User"
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 422);
    assert.strictEqual(data.success, false);
  });

  // --- PART 2: IN-MEMORY SIMULATION TESTS ---
  await t.test("Simulation: Simulate Upstream GitHub Rate Limit (429)", async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => new Response(JSON.stringify({ message: "Rate limit exceeded" }), {
      status: 429,
      headers: { "Retry-After": "60", "Content-Type": "application/json" }
    });

    const req = new Request("http://api/api/v1/github/repository");
    const res = await worker.fetch(req, mockEnv);
    const data = await res.json();

    assert.strictEqual(res.status, 429);
    assert.strictEqual(data.success, false);
    assert.strictEqual(res.headers.get("Retry-After"), "60");

    global.fetch = originalFetch;
  });

  await t.test("Simulation: Simulate Network Timeout (504)", async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => {
      const err = new Error("AbortError");
      err.name = "AbortError";
      throw err;
    };

    const req = new Request("http://api/api/v1/github/repository");
    const res = await worker.fetch(req, mockEnv);
    const data = await res.json();

    assert.strictEqual(res.status, 504);
    assert.strictEqual(data.success, false);

    global.fetch = originalFetch;
  });

  await t.test("Simulation: Simulate CORS Wildcard Subdomain Matching", async () => {
    const req = new Request("http://api/api/v1/health", {
      headers: { "Origin": "https://sub.dekeku.my.id" }
    });
    const res = await worker.fetch(req, mockEnv);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get("Access-Control-Allow-Origin"), "https://sub.dekeku.my.id");
    assert.strictEqual(res.headers.get("Vary"), "Origin");
  });
});
