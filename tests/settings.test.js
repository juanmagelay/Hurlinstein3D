// D-16c1: admin settings, their ranges and their storage (TDD 2.3.5)
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

const getGlobal = loadScripts();
const getDefaultSettings = getGlobal("getDefaultSettings");
const normalizeSetting = getGlobal("normalizeSetting");
const parseStoredSettings = getGlobal("parseStoredSettings");
const loadSettings = getGlobal("loadSettings");
const saveSettings = getGlobal("saveSettings");
const formatSettingRange = getGlobal("formatSettingRange");
const getRotationPerTick = getGlobal("getRotationPerTick");
const getReloadAllowance = getGlobal("getReloadAllowance");
const settingsStorageKey = getGlobal("settingsStorageKey");

// The vm context's objects come from another realm, so they are compared field by field
function plain(object) {
  return JSON.parse(JSON.stringify(object));
}

const defaults = {
  enemiesPerGame: 20,
  activeAreaOnly: true,
  enemyHealth: 1,
  bossHealth: 5,
  useWallTextures: true,
  useLighting: true,
  flatColors: false,
  crtFilter: true,
  playerHitPoints: 10,
  magazineSize: 6,
  unlimitedReloads: true,
  reloadLimit: 5,
  turnSpeed: 120,
  mouseSensitivity: 20,
  godMode: false,
  // D-40b and D-40d: on by default, off to compare in the defense
  verticalLook: true,
  footstepBob: true,
  stripWidth: 2,
  fisheye: false,
  minimapRays: false,
  chunkBorders: false,
  // D-41c: volumes from 0 to 100 and the mute
  masterVolume: 80,
  musicVolume: 60,
  effectsVolume: 80,
  soundMuted: false,
};

function createMemoryStorage(initialText) {
  const items = new Map();
  if (initialText !== undefined) {
    items.set(settingsStorageKey, initialText);
  }
  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, value),
    items,
  };
}

const blockedStorage = {
  getItem() {
    throw new Error("blocked");
  },
  setItem() {
    throw new Error("blocked");
  },
};

test("the defaults match TDD 2.3.5", () => {
  assert.deepEqual(plain(getDefaultSettings()), defaults);
});

test("the game starts with the defaults when there is no storage", () => {
  assert.deepEqual(plain(getGlobal("gameSettings")), defaults);
});

test("numbers are clamped to their range and rounded", () => {
  assert.equal(normalizeSetting("magazineSize", 1), 2);
  assert.equal(normalizeSetting("magazineSize", 50), 20);
  assert.equal(normalizeSetting("magazineSize", "12"), 12);
  assert.equal(normalizeSetting("magazineSize", "7.6"), 8);
  assert.equal(normalizeSetting("turnSpeed", -90), 30);
  assert.equal(normalizeSetting("reloadLimit", 0), 0);
});

test("an empty or invalid number gives the default", () => {
  assert.equal(normalizeSetting("magazineSize", ""), 6);
  assert.equal(normalizeSetting("magazineSize", "abc"), 6);
  assert.equal(normalizeSetting("magazineSize", null), 6);
  assert.equal(normalizeSetting("magazineSize", true), 6);
  assert.equal(normalizeSetting("turnSpeed", Infinity), 120);
});

test("flags only take true or false", () => {
  assert.equal(normalizeSetting("godMode", true), true);
  assert.equal(normalizeSetting("godMode", "true"), false);
  assert.equal(normalizeSetting("unlimitedReloads", 0), true);
});

test("D-16d and D-29b render toggles normalize and persist", () => {
  const settings = getDefaultSettings();
  for (const key of ["useWallTextures", "useLighting", "flatColors", "crtFilter"]) {
    settings[key] = false;
    assert.equal(normalizeSetting(key, false), false);
    assert.equal(normalizeSetting(key, true), true);
  }
  const storage = createMemoryStorage();
  saveSettings(storage, settings);
  const loaded = loadSettings(storage);
  assert.equal(loaded.useWallTextures, false);
  assert.equal(loaded.useLighting, false);
  assert.equal(loaded.flatColors, false);
  assert.equal(loaded.crtFilter, false);
});

test("the range text is the one shown next to each field", () => {
  assert.equal(formatSettingRange("magazineSize"), "2 to 20");
  assert.equal(formatSettingRange("turnSpeed"), "30 to 360");
  assert.equal(formatSettingRange("mouseSensitivity"), "5 to 100");
  assert.equal(formatSettingRange("enemiesPerGame"), "1 to 100,000");
});

test("D-16c1e: the enemies per game go from 1 to 100,000", () => {
  assert.equal(normalizeSetting("enemiesPerGame", 0), 1);
  assert.equal(normalizeSetting("enemiesPerGame", "250000"), 100000);
  assert.equal(normalizeSetting("enemiesPerGame", "500"), 500);
});

test("D-16e1: the strip width only takes 1, 2, 4 or 8 px", () => {
  assert.equal(normalizeSetting("stripWidth", "4"), 4);
  assert.equal(normalizeSetting("stripWidth", 8), 8);
  assert.equal(normalizeSetting("stripWidth", 3), 2);
  assert.equal(normalizeSetting("stripWidth", 16), 2);
  assert.equal(normalizeSetting("stripWidth", ""), 2);
});

test("stored settings are normalized, and unknown or missing names are ignored", () => {
  const settings = parseStoredSettings(JSON.stringify({ magazineSize: 99, godMode: true, enemiesPerChunk: 5 }));
  assert.equal(settings.magazineSize, 20);
  assert.equal(settings.godMode, true);
  assert.equal(settings.turnSpeed, 120);
  assert.equal("enemiesPerChunk" in settings, false);
});

test("invalid stored text gives the defaults", () => {
  assert.deepEqual(plain(parseStoredSettings("{not json")), defaults);
  assert.deepEqual(plain(parseStoredSettings("42")), defaults);
  assert.deepEqual(plain(parseStoredSettings(null)), defaults);
});

test("settings survive a save and a load", () => {
  const storage = createMemoryStorage();
  const settings = getDefaultSettings();
  settings.turnSpeed = 90;
  settings.unlimitedReloads = false;

  assert.equal(saveSettings(storage, settings), true);
  const loaded = loadSettings(storage);
  assert.equal(loaded.turnSpeed, 90);
  assert.equal(loaded.unlimitedReloads, false);
});

test("blocked or missing storage never breaks the game", () => {
  assert.deepEqual(plain(loadSettings(blockedStorage)), defaults);
  assert.deepEqual(plain(loadSettings(null)), defaults);
  assert.equal(saveSettings(blockedStorage, getDefaultSettings()), false);
  assert.equal(saveSettings(null, getDefaultSettings()), false);
});

test("120 degrees per second turn a third of a full turn in 60 ticker units", () => {
  const rotationPerTick = getRotationPerTick(120);
  assert.ok(Math.abs(rotationPerTick * 60 - (2 * Math.PI) / 3) < 1e-12);
});

test("unlimited reloads are Infinity, limited ones are the limit", () => {
  assert.equal(getReloadAllowance({ unlimitedReloads: true, reloadLimit: 3 }), Infinity);
  assert.equal(getReloadAllowance({ unlimitedReloads: false, reloadLimit: 3 }), 3);
});

test("D-41c: the three volumes go from 0 to 100 and the mute is a flag", () => {
  for (const name of ["masterVolume", "musicVolume", "effectsVolume"]) {
    assert.equal(formatSettingRange(name), "0 to 100");
    assert.equal(normalizeSetting(name, -5), 0);
    assert.equal(normalizeSetting(name, "150"), 100);
    assert.equal(normalizeSetting(name, "42.4"), 42);
  }
  assert.equal(normalizeSetting("soundMuted", true), true);
  assert.equal(normalizeSetting("soundMuted", "yes"), false);
});
