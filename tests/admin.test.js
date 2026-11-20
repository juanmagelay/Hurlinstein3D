// D-16b: pure helpers behind the admin panel live info
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

const getGlobal = loadScripts();

test("position shows two decimals, negatives included", () => {
  assert.equal(getGlobal("formatAdminPosition")(12.4691, -3.0849), "12.47, -3.08");
});

test("the chunk uses Math.floor, so -0.5 is chunk -1", () => {
  const formatAdminChunk = getGlobal("formatAdminChunk");
  assert.equal(formatAdminChunk(8.5, 8.5), "0, 0");
  assert.equal(formatAdminChunk(-0.5, 16), "-1, 1");
  assert.equal(formatAdminChunk(15.99, -16), "0, -1");
});

test("health is rounded up, so it only reads 0 at real defeat", () => {
  const formatAdminHealth = getGlobal("formatAdminHealth");
  assert.equal(formatAdminHealth(72.2, 100), "73 / 100");
  assert.equal(formatAdminHealth(0.1, 100), "1 / 100");
  assert.equal(formatAdminHealth(0, 100), "0 / 100");
});

test("ammo shows the magazine and the reload state", () => {
  const formatAdminAmmo = getGlobal("formatAdminAmmo");
  assert.equal(formatAdminAmmo(4, 6, false), "4 / 6");
  assert.equal(formatAdminAmmo(0, 6, true), "0 / 6, reloading");
});

test("enemies are counted across every loaded chunk", () => {
  const world = loadScripts();
  world("enemiesByChunk.clear()");
  world("enemiesByChunk.set(1, [{}, {}]); enemiesByChunk.set(2, []); enemiesByChunk.set(3, [{}])");
  assert.equal(world("countLoadedEnemies()"), 3);
});

test("every live value is text, ready for textContent", () => {
  const info = getGlobal("getAdminInfo")(getGlobal("player"), 59.6);
  assert.equal(info.fps, "60");
  for (const name of ["fps", "position", "chunk", "health", "ammo", "enemies", "chunks"]) {
    assert.equal(typeof info[name], "string", name);
  }
});

test("keys typed into a panel field are recognized, so the game can ignore them", () => {
  const isTypingInField = getGlobal("isTypingInField");
  assert.equal(isTypingInField({ target: { tagName: "INPUT" } }), true);
  assert.equal(isTypingInField({ target: { tagName: "BUTTON" } }), false);
  assert.equal(isTypingInField({ target: { tagName: "BODY", isContentEditable: false } }), false);
});
