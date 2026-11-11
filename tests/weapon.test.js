const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

// D-07a: the fire input. The hit itself is tested in projectiles.test.js (D-13b).
const getGlobal = loadScripts();
const createFireInput = getGlobal("createFireInput");

function createFakeTarget() {
  const handlers = {};
  return {
    addEventListener(type, handler) {
      handlers[type] = handler;
    },
    dispatch(type, event) {
      handlers[type](event);
    },
  };
}

test("space fires once per press and ignores key repeat", () => {
  const target = createFakeTarget();
  const fireInput = createFireInput(target);
  const spaceDown = { key: " ", repeat: false, preventDefault() {} };
  const spaceRepeat = { key: " ", repeat: true, preventDefault() {} };

  assert.equal(fireInput.consumeShot(), false);

  target.dispatch("keydown", spaceDown);
  assert.equal(fireInput.consumeShot(), true);
  assert.equal(fireInput.consumeShot(), false);

  target.dispatch("keydown", spaceRepeat);
  assert.equal(fireInput.consumeShot(), false);
});
