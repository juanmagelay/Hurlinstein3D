const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

const getGlobal = loadScripts();
const getHealthBarWidth = getGlobal("getHealthBarWidth");
const barSheetWidth = getGlobal("barSheetWidth");

test("the health fill width follows the health fraction", () => {
  assert.equal(getHealthBarWidth(1), barSheetWidth);
  assert.equal(getHealthBarWidth(0.5), barSheetWidth / 2);
  assert.equal(getHealthBarWidth(0), 0);
});

test("the health fill width is clamped between zero and the bar width", () => {
  assert.equal(getHealthBarWidth(-1), 0);
  assert.equal(getHealthBarWidth(2), barSheetWidth);
});
