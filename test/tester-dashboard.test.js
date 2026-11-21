import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { getTesterPage } from "../src/modules/tester/index.js";

async function getScripts() {
  const generated = await getTesterPage().text();
  const staticPage = await readFile(new URL("../public/tester.html", import.meta.url), "utf8");
  return [
    { name: "generated Tester route", html: generated },
    { name: "static Tester copy", html: staticPage }
  ].map(({ name, html }) => {
    const match = html.match(/<script>([\s\S]*?)<\/script>/);
    assert.ok(match, name + " must contain an inline script");
    return { name, script: match[1], html };
  });
}

describe("Tester Dashboard security and request contract", () => {
  test("both dashboard scripts parse as valid JavaScript", async () => {
    for (const item of await getScripts()) {
      assert.doesNotThrow(() => new vm.Script(item.script), item.name);
    }
  });

  test("dashboard binds API requests to its own HTTPS origin", async () => {
    for (const { name, html, script } of await getScripts()) {
      assert.match(script, /const API_ORIGIN = window\.location\.origin/);
      assert.match(script, /url\.origin !== currentOrigin\.origin/);
      assert.match(script, /redirect: 'error'/);
      assert.doesNotMatch(html, /id="baseUrl"/);
      assert.doesNotMatch(script, /localStorage\.(getItem|setItem)/);
      assert.ok(!script.includes("fetch(") || script.includes("fetch(url"));
      assert.ok(name);
    }
  });

  test("public, Admin, and User helpers keep their Authorization scopes separate", async () => {
    for (const { script } of await getScripts()) {
      const publicHelper = script.match(/async function apiRequest\\([\\s\\S]*?\\n        }/);
      const adminHelper = script.match(/async function adminRequest\\([\\s\\S]*?\\n        }/);
      const userHelper = script.match(/async function userRequest\\([\\s\\S]*?\\n        }/);
      assert.ok(publicHelper);
      assert.ok(adminHelper);
      assert.ok(userHelper);
      assert.doesNotMatch(publicHelper[0], /jwtToken|userAccessToken/);
      assert.match(publicHelper[0], /headers\\.delete\\('Authorization'\\)/);
      assert.match(adminHelper[0], /Bearer ' \\+ jwtToken/);
      assert.match(userHelper[0], /Bearer ' \\+ userAccessToken/);
      assert.match(script, /if \\(session === 'admin'\\) clearToken\\(true\\)/);
      assert.match(script, /if \\(session === 'user'\\) clearUserSession\\(true\\)/);
      assert.match(script, /session === 'user' && response\\.status === 403/);
      assert.match(script, /data\\.error === 'User account is unavailable'/);
    }
  });

  test("User login persists its access token in sessionStorage and clears it on logout", async () => {
    for (const { script } of await getScripts()) {
      assert.match(script, /const USER_SESSION_KEY = 'dekeku_user_access_token'/);
      assert.match(script, /sessionStorage\\.getItem\\(USER_SESSION_KEY\\)/);
      assert.match(script, /sessionStorage\\.setItem\\(USER_SESSION_KEY, res\\.data\\.access_token\\)/);
      assert.match(script, /sessionStorage\\.removeItem\\(USER_SESSION_KEY\\)/);
      assert.match(script, /async function testUserLogin\\(/);
      assert.match(script, /async function loadUserRepositories\\(/);
      assert.match(script, /function clearUserSession\\(/);
      assert.match(script, /Token is kept in memory only/);
      assert.doesNotMatch(script, /localStorage\\.(getItem|setItem)/);
      assert.doesNotMatch(script, /innerText = .*userAccessToken/);
    }
  });

  test("Guestbook sends JSON, blocks duplicate submits, and resets only on success", async () => {
    for (const { script } of await getScripts()) {
      assert.match(script, /Content-Type': 'application\/json'/);
      assert.match(script, /if \(guestbookSubmitting\) return/);
      assert.match(script, /res\.status === 201 && res\.data && res\.data\.success === true/);
      assert.match(script, /finally \{/);
    }
  });
});
