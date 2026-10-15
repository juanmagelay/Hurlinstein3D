const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

// An all-air world so any neighbour is a valid patrol step. Math.random always
// picks the first neighbour (+X) to keep the patrol deterministic.
const getGlobal = loadScripts();
getGlobal("getCell = function (x, y) { return 0; }");
getGlobal("Math.random = function () { return 0; }");
const updateEnemies = getGlobal("updateEnemies");
const startPatrol = getGlobal("startPatrol");
const enemiesByChunk = getGlobal("enemiesByChunk");
const enemiesByCell = getGlobal("enemiesByCell");
const getChunkKey = getGlobal("getChunkKey");
const getEnemiesAtCell = getGlobal("getEnemiesAtCell");
const registerEnemyAtCell = getGlobal("registerEnemyAtCell");
const enemyIdleTicks = getGlobal("enemyIdleTicks");
const ticksPerSecond = getGlobal("ticksPerSecond");

function resetWorld() {
  enemiesByChunk.clear();
  enemiesByCell.clear();
}

function addEnemy() {
  const enemy = {
    id: 1,
    posX: 5.5,
    posY: 5.5,
    cellX: 5,
    cellY: 5,
    size: 0.5,
    state: "idle",
    stateTime: 0,
  };
  enemiesByChunk.set(getChunkKey(0, 0), [enemy]);
  registerEnemyAtCell(enemy);
  return enemy;
}

test("an idle enemy starts patrolling after two seconds", () => {
  resetWorld();
  const enemy = addEnemy();

  updateEnemies(enemyIdleTicks - 1);
  assert.equal(enemy.state, "idle");

  updateEnemies(1);
  assert.equal(enemy.state, "patrol");
  assert.equal(enemy.patrolB.x, 6.5);
  assert.equal(enemy.patrolB.y, 5.5);
});

test("patrolling covers one cell per second and keeps the registry in sync", () => {
  resetWorld();
  const enemy = addEnemy();
  startPatrol(enemy);

  updateEnemies(ticksPerSecond / 2);

  assert.equal(enemy.posX, 6);
  assert.equal(enemy.cellX, 6);
  assert.ok(getEnemiesAtCell(6, 5).includes(enemy));
  assert.equal(getEnemiesAtCell(5, 5).includes(enemy), false);
});

test("patrol oscillates between the two route cells", () => {
  resetWorld();
  const enemy = addEnemy();
  startPatrol(enemy);

  updateEnemies(ticksPerSecond);
  assert.equal(enemy.posX, 6.5);
  assert.equal(enemy.patrolTargetIsB, false);

  updateEnemies(ticksPerSecond);
  assert.equal(enemy.posX, 5.5);
  assert.equal(enemy.patrolTargetIsB, true);
});

// A single air cell surrounded by walls: the enemy has nowhere to patrol.
const walledGlobal = loadScripts();
walledGlobal("getCell = function (x, y) { return (x === 5 && y === 5) ? 0 : 1; }");
walledGlobal("Math.random = function () { return 0; }");
const walledUpdateEnemies = walledGlobal("updateEnemies");
const walledChunks = walledGlobal("enemiesByChunk");
const walledChunkKey = walledGlobal("getChunkKey");
const walledIdleTicks = walledGlobal("enemyIdleTicks");

test("an enemy with no open neighbour stays idle", () => {
  const enemy = {
    id: 2,
    posX: 5.5,
    posY: 5.5,
    cellX: 5,
    cellY: 5,
    size: 0.5,
    state: "idle",
    stateTime: 0,
  };
  walledChunks.set(walledChunkKey(0, 0), [enemy]);

  walledUpdateEnemies(walledIdleTicks);

  assert.equal(enemy.state, "idle");
});
