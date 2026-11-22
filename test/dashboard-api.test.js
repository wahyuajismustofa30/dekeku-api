import { test } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import {
  handleDashboardMetadata,
  handleDashboardBulkType,
  handleDashboardExport,
  handleDashboardRepositories
} from "../src/modules/admin/dashboard.js";

globalThis.crypto ||= webcrypto;

const KEY = Buffer.from(new Uint8Array(32).fill(53)).toString("base64url");
const owner = "wahyuajismustofa30";
const timestamp = "2026-11-23T00:00:00.000Z";
const repoRecord = {
  id: 100,
  name: "demo",
  full_name: owner + "/demo",
  owner: { login: owner },
  html_url: "https://github.com/" + owner + "/demo",
  private: false,
  visibility: "public",
  archived: false,
  default_branch: "main",
  updated_at: timestamp
};
const b64 = value => Buffer.from(value, "utf8").toString("base64");
const githubResponse = (data, status = 200) =>
  new Response(typeof data === "string" ? data : JSON.stringify(data), {
    status, headers: { "content-type": "application/json" }
  });

const createEnvironment = () => {
  let storedContent = null;
  let storedSha = null;
  let writes = 0;
  const env = {
    GITHUB_TOKEN: "test-token",
    GITHUB_OWNER: owner,
    GITHUB_REPO: "dekeku-db",
    GITHUB_BRANCH: "main",
    DB_ENCRYPTION_KEY: KEY
  };
  const fetch = async (url, options = {}) => {
    const parsed = new URL(url);
    if (parsed.pathname === "/users/" + owner + "/repos") return githubResponse([repoRecord]);
    if (parsed.pathname === "/repos/" + owner + "/dekeku-db" && options.method !== "PUT") {
      return githubResponse({ full_name: owner + "/dekeku-db" });
    }
    if (parsed.pathname === "/repos/" + owner + "/dekeku-db/contents/private/dashboard/projects.json") {
      if (options.method === "PUT") {
        const body = JSON.parse(options.body);
        storedContent = body.content;
        storedSha = (++writes).toString(16).padStart(40, "0");
        return githubResponse({ content: { sha: storedSha } });
      }
      if (!storedContent) return githubResponse("{}", 404);
      const raw = Buffer.from(storedContent, "base64").toString("utf8");
      return githubResponse({
        type: "file",
        sha: storedSha,
        size: Buffer.byteLength(raw),
        content: storedContent
      });
    }
    return githubResponse("not found", 404);
  };
  return { env, fetch, get writes() { return writes; }, get storedContent() { return storedContent; } };
};

test("metadata upsert, bulk type update, list, and export use encrypted private storage", async () => {
  const originalFetch = globalThis.fetch;
  const fixture = createEnvironment();
  globalThis.fetch = fixture.fetch;
  try {
    const created = await handleDashboardMetadata(new Request("https://worker/api/v1/admin/dashboard/metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repo: "demo",
        projectType: "website",
        domain: "demo.example.com",
        notes: "internal project note",
        sha: null
      })
    }), fixture.env);
    const createdBody = await created.json();
    assert.equal(created.status, 200);
    assert.equal(createdBody.project.projectType, "website");
    assert.equal(fixture.writes, 1);
    const encryptedText = Buffer.from(fixture.storedContent, "base64").toString("utf8");
    assert.equal(encryptedText.includes("internal project note"), false);
    assert.equal(JSON.parse(encryptedText).algorithm, "A256GCM");

    const bulk = await handleDashboardBulkType(new Request("https://worker/api/v1/admin/dashboard/bulk-type", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repositories: ["demo"], projectType: "invitation", sha: createdBody.sha })
    }), fixture.env);
    const bulkBody = await bulk.json();
    assert.equal(bulk.status, 200);
    assert.equal(bulkBody.updated, 1);
    assert.equal(fixture.writes, 2);

    const listed = await handleDashboardRepositories(new Request("https://worker/api/v1/admin/dashboard/repositories"), fixture.env);
    const listBody = await listed.json();
    assert.equal(listed.status, 200);
    assert.equal(listBody.items[0].projectType, "invitation");
    assert.equal(listBody.items[0].metadataExists, true);

    const exported = await handleDashboardExport(new Request("https://worker/api/v1/admin/dashboard/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repositories: ["demo"] })
    }), fixture.env);
    const exportBody = await exported.json();
    assert.equal(exported.status, 200);
    assert.equal(exportBody.items[0].projectType, "invitation");
    assert.equal(Object.prototype.hasOwnProperty.call(exportBody.items[0], "notes"), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("bulk metadata update rejects duplicate or unknown repository targets before writing", async () => {
  const originalFetch = globalThis.fetch;
  const fixture = createEnvironment();
  globalThis.fetch = fixture.fetch;
  try {
    const duplicate = await handleDashboardBulkType(new Request("https://worker/api/v1/admin/dashboard/bulk-type", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repositories: ["demo", "DEMO"], projectType: "website", sha: null })
    }), fixture.env);
    assert.equal(duplicate.status, 422);
    assert.equal(fixture.writes, 0);

    const unknown = await handleDashboardBulkType(new Request("https://worker/api/v1/admin/dashboard/bulk-type", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repositories: ["private-repo"], projectType: "website", sha: null })
    }), fixture.env);
    assert.equal(unknown.status, 422);
    assert.equal(fixture.writes, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
