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
