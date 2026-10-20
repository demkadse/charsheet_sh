// Execute the real generator twice while intercepting every write in memory.
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import path from "node:path";
import * as url from "node:url";
import vm from "node:vm";

const root = url.fileURLToPath(new URL("../", import.meta.url));
const generatorUrl = new URL("../scripts/build-pages.mjs", import.meta.url);
const source = await fs.readFile(generatorUrl, "utf8");

async function render() {
  const output = new Map();
  const context = vm.createContext({ URL, console: { log() {} } });
  const fsExports = {
    readFile: fs.readFile,
    readdir: fs.readdir,
    async writeFile(filename, content) {
      assert.equal(path.dirname(filename), path.join(root, "characters"));
      assert.ok(!output.has(filename), `Duplicate output: ${filename}`);
      output.set(filename, content);
    }
  };
  const dependencies = new Map([
    ["node:fs/promises", fsExports],
    ["node:url", { fileURLToPath: url.fileURLToPath }],
    ["node:path", { default: path }],
    ["node:vm", { default: vm }]
  ]);
  const module = new vm.SourceTextModule(source, {
    context,
    initializeImportMeta(meta) { meta.url = generatorUrl.href; }
  });
  await module.link((specifier) => {
    const exports = dependencies.get(specifier);
    assert.ok(exports, `Unexpected generator dependency: ${specifier}`);
    return new vm.SyntheticModule(Object.keys(exports), function () {
      for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
    }, { context });
  });
  await module.evaluate();
  return output;
}

const first = await render();
const definitions = (await fs.readdir(path.join(root, "js/data/characters"))).filter(file => file.endsWith(".js"));
assert.equal(first.size, definitions.length);
assert.deepEqual(await render(), first, "Generator must be deterministic");
for (const [filename, html] of first) {
  assert.equal(await fs.readFile(filename, "utf8"), html, `Stale generated page: ${filename}`);
  assert.ok(!/\{\{\w+\}\}/.test(html), `Unresolved template placeholder: ${filename}`);
}
console.log(`${first.size} generated pages match; repeated rendering is deterministic; no files written.`);
