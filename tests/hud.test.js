const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

const getGlobal = loadScripts();
const getHealthBarWidth = getGlobal("getHealthBarWidth");
const getAmmoBarWidth = getGlobal("getAmmoBarWidth");
const barSheetWidth = getGlobal("barSheetWidth");
const magazineSize = getGlobal("magazineSize");
const ammoBarDataUri = getGlobal("ammoBarDataUri");

test("the health fill width follows the health fraction", () => {
  assert.equal(getHealthBarWidth(1), barSheetWidth);
  assert.equal(getHealthBarWidth(0.5), barSheetWidth / 2);
  assert.equal(getHealthBarWidth(0), 0);
});

test("the health fill width is clamped between zero and the bar width", () => {
  assert.equal(getHealthBarWidth(-1), 0);
  assert.equal(getHealthBarWidth(2), barSheetWidth);
});

test("the six-round ammo bar is embedded as a data URI", () => {
  assert.equal(magazineSize, 6);
  assert.match(ammoBarDataUri, /^data:image\/png;base64,/);
});

test("the ammo fill width follows the loaded fraction of the magazine", () => {
  assert.equal(getAmmoBarWidth(6, 6), barSheetWidth);
  assert.equal(getAmmoBarWidth(3, 6), barSheetWidth / 2);
  assert.equal(getAmmoBarWidth(0, 6), 0);
});

test("the ammo fill width is clamped", () => {
  assert.equal(getAmmoBarWidth(-1, 6), 0);
  assert.equal(getAmmoBarWidth(9, 6), barSheetWidth);
});
