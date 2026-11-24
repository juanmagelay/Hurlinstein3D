// D-16a: canvas width from the window shape, and the CSS size of the game frame
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

const getGlobal = loadScripts();
const getScreenWidthForWindow = getGlobal("getScreenWidthForWindow");
const getGameFrameSize = getGlobal("getGameFrameSize");
const getMenuNavigationDirection = getGlobal("getMenuNavigationDirection");
const getNextMenuButtonIndex = getGlobal("getNextMenuButtonIndex");

test("a 16:9 window keeps the 1280 by 720 canvas", () => {
  assert.equal(getScreenWidthForWindow(1920, 1080), 1280);
});

test("the width follows the window shape and stays a multiple of 8 px", () => {
  // 1512 by 860: 720 * 1512 / 860 = 1265.86, rounded to the nearest multiple
  // of 8 (D-16e1), so 1, 2, 4 and 8 px strips all fit a whole number of times
  assert.equal(getScreenWidthForWindow(1512, 860), 1264);
  for (const width of [1, 2, 4, 8]) {
    assert.equal(1264 % width, 0);
  }
  // 16:10: 720 * 1.6 = 1152
  assert.equal(getScreenWidthForWindow(1440, 900), 1152);
});

test("the shape is clamped between 4:3 and 21:9", () => {
  // A portrait window gets the 4:3 canvas, a 32:9 monitor the 21:9 one
  assert.equal(getScreenWidthForWindow(600, 900), 960);
  assert.equal(getScreenWidthForWindow(5120, 1440), 1680);
  assert.equal(getGlobal("maxScreenWidth"), 1680);
});

test("inside the range the frame covers the whole window", () => {
  // The 1264 px canvas scaled to 860 px tall is 1509.8 px wide, 2.2 px short
  // of the window: under one 8 px step, so it is stretched to the edge
  const width = getScreenWidthForWindow(1512, 860);
  const frame = getGameFrameSize(1512, 860, width);
  assert.equal(frame.width, 1512);
  assert.equal(frame.height, 860);
});

test("outside the range the frame keeps the canvas shape, centered by CSS", () => {
  // Portrait 600 by 900 with a 960 by 720 canvas: scale 0.625, 600 by 450
  const frame = getGameFrameSize(600, 900, 960);
  assert.equal(frame.width, 600);
  assert.equal(frame.height, 450);
});

test("menu navigation maps arrows and W/S to previous or next", () => {
  assert.equal(getMenuNavigationDirection("ArrowDown"), 1);
  assert.equal(getMenuNavigationDirection("s"), 1);
  assert.equal(getMenuNavigationDirection("ArrowUp"), -1);
  assert.equal(getMenuNavigationDirection("w"), -1);
  assert.equal(getMenuNavigationDirection("Enter"), 0);
});

test("menu navigation wraps around the available buttons", () => {
  assert.equal(getNextMenuButtonIndex(0, 3, -1), 2);
  assert.equal(getNextMenuButtonIndex(2, 3, 1), 0);
  assert.equal(getNextMenuButtonIndex(-1, 3, 1), 0);
  assert.equal(getNextMenuButtonIndex(0, 0, 1), -1);
});

// D-36b: the hint that a click captures the mouse, shown only while playing
// with the mouse free
test("the mouse hint shows while playing with the mouse free", () => {
  const page = { pointerLockElement: null };
  const gameFrame = {};
  const hint = { hidden: true };
  const mouseHint = getGlobal("createMouseHint")(page, gameFrame, hint);

  mouseHint.update(false);
  assert.equal(hint.hidden, true);

  mouseHint.update(true);
  assert.equal(hint.hidden, false);

  page.pointerLockElement = gameFrame;
  mouseHint.update(true);
  assert.equal(hint.hidden, true);

  // Esc releases the mouse, and the hint comes back
  page.pointerLockElement = null;
  mouseHint.update(true);
  assert.equal(hint.hidden, false);

  // Defeat, victory or the menu hide it
  mouseHint.update(false);
  assert.equal(hint.hidden, true);
});
