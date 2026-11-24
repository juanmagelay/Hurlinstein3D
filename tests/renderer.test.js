const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

const getGlobal = loadScripts();
getGlobal("getCell = function (x, y) { return x <= 0 || x >= 14 || y <= 0 || y >= 2 ? 1 : 0; }");
const getWallStrip = getGlobal("getWallStrip");
const drawWalls = getGlobal("drawWalls");
const screenWidth = getGlobal("screenWidth");
const screenHeight = getGlobal("screenHeight");
// D-16e1: the strip width is a setting, 2 px by default
const gameSettings = getGlobal("gameSettings");
const stripWidth = gameSettings.stripWidth;
const maxRayDistance = getGlobal("maxRayDistance");
const backgroundColor = getGlobal("backgroundColor");
const wallPalette = getGlobal("wallPalette");
const getChunkKey = getGlobal("getChunkKey");
const getChunkWallColor = getGlobal("getChunkWallColor");
const getWallVariant = getGlobal("getWallVariant");
const getWallColor = getGlobal("getWallColor");
const side1Brightness = getGlobal("side1Brightness");
const getDistanceBand = getGlobal("getDistanceBand");
const getDistanceBrightness = getGlobal("getDistanceBrightness");
const shadeColor = getGlobal("shadeColor");
const wallDepthBuffer = getGlobal("wallDepthBuffer");
const getWallDepthAtColumn = getGlobal("getWallDepthAtColumn");
const getLitWallColor = getGlobal("getLitWallColor");
const ambientLight = getGlobal("ambientLight");
const getRowDistance = getGlobal("getRowDistance");
const getFloorWorldPoint = getGlobal("getFloorWorldPoint");
const getFloorTextureColor = getGlobal("getFloorTextureColor");

test("D-28c row distance and center-column floor point match Lode's projection", () => {
  // At y=540, rowDistance = (720 / 2) / (540 - 360) = 2.
  assert.equal(getRowDistance(540), 2);
  const player = { posX: 3.25, posY: -2.5, dirX: 0.6, dirY: 0.8, planeX: -0.528, planeY: 0.396 };
  const point = getFloorWorldPoint(player, 0, 2);
  assert.ok(Math.abs(point.x - 4.45) < 1e-12);
  assert.ok(Math.abs(point.y + 0.9) < 1e-12);
});

// D-28c: a fake floor casting surface, as wide as the real one, that records
// the dirty rectangle and the sprite scale of the last frame
function createFakeFloorSurface(height) {
  const width = getGlobal("maxWallStripCount");
  const surface = {
    canvas: { width, height },
    imageData: { data: new Uint8ClampedArray(width * height * 4) },
    context: {
      putImageData(imageData, x, y, dirtyX, dirtyY, dirtyWidth, dirtyHeight) {
        surface.dirtyRect = [dirtyX, dirtyY, dirtyWidth, dirtyHeight];
      },
    },
    sprite: {
      visible: true,
      scale: { set(x, y) { surface.spriteScale = [x, y]; } },
      texture: { source: { update() { surface.uploads += 1; } } },
    },
    uploads: 0,
  };
  return surface;
}

function readPixel(surface, column, row) {
  const index = (row * surface.canvas.width + column) * 4;
  return [...surface.imageData.data.slice(index, index + 4)];
}

// Replaces getFloorTextureColor while fn runs, so a test sees every sample
function withRecordedFloorSamples(color, fn) {
  const original = getGlobal("getFloorTextureColor");
  getGlobal("floorSamples = []");
  getGlobal(`getFloorTextureColor = function (x, y, isCeiling, rowDistance) {
    floorSamples.push({ x, y, isCeiling, rowDistance });
    return ${color};
  }`);
  try {
    return fn(getGlobal("floorSamples"));
  } finally {
    getGlobal(`getFloorTextureColor = ${original.toString()}`);
  }
}

test("D-28c floor casting takes one sample per strip width square, stretched to the strips", () => {
  const updateFloorCasting = getGlobal("updateFloorCasting");
  const getWallStripCount = getGlobal("getWallStripCount");
  const getRowDistance = getGlobal("getRowDistance");
  const surface = createFakeFloorSurface(screenHeight);
  const player = { posX: 0.5, posY: 0.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66 };
  try {
    gameSettings.stripWidth = 4;
    const columns = getWallStripCount();
    const rows = screenHeight / 4;
    let texturedRows = 0;
    for (let row = 0; row < rows; row++) {
      if (getRowDistance((row + 0.5) * 4) <= maxRayDistance) {
        texturedRows += 1;
      }
    }
    withRecordedFloorSamples("0x0b1621", (samples) => {
      updateFloorCasting(surface, player, false);
      assert.equal(surface.sprite.visible, false);
      assert.equal(samples.length, 0);

      updateFloorCasting(surface, player, true);
      assert.equal(surface.sprite.visible, true);
      assert.equal(samples.length, columns * texturedRows);
    });
    // One canvas pixel per sample, only that corner is written and uploaded,
    // and the sprite is stretched 4 times, so sample i covers wall strip i
    assert.deepEqual(surface.dirtyRect, [0, 0, columns, rows]);
    assert.deepEqual(surface.spriteScale, [4, 4]);
    assert.equal(surface.uploads, 1);
    assert.deepEqual(readPixel(surface, 0, 0), [0x0b, 0x16, 0x21, 255]);
    assert.deepEqual(readPixel(surface, columns - 1, rows - 1), [0x0b, 0x16, 0x21, 255]);
    assert.deepEqual(readPixel(surface, columns, 0), [0, 0, 0, 0]);
  } finally {
    gameSettings.stripWidth = stripWidth;
  }
});

test("D-28c each floor sample is Lode's floor point of its strip center ray", () => {
  const drawFloorCasting = getGlobal("drawFloorCasting");
  const getWallStripCount = getGlobal("getWallStripCount");
  const surface = createFakeFloorSurface(screenHeight);
  const player = { posX: 3.25, posY: -2.5, dirX: 0.6, dirY: 0.8, planeX: -0.528, planeY: 0.396 };
  withRecordedFloorSamples("0x000000", (samples) => {
    drawFloorCasting(surface, player);
    const columns = getWallStripCount();
    // The bottom row is a floor row; its samples are the last columns ones
    const bottomRow = samples.slice(-columns);
    assert.ok(bottomRow.every((sample) => !sample.isCeiling));
    for (let column = 0; column < columns; column += 37) {
      const cameraX = 2 * (column + 0.5) / columns - 1;
      const sample = bottomRow[column];
      const expected = getFloorWorldPoint(player, cameraX, sample.rowDistance);
      assert.ok(Math.abs(sample.x - expected.x) < 1e-9);
      assert.ok(Math.abs(sample.y - expected.y) < 1e-9);
    }
    assert.ok(samples.some((sample) => sample.isCeiling));
  });
});

test("D-28c rows past maxRayDistance are the background, like a ray without a hit", () => {
  const drawFloorCasting = getGlobal("drawFloorCasting");
  const getRowDistance = getGlobal("getRowDistance");
  const surface = createFakeFloorSurface(screenHeight);
  const player = { posX: 0.5, posY: 0.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66 };
  withRecordedFloorSamples("0x2c3742", (samples) => {
    drawFloorCasting(surface, player);
    assert.ok(samples.every((sample) => sample.rowDistance <= maxRayDistance));
  });
  // With 2 px strips, row 179 is centered 1 px above the horizon: far past the cap
  const horizonRow = screenHeight / 2 / stripWidth - 1;
  assert.ok(getRowDistance((horizonRow + 0.5) * stripWidth) > maxRayDistance);
  const background = [(backgroundColor >> 16) & 0xff, (backgroundColor >> 8) & 0xff, backgroundColor & 0xff, 255];
  assert.deepEqual(readPixel(surface, 0, horizonRow), background);
  assert.deepEqual(readPixel(surface, 0, horizonRow + 1), background);
  assert.deepEqual(readPixel(surface, 0, 0), [0x2c, 0x37, 0x42, 255]);
});

function getRed(color) {
  return (color >> 16) & 0xff;
}

// D-28d: a steady room light, like the ones js/world.js creates
function createSteadyLight() {
  const light = { x: 2.5, y: 3.5, radius: getGlobal("lightRadius"), intensity: getGlobal("lightIntensity") };
  assert.equal(getGlobal("isFlickeringLamp")(light), false);
  return light;
}

test("D-28d with lighting off, floor and ceiling darken with the distance bands and lamps show", () => {
  const light = createSteadyLight();
  getGlobal("useLighting = false");
  try {
    const lamp = getFloorTextureColor(2.5, 3.5, true, 1, [light]);
    const near = getFloorTextureColor(2.5, 3.5, true, 1, []);
    const far = getFloorTextureColor(2.5, 3.5, true, maxRayDistance, []);
    assert.ok(getRed(lamp) > getRed(near));
    assert.ok(getRed(near) > getRed(far));
    assert.ok(getFloorTextureColor(2.5, 3.5, false, 1, []) > 0);
  } finally {
    getGlobal("useLighting = true");
  }
});

test("D-28d with lighting on, the room light shades the floor like the walls", () => {
  const light = createSteadyLight();
  const underLight = getFloorTextureColor(2.6, 3.6, false, 1, [light]);
  const pastRadius = getFloorTextureColor(2.6 + light.radius, 3.6, false, 1, [light]);
  const ambientOnly = getFloorTextureColor(2.6, 3.6, false, 1, []);
  assert.ok(getRed(underLight) > getRed(pastRadius));
  assert.equal(pastRadius, ambientOnly);
  // The light replaces the distance bands (D-10), so distance alone changes nothing
  assert.equal(getFloorTextureColor(2.6, 3.6, false, 20, [light]), underLight);
});

test("D-28d a tile joint is darker than the tile, and the color stays one 0xRRGGBB number", () => {
  const tile = getFloorTextureColor(2.5, 3.5, false, 1, []);
  const joint = getFloorTextureColor(2.01, 3.5, false, 1, []);
  assert.ok(getRed(joint) < getRed(tile));
  assert.ok(Number.isInteger(tile) && tile >= 0 && tile <= 0xffffff);
});

// D-28d: lamps at the center of cells in a 40 by 40 area, negatives included
function getSampleLamps() {
  const lamps = [];
  for (let x = -20; x < 20; x++) {
    for (let y = -20; y < 20; y++) {
      lamps.push({ x: x + 0.5, y: y + 0.5 });
    }
  }
  return lamps;
}

test("D-28d about one lamp in five flickers, always the same ones", () => {
  const isFlickeringLamp = getGlobal("isFlickeringLamp");
  const lamps = getSampleLamps();
  const flickering = lamps.filter((lamp) => isFlickeringLamp(lamp));
  const share = flickering.length / lamps.length;
  assert.ok(share > 0.12 && share < 0.28, `share ${share}`);
  for (const lamp of lamps) {
    assert.equal(isFlickeringLamp(lamp), isFlickeringLamp({ x: lamp.x, y: lamp.y }));
  }
});

test("D-28d a steady lamp never dims and a flickering one blinks twice per period", () => {
  const isFlickeringLamp = getGlobal("isFlickeringLamp");
  const getLampBrightness = getGlobal("getLampBrightness");
  const lampFlickerPeriod = getGlobal("lampFlickerPeriod");
  const lampFlickerDim = getGlobal("lampFlickerDim");
  const lamps = getSampleLamps();
  const steady = lamps.find((lamp) => !isFlickeringLamp(lamp));
  const flickering = lamps.find((lamp) => isFlickeringLamp(lamp));

  let blinks = 0;
  let dimSamples = 0;
  let wasDim = false;
  const samples = 4000;
  for (let step = 0; step < samples; step++) {
    const time = lampFlickerPeriod * step / samples;
    assert.equal(getLampBrightness(steady, time), 1);
    const isDim = getLampBrightness(flickering, time) === lampFlickerDim;
    if (isDim) {
      dimSamples += 1;
    }
    if (isDim && !wasDim) {
      blinks += 1;
    }
    wasDim = isDim;
  }
  // Two short blinks; one may be split by the end of the sampled period
  assert.ok(blinks >= 2 && blinks <= 3, `blinks ${blinks}`);
  assert.ok(dimSamples / samples < 0.1);
});

test("D-28b wall variants are stable and cover all three across negative cells", () => {
  const variants = new Set();
  for (let x = -20; x < 20; x += 1) {
    for (let y = -20; y < 20; y += 1) {
      assert.equal(getWallVariant(x, y), getWallVariant(x, y));
      variants.add(getWallVariant(x, y));
    }
  }
  assert.deepEqual([...variants].sort(), [0, 1, 2]);
});

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
  assert.equal(getDistanceBrightness(6), 0.75);
  assert.equal(getDistanceBrightness(12), 0.4);
  assert.equal(getDistanceBrightness(18), 0.08);
});

test("distance shading darkens colors and keeps side 1 darker", () => {
    for (const brightness of [1, 0.75, 0.4, 0.08]) {
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
  assert.equal(getWallColor(-1, 0, 0, 18), shadeColor(baseColor, 0.08));
});

test("the canvas is 16:9 and casts 640 rays", () => {
  assert.equal(screenWidth, 1280);
  assert.equal(screenHeight, 720);
  assert.equal(screenWidth / screenHeight, 16 / 9);
  assert.equal(screenWidth / stripWidth, 640);
});

test("D-16e1: the strip width sets the rays per frame", () => {
  const getWallStripCount = getGlobal("getWallStripCount");
  const expected = { 1: 1280, 2: 640, 4: 320, 8: 160 };
  try {
    for (const width of [1, 2, 4, 8]) {
      gameSettings.stripWidth = width;
      assert.equal(getWallStripCount(), expected[width]);
    }
    // The widest canvas, 1680 px, casts from 1680 rays down to 210
    getGlobal("screenWidth = 1680");
    gameSettings.stripWidth = 1;
    assert.equal(getWallStripCount(), 1680);
    gameSettings.stripWidth = 8;
    assert.equal(getWallStripCount(), 210);
  } finally {
    getGlobal("screenWidth = 1280");
    gameSettings.stripWidth = 2;
  }
});

test("D-16e1: each strip starts at index times the width and has that width", () => {
  const camera = { posX: 7.5, posY: 1.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66 };
  try {
    for (const width of [1, 2, 4, 8]) {
      gameSettings.stripWidth = width;
      const graphics = createRecordingGraphics();
      drawWalls(graphics, camera);
      const xs = graphics.rects.map((rect) => rect.x).sort((a, b) => a - b);
      assert.equal(xs.length, screenWidth / width);
      assert.equal(xs[1], width);
      assert.equal(xs[xs.length - 1], screenWidth - width);
      assert.ok(graphics.rects.every((rect) => rect.width === width));
    }
  } finally {
    gameSettings.stripWidth = 2;
  }
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

  // D-16a / D-16e1: sized for the widest canvas (21:9, 1680 px) with 1 px
  // strips, so neither a resize nor a new strip width reallocates it
  assert.equal(wallDepthBuffer.length, 1680);
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

test("an enemy ahead is drawn as one amber rectangle standing on the floor", () => {
  // 3 cells ahead: width = 720 * 0.3 / 3 = 72 px, height = 720 * 0.6 / 3 = 144 px.
  // D-21b: the floor line is 360 + 720 / (2 * 3) = 480, so y from 336 to 480,
  // and x from 604 to 676.
  enemyChunks.set(getEnemyChunkKey(0, 0), [{ posX: 3.5, posY: 0.5, width: 0.3, height: 0.6 }]);
  const graphics = createRecordingGraphics();
  drawEnemies(graphics, enemyCamera);

  assert.equal(graphics.clearCount, 1);
  assert.ok(graphics.rects.length > 0);
  assert.deepEqual(graphics.fillColors, [enemyColor]);
  for (const rect of graphics.rects) {
    assert.equal(rect.width, stripWidth);
    assert.equal(rect.y, 336);
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

test("D-28d a flickering lamp dims its light on the wall while it blinks", () => {
  const isFlickeringLamp = getLightGlobal("isFlickeringLamp");
  const getLampBrightness = getLightGlobal("getLampBrightness");
  const lampFlickerPeriod = getLightGlobal("lampFlickerPeriod");
  // A lamp one cell in front of the wall, at the first cell where it flickers
  let lampCellX = 0;
  while (!isFlickeringLamp({ x: lampCellX + 0.5, y: 2.5 })) {
    lampCellX += 1;
  }
  const light = { x: lampCellX + 0.5, y: 2.5, radius: lightRadius, intensity: lightIntensity };
  const times = [];
  for (let step = 0; step < 400; step++) {
    times.push(lampFlickerPeriod * step / 400);
  }
  const dimTime = times.find((time) => getLampBrightness(light, time) < 1);
  const steadyTime = times.find((time) => getLampBrightness(light, time) === 1);
  try {
    getLightGlobal(`gameTime = ${steadyTime}`);
    const steadyFactor = getWallLight(light.x + 1, 2.5, -1, 0, [light]);
    getLightGlobal(`gameTime = ${dimTime}`);
    const dimFactor = getWallLight(light.x + 1, 2.5, -1, 0, [light]);
    assert.ok(dimFactor < steadyFactor);
    assert.ok(dimFactor > ambientLight);
  } finally {
    getLightGlobal("gameTime = 0");
  }
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

// D-16e2: a straight wall across the view at x = 5, so every ray meets it at the
// same perpWallDist (4.5 from posX 0.5) and only |rayDir| changes per column
const getFisheyeGlobal = loadScripts();
getFisheyeGlobal("getCell = function (x, y) { return x >= 5 ? 1 : 0; }");
const fisheyeSettings = getFisheyeGlobal("gameSettings");
const drawFisheyeWalls = getFisheyeGlobal("drawWalls");
const fisheyeCamera = { posX: 0.5, posY: 0.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66 };

function getStripHeights() {
  const graphics = createRecordingGraphics();
  drawFisheyeWalls(graphics, fisheyeCamera);
  const heights = new Map();
  for (const rect of graphics.rects) {
    heights.set(rect.x, rect.height);
  }
  return heights;
}

test("D-16e2: with distPerp a straight wall has the same height in every column", () => {
  const heights = getStripHeights();
  // 720 / 4.5 = 160 px everywhere
  assert.equal(heights.get(screenWidth / 2), 160);
  assert.equal(heights.get(0), 160);
});

test("D-16e2: fisheye keeps the center height and shortens the wall toward the edges", () => {
  fisheyeSettings.fisheye = true;
  try {
    const heights = getStripHeights();
    // Center column: cameraX 0, |rayDir| = 1, still 160 px
    assert.equal(heights.get(screenWidth / 2), 160);
    // Left edge: rayDir = (1, -0.66), Euclidean distance 4.5 * 1.198 = 5.39
    const edgeDistance = 4.5 * Math.sqrt(1 + 0.66 * 0.66);
    assert.ok(Math.abs(heights.get(0) - 720 / edgeDistance) < 1e-9);
    assert.ok(heights.get(0) < heights.get(screenWidth / 4));
    assert.ok(heights.get(screenWidth / 4) < heights.get(screenWidth / 2));
    // The depth buffer keeps distPerp for the enemies
    assert.equal(getFisheyeGlobal("wallDepthBuffer")[0], 4.5);
  } finally {
    fisheyeSettings.fisheye = false;
  }
});

test("D-23: an enemy behind the camera or past maxRayDistance is skipped before projecting", () => {
  const isEnemyInViewRange = getEnemyGlobal("isEnemyInViewRange");
  assert.equal(isEnemyInViewRange({ posX: 3.5, posY: 0.5 }, enemyCamera), true);
  // Dot product with dir: -2 behind, 0 beside the camera
  assert.equal(isEnemyInViewRange({ posX: -1.5, posY: 0.5 }, enemyCamera), false);
  assert.equal(isEnemyInViewRange({ posX: 0.5, posY: 3.5 }, enemyCamera), false);
  // 25 cells ahead, past the 24 cell cap
  assert.equal(isEnemyInViewRange({ posX: 25.5, posY: 0.5 }, enemyCamera), false);
});

// D-21b: textured enemies. A fresh context with no walls, a sprite pool of plain
// objects, and column textures replaced by their own index, so a sprite's
// texture is the texX it was given.
const getSpriteGlobal = loadScripts();
getSpriteGlobal("getCell = function (x, y) { return 0; }");
getSpriteGlobal("enemyTextureColumns = Array.from({ length: enemyTextureWidth }, (_, texX) => texX)");
const drawSpriteEnemies = getSpriteGlobal("drawEnemies");
const getEnemyTextureX = getSpriteGlobal("getEnemyTextureX");
const spriteEnemyChunks = getSpriteGlobal("enemiesByChunk");
const spriteChunkKey = getSpriteGlobal("getChunkKey");
const spriteDepthBuffer = getSpriteGlobal("wallDepthBuffer");
const spriteCamera = { posX: 0.5, posY: 0.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66 };

function createFakeSpritePool(count) {
  const sprites = [];
  for (let index = 0; index < count; index += 1) {
    sprites.push({
      visible: false,
      position: { set(x, y) { this.x = x; this.y = y; } },
    });
  }
  return { sprites };
}

function setSpriteEnemies(enemies) {
  spriteEnemyChunks.clear();
  spriteEnemyChunks.set(spriteChunkKey(0, 0), enemies);
}

function resetSpriteDepthBuffer() {
  spriteDepthBuffer.fill(getSpriteGlobal("maxRayDistance"));
}

test("D-21b: the texture column follows the strip center inside the sprite", () => {
  // A sprite 66 px wide starting at x 600: 2 screen px per sprite px (33 / 66).
  // Strip 600 has its center at 601: 1 px in, column 0. Strip 632: 33 px in,
  // column 16. Strip 664: 65 px in, column 32, the last one.
  assert.equal(getEnemyTextureX(600, 600, 66), 0);
  assert.equal(getEnemyTextureX(632, 600, 66), 16);
  assert.equal(getEnemyTextureX(664, 600, 66), 32);
  // Strips that only touch the edges stay inside the 33 columns
  assert.equal(getEnemyTextureX(598, 600, 66), 0);
  assert.equal(getEnemyTextureX(666, 600, 66), 32);
});

test("D-21b: an enemy ahead is drawn as sprite strips standing on the floor", () => {
  resetSpriteDepthBuffer();
  setSpriteEnemies([{ posX: 3.5, posY: 0.5, width: 0.3, height: 0.6 }]);
  const pool = createFakeSpritePool(100);
  const graphics = createRecordingGraphics();
  drawSpriteEnemies(graphics, spriteCamera, pool);

  // 3 cells ahead: 144 px tall, from 336 to the floor line at 480. The sprite
  // keeps the 33 by 57 proportions, so it is 144 * 33 / 57 = 83.37 px wide,
  // from 598.32 to 681.68: the 42 strips from x 598 to x 680.
  assert.deepEqual(graphics.rects, []);
  const drawn = pool.sprites.filter((sprite) => sprite.visible);
  assert.equal(drawn.length, 42);
  for (const sprite of drawn) {
    assert.equal(sprite.position.y, 336);
    assert.equal(sprite.height, 144);
    assert.equal(sprite.width, stripWidth);
    assert.equal(sprite.tint, 0xffffff);
  }

  // One sprite px is 144 / 57 = 2.53 screen px. The center strip (x 640,
  // center 641) is 42.68 px from the left edge: 42.68 / 2.53 = 16.9, column 16.
  const byX = new Map(drawn.map((sprite) => [sprite.position.x, sprite]));
  assert.equal(byX.get(598).texture, 0);
  assert.equal(byX.get(640).texture, 16);
  assert.equal(byX.get(680).texture, 32);
});

test("D-21b: the nearer enemy takes the top sprites and the pool drops the farthest", () => {
  resetSpriteDepthBuffer();
  // The far one, 6 cells ahead, is listed first; drawing sorts them anyway
  setSpriteEnemies([
    { posX: 6.5, posY: 0.5, width: 0.3, height: 0.6 },
    { posX: 3.5, posY: 0.5, width: 0.3, height: 0.6 },
  ]);
  const pool = createFakeSpritePool(100);
  drawSpriteEnemies(createRecordingGraphics(), spriteCamera, pool);

  // Near: 42 strips in sprites 99 to 58, drawn last, so on top. Far: 72 px tall,
  // 22 strips in sprites 57 to 36, in the second brightness band (0.8).
  for (let index = 58; index <= 99; index += 1) {
    assert.equal(pool.sprites[index].height, 144);
  }
  for (let index = 36; index <= 57; index += 1) {
    assert.equal(pool.sprites[index].height, 72);
    assert.equal(pool.sprites[index].tint, 0xbfbfbf);
  }
  for (let index = 0; index < 36; index += 1) {
    assert.equal(pool.sprites[index].visible, false);
  }

  // A pool of 50 still draws the whole near enemy and only 8 far strips
  const smallPool = createFakeSpritePool(50);
  drawSpriteEnemies(createRecordingGraphics(), spriteCamera, smallPool);
  const heights = smallPool.sprites.map((sprite) => sprite.height);
  assert.equal(heights.filter((height) => height === 144).length, 42);
  assert.equal(heights.filter((height) => height === 72).length, 8);
});

test("D-21b: walls nearer than the enemy hide its sprite strips", () => {
  setSpriteEnemies([{ posX: 3.5, posY: 0.5, width: 0.3, height: 0.6 }]);
  // A wall at depth 2 covers every strip left of x 640
  resetSpriteDepthBuffer();
  spriteDepthBuffer.fill(2, 0, 640 / stripWidth);
  const pool = createFakeSpritePool(100);
  drawSpriteEnemies(createRecordingGraphics(), spriteCamera, pool);
  const drawn = pool.sprites.filter((sprite) => sprite.visible);
  // Strips 640 to 680
  assert.equal(drawn.length, 21);
  assert.ok(drawn.every((sprite) => sprite.position.x >= 640));

  // Walls in front of every strip hide it all, and last frame's sprites too
  spriteDepthBuffer.fill(0);
  drawSpriteEnemies(createRecordingGraphics(), spriteCamera, pool);
  assert.equal(pool.sprites.filter((sprite) => sprite.visible).length, 0);
  resetSpriteDepthBuffer();
});
