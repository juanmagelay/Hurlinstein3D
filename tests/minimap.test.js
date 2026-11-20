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
