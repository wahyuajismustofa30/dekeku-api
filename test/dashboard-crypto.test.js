import { test } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import {
  encryptDashboardDocument,
  decryptDashboardDocument
} from "../src/utils/dashboard-crypto.js";

globalThis.crypto ||= webcrypto;

const KEY = Buffer.from(new Uint8Array(32).fill(23)).toString("base64url");
const WRONG_KEY = Buffer.from(new Uint8Array(32).fill(24)).toString("base64url");
const PATH = "private/dashboard/projects.json";
const document = { version: 1, projects: [{ id: "project_123456", repo: "demo", notes: "private metadata" }] };

test("dashboard encryption round-trips JSON without storing plaintext", async () => {
  const envelope = await encryptDashboardDocument(document, KEY, PATH);
  assert.equal(envelope.version, 1);
  assert.equal(envelope.algorithm, "A256GCM");
  assert.equal(envelope.keyId, "v1");
  assert.equal(await decryptDashboardDocument(envelope, KEY, PATH).then(JSON.stringify), JSON.stringify(document));
  assert.equal(JSON.stringify(envelope).includes("private metadata"), false);
});

test("dashboard encryption generates a unique 96-bit IV for every write", async () => {
  const first = await encryptDashboardDocument(document, KEY, PATH);
  const second = await encryptDashboardDocument(document, KEY, PATH);
  assert.equal(Buffer.from(first.iv, "base64url").byteLength, 12);
  assert.notEqual(first.iv, second.iv);
});

test("ciphertext tampering, wrong path, and wrong key fail authentication", async () => {
  const envelope = await encryptDashboardDocument(document, KEY, PATH);
  const tampered = { ...envelope, ciphertext: (envelope.ciphertext[0] === "A" ? "B" : "A") + envelope.ciphertext.slice(1) };
  await assert.rejects(() => decryptDashboardDocument(tampered, KEY, PATH));
  await assert.rejects(() => decryptDashboardDocument(envelope, KEY, "private/dashboard/other.json"));
  await assert.rejects(() => decryptDashboardDocument(envelope, WRONG_KEY, PATH));
});

test("missing, malformed, and wrong-length keys fail closed", async () => {
  await assert.rejects(() => encryptDashboardDocument(document, "", PATH));
  await assert.rejects(() => encryptDashboardDocument(document, "not-base64url!", PATH));
  await assert.rejects(() => encryptDashboardDocument(document, Buffer.from("short").toString("base64url"), PATH));
});

test("unknown envelope fields, key versions, and plaintext payloads are rejected", async () => {
  const envelope = await encryptDashboardDocument(document, KEY, PATH);
  await assert.rejects(() => decryptDashboardDocument({ ...envelope, extra: true }, KEY, PATH));
  await assert.rejects(() => decryptDashboardDocument({ ...envelope, keyId: "v2" }, KEY, PATH));
  await assert.rejects(() => decryptDashboardDocument(document, KEY, PATH));
});
