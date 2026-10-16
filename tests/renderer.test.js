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
const wallDepthBuffer = getGlobal("wallDepthBuffer");
const getWallDepthAtColumn = getGlobal("getWallDepthAtColumn");
const getLitWallColor = getGlobal("getLitWallColor");
const ambientLight = getGlobal("ambientLight");

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
  // This context has no generated chunks, so no light reaches any strip and
  // every wall sits at the ambient floor. Strips sharing a color share one fill.
  assert.ok(graphics.fillColors.includes(getLitWallColor(14, 1, 0, ambientLight)));
  assert.ok(graphics.fillColors.includes(getLitWallColor(8, 0, 1, ambientLight)));
  assert.equal(new Set(graphics.fillColors).size, graphics.fillColors.length);
  assert.ok(graphics.fillColors.length < graphics.rects.length);
  for (const rect of graphics.rects) {
    assert.equal(rect.width, stripWidth);
    assert.ok(rect.y >= 0 && rect.y + rect.height <= screenHeight, "rect outside the screen");
  }
});

const getWallTextureX = getGlobal("getWallTextureX");
const wallTextureSize = getGlobal("wallTextureSize");

test("the texture column follows the wallX offset and stays inside the sheet", () => {
  // Center ray runs along +X and hits a side 0 face at posY 2.5: wallX 0.5.
  // rayDirX > 0 flips it to 0.5, so texX = floor(0.5 * 64) = 32.
  const camera = { posX: 2.5, posY: 2.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66 };
  assert.equal(getWallTextureX(camera, screenWidth / 2, { side: 0, perpWallDist: 4 }), 32);

  // Moving toward -X does not flip: wallX 0.25 stays 0.25, texX = 16.
  const leftward = { posX: 5, posY: 2.25, dirX: -1, dirY: 0, planeX: 0, planeY: 0.66 };
  assert.equal(getWallTextureX(leftward, screenWidth / 2, { side: 0, perpWallDist: 3 }), 16);
});

test("a side 1 face maps the X offset and flips when looking up the wall", () => {
  // Center ray runs along -Y and hits a side 1 face at posX 2.25: wallX 0.25.
  // rayDirY < 0 flips it to 0.75, so texX = floor(0.75 * 64) = 48.
  const camera = { posX: 2.25, posY: 5, dirX: 0, dirY: -1, planeX: 0.66, planeY: 0 };
  assert.equal(getWallTextureX(camera, screenWidth / 2, { side: 1, perpWallDist: 3 }), 48);
  assert.equal(wallTextureSize, 64);
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

test("the wall depth buffer stores the DDA perpendicular distance per strip", () => {
  // Same spawn view as above: the center ray runs along +X and hits the wall a
  // cell 14 face, 6.5 cells from posX 7.5.
  const camera = { posX: 7.5, posY: 1.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66 };
  drawWalls(createRecordingGraphics(), camera);

  assert.equal(wallDepthBuffer.length, screenWidth / stripWidth);
  assert.equal(wallDepthBuffer[screenWidth / 2 / stripWidth], 6.5);
  assert.equal(getWallDepthAtColumn(screenWidth / 2), 6.5);
  // Columns inside the same strip share one depth
  assert.equal(getWallDepthAtColumn(screenWidth / 2 + 1), 6.5);
});

test("missed rays store the max ray distance as their occlusion depth", () => {
  // The open floor context has its own renderer state, so read its buffer.
  const getOpenFloorDepth = getOpenFloorGlobal("getWallDepthAtColumn");
  const camera = { posX: 0.5, posY: 0.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66 };
  drawWallsOnOpenFloor(createRecordingGraphics(), camera);

  for (let x = 0; x < screenWidth; x += stripWidth) {
    assert.equal(getOpenFloorDepth(x), maxRayDistance);
  }
});

// A context with no walls at all, so an enemy ahead is never occluded until the
// test lowers the buffer on purpose.
const getEnemyGlobal = loadScripts();
getEnemyGlobal("getCell = function (x, y) { return 0; }");
const drawEnemies = getEnemyGlobal("drawEnemies");
const getEnemyProjection = getEnemyGlobal("getEnemyProjection");
const getEnemyChunkKey = getEnemyGlobal("getChunkKey");
const enemyChunks = getEnemyGlobal("enemiesByChunk");
const enemyWorldBuffer = getEnemyGlobal("wallDepthBuffer");
const enemyColor = getEnemyGlobal("enemyColor");
const enemyCamera = { posX: 0.5, posY: 0.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66 };

test("an enemy straight ahead projects onto the screen center at its cell depth", () => {
  const projection = getEnemyProjection({ posX: 3.5, posY: 0.5 }, enemyCamera);
  assert.ok(projection.transformX === 0);
  assert.equal(projection.depth, 3);
});

test("an enemy ahead is drawn as one centered amber rectangle", () => {
  // 3 cells ahead: width = 720 * 0.3 / 3 = 72 px, height = 720 * 0.6 / 3 = 144 px.
  // So y from 288 to 432, x from 604 to 676.
  enemyChunks.set(getEnemyChunkKey(0, 0), [{ posX: 3.5, posY: 0.5, width: 0.3, height: 0.6 }]);
  const graphics = createRecordingGraphics();
  drawEnemies(graphics, enemyCamera);

  assert.equal(graphics.clearCount, 1);
  assert.ok(graphics.rects.length > 0);
  assert.deepEqual(graphics.fillColors, [enemyColor]);
  for (const rect of graphics.rects) {
    assert.equal(rect.width, stripWidth);
    assert.equal(rect.y, 288);
    assert.equal(rect.height, 144);
  }
  assert.equal(graphics.rects[0].x, 604);
});

test("a wall nearer than the enemy hides its strips", () => {
  // Force every strip's wall depth inside the enemy to 0, closer than depth 3.
  for (let index = 0; index < enemyWorldBuffer.length; index += 1) {
    enemyWorldBuffer[index] = 0;
  }
  const graphics = createRecordingGraphics();
  drawEnemies(graphics, enemyCamera);

  assert.equal(graphics.rects.length, 0);
  assert.deepEqual(graphics.fillColors, []);
});

// D-10: an open context, so a shadow ray only stops on the light distance.
const getLightGlobal = loadScripts();
getLightGlobal("getCell = function (x, y) { return 0; }");
const getWallHitPoint = getLightGlobal("getWallHitPoint");
const getWallLight = getLightGlobal("getWallLight");
const lightRadius = getLightGlobal("lightRadius");
const lightIntensity = getLightGlobal("lightIntensity");

test("the hit point and normal are read from the ray direction", () => {
  const camera = { posX: 2.5, posY: 2.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66 };
  const hit = getWallHitPoint(camera, screenWidth / 2, { side: 0, perpWallDist: 3 });
  assert.equal(hit.x, 5.5);
  assert.equal(hit.y, 2.5);
  assert.equal(hit.normalX, -1);
  assert.equal(hit.normalY, 0);

  const downward = { posX: 5, posY: 5, dirX: 0, dirY: -1, planeX: 0.66, planeY: 0 };
  const sideHit = getWallHitPoint(downward, screenWidth / 2, { side: 1, perpWallDist: 2 });
  assert.equal(sideHit.x, 5);
  assert.equal(sideHit.y, 3);
  assert.equal(sideHit.normalX, 0);
  assert.equal(sideHit.normalY, 1);
});

test("a light in front of the wall brightens it by the radial falloff", () => {
  const lights = [{ x: 4.5, y: 2.5, radius: lightRadius, intensity: lightIntensity }];
  const factor = getWallLight(5.5, 2.5, -1, 0, lights);
  const expected = ambientLight + lightIntensity * (1 - 1 / lightRadius);
  assert.ok(Math.abs(factor - expected) < 1e-9);
});

test("the light stays at the ambient floor beyond the radius or behind the wall", () => {
  const far = [{ x: 9.5, y: 2.5, radius: lightRadius, intensity: lightIntensity }];
  assert.equal(getWallLight(5.5, 2.5, -1, 0, far), ambientLight);

  // The normal points toward -X, so a light on the +X side faces away
  const behind = [{ x: 6.5, y: 2.5, radius: lightRadius, intensity: lightIntensity }];
  assert.equal(getWallLight(5.5, 2.5, -1, 0, behind), ambientLight);
});

// D-10: the same open scene, but cell (4, 2) is a wall between point and light.
const getShadowGlobal = loadScripts();
getShadowGlobal("getCell = function (x, y) { return x === 4 && y === 2 ? 1 : 0; }");
const getShadowedWallLight = getShadowGlobal("getWallLight");
const shadowAmbientLight = getShadowGlobal("ambientLight");

test("a wall between the hit point and the light casts a shadow", () => {
  const lights = [{ x: 4.5, y: 2.5, radius: lightRadius, intensity: lightIntensity }];
  assert.equal(getShadowedWallLight(5.5, 2.5, -1, 0, lights), shadowAmbientLight);
});
