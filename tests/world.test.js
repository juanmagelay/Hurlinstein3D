const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

const getGlobal = loadScripts();
const getCell = getGlobal("getCell");
const getChunkKey = getGlobal("getChunkKey");
const getChunkCells = getGlobal("getChunkCells");
const getSpawnPosition = getGlobal("getSpawnPosition");
const generatedChunks = getGlobal("generatedChunks");
const chunkSize = getGlobal("chunkSize");
const player = getGlobal("player");
const getEnemiesForChunk = getGlobal("getEnemiesForChunk");
const getEnemiesAtCell = getGlobal("getEnemiesAtCell");
const enemyWidth = getGlobal("enemyWidth");
const enemyHeight = getGlobal("enemyHeight");
const enemyColor = getGlobal("enemyColor");

test("Cantor chunk keys are unique for positive and negative coordinates", () => {
  const keys = new Set();
  for (let cx = -20; cx <= 20; cx += 1) {
    for (let cy = -20; cy <= 20; cy += 1) {
      const key = getChunkKey(cx, cy);
      assert.equal(keys.has(key), false, `duplicate key for (${cx}, ${cy})`);
      keys.add(key);
    }
  }
});

test("getCell addresses cells correctly across negative chunk coordinates", () => {
  const cells = getChunkCells(-1, -1);

  assert.equal(getCell(-16, -16), cells[0]);
  assert.equal(getCell(-1, -1), cells[chunkSize * chunkSize - 1]);
  assert.equal(getCell(-16, -1), cells[(chunkSize - 1) * chunkSize]);
  assert.equal(getCell(-1, -16), cells[chunkSize - 1]);
});

test("neighboring chunks connect at their fixed doors", () => {
  assert.equal(getCell(chunkSize - 1, 8), 0);
  assert.equal(getCell(chunkSize, 8), 0);
  assert.equal(getCell(8, chunkSize - 1), 0);
  assert.equal(getCell(8, chunkSize), 0);
  assert.equal(getCell(chunkSize - 1, 7), 1);
  assert.equal(getCell(chunkSize, 7), 1);
});

test("chunks are generated once and retained in the Map", () => {
  const cx = 30;
  const cy = -25;
  const firstCells = getChunkCells(cx, cy);
  const countAfterFirstQuery = generatedChunks.size;
  const firstValue = getCell(cx * chunkSize, cy * chunkSize);
  const secondCells = getChunkCells(cx, cy);
  const secondValue = getCell(cx * chunkSize, cy * chunkSize);

  assert.equal(secondCells, firstCells);
  assert.equal(secondValue, firstValue);
  assert.equal(generatedChunks.size, countAfterFirstQuery);
  assert.equal(firstCells.constructor.name, "Uint8Array");
});

test("the spawn position is the center of the generated room in chunk zero", () => {
  const spawnPosition = getSpawnPosition();
  const spawnCells = getChunkCells(0, 0);
  const roomCenterCellX = Math.floor(spawnPosition.x);
  const roomCenterCellY = Math.floor(spawnPosition.y);

  assert.equal(player.posX, spawnPosition.x);
  assert.equal(player.posY, spawnPosition.y);
  assert.equal(getCell(roomCenterCellX, roomCenterCellY), 0);
  assert.equal(spawnCells[roomCenterCellY * chunkSize + roomCenterCellX], 0);
});

test("generating a chunk while exploring creates no enemies (D-24)", () => {
  getChunkCells(40, -40);
  assert.equal(getEnemiesForChunk(40, -40).length, 0);
});

// D-24 / TDD 2.3.2: the enemies of the game are placed around the player
function getChunkDistance(enemy, player) {
  const playerChunkX = Math.floor(player.posX / chunkSize);
  const playerChunkY = Math.floor(player.posY / chunkSize);
  return Math.max(Math.abs(enemy.chunkX - playerChunkX), Math.abs(enemy.chunkY - playerChunkY));
}

function getAllEnemies(world) {
  return world("[...enemiesByChunk.values()].flat()");
}

test("the total goes to distinct air cells of the 8 chunks around the player", () => {
  const world = loadScripts();
  const player = world("player");
  world("placeGameEnemies")(player, 100);
  const enemies = getAllEnemies(world);
  const occupiedCells = new Set();

  assert.equal(enemies.length, 100);
  for (const enemy of enemies) {
    const cellKey = `${enemy.cellX},${enemy.cellY}`;
    assert.equal(occupiedCells.has(cellKey), false, "two enemies in one cell");
    occupiedCells.add(cellKey);
    assert.equal(world("getCell")(enemy.cellX, enemy.cellY), 0);
    assert.equal(enemy.posX, enemy.cellX + 0.5);
    assert.equal(enemy.posY, enemy.cellY + 0.5);
    assert.equal(enemy.width, enemyWidth);
    assert.equal(enemy.height, enemyHeight);
    assert.equal(enemy.color, enemyColor);
    assert.equal(enemy.state, "idle");
    // The player's chunk stays empty; every enemy is in one of its 8 neighbors
    assert.equal(getChunkDistance(enemy, player), 1);
    assert.ok(world("getEnemiesAtCell")(enemy.cellX, enemy.cellY).includes(enemy));
  }
});

test("a new total replaces the live enemies with new ones around the player", () => {
  const world = loadScripts();
  const placeGameEnemies = world("placeGameEnemies");
  placeGameEnemies(world("player"), 20);
  const first = getAllEnemies(world);

  // The player walked two chunks away, to (40.5, 8.5) in chunk (2, 0)
  const movedPlayer = { posX: 40.5, posY: 8.5 };
  placeGameEnemies(movedPlayer, 5);
  const second = getAllEnemies(world);

  assert.equal(second.length, 5);
  assert.ok(second.every((enemy) => !first.includes(enemy)));
  assert.ok(second.every((enemy) => getChunkDistance(enemy, movedPlayer) === 1));
  // The old ones left the per-cell registry too
  for (const enemy of first) {
    assert.equal(world("getEnemiesAtCell")(enemy.cellX, enemy.cellY).includes(enemy), false);
  }
});

test("when the 8 neighbors are full the area grows one ring of chunks at a time", () => {
  const world = loadScripts();
  const player = world("player");
  // 8 chunks have fewer than 8 * 256 air cells, so this many cannot fit in ring 1
  const count = 8 * chunkSize * chunkSize;
  world("placeGameEnemies")(player, count);
  const enemies = getAllEnemies(world);
  const occupiedCells = new Set(enemies.map((enemy) => `${enemy.cellX},${enemy.cellY}`));

  assert.equal(enemies.length, count);
  assert.equal(occupiedCells.size, count);
  assert.ok(enemies.some((enemy) => getChunkDistance(enemy, player) >= 2));
  assert.ok(enemies.every((enemy) => getChunkDistance(enemy, player) >= 1));
});
