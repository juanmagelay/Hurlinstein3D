const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

const getGlobal = loadScripts();
const getWallStrip = getGlobal("getWallStrip");
const drawWalls = getGlobal("drawWalls");
const screenWidth = getGlobal("screenWidth");
const screenHeight = getGlobal("screenHeight");
const stripWidth = getGlobal("stripWidth");
const maxRayDistance = getGlobal("maxRayDistance");
const backgroundColor = getGlobal("backgroundColor");
const wallColorSide0 = getGlobal("wallColorSide0");
const wallColorSide1 = getGlobal("wallColorSide1");

// Stands in for a PIXI.Graphics and records what drawWalls asks it to draw
function createRecordingGraphics() {
  const graphics = { clearCount: 0, rects: [], fillColors: [] };
  graphics.clear = () => {
    graphics.clearCount += 1;
  };
  graphics.rect = (x, y, width, height) => {
    graphics.rects.push({ x, y, width, height });
  };
  graphics.fill = (color) => {
    graphics.fillColors.push(color);
  };
  return graphics;
}

test("a wall 2 cells away is half the screen tall, centered on the horizon", () => {
  // lineHeight = 600 / 2 = 300, from 300 - 150 to 300 + 150
  const strip = getWallStrip(400, 2);
  assert.equal(strip.x, 400);
  assert.equal(strip.lineHeight, 300);
  assert.equal(strip.drawStart, 150);
  assert.equal(strip.drawEnd, 450);
});

test("a wall 1 cell away fills the column exactly", () => {
  const strip = getWallStrip(0, 1);
  assert.equal(strip.lineHeight, screenHeight);
  assert.equal(strip.drawStart, 0);
  assert.equal(strip.drawEnd, screenHeight);
});

test("a closer wall is clipped to the screen", () => {
  // lineHeight = 1200 would go from -300 to 900
  const strip = getWallStrip(0, 0.5);
  assert.equal(strip.lineHeight, 1200);
  assert.equal(strip.drawStart, 0);
  assert.equal(strip.drawEnd, screenHeight);
});

test("a wall at distance 0 fills the column instead of breaking", () => {
  // 600 / 0 is Infinity, and the clip treats it like any wall taller than the screen
  const strip = getWallStrip(0, 0);
  assert.equal(strip.drawStart, 0);
  assert.equal(strip.drawEnd, screenHeight);
});

test("a wall at maxRayDistance is 25 px tall", () => {
  // 600 / 24 = 25, from 300 - 12.5 to 300 + 12.5. Missed rays use this strip.
  const strip = getWallStrip(0, maxRayDistance);
  assert.equal(strip.lineHeight, 25);
  assert.equal(strip.drawStart, 287.5);
  assert.equal(strip.drawEnd, 312.5);
});

test("from the spawn, the walls take one fill per side and stay on screen", () => {
  // Spawn view: the center hits a side 0 face, the edges hit side 1 faces
  const camera = { posX: 7.5, posY: 1.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66 };
  const graphics = createRecordingGraphics();
  drawWalls(graphics, camera);

  assert.equal(graphics.clearCount, 1);
  // 800 / 2 = 400 strips, one rect each
  assert.equal(graphics.rects.length, screenWidth / stripWidth);
  // Every ray hits within maxRayDistance, so there is no background fill
  assert.deepEqual(graphics.fillColors, [wallColorSide0, wallColorSide1]);
  for (const rect of graphics.rects) {
    assert.equal(rect.width, stripWidth);
    assert.ok(rect.y >= 0 && rect.y + rect.height <= screenHeight, "rect outside the screen");
  }
});

// An open floor with no walls at all, so every ray misses. getGlobal evaluates
// code in its context, so it can also replace getCell there.
const getOpenFloorGlobal = loadScripts();
getOpenFloorGlobal("getCell = function (x, y) { return 0; }");
const drawWallsOnOpenFloor = getOpenFloorGlobal("drawWalls");

test("rays that hit nothing draw a background strip as tall as a wall at maxRayDistance", () => {
  const camera = { posX: 0.5, posY: 0.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66 };
  const graphics = createRecordingGraphics();
  drawWallsOnOpenFloor(graphics, camera);

  assert.equal(graphics.rects.length, screenWidth / stripWidth);
  assert.deepEqual(graphics.fillColors, [backgroundColor]);
  for (const rect of graphics.rects) {
    assert.equal(rect.y, 287.5);
    assert.equal(rect.height, 25);
  }
});
