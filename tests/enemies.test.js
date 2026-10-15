const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

// An all-air world so any neighbour is a valid patrol step. Math.random always
// picks the first neighbour (+X) to keep the patrol deterministic. The player
// stays far away so patrol tests never trigger the chase state.
const getGlobal = loadScripts();
getGlobal("getCell = function (x, y) { return 0; }");
getGlobal("Math.random = function () { return 0; }");
const updateEnemies = getGlobal("updateEnemies");
const startPatrol = getGlobal("startPatrol");
const hasLineOfSight = getGlobal("hasLineOfSight");
const enemiesByChunk = getGlobal("enemiesByChunk");
const enemiesByCell = getGlobal("enemiesByCell");
const getChunkKey = getGlobal("getChunkKey");
const getEnemiesAtCell = getGlobal("getEnemiesAtCell");
const registerEnemyAtCell = getGlobal("registerEnemyAtCell");
const enemyIdleTicks = getGlobal("enemyIdleTicks");
const enemyLoseSightTicks = getGlobal("enemyLoseSightTicks");
const ticksPerSecond = getGlobal("ticksPerSecond");
const farPlayer = { posX: 100.5, posY: 100.5 };

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

  updateEnemies(farPlayer, enemyIdleTicks - 1);
  assert.equal(enemy.state, "idle");

  updateEnemies(farPlayer, 1);
  assert.equal(enemy.state, "patrol");
  assert.equal(enemy.patrolB.x, 6.5);
  assert.equal(enemy.patrolB.y, 5.5);
});

test("patrolling covers one cell per second and keeps the registry in sync", () => {
  resetWorld();
  const enemy = addEnemy();
  startPatrol(enemy);

  updateEnemies(farPlayer, ticksPerSecond / 2);

  assert.equal(enemy.posX, 6);
  assert.equal(enemy.cellX, 6);
  assert.ok(getEnemiesAtCell(6, 5).includes(enemy));
  assert.equal(getEnemiesAtCell(5, 5).includes(enemy), false);
});

test("patrol oscillates between the two route cells", () => {
  resetWorld();
  const enemy = addEnemy();
  startPatrol(enemy);

  updateEnemies(farPlayer, ticksPerSecond);
  assert.equal(enemy.posX, 6.5);
  assert.equal(enemy.patrolTargetIsB, false);

  updateEnemies(farPlayer, ticksPerSecond);
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

  walledUpdateEnemies(farPlayer, walledIdleTicks);

  assert.equal(enemy.state, "idle");
});

// A world with a single wall cell that can be switched on, to test how line of
// sight changes while the enemy is chasing.
const losGlobal = loadScripts();
losGlobal("wallOn = false");
losGlobal("getCell = function (x, y) { return (wallOn && x === 7 && y === 5) ? 1 : 0; }");
losGlobal("Math.random = function () { return 0; }");
const losUpdateEnemies = losGlobal("updateEnemies");
const losChunks = losGlobal("enemiesByChunk");
const losChunkKey = losGlobal("getChunkKey");
const losHasLineOfSight = losGlobal("hasLineOfSight");
const losSetWall = (value) => losGlobal(`wallOn = ${value}`);
const chasePlayer = { posX: 10.5, posY: 5.5 };

function addLosEnemy() {
  const enemy = {
    id: 3,
    posX: 5.5,
    posY: 5.5,
    cellX: 5,
    cellY: 5,
    size: 0.5,
    state: "idle",
    stateTime: 0,
  };
  losChunks.set(losChunkKey(0, 0), [enemy]);
  return enemy;
}

test("a clear close player is seen and lost by the wall check", () => {
  const enemy = { posX: 5.5, posY: 5.5 };

  losSetWall(false);
  assert.equal(losHasLineOfSight(enemy, chasePlayer), true);

  losSetWall(true);
  assert.equal(losHasLineOfSight(enemy, chasePlayer), false);
});

test("an enemy in patrol starts chasing a player it can see", () => {
  losChunks.clear();
  const enemy = addLosEnemy();
  enemy.state = "patrol";
  enemy.patrolA = { x: 5.5, y: 5.5 };
  enemy.patrolB = { x: 6.5, y: 5.5 };
  enemy.patrolTargetIsB = true;
  losSetWall(false);

  losUpdateEnemies(chasePlayer, 1);
  assert.equal(enemy.state, "chase");

  // 2 cells per second: half a second covers one cell.
  losUpdateEnemies(chasePlayer, ticksPerSecond / 2);
  assert.equal(enemy.posX, 6.5);
});

test("chasing enemy returns to patrol after losing sight for one second", () => {
  losChunks.clear();
  const enemy = addLosEnemy();
  enemy.state = "chase";
  enemy.stateTime = 0;
  losSetWall(true);

  losUpdateEnemies(chasePlayer, enemyLoseSightTicks - 1);
  assert.equal(enemy.state, "chase");

  losUpdateEnemies(chasePlayer, 1);
  assert.equal(enemy.state, "patrol");
});
