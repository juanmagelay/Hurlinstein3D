const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

// An air world with a single, movable wall column, like the old D-07a shot tests
const getGlobal = loadScripts();
getGlobal("wallX = -1000");
getGlobal("getCell = function (x, y) { return (x === wallX) ? 1 : 0; }");
const setWall = (x) => getGlobal(`wallX = ${x}`);

const shootCenterRay = getGlobal("shootCenterRay");
const enemiesByChunk = getGlobal("enemiesByChunk");
const enemiesByCell = getGlobal("enemiesByCell");
const getChunkKey = getGlobal("getChunkKey");
const getEnemiesAtCell = getGlobal("getEnemiesAtCell");
const registerEnemyAtCell = getGlobal("registerEnemyAtCell");
const enemyWidth = getGlobal("enemyWidth");

function makePlayer(posX, posY, dirX, dirY) {
  return { posX, posY, dirX, dirY };
}

function reset() {
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
    width: enemyWidth,
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

test("a direct hit removes the enemy on the ray", () => {
  reset();
  setWall(12);
  const enemy = addEnemy(6.5, 5.5);

  const hit = shootCenterRay(makePlayer(3.5, 5.5, 1, 0));

  assert.equal(hit, enemy);
  assert.equal(getEnemiesAtCell(6, 5).length, 0);
});

test("a wall closer than the enemy blocks the shot", () => {
  reset();
  setWall(5);
  addEnemy(7.5, 5.5);

  const hit = shootCenterRay(makePlayer(3.5, 5.5, 1, 0));

  assert.equal(hit, null);
  assert.equal(getEnemiesAtCell(7, 5).length, 1);
});

test("an enemy beside the line, beyond its half width, is not hit", () => {
  reset();
  setWall(12);
  addEnemy(6.5, 5.8);

  const hit = shootCenterRay(makePlayer(3.5, 5.5, 1, 0));

  assert.equal(hit, null);
  assert.equal(getEnemiesAtCell(6, 5).length, 1);
});

test("an enemy behind the player is not hit", () => {
  reset();
  setWall(12);
  addEnemy(2.5, 5.5);

  const hit = shootCenterRay(makePlayer(3.5, 5.5, 1, 0));

  assert.equal(hit, null);
  assert.equal(getEnemiesAtCell(2, 5).length, 1);
});

test("only the nearest enemy along the ray is hit", () => {
  reset();
  setWall(12);
  addEnemy(6.5, 5.5);
  const nearest = addEnemy(5.5, 5.5);

  const hit = shootCenterRay(makePlayer(3.5, 5.5, 1, 0));

  assert.equal(hit, nearest);
  assert.equal(getEnemiesAtCell(5, 5).length, 0);
  assert.equal(getEnemiesAtCell(6, 5).length, 1);
});

test("with no wall in reach the shot hits up to the max ray distance", () => {
  reset();
  setWall(-1000);
  addEnemy(10.5, 5.5);

  const hit = shootCenterRay(makePlayer(3.5, 5.5, 1, 0));

  assert.notEqual(hit, null);
  assert.equal(getEnemiesAtCell(10, 5).length, 0);
});

test("the shot works in negative coordinates", () => {
  reset();
  setWall(-12);
  addEnemy(-6.5, -3.5);

  const hit = shootCenterRay(makePlayer(-2.5, -3.5, -1, 0));

  assert.notEqual(hit, null);
  assert.equal(getEnemiesAtCell(-7, -4).length, 0);
});
