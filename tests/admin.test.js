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
  assert.equal(formatAdminAmmo(4, 6, false, Infinity), "4 / 6");
  assert.equal(formatAdminAmmo(0, 6, true, 2), "0 / 6, 2 reloads left, reloading");
});

test("enemies are counted across every loaded chunk", () => {
  const world = loadScripts();
  world("enemiesByChunk.clear()");
  world("enemiesByChunk.set(1, [{}, {}]); enemiesByChunk.set(2, []); enemiesByChunk.set(3, [{}])");
  assert.equal(world("countLoadedEnemies()"), 3);
});

test("D-24: enemies alive read against the game total", () => {
  const formatAdminEnemiesAlive = getGlobal("formatAdminEnemiesAlive");
  assert.equal(formatAdminEnemiesAlive(87, 100), "87 / 100");
  assert.equal(formatAdminEnemiesAlive(12345, 100000), "12,345 / 100,000");
});

test("D-23: the active enemies are the ones near the player, or all with the toggle off", () => {
  const world = loadScripts();
  world("enemiesByChunk.clear()");
  world("enemiesByChunk.set(getChunkKey(0, 0), [{}, {}]); enemiesByChunk.set(getChunkKey(3, 0), [{}])");
  const player = { posX: 5.5, posY: 5.5 };
  assert.equal(world("countActiveEnemies")(player), 2);
  world("gameSettings.activeAreaOnly = false");
  assert.equal(world("countActiveEnemies")(player), 3);
});

test("every live value is text, ready for textContent", () => {
  const info = getGlobal("getAdminInfo")(getGlobal("player"), 59.6);
  assert.equal(info.fps, "60");
  for (const name of ["fps", "position", "chunk", "health", "ammo", "enemies", "active", "chunks"]) {
    assert.equal(typeof info[name], "string", name);
  }
});

test("keys typed into a panel field are recognized, so the game can ignore them", () => {
  const isTypingInField = getGlobal("isTypingInField");
  assert.equal(isTypingInField({ target: { tagName: "INPUT" } }), true);
  assert.equal(isTypingInField({ target: { tagName: "BUTTON" } }), false);
  assert.equal(isTypingInField({ target: { tagName: "BODY", isContentEditable: false } }), false);
});

// D-16c1: settings changed from the panel
function createMemoryStorage() {
  const items = new Map();
  return { getItem: (key) => items.get(key) ?? null, setItem: (key, value) => items.set(key, value), items };
}

test("a field value is clamped, applied to the player and saved", () => {
  const world = loadScripts();
  const storage = createMemoryStorage();
  const player = { health: 3, maxHealth: 10, ammo: 6, reloadsLeft: Infinity };

  assert.equal(world("changeSetting")(player, storage, "playerHitPoints", "500"), 100);
  assert.equal(player.health, 100);
  assert.equal(player.maxHealth, 100);

  world("changeSetting")(player, storage, "magazineSize", "3");
  assert.equal(player.ammo, 3);

  world("changeSetting")(player, storage, "unlimitedReloads", false);
  assert.equal(player.reloadsLeft, 5);

  const saved = JSON.parse(storage.items.get(world("settingsStorageKey")));
  assert.equal(saved.playerHitPoints, 100);
  assert.equal(saved.magazineSize, 3);
  assert.equal(saved.unlimitedReloads, false);
});

test("turn speed and god mode only change the setting, the game reads them every frame", () => {
  const world = loadScripts();
  const player = { health: 4, maxHealth: 10, ammo: 2, reloadsLeft: 1 };

  world("changeSetting")(player, createMemoryStorage(), "turnSpeed", "200");
  world("changeSetting")(player, createMemoryStorage(), "godMode", true);
  assert.equal(world("gameSettings.turnSpeed"), 200);
  assert.equal(world("gameSettings.godMode"), true);
  assert.deepEqual(player, { health: 4, maxHealth: 10, ammo: 2, reloadsLeft: 1 });
});

test("D-24: a new total from the panel places that many enemies around the player", () => {
  const world = loadScripts();
  const player = { posX: 8.5, posY: 8.5, health: 10, maxHealth: 10, ammo: 6, reloadsLeft: Infinity };

  world("changeSetting")(player, createMemoryStorage(), "enemiesPerGame", "100");
  assert.equal(world("countLoadedEnemies()"), 100);
  world("changeSetting")(player, createMemoryStorage(), "enemiesPerGame", "30");
  assert.equal(world("countLoadedEnemies()"), 30);
});

test("Reset puts the defaults back on the settings and the player", () => {
  const world = loadScripts();
  const storage = createMemoryStorage();
  // D-24: Reset places the default 20 enemies around this position
  const player = { posX: 8.5, posY: 8.5, health: 1, maxHealth: 30, ammo: 15, reloadsLeft: 2 };
  world("gameSettings.magazineSize = 20; gameSettings.turnSpeed = 300; gameSettings.unlimitedReloads = false");

  world("resetSettings")(player, storage);
  assert.equal(world("gameSettings.magazineSize"), 6);
  assert.equal(world("gameSettings.turnSpeed"), 120);
  assert.equal(player.health, 10);
  assert.equal(player.ammo, 6);
  assert.equal(player.reloadsLeft, Infinity);
  assert.equal(world("countLoadedEnemies()"), 20);
  assert.equal(JSON.parse(storage.items.get(world("settingsStorageKey"))).turnSpeed, 120);
});
