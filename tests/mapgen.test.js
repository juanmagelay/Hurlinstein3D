const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

const getGlobal = loadScripts();
const generateChunk = getGlobal("generateChunk");
const formatChunk = getGlobal("formatChunk");
const chunkSize = getGlobal("chunkSize");
const doorIndex = getGlobal("doorIndex");

function cellAt(cells, x, y) {
  return cells[y * chunkSize + x];
}

function reachableCells(cells, startX, startY) {
  const visited = new Set();
  const queue = [[startX, startY]];

  while (queue.length > 0) {
    const [x, y] = queue.shift();
    const key = `${x},${y}`;
    if (visited.has(key) || x < 0 || x >= chunkSize || y < 0 || y >= chunkSize) {
      continue;
    }
    if (cellAt(cells, x, y) !== 0) {
      continue;
    }

    visited.add(key);
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return visited;
}

test("generates a 16 by 16 Uint8Array with a room inside its two-cell margin", () => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const { cells, room, roomCenter } = generateChunk();

    assert.equal(cells.length, chunkSize * chunkSize);
    assert.equal(cells.constructor.name, "Uint8Array");
    assert.ok(room.width >= 4 && room.width <= 8);
    assert.ok(room.height >= 4 && room.height <= 8);
    assert.ok(room.x >= 2 && room.y >= 2);
    assert.ok(room.x + room.width <= chunkSize - 2);
    assert.ok(room.y + room.height <= chunkSize - 2);
    assert.equal(cellAt(cells, Math.floor(roomCenter.x), Math.floor(roomCenter.y)), 0);
  }
});

test("keeps every chunk border solid except its fixed door", () => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const { cells } = generateChunk();

    for (let index = 0; index < chunkSize; index += 1) {
      assert.equal(cellAt(cells, index, 0), index === doorIndex ? 0 : 1);
      assert.equal(cellAt(cells, index, chunkSize - 1), index === doorIndex ? 0 : 1);
      assert.equal(cellAt(cells, 0, index), index === doorIndex ? 0 : 1);
      assert.equal(cellAt(cells, chunkSize - 1, index), index === doorIndex ? 0 : 1);
    }
  }
});

test("connects the room to all four doors by construction", () => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const { cells, roomCenter } = generateChunk();
    const startX = Math.floor(roomCenter.x);
    const startY = Math.floor(roomCenter.y);
    const reachable = reachableCells(cells, startX, startY);

    assert.ok(reachable.has(`${doorIndex},0`));
    assert.ok(reachable.has(`${doorIndex},${chunkSize - 1}`));
    assert.ok(reachable.has(`0,${doorIndex}`));
    assert.ok(reachable.has(`${chunkSize - 1},${doorIndex}`));
  }
});

test("prints an ASCII chunk for visual inspection", () => {
  const { cells } = generateChunk();
  const ascii = formatChunk(cells);
  const rows = ascii.split("\n");

  assert.equal(rows.length, chunkSize);
  assert.ok(rows.every((row) => row.length === chunkSize));
  assert.match(ascii, /[.#]/);
  console.log(`\nGenerated chunk:\n${ascii}\n`);
});
