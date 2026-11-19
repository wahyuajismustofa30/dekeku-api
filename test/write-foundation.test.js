import { test, describe } from "node:test";
import assert from "node:assert";
import { validateWritablePath, parseAndValidateBody } from "../src/modules/github/write.js";
import { HttpError } from "../src/core/errors.js";

describe("Write Engine - Validation Foundation", () => {
  describe("Path Validation", () => {
    test("Accept public/data/*.json", () => {
      assert.strictEqual(validateWritablePath("public/data/test.json").valid, true);
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
    test("Reject characters", () => {
        assert.strictEqual(validateWritablePath("public/data/test%.json").valid, false);
    });
  });

  describe("Request Parsing & Size Limiting", () => {
    const createMockRequest = (body, length) => new Request("http://api/write", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": length || body.length.toString() },
      body
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

    test("Accept valid payload", async () => {
        const data = { path: "public/data/test.json", content: { a: 1 } };
        const req = createMockRequest(JSON.stringify(data), JSON.stringify(data).length);
        const result = await parseAndValidateBody(req);
        assert.strictEqual(result.path, data.path);
        assert.deepStrictEqual(result.content, data.content);
    });
  });
});
