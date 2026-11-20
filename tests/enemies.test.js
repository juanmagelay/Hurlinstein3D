const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

// An all-air world so any neighbour is a valid patrol step. Math.random always
// picks the first neighbour (+X) to keep the patrol deterministic. The player
// stays 32 cells away, past the 24 cell sight distance, so patrol tests never
// trigger the chase state, but inside the active area of D-23 (chunk (0, 2)).
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
const gameSettings = getGlobal("gameSettings");
const farPlayer = { posX: 5.5, posY: 37.5 };

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
    chunkX: 0,
    chunkY: 0,
    width: 0.3,
    height: 0.6,
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
    chunkX: 0,
    chunkY: 0,
    width: 0.3,
    height: 0.6,
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
    chunkX: 0,
    chunkY: 0,
    width: 0.3,
    height: 0.6,
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

// A world with a single wall cell at (7, 5), so an enemy walking toward +X is
// stopped by the wall instead of passing through it.
const wallGlobal = loadScripts();
wallGlobal("getCell = function (x, y) { return (x === 7 && y === 5) ? 1 : 0; }");
const wallMoveEnemyToward = wallGlobal("moveEnemyToward");
const wallCanEnemyStandAt = wallGlobal("canEnemyStandAt");

test("an enemy stops at a wall instead of walking through it", () => {
  const enemy = { posX: 5.5, posY: 5.5 };

  for (let step = 0; step < 50; step += 1) {
    wallMoveEnemyToward(enemy, { x: 10.5, y: 5.5 }, 0.2);
  }

  assert.ok(enemy.posX > 5.5, "the enemy never moved");
  assert.ok(enemy.posX < 7, "the enemy entered the wall cell");
  assert.equal(wallCanEnemyStandAt(enemy.posX, enemy.posY), true);
  assert.equal(wallCanEnemyStandAt(enemy.posX + 0.2, enemy.posY), false);
});

// D-23: only the enemies in the 5 by 5 chunks around the player move
function addIdleEnemyAt(cellX, cellY) {
  const enemy = {
    id: cellX,
    posX: cellX + 0.5,
    posY: cellY + 0.5,
    cellX,
    cellY,
    chunkX: Math.floor(cellX / 16),
    chunkY: Math.floor(cellY / 16),
    width: 0.3,
    height: 0.6,
    state: "idle",
    stateTime: 0,
  };
  const chunkKey = getChunkKey(enemy.chunkX, enemy.chunkY);
  if (!enemiesByChunk.has(chunkKey)) {
    enemiesByChunk.set(chunkKey, []);
  }
  enemiesByChunk.get(chunkKey).push(enemy);
  registerEnemyAtCell(enemy);
  return enemy;
}

test("the active area reaches two chunks each way, enough for maxRayDistance", () => {
  assert.equal(getGlobal("activeChunkRadius"), 2);
});

test("an enemy three chunks away stays frozen, one in a neighbor chunk is updated", () => {
  resetWorld();
  const player = { posX: 5.5, posY: 5.5 };
  const neighbor = addIdleEnemyAt(21, 5);
  const far = addIdleEnemyAt(53, 5);

  updateEnemies(player, enemyIdleTicks);

  assert.equal(neighbor.state, "patrol");
  assert.equal(far.state, "idle");
  assert.equal(far.stateTime, 0);
});

test("with the active area off, every loaded enemy is updated, as before D-23", () => {
  resetWorld();
  const player = { posX: 5.5, posY: 5.5 };
  const far = addIdleEnemyAt(53, 5);

  gameSettings.activeAreaOnly = false;
  try {
    updateEnemies(player, enemyIdleTicks);
  } finally {
    gameSettings.activeAreaOnly = true;
  }

  assert.equal(far.state, "patrol");
});

test("an enemy that walks into the next chunk moves to that chunk's list", () => {
  resetWorld();
  const enemy = addIdleEnemyAt(15, 5);
  startPatrol(enemy);

  updateEnemies(farPlayer, ticksPerSecond);

  assert.equal(enemy.posX, 16.5);
  assert.equal(enemy.chunkX, 1);
  assert.equal(enemiesByChunk.get(getChunkKey(0, 0)).includes(enemy), false);
  assert.ok(enemiesByChunk.get(getChunkKey(1, 0)).includes(enemy));
});

// D-25: a real world, so the gathered enemies land on real air cells
function createGatherWorld() {
  const world = loadScripts();
  world("removeAllEnemies()");
  return world;
}

// An enemy on the first air cell of chunk (cx, cy)
function addEnemyInChunk(world, cx, cy) {
  const cells = [];
  world("addChunkAirCells")(cells, cx, cy);
  return world("addEnemyAtCell")(cells[0].x, cells[0].y);
}

function getEnemyChunkDistance(enemy, chunkX, chunkY) {
  return Math.max(Math.abs(enemy.chunkX - chunkX), Math.abs(enemy.chunkY - chunkY));
}

test("D-25: an enemy left three chunks behind reappears idle next to the player's chunk", () => {
  const world = createGatherWorld();
  const enemy = addEnemyInChunk(world, 3, 0);
  enemy.state = "chase";
  const oldCellX = enemy.cellX;
  const oldCellY = enemy.cellY;

  world("gatherFarEnemies")({ posX: 8.5, posY: 8.5 });

  assert.equal(getEnemyChunkDistance(enemy, 0, 0), 1);
  assert.equal(world("getCell")(enemy.cellX, enemy.cellY), 0);
  assert.equal(enemy.posX, enemy.cellX + 0.5);
  assert.equal(enemy.state, "idle");
  assert.ok(world("getEnemiesAtCell")(enemy.cellX, enemy.cellY).includes(enemy));
  assert.equal(world("getEnemiesAtCell")(oldCellX, oldCellY).includes(enemy), false);
  assert.ok(world("getEnemiesForChunk")(enemy.chunkX, enemy.chunkY).includes(enemy));
  assert.equal(world("getEnemiesForChunk")(3, 0).includes(enemy), false);
});

test("D-25: an enemy inside the active area stays where it is", () => {
  const world = createGatherWorld();
  const enemy = addEnemyInChunk(world, 2, -2);
  const cellX = enemy.cellX;

  world("gatherFarEnemies")({ posX: 8.5, posY: 8.5 });

  assert.equal(enemy.cellX, cellX);
  assert.equal(enemy.chunkX, 2);
});

test("D-25: nothing moves while the player stays in the same chunk", () => {
  const world = createGatherWorld();
  const gatherFarEnemies = world("gatherFarEnemies");
  gatherFarEnemies({ posX: 8.5, posY: 8.5 });
  const enemy = addEnemyInChunk(world, 5, 0);

  gatherFarEnemies({ posX: 12.5, posY: 3.5 });
  assert.equal(enemy.chunkX, 5);

  // Entering chunk (1, 0) brings it to a neighbor of chunk (1, 0)
  gatherFarEnemies({ posX: 20.5, posY: 8.5 });
  assert.equal(getEnemyChunkDistance(enemy, 1, 0), 1);
});

test("D-25: gathered enemies never share a cell", () => {
  const world = createGatherWorld();
  const enemies = [];
  for (let cx = 10; cx < 30; cx += 1) {
    enemies.push(addEnemyInChunk(world, cx, 10));
  }

  world("gatherFarEnemies")({ posX: 8.5, posY: 8.5 });

  const cells = new Set(enemies.map((enemy) => `${enemy.cellX},${enemy.cellY}`));
  assert.equal(cells.size, enemies.length);
  assert.ok(enemies.every((enemy) => getEnemyChunkDistance(enemy, 0, 0) === 1));
});

test("D-25: with every cell of the 8 neighbors taken, a far enemy waits where it is", () => {
  const world = createGatherWorld();
  const player = { posX: 8.5, posY: 8.5 };
  const ringCells = [];
  world("addRingAirCells")(ringCells, 0, 0, 1);
  world("placeGameEnemies")(player, ringCells.length);
  const enemy = addEnemyInChunk(world, 6, 0);

  world("gatherFarEnemies")(player);

  assert.equal(enemy.chunkX, 6);
});
