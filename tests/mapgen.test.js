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

test("about half the chunks get a second room, always 4 to 6 and reachable", () => {
  const attempts = 300;
  let withSecondRoom = 0;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const { cells, room, roomCenter, secondRoom } = generateChunk();
    if (!secondRoom) {
      continue;
    }
    withSecondRoom += 1;

    assert.ok(secondRoom.width >= 4 && secondRoom.width <= 6);
    assert.ok(secondRoom.height >= 4 && secondRoom.height <= 6);
    assert.ok(secondRoom.x >= 2 && secondRoom.y >= 2);
    assert.ok(secondRoom.x + secondRoom.width <= chunkSize - 2);
    assert.ok(secondRoom.y + secondRoom.height <= chunkSize - 2);

    // It never shares a cell with the main room
    const sharesCells =
      secondRoom.x < room.x + room.width &&
      secondRoom.x + secondRoom.width > room.x &&
      secondRoom.y < room.y + room.height &&
      secondRoom.y + secondRoom.height > room.y;
    assert.equal(sharesCells, false);

    // Its center is open and reachable from the main room center
    const secondCenterX = Math.floor(secondRoom.x + secondRoom.width / 2);
    const secondCenterY = Math.floor(secondRoom.y + secondRoom.height / 2);
    assert.equal(cellAt(cells, secondCenterX, secondCenterY), 0);
    const reachable = reachableCells(cells, Math.floor(roomCenter.x), Math.floor(roomCenter.y));
    assert.ok(reachable.has(`${secondCenterX},${secondCenterY}`));
  }

  // A large main room can leave no gap for a 4 to 6 room, so the share sits a
  // little under 50 percent.
  const rate = withSecondRoom / attempts;
  assert.ok(rate > 0.3 && rate < 0.65, `second room rate ${rate}`);
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
