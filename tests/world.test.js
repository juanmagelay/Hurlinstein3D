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
const getEnemyCountForRoll = getGlobal("getEnemyCountForRoll");
const getEnemiesForChunk = getGlobal("getEnemiesForChunk");
const getEnemiesAtCell = getGlobal("getEnemiesAtCell");
const enemySize = getGlobal("enemySize");
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

test("enemy population roll uses the approved 50, 30, 15 and 5 percent weights", () => {
  assert.equal(getEnemyCountForRoll(0), 0);
  assert.equal(getEnemyCountForRoll(0.4999), 0);
  assert.equal(getEnemyCountForRoll(0.5), 1);
  assert.equal(getEnemyCountForRoll(0.8), 2);
  assert.equal(getEnemyCountForRoll(0.95), 3);
});

test("the spawn chunk starts without enemies", () => {
  assert.equal(getEnemiesForChunk(0, 0).length, 0);
});

test("generated enemies occupy distinct open cells and are registered there", () => {
  const enemyWorld = loadScripts();
  enemyWorld("Math.random = function () { return 0.99; }");
  const enemyGetCell = enemyWorld("getCell");
  const enemyGetChunkCells = enemyWorld("getChunkCells");
  const enemyGetEnemiesForChunk = enemyWorld("getEnemiesForChunk");
  const enemyGetEnemiesAtCell = enemyWorld("getEnemiesAtCell");
  const firstCells = enemyGetChunkCells(-3, 4);
  const enemies = enemyGetEnemiesForChunk(-3, 4);
  const occupiedCells = new Set();

  assert.equal(enemies.length, 3);
  for (const enemy of enemies) {
    const cellKey = `${enemy.cellX},${enemy.cellY}`;
    assert.equal(occupiedCells.has(cellKey), false);
    occupiedCells.add(cellKey);
    assert.equal(enemyGetCell(enemy.cellX, enemy.cellY), 0);
    assert.equal(enemy.posX, enemy.cellX + 0.5);
    assert.equal(enemy.posY, enemy.cellY + 0.5);
    assert.equal(enemy.size, enemySize);
    assert.equal(enemy.color, enemyColor);
    assert.ok(enemyGetEnemiesAtCell(enemy.cellX, enemy.cellY).some((entry) => entry.id === enemy.id));
  }

  assert.equal(enemyGetChunkCells(-3, 4), firstCells);
  assert.equal(enemyGetEnemiesForChunk(-3, 4), enemies);
});
