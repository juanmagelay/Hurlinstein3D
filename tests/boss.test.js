const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

function findBoss(world) {
  return world("[...enemiesByChunk.values()].flat().find((enemy) => enemy.isBoss) || null");
}

// Registers one enemy straight ahead of the player, on its ray
function addEnemyAhead(world, player, overrides = {}) {
  const enemy = {
    posX: player.posX + 2,
    posY: player.posY,
    cellX: Math.floor(player.posX + 2),
    cellY: Math.floor(player.posY),
    chunkX: Math.floor((player.posX + 2) / 16),
    chunkY: Math.floor(player.posY / 16),
    width: world("enemyWidth"),
    height: 0.6,
    color: world("enemyColor"),
    health: 1,
    contactDamage: 1,
    state: "idle",
    stateTime: 0,
    hitWait: 0,
    ...overrides,
  };
  const key = world("getChunkKey")(enemy.chunkX, enemy.chunkY);
  if (!world("enemiesByChunk").has(key)) {
    world("enemiesByChunk").set(key, []);
  }
  world("enemiesByChunk").get(key).push(enemy);
  world("registerEnemyAtCell")(enemy);
  return enemy;
}

// Air world with the real chunk generator (spawnBoss reads getChunkCells)
function makeShotWorld() {
  const world = loadScripts();
  world("getCell = function (x, y) { return 0; }");
  return world;
}

test("spawnBoss places one boss on an air cell with its hit points", () => {
  const world = loadScripts();
  const boss = world("spawnBoss")(world("player"));

  assert.notEqual(boss, null);
  assert.equal(boss.isBoss, true);
  assert.equal(boss.health, world("bossHealth"));
  assert.equal(world("getCell")(boss.cellX, boss.cellY), 0);
  assert.ok(world("getEnemiesAtCell")(boss.cellX, boss.cellY).includes(boss));
});

function countBosses(world) {
  return world("[...enemiesByChunk.values()].flat().filter((enemy) => enemy.isBoss).length");
}

test("D-38: the boss appears in a door neighbor, out of the player's sight", () => {
  const world = loadScripts();
  world("resetGame")(4242);
  const player = world("player");
  const boss = world("spawnBoss")(player);
  const playerChunkX = Math.floor(player.posX / 16);
  const playerChunkY = Math.floor(player.posY / 16);

  assert.equal(Math.abs(boss.chunkX - playerChunkX) + Math.abs(boss.chunkY - playerChunkY), 1);
  assert.ok(world("isHiddenFromPlayer")(boss.posX, boss.posY, player));
});

test("D-38: spawning again brings the same boss near the player instead of a second one", () => {
  const world = loadScripts();
  const spawnBoss = world("spawnBoss");
  const first = spawnBoss(world("player"));
  // The player walked three chunks east
  const movedPlayer = { posX: 56.5, posY: 8.5 };

  const second = spawnBoss(movedPlayer);

  assert.equal(second, first);
  assert.equal(countBosses(world), 1);
  assert.equal(Math.abs(second.chunkX - 3) + Math.abs(second.chunkY - 0), 1);
});

test("D-38: the boss can spawn again after a new total wiped it", () => {
  const world = loadScripts();
  const player = world("player");
  world("spawnBoss")(player);
  world("placeGameEnemies")(player, 5);
  assert.equal(countBosses(world), 0);

  assert.notEqual(world("spawnBoss")(player), null);
  assert.equal(countBosses(world), 1);
});

test("D-38: a regular kill past the target leaves the live boss where it is", () => {
  const world = makeShotWorld();
  const player = world("player");
  world("gameSettings.enemiesPerGame = 1");
  const boss = world("spawnBoss")(player);
  const cellX = boss.cellX;
  const cellY = boss.cellY;
  addEnemyAhead(world, player);

  world("shootCenterRay")(player);

  assert.equal(boss.cellX, cellX);
  assert.equal(boss.cellY, cellY);
  assert.equal(countBosses(world), 1);
});

test("no boss spawns before the kill target", () => {
  const world = makeShotWorld();
  const player = world("player");
  world("gameSettings.enemiesPerGame = 5");
  addEnemyAhead(world, player);

  world("shootCenterRay")(player);

  assert.equal(world("getKillCount")(), 1);
  assert.equal(findBoss(world), null);
});

test("the boss spawns when the kill count reaches the target", () => {
  const world = makeShotWorld();
  const player = world("player");
  world("gameSettings.enemiesPerGame = 1");
  addEnemyAhead(world, player);

  world("shootCenterRay")(player);

  assert.equal(world("getKillCount")(), 1);
  assert.notEqual(findBoss(world), null);
});

test("killing the boss sets the victory state", () => {
  const world = makeShotWorld();
  const player = world("player");
  world("setGameState")(world("gameStatePlaying"));
  addEnemyAhead(world, player, { isBoss: true, health: 1, color: world("bossColor") });

  world("shootCenterRay")(player);

  assert.equal(world("getGameState")(), world("gameStateVictory"));
});

test("killing a regular enemy does not set victory", () => {
  const world = makeShotWorld();
  const player = world("player");
  world("setGameState")(world("gameStatePlaying"));
  addEnemyAhead(world, player);

  world("shootCenterRay")(player);

  assert.equal(world("getGameState")(), world("gameStatePlaying"));
});
