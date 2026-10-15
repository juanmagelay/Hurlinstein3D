// TDD 5.1 and 6.8: chunks are generated on demand and kept for the session.
const generatedChunks = new Map();
let spawnRoomCenter = null;

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
    if (cx === 0 && cy === 0) {
      spawnRoomCenter = generatedChunk.roomCenter;
    }
  }
  return generatedChunks.get(key);
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
