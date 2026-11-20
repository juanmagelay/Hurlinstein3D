const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

const getGlobal = loadScripts();

const tryFire = getGlobal("tryFire");
const startReload = getGlobal("startReload");
const updateReload = getGlobal("updateReload");
const createReloadInput = getGlobal("createReloadInput");
const magazineSize = getGlobal("gameSettings.magazineSize");
const reloadDuration = getGlobal("reloadDuration");

// A deltaTime (in 60 Hz ticker units) that exactly fills the reload timer
const fullReload = reloadDuration * 60;

function makePlayer(overrides) {
  return Object.assign(
    { ammo: magazineSize, reloadsLeft: Infinity, reloading: false, reloadTime: 0 },
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

// D-16c1: reloads are unlimited by default; the admin panel can limit them
test("unlimited reloads never run out", () => {
  const player = makePlayer({ ammo: 0 });

  assert.equal(startReload(player), true);
  assert.equal(player.reloadsLeft, Infinity);
});

test("a limited reload allowance is spent one reload at a time", () => {
  const player = makePlayer({ ammo: 0, reloadsLeft: 1 });

  assert.equal(startReload(player), true);
  assert.equal(player.reloadsLeft, 0);
  // A little past the duration, so floating point never leaves it unfinished
  assert.equal(updateReload(player, fullReload + 1), true);
  player.ammo = 0;

  assert.equal(startReload(player), false);
  assert.equal(player.reloading, false);
  assert.equal(tryFire(player), false);
});

test("the magazine size setting sets the rounds a reload loads", () => {
  const world = loadScripts();
  world("gameSettings.magazineSize = 12");
  const player = { ammo: 1, reloadsLeft: Infinity, reloading: false, reloadTime: 0 };

  assert.equal(world("startReload")(player), true);
  assert.equal(world("updateReload")(player, fullReload + 1), true);
  assert.equal(player.ammo, 12);
});

test("a smaller magazine drops the extra rounds, a bigger one waits for a reload", () => {
  const applyMagazineSize = getGlobal("applyMagazineSize");
  const player = makePlayer({ ammo: 6 });

  applyMagazineSize(player, 2);
  assert.equal(player.ammo, 2);
  applyMagazineSize(player, 20);
  assert.equal(player.ammo, 2);
});

test("refill ammo fills the magazine and the reload allowance", () => {
  const refillAmmo = getGlobal("refillAmmo");
  const player = makePlayer({ ammo: 0, reloadsLeft: 0 });

  refillAmmo(player, { magazineSize: 8, unlimitedReloads: false, reloadLimit: 3 });
  assert.equal(player.ammo, 8);
  assert.equal(player.reloadsLeft, 3);
});

test("R typed into an admin panel field does not reload", () => {
  const target = createFakeTarget();
  const reloadInput = createReloadInput(target);

  target.dispatch("keydown", { key: "r", repeat: false, target: { tagName: "INPUT" } });
  assert.equal(reloadInput.consumeReload(), false);
});

test("Space typed into an admin panel field does not fire", () => {
  const target = createFakeTarget();
  const fireInput = getGlobal("createFireInput")(target);
  let prevented = false;

  target.dispatch("keydown", {
    key: " ",
    repeat: false,
    target: { tagName: "INPUT" },
    preventDefault: () => {
      prevented = true;
    },
  });
  assert.equal(fireInput.consumeShot(), false);
  assert.equal(prevented, false);
});
