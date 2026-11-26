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
const shotgunReloadFrames = getGlobal("shotgunReloadFrames");
const reloadDuration = getGlobal("reloadDuration");

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
    frameDuration: shotgunFrameDuration,
    frameTime: 0,
    frameIndex: 0,
  };
}

test("the sheet holds the idle, firing and reload frames", () => {
  assert.equal(shotgunFrameCount, 15);
  assert.match(shotgunSheetDataUri, /^data:image\/png;base64,/);
});

// D-08d: the ten reload drawings of Sgun.png, one frame each, right after the
// idle frame and the four firing frames
test("the reload frames are the last ten frames of the strip", () => {
  assert.equal(shotgunReloadFrames.length, 10);
  assert.equal(shotgunReloadFrames[0], 5);
  assert.equal(shotgunReloadFrames[9], shotgunFrameCount - 1);
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

// D-08d: the reload frames share reloadDuration, so with three of them each one
// lasts a third of it
test("a reload plays the reload frames then returns to idle", () => {
  const shotgun = makeShotgun();
  const oneReloadFrame = reloadDuration / 3 * 60;

  startReloadAnimation(shotgun);
  assert.equal(shotgun.sprite.texture, "r0");

  updateShotgun(shotgun, oneReloadFrame);
  assert.equal(shotgun.sprite.texture, "r1");
  updateShotgun(shotgun, oneReloadFrame);
  assert.equal(shotgun.sprite.texture, "r2");
  updateShotgun(shotgun, oneReloadFrame);

  assert.equal(shotgun.playing, false);
  assert.equal(shotgun.sprite.texture, "idle");
});

// D-08d: with the ten real frames (0.096 s each) the animation ends with the reload
test("the reload animation lasts exactly reloadDuration", () => {
  const shotgun = makeShotgun();
  shotgun.reloadTextures = shotgunReloadFrames.map((index) => "r" + index);
  const step = 1;
  let ticks = 0;

  startReloadAnimation(shotgun);
  while (shotgun.playing && ticks < 1000) {
    updateShotgun(shotgun, step);
    ticks += step;
  }

  // 0.96 s is 57.6 ticker units, so the last frame ends on unit 58
  assert.equal(ticks, Math.ceil(reloadDuration * 60));
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

test("the aimed shotgun sits right of center, about 155 px", () => {
  // By hand (D-08d): scale 286 / 156 = 1.833, horizon at frame y 156 - 360 / 1.833
  // = -40.4, axis there at frame x 131 + (24 / 39) * (-40.4 - 91) = 50.2, so the
  // sprite moves (134.5 - 50.2) * 1.833 = 154.6 px right of 640. It was 151.3:
  // the gun now sits 3 frame rows lower, on the screen bottom.
  const spriteX = getGlobal("getAimedShotgunX()");

  assert.ok(Math.abs(spriteX - 794.6) < 0.1);
});

// D-40e: the shotgun bobs with the steps of D-40d. A walker only needs the
// step phase and how much of the bob shows.
const getShotgunBobX = getGlobal("getShotgunBobX");
const getShotgunBobY = getGlobal("getShotgunBobY");
const placeShotgun = getGlobal("placeShotgun");

function assertNearly(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} is not close to ${expected}`);
}

function makeRecordingSprite() {
  const sprite = { x: null, y: null };
  sprite.position = {
    set(x, y) {
      sprite.x = x;
      sprite.y = y;
    },
  };
  return sprite;
}

test("D-40e: at a foot strike the gun dips 1.5% of the screen height, centered", () => {
  // 0.015 * 720 = 10.8 px down, and no sideways swing at the strike
  const walker = { stepPhase: 1, bobAmount: 1 };
  assertNearly(getShotgunBobY(walker), 10.8);
  assertNearly(getShotgunBobX(walker), 0);
});

test("D-40e: the gun swings 2% to one side on one step and to the other on the next", () => {
  // 0.02 * 720 = 14.4 px, right during the first step, left during the second
  assertNearly(getShotgunBobX({ stepPhase: 0.5, bobAmount: 1 }), 14.4);
  assertNearly(getShotgunBobX({ stepPhase: 1.5, bobAmount: 1 }), -14.4);
});

test("D-40e: the offsets never pass their limits along a whole stride", () => {
  for (let stepPhase = 0; stepPhase < 2; stepPhase += 0.05) {
    const walker = { stepPhase, bobAmount: 1 };
    assert.ok(Math.abs(getShotgunBobX(walker)) <= 14.4 + 1e-9);
    assert.ok(getShotgunBobY(walker) >= 0 && getShotgunBobY(walker) <= 10.8 + 1e-9);
  }
});

test("D-40e: standing still the gun is back where D-07c aims it", () => {
  const sprite = makeRecordingSprite();
  // Walking, it moves by the bob
  placeShotgun({ sprite }, { stepPhase: 0.5, bobAmount: 1 });
  assertNearly(sprite.x, getGlobal("getAimedShotgunX()") + 14.4);
  // Stopped (the bob faded out), it is exactly at its aimed place, so the
  // barrel still crosses the crosshair
  placeShotgun({ sprite }, { stepPhase: 0.7, bobAmount: 0 });
  assert.equal(sprite.x, getGlobal("getAimedShotgunX()"));
  assert.equal(sprite.y, getGlobal("screenHeight"));
});

test("D-40e: the bob moves the gun only, so the fire frames keep playing", () => {
  const shotgun = makeShotgun();
  shotgun.sprite.position = makeRecordingSprite().position;
  triggerShotgun(shotgun);
  placeShotgun(shotgun, { stepPhase: 0.5, bobAmount: 1 });
  updateShotgun(shotgun, oneFrame);
  assert.equal(shotgun.sprite.texture, "f1");
});
