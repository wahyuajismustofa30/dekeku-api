import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { getTesterPage } from "../src/modules/tester/index.js";

async function getPages() {
  const generated = await getTesterPage().text();
  const staticPage = await readFile(new URL("../public/tester.html", import.meta.url), "utf8");
  return [
    { name: "Worker-served Tester", html: generated },
    { name: "static Tester copy", html: staticPage }
  ].map((page) => {
    const match = page.html.match(/<script>([\s\S]*?)<\/script>/);
    assert.ok(match, page.name + " must contain an inline script");
    return { ...page, script: match[1] };
  });
}

test("both Tester copies expose project-aware file manager controls", async () => {
  for (const page of await getPages()) {
    for (const id of [
      "panel-files",
      "projectOriginInput",
      "projectConnectionStatus",
      "fileTableBody",
      "fileJsonEditor",
      "newFileName",
      "saveFileButton",
      "deleteFileButton"
    ]) {
      assert.ok(page.html.includes('id="' + id + '"'), page.name + " missing " + id);
    }
    assert.match(page.html, /Public JSON File Manager/);
    assert.match(page.html, /File manager/);
  }
});

test("file manager scripts parse and use the allowlisted project selector header", async () => {
  for (const page of await getPages()) {
    assert.doesNotThrow(() => new vm.Script(page.script), page.name);
    assert.match(page.script, /X-DEKEKU-Project-Origin/);
    assert.match(page.script, /sessionStorage\.setItem\(PROJECT_ORIGIN_KEY/);
    assert.match(page.script, /\/api\/v1\/admin\/browse/);
    assert.match(page.script, /\/api\/v1\/admin\/write\/file/);
  }
});

test("file manager renders repository names with textContent and uses SHA before mutation", async () => {
  for (const page of await getPages()) {
    assert.match(page.script, /nameButton\.textContent =/);
    assert.match(page.script, /cell\.textContent =/);
    assert.match(page.script, /adminRequest\('\/api\/v1\/admin\/write\/sha\?path='/);
    assert.match(page.script, /\/api\/v1\/admin\/write\/update/);
    assert.match(page.script, /\/api\/v1\/admin\/write\/delete/);
    assert.match(page.script, /window\.confirm\(/);
    assert.doesNotMatch(page.script, /\.innerHTML\s*=/);
  }
});
