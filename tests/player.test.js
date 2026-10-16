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
const playerRadius = getGlobal("playerRadius");
const collisionWorld = loadScripts();
collisionWorld("getCell = function (x, y) { return x >= 14 || y >= 2 ? 1 : 0; }");
const updatePlayerWithCollisionWorld = collisionWorld("updatePlayer");
const collisionGetCell = collisionWorld("getCell");
const movementWorld = loadScripts();
movementWorld("getCell = function () { return 0; }");
const updatePlayerInOpenWorld = movementWorld("updatePlayer");

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
  return {
    posX: 7.5,
    posY: 1.5,
    dirX: 1,
    dirY: 0,
    planeX: 0,
    planeY: 0.66,
    ...overrides,
  };
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
  const startX = movingPlayer.posX;
  const startY = movingPlayer.posY;

  updatePlayerInOpenWorld(movingPlayer, new Set(["w"]), 0.5);
  assertClose(movingPlayer.posX, startX + movingPlayer.dirX * moveSpeed * 0.5);
  assertClose(movingPlayer.posY, startY + movingPlayer.dirY * moveSpeed * 0.5);

  updatePlayerInOpenWorld(movingPlayer, new Set(["s"]), 0.5);
  assertClose(movingPlayer.posX, startX);
  assertClose(movingPlayer.posY, startY);
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
  // 13.79 is the closest the camera can sit to the wall at cell 14 (radius 0.2)
  const movingPlayer = createPlayer({
    posX: 13.79,
    posY: 1.5,
    dirX: diagonal,
    dirY: diagonal,
    planeX: -0.66 * diagonal,
    planeY: 0.66 * diagonal,
  });

  updatePlayerWithCollisionWorld(movingPlayer, new Set(["w"]), 1);

  assertClose(movingPlayer.posX, 13.79);
  assertClose(movingPlayer.posY, 1.5 + diagonal * moveSpeed);
});

test("movement slides along a wall when the Y axis is blocked", () => {
  const diagonal = Math.SQRT1_2;
  const movingPlayer = createPlayer({
    posX: 7.5,
    posY: 1.79,
    dirX: diagonal,
    dirY: diagonal,
    planeX: -0.66 * diagonal,
    planeY: 0.66 * diagonal,
  });

  updatePlayerWithCollisionWorld(movingPlayer, new Set(["w"]), 1);

  assertClose(movingPlayer.posX, 7.5 + diagonal * moveSpeed);
  assertClose(movingPlayer.posY, 1.79);
});

test("forward movement stops with a radius of clearance from the wall", () => {
  // Facing +Y, the wall starts at cell 2, so the camera must stop before y 1.8
  const movingPlayer = createPlayer({ posX: 7.5, posY: 1.5, dirX: 0, dirY: 1, planeX: 0.66, planeY: 0 });

  for (let step = 0; step < 100; step += 1) {
    updatePlayerWithCollisionWorld(movingPlayer, new Set(["w"]), 1);
  }

  assert.ok(movingPlayer.posY > 1.5, "the player did not move");
  assert.ok(movingPlayer.posY < 1.8, "the player moved past the clearance");
  assert.ok(2 - movingPlayer.posY >= playerRadius, "the camera is closer than its radius");
  assert.equal(collisionGetCell(Math.floor(movingPlayer.posX), Math.floor(movingPlayer.posY + playerRadius)), 0);
});
