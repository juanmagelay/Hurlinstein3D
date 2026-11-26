// D-41d: each game event plays its sound once, in the frame of the event
// (TDD 2.3.7). A fake audio output records the names instead of playing them.
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

// An all-air world with a fake output; names() lists what played so far
function makeSoundWorld() {
  const world = loadScripts();
  world("getCell = function (x, y) { return 0; }");
  const played = [];
  world("setAudioOutput")({
    playSound: (name, options) => played.push({ name, options }),
    playMusic: () => {},
    setVolumes: () => {},
  });
  return { world, played, names: () => played.map((sound) => sound.name) };
}

function createShooter(overrides = {}) {
  return { ammo: 6, reloading: false, shotCooldown: 0, reloadsLeft: Infinity, ...overrides };
}

// One enemy registered at (x, y), in its cell and its chunk
function addEnemy(world, x, y, overrides = {}) {
  const enemy = {
    posX: x,
    posY: y,
    cellX: Math.floor(x),
    cellY: Math.floor(y),
    chunkX: Math.floor(x / 16),
    chunkY: Math.floor(y / 16),
    width: world("enemyWidth"),
    height: 0.6,
    health: 1,
    contactDamage: 1,
    state: "idle",
    stateTime: 0,
    hitWait: 0,
    ...overrides,
  };
  const key = world("getChunkKey")(enemy.chunkX, enemy.chunkY);
  if (!world("enemiesByChunk").has(key)) {
    world("enemiesByChunk").set(key, []);
  }
  world("enemiesByChunk").get(key).push(enemy);
  world("registerEnemyAtCell")(enemy);
  return enemy;
}

test("a shot plays the blast once", () => {
  const { world, names } = makeSoundWorld();
  assert.equal(world("tryFire")(createShooter()), true);
  assert.deepEqual(names(), ["shot"]);
});

test("the trigger on an empty magazine plays a dry click, never while reloading or cooling down", () => {
  const { world, names } = makeSoundWorld();
  world("tryFire")(createShooter({ ammo: 0 }));
  assert.deepEqual(names(), ["dryFire"]);
  world("tryFire")(createShooter({ ammo: 0, reloading: true }));
  world("tryFire")(createShooter({ ammo: 3, shotCooldown: 0.5 }));
  assert.deepEqual(names(), ["dryFire"]);
});

test("a reload plays its sound when it starts, and a refused one plays nothing", () => {
  const { world, names } = makeSoundWorld();
  assert.equal(world("startReload")(createShooter({ ammo: 2 })), true);
  assert.equal(world("startReload")(createShooter({ ammo: 6 })), false);
  assert.deepEqual(names(), ["reload"]);
});

test("a contact hit plays the player's grunt; god mode and zero damage play nothing", () => {
  const { world, names } = makeSoundWorld();
  const target = { health: 10 };
  assert.equal(world("damagePlayer")(target, 1), true);
  assert.equal(world("damagePlayer")(target, 0), false);
  world("gameSettings.godMode = true");
  assert.equal(world("damagePlayer")(target, 1), false);
  assert.deepEqual(names(), ["playerHit"]);
});

test("a hit and a kill play their sounds from where the enemy is", () => {
  const { world, played, names } = makeSoundWorld();
  const player = world("player");
  // Right of the player: plane points right when facing east
  const enemy = addEnemy(world, player.posX, player.posY + 2, { health: 2 });
  world("damageEnemy")(enemy, player);
  world("damageEnemy")(enemy, player);
  assert.deepEqual(names(), ["enemyHit", "enemyDeath"]);
  assert.ok(played[0].options.pan > 0.99);
  assert.equal(played[0].options.rate, 1);
});

test("the boss plays the enemy sounds slower, so deeper", () => {
  const { world, played } = makeSoundWorld();
  const player = world("player");
  const boss = addEnemy(world, player.posX + 2, player.posY, { isBoss: true, health: 2 });
  world("damageEnemy")(boss, player);
  assert.equal(played[0].name, "enemyHit");
  assert.equal(played[0].options.rate, world("bossSoundRate"));
});

test("an enemy that spots the player growls once, as the chase starts", () => {
  const { world, names } = makeSoundWorld();
  const player = world("player");
  const enemy = addEnemy(world, player.posX + 3, player.posY, { state: "patrol" });
  world("updatePatrol")(enemy, player, 1);
  assert.equal(enemy.state, "chase");
  world("updateChase")(enemy, player, 1);
  assert.deepEqual(names(), ["enemyAlert"]);
});

test("the boss roars when it appears", () => {
  const { world, names } = makeSoundWorld();
  world("spawnBoss")(world("player"));
  assert.deepEqual(names(), ["bossAppear"]);
});

test("each foot strike plays a step, left at phase 1 and right at phase 2", () => {
  const { world, names } = makeSoundWorld();
  const walker = { stepPhase: 0, bobAmount: 0 };
  const updateFootstepBob = world("updateFootstepBob");
  updateFootstepBob(walker, 0.6, 1);
  assert.deepEqual(names(), []);
  updateFootstepBob(walker, 0.6, 1);
  assert.deepEqual(names(), ["footstepLeft"]);
  updateFootstepBob(walker, 0.6, 1);
  updateFootstepBob(walker, 0.6, 1);
  assert.deepEqual(names(), ["footstepLeft", "footstepRight"]);
  // Standing still plays nothing
  updateFootstepBob(walker, 0, 1);
  assert.equal(names().length, 2);
});

test("with the bob off the steps are still heard", () => {
  const { world, names } = makeSoundWorld();
  world("gameSettings.footstepBob = false");
  const walker = { stepPhase: 0.9, bobAmount: 0 };
  world("updateFootstepBob")(walker, 0.2, 1);
  assert.deepEqual(names(), ["footstepLeft"]);
});
