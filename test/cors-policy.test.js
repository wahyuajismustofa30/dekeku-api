import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { handleCors } from "../src/middleware/cors.js";

const requestFor = (origin) => ({
  headers: new Headers({ Origin: origin })
});

describe("CORS origin validation", () => {
  const env = { ALLOWED_ORIGINS: "https://example.com,*.dekeku.my.id" };

  test("allows exact HTTPS origin and valid wildcard subdomains", () => {
    for (const origin of [
      "https://example.com",
      "https://sub.dekeku.my.id",
      "https://deep.sub.dekeku.my.id"
    ]) {
      const headers = handleCors(requestFor(origin), env);
      assert.strictEqual(headers.get("Access-Control-Allow-Origin"), origin);
      assert.strictEqual(headers.get("Vary"), "Origin");
    }
  });

  test("wildcard does not include apex domain unless listed exactly", () => {
    const headers = handleCors(requestFor("https://dekeku.my.id"), {
      ALLOWED_ORIGINS: "*.dekeku.my.id"
    });
    assert.strictEqual(headers.has("Access-Control-Allow-Origin"), false);
    assert.strictEqual(headers.get("Vary"), "Origin");
  });

  test("rejects HTTP, non-default ports, credentials, paths, and deceptive hosts", () => {
    const rejected = [
      "http://sub.dekeku.my.id",
      "https://sub.dekeku.my.id:8443",
      "https://user@sub.dekeku.my.id",
      "https://sub.dekeku.my.id/path",
      "https://dekeku.my.id.evil.example",
      "https://evil-dekeku.my.id",
      "null",
      "not a URL"
    ];

    for (const origin of rejected) {
      const headers = handleCors(requestFor(origin), env);
      assert.strictEqual(headers.has("Access-Control-Allow-Origin"), false, origin);
      assert.strictEqual(headers.get("Vary"), "Origin");
    }
  });

  test("rejects malformed configured patterns", () => {
    const headers = handleCors(requestFor("https://sub.dekeku.my.id"), {
      ALLOWED_ORIGINS: "*.dekeku.my.id/path,https://example.com:8443"
    });
    assert.strictEqual(headers.has("Access-Control-Allow-Origin"), false);
  });
});
