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
      assert.doesNotMatch(script, /localStorage\\.(getItem|setItem)/);
      assert.ok(!script.includes("fetch(") || script.includes("fetch(url"));
      assert.ok(name);
    }
  });

  test("only the administrative helper attaches the JWT", async () => {
    for (const { script } of await getScripts()) {
      const publicHelper = script.match(/async function apiRequest\([\s\S]*?\n        }/);
      const adminHelper = script.match(/async function adminRequest\([\s\S]*?\n        }/);
      assert.ok(publicHelper);
      assert.ok(adminHelper);
      assert.doesNotMatch(publicHelper[0], /Authorization|jwtToken/);
      assert.match(adminHelper[0], /Authorization/);
      assert.match(script, /if \(response\.status === 401\) clearToken\(\)/);
      assert.match(script, /function clearToken\(\)/);
    }
  });

  test("login consumes access_token without displaying or persisting it", async () => {
    for (const { script } of await getScripts()) {
      assert.match(script, /res\.data\.access_token/);
      assert.doesNotMatch(script, /res\.data\.token/);
      assert.match(script, /Token is kept in memory only/);
      assert.doesNotMatch(script, /localStorage\\.(getItem|setItem)/);
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
