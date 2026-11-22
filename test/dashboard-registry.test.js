import { test } from "node:test";
import assert from "node:assert/strict";
import { discoverPublicRepositories, inspectPublicRepository } from "../src/modules/admin/dashboard.js";

const env = {
  GITHUB_TOKEN: "test-token",
  GITHUB_OWNER: "wahyuajismustofa30",
  GITHUB_REPO: "dekeku-db",
  GITHUB_BRANCH: "main"
};
const b64 = value => Buffer.from(value, "utf8").toString("base64");
const repoRecord = (name, overrides = {}) => ({
  id: name.length,
  name,
  full_name: "wahyuajismustofa30/" + name,
  owner: { login: "wahyuajismustofa30" },
  html_url: "https://github.com/wahyuajismustofa30/" + name,
  private: false,
  visibility: "public",
  archived: false,
  default_branch: "main",
  updated_at: "2026-11-23T00:00:00Z",
  ...overrides
});

test("public repository discovery follows pagination and excludes private or foreign repositories", async () => {
  const originalFetch = globalThis.fetch;
  const pages = [];
  const first = Array.from({ length: 98 }, (_, i) => repoRecord("project-" + i));
  first.push(repoRecord("private-repo", { private: true }));
  first.push(repoRecord("foreign-repo", { owner: { login: "another-owner" }, full_name: "another-owner/foreign-repo" }));
  const second = [repoRecord("last-public"), repoRecord("archived-public", { archived: true })];
  globalThis.fetch = async url => {
    const page = Number(new URL(url).searchParams.get("page"));
    pages.push(page);
    return new Response(JSON.stringify(page === 1 ? first : second), { status: 200 });
  };
  try {
    const result = await discoverPublicRepositories(env);
    assert.deepEqual(pages, [1, 2]);
    assert.equal(result.length, 100);
    assert.equal(result.some(item => item.name === "private-repo"), false);
    assert.equal(result.some(item => item.name === "foreign-repo"), false);
    assert.equal(result.find(item => item.name === "archived-public").archived, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("repository inspection validates config, CNAME, and assets/data", async () => {
  const originalFetch = globalThis.fetch;
  const config = {
    schema_version: 1,
    project: { id: "demo" },
    repository: { username: "wahyuajismustofa30", repo: "demo" }
  };
  globalThis.fetch = async url => {
    const path = new URL(url).pathname;
    let payload;
    if (path.endsWith("/contents/config.json")) payload = { type: "file", size: Buffer.byteLength(JSON.stringify(config)), content: b64(JSON.stringify(config)) };
    else if (path.endsWith("/contents/CNAME")) payload = { type: "file", content: b64("demo.example.com\n") };
    else if (path.endsWith("/contents/assets/data")) payload = [];
    else return new Response("not found", { status: 404 });
    return new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const result = await inspectPublicRepository(env, {
      owner: "wahyuajismustofa30", name: "demo", defaultBranch: "main", archived: false
    });
    assert.equal(result.status, "active");
    assert.equal(result.config.valid, true);
    assert.equal(result.cname.domain, "demo.example.com");
    assert.equal(result.assetsData.exists, true);
    assert.equal(result.error, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("missing config and CNAME are reported as incomplete, not inactive", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("not found", { status: 404 });
  try {
    const result = await inspectPublicRepository(env, {
      owner: "wahyuajismustofa30", name: "empty-project", defaultBranch: "main", archived: false
    });
    assert.equal(result.status, "active");
    assert.equal(result.config.exists, false);
    assert.equal(result.cname.exists, false);
    assert.equal(result.assetsData.exists, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
