const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

const getGlobal = loadScripts();

const triggerShotgun = getGlobal("triggerShotgun");
const startReloadAnimation = getGlobal("startReloadAnimation");
const updateShotgun = getGlobal("updateShotgun");
const shotgunFrameCount = getGlobal("shotgunFrameCount");
const shotgunFrameDuration = getGlobal("shotgunFrameDuration");
const shotgunSheetDataUri = getGlobal("shotgunSheetDataUri");

// One firing frame every shotgunFrameDuration seconds, so this deltaTime (in
// 60 Hz ticker units) is exactly enough to advance a single frame.
const oneFrame = shotgunFrameDuration * 60;

function makeShotgun() {
  return {
    sprite: { texture: "idle" },
    idleTexture: "idle",
    fireTextures: ["f0", "f1", "f2", "f3"],
    reloadTextures: ["r0", "r1", "r2"],
    playing: false,
    sequence: null,
    frameTime: 0,
    frameIndex: 0,
  };
}

test("the sheet holds the idle, firing and reload frames", () => {
  assert.equal(shotgunFrameCount, 17);
  assert.match(shotgunSheetDataUri, /^data:image\/png;base64,/);
});

test("a trigger starts the animation on its first firing frame", () => {
  const shotgun = makeShotgun();

  triggerShotgun(shotgun);

  assert.equal(shotgun.playing, true);
  assert.equal(shotgun.sprite.texture, "f0");
});

test("a partial step of time does not advance the frame", () => {
  const shotgun = makeShotgun();
  triggerShotgun(shotgun);

  updateShotgun(shotgun, oneFrame / 2);

  assert.equal(shotgun.sprite.texture, "f0");
});

test("the firing animation walks every frame then returns to idle", () => {
  const shotgun = makeShotgun();
  triggerShotgun(shotgun);

  updateShotgun(shotgun, oneFrame);
  assert.equal(shotgun.sprite.texture, "f1");
  updateShotgun(shotgun, oneFrame);
  assert.equal(shotgun.sprite.texture, "f2");
  updateShotgun(shotgun, oneFrame);
  assert.equal(shotgun.sprite.texture, "f3");
  updateShotgun(shotgun, oneFrame);

  assert.equal(shotgun.playing, false);
  assert.equal(shotgun.sprite.texture, "idle");
});

test("a reload plays the reload frames then returns to idle", () => {
  const shotgun = makeShotgun();

  startReloadAnimation(shotgun);
  assert.equal(shotgun.sprite.texture, "r0");

  updateShotgun(shotgun, oneFrame);
  assert.equal(shotgun.sprite.texture, "r1");
  updateShotgun(shotgun, oneFrame);
  assert.equal(shotgun.sprite.texture, "r2");
  updateShotgun(shotgun, oneFrame);

  assert.equal(shotgun.playing, false);
  assert.equal(shotgun.sprite.texture, "idle");
});

test("an idle shotgun ignores the update", () => {
  const shotgun = makeShotgun();

  updateShotgun(shotgun, 1000);

  assert.equal(shotgun.sprite.texture, "idle");
  assert.equal(shotgun.frameIndex, 0);
});
