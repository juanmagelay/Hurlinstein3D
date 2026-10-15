const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

const getGlobal = loadScripts();

const tryFire = getGlobal("tryFire");
const startReload = getGlobal("startReload");
const updateReload = getGlobal("updateReload");
const createReloadInput = getGlobal("createReloadInput");
const magazineSize = getGlobal("magazineSize");
const reloadDuration = getGlobal("reloadDuration");

// A deltaTime (in 60 Hz ticker units) that exactly fills the reload timer
const fullReload = reloadDuration * 60;

function makePlayer(overrides) {
  return Object.assign(
    { ammo: magazineSize, reloading: false, reloadTime: 0 },
    overrides
  );
}

test("a shot spends one round and a full magazine can fire", () => {
  const player = makePlayer();

  assert.equal(tryFire(player), true);
  assert.equal(player.ammo, magazineSize - 1);
});

test("an empty magazine cannot fire and never goes negative", () => {
  const player = makePlayer({ ammo: 0 });

  assert.equal(tryFire(player), false);
  assert.equal(player.ammo, 0);
});

test("firing is blocked while reloading", () => {
  const player = makePlayer({ ammo: 2, reloading: true });

  assert.equal(tryFire(player), false);
  assert.equal(player.ammo, 2);
});

test("reloading a full magazine does nothing", () => {
  const player = makePlayer();

  assert.equal(startReload(player), false);
  assert.equal(player.reloading, false);
});

test("reloading an incomplete magazine starts the reload", () => {
  const player = makePlayer({ ammo: 3 });

  assert.equal(startReload(player), true);
  assert.equal(player.reloading, true);
  assert.equal(player.reloadTime, 0);
});

test("reloading twice in a row is ignored", () => {
  const player = makePlayer({ ammo: 1 });
  startReload(player);

  assert.equal(startReload(player), false);
});

test("a reload tops the magazine back up after its duration", () => {
  const player = makePlayer({ ammo: 1 });
  startReload(player);

  assert.equal(updateReload(player, fullReload / 2), false);
  assert.equal(updateReload(player, fullReload), true);
  assert.equal(player.reloading, false);
  assert.equal(player.ammo, magazineSize);
});

test("updateReload is a no-op when not reloading", () => {
  const player = makePlayer({ ammo: 2 });

  assert.equal(updateReload(player, fullReload), false);
  assert.equal(player.ammo, 2);
});

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

test("R reloads once per press and ignores key repeat", () => {
  const target = createFakeTarget();
  const reloadInput = createReloadInput(target);
  const press = { key: "r", repeat: false };
  const repeat = { key: "r", repeat: true };

  assert.equal(reloadInput.consumeReload(), false);
  target.dispatch("keydown", press);
  assert.equal(reloadInput.consumeReload(), true);
  assert.equal(reloadInput.consumeReload(), false);

  target.dispatch("keydown", repeat);
  assert.equal(reloadInput.consumeReload(), false);
});
