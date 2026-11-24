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

  assert.equal(damagePlayer(player, 3), true);
  assert.equal(player.health, 7);
  assert.equal(isPlayerDefeated(player), false);

  damagePlayer(player, 1000);
  assert.equal(player.health, 0);
  assert.equal(isPlayerDefeated(player), true);
});

// D-27c: no damage, no flash
test("zero damage leaves the health as it was and reports no hit", () => {
  const player = { health: 10, maxHealth: 10 };

  assert.equal(damagePlayer(player, 0), false);
  assert.equal(player.health, 10);
});

// D-27c: enemies at 0.4 cells, inside contactDistance (0.6), in chunk (0, 0)
function setTouchingEnemies(count) {
  const enemies = [];
  for (let index = 0; index < count; index += 1) {
    enemies.push({ posX: 0.9, posY: 0.5, hitWait: 0, contactDamage: 1 });
  }
  enemiesByChunk.clear();
  enemiesByChunk.set(getChunkKey(0, 0), enemies);
  return enemies;
}

test("a touching enemy hits one whole hit point on first contact", () => {
  setTouchingEnemies(1);
  const player = { posX: 0.5, posY: 0.5 };

  assert.equal(getContactDamage(player, 1), 1);
});

test("the next hit comes one second later, not before", () => {
  setTouchingEnemies(1);
  const player = { posX: 0.5, posY: 0.5 };

  assert.equal(getContactDamage(player, 1), 1);
  assert.equal(getContactDamage(player, ticksPerSecond - 1), 0);
  assert.equal(getContactDamage(player, 1), 1);
});

test("two touching enemies hit twice", () => {
  setTouchingEnemies(2);
  const player = { posX: 0.5, posY: 0.5 };

  assert.equal(getContactDamage(player, 1), 2);
});

test("stepping out and back in within the second gives no extra hit", () => {
  setTouchingEnemies(1);
  const player = { posX: 0.5, posY: 0.5 };
  assert.equal(getContactDamage(player, 1), 1);

  // Out of contact for half a second, then back in
  player.posX = -1;
  assert.equal(getContactDamage(player, ticksPerSecond / 2), 0);
  player.posX = 0.5;
  assert.equal(getContactDamage(player, 1), 0);

  // The wait ran down out of contact too, so the hit lands one second after the first
  assert.equal(getContactDamage(player, ticksPerSecond / 2 - 1), 1);
});

test("an enemy beyond contact distance deals no damage", () => {
  enemiesByChunk.clear();
  enemiesByChunk.set(getChunkKey(0, 0), [{ posX: 0.5 + contactDistance + 1, posY: 0.5, hitWait: 0 }]);
  const player = { posX: 0.5, posY: 0.5 };

  assert.equal(getContactDamage(player, ticksPerSecond), 0);
});

test("god mode ignores every damage and reports no hit", () => {
  const world = loadScripts();
  world("gameSettings.godMode = true");
  const player = { health: 10, maxHealth: 10 };

  assert.equal(world("damagePlayer")(player, 5), false);
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
