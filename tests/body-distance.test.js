const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

// D-27b: an open world (every cell is air), so only the enemy and the player
// stop each other, and the enemy always sees the player.
function createOpenWorld() {
  const world = loadScripts();
  world("getCell = function () { return 0; }");
  world("enemiesByChunk.clear(); enemiesByCell.clear();");
  return world;
}

function addEnemy(world, posX, posY, state) {
  const enemy = {
    id: 1,
    posX,
    posY,
    cellX: Math.floor(posX),
    cellY: Math.floor(posY),
    chunkX: 0,
    chunkY: 0,
    width: 0.3,
    height: 0.6,
    state,
    stateTime: 0,
    hitWait: 0,
  };
  world("enemiesByChunk").set(world("getChunkKey")(0, 0), [enemy]);
  world("registerEnemyAtCell")(enemy);
  return enemy;
}

// Facing east (+x), so W walks toward an enemy placed at a larger x
function createPlayerAt(posX, posY) {
  return { posX, posY, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66 };
}

function getDistance(a, b) {
  return Math.hypot(a.posX - b.posX, a.posY - b.posY);
}

function assertClose(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} is not close to ${expected}`);
}

test("the stop distance leaves space between the two bodies", () => {
  const world = createOpenWorld();
  const bodies = world("enemyWidth") / 2 + world("playerRadius");

  assert.equal(world("enemyStopDistance"), 0.5);
  assertClose(bodies, 0.35);
  assert.ok(world("enemyStopDistance") > bodies);
  // Stopped there, the enemy is in contact and can hit
  assert.ok(world("enemyStopDistance") < world("contactDistance"));
});

test("a chasing enemy stops in front of the player at the stop distance", () => {
  const world = createOpenWorld();
  const player = createPlayerAt(5.5, 5.5);
  const enemy = addEnemy(world, 8.5, 5.5, "chase");

  // 2 cells per second: one second covers 2 of the 2.5 cells left
  world("updateEnemies")(player, 60);
  assertClose(getDistance(enemy, player), 1);

  // The next second has only 0.5 cells of room
  world("updateEnemies")(player, 60);
  assertClose(getDistance(enemy, player), 0.5);
  assertClose(enemy.posX, 6);

  world("updateEnemies")(player, 60);
  assertClose(enemy.posX, 6);
});

test("one long tick never takes the enemy past the stop distance", () => {
  const world = createOpenWorld();
  const player = createPlayerAt(5.5, 5.5);
  const enemy = addEnemy(world, 6.5, 6.5, "chase");

  // Ten seconds in one tick would be 20 cells
  world("updateEnemies")(player, 600);

  assertClose(getDistance(enemy, player), 0.5);
});

test("a player walking into an enemy stops at the stop distance", () => {
  const world = createOpenWorld();
  const player = createPlayerAt(5.5, 5.5);
  const enemy = addEnemy(world, 6.3, 5.5, "idle");
  const moveSpeed = world("moveSpeed");

  for (let tick = 0; tick < 30; tick += 1) {
    world("updatePlayer")(player, new Set(["w"]), 1);
  }

  const distance = getDistance(enemy, player);
  assert.ok(distance >= 0.5, `${distance} is inside the stop distance`);
  assert.ok(distance < 0.5 + moveSpeed, `${distance} stopped a step early`);
});

test("a player blocked by an enemy slides along it on the other axis", () => {
  const world = createOpenWorld();
  const player = createPlayerAt(5.5, 5.5);
  player.dirX = Math.SQRT1_2;
  player.dirY = Math.SQRT1_2;
  addEnemy(world, 6, 5.5, "idle");

  world("updatePlayer")(player, new Set(["w"]), 1);

  // x would bring it closer than 0.5; y moves it around the enemy
  assert.equal(player.posX, 5.5);
  assertClose(player.posY, 5.5 + Math.SQRT1_2 * world("moveSpeed"));
});

test("a player inside the stop distance can always walk away", () => {
  const world = createOpenWorld();
  const player = createPlayerAt(5.5, 5.5);
  addEnemy(world, 5.8, 5.5, "idle");

  world("updatePlayer")(player, new Set(["w"]), 1);
  assert.equal(player.posX, 5.5);

  world("updatePlayer")(player, new Set(["s"]), 1);
  assertClose(player.posX, 5.5 - world("moveSpeed"));
});

test("an enemy two cells away does not block the player", () => {
  const world = createOpenWorld();
  const player = createPlayerAt(5.5, 5.5);
  addEnemy(world, 7.5, 5.5, "idle");

  world("updatePlayer")(player, new Set(["w"]), 1);

  assertClose(player.posX, 5.5 + world("moveSpeed"));
});

test("backing away outruns the chase and leaves contact before the next hit", () => {
  const world = createOpenWorld();
  const player = createPlayerAt(5.5, 5.5);
  const enemy = addEnemy(world, 6, 5.5, "chase");
  let damage = 0;

  // 3.125 cells per second against 2
  assert.ok(world("moveSpeed") > world("enemyChaseSpeed"));

  // One second, frame by frame, as in the ticker
  for (let tick = 0; tick < 60; tick += 1) {
    world("updatePlayer")(player, new Set(["s"]), 1);
    world("updateEnemies")(player, 1);
    damage += world("getContactDamage")(player, 1);
  }

  // Only the hit on first contact; the gap grew by 1.125 cells
  assert.equal(damage, 1);
  assertClose(getDistance(enemy, player), 0.5 + (world("moveSpeed") - world("enemyChaseSpeed")) * 60);
  assert.ok(getDistance(enemy, player) > world("contactDistance"));
});
