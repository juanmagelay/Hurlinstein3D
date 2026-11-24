const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

const get = loadScripts();
const createRandom = get("createRandom");
const generateChunk = get("generateChunk");
const getChunkSeed = get("getChunkSeed");

test("seeded random values stay in [0, 1) and repeat", () => {
  const first = createRandom(12345);
  const second = createRandom(12345);
  for (let index = 0; index < 100; index += 1) {
    const value = first();
    assert.ok(value >= 0 && value < 1);
    assert.equal(value, second());
  }
});

test("same chunk coordinates and world seed reproduce the same map", () => {
  const seed = getChunkSeed(12345, -2, 3);
  assert.deepEqual(
    Array.from(generateChunk(createRandom(seed)).cells),
    Array.from(generateChunk(createRandom(seed)).cells),
  );
});

test("chunk generation is independent of exploration order", () => {
  const keySeed = (x, y) => getChunkSeed(54321, x, y);
  const eastFirst = generateChunk(createRandom(keySeed(1, 0))).cells;
  generateChunk(createRandom(keySeed(0, 0)));
  const westFirst = generateChunk(createRandom(keySeed(1, 0))).cells;
  assert.deepEqual(Array.from(eastFirst), Array.from(westFirst));
});

// D-30b: the chunk cells of a world, read through getCell like the raycaster
function readChunkThroughWorld(world, cx, cy) {
  const cells = [];
  for (let ly = 0; ly < 16; ly++) {
    for (let lx = 0; lx < 16; lx++) {
      cells.push(world("getCell")(cx * 16 + lx, cy * 16 + ly));
    }
  }
  return cells;
}

test("D-30b the same seed gives the same chunk whichever way the player explores first", () => {
  const eastFirst = loadScripts();
  eastFirst("resetGame")(2024);
  const eastChunk = readChunkThroughWorld(eastFirst, 1, 0);
  readChunkThroughWorld(eastFirst, 0, 0);

  const westFirst = loadScripts();
  westFirst("resetGame")(2024);
  readChunkThroughWorld(westFirst, 0, 0);
  readChunkThroughWorld(westFirst, -1, 0);
  readChunkThroughWorld(westFirst, -1, -1);
  const laterEastChunk = readChunkThroughWorld(westFirst, 1, 0);

  assert.deepEqual(laterEastChunk, eastChunk);
});

test("D-30b two seeds give different worlds", () => {
  const first = loadScripts();
  first("resetGame")(1);
  const second = loadScripts();
  second("resetGame")(2);
  const chunks = [[0, 0], [1, 0], [0, 1], [-1, -1]];
  const differs = chunks.some(([cx, cy]) =>
    JSON.stringify(readChunkThroughWorld(first, cx, cy)) !==
    JSON.stringify(readChunkThroughWorld(second, cx, cy)));
  assert.ok(differs);
});
