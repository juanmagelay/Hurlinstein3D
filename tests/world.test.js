const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

const getGlobal = loadScripts();
const getCell = getGlobal("getCell");

test("getCell reads air and wall cells inside the map", () => {
  assert.equal(getCell(1, 1), 0);
  assert.equal(getCell(7, 1), 0);
  assert.equal(getCell(2, 2), 1);
  assert.equal(getCell(0, 0), 1);
  assert.equal(getCell(14, 14), 1);
});

test("getCell reads rows as y and columns as x", () => {
  // The map is not symmetric here: swapping x and y gives a different cell
  assert.equal(getCell(4, 2), 0);
  assert.equal(getCell(2, 4), 1);
});

test("getCell returns wall just outside each side of the map", () => {
  assert.equal(getCell(13, 1), 0);
  assert.equal(getCell(15, 1), 1);
  assert.equal(getCell(1, 15), 1);
  assert.equal(getCell(-1, 1), 1);
  assert.equal(getCell(1, -1), 1);
});

test("getCell returns wall for negative and far coordinates", () => {
  assert.equal(getCell(-100, -100), 1);
  assert.equal(getCell(-1, -1), 1);
  assert.equal(getCell(1000, 3), 1);
  assert.equal(getCell(3, 1000), 1);
});
