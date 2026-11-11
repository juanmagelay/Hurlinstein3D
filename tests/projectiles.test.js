const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

// An air world with a single, movable wall column, like the shot tests
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
const enemiesByChunk = getGlobal("enemiesByChunk");
const enemiesByCell = getGlobal("enemiesByCell");
const getChunkKey = getGlobal("getChunkKey");
const getEnemiesAtCell = getGlobal("getEnemiesAtCell");
const registerEnemyAtCell = getGlobal("registerEnemyAtCell");
const updateEnemyCell = getGlobal("updateEnemyCell");

// The ticker deltaTime that moves a projectile the given number of cells
const ticksFor = (cells) => cells / projectileSpeed;

function makePlayer(posX, posY, dirX, dirY) {
  return { posX, posY, dirX, dirY, planeX: -dirY * 0.66, planeY: dirX * 0.66 };
}

function reset() {
  projectiles.length = 0;
  enemiesByChunk.clear();
  enemiesByCell.clear();
}

// Registers an enemy in its own chunk list and cell, like the world does
function addEnemy(posX, posY) {
  const enemy = {
    posX,
    posY,
    cellX: Math.floor(posX),
    cellY: Math.floor(posY),
    chunkX: Math.floor(posX / 16),
    chunkY: Math.floor(posY / 16),
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

// Runs one-tick updates until no projectile is left (with a safety cap)
function flyUntilDone() {
  for (let tick = 0; tick < 1000 && projectiles.length > 0; tick += 1) {
    updateProjectiles(1);
  }
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
  const projectile = fireProjectile(makePlayer(3.5, 5.5, 0, 1));

  updateProjectiles(ticksFor(1));

  assert.ok(Math.abs(projectile.posX - 3.5) < 1e-9);
  assert.ok(Math.abs(projectile.posY - 6.5) < 1e-9);
  assert.ok(Math.abs(projectile.travelled - 1) < 1e-9);
});

test("the projectile stops on the wall face and is removed", () => {
  reset();
  setWall(8);
  const projectile = fireProjectile(makePlayer(3.5, 5.5, 1, 0));

  const done = advanceProjectile(projectile, 10);

  assert.equal(done, true);
  assert.ok(Math.abs(projectile.posX - 8) < 1e-9);

  updateProjectiles(ticksFor(10));
  assert.equal(projectiles.length, 0);
});

test("a projectile kills the enemy ahead and disappears", () => {
  reset();
  setWall(12);
  addEnemy(6.5, 5.5);
  fireProjectile(makePlayer(3.5, 5.5, 1, 0));

  flyUntilDone();

  assert.equal(getEnemiesAtCell(6, 5).length, 0);
  assert.equal(enemiesByChunk.get(getChunkKey(0, 0)).length, 0);
  assert.equal(projectiles.length, 0);
});

test("a wall in front of the enemy keeps it alive", () => {
  reset();
  setWall(5);
  addEnemy(7.5, 5.5);
  fireProjectile(makePlayer(3.5, 5.5, 1, 0));

  flyUntilDone();

  assert.equal(getEnemiesAtCell(7, 5).length, 1);
  assert.equal(projectiles.length, 0);
});

test("an enemy that moves out of the way is missed", () => {
  reset();
  setWall(12);
  const enemy = addEnemy(8.5, 5.5);
  fireProjectile(makePlayer(3.5, 5.5, 1, 0));
  updateProjectiles(ticksFor(2));

  // While the projectile is in flight, the enemy steps one cell aside
  enemy.posY = 6.5;
  updateEnemyCell(enemy);
  flyUntilDone();

  assert.equal(getEnemiesAtCell(8, 6).length, 1);
  assert.equal(projectiles.length, 0);
});

test("a long step does not skip an enemy on the way", () => {
  reset();
  setWall(12);
  addEnemy(5.5, 5.5);
  fireProjectile(makePlayer(3.5, 5.5, 1, 0));

  // One tick of five cells jumps from 3.5 to 8.5, over the enemy at 5.5
  updateProjectiles(ticksFor(5));

  assert.equal(getEnemiesAtCell(5, 5).length, 0);
  assert.equal(projectiles.length, 0);
});

test("an enemy centered in the next cell is hit when its body reaches the line", () => {
  reset();
  setWall(12);
  // The projectile flies along y = 5.95 (cell row 5); the enemy center is at
  // y = 6.05 (cell row 6), 0.1 cells off the line, under its half width 0.15
  addEnemy(6.5, 6.05);
  fireProjectile(makePlayer(3.5, 5.95, 1, 0));

  flyUntilDone();

  assert.equal(getEnemiesAtCell(6, 6).length, 0);
});

test("an enemy beside the line, beyond its half width, is not hit", () => {
  reset();
  setWall(12);
  addEnemy(6.5, 5.8);
  fireProjectile(makePlayer(3.5, 5.5, 1, 0));

  flyUntilDone();

  assert.equal(getEnemiesAtCell(6, 5).length, 1);
});

test("an enemy behind the player is not hit", () => {
  reset();
  setWall(12);
  addEnemy(2.5, 5.5);
  fireProjectile(makePlayer(3.5, 5.5, 1, 0));

  flyUntilDone();

  assert.equal(getEnemiesAtCell(2, 5).length, 1);
});

test("only the nearest enemy dies when two sit on one step", () => {
  reset();
  setWall(12);
  addEnemy(6.5, 5.5);
  addEnemy(5.5, 5.5);
  fireProjectile(makePlayer(3.5, 5.5, 1, 0));

  updateProjectiles(ticksFor(5));

  assert.equal(getEnemiesAtCell(5, 5).length, 0);
  assert.equal(getEnemiesAtCell(6, 5).length, 1);
  assert.equal(projectiles.length, 0);
});

test("projectiles work in negative coordinates", () => {
  reset();
  setWall(-12);
  addEnemy(-6.5, -3.5);
  fireProjectile(makePlayer(-2.5, -3.5, -1, 0));

  flyUntilDone();

  assert.equal(getEnemiesAtCell(-7, -4).length, 0);
  assert.equal(projectiles.length, 0);
});
