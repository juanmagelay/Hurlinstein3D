const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

// D-13b / D-42b: an air world with a single, movable wall column
const getGlobal = loadScripts();
getGlobal("wallX = -1000");
getGlobal("getCell = function (x, y) { return (x === wallX) ? 1 : 0; }");
const setWall = (x) => getGlobal(`wallX = ${x}`);

const fireProjectile = getGlobal("fireProjectile");
const updateProjectiles = getGlobal("updateProjectiles");
const advanceProjectile = getGlobal("advanceProjectile");
const projectiles = getGlobal("projectiles");
const projectileSpeed = getGlobal("projectileSpeed");
const maxRayDistance = getGlobal("maxRayDistance");
const enemyWidth = getGlobal("enemyWidth");
const enemiesByChunk = getGlobal("enemiesByChunk");
const enemiesByCell = getGlobal("enemiesByCell");
const getChunkKey = getGlobal("getChunkKey");
const getEnemiesAtCell = getGlobal("getEnemiesAtCell");
const registerEnemyAtCell = getGlobal("registerEnemyAtCell");
const updateEnemyCell = getGlobal("updateEnemyCell");
const getKillCount = getGlobal("getKillCount");

// The ticker deltaTime that moves a projectile the given number of cells
const ticksFor = (cells) => cells / projectileSpeed;

function makePlayer(posX, posY, dirX, dirY) {
  return { posX, posY, dirX, dirY, planeX: -dirY * 0.66, planeY: dirX * 0.66 };
}

function reset() {
  projectiles.length = 0;
  enemiesByChunk.clear();
  enemiesByCell.clear();
  getGlobal("resetKillCount")();
}

// Registers an enemy in its own chunk list and cell, like the world does
function addEnemy(posX, posY, health = 1) {
  const enemy = {
    posX,
    posY,
    cellX: Math.floor(posX),
    cellY: Math.floor(posY),
    chunkX: Math.floor(posX / 16),
    chunkY: Math.floor(posY / 16),
    width: enemyWidth,
    height: 0.6,
    state: "idle",
    stateTime: 0,
    health,
  };
  const chunkKey = getChunkKey(enemy.chunkX, enemy.chunkY);
  if (!enemiesByChunk.has(chunkKey)) {
    enemiesByChunk.set(chunkKey, []);
  }
  enemiesByChunk.get(chunkKey).push(enemy);
  registerEnemyAtCell(enemy);
  return enemy;
}

// Runs one-tick updates until no projectile is left (with a safety cap)
function flyUntilDone(player) {
  for (let tick = 0; tick < 1000 && projectiles.length > 0; tick += 1) {
    updateProjectiles(1, player);
  }
}

// Fires from the player and flies until the projectile is done
function shoot(player) {
  fireProjectile(player);
  flyUntilDone(player);
}

test("the range is the wall distance the center ray DDA returns", () => {
  reset();
  setWall(8);

  const projectile = fireProjectile(makePlayer(3.5, 5.5, 1, 0));

  // Wall cell 8 starts at x = 8, so the face is 8 - 3.5 = 4.5 cells away
  assert.ok(Math.abs(projectile.range - 4.5) < 1e-9);
  assert.equal(projectiles.length, 1);
});

test("with no wall in reach the range is the max ray distance", () => {
  reset();
  setWall(-1000);

  const projectile = fireProjectile(makePlayer(3.5, 5.5, 1, 0));

  assert.equal(projectile.range, maxRayDistance);
});

test("a tick moves the projectile speed times deltaTime along dir", () => {
  reset();
  setWall(20);
  const player = makePlayer(3.5, 5.5, 0, 1);
  const projectile = fireProjectile(player);

  updateProjectiles(ticksFor(1), player);

  assert.ok(Math.abs(projectile.posX - 3.5) < 1e-9);
  assert.ok(Math.abs(projectile.posY - 6.5) < 1e-9);
  assert.ok(Math.abs(projectile.travelled - 1) < 1e-9);
});

test("the projectile never goes past the wall face and is removed there", () => {
  reset();
  setWall(8);
  const player = makePlayer(3.5, 5.5, 1, 0);
  const projectile = fireProjectile(player);

  // A ten cell step would end at x = 13.5, five cells inside the wall
  const done = advanceProjectile(projectile, 10, player);

  assert.equal(done, true);
  assert.ok(Math.abs(projectile.posX - 8) < 1e-9);

  updateProjectiles(ticksFor(10), player);
  assert.equal(projectiles.length, 0);
});

test("a direct hit kills the enemy ahead and the projectile disappears", () => {
  reset();
  setWall(12);
  addEnemy(6.5, 5.5);

  shoot(makePlayer(3.5, 5.5, 1, 0));

  assert.equal(getEnemiesAtCell(6, 5).length, 0);
  assert.equal(enemiesByChunk.get(getChunkKey(0, 0)).length, 0);
  assert.equal(projectiles.length, 0);
});

test("a wall in front of the enemy blocks the shot", () => {
  reset();
  setWall(5);
  addEnemy(7.5, 5.5);

  shoot(makePlayer(3.5, 5.5, 1, 0));

  assert.equal(getEnemiesAtCell(7, 5).length, 1);
  assert.equal(projectiles.length, 0);
});

test("an enemy that moves out of the way is missed", () => {
  reset();
  setWall(12);
  const enemy = addEnemy(8.5, 5.5);
  const player = makePlayer(3.5, 5.5, 1, 0);
  fireProjectile(player);
  updateProjectiles(ticksFor(2), player);

  // While the projectile is in flight, the enemy steps one cell aside
  enemy.posY = 6.5;
  updateEnemyCell(enemy);
  flyUntilDone(player);

  assert.equal(getEnemiesAtCell(8, 6).length, 1);
  assert.equal(projectiles.length, 0);
});

test("a long step does not skip an enemy on the way", () => {
  reset();
  setWall(12);
  addEnemy(5.5, 5.5);
  const player = makePlayer(3.5, 5.5, 1, 0);
  fireProjectile(player);

  // One tick of five cells jumps from 3.5 to 8.5, over the enemy at 5.5
  updateProjectiles(ticksFor(5), player);

  assert.equal(getEnemiesAtCell(5, 5).length, 0);
  assert.equal(projectiles.length, 0);
});

test("an enemy centered in the next cell is hit when its body reaches the line", () => {
  reset();
  setWall(12);
  // The projectile flies along y = 5.95 (cell row 5); the enemy center is at
  // y = 6.05 (cell row 6), 0.1 cells off the line, under its half width 0.15
  addEnemy(6.5, 6.05);

  shoot(makePlayer(3.5, 5.95, 1, 0));

  assert.equal(getEnemiesAtCell(6, 6).length, 0);
});

test("an enemy beside the line, beyond its half width, is not hit", () => {
  reset();
  setWall(12);
  // 0.3 cells off the line, past the half width of 0.15
  addEnemy(6.5, 5.8);

  shoot(makePlayer(3.5, 5.5, 1, 0));

  assert.equal(getEnemiesAtCell(6, 5).length, 1);
});

test("an enemy behind the player is not hit", () => {
  reset();
  setWall(12);
  addEnemy(2.5, 5.5);

  shoot(makePlayer(3.5, 5.5, 1, 0));

  assert.equal(getEnemiesAtCell(2, 5).length, 1);
});

test("only the nearest of two enemies on one step dies", () => {
  reset();
  setWall(0);
  addEnemy(5.5, 5.5);
  addEnemy(6.5, 5.5);
  // Fired toward -x: the cells are searched from low x to high x, so the
  // farther enemy (5.5) is found first and the distance has to pick the other
  const player = makePlayer(8.5, 5.5, -1, 0);
  fireProjectile(player);

  // One tick of five cells, from 8.5 to 3.5, covers both enemies
  updateProjectiles(ticksFor(5), player);

  assert.equal(getEnemiesAtCell(6, 5).length, 0);
  assert.equal(getEnemiesAtCell(5, 5).length, 1);
  assert.equal(projectiles.length, 0);
});

test("with no wall in reach the projectile hits up to the max ray distance", () => {
  reset();
  setWall(-1000);
  addEnemy(25.5, 5.5);

  shoot(makePlayer(3.5, 5.5, 1, 0));

  // 22 cells away, inside the 24 cell range
  assert.equal(getEnemiesAtCell(25, 5).length, 0);
});

test("projectiles work in negative coordinates", () => {
  reset();
  setWall(-12);
  addEnemy(-6.5, -3.5);

  shoot(makePlayer(-2.5, -3.5, -1, 0));

  assert.equal(getEnemiesAtCell(-7, -4).length, 0);
  assert.equal(projectiles.length, 0);
});

test("a kill adds one to the kill count (D-19a)", () => {
  reset();
  setWall(12);
  addEnemy(6.5, 5.5);

  shoot(makePlayer(3.5, 5.5, 1, 0));

  assert.equal(getKillCount(), 1);
});

test("a miss adds nothing to the kill count (D-19a)", () => {
  reset();
  setWall(12);

  shoot(makePlayer(3.5, 5.5, 1, 0));

  assert.equal(getKillCount(), 0);
});

test("an enemy with two points survives one projectile and dies on the second (D-19b)", () => {
  reset();
  setWall(12);
  const enemy = addEnemy(6.5, 5.5, 2);
  const player = makePlayer(3.5, 5.5, 1, 0);

  shoot(player);

  assert.equal(enemy.health, 1);
  assert.equal(getEnemiesAtCell(6, 5).length, 1);
  assert.equal(getKillCount(), 0);
  assert.equal(projectiles.length, 0);

  shoot(player);

  assert.equal(enemy.health, 0);
  assert.equal(getEnemiesAtCell(6, 5).length, 0);
  assert.equal(getKillCount(), 1);
});
