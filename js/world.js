// TDD 5.1 and 6.8: chunks are generated on demand and kept for the session.
const generatedChunks = new Map();
// D-10: one light per room center, in world coordinates, kept per chunk
const lightsByChunk = new Map();
const enemiesByChunk = new Map();
const enemiesByCell = new Map();
let spawnRoomCenter = null;
let nextEnemyId = 1;

// TDD 6.8: map signed chunk coordinates to non-negative integers, then pair them.
function getChunkKey(cx, cy) {
  const a = cx >= 0 ? 2 * cx : -2 * cx - 1;
  const b = cy >= 0 ? 2 * cy : -2 * cy - 1;
  const sum = a + b;
  return (sum * (sum + 1)) / 2 + b;
}

function getChunkCells(cx, cy) {
  const key = getChunkKey(cx, cy);
  if (!generatedChunks.has(key)) {
    const generatedChunk = generateChunk();
    generatedChunks.set(key, generatedChunk.cells);
    lightsByChunk.set(key, createChunkLights(generatedChunk, cx, cy));
    const enemies = generateEnemiesForChunk(cx, cy, generatedChunk.cells);
    enemiesByChunk.set(key, enemies);
    for (const enemy of enemies) {
      registerEnemyAtCell(enemy);
    }
    if (cx === 0 && cy === 0) {
      spawnRoomCenter = generatedChunk.roomCenter;
    }
  }
  return generatedChunks.get(key);
}

// D-10: a light sits at the center of every room of the chunk, in world cells.
function createChunkLights(chunk, cx, cy) {
  const rooms = chunk.secondRoom ? [chunk.room, chunk.secondRoom] : [chunk.room];
  return rooms.map((room) => ({
    x: cx * chunkSize + room.x + room.width / 2,
    y: cy * chunkSize + room.y + room.height / 2,
    radius: lightRadius,
    intensity: lightIntensity,
  }));
}

// D-10: rooms sit at least four cells from a chunk border and the light radius
// is under four, so a light only ever reaches walls of its own chunk.
function getLightsAtCell(cellX, cellY) {
  const cx = Math.floor(cellX / chunkSize);
  const cy = Math.floor(cellY / chunkSize);
  return lightsByChunk.get(getChunkKey(cx, cy)) || [];
}

// D-04: zero enemies in the spawn chunk, weighted population in other chunks.
function getEnemyCountForRoll(roll) {
  if (roll < enemyCountThresholds[0]) {
    return 0;
  }
  if (roll < enemyCountThresholds[1]) {
    return 1;
  }
  if (roll < enemyCountThresholds[2]) {
    return 2;
  }
  return 3;
}

function generateEnemiesForChunk(cx, cy, cells) {
  if (cx === 0 && cy === 0) {
    return [];
  }

  const enemyCount = getEnemyCountForRoll(Math.random());
  const openCells = [];
  for (let index = 0; index < cells.length; index += 1) {
    if (cells[index] === 0) {
      openCells.push(index);
    }
  }

  const enemies = [];
  for (let count = 0; count < enemyCount && openCells.length > 0; count += 1) {
    const openCellIndex = Math.floor(Math.random() * openCells.length);
    const cellIndex = openCells.splice(openCellIndex, 1)[0];
    const localX = cellIndex % chunkSize;
    const localY = Math.floor(cellIndex / chunkSize);
    const cellX = cx * chunkSize + localX;
    const cellY = cy * chunkSize + localY;
    enemies.push({
      id: nextEnemyId,
      posX: cellX + 0.5,
      posY: cellY + 0.5,
      cellX,
      cellY,
      chunkX: cx,
      chunkY: cy,
      size: enemySize,
      color: enemyColor,
      state: "idle",
      stateTime: 0,
    });
    nextEnemyId += 1;
  }
  return enemies;
}

function registerEnemyAtCell(enemy) {
  const cellKey = getChunkKey(enemy.cellX, enemy.cellY);
  if (!enemiesByCell.has(cellKey)) {
    enemiesByCell.set(cellKey, []);
  }
  enemiesByCell.get(cellKey).push(enemy);
}

function getEnemiesForChunk(cx, cy) {
  return enemiesByChunk.get(getChunkKey(cx, cy)) || [];
}

function getEnemiesAtCell(cellX, cellY) {
  return enemiesByCell.get(getChunkKey(cellX, cellY)) || [];
}

function getSpawnPosition() {
  getChunkCells(0, 0);
  return { x: spawnRoomCenter.x, y: spawnRoomCenter.y };
}

// TDD 5.2: callers pass cell integers; negative chunk coordinates use Math.floor.
function getCell(x, y) {
  const cx = Math.floor(x / chunkSize);
  const cy = Math.floor(y / chunkSize);
  const localX = x - cx * chunkSize;
  const localY = y - cy * chunkSize;
  const cells = getChunkCells(cx, cy);
  return cells[localY * chunkSize + localX];
}
