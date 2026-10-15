const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

const getGlobal = loadScripts();
const player = getGlobal("player");
const getCell = getGlobal("getCell");
const createKeyboardInput = getGlobal("createKeyboardInput");
const updatePlayer = getGlobal("updatePlayer");
const moveSpeed = getGlobal("moveSpeed");
const rotationSpeed = getGlobal("rotationSpeed");
const collisionWorld = loadScripts();
collisionWorld("getCell = function (x, y) { return x >= 14 || y >= 2 ? 1 : 0; }");
const updatePlayerWithCollisionWorld = collisionWorld("updatePlayer");

// Results like 0.66 * 0.66 are not exact in floating point
function assertClose(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} is not close to ${expected}`);
}

function length(x, y) {
  return Math.sqrt(x * x + y * y);
}

test("dir has length 1", () => {
  assertClose(length(player.dirX, player.dirY), 1);
});

test("plane is perpendicular to dir and 0.66 long", () => {
  // Dot product 0: neither in front of nor behind dir
  const dot = player.dirX * player.planeX + player.dirY * player.planeY;
  assertClose(dot, 0);
  assertClose(length(player.planeX, player.planeY), 0.66);
});

test("plane points to the right of dir, so the view is not mirrored", () => {
  // dir rotated 90 degrees: x' = -y, y' = x. With y growing downward on the map,
  // that turn is to the right.
  assertClose(player.planeX, -player.dirY * 0.66);
  assertClose(player.planeY, player.dirX * 0.66);
});

test("the player spawns on an air cell", () => {
  assert.equal(getCell(Math.floor(player.posX), Math.floor(player.posY)), 0);
});

function createPlayer(overrides = {}) {
  return { ...player, ...overrides };
}

test("keyboard input tracks only W, A, S and D", () => {
  const listeners = new Map();
  const target = {
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
  };
  const pressedKeys = createKeyboardInput(target);

  listeners.get("keydown")({ key: "W" });
  listeners.get("keydown")({ key: "ArrowUp" });
  assert.equal(pressedKeys.has("w"), true);
  assert.equal(pressedKeys.has("arrowup"), false);

  listeners.get("keyup")({ key: "W" });
  assert.equal(pressedKeys.has("w"), false);
});

test("W and S move along dir scaled by deltaTime", () => {
  const movingPlayer = createPlayer();

  updatePlayer(movingPlayer, new Set(["w"]), 0.5);
  assertClose(movingPlayer.posX, 7.5 + moveSpeed * 0.5);
  assertClose(movingPlayer.posY, 1.5);

  updatePlayer(movingPlayer, new Set(["s"]), 0.5);
  assertClose(movingPlayer.posX, 7.5);
  assertClose(movingPlayer.posY, 1.5);
});

test("A and D rotate dir and plane by the same angle", () => {
  const turningPlayer = createPlayer();
  const angle = rotationSpeed;

  updatePlayer(turningPlayer, new Set(["d"]), 1);

  assertClose(turningPlayer.dirX, Math.cos(angle));
  assertClose(turningPlayer.dirY, Math.sin(angle));
  assertClose(turningPlayer.planeX, -0.66 * Math.sin(angle));
  assertClose(turningPlayer.planeY, 0.66 * Math.cos(angle));
});

test("movement slides along a wall when the X axis is blocked", () => {
  const diagonal = Math.SQRT1_2;
  const movingPlayer = createPlayer({
    posX: 13.99,
    dirX: diagonal,
    dirY: diagonal,
    planeX: -0.66 * diagonal,
    planeY: 0.66 * diagonal,
  });

  updatePlayerWithCollisionWorld(movingPlayer, new Set(["w"]), 1);

  assertClose(movingPlayer.posX, 13.99);
  assertClose(movingPlayer.posY, 1.5 + diagonal * moveSpeed);
});

test("movement slides along a wall when the Y axis is blocked", () => {
  const diagonal = Math.SQRT1_2;
  const movingPlayer = createPlayer({
    posX: 7.5,
    posY: 1.99,
    dirX: diagonal,
    dirY: diagonal,
    planeX: -0.66 * diagonal,
    planeY: 0.66 * diagonal,
  });

  updatePlayerWithCollisionWorld(movingPlayer, new Set(["w"]), 1);

  assertClose(movingPlayer.posX, 7.5 + diagonal * moveSpeed);
  assertClose(movingPlayer.posY, 1.99);
});
