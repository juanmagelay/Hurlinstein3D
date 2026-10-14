// Loads the js/ files into one vm context, in index.html order (TDD 6.2),
// so tests see the same globals the browser sees.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.join(__dirname, "..");

// main.js starts Pixi and needs a browser, so tests skip it
const browserOnlyScripts = ["js/main.js"];

function readScriptOrder() {
  const html = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
  const scriptTags = html.matchAll(/<script src="(js\/[^"]+)"><\/script>/g);
  const scriptPaths = Array.from(scriptTags, (tag) => tag[1]);
  return scriptPaths.filter((scriptPath) => !browserOnlyScripts.includes(scriptPath));
}

// Returns a function that reads a global by name, for example getGlobal("getCell").
// Top level const values are not properties of the context object, so names are
// evaluated inside the context instead.
function loadScripts() {
  const context = vm.createContext({});
  for (const scriptPath of readScriptOrder()) {
    const code = fs.readFileSync(path.join(rootDir, scriptPath), "utf8");
    vm.runInContext(code, context, { filename: scriptPath });
  }
  return (name) => vm.runInContext(name, context);
}

module.exports = { loadScripts };
