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

// D-07e: a PNG stores its width and height in the IHDR chunk, at bytes 16 and 20
test("the strip is exactly frame count times frame width wide", () => {
  const base64 = shotgunSheetDataUri.slice("data:image/png;base64,".length);
  const header = Buffer.from(base64.slice(0, 32), "base64");

  assert.equal(header.readUInt32BE(16), shotgunFrameCount * getGlobal("shotgunFrameWidth"));
  assert.equal(header.readUInt32BE(20), getGlobal("shotgunFrameHeight"));
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

// D-07c: maps a pixel of the idle frame to the screen, for a sprite anchored at
// its bottom center on (spriteX, screenHeight) and scaled to the display height.
function frameToScreen(spriteX, frameX, frameY) {
  const frameWidth = getGlobal("shotgunFrameWidth");
  const frameHeight = getGlobal("shotgunFrameHeight");
  const scale = getGlobal("shotgunDisplayHeight") / frameHeight;
  return {
    x: spriteX + (frameX - frameWidth / 2) * scale,
    y: getGlobal("screenHeight") - (frameHeight - frameY) * scale,
  };
}

test("the barrel axis, extended, crosses the horizon at the crosshair", () => {
  const spriteX = getGlobal("getAimedShotgunX()");
  const breech = frameToScreen(spriteX, getGlobal("shotgunBreechX"), getGlobal("shotgunBreechY"));
  const sight = frameToScreen(spriteX, getGlobal("shotgunSightX"), getGlobal("shotgunSightY"));
  const horizonY = getGlobal("screenHeight") / 2;

  // Point of the screen line through breech and sight at the horizon height
  const t = (horizonY - breech.y) / (sight.y - breech.y);
  const horizonX = breech.x + t * (sight.x - breech.x);

  assert.ok(Math.abs(horizonX - getGlobal("screenWidth") / 2) < 1e-9);
});

test("the aimed shotgun sits right of center, about 151 px", () => {
  // By hand: scale 260 / 142, horizon at frame y -54.6, axis there at frame x 6.9,
  // so the sprite moves (89.5 - 6.9) * 1.83 = 151.3 px right of 640. Same value
  // as with the 133 px frame (D-07e): the margin is symmetric.
  const spriteX = getGlobal("getAimedShotgunX()");

  assert.ok(Math.abs(spriteX - 791.3) < 0.1);
});
