import { describe, test } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

const env = {};
const request = (method, headers = {}, body) => new Request("https://api.example.test/api/v1/user/login", {
  method,
  headers,
  body
});

describe("RBAC-04 User login contract", () => {
  test("rejects methods other than POST", async () => {
    const response = await worker.fetch(request("GET"), env);
    assert.equal(response.status, 405);
  });

  test("requires application/json", async () => {
    const response = await worker.fetch(request("POST", { "Content-Type": "text/plain" }, "x"), env);
    assert.equal(response.status, 415);
  });

  test("rejects malformed JSON", async () => {
    const response = await worker.fetch(request("POST", { "Content-Type": "application/json" }, "{"), env);
    assert.equal(response.status, 422);
  });

  test("rejects unsupported credential fields", async () => {
    const response = await worker.fetch(request(
      "POST",
      { "Content-Type": "application/json" },
      JSON.stringify({ username: "user1", password: "not-a-real-password", role: "admin" })
    ), env);
    assert.equal(response.status, 422);
  });
});
