const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

// D-07a: the fire input. The hit itself is tested in projectiles.test.js (D-13b).
const getGlobal = loadScripts();
const createFireInput = getGlobal("createFireInput");
const createMouseTurnInput = getGlobal("createMouseTurnInput");

// A fake window or game frame: keeps every listener and calls them on dispatch
function createFakeTarget() {
  const listeners = {};
  return {
    addEventListener(type, listener) {
      listeners[type] = listeners[type] || [];
      listeners[type].push(listener);
    },
    dispatch(type, event) {
      for (const listener of listeners[type] || []) {
        listener(event);
      }
    },
  };
}

const leftClick = { button: 0 };

test("space fires once per press and ignores key repeat", () => {
  const target = createFakeTarget();
  const fireInput = createFireInput(target, createFakeTarget());
  const spaceDown = { key: " ", repeat: false, preventDefault() {} };
  const spaceRepeat = { key: " ", repeat: true, preventDefault() {} };

  assert.equal(fireInput.consumeShot(), false);

  target.dispatch("keydown", spaceDown);
  assert.equal(fireInput.consumeShot(), true);
  assert.equal(fireInput.consumeShot(), false);

  target.dispatch("keydown", spaceRepeat);
  assert.equal(fireInput.consumeShot(), false);
});

// D-12d: a left click on the game is a shot, like Space
test("one left click is one shot, and a held button does not repeat", () => {
  const gameTarget = createFakeTarget();
  const fireInput = createFireInput(createFakeTarget(), gameTarget);

  gameTarget.dispatch("mousedown", leftClick);
  assert.equal(fireInput.consumeShot(), true);
  // The button stays down for the next frames: mousedown does not come again
  assert.equal(fireInput.consumeShot(), false);
  assert.equal(fireInput.consumeShot(), false);

  gameTarget.dispatch("mouseup", leftClick);
  gameTarget.dispatch("mousedown", leftClick);
  assert.equal(fireInput.consumeShot(), true);
});

test("the first click fires and also asks for the capture", () => {
  const page = { pointerLockElement: null };
  const gameTarget = createFakeTarget();
  let captureRequests = 0;
  gameTarget.requestPointerLock = () => {
    captureRequests += 1;
  };
  createMouseTurnInput(page, gameTarget);
  const fireInput = createFireInput(createFakeTarget(), gameTarget);

  gameTarget.dispatch("mousedown", leftClick);
  assert.equal(fireInput.consumeShot(), true);
  assert.equal(captureRequests, 1);

  // Once captured, every click still fires
  page.pointerLockElement = gameTarget;
  gameTarget.dispatch("mousedown", leftClick);
  assert.equal(fireInput.consumeShot(), true);
  assert.equal(captureRequests, 1);
});

test("Space and a click in the same frame are one shot", () => {
  const keyTarget = createFakeTarget();
  const gameTarget = createFakeTarget();
  const fireInput = createFireInput(keyTarget, gameTarget);

  keyTarget.dispatch("keydown", { key: " ", repeat: false, preventDefault() {} });
  gameTarget.dispatch("mousedown", leftClick);
  assert.equal(fireInput.consumeShot(), true);
  assert.equal(fireInput.consumeShot(), false);
});

test("the right and middle buttons do not fire", () => {
  const gameTarget = createFakeTarget();
  const fireInput = createFireInput(createFakeTarget(), gameTarget);

  gameTarget.dispatch("mousedown", { button: 2 });
  gameTarget.dispatch("mousedown", { button: 1 });
  assert.equal(fireInput.consumeShot(), false);
});

// The admin panel lives outside the game frame, so its clicks only reach the window
test("a click on the admin panel does not fire", () => {
  const windowTarget = createFakeTarget();
  const fireInput = createFireInput(windowTarget, createFakeTarget());

  windowTarget.dispatch("mousedown", leftClick);
  assert.equal(fireInput.consumeShot(), false);
});
