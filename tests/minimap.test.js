const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

const getGlobal = loadScripts();
getGlobal(`getEnemiesAtCell = function (x, y) {
  if (x === 0 && y === 0) {
    return [{ posX: 0.5, posY: 0.5, size: 0.5 }];
  }
  return [];
}`);
const drawMinimap = getGlobal("drawMinimap");
const enemyColor = getGlobal("enemyColor");

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
  assert.ok(graphics.rects.some((rect) => (
    rect.x === 12.5
    && rect.y === 12.5
    && rect.width === 5
    && rect.height === 5
  )));
  assert.ok(graphics.fillColors.includes(enemyColor));
});
