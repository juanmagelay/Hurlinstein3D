const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

// D-39f / TDD 2.3.2 and 3.5: the blood spray, a fixed pool of drops moved by
// an Euler step

test("D-39f: one Euler step adds gravity to the velocity, then the velocity to the position", () => {
  const world = loadScripts();
  // Gravity is 9 cells per second squared: 9 / 3600 = 0.0025 cells per tick squared
  assert.equal(world("bloodGravity"), 0.0025);
  const drop = { active: true, posX: 1, posY: 2, z: 0.5, velX: 0.02, velY: -0.01, velZ: 0.01, life: 30 };

  world("stepBloodDrop")(drop, 2);

  // velZ = 0.01 - 0.0025 * 2 = 0.005, then z = 0.5 + 0.005 * 2 = 0.51.
  // x and y only move: 1 + 0.02 * 2 = 1.04 and 2 - 0.01 * 2 = 1.98.
  assert.ok(Math.abs(drop.velZ - 0.005) < 1e-12);
  assert.ok(Math.abs(drop.z - 0.51) < 1e-12);
  assert.ok(Math.abs(drop.posX - 1.04) < 1e-12);
  assert.ok(Math.abs(drop.posY - 1.98) < 1e-12);
  assert.equal(drop.velX, 0.02);
  assert.equal(drop.life, 28);
  assert.equal(drop.active, true);
});

test("D-39f: a drop dies on reaching the floor or when its life runs out", () => {
  const world = loadScripts();
  const stepBloodDrop = world("stepBloodDrop");

  const falling = { active: true, posX: 0, posY: 0, z: 0.01, velX: 0, velY: 0, velZ: -0.02, life: 30 };
  stepBloodDrop(falling, 1);
  assert.equal(falling.active, false);

  const tired = { active: true, posX: 0, posY: 0, z: 0.4, velX: 0, velY: 0, velZ: 0, life: 0.5 };
  stepBloodDrop(tired, 1);
  assert.equal(tired.active, false);
});

test("D-39f: the spray leaves the chest and goes out the far side of the hit", () => {
  const world = loadScripts();
  const player = { posX: 0.5, posY: 0.5 };
  const enemy = { posX: 3.5, posY: 0.5, height: 0.6 };

  world("sprayBlood")(enemy, player, 6);

  const drops = world("bloodDrops").filter((drop) => drop.active);
  assert.equal(drops.length, 6);
  for (const drop of drops) {
    assert.equal(drop.posX, 3.5);
    assert.equal(drop.posY, 0.5);
    assert.ok(Math.abs(drop.z - 0.42) < 1e-12);
    // The fan is 1.75 radians wide around +x, so every drop moves away from the player
    assert.ok(drop.velX > 0);
    assert.ok(drop.velZ > 0);
  }
  // Every drop lands within its life: 120 ticks later none is in the air
  for (let tick = 0; tick < 120; tick++) {
    world("updateBloodDrops")(1);
  }
  assert.equal(world("getActiveBloodDropCount")(), 0);
});

test("D-39f: the pool never grows past 256 and a full pool skips new drops", () => {
  const world = loadScripts();
  const bloodDrops = world("bloodDrops");
  const player = { posX: 0.5, posY: 0.5 };
  const enemy = { posX: 3.5, posY: 0.5, height: 0.6 };

  world("sprayBlood")(enemy, player, 300);
  assert.equal(bloodDrops.length, 256);
  assert.equal(world("getActiveBloodDropCount")(), 256);

  world("sprayBlood")(enemy, player, 10);
  assert.equal(bloodDrops.length, 256);
  assert.equal(world("getActiveBloodDropCount")(), 256);
});

test("D-39f: a hit sprays 6 drops and the killing hit 24 more", () => {
  const world = loadScripts();
  const player = world("player");
  const enemy = {
    posX: player.posX + 2, posY: player.posY, height: 0.6, width: 0.3, health: 2,
    cellX: 0, cellY: 0, chunkX: 0, chunkY: 0,
  };

  world("damageEnemy")(enemy, player);
  assert.equal(world("getActiveBloodDropCount")(), 6);

  world("damageEnemy")(enemy, player);
  assert.equal(world("getActiveBloodDropCount")(), 30);
});
