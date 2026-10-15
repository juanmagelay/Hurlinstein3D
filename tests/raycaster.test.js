const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

const getGlobal = loadScripts();
const castRay = getGlobal("castRay");
const castRayForColumn = getGlobal("castRayForColumn");
const screenWidth = getGlobal("screenWidth");
const maxRayDistance = getGlobal("maxRayDistance");

getGlobal(`getCell = function (x, y) {
  return ["14,1", "0,1", "1,14", "1,0", "7,2", "8,0", "8,2"].includes(x + "," + y) ? 1 : 0;
}`);

// Results like 0.5 / 0.66 are not exact in floating point
function assertClose(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} is not close to ${expected}`);
}

// Field by field: objects made inside the vm context have their own
// Object.prototype, so assert.deepEqual rejects them
function assertRay(ray, expected) {
  assert.equal(ray.hit, expected.hit);
  assert.equal(ray.side, expected.side);
  assert.equal(ray.mapX, expected.mapX);
  assert.equal(ray.mapY, expected.mapY);
  assertClose(ray.perpWallDist, expected.perpWallDist);
}

// At the start of the row 1 corridor, facing east, like the spawn
const camera = { posX: 7.5, posY: 1.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66 };

test("axis aligned rays hit the first wall in each direction", () => {
  // East along row 1: the wall face is the line x = 14, and 14 - 7.5 = 6.5
  assertRay(castRay(7.5, 1.5, 1, 0), { hit: true, perpWallDist: 6.5, side: 0, mapX: 14, mapY: 1 });
  // West: the face of cell 0 is the line x = 1, and 7.5 - 1 = 6.5
  assertRay(castRay(7.5, 1.5, -1, 0), { hit: true, perpWallDist: 6.5, side: 0, mapX: 0, mapY: 1 });
  // South along column 1: the face is the line y = 14, and 14 - 1.5 = 12.5
  assertRay(castRay(1.5, 1.5, 0, 1), { hit: true, perpWallDist: 12.5, side: 1, mapX: 1, mapY: 14 });
  // North: the face of row 0 is the line y = 1, and 13.5 - 1 = 12.5
  assertRay(castRay(1.5, 13.5, 0, -1), { hit: true, perpWallDist: 12.5, side: 1, mapX: 1, mapY: 0 });
});

test("a zero ray component never moves the ray on that axis", () => {
  // rayDirX = 0 gives deltaDistX = 1 / 0 = Infinity, so x never wins the comparison
  // and the ray goes straight from the air cell (7, 1) into the wall cell (7, 2)
  const expected = { hit: true, perpWallDist: 0.5, side: 1, mapX: 7, mapY: 2 };
  assertRay(castRay(7.5, 1.5, 0, 1), expected);
  // -0 too, which rotating dir and plane can produce. Without Math.abs,
  // 1 / -0 would be -Infinity and x would win every comparison.
  assertRay(castRay(7.5, 1.5, -0, 1), expected);
});

test("perpWallDist matches a hand computed value, not the euclidean distance", () => {
  // P(t) = (7.5, 1.5) + t * (1, -0.5) crosses x = 8 at t = 0.5 into the air cell (8, 1),
  // then y = 1 at t = 1 into the wall cell (8, 0), at the point (8.5, 1).
  // perpWallDist is t = 1, the distance along dir (8.5 - 7.5).
  // The euclidean distance would be sqrt(1 * 1 + 0.5 * 0.5) = 1.118.
  assertRay(castRay(7.5, 1.5, 1, -0.5), { hit: true, perpWallDist: 1, side: 1, mapX: 8, mapY: 0 });
});

test("cameraX spreads the columns from the left edge to the right edge", () => {
  // Center column: cameraX = 0, so rayDir is dir
  const center = castRayForColumn(camera, screenWidth / 2);
  assertRay(center, { hit: true, perpWallDist: 6.5, side: 0, mapX: 14, mapY: 1 });

  // Column 0: cameraX = -1, rayDir = (1, -0.66) turns left, toward -y (up on the map)
  const left = castRayForColumn(camera, 0);
  assertRay(left, { hit: true, perpWallDist: 0.5 / 0.66, side: 1, mapX: 8, mapY: 0 });

  // Last column: cameraX close to +1, turns right, toward +y (down on the map)
  const right = castRayForColumn(camera, screenWidth - 1);
  assert.equal(right.hit, true);
  assert.equal(right.side, 1);
  assert.equal(right.mapX, 8);
  assert.equal(right.mapY, 2);
});

// The fixed map is too small for a ray to reach maxRayDistance, so these tests use
// a second context where getCell is open floor with a wall from x = 30 on.
// getGlobal evaluates code in its context, so it can also replace getCell there.
const getOpenFloorGlobal = loadScripts();
getOpenFloorGlobal("getCell = function (x, y) { return x >= 30 ? 1 : 0; }");
const castRayOnOpenFloor = getOpenFloorGlobal("castRay");

test("a wall past maxRayDistance is not seen", () => {
  assert.equal(maxRayDistance, 24);
  // From x = 0.5 the wall is 29.5 away
  const ray = castRayOnOpenFloor(0.5, 0.5, 1, 0);
  assert.equal(ray.hit, false);
  // The last grid line crossed, x = 24, was 23.5 away. The next one is 24.5 away.
  assert.equal(ray.mapX, 24);
});

test("a wall within maxRayDistance is seen", () => {
  // From x = 10.5 the wall is 19.5 away
  assertRay(castRayOnOpenFloor(10.5, 0.5, 1, 0), { hit: true, perpWallDist: 19.5, side: 0, mapX: 30, mapY: 0 });
});
