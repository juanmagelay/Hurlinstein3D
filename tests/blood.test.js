const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

// D-39d / TDD 2.3.2 and 6.8: blood stains stored per cell, in the chunk of the cell

test("D-39d: stains at negative cells and on both sides of a chunk border", () => {
  const world = loadScripts();
  const addStain = world("addStain");
  const getStain = world("getStain");
  const getChunkKey = world("getChunkKey");
  const stainsByChunk = world("stainsByChunk");

  addStain(-1, -1);
  addStain(15, 3);
  addStain(16, 3);
  addStain(-17, 40);

  for (const [x, y] of [[-1, -1], [15, 3], [16, 3], [-17, 40]]) {
    const shape = getStain(x, y);
    assert.ok(shape >= 1 && shape <= 4, `stain at ${x}, ${y}`);
  }
  // The neighbors of each stain stay clean
  for (const [x, y] of [[0, -1], [-1, 0], [-2, -1], [14, 3], [17, 3], [16, 4], [-16, 40]]) {
    assert.equal(getStain(x, y), 0, `no stain at ${x}, ${y}`);
  }
  // Each stain lives in the chunk of its cell: 15 and 16 are in chunks 0 and 1,
  // -1 is in chunk -1 and -17 in chunk -2 (Math.floor)
  assert.deepEqual(
    [...stainsByChunk.keys()].sort((a, b) => a - b),
    [getChunkKey(-1, -1), getChunkKey(0, 0), getChunkKey(1, 0), getChunkKey(-2, 2)].sort((a, b) => a - b),
  );
  // Index ly * 16 + lx inside the chunk: cell (15, 3) is 3 * 16 + 15 = 63,
  // and cell (-1, -1) is the last one of chunk (-1, -1), 15 * 16 + 15 = 255
  assert.equal(stainsByChunk.get(getChunkKey(0, 0))[63], getStain(15, 3));
  assert.equal(stainsByChunk.get(getChunkKey(-1, -1))[255], getStain(-1, -1));
});

test("D-39d: asking for a chunk without stains answers 0 and creates nothing", () => {
  const world = loadScripts();
  const getStain = world("getStain");
  const stainsByChunk = world("stainsByChunk");

  assert.equal(getStain(500, -500), 0);
  assert.equal(world("getChunkStains")(31, -32), null);
  assert.equal(stainsByChunk.size, 0);
});

test("D-39d: one stain per cell, and the first one stays", () => {
  const world = loadScripts();
  const addStain = world("addStain");
  const getStain = world("getStain");
  const stainsByChunk = world("stainsByChunk");
  const getChunkKey = world("getChunkKey");

  addStain(5, 7);
  const cells = stainsByChunk.get(getChunkKey(0, 0));
  // Another shape in the cell, as if a different enemy had died there first
  const firstShape = getStain(5, 7) === 1 ? 2 : 1;
  cells[7 * 16 + 5] = firstShape;
  addStain(5, 7);
  assert.equal(getStain(5, 7), firstShape);
  assert.equal(cells.filter((shape) => shape !== 0).length, 1);
});

test("D-39d: the same seed gives the same shapes in any order", () => {
  const world = loadScripts();
  const resetGame = world("resetGame");
  const addStain = world("addStain");
  const getStain = world("getStain");
  const cells = [];
  for (let index = 0; index < 60; index++) {
    cells.push([index * 7 - 200, 150 - index * 5]);
  }

  resetGame(1234);
  cells.forEach(([x, y]) => addStain(x, y));
  const shapes = cells.map(([x, y]) => getStain(x, y));

  resetGame(1234);
  [...cells].reverse().forEach(([x, y]) => addStain(x, y));
  assert.deepEqual(cells.map(([x, y]) => getStain(x, y)), shapes);

  // The four shapes all show up, and another seed changes some of them
  assert.deepEqual([...new Set(shapes)].sort(), [1, 2, 3, 4]);
  resetGame(99);
  cells.forEach(([x, y]) => addStain(x, y));
  assert.notDeepEqual(cells.map(([x, y]) => getStain(x, y)), shapes);
});

test("D-39d: a killed enemy stains the cell Math.floor gives, negatives included", () => {
  const world = loadScripts();
  const getStain = world("getStain");

  world("startEnemyDeath")({ posX: -0.5, posY: 3.2, height: 0.6 });

  assert.notEqual(getStain(-1, 3), 0);
  assert.equal(getStain(0, 3), 0);
});
