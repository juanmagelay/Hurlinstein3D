const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

const getGlobal = loadScripts();
getGlobal("getCell = function () { return 0; }");
const playerMaxHealth = getGlobal("playerMaxHealth");
const damagePlayer = getGlobal("damagePlayer");
const isPlayerDefeated = getGlobal("isPlayerDefeated");
const getContactDamage = getGlobal("getContactDamage");
const contactDistance = getGlobal("contactDistance");
const contactDamagePerSecond = getGlobal("contactDamagePerSecond");
const enemiesByChunk = getGlobal("enemiesByChunk");
const getChunkKey = getGlobal("getChunkKey");
const ticksPerSecond = getGlobal("ticksPerSecond");

test("the player starts at full health", () => {
  assert.equal(playerMaxHealth, 100);
  const player = getGlobal("player");
  assert.equal(player.health, 100);
  assert.equal(player.maxHealth, 100);
  assert.equal(isPlayerDefeated(player), false);
});

test("damage lowers health and clamps it at zero", () => {
  const player = { health: playerMaxHealth, maxHealth: playerMaxHealth };

  damagePlayer(player, 30);
  assert.equal(player.health, 70);
  assert.equal(isPlayerDefeated(player), false);

  damagePlayer(player, 1000);
  assert.equal(player.health, 0);
  assert.equal(isPlayerDefeated(player), true);
});

test("a touching enemy deals ten damage over one second", () => {
  enemiesByChunk.clear();
  enemiesByChunk.set(getChunkKey(0, 0), [{ posX: 0.6, posY: 0.5 }]);
  const player = { posX: 0.5, posY: 0.5 };

  assert.equal(contactDamagePerSecond, 10);
  assert.equal(getContactDamage(player, ticksPerSecond), 10);
});

test("an enemy beyond contact distance deals no damage", () => {
  enemiesByChunk.clear();
  enemiesByChunk.set(getChunkKey(0, 0), [{ posX: 0.5 + contactDistance + 1, posY: 0.5 }]);
  const player = { posX: 0.5, posY: 0.5 };

  assert.equal(getContactDamage(player, ticksPerSecond), 0);
});
