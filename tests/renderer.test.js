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
// D-40: the drawing camera with the view level and the eye at rest
const levelView = { pitch: 0, posZ: 0 };

test("D-28c row distance and center-column floor point match Lode's projection", () => {
  // At y=540, rowDistance = (720 / 2) / (540 - 360) = 2.
  assert.equal(getRowDistance(540, levelView), 2);
  const player = { posX: 3.25, posY: -2.5, dirX: 0.6, dirY: 0.8, planeX: -0.528, planeY: 0.396, pitch: 0, posZ: 0 };
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
  const player = { posX: 0.5, posY: 0.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66, pitch: 0, posZ: 0 };
  try {
    gameSettings.stripWidth = 4;
    const columns = getWallStripCount();
    const rows = screenHeight / 4;
    let texturedRows = 0;
    for (let row = 0; row < rows; row++) {
      if (getRowDistance((row + 0.5) * 4, levelView) <= maxRayDistance) {
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
  const player = { posX: 3.25, posY: -2.5, dirX: 0.6, dirY: 0.8, planeX: -0.528, planeY: 0.396, pitch: 0, posZ: 0 };
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
  const player = { posX: 0.5, posY: 0.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66, pitch: 0, posZ: 0 };
  withRecordedFloorSamples("0x2c3742", (samples) => {
    drawFloorCasting(surface, player);
    assert.ok(samples.every((sample) => sample.rowDistance <= maxRayDistance));
  });
  // With 2 px strips, row 179 is centered 1 px above the horizon: far past the cap
  const horizonRow = screenHeight / 2 / stripWidth - 1;
  assert.ok(getRowDistance((horizonRow + 0.5) * stripWidth, levelView) > maxRayDistance);
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
  const strip = getWallStrip(screenWidth / 2, 2, levelView);
  assert.equal(strip.x, screenWidth / 2);
  assert.equal(strip.lineHeight, 360);
  assert.equal(strip.drawStart, 180);
  assert.equal(strip.drawEnd, 540);
});

test("a wall 1 cell away fills the column exactly", () => {
  const strip = getWallStrip(0, 1, levelView);
  assert.equal(strip.lineHeight, screenHeight);
  assert.equal(strip.drawStart, 0);
  assert.equal(strip.drawEnd, screenHeight);
});

test("a closer wall is clipped to the screen", () => {
  // lineHeight = 1440 extends beyond both screen edges
  const strip = getWallStrip(0, 0.5, levelView);
  assert.equal(strip.lineHeight, 1440);
  assert.equal(strip.drawStart, 0);
  assert.equal(strip.drawEnd, screenHeight);
});

test("a wall at distance 0 fills the column instead of breaking", () => {
  // 720 / 0 is Infinity, and the clip treats it like any wall taller than the screen
  const strip = getWallStrip(0, 0, levelView);
  assert.equal(strip.drawStart, 0);
  assert.equal(strip.drawEnd, screenHeight);
});

test("a wall at maxRayDistance is 30 px tall", () => {
  // 720 / 24 = 30, from 360 - 15 to 360 + 15. Missed rays use this strip.
  const strip = getWallStrip(0, maxRayDistance, levelView);
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
  const camera = { posX: 7.5, posY: 1.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66, pitch: 0, posZ: 0 };
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
  const camera = { posX: 7.5, posY: 1.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66, pitch: 0, posZ: 0 };
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
  const camera = { posX: 2.5, posY: 2.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66, pitch: 0, posZ: 0 };
  assert.equal(getWallTextureX(camera, screenWidth / 2, { side: 0, perpWallDist: 4 }), 32);

  // Moving toward -X does not flip: wallX 0.25 stays 0.25, texX = 16.
  const leftward = { posX: 5, posY: 2.25, dirX: -1, dirY: 0, planeX: 0, planeY: 0.66, pitch: 0, posZ: 0 };
  assert.equal(getWallTextureX(leftward, screenWidth / 2, { side: 0, perpWallDist: 3 }), 16);
});

test("a side 1 face maps the X offset and flips when looking up the wall", () => {
  // Center ray runs along -Y and hits a side 1 face at posX 2.25: wallX 0.25.
  // rayDirY < 0 flips it to 0.75, so texX = floor(0.75 * 64) = 48.
  const camera = { posX: 2.25, posY: 5, dirX: 0, dirY: -1, planeX: 0.66, planeY: 0, pitch: 0, posZ: 0 };
  assert.equal(getWallTextureX(camera, screenWidth / 2, { side: 1, perpWallDist: 3 }), 48);
  assert.equal(wallTextureSize, 64);
});

// An open floor with no walls at all, so every ray misses. getGlobal evaluates
// code in its context, so it can also replace getCell there.
const getOpenFloorGlobal = loadScripts();
getOpenFloorGlobal("getCell = function (x, y) { return 0; }");
const drawWallsOnOpenFloor = getOpenFloorGlobal("drawWalls");

test("rays that hit nothing draw a background strip as tall as a wall at maxRayDistance", () => {
  const camera = { posX: 0.5, posY: 0.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66, pitch: 0, posZ: 0 };
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
  const camera = { posX: 7.5, posY: 1.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66, pitch: 0, posZ: 0 };
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
  const camera = { posX: 0.5, posY: 0.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66, pitch: 0, posZ: 0 };
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
const enemyCamera = { posX: 0.5, posY: 0.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66, pitch: 0, posZ: 0 };

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
  const camera = { posX: 2.5, posY: 2.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66, pitch: 0, posZ: 0 };
  const hit = getWallHitPoint(camera, screenWidth / 2, { side: 0, perpWallDist: 3 });
  assert.equal(hit.x, 5.5);
  assert.equal(hit.y, 2.5);
  assert.equal(hit.normalX, -1);
  assert.equal(hit.normalY, 0);

  const downward = { posX: 5, posY: 5, dirX: 0, dirY: -1, planeX: 0.66, planeY: 0, pitch: 0, posZ: 0 };
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
const fisheyeCamera = { posX: 0.5, posY: 0.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66, pitch: 0, posZ: 0 };

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
const spriteCamera = { posX: 0.5, posY: 0.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66, pitch: 0, posZ: 0 };

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

// D-39c: a falling enemy uses the same pool. Fake death columns hold
// frame * 100 + texX, so a sprite's texture tells the frame and the column.
getSpriteGlobal(
  "enemyDeathTextureColumns = Array.from({ length: enemyDeathFrameCount }, (_, frame) =>" +
  " Array.from({ length: enemyDeathFrameWidth }, (_, texX) => frame * 100 + texX))",
);
const spriteDyingEnemies = getSpriteGlobal("dyingEnemies");

test("D-39c: a falling enemy shows its death frame standing on the floor, at the front frame scale", () => {
  resetSpriteDepthBuffer();
  setSpriteEnemies([]);
  const dying = { enemy: { posX: 3.5, posY: 0.5, width: 0.3, height: 0.6 }, time: 0 };
  spriteDyingEnemies.push(dying);
  const pool = createFakeSpritePool(100);
  drawSpriteEnemies(createRecordingGraphics(), spriteCamera, pool);

  // 60 by 51 texture px at 0.6 / 57 cells each: 0.632 by 0.537 cells. At depth
  // 3: 720 * 0.632 / 3 = 151.58 px tall up from the floor line at 480, and
  // 128.84 px wide, from 575.58 to 704.42: the 66 strips from x 574 to x 704.
  const drawn = pool.sprites.filter((sprite) => sprite.visible);
  assert.equal(drawn.length, 66);
  assert.ok(Math.abs(drawn[0].height - 151.58) < 0.01);
  assert.ok(Math.abs(drawn[0].position.y + drawn[0].height - 480) < 1e-9);
  assert.ok(drawn.every((sprite) => sprite.alpha === 1));
  // The center strip (center 641) is 65.42 px in, 2.53 px per texture px: column 25
  const byX = new Map(drawn.map((sprite) => [sprite.position.x, sprite]));
  assert.equal(byX.get(640).texture, 25);

  // After four frame times it shows the last frame, and a quarter second
  // before the end the corpse is half faded
  dying.time = 4 * getSpriteGlobal("enemyDeathFrameTicks");
  drawSpriteEnemies(createRecordingGraphics(), spriteCamera, pool);
  assert.equal(byX.get(640).texture, 425);
  dying.time = getSpriteGlobal("enemyDeathTicks + enemyCorpseTicks") - 15;
  drawSpriteEnemies(createRecordingGraphics(), spriteCamera, pool);
  assert.equal(byX.get(640).alpha, 0.5);

  spriteDyingEnemies.length = 0;
});

test("D-39c: the flat color mode draws no falling enemy", () => {
  resetSpriteDepthBuffer();
  setSpriteEnemies([]);
  spriteDyingEnemies.push({ enemy: { posX: 3.5, posY: 0.5, width: 0.3, height: 0.6 }, time: 0 });
  const graphics = createRecordingGraphics();
  drawSpriteEnemies(graphics, spriteCamera, null);

  assert.deepEqual(graphics.rects, []);
  spriteDyingEnemies.length = 0;
});

// D-39e: the blood stain on the floor, read from the stain texture strip
test("D-39e: the stain texel of a floor point, computed by hand", () => {
  const getStainTexelIndex = getGlobal("getStainTexelIndex");
  // Four 32 px squares side by side: the strip is 128 texels wide. The point
  // (10.25, -3.75) is a quarter into its cell on both axes (-3.75 - -4 = 0.25),
  // texel 8 of 32. Shape 2 starts at column 32: column 40, row 8, so
  // 8 * 128 + 40 = 1064.
  const u = 10.25 - Math.floor(10.25);
  const v = -3.75 - Math.floor(-3.75);
  assert.equal(v, 0.25);
  assert.equal(getStainTexelIndex(2, u, v), 1064);
  // Shape 1 at the cell corner is texel 0; shape 4 just under the far corner is
  // the last texel of the strip, row 31 and column 127
  assert.equal(getStainTexelIndex(1, 0, 0), 0);
  assert.equal(getStainTexelIndex(4, 0.999, 0.999), 31 * 128 + 127);
});

test("D-39e: a stain texel covers the tile by its alpha, with the floor shading", () => {
  const applyStain = getGlobal("applyStain");
  // The tile color and then the stain over it, as the floor casting does
  const colorWithStain = (x, y, rowDistance, lights, shape) => applyStain(
    getFloorTextureColor(x, y, false, rowDistance, lights), shape, x - Math.floor(x), y - Math.floor(y));
  const texels = new Uint8ClampedArray(128 * 32 * 4);
  // Texel 1064 is opaque red 100, 0, 0. Every other texel is transparent.
  texels.set([100, 0, 0, 255], 1064 * 4);
  const setStainFactors = getGlobal("(function (value) { stainFactors = value; })");
  const stainFactorsBefore = getGlobal("stainFactors");
  try {
    getGlobal("useLighting = false");
    setStainFactors(getGlobal("createStainFactors")(texels));
    const tile = getFloorTextureColor(10.25, -3.75, false, 1, []);
    const stained = colorWithStain(10.25, -3.75, 1, [], 2);
    // Band 1 keeps the tile at 166: red 166 * 0.94 = 156, green 166, blue
    // 169. The stain covers 0.85 of it. Red lets through
    // 1 + (100 / 156.04 - 1) * 0.85 = 0.6947, and 156 * 0.6947 = 108.4. Green
    // and blue let through 1 - 0.85 = 0.15: 166 * 0.15 = 24.9, 169 * 0.15 = 25.35
    assert.equal(tile, (156 << 16) | (166 << 8) | 169);
    assert.equal(stained, (108 << 16) | (24 << 8) | 25);
    // Farther away the stain darkens with the floor, by the same band
    const farStained = colorWithStain(10.25, -3.75, 20, [], 2);
    assert.ok(getRed(farStained) < getRed(stained));
    // A transparent texel of the stain leaves the tile as it was
    assert.equal(colorWithStain(10.9, -3.1, 1, [], 2), getFloorTextureColor(10.9, -3.1, false, 1, []));
  } finally {
    setStainFactors(stainFactorsBefore);
    getGlobal("useLighting = true");
  }
});

test("D-39e: the floor casting stains the samples of a stained cell, never the ceiling", () => {
  const drawFloorCasting = getGlobal("drawFloorCasting");
  const getStain = getGlobal("getStain");
  const surface = createFakeFloorSurface(screenHeight);
  const player = { posX: 3.5, posY: 0.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66, pitch: 0, posZ: 0 };
  getGlobal("addStain")(5, 0);
  const originalTile = getGlobal("getFloorTextureColor");
  const originalApply = getGlobal("applyStain");
  const setStainFactors = getGlobal("(function (value) { stainFactors = value; })");
  const stainFactorsBefore = getGlobal("stainFactors");
  setStainFactors(getGlobal("createStainFactors")(new Uint8ClampedArray(128 * 32 * 4)));
  // Each sample is recorded with stain 0; applyStain sets the stain of the
  // last one, the sample it was called for
  getGlobal("stainSamples = []");
  getGlobal(`getFloorTextureColor = function (x, y, isCeiling) {
    stainSamples.push({ x, y, isCeiling, stainShape: 0 });
    return 0;
  }`);
  getGlobal(`applyStain = function (color, stainShape) {
    stainSamples[stainSamples.length - 1].stainShape = stainShape;
    return color;
  }`);
  try {
    drawFloorCasting(surface, player);
    const samples = getGlobal("stainSamples");
    const inStainedCell = (sample) => Math.floor(sample.x) === 5 && Math.floor(sample.y) === 0;
    const floorInCell = samples.filter((sample) => !sample.isCeiling && inStainedCell(sample));
    assert.ok(floorInCell.length > 0);
    assert.ok(floorInCell.every((sample) => sample.stainShape === getStain(5, 0)));
    assert.ok(samples.every((sample) => sample.isCeiling || inStainedCell(sample) || sample.stainShape === 0));
    assert.ok(samples.every((sample) => !sample.isCeiling || sample.stainShape === 0));
  } finally {
    getGlobal(`getFloorTextureColor = ${originalTile.toString()}`);
    getGlobal(`applyStain = ${originalApply.toString()}`);
    setStainFactors(stainFactorsBefore);
    getGlobal("clearStains")();
  }
});

// D-39g: the blood drops in 3D, projected like the enemies
test("D-39g: a drop straight ahead lands on the center column, its height above the floor line", () => {
  resetSpriteDepthBuffer();
  const getBloodDropView = getSpriteGlobal("getBloodDropView");
  // 3 cells ahead at eye height: the screen center. One cell is 720 / 3 =
  // 240 px, so the size is 0.03 * 240 = 7.2 px.
  const atEye = getBloodDropView({ posX: 3.5, posY: 0.5, z: 0.5 }, spriteCamera);
  assert.equal(atEye.x, 640);
  assert.equal(atEye.y, 360);
  assert.ok(Math.abs(atEye.size - 7.2) < 1e-9);
  assert.equal(atEye.tint, getSpriteGlobal("bloodDropColor"));
  // On the floor it sits on the floor line of the enemies, 360 + 240 / 2 = 480
  assert.equal(getBloodDropView({ posX: 3.5, posY: 0.5, z: 0 }, spriteCamera).y, 480);
  // Far away it keeps 2 px: at 20 cells it would be 0.03 * 36 = 1.08 px
  assert.equal(getBloodDropView({ posX: 20.5, posY: 0.5, z: 0.3 }, spriteCamera).size, 2);
});

test("D-39g: a drop behind a wall or behind the camera is not drawn", () => {
  const getBloodDropView = getSpriteGlobal("getBloodDropView");
  resetSpriteDepthBuffer();
  spriteDepthBuffer.fill(2);
  assert.equal(getBloodDropView({ posX: 3.5, posY: 0.5, z: 0.4 }, spriteCamera), null);
  // A wall farther than the drop does not hide it
  assert.notEqual(getBloodDropView({ posX: 2, posY: 0.5, z: 0.4 }, spriteCamera), null);
  resetSpriteDepthBuffer();
  assert.equal(getBloodDropView({ posX: -2.5, posY: 0.5, z: 0.4 }, spriteCamera), null);
});

test("D-39g: each particle follows its drop, hidden with alpha 0, and none in flat mode", () => {
  resetSpriteDepthBuffer();
  const drawBloodDrops = getSpriteGlobal("drawBloodDrops");
  const bloodDrops = getSpriteGlobal("bloodDrops");
  const spriteSettings = getSpriteGlobal("gameSettings");
  const flatColorsBefore = spriteSettings.flatColors;
  spriteSettings.flatColors = false;
  const particles = bloodDrops.map(() => ({ alpha: 1 }));
  Object.assign(bloodDrops[0], { active: true, posX: 3.5, posY: 0.5, z: 0.5 });
  Object.assign(bloodDrops[1], { active: false, posX: 3.5, posY: 0.5, z: 0.5 });
  try {
    drawBloodDrops({ particles }, spriteCamera);
    assert.equal(particles[0].alpha, 1);
    assert.equal(particles[0].x, 640);
    assert.equal(particles[0].y, 360);
    // The 4 px texture is scaled to 7.2 px
    assert.ok(Math.abs(particles[0].scaleX - 1.8) < 1e-9);
    assert.ok(particles.slice(1).every((particle) => particle.alpha === 0));

    spriteSettings.flatColors = true;
    drawBloodDrops({ particles }, spriteCamera);
    assert.equal(particles[0].alpha, 0);
  } finally {
    spriteSettings.flatColors = flatColorsBefore;
    bloodDrops[0].active = false;
  }
});

// D-40b / D-40d: the drawing camera with the horizon moved by pitch and the
// eye moved by posZ (TDD 3.4). levelView above is pitch 0 and posZ 0, and the
// tests that use it check that a level view keeps today's values.
function assertNear(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} is not close to ${expected}`);
}

test("D-40b: pitch slides the wall strip by pitch pixels, computed by hand", () => {
  // Looking up, pitch 100 puts the horizon at 460. lineHeight = 720 / 2 = 360,
  // drawStart = -180 + 360 + 100 = 280 and drawEnd = 180 + 360 + 100 = 640
  const up = getWallStrip(0, 2, { pitch: 100, posZ: 0 });
  assert.equal(up.lineHeight, 360);
  assert.equal(up.drawStart, 280);
  assert.equal(up.drawEnd, 640);
  // Looking down, pitch -100: from 80 to 440, the same height
  const down = getWallStrip(0, 2, { pitch: -100, posZ: 0 });
  assert.equal(down.drawStart, 80);
  assert.equal(down.drawEnd, 440);
});

test("D-40d: posZ moves a near wall more than a far one (posZ / perpWallDist)", () => {
  // The eye dips 0.03 cells: posZ = -0.03 * 720 = -21.6 px. A wall 2 cells
  // away moves 21.6 / 2 = 10.8 px up, one 8 cells away only 2.7 px
  const posZ = -0.03 * screenHeight;
  const near = getWallStrip(0, 2, { pitch: 0, posZ });
  assertNear(near.drawStart, 180 - 10.8);
  assertNear(near.drawEnd, 540 - 10.8);
  const far = getWallStrip(0, 8, { pitch: 0, posZ });
  assertNear(far.drawStart, 315 - 2.7);
  assertNear(far.drawEnd, 405 - 2.7);
});

test("D-40b / D-40d: the floor row distance, from the moved horizon and the moved eye", () => {
  // pitch 100: the horizon is at 460, row 640 is 180 px under it, so the
  // floor point is 360 / 180 = 2 cells away along dir
  assert.equal(getRowDistance(640, { pitch: 100, posZ: 0 }), 2);
  // The eye 36 px lower: the floor is (360 - 36) / 180 = 1.8 cells away at
  // row 540, and the ceiling (360 + 36) / 180 = 2.2 cells at row 180
  assertNear(getRowDistance(540, { pitch: 0, posZ: -36 }), 1.8);
  assertNear(getRowDistance(180, { pitch: 0, posZ: -36 }), 2.2);
});

test("D-40b: with pitch the floor casting splits ceiling and floor at the moved horizon", () => {
  const drawFloorCasting = getGlobal("drawFloorCasting");
  const getWallStripCount = getGlobal("getWallStripCount");
  const surface = createFakeFloorSurface(screenHeight);
  const camera = { posX: 0.5, posY: 0.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66, pitch: 100, posZ: 0 };
  withRecordedFloorSamples("0x000000", (samples) => {
    drawFloorCasting(surface, camera);
    const columns = getWallStripCount();
    // 2 px rows: rows 0 to 229 lie over 460 (ceiling), rows 230 to 359 under it.
    // Rows near the horizon are past maxRayDistance and record no sample.
    const ceilingSamples = samples.filter((sample) => sample.isCeiling).length;
    const floorSamples = samples.length - ceilingSamples;
    assert.ok(ceilingSamples > floorSamples);
    assert.equal(ceilingSamples % columns, 0);
    assert.equal(floorSamples % columns, 0);
    assert.equal(samples[0].isCeiling, true);
    assert.equal(samples[samples.length - 1].isCeiling, false);
    // The bottom row, y = 719, is 259 px under the horizon: 360 / 259 cells
    assertNear(samples[samples.length - 1].rowDistance, 360 / 259);
  });
});

test("D-40b: the flat ceiling and floor reach past the screen by the largest pitch", () => {
  const graphics = createRecordingGraphics();
  // drawCeilingAndFloor chains rect().fill(), like the Pixi v8 Graphics
  const recordRect = graphics.rect;
  graphics.rect = (...args) => {
    recordRect(...args);
    return graphics;
  };
  getGlobal("drawCeilingAndFloor")(graphics);
  // margin = 0.3 * 720 = 216: the ceiling goes from -216 to 360, the floor
  // from 360 to 936
  assert.equal(graphics.rects.length, 2);
  const [ceiling, floor] = graphics.rects;
  assertNear(ceiling.y, -216);
  assertNear(ceiling.y + ceiling.height, 360);
  assert.equal(floor.y, 360);
  assertNear(floor.y + floor.height, 936);
  // Moved by the largest pitch either way, they still cover the whole screen
  for (const pitch of [216, -216]) {
    assert.ok(ceiling.y + pitch <= 1e-9);
    assert.ok(floor.y + floor.height + pitch >= screenHeight - 1e-9);
  }
});

test("D-40b: an enemy stands on the floor line moved by pitch", () => {
  // 3 cells ahead with pitch 60: the floor line is 360 + 60 + 360 / 3 = 540
  const box = getGlobal("getStandingSpriteBox")(0, 3, 0.3, 0.6, { pitch: 60, posZ: 0 });
  assert.equal(box.top + box.height, 540);
  assert.equal(box.height, 144);
});

test("D-40c: a projectile is drawn at its height and stays on the crosshair along the look", () => {
  const drawProjectiles = getGlobal("drawProjectiles");
  const projectiles = getGlobal("projectiles");
  const savedDepths = wallDepthBuffer.slice();
  wallDepthBuffer.fill(maxRayDistance);
  // Fired with slope 0.1, two cells along dir: z = 0.5 + 0.1 * 2 = 0.7.
  // Its square is 720 * 0.05 / 2 = 18 px.
  projectiles.length = 0;
  projectiles.push({ posX: 2.5, posY: 0.5, z: 0.7 });
  const camera = { posX: 0.5, posY: 0.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66, pitch: 0, posZ: 0 };
  try {
    // Looking along the shot, pitch = 720 * 0.1 = 72: the center is
    // 360 + 72 + 720 * (0.5 - 0.7) / 2 = 360, the crosshair
    camera.pitch = 72;
    const aimed = createRecordingGraphics();
    drawProjectiles(aimed, camera);
    assert.ok(aimed.rects.length > 0);
    assertNear(aimed.rects[0].y, 351);
    assertNear(aimed.rects[0].height, 18);
    // Looking level again, the same projectile shows 72 px higher
    camera.pitch = 0;
    const level = createRecordingGraphics();
    drawProjectiles(level, camera);
    assertNear(level.rects[0].y, 351 - 72);
  } finally {
    projectiles.length = 0;
    savedDepths.forEach((depth, index) => {
      wallDepthBuffer[index] = depth;
    });
  }
});
