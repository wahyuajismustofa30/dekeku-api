import { test } from "node:test";
import assert from "node:assert/strict";
import { router } from "../src/core/router.js";

test("dashboard page shell is available while data APIs remain protected", async () => {
  const page = await router(new Request("https://api.example.test/admin"), {});
  assert.equal(page.status, 200);
  assert.match(page.headers.get("content-type"), /text\/html/);
  assert.match(await page.text(), /DEKEKU Admin Dashboard/);

  const protectedResponse = await router(new Request("https://api.example.test/api/v1/admin/dashboard/repositories"), {});
  assert.equal(protectedResponse.status, 401);
  const payload = await protectedResponse.json();
  assert.equal(payload.success, false);
});

test("dashboard mutation routes reject unauthenticated requests", async () => {
  for (const [path, method] of [
    ["/api/v1/admin/dashboard/metadata", "POST"],
    ["/api/v1/admin/dashboard/bulk-type", "POST"],
    ["/api/v1/admin/dashboard/export", "POST"],
    ["/api/v1/admin/dashboard/refresh/start", "POST"],
    ["/api/v1/admin/dashboard/refresh/cancel", "POST"],
    ["/api/v1/admin/dashboard/refresh/retry", "POST"]
  ]) {
    const response = await router(new Request("https://api.example.test" + path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: "{}"
    }), {});
    assert.equal(response.status, 401, path);
  }
});
