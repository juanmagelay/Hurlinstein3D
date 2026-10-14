const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

const getGlobal = loadScripts();
const player = getGlobal("player");
const getCell = getGlobal("getCell");

// Results like 0.66 * 0.66 are not exact in floating point
function assertClose(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} is not close to ${expected}`);
}

function length(x, y) {
  return Math.sqrt(x * x + y * y);
}

test("dir has length 1", () => {
  assertClose(length(player.dirX, player.dirY), 1);
});

test("plane is perpendicular to dir and 0.66 long", () => {
  // Dot product 0: neither in front of nor behind dir
  const dot = player.dirX * player.planeX + player.dirY * player.planeY;
  assertClose(dot, 0);
  assertClose(length(player.planeX, player.planeY), 0.66);
});

test("plane points to the right of dir, so the view is not mirrored", () => {
  // dir rotated 90 degrees: x' = -y, y' = x. With y growing downward on the map,
  // that turn is to the right.
  assertClose(player.planeX, -player.dirY * 0.66);
  assertClose(player.planeY, player.dirX * 0.66);
});

test("the player spawns on an air cell", () => {
  assert.equal(getCell(Math.floor(player.posX), Math.floor(player.posY)), 0);
});
