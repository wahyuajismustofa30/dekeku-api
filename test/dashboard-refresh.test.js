import { test } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { DashboardRefreshCoordinator } from "../src/modules/admin/refresh-coordinator.js";

globalThis.crypto ||= webcrypto;

const KEY = Buffer.from(new Uint8Array(32).fill(41)).toString("base64url");
const env = {
  GITHUB_TOKEN: "test-token",
  GITHUB_OWNER: "wahyuajismustofa30",
  GITHUB_REPO: "dekeku-db",
  GITHUB_BRANCH: "main",
  DB_ENCRYPTION_KEY: KEY
};
const repository = (name, archived = false) => ({
  id: name.length,
  name,
  full_name: "wahyuajismustofa30/" + name,
  owner: { login: "wahyuajismustofa30" },
  html_url: "https://github.com/wahyuajismustofa30/" + name,
  private: false,
  visibility: "public",
  archived,
  default_branch: "main",
  updated_at: "2026-11-23T00:00:00Z"
});

const makeState = initial => {
  const data = new Map(initial ? [["latest-job", initial]] : []);
  let alarmAt = null;
  const storage = {
    async get(key) { return data.get(key); },
    async put(key, value) { data.set(key, structuredClone(value)); },
    async setAlarm(value) { alarmAt = value; },
    async transaction(callback) {
      return callback({
        async get(key) { return data.get(key); },
        async put(key, value) { data.set(key, structuredClone(value)); }
      });
    }
  };
  return { storage, get alarmAt() { return alarmAt; }, data };
};

const response = (payload, status = 200) =>
  new Response(typeof payload === "string" ? payload : JSON.stringify(payload), {
    status, headers: { "content-type": "application/json" }
  });

test("manual refresh start creates one persistent job and rejects concurrent start", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => response([repository("demo")]);
  const state = makeState();
  const coordinator = new DashboardRefreshCoordinator(state, env);
  try {
    const started = await coordinator.fetch(new Request("https://internal/start", {
      method: "POST", body: JSON.stringify({})
    }));
    assert.equal(started.status, 200);
    const payload = await started.json();
    assert.equal(payload.job.status, "queued");
    assert.equal(payload.job.total, 1);
    assert.ok(state.alarmAt);
    const duplicate = await coordinator.fetch(new Request("https://internal/start", {
      method: "POST", body: JSON.stringify({})
    }));
    assert.equal(duplicate.status, 409);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("cancel request stops queued work before the first repository is processed", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => response([repository("demo")]);
  const state = makeState();
  const coordinator = new DashboardRefreshCoordinator(state, env);
  try {
    await coordinator.fetch(new Request("https://internal/start", { method: "POST", body: "{}" }));
    const cancelled = await coordinator.fetch(new Request("https://internal/cancel", { method: "POST", body: "{}" }));
    assert.equal(cancelled.status, 200);
    await coordinator.alarm();
    const job = await state.storage.get("latest-job");
    assert.equal(job.status, "cancelled");
    assert.equal(job.completed, 0);
    assert.equal(job.remaining, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("retry schedules only repositories marked failed in the previous result", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => response([repository("failed-one"), repository("successful-one")]);
  const previous = {
    jobId: "old-job", generation: 4, status: "completed_with_errors",
    results: [
      { repository: "failed-one", success: false },
      { repository: "successful-one", success: true }
    ]
  };
  const state = makeState(previous);
  const coordinator = new DashboardRefreshCoordinator(state, env);
  try {
    const retried = await coordinator.fetch(new Request("https://internal/retry", { method: "POST", body: "{}" }));
    const payload = await retried.json();
    assert.equal(retried.status, 200);
    assert.equal(payload.job.total, 1);
    assert.deepEqual(payload.job.pending.map(item => item.name), ["failed-one"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("background alarm persists the latest inspection snapshot without writing project repositories", async () => {
  const originalFetch = globalThis.fetch;
  let privateWriteCount = 0;
  globalThis.fetch = async url => {
    const parsed = new URL(url);
    if (parsed.pathname === "/users/wahyuajismustofa30/repos") {
      return response([repository("demo")]);
    }
    if (parsed.pathname === "/repos/wahyuajismustofa30/demo/contents/config.json" ||
        parsed.pathname === "/repos/wahyuajismustofa30/demo/contents/CNAME" ||
        parsed.pathname === "/repos/wahyuajismustofa30/demo/contents/assets/data") {
      return response("{}", 404);
    }
    if (parsed.pathname.includes("/contents/")) privateWriteCount += 1;
    return response("unexpected request", 404);
  };
  const state = makeState();
  const coordinator = new DashboardRefreshCoordinator(state, env);
  try {
    await coordinator.fetch(new Request("https://internal/start", { method: "POST", body: "{}" }));
    await coordinator.alarm();
    const job = await state.storage.get("latest-job");
    const checks = await state.storage.get("latest-checks");
    assert.equal(job.status, "completed");
    assert.equal(job.completed, 1);
    assert.equal(job.succeeded, 1);
    assert.equal(job.results[0].repository, "demo");
    assert.equal(checks["wahyuajismustofa30/demo"].status, "active");
    assert.equal(privateWriteCount, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
