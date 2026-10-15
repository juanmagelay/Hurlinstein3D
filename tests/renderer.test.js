const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

const getGlobal = loadScripts();
getGlobal("getCell = function (x, y) { return x <= 0 || x >= 14 || y <= 0 || y >= 2 ? 1 : 0; }");
const getWallStrip = getGlobal("getWallStrip");
const drawWalls = getGlobal("drawWalls");
const screenWidth = getGlobal("screenWidth");
const screenHeight = getGlobal("screenHeight");
const stripWidth = getGlobal("stripWidth");
const maxRayDistance = getGlobal("maxRayDistance");
const backgroundColor = getGlobal("backgroundColor");
const wallPalette = getGlobal("wallPalette");
const getChunkKey = getGlobal("getChunkKey");
const getChunkWallColor = getGlobal("getChunkWallColor");
const getWallColor = getGlobal("getWallColor");
const side1Brightness = getGlobal("side1Brightness");
const getDistanceBand = getGlobal("getDistanceBand");
const getDistanceBrightness = getGlobal("getDistanceBrightness");
const shadeColor = getGlobal("shadeColor");

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
  // lineHeight = 720 / 2 = 360, from 360 - 180 to 360 + 180
  const strip = getWallStrip(screenWidth / 2, 2);
  assert.equal(strip.x, screenWidth / 2);
  assert.equal(strip.lineHeight, 360);
  assert.equal(strip.drawStart, 180);
  assert.equal(strip.drawEnd, 540);
});

test("a wall 1 cell away fills the column exactly", () => {
  const strip = getWallStrip(0, 1);
  assert.equal(strip.lineHeight, screenHeight);
  assert.equal(strip.drawStart, 0);
  assert.equal(strip.drawEnd, screenHeight);
});

test("a closer wall is clipped to the screen", () => {
  // lineHeight = 1440 extends beyond both screen edges
  const strip = getWallStrip(0, 0.5);
  assert.equal(strip.lineHeight, 1440);
  assert.equal(strip.drawStart, 0);
  assert.equal(strip.drawEnd, screenHeight);
});

test("a wall at distance 0 fills the column instead of breaking", () => {
  // 720 / 0 is Infinity, and the clip treats it like any wall taller than the screen
  const strip = getWallStrip(0, 0);
  assert.equal(strip.drawStart, 0);
  assert.equal(strip.drawEnd, screenHeight);
});

test("a wall at maxRayDistance is 30 px tall", () => {
  // 720 / 24 = 30, from 360 - 15 to 360 + 15. Missed rays use this strip.
  const strip = getWallStrip(0, maxRayDistance);
  assert.equal(strip.lineHeight, 30);
  assert.equal(strip.drawStart, 345);
  assert.equal(strip.drawEnd, 375);
});

test("distance is quantized into four six-cell brightness bands", () => {
  assert.equal(getDistanceBand(0), 0);
  assert.equal(getDistanceBand(5.99), 0);
  assert.equal(getDistanceBand(6), 1);
  assert.equal(getDistanceBand(12), 2);
  assert.equal(getDistanceBand(18), 3);
  assert.equal(getDistanceBand(maxRayDistance), 3);
  assert.equal(getDistanceBrightness(0), 1);
  assert.equal(getDistanceBrightness(6), 0.8);
  assert.equal(getDistanceBrightness(12), 0.6);
  assert.equal(getDistanceBrightness(18), 0.4);
});

test("distance shading darkens colors and keeps side 1 darker", () => {
  for (const brightness of [1, 0.8, 0.6, 0.4]) {
    const baseColor = wallPalette[0];
    const side0Color = shadeColor(baseColor, brightness);
    const side1Color = shadeColor(baseColor, brightness * side1Brightness);
    assert.ok(side0Color <= baseColor);
    assert.ok(side1Color < side0Color);
  }
  assert.equal(shadeColor(wallPalette[0], 1), wallPalette[0]);
});

test("chunk colors use a deterministic palette across positive and negative cells", () => {
  assert.equal(getChunkWallColor(0, 0), wallPalette[getChunkKey(0, 0) % wallPalette.length]);
  assert.equal(getChunkWallColor(-1, 15), getChunkWallColor(-16, 0));
  assert.equal(getChunkWallColor(0, 0), wallPalette[0]);
  assert.equal(getChunkWallColor(-1, 0), wallPalette[1]);
  assert.equal(getChunkWallColor(0, -1), wallPalette[2]);
  assert.equal(getChunkWallColor(16, 0), wallPalette[3]);
});

test("wall color combines chunk, side and distance shading", () => {
  const baseColor = getChunkWallColor(-1, 0);

  assert.equal(getWallColor(-1, 0, 0, 0), baseColor);
  assert.equal(getWallColor(-1, 0, 1, 0), shadeColor(baseColor, side1Brightness));
  assert.equal(getWallColor(-1, 0, 0, 18), shadeColor(baseColor, 0.4));
});

test("the canvas is 16:9 and casts 640 rays", () => {
  assert.equal(screenWidth, 1280);
  assert.equal(screenHeight, 720);
  assert.equal(screenWidth / screenHeight, 16 / 9);
  assert.equal(screenWidth / stripWidth, 640);
});

test("from the spawn, wall strips share color fills and stay on screen", () => {
  // Spawn view: the center hits a side 0 face, the edges hit side 1 faces
  const camera = { posX: 7.5, posY: 1.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66 };
  const graphics = createRecordingGraphics();
  drawWalls(graphics, camera);

  assert.equal(graphics.clearCount, 1);
  // 1280 / 2 = 640 strips, one rect each
  assert.equal(graphics.rects.length, screenWidth / stripWidth);
  // Every ray hits within maxRayDistance, so there is no background fill.
  // Strips sharing a shaded color are accumulated into one fill.
  assert.ok(graphics.fillColors.includes(getWallColor(14, 1, 0, 6.5)));
  assert.ok(graphics.fillColors.includes(getWallColor(8, 0, 1, 0.5 / 0.66)));
  assert.equal(new Set(graphics.fillColors).size, graphics.fillColors.length);
  assert.ok(graphics.fillColors.length < graphics.rects.length);
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
    assert.equal(rect.y, 345);
    assert.equal(rect.height, 30);
  }
});
