const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

// Loads a fresh world and dirties it: a far chunk, enemies and a hurt,
// mid-reload player. Returns the world accessor.
function makeDirtyWorld() {
  const world = loadScripts();
  const player = world("player");
  world("getChunkCells")(5, 5);
  world("placeGameEnemies")(player, 10);
  player.health = 2;
  player.ammo = 1;
  player.reloadsLeft = 0;
  player.reloading = true;
  player.reloadTime = 3;
  return world;
}

test("resetGame clears the old chunks and enemies (D-17a)", () => {
  const world = makeDirtyWorld();
  const getChunkKey = world("getChunkKey");

  world("resetGame")();

  // The far chunk is gone; only the freshly generated chunk (0, 0) remains
  assert.equal(world("generatedChunks").has(getChunkKey(5, 5)), false);
  assert.equal(world("generatedChunks").size, 1);
  assert.equal(world("generatedChunks").has(getChunkKey(0, 0)), true);
  // No enemies are left
  assert.equal(world("enemiesByChunk").size, 0);
  assert.equal(world("enemiesByCell").size, 0);
});

test("resetGame respawns the player with full health and a full magazine (D-17a)", () => {
  const world = makeDirtyWorld();
  const getCell = world("getCell");
  const playerHitPoints = world("gameSettings.playerHitPoints");
  const magazineSize = world("gameSettings.magazineSize");

  world("resetGame")();

  const player = world("player");
  const spawn = world("getSpawnPosition")();
  // Standing on an air cell at the new spawn, facing east
  assert.equal(player.posX, spawn.x);
  assert.equal(player.posY, spawn.y);
  assert.equal(getCell(Math.floor(player.posX), Math.floor(player.posY)), 0);
  assert.equal(player.dirX, 1);
  assert.equal(player.dirY, 0);
  // Full health, a full magazine and no reload in progress
  assert.equal(player.health, playerHitPoints);
  assert.equal(player.maxHealth, playerHitPoints);
  assert.equal(player.ammo, magazineSize);
  assert.equal(player.reloading, false);
  assert.equal(player.reloadTime, 0);
  assert.equal(player.reloadsLeft, world("getReloadAllowance")(world("gameSettings")));
});

test("resetGame clears the kill count (D-19a)", () => {
  const world = makeDirtyWorld();
  world("addKill")();
  world("addKill")();

  world("resetGame")();

  assert.equal(world("getKillCount")(), 0);
});
