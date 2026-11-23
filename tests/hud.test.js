const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

const getGlobal = loadScripts();
const getHealthBarWidth = getGlobal("getHealthBarWidth");
const getAmmoBarWidth = getGlobal("getAmmoBarWidth");
const barSheetWidth = getGlobal("barSheetWidth");
const magazineSize = getGlobal("gameSettings.magazineSize");
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

test("LIFE and AMMO rows sit in the top-left corner, one under the other", () => {
  const getHudRowY = getGlobal("getHudRowY");
  const getHudBarX = getGlobal("getHudBarX");
  const barBandHeight = getGlobal("barBandHeight");

  // Bars start after the 16 px margin and the 56 px label column
  assert.equal(getHudBarX(), 72);
  assert.equal(getHudRowY(0), 16);
  assert.equal(getHudRowY(1), 40);
  // An 8 px gap between rows, so the bars never overlap
  assert.equal(getHudRowY(1) - getHudRowY(0) - barBandHeight, 8);
});

test("the ammo fill width is clamped", () => {
  assert.equal(getAmmoBarWidth(-1, 6), 0);
  assert.equal(getAmmoBarWidth(9, 6), barSheetWidth);
});

test("the ammo bar draws any magazine size from 2 to 20 as a fraction", () => {
  assert.equal(getAmmoBarWidth(2, 2), barSheetWidth);
  assert.equal(getAmmoBarWidth(10, 20), barSheetWidth / 2);
  assert.equal(getAmmoBarWidth(1, 2), barSheetWidth / 2);
});

// D-16c1: reloads left, as x3, after the ammo bar and an 8 px gap
test("the reload counter reads x3 and sits right of the ammo bar", () => {
  assert.equal(getGlobal("formatReloadCounter")(3), "x3");
  assert.equal(getGlobal("getReloadCounterX")(), 72 + 98 + 8);
});

test("the reload counter only shows while reloads are limited", () => {
  const updateReloadCounter = getGlobal("updateReloadCounter");
  const counter = { text: "x0", visible: false };

  updateReloadCounter(counter, 2);
  assert.equal(counter.visible, true);
  assert.equal(counter.text, "x2");

  updateReloadCounter(counter, Infinity);
  assert.equal(counter.visible, false);
});

// D-19a: the kill count under AMMO
test("the kills label reads KILLS x / total on the row under AMMO", () => {
  assert.equal(getGlobal("formatKillsLabel")(3, 20), "KILLS 3 / 20");
  assert.equal(getGlobal("getHudRowY")(2), 64);
});

// D-27d: the damage flash fades from full to zero in damageFlashDuration (0.4 s)
test("the damage flash is full after a hit, half at 0.2 s and gone at 0.4 s", () => {
  const getDamageFlashAlpha = getGlobal("getDamageFlashAlpha");

  assert.equal(getGlobal("damageFlashDuration"), 0.4);
  assert.equal(getDamageFlashAlpha(0), 1);
  assert.ok(Math.abs(getDamageFlashAlpha(0.2) - 0.5) < 1e-9);
  assert.equal(getDamageFlashAlpha(0.4), 0);
  assert.equal(getDamageFlashAlpha(1), 0);
});

test("one hit gives one pulse, and no hit gives no flash", () => {
  const triggerDamageFlash = getGlobal("triggerDamageFlash");
  const updateDamageFlash = getGlobal("updateDamageFlash");
  const flash = { sprite: { alpha: 0 }, time: getGlobal("damageFlashDuration") };

  updateDamageFlash(flash, 12);
  assert.equal(flash.sprite.alpha, 0);

  triggerDamageFlash(flash);
  assert.equal(flash.sprite.alpha, 1);

  // 12 ticker units are 0.2 s
  updateDamageFlash(flash, 12);
  assert.ok(Math.abs(flash.sprite.alpha - 0.5) < 1e-9);
  updateDamageFlash(flash, 12);
  assert.equal(flash.sprite.alpha, 0);
  updateDamageFlash(flash, 12);
  assert.equal(flash.sprite.alpha, 0);
});
