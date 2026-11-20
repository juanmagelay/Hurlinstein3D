const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

const getGlobal = loadScripts();
getGlobal("getCell = function () { return 0; }");
const playerHitPoints = getGlobal("gameSettings.playerHitPoints");
const damagePlayer = getGlobal("damagePlayer");
const isPlayerDefeated = getGlobal("isPlayerDefeated");
const getContactDamage = getGlobal("getContactDamage");
const contactDistance = getGlobal("contactDistance");
const contactDamagePerSecond = getGlobal("contactDamagePerSecond");
const enemiesByChunk = getGlobal("enemiesByChunk");
const getChunkKey = getGlobal("getChunkKey");
const ticksPerSecond = getGlobal("ticksPerSecond");

test("the player starts at full health, 10 hit points by default", () => {
  assert.equal(playerHitPoints, 10);
  const player = getGlobal("player");
  assert.equal(player.health, 10);
  assert.equal(player.maxHealth, 10);
  assert.equal(isPlayerDefeated(player), false);
});

test("damage lowers health and clamps it at zero", () => {
  const player = { health: playerHitPoints, maxHealth: playerHitPoints };

  damagePlayer(player, 3);
  assert.equal(player.health, 7);
  assert.equal(isPlayerDefeated(player), false);

  damagePlayer(player, 1000);
  assert.equal(player.health, 0);
  assert.equal(isPlayerDefeated(player), true);
});

test("a touching enemy takes one hit point over one second", () => {
  enemiesByChunk.clear();
  enemiesByChunk.set(getChunkKey(0, 0), [{ posX: 0.6, posY: 0.5 }]);
  const player = { posX: 0.5, posY: 0.5 };

  assert.equal(contactDamagePerSecond, 1);
  assert.equal(getContactDamage(player, ticksPerSecond), 1);
});

test("an enemy beyond contact distance deals no damage", () => {
  enemiesByChunk.clear();
  enemiesByChunk.set(getChunkKey(0, 0), [{ posX: 0.5 + contactDistance + 1, posY: 0.5 }]);
  const player = { posX: 0.5, posY: 0.5 };

  assert.equal(getContactDamage(player, ticksPerSecond), 0);
});

test("god mode ignores every damage", () => {
  const world = loadScripts();
  world("gameSettings.godMode = true");
  const player = { health: 10, maxHealth: 10 };

  world("damagePlayer")(player, 5);
  assert.equal(player.health, 10);
});

test("new hit points restore full health with the new maximum", () => {
  const applyPlayerHitPoints = getGlobal("applyPlayerHitPoints");
  const player = { health: 0, maxHealth: 10 };

  applyPlayerHitPoints(player, 25);
  assert.equal(player.health, 25);
  assert.equal(player.maxHealth, 25);
  assert.equal(isPlayerDefeated(player), false);
});
