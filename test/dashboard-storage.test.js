import { test } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { HttpError } from "../src/core/errors.js";
import { readDashboardDocument, writeDashboardDocument, validateDashboardDocument } from "../src/modules/admin/dashboard-storage.js";
import { encryptDashboardDocument } from "../src/utils/dashboard-crypto.js";

globalThis.crypto ||= webcrypto;

const KEY = Buffer.from(new Uint8Array(32).fill(31)).toString("base64url");
const PATH = "private/dashboard/projects.json";
const timestamp = "2026-11-23T00:00:00.000Z";
const project = {
  id: "project_123456",
  owner: "wahyuajismustofa30",
  repo: "demo",
  projectType: "website",
  domain: "demo.example.com",
  notes: "private note",
  createdAt: timestamp,
  updatedAt: timestamp,
  lastCheck: null
};
const document = { version: 1, projects: [project] };
const toBase64 = value => Buffer.from(value, "utf8").toString("base64");

test("dashboard document schema rejects duplicate repositories and invalid project types", () => {
  assert.equal(validateDashboardDocument(document), document);
  assert.throws(() => validateDashboardDocument({ version: 1, projects: [project, { ...project, id: "project_654321" }] }), /Duplicate dashboard repository/);
  assert.throws(() => validateDashboardDocument({ version: 1, projects: [{ ...project, projectType: "admin" }] }), /Invalid project type/);
});

test("dashboard storage reads and decrypts the private GitHub document", async () => {
  const envelope = await encryptDashboardDocument(document, KEY, PATH);
  const raw = JSON.stringify(envelope);
  const github = {
    branch: "main",
    async request(path, options) {
      assert.match(path, /^\/contents\/private\/dashboard\/projects\.json/);
      assert.equal(options.method, "GET");
      return { type: "file", sha: "a".repeat(40), size: Buffer.byteLength(raw), content: toBase64(raw) };
    }
  };
  const result = await readDashboardDocument(github, { DB_ENCRYPTION_KEY: KEY });
  assert.deepEqual(result.document, document);
  assert.equal(result.sha, "a".repeat(40));
  assert.equal(result.exists, true);
});

test("dashboard storage writes only the encrypted envelope and requires SHA for updates", async () => {
  let captured;
  const github = {
    branch: "main",
    async request(path, options) {
      captured = JSON.parse(options.body);
      return { content: { sha: "b".repeat(40) } };
    }
  };
  const result = await writeDashboardDocument(github, { DB_ENCRYPTION_KEY: KEY }, document, "a".repeat(40));
  assert.equal(result.sha, "b".repeat(40));
  const storedText = Buffer.from(captured.content, "base64").toString("utf8");
  assert.equal(storedText.includes("private note"), false);
  assert.equal(JSON.parse(storedText).algorithm, "A256GCM");
  await assert.rejects(() => writeDashboardDocument(github, { DB_ENCRYPTION_KEY: KEY }, document, "stale"), /valid current storage SHA/);
});

test("missing private dashboard file is empty only after repository access succeeds", async () => {
  const missingFile = {
    branch: "main",
    async request() { throw new HttpError("File not found", 404); },
    async getRepository() { return { full_name: "wahyuajismustofa30/dekeku-db" }; }
  };
  const result = await readDashboardDocument(missingFile, { DB_ENCRYPTION_KEY: KEY });
  assert.deepEqual(result.document, { version: 1, projects: [] });
  assert.equal(result.sha, null);
  const missingRepository = { ...missingFile, async getRepository() { throw new HttpError("File not found", 404); } };
  await assert.rejects(() => readDashboardDocument(missingRepository, { DB_ENCRYPTION_KEY: KEY }), /File not found/);
});

test("missing encryption key fails closed without reading plaintext", async () => {
  const github = { branch: "main", async request() { throw new Error("should not be called"); } };
  await assert.rejects(() => readDashboardDocument(github, {}), /Encrypted dashboard storage is unavailable/);
});
