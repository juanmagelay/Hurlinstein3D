const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

const getGlobal = loadScripts();
const player = getGlobal("player");
const getCell = getGlobal("getCell");
const createKeyboardInput = getGlobal("createKeyboardInput");
const updatePlayer = getGlobal("updatePlayer");
const moveSpeed = getGlobal("moveSpeed");
const getRotationPerTick = getGlobal("getRotationPerTick");
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

// H-10c: on the 1280 by 720 test canvas, |plane| = 1280 / 720 / 2 = 0.888...
const planeLength = 1280 / 720 / 2;

test("plane is perpendicular to dir and screenWidth / screenHeight / 2 long", () => {
  // Dot product 0: neither in front of nor behind dir
  const dot = player.dirX * player.planeX + player.dirY * player.planeY;
  assertClose(dot, 0);
  assertClose(length(player.planeX, player.planeY), planeLength);
});

test("plane points to the right of dir, so the view is not mirrored", () => {
  // dir rotated 90 degrees: x' = -y, y' = x. With y growing downward on the map,
  // that turn is to the right.
  assertClose(player.planeX, -player.dirY * planeLength);
  assertClose(player.planeY, player.dirX * planeLength);
});

test("H-10c: a 4:3 canvas gives Lode's plane of about 0.66", () => {
  const world = loadScripts();
  world("screenWidth = 960");
  assertClose(world("getCameraPlaneLength()"), 2 / 3);
});

test("H-10c: the implicit field of view is about 83 degrees at 16:9", () => {
  const degrees = 2 * Math.atan(getGlobal("getCameraPlaneLength")()) * 180 / Math.PI;
  assert.ok(Math.abs(degrees - 83.3) < 0.1, `${degrees} is not about 83.3`);
});

test("H-10c: a new plane length keeps plane perpendicular to dir and to its right", () => {
  const camera = { dirX: 0.6, dirY: 0.8, planeX: 0, planeY: 0 };
  getGlobal("setCameraPlaneLength")(camera, 1.1);
  assertClose(camera.dirX * camera.planeX + camera.dirY * camera.planeY, 0);
  assertClose(length(camera.planeX, camera.planeY), 1.1);
  assertClose(camera.planeX, -0.8 * 1.1);
  assertClose(camera.planeY, 0.6 * 1.1);
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

// A fake window or game frame: keeps every listener and calls them on dispatch
function createFakeTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, listener) {
      if (!listeners.has(type)) {
        listeners.set(type, []);
      }
      listeners.get(type).push(listener);
    },
    dispatch(type, event) {
      for (const listener of listeners.get(type) || []) {
        listener(event);
      }
    },
  };
}

function keyEvent(key, overrides = {}) {
  return { key: key, repeat: false, preventDefault() {}, ...overrides };
}

// TDD 2.2: each key and the control it presses. D-12b: the arrows, D-12e: A and D strafe.
const keyControls = {
  w: "forward",
  ArrowUp: "forward",
  s: "backward",
  ArrowDown: "backward",
  a: "strafeLeft",
  d: "strafeRight",
  ArrowLeft: "turnLeft",
  ArrowRight: "turnRight",
};

test("each movement key presses its control and does not scroll the page", () => {
  const target = createFakeTarget();
  const pressedControls = createKeyboardInput(target);

  for (const key in keyControls) {
    let prevented = false;
    target.dispatch("keydown", keyEvent(key, { preventDefault: () => { prevented = true; } }));
    assert.deepEqual([...pressedControls], [keyControls[key]], `${key} did not press ${keyControls[key]}`);
    assert.equal(prevented, true, `${key} would scroll the page`);

    target.dispatch("keyup", keyEvent(key));
    assert.equal(pressedControls.size, 0, `${key} stayed pressed`);
  }
});

test("uppercase letters count and other keys are ignored", () => {
  const target = createFakeTarget();
  const pressedControls = createKeyboardInput(target);

  target.dispatch("keydown", keyEvent("W"));
  target.dispatch("keydown", keyEvent("q"));
  assert.deepEqual([...pressedControls], ["forward"]);

  target.dispatch("keyup", keyEvent("W"));
  assert.equal(pressedControls.size, 0);
});

test("the up arrow moves like W, and the left and right arrows turn", () => {
  const target = createFakeTarget();
  const pressedControls = movementWorld("createKeyboardInput")(target);
  const arrowPlayer = createPlayer();
  const letterPlayer = createPlayer();

  target.dispatch("keydown", keyEvent("ArrowUp"));
  target.dispatch("keydown", keyEvent("ArrowRight"));
  updatePlayerInOpenWorld(arrowPlayer, pressedControls, 1);
  updatePlayerInOpenWorld(letterPlayer, new Set(["forward", "turnRight"]), 1);

  assert.deepEqual({ ...arrowPlayer }, { ...letterPlayer });
  assert.ok(arrowPlayer.dirY > 0, "the right arrow did not turn right");
});

test("an arrow typed into an admin panel field does nothing", () => {
  const target = createFakeTarget();
  const pressedControls = createKeyboardInput(target);

  target.dispatch("keydown", keyEvent("ArrowUp", { target: { tagName: "INPUT" } }));
  assert.equal(pressedControls.size, 0);
});

// D-12e / TDD 6.6: A and D move to the side of dir, without turning
test("D strafes right and A strafes left, keeping dir and plane", () => {
  // Facing east (+x), the right hand side is +y (y grows downward on the map)
  const movingPlayer = createPlayer();

  updatePlayerInOpenWorld(movingPlayer, new Set(["strafeRight"]), 0.5);
  assertClose(movingPlayer.posX, 7.5);
  assertClose(movingPlayer.posY, 1.5 + moveSpeed * 0.5);
  assert.equal(movingPlayer.dirX, 1);
  assert.equal(movingPlayer.dirY, 0);
  assert.equal(movingPlayer.planeY, 0.66);

  updatePlayerInOpenWorld(movingPlayer, new Set(["strafeLeft"]), 0.5);
  assertClose(movingPlayer.posX, 7.5);
  assertClose(movingPlayer.posY, 1.5);
});

test("the side direction is dir turned 90 degrees to the right, where plane points", () => {
  const diagonal = Math.SQRT1_2;
  const movingPlayer = createPlayer({ dirX: diagonal, dirY: diagonal, planeX: -0.66 * diagonal, planeY: 0.66 * diagonal });

  updatePlayerInOpenWorld(movingPlayer, new Set(["strafeRight"]), 1);

  // (-dirY, dirX), the direction of plane, one moveSpeed long
  assertClose(movingPlayer.posX, 7.5 - diagonal * moveSpeed);
  assertClose(movingPlayer.posY, 1.5 + diagonal * moveSpeed);
});

test("forward and strafe together are not faster than forward alone", () => {
  const movingPlayer = createPlayer();

  updatePlayerInOpenWorld(movingPlayer, new Set(["forward", "strafeRight"]), 1);

  // Half way between east and south, one moveSpeed long
  assertClose(movingPlayer.posX, 7.5 + Math.SQRT1_2 * moveSpeed);
  assertClose(movingPlayer.posY, 1.5 + Math.SQRT1_2 * moveSpeed);
  assertClose(length(movingPlayer.posX - 7.5, movingPlayer.posY - 1.5), moveSpeed);
});

test("A and D together cancel out", () => {
  const movingPlayer = createPlayer();

  updatePlayerInOpenWorld(movingPlayer, new Set(["strafeLeft", "strafeRight"]), 1);
  assert.deepEqual({ ...movingPlayer }, createPlayer());
});

test("a strafe into a wall slides along it", () => {
  // Facing north (-y), the right hand side is +x, and the wall starts at x 14.
  // 13.79 is the closest the camera can sit to it (radius 0.2).
  const movingPlayer = createPlayer({ posX: 13.79, dirX: 0, dirY: -1, planeX: 0.66, planeY: 0 });

  updatePlayerWithCollisionWorld(movingPlayer, new Set(["forward", "strafeRight"]), 1);

  assertClose(movingPlayer.posX, 13.79);
  assertClose(movingPlayer.posY, 1.5 - Math.SQRT1_2 * moveSpeed);
});

test("W and S move along dir scaled by deltaTime", () => {
  const movingPlayer = createPlayer();
  const startX = movingPlayer.posX;
  const startY = movingPlayer.posY;

  updatePlayerInOpenWorld(movingPlayer, new Set(["forward"]), 0.5);
  assertClose(movingPlayer.posX, startX + movingPlayer.dirX * moveSpeed * 0.5);
  assertClose(movingPlayer.posY, startY + movingPlayer.dirY * moveSpeed * 0.5);

  updatePlayerInOpenWorld(movingPlayer, new Set(["backward"]), 0.5);
  assertClose(movingPlayer.posX, startX);
  assertClose(movingPlayer.posY, startY);
});

test("the left and right arrows rotate dir and plane by the same angle", () => {
  const turningPlayer = createPlayer();
  // D-16c1: the default turn speed, 120 degrees per second, per ticker unit
  const angle = getRotationPerTick(120);

  updatePlayer(turningPlayer, new Set(["turnRight"]), 1);

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

  updatePlayerWithCollisionWorld(movingPlayer, new Set(["forward"]), 1);

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

  updatePlayerWithCollisionWorld(movingPlayer, new Set(["forward"]), 1);

  assertClose(movingPlayer.posX, 7.5 + diagonal * moveSpeed);
  assertClose(movingPlayer.posY, 1.79);
});

test("forward movement stops with a radius of clearance from the wall", () => {
  // Facing +Y, the wall starts at cell 2, so the camera must stop before y 1.8
  const movingPlayer = createPlayer({ posX: 7.5, posY: 1.5, dirX: 0, dirY: 1, planeX: 0.66, planeY: 0 });

  for (let step = 0; step < 100; step += 1) {
    updatePlayerWithCollisionWorld(movingPlayer, new Set(["forward"]), 1);
  }

  assert.ok(movingPlayer.posY > 1.5, "the player did not move");
  assert.ok(movingPlayer.posY < 1.8, "the player moved past the clearance");
  assert.ok(2 - movingPlayer.posY >= playerRadius, "the camera is closer than its radius");
  assert.equal(collisionGetCell(Math.floor(movingPlayer.posX), Math.floor(movingPlayer.posY + playerRadius)), 0);
});

// D-16c1: keys typed into an admin panel field never move the player
test("W typed into an admin panel field does not move the player", () => {
  const target = createFakeTarget();
  const pressedKeys = createKeyboardInput(target);

  target.dispatch("keydown", keyEvent("w", { target: { tagName: "INPUT" } }));
  assert.equal(pressedKeys.has("w"), false);
});

test("the turn speed setting changes how far the arrows turn", () => {
  const world = loadScripts();
  world("getCell = function () { return 0; }");
  world("gameSettings.turnSpeed = 90");
  const turningPlayer = createPlayer();

  // 90 degrees per second for 60 ticker units is a quarter turn: dir points down (+y)
  world("updatePlayer")(turningPlayer, new Set(["turnRight"]), 60);
  assertClose(turningPlayer.dirX, 0);
  assertClose(turningPlayer.dirY, 1);
});

// D-12c / TDD 2.2: the mouse turn. A fake document says whether the game frame
// holds the pointer lock, and the fake frame counts the capture requests.
function createMouseSetup() {
  const page = { pointerLockElement: null };
  const gameTarget = createFakeTarget();
  gameTarget.captureRequests = 0;
  gameTarget.requestPointerLock = () => {
    gameTarget.captureRequests += 1;
  };
  return { page, gameTarget };
}

test("100 px of mouse movement at sensitivity 20 turns 20 degrees to the right", () => {
  const turningPlayer = createPlayer();
  const angle = 20 * Math.PI / 180;

  getGlobal("turnPlayerWithMouse")(turningPlayer, 100);

  assertClose(turningPlayer.dirX, Math.cos(angle));
  assertClose(turningPlayer.dirY, Math.sin(angle));
  // The same rotation matrix as A and D: dir stays unit length and plane
  // stays perpendicular to it, with the same length
  assertClose(length(turningPlayer.dirX, turningPlayer.dirY), 1);
  assertClose(turningPlayer.dirX * turningPlayer.planeX + turningPlayer.dirY * turningPlayer.planeY, 0);
  assertClose(length(turningPlayer.planeX, turningPlayer.planeY), 0.66);
});

test("moving the mouse left turns left, and no movement does not turn", () => {
  const turningPlayer = createPlayer();
  const turnPlayerWithMouse = getGlobal("turnPlayerWithMouse");

  turnPlayerWithMouse(turningPlayer, 0);
  assert.deepEqual({ ...turningPlayer }, createPlayer());

  turnPlayerWithMouse(turningPlayer, -100);
  assertClose(turningPlayer.dirY, -Math.sin(20 * Math.PI / 180));
});

test("the mouse sensitivity setting changes how far the mouse turns", () => {
  const world = loadScripts();
  world("gameSettings.mouseSensitivity = 90");
  const turningPlayer = createPlayer();

  // 90 degrees per 100 px: a quarter turn, dir points down (+y)
  world("turnPlayerWithMouse")(turningPlayer, 100);
  assertClose(turningPlayer.dirX, 0);
  assertClose(turningPlayer.dirY, 1);
});

test("while captured the mouse movement adds up and is cleared after use", () => {
  const { page, gameTarget } = createMouseSetup();
  const mouseInput = getGlobal("createMouseTurnInput")(page, gameTarget);
  page.pointerLockElement = gameTarget;

  gameTarget.dispatch("mousemove", { movementX: 30 });
  gameTarget.dispatch("mousemove", { movementX: 70 });
  assert.equal(mouseInput.consumeTurn(), 100);
  assert.equal(mouseInput.consumeTurn(), 0);
});

test("without the capture the mouse does not turn", () => {
  const { page, gameTarget } = createMouseSetup();
  const mouseInput = getGlobal("createMouseTurnInput")(page, gameTarget);

  gameTarget.dispatch("mousemove", { movementX: 50 });
  assert.equal(mouseInput.consumeTurn(), 0);
});

test("a click on the game asks for the capture only while the mouse is free", () => {
  const { page, gameTarget } = createMouseSetup();
  getGlobal("createMouseTurnInput")(page, gameTarget);

  gameTarget.dispatch("mousedown", { button: 0 });
  assert.equal(gameTarget.captureRequests, 1);

  page.pointerLockElement = gameTarget;
  gameTarget.dispatch("mousedown", { button: 0 });
  assert.equal(gameTarget.captureRequests, 1);
});

test("a refused capture is caught, so the console shows no error", () => {
  const { page, gameTarget } = createMouseSetup();
  let caught = false;
  gameTarget.requestPointerLock = () => ({
    catch(handler) {
      caught = true;
      handler(new Error("refused"));
    },
  });
  getGlobal("createMouseTurnInput")(page, gameTarget);

  gameTarget.dispatch("mousedown", { button: 0 });
  assert.equal(caught, true);
});

// D-36a: a fake element inside a menu screen of the game frame (TDD 2.3.4)
const onMenuScreen = {
  closest(selector) {
    return selector === "#game-frame .screen" ? {} : null;
  },
};

test("a click on a menu screen does not ask for the capture", () => {
  const { page, gameTarget } = createMouseSetup();
  getGlobal("createMouseTurnInput")(page, gameTarget);

  gameTarget.dispatch("mousedown", { button: 0, target: onMenuScreen });
  assert.equal(gameTarget.captureRequests, 0);

  // Once the screens are hidden, a click on the view asks for it
  gameTarget.dispatch("mousedown", { button: 0, target: { closest: () => null } });
  assert.equal(gameTarget.captureRequests, 1);
});
