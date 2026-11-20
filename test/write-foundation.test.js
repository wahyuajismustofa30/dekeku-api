import { test, describe } from "node:test";
import assert from "node:assert";
import { validateWritablePath, parseAndValidateBody } from "../src/modules/github/write.js";
import { uint8ArrayToBase64 } from "../src/utils/base64.js";
import worker from "../src/index.js";

describe("Write Engine - Validation Foundation", () => {
  describe("Path Validation", () => {
    test("Accept public/data/*.json", () => {
      assert.strictEqual(validateWritablePath("public/data/test.json").valid, true);
    });
    test("Accept public/data/test1.json and public/data/Users.json", () => {
      assert.strictEqual(validateWritablePath("public/data/test1.json").valid, true);
      assert.strictEqual(validateWritablePath("public/data/Users.json").valid, true);
    });
    test("Reject control characters NUL and newline", () => {
      assert.strictEqual(validateWritablePath("public/data/test\u0000.json").valid, false);
      assert.strictEqual(validateWritablePath("public/data/test\n.json").valid, false);
    });
    test("Reject public/*.json", () => {
      assert.strictEqual(validateWritablePath("public/test.json").valid, false);
    });
    test("Reject outside root", () => {
      assert.strictEqual(validateWritablePath("src/test.json").valid, false);
    });
    test("Reject traversal", () => {
      assert.strictEqual(validateWritablePath("public/data/../test.json").valid, false);
    });
    test("Reject non-json", () => {
      assert.strictEqual(validateWritablePath("public/data/test.txt").valid, false);
    });
    test("Reject encoded path", () => {
      assert.strictEqual(validateWritablePath("public/data/%2e%2e/test.json").valid, false);
      assert.strictEqual(validateWritablePath("public/data/%2f/test.json").valid, false);
    });
    test("Reject backslash", () => {
      assert.strictEqual(validateWritablePath("public/data\\test.json").valid, false);
    });
    test("Reject percent character", () => {
      assert.strictEqual(validateWritablePath("public/data/test%.json").valid, false);
    });
  });

  describe("Base64 Chunked Encoding (Large Payloads)", () => {
    test("Encode and decode 1MB payload with non-ASCII UTF-8 content", () => {
      // Build 1MB payload
      const pattern = "Hello World 🌍 🔥 DEKEKU API Gateway! ";
      const repeatCount = Math.ceil(1048576 / new TextEncoder().encode(pattern).byteLength);
      const largeString = pattern.repeat(repeatCount);
      const inputBytes = new TextEncoder().encode(largeString);

      // Encode
      const base64Result = uint8ArrayToBase64(inputBytes);
      assert.strictEqual(typeof base64Result, "string");

      // Decode back and verify exact byte match
      const decodedBinaryStr = atob(base64Result);
      const decodedBytes = new Uint8Array(decodedBinaryStr.length);
      for (let i = 0; i < decodedBinaryStr.length; i++) {
        decodedBytes[i] = decodedBinaryStr.charCodeAt(i);
      }
      const decodedString = new TextDecoder("utf-8").decode(decodedBytes);

      assert.strictEqual(decodedString, largeString);
    });
  });

  describe("Request Parsing & Content Validation", () => {
    const createMockRequest = (body, length, contentType = "application/json") => new Request("http://api/write", {
      method: "POST",
      headers: { "Content-Type": contentType, "Content-Length": (length !== undefined ? length : body.length).toString() },
      body
    });

    test("Accept Content-Type with charset parameter", async () => {
      const data = { path: "public/data/test.json", content: { a: 1 } };
      const req = createMockRequest(JSON.stringify(data), undefined, "application/json; charset=utf-8");
      const result = await parseAndValidateBody(req);
      assert.strictEqual(result.path, data.path);
    });

    test("Reject missing content field", async () => {
      const data = { path: "public/data/test.json" };
      const req = createMockRequest(JSON.stringify(data));
      await assert.rejects(parseAndValidateBody(req), (err) => err.status === 422 && err.message.includes("content"));
    });

    test("Accept valid payload with object, array, or string content", async () => {
      const dataObj = { path: "public/data/test.json", content: { key: "val" } };
      const resObj = await parseAndValidateBody(createMockRequest(JSON.stringify(dataObj)));
      assert.deepStrictEqual(resObj.content, { key: "val" });

      const dataArr = { path: "public/data/test.json", content: [1, 2, 3] };
      const resArr = await parseAndValidateBody(createMockRequest(JSON.stringify(dataArr)));
      assert.deepStrictEqual(resArr.content, [1, 2, 3]);
    });

    test("Reject body > 1.1MB", async () => {
      const largeBody = '{"path": "public/data/test.json", "content": {"a": "' + "a".repeat(1153435) + '"}}';
      const req = createMockRequest(largeBody, 1153435);
      await assert.rejects(parseAndValidateBody(req), (err) => err.status === 413);
    });

    test("Reject invalid JSON", async () => {
      const req = createMockRequest('{"path": "public/data/test.json", "content": { "a": 1 ', 50);
      await assert.rejects(parseAndValidateBody(req), (err) => err.status === 422);
    });

    test("Reject root as primitive", async () => {
      const req = createMockRequest('"string"', 8);
      await assert.rejects(parseAndValidateBody(req), (err) => err.status === 422);
    });
  });

  describe("CORS Middleware", () => {
    test("Reflect allowed origin from ALLOWED_ORIGINS env", async () => {
      const env = { ALLOWED_ORIGINS: "https://example.com, https://app.dekeku.my.id" };
      const req = new Request("http://api/api/v1/health", {
        method: "GET",
        headers: { "Origin": "https://app.dekeku.my.id" }
      });
      const res = await worker.fetch(req, env);
      assert.strictEqual(res.headers.get("Access-Control-Allow-Origin"), "https://app.dekeku.my.id");
      assert.strictEqual(res.headers.get("Vary"), "Origin");
    });

    test("Deny origin not in ALLOWED_ORIGINS", async () => {
      const env = { ALLOWED_ORIGINS: "https://example.com" };
      const req = new Request("http://api/api/v1/health", {
        method: "GET",
        headers: { "Origin": "https://evil.com" }
      });
      const res = await worker.fetch(req, env);
      assert.strictEqual(res.headers.get("Access-Control-Allow-Origin"), null);
    });

    test("OPTIONS preflight includes PUT and DELETE in Allow-Methods", async () => {
      const env = { ALLOWED_ORIGINS: "https://example.com" };
      const req = new Request("http://api/api/v1/admin/write/create", {
        method: "OPTIONS",
        headers: { "Origin": "https://example.com" }
      });
      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 204);
      assert.strictEqual(res.headers.get("Access-Control-Allow-Origin"), "https://example.com");
      assert.ok(res.headers.get("Access-Control-Allow-Methods").includes("PUT"));
      assert.ok(res.headers.get("Access-Control-Allow-Methods").includes("DELETE"));
    });

    test("Error responses attach CORS headers", async () => {
      const env = { ALLOWED_ORIGINS: "https://example.com" };
      const req = new Request("http://api/non-existent-route", {
        method: "GET",
        headers: { "Origin": "https://example.com" }
      });
      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.headers.get("Access-Control-Allow-Origin"), "https://example.com");
    });
  });
});
