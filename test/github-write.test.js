import { test, describe, before, after, mock } from "node:test";
import assert from "node:assert";
import { GitHubClient } from "../src/core/github.js";
import { createFile, updateFile, deleteFile, parseAndValidateBody, validateWritablePath } from "../src/modules/github/write.js";
import { HttpError } from "../src/core/errors.js";

// Mock fetch globally
const originalFetch = globalThis.fetch;

function createMockEnv() {
  return {
    GITHUB_TOKEN: "test-token",
    GITHUB_OWNER: "test-owner",
    GITHUB_REPO: "test-repo",
    GITHUB_BRANCH: "main"
  };
}

function mockResponse(status, body, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({
      "x-ratelimit-limit": "5000",
      "x-ratelimit-remaining": "4999",
      "x-ratelimit-reset": "1234567890",
      ...headers
    }),
    json: async () => body
  };
}

function makeClientWithMock(mockImpl) {
  const mockFetch = mock.fn(mockImpl);
  globalThis.fetch = mockFetch;
  const client = new GitHubClient(createMockEnv());
  return { client, mockFetch };
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

describe("GitHub Client - PUT/DELETE Operations", () => {
  after(restoreFetch);

  describe("putFile", () => {
    test("PUT successful", async () => {
      const { client, mockFetch } = makeClientWithMock(() => mockResponse(200, {
        content: { sha: "newsha1234567890123456789012345678901234567890" },
        commit: { sha: "commitsha1234567890123456789012345678901234567890" }
      }));

      const result = await client.putFile("public/data/test.json", '{"key":"value"}', "a".repeat(40), "test message");
      assert.deepStrictEqual(result, {
        content: { sha: "newsha1234567890123456789012345678901234567890" },
        commit: { sha: "commitsha1234567890123456789012345678901234567890" }
      });
      restoreFetch();
    });

    test("PUT with UTF-8 multibyte content", async () => {
      const { client, mockFetch } = makeClientWithMock(() => mockResponse(200, { content: { sha: "newsha1234567890123456789012345678901234567890" } }));

      const content = JSON.stringify({ emoji: "🚀", chinese: "测试" });
      await client.putFile("public/data/test.json", content, "a".repeat(40), "test message");
      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call.arguments[1].body);
      assert.ok(body.content);
      assert.strictEqual(body.sha, "a".repeat(40));
      restoreFetch();
    });

    test("Reject empty SHA", async () => {
      const { client } = makeClientWithMock(() => mockResponse(200, {}));
      await assert.rejects(
        client.putFile("public/data/test.json", '{}', "", "msg"),
        (err) => err instanceof HttpError && err.status === 400 && err.message === "Invalid SHA format"
      );
      restoreFetch();
    });

    test("Reject invalid SHA length", async () => {
      const { client } = makeClientWithMock(() => mockResponse(200, {}));
      await assert.rejects(
        client.putFile("public/data/test.json", '{}', "abc", "msg"),
        (err) => err instanceof HttpError && err.status === 400
      );
      restoreFetch();
    });

    test("Reject non-hex SHA", async () => {
      const { client } = makeClientWithMock(() => mockResponse(200, {}));
      await assert.rejects(
        client.putFile("public/data/test.json", '{}', "g".repeat(40), "msg"),
        (err) => err instanceof HttpError && err.status === 400
      );
      restoreFetch();
    });

    test("Reject non-string SHA", async () => {
      const { client } = makeClientWithMock(() => mockResponse(200, {}));
      await assert.rejects(
        client.putFile("public/data/test.json", '{}', 123, "msg"),
        (err) => err instanceof HttpError && err.status === 400
      );
      restoreFetch();
    });

    test("GitHub 409 -> Gateway 409", async () => {
      const { client } = makeClientWithMock(() => mockResponse(409, { message: "Resource conflict" }));

      await assert.rejects(
        client.putFile("public/data/test.json", '{}', "a".repeat(40), "msg"),
        (err) => err instanceof HttpError && err.status === 409
      );
      restoreFetch();
    });

    test("GitHub 401 -> Gateway 502", async () => {
      const { client } = makeClientWithMock(() => mockResponse(401, { message: "Bad credentials" }));

      await assert.rejects(
        client.putFile("public/data/test.json", '{}', "a".repeat(40), "msg"),
        (err) => err instanceof HttpError && err.status === 502
      );
      restoreFetch();
    });

    test("GitHub 403 permission -> Gateway 502", async () => {
      const { client } = makeClientWithMock(() => mockResponse(403, { message: "Forbidden" }, { "x-ratelimit-remaining": "100" }));

      await assert.rejects(
        client.putFile("public/data/test.json", '{}', "a".repeat(40), "msg"),
        (err) => err instanceof HttpError && err.status === 502
      );
      restoreFetch();
    });

    test("GitHub 403 rate limit (x-ratelimit-remaining: 0) -> Gateway 429", async () => {
      const { client } = makeClientWithMock(() => mockResponse(403, { message: "Rate limit exceeded" }, { "x-ratelimit-remaining": "0", "retry-after": "60" }));

      await assert.rejects(
        client.putFile("public/data/test.json", '{}', "a".repeat(40), "msg"),
        (err) => err instanceof HttpError && err.status === 429 && err.retryAfter === "60"
      );
      restoreFetch();
    });

    test("GitHub 403 secondary rate limit -> Gateway 429", async () => {
      const { client } = makeClientWithMock(() => mockResponse(403, { message: "You have triggered an abuse detection mechanism" }, { "x-ratelimit-remaining": "100", "retry-after": "30" }));

      await assert.rejects(
        client.putFile("public/data/test.json", '{}', "a".repeat(40), "msg"),
        (err) => err instanceof HttpError && err.status === 429 && err.retryAfter === "30"
      );
      restoreFetch();
    });

    test("GitHub 422 validation -> Gateway 422", async () => {
      const { client } = makeClientWithMock(() => mockResponse(422, { message: "Validation failed" }));

      await assert.rejects(
        client.putFile("public/data/test.json", '{}', "a".repeat(40), "msg"),
        (err) => err instanceof HttpError && err.status === 422
      );
      restoreFetch();
    });

    test("GitHub 422 secondary rate limit -> Gateway 429", async () => {
      const { client } = makeClientWithMock(() => mockResponse(422, { message: "secondary rate limit exceeded" }));

      await assert.rejects(
        client.putFile("public/data/test.json", '{}', "a".repeat(40), "msg"),
        (err) => err instanceof HttpError && err.status === 429
      );
      restoreFetch();
    });

    test("GitHub 429 -> Gateway 429 with Retry-After", async () => {
      const { client } = makeClientWithMock(() => mockResponse(429, { message: "Too Many Requests" }, { "retry-after": "45" }));

      await assert.rejects(
        client.putFile("public/data/test.json", '{}', "a".repeat(40), "msg"),
        (err) => err instanceof HttpError && err.status === 429 && err.retryAfter === "45"
      );
      restoreFetch();
    });

    test("GitHub 500 -> Gateway 502", async () => {
      const { client } = makeClientWithMock(() => mockResponse(500, { message: "Server Error" }));

      await assert.rejects(
        client.putFile("public/data/test.json", '{}', "a".repeat(40), "msg"),
        (err) => err instanceof HttpError && err.status === 502
      );
      restoreFetch();
    });

    test("Timeout -> Gateway 504", async () => {
      const { client } = makeClientWithMock(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const err = new Error("Aborted");
            err.name = "AbortError";
            reject(err);
          }, 100);
        });
      });

      await assert.rejects(
        client.putFile("public/data/test.json", '{}', "a".repeat(40), "msg"),
        (err) => err instanceof HttpError && err.status === 504
      );
      restoreFetch();
    });

    test("Network error -> Gateway 502", async () => {
      const { client } = makeClientWithMock(() => Promise.reject(new TypeError("Failed to fetch")));

      await assert.rejects(
        client.putFile("public/data/test.json", '{}', "a".repeat(40), "msg"),
        (err) => err instanceof HttpError && err.status === 502
      );
      restoreFetch();
    });

    test("SHA passed through unchanged to GitHub", async () => {
      const { client, mockFetch } = makeClientWithMock(() => mockResponse(200, {}));

      const testSha = "b".repeat(40);
      await client.putFile("public/data/test.json", '{}', testSha, "msg");
      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call.arguments[1].body);
      assert.strictEqual(body.sha, testSha);
      restoreFetch();
    });
  });

  describe("deleteFile", () => {
    test("DELETE successful", async () => {
      const { client, mockFetch } = makeClientWithMock(() => mockResponse(200, { commit: { sha: "commitsha1234567890123456789012345678901234567890" } }));

      const result = await client.deleteFile("public/data/test.json", "a".repeat(40), "delete message");
      restoreFetch();
    });

    test("DELETE requires SHA validation", async () => {
      const { client } = makeClientWithMock(() => mockResponse(200, {}));
      await assert.rejects(
        client.deleteFile("public/data/test.json", "", "msg"),
        (err) => err instanceof HttpError && err.status === 400
      );
      restoreFetch();
    });

    test("GitHub 409 -> Gateway 409", async () => {
      const { client } = makeClientWithMock(() => mockResponse(409, { message: "Resource conflict" }));

      await assert.rejects(
        client.deleteFile("public/data/test.json", "a".repeat(40), "msg"),
        (err) => err instanceof HttpError && err.status === 409
      );
      restoreFetch();
    });

    test("GitHub 404 -> Gateway 404", async () => {
      const { client } = makeClientWithMock(() => mockResponse(404, { message: "Not Found" }));

      await assert.rejects(
        client.deleteFile("public/data/test.json", "a".repeat(40), "msg"),
        (err) => err instanceof HttpError && err.status === 404
      );
      restoreFetch();
    });

    test("SHA passed through unchanged to GitHub", async () => {
      const { client, mockFetch } = makeClientWithMock(() => mockResponse(200, {}));

      const testSha = "c".repeat(40);
      await client.deleteFile("public/data/test.json", testSha, "msg");
      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call.arguments[1].body);
      assert.strictEqual(body.sha, testSha);
      restoreFetch();
    });

    test("No auto-retry on 409", async () => {
      let callCount = 0;
      const { client } = makeClientWithMock(() => {
        callCount++;
        return mockResponse(409, { message: "Conflict" });
      });

      await assert.rejects(
        client.deleteFile("public/data/test.json", "a".repeat(40), "msg"),
        (err) => err instanceof HttpError && err.status === 409
      );
      assert.strictEqual(callCount, 1);
      restoreFetch();
    });
  });

  describe("createFile (no SHA)", () => {
    test("CREATE successful", async () => {
      const { client, mockFetch } = makeClientWithMock(() => mockResponse(201, { content: { sha: "newsha1234567890123456789012345678901234567890" } }));

      const result = await createFile(client, "public/data/new.json", '{"new": true}', "create message");
      restoreFetch();
    });

    test("No SHA in request body", async () => {
      const { client, mockFetch } = makeClientWithMock(() => mockResponse(201, {}));

      await createFile(client, "public/data/new.json", '{}', "msg");
      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call.arguments[1].body);
      assert.ok(!body.sha);
      restoreFetch();
    });
  });

  describe("parseAndValidateBody", () => {
    test("Valid request with content", async () => {
      const data = { path: "public/data/test.json", content: { key: "value" } };
      const bodyStr = JSON.stringify(data);
      const req = new Request("http://api/write", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": bodyStr.length.toString() },
        body: bodyStr
      });

      const result = await parseAndValidateBody(req);
      assert.strictEqual(result.path, "public/data/test.json");
      assert.deepStrictEqual(result.content, { key: "value" });
      assert.ok(typeof result.serialisedContent === "string");
    });

    test("Reject content > 1MB", async () => {
      const largeContent = { data: "x".repeat(1100000) };
      const data = { path: "public/data/test.json", content: largeContent };
      const bodyStr = JSON.stringify(data);
      const req = new Request("http://api/write", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": bodyStr.length.toString() },
        body: bodyStr
      });

      await assert.rejects(
        parseAndValidateBody(req),
        (err) => err instanceof HttpError && err.status === 413
      );
    });
  });

  describe("validateWritablePath", () => {
    test("Accept valid path", () => {
      assert.strictEqual(validateWritablePath("public/data/test.json").valid, true);
    });

    test("Reject encoded path", () => {
      assert.strictEqual(validateWritablePath("public/data/%2e%2e/test.json").valid, false);
    });

    test("Reject backslash", () => {
      assert.strictEqual(validateWritablePath("public/data\\test.json").valid, false);
    });

    test("Reject % character", () => {
      assert.strictEqual(validateWritablePath("public/data/test%.json").valid, false);
    });
  });

  describe("No secret leakage", () => {
    test("Error messages don't contain token", async () => {
      const { client } = makeClientWithMock(() => mockResponse(401, { message: "Bad credentials" }));

      try {
        await client.putFile("public/data/test.json", '{}', "a".repeat(40), "msg");
        assert.fail("Should have thrown");
      } catch (err) {
        assert.ok(!err.message.includes("test-token"));
        assert.ok(!err.message.includes("Bearer"));
      }
      restoreFetch();
    });

    test("Error messages don't contain file content", async () => {
      const { client } = makeClientWithMock(() => mockResponse(422, { message: "Validation failed" }));

      try {
        await client.putFile("public/data/test.json", '{"secret": "value"}', "a".repeat(40), "msg");
        assert.fail("Should have thrown");
      } catch (err) {
        assert.ok(!err.message.includes("secret"));
        assert.ok(!err.message.includes("value"));
      }
      restoreFetch();
    });
  });
});
