const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

// An all-air world so any neighbour is a valid patrol step. The world random always
// picks the first neighbour (+X) to keep the patrol deterministic. The player
// stays 32 cells away, past the 24 cell sight distance, so patrol tests never
// trigger the chase state, but inside the active area of D-23 (chunk (0, 2)).
const getGlobal = loadScripts();
getGlobal("getCell = function (x, y) { return 0; }");
getGlobal("gameRandom = function () { return 0; }");
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

test("D-30c: patrol choices repeat for the same world seed", () => {
  const firstWorld = loadScripts();
  firstWorld("getCell = function () { return 0; }");
  firstWorld("gameRandom = createRandom(9876)");
  firstWorld("globalThis.patrolTestEnemy = { posX: 5.5, posY: 5.5, cellX: 5, cellY: 5, state: 'idle', stateTime: 0 }");
  firstWorld("enemiesByChunk.set(getChunkKey(0, 0), [patrolTestEnemy])");
  firstWorld("updateEnemies")({ posX: 5.5, posY: 37.5 }, firstWorld("enemyIdleTicks"));
  const firstChoice = firstWorld("enemiesByChunk.get(getChunkKey(0, 0))[0].patrolB");

  const secondWorld = loadScripts();
  secondWorld("getCell = function () { return 0; }");
  secondWorld("gameRandom = createRandom(9876)");
  secondWorld("globalThis.patrolTestEnemy = { posX: 5.5, posY: 5.5, cellX: 5, cellY: 5, state: 'idle', stateTime: 0 }");
  secondWorld("enemiesByChunk.set(getChunkKey(0, 0), [patrolTestEnemy])");
  secondWorld("updateEnemies")({ posX: 5.5, posY: 37.5 }, secondWorld("enemyIdleTicks"));
  assert.deepEqual(
    JSON.parse(JSON.stringify(firstChoice)),
    JSON.parse(JSON.stringify(secondWorld("enemiesByChunk.get(getChunkKey(0, 0))[0].patrolB")))
  );
});

// A single air cell surrounded by walls: the enemy has nowhere to patrol.
const walledGlobal = loadScripts();
walledGlobal("getCell = function (x, y) { return (x === 5 && y === 5) ? 0 : 1; }");
walledGlobal("gameRandom = function () { return 0; }");
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
losGlobal("gameRandom = function () { return 0; }");
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

// D-25 and D-38: a real world, so the gathered enemies land on real air cells.
// A fixed seed keeps the map the same on every run.
function createGatherWorld() {
  const world = loadScripts();
  world("resetGame")(4242);
  world("removeAllEnemies()");
  return world;
}

// An enemy on an air cell of chunk (cx, cy) that this player cannot see
function addHiddenEnemyInChunk(world, cx, cy, player) {
  const cells = [];
  world("addChunkAirCells")(cells, cx, cy);
  const isHiddenFromPlayer = world("isHiddenFromPlayer");
  const cell = cells.find((candidate) => isHiddenFromPlayer(candidate.x + 0.5, candidate.y + 0.5, player));
  assert.ok(cell, "the chunk has a hidden air cell");
  return world("addEnemyAtCell")(cell.x, cell.y);
}

// Chunk steps counting only straight moves: 1 is a door neighbor
function getChunkSteps(enemy, chunkX, chunkY) {
  return Math.abs(enemy.chunkX - chunkX) + Math.abs(enemy.chunkY - chunkY);
}

const gatherPlayer = { posX: 8.5, posY: 8.5 };

test("D-38: an enemy left three chunks behind reappears idle in a door neighbor", () => {
  const world = createGatherWorld();
  const enemy = addHiddenEnemyInChunk(world, 3, 0, gatherPlayer);
  enemy.state = "patrol";
  const oldCellX = enemy.cellX;
  const oldCellY = enemy.cellY;

  world("gatherFarEnemies")(gatherPlayer);

  assert.equal(getChunkSteps(enemy, 0, 0), 1);
  assert.equal(world("getCell")(enemy.cellX, enemy.cellY), 0);
  assert.equal(enemy.posX, enemy.cellX + 0.5);
  assert.equal(enemy.state, "idle");
  assert.ok(world("isHiddenFromPlayer")(enemy.posX, enemy.posY, gatherPlayer));
  assert.ok(world("getEnemiesAtCell")(enemy.cellX, enemy.cellY).includes(enemy));
  assert.equal(world("getEnemiesAtCell")(oldCellX, oldCellY).includes(enemy), false);
  assert.ok(world("getEnemiesForChunk")(enemy.chunkX, enemy.chunkY).includes(enemy));
  assert.equal(world("getEnemiesForChunk")(3, 0).includes(enemy), false);
});

test("D-38: a hidden enemy in a diagonal chunk also comes to a door neighbor", () => {
  const world = createGatherWorld();
  const enemy = addHiddenEnemyInChunk(world, 1, 1, gatherPlayer);

  world("gatherFarEnemies")(gatherPlayer);

  assert.equal(getChunkSteps(enemy, 0, 0), 1);
});

test("D-38: an enemy in a door neighbor stays where it is", () => {
  const world = createGatherWorld();
  const enemy = addHiddenEnemyInChunk(world, 0, -1, gatherPlayer);
  const cellX = enemy.cellX;
  const cellY = enemy.cellY;

  world("gatherFarEnemies")(gatherPlayer);

  assert.equal(enemy.cellX, cellX);
  assert.equal(enemy.cellY, cellY);
});

test("D-38: a chasing enemy and one the player can see are in play", () => {
  const world = createGatherWorld();
  const isEnemyOutOfPlay = world("isEnemyOutOfPlay");
  const player = { posX: 14.5, posY: 14.5 };
  // Diagonal chunk (1, 1), three cells from the player: inside the minimap window
  const close = { chunkX: 1, chunkY: 1, cellX: 17, cellY: 17, posX: 17.5, posY: 17.5, state: "idle" };
  // Three chunks away, hidden, but chasing
  const chasing = { chunkX: 3, chunkY: 0, cellX: 56, cellY: 8, posX: 56.5, posY: 8.5, state: "chase" };
  const far = { ...chasing, state: "patrol" };

  assert.equal(isEnemyOutOfPlay(close, player), false);
  assert.equal(isEnemyOutOfPlay(chasing, player), false);
  assert.equal(isEnemyOutOfPlay(far, player), true);
});

test("D-25: nothing moves while the player stays in the same chunk", () => {
  const world = createGatherWorld();
  const gatherFarEnemies = world("gatherFarEnemies");
  gatherFarEnemies(gatherPlayer);
  const enemy = addHiddenEnemyInChunk(world, 5, 0, gatherPlayer);

  gatherFarEnemies({ posX: 12.5, posY: 3.5 });
  assert.equal(enemy.chunkX, 5);

  // Entering chunk (1, 0) brings it to a door neighbor of chunk (1, 0)
  gatherFarEnemies({ posX: 20.5, posY: 8.5 });
  assert.equal(getChunkSteps(enemy, 1, 0), 1);
});

test("D-38: gathered enemies never share a cell and spread evenly", () => {
  const world = createGatherWorld();
  const enemies = [];
  for (let cx = 10; cx < 30; cx += 1) {
    enemies.push(addHiddenEnemyInChunk(world, cx, 10, gatherPlayer));
  }

  world("gatherFarEnemies")(gatherPlayer);

  const cells = new Set(enemies.map((enemy) => `${enemy.cellX},${enemy.cellY}`));
  assert.equal(cells.size, enemies.length);
  assert.ok(enemies.every((enemy) => getChunkSteps(enemy, 0, 0) === 1));
  const perChunk = new Map();
  for (const enemy of enemies) {
    const key = `${enemy.chunkX},${enemy.chunkY}`;
    perChunk.set(key, (perChunk.get(key) || 0) + 1);
  }
  assert.deepEqual([...perChunk.values()], [5, 5, 5, 5]);
});

test("D-38: with every free hidden cell of the door neighbors taken, an enemy out of play waits", () => {
  const world = createGatherWorld();
  let freeCells = 0;
  for (const area of world("getSpawnAreas")(gatherPlayer)) {
    freeCells += area.roomCells.length + area.corridorCells.length;
  }
  world("placeGameEnemies")(gatherPlayer, freeCells);
  const enemy = addHiddenEnemyInChunk(world, 6, 0, gatherPlayer);

  world("gatherFarEnemies")(gatherPlayer);

  assert.equal(enemy.chunkX, 6);
});

// D-39c: the death of an enemy
test("D-39c: the last hit frees the cell and the chunk at once, counts the kill and starts the fall", () => {
  const world = loadScripts();
  world("getCell = function (x, y) { return 0; }");
  const enemy = { posX: 5.5, posY: 5.5, cellX: 5, cellY: 5, chunkX: 0, chunkY: 0, width: 0.3, height: 0.6, health: 1 };
  world("enemiesByChunk").set(world("getChunkKey")(0, 0), [enemy]);
  world("registerEnemyAtCell")(enemy);

  world("damageEnemy")(enemy, { posX: 1.5, posY: 1.5 });

  assert.equal(world("getEnemiesAtCell")(5, 5).length, 0);
  assert.equal(world("getEnemiesForChunk")(0, 0).length, 0);
  assert.equal(world("getKillCount")(), 1);
  // It falls where it died
  const dying = world("dyingEnemies");
  assert.equal(dying.length, 1);
  assert.equal(dying[0].enemy, enemy);
  assert.equal(dying[0].time, 0);
  assert.equal(enemy.posX, 5.5);
});

test("D-39c: one death frame every 0.2 s, held on the last one", () => {
  const getDeathFrame = getGlobal("getDeathFrame");
  // 0.2 s is 12 ticker units at 60 Hz
  assert.equal(getGlobal("enemyDeathFrameTicks"), 12);
  assert.equal(getDeathFrame(0), 0);
  assert.equal(getDeathFrame(11.9), 0);
  assert.equal(getDeathFrame(12), 1);
  assert.equal(getDeathFrame(30), 2);
  assert.equal(getDeathFrame(59.9), 4);
  assert.equal(getDeathFrame(200), 4);
});

test("D-39c: the corpse lies 2 s after the 1 s fall and fades out in the last half second", () => {
  const getCorpseAlpha = getGlobal("getCorpseAlpha");
  // The fall ends at 60 ticks, the corpse at 60 + 120 = 180, the fade starts at 150
  assert.equal(getGlobal("enemyDeathTicks"), 60);
  assert.equal(getCorpseAlpha(0), 1);
  assert.equal(getCorpseAlpha(150), 1);
  assert.equal(getCorpseAlpha(165), 0.5);
  assert.equal(getCorpseAlpha(180), 0);
  assert.equal(getCorpseAlpha(200), 0);
});

test("D-39c: a falling enemy leaves the list when its corpse fades out", () => {
  const world = loadScripts();
  const startEnemyDeath = world("startEnemyDeath");
  const updateDyingEnemies = world("updateDyingEnemies");
  const dying = world("dyingEnemies");
  startEnemyDeath({ posX: 1.5, posY: 1.5, height: 0.6 });
  updateDyingEnemies(100);
  startEnemyDeath({ posX: 2.5, posY: 1.5, height: 0.6 });

  updateDyingEnemies(79);
  assert.equal(dying.length, 2);
  // The first one reaches 180 ticks and leaves; the second one keeps falling
  updateDyingEnemies(1);
  assert.equal(dying.length, 1);
  assert.equal(dying[0].enemy.posX, 2.5);
  assert.equal(dying[0].time, 80);
});
