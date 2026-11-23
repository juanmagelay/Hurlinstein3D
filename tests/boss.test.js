const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

function findBoss(world) {
  return world("[...enemiesByChunk.values()].flat().find((enemy) => enemy.isBoss) || null");
}

// Registers one regular enemy straight ahead of the player, on its ray
function addEnemyAhead(world, player) {
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

test("only one boss spawns per game", () => {
  const world = loadScripts();

  assert.notEqual(world("spawnBoss")(world("player")), null);
  assert.equal(world("spawnBoss")(world("player")), null);
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
