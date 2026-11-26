const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

const getGlobal = loadScripts();
getGlobal(`getEnemiesAtCell = function (x, y) {
  if (x === 0 && y === 0) {
    return [{ posX: 0.5, posY: 0.5, width: 0.3 }];
  }
  return [];
}`);
const drawMinimap = getGlobal("drawMinimap");
const enemyColor = getGlobal("enemyColor");
const minimapX = getGlobal("getMinimapX()");
const screenWidth = getGlobal("screenWidth");

function createRecordingGraphics() {
  const graphics = { rects: [], fillColors: [], circles: [], clearCount: 0 };
  graphics.clear = () => {
    graphics.clearCount += 1;
  };
  graphics.rect = (x, y, width, height) => {
    graphics.rects.push({ x, y, width, height });
    return graphics;
  };
  graphics.fill = (color) => {
    graphics.fillColors.push(color);
    return graphics;
  };
  graphics.moveTo = () => graphics;
  graphics.lineTo = () => graphics;
  graphics.stroke = () => graphics;
  graphics.circle = (x, y, radius) => {
    graphics.circles.push({ x, y, radius });
    return graphics;
  };
  return graphics;
}

test("draws a cell-sized amber enemy marker in the matching minimap cell", () => {
  const graphics = createRecordingGraphics();
  const player = { posX: 10.5, posY: 10.5, dirX: 1, dirY: 0 };

  drawMinimap(graphics, player);

  assert.equal(graphics.clearCount, 1);
  // Marker side is minimapCellSize * enemy.width = 10 * 0.3 = 3, centered on the cell.
  // The window starts at map cell 0, so the cell center sits 5 px in: 5 - 1.5 = 3.5.
  assert.ok(graphics.rects.some((rect) => (
    rect.x === minimapX + 3.5
    && rect.y === 13.5
    && rect.width === 3
    && rect.height === 3
  )));
  assert.ok(graphics.fillColors.includes(enemyColor));
});

test("the minimap window sits in the top-right corner, 10 px from the edges", () => {
  const graphics = createRecordingGraphics();
  const player = { posX: 10.5, posY: 10.5, dirX: 1, dirY: 0 };

  drawMinimap(graphics, player);

  // The first rect is the 21 by 21 cell background: 210 px, ending 10 px from the right
  const background = graphics.rects[0];
  assert.equal(minimapX, 1060);
  assert.equal(background.x, 1060);
  assert.equal(background.y, 10);
  assert.equal(background.width, 210);
  assert.equal(background.height, 210);
  assert.equal(background.x + background.width, screenWidth - 10);
});

test("D-16a: after a resize the minimap still ends 10 px from the right edge", () => {
  const graphics = createRecordingGraphics();
  const player = { posX: 10.5, posY: 10.5, dirX: 1, dirY: 0 };

  getGlobal("screenWidth = 1680");
  try {
    drawMinimap(graphics, player);
    const background = graphics.rects[0];
    assert.equal(background.x, 1680 - 10 - 210);
  } finally {
    getGlobal("screenWidth = 1280");
  }
});

// D-16e3: the ray of a screen column ends at pos + perpWallDist * rayDir
test("D-16e3: a ray ends at the hit point computed by hand", () => {
  const getMinimapRayEnd = getGlobal("getMinimapRayEnd");
  const player = { posX: 10.5, posY: 10.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66 };
  // The window covers cells 0 to 20. Column 0: cameraX -1, rayDir = (1, -0.66).
  // A wall at perpWallDist 3 is hit at (10.5 + 3, 10.5 - 3 * 0.66) = (13.5, 8.52).
  const end = getMinimapRayEnd(player, 0, 3, 0, 0);
  assert.ok(Math.abs(end.x - 13.5) < 1e-9);
  assert.ok(Math.abs(end.y - 8.52) < 1e-9);
});

test("D-16e3: a ray longer than the window is cut at the window edge", () => {
  const getMinimapRayEnd = getGlobal("getMinimapRayEnd");
  const player = { posX: 10.5, posY: 10.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66 };
  // Center column: rayDir = (1, 0). A miss at 24 cells stops at x = 21.
  const end = getMinimapRayEnd(player, screenWidth / 2, 24, 0, 0);
  assert.equal(end.x, 21);
  assert.equal(end.y, 10.5);
});

test("D-16e3: the rays come from the depth buffer, every eighth one, in one stroke", () => {
  const raysWorld = loadScripts();
  raysWorld("getCell = function () { return 0; }");
  raysWorld("gameSettings.minimapRays = true");
  const graphics = createRecordingGraphics();
  const lines = [];
  const strokes = [];
  graphics.lineTo = (x, y) => {
    lines.push({ x, y });
    return graphics;
  };
  graphics.stroke = (style) => {
    strokes.push(style);
    return graphics;
  };
  raysWorld("drawMinimap")(graphics, { posX: 10.5, posY: 10.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66 });
  // 640 strips at 2 px, every eighth: 80 rays, plus the direction line
  assert.equal(lines.length, 80 + 1);
  // One stroke for the rays and one for the direction line
  assert.equal(strokes.length, 2);
});

// D-16f: chunk borders every 16 cells, found with Math.floor
test("D-16f: chunk borders inside a window that crosses x = 0 and y = -16", () => {
  const getChunkBordersInWindow = getGlobal("getChunkBordersInWindow");
  // Window x from -10 to 10: the border between chunk -1 and chunk 0
  assert.deepEqual([...getChunkBordersInWindow(-10)], [0]);
  // Window y from -26 to -6: the border between chunk -2 and chunk -1
  assert.deepEqual([...getChunkBordersInWindow(-26)], [-16]);
  // A border on the window edge is skipped: cells 16 to 36 only cross 32
  assert.deepEqual([...getChunkBordersInWindow(16)], [32]);
});

test("D-16f: the borders are drawn as lines across the minimap window", () => {
  const bordersWorld = loadScripts();
  bordersWorld("getCell = function () { return 0; }");
  bordersWorld("gameSettings.chunkBorders = true");
  const borderMinimapX = bordersWorld("getMinimapX()");
  const graphics = createRecordingGraphics();
  const moves = [];
  graphics.moveTo = (x, y) => {
    moves.push({ x, y });
    return graphics;
  };
  // Player at (0.5, -15.5): the window starts at cell (-10, -26)
  bordersWorld("drawMinimap")(graphics, { posX: 0.5, posY: -15.5, dirX: 1, dirY: 0 });
  // x = 0 is 10 cells into the window, y = -16 also 10 cells in: 100 px
  assert.ok(moves.some((move) => move.x === borderMinimapX + 100 && move.y === 10));
  assert.ok(moves.some((move) => move.x === borderMinimapX && move.y === 10 + 100));
});

// D-13d / D-42b: projectiles in flight are dots, only inside the window
test("D-42b: a projectile is a red-orange dot at its minimap position", () => {
  const dotsWorld = loadScripts();
  dotsWorld("getCell = function () { return 0; }");
  const dotsMinimapX = dotsWorld("getMinimapX()");
  const projectileColor = dotsWorld("projectileColor");
  const player = { posX: 10.5, posY: 10.5, dirX: 1, dirY: 0 };

  // With nothing in flight the projectile color is never filled
  const empty = createRecordingGraphics();
  dotsWorld("drawMinimap")(empty, player);
  assert.equal(empty.fillColors.includes(projectileColor), false);

  // One projectile inside the window (cells 0 to 20) and one outside it
  dotsWorld("projectiles").push({ posX: 13.25, posY: 9.5 });
  dotsWorld("projectiles").push({ posX: 40.5, posY: 10.5 });
  const graphics = createRecordingGraphics();
  dotsWorld("drawMinimap")(graphics, player);

  // (13.25, 9.5) sits 132.5 px right and 95 px down from the window corner.
  // The player dot has radius 3, so radius 2 picks the projectile dots.
  const dots = graphics.circles.filter((circle) => circle.radius === 2);
  assert.deepEqual(dots, [{ x: dotsMinimapX + 132.5, y: 10 + 95, radius: 2 }]);
  assert.ok(graphics.fillColors.includes(projectileColor));
});
