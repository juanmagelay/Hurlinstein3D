// D-41b, D-41c, D-41e and D-41f: the audio engine without a browser (TDD 2.3.7)
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { loadScripts } = require("./load-scripts.js");

const getGlobal = loadScripts();

function assertClose(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} is not close to ${expected}`);
}

// A fake output that records what the engine asks for, instead of playing it
function recordAudio(world) {
  const record = { sounds: [], plans: [], volumes: [] };
  world("setAudioOutput")({
    playSound: (name, options) => record.sounds.push({ name, options }),
    playMusic: (plan) => record.plans.push({ ...plan }),
    setVolumes: (settings) => record.volumes.push({ ...settings }),
  });
  return record;
}

test("D-41b: base64 turns back into the same bytes, with and without padding", () => {
  const base64ToBytes = getGlobal("base64ToBytes");
  for (let length = 0; length <= 10; length += 1) {
    const bytes = crypto.randomBytes(length);
    assert.deepEqual(Array.from(base64ToBytes(bytes.toString("base64"))), Array.from(bytes));
  }
  // "Hi!" is three bytes, four letters and no padding
  assert.deepEqual(Array.from(base64ToBytes("SGkh")), [72, 105, 33]);
});

test("D-41b: a data URI gives the bytes after the comma", () => {
  const dataUriToBytes = getGlobal("dataUriToBytes");
  assert.deepEqual(Array.from(dataUriToBytes("data:audio/mp4;base64,AAEC/w==")), [0, 1, 2, 255]);
});

test("D-41b: before the first gesture nothing plays and nothing throws", () => {
  const world = loadScripts();
  assert.equal(world("audioOutput"), null);
  world("playSound")("shot");
  world("playSoundAt")("enemyHit", 3, 4, world("player"));
  world("playMusicForState")(world("gameStatePlaying"));
  world("applyAudioVolumes")();
  // The plan is kept for when the audio opens
  assert.equal(world("musicPlan.music"), "arenaMusic");
});

test("D-41c: a volume of 0 to 100 becomes a squared gain of 0 to 1", () => {
  const getVolumeGain = getGlobal("getVolumeGain");
  assert.equal(getVolumeGain(0), 0);
  assert.equal(getVolumeGain(100), 1);
  assertClose(getVolumeGain(50), 0.25);
});

test("D-41c: mute silences the master gain and keeps the volumes", () => {
  const world = loadScripts();
  const record = recordAudio(world);
  const storage = { getItem: () => null, setItem: () => {} };
  const player = world("player");

  world("changeSetting")(player, storage, "masterVolume", "50");
  world("changeSetting")(player, storage, "soundMuted", true);
  assert.equal(world("getMasterGain")(world("gameSettings")), 0);
  assert.equal(world("gameSettings.masterVolume"), 50);
  assert.equal(world("gameSettings.musicVolume"), 60);

  world("changeSetting")(player, storage, "soundMuted", false);
  assertClose(world("getMasterGain")(world("gameSettings")), 0.25);
  // Each change reached the output
  assert.equal(record.volumes.length, 3);
  assert.equal(record.volumes[1].soundMuted, true);
});

test("D-41e: each game state picks its track, with a sting on victory and defeat", () => {
  const getMusicPlan = getGlobal("getMusicPlan");
  const plan = (state) => JSON.parse(JSON.stringify(getMusicPlan(getGlobal(state))));
  assert.deepEqual(plan("gameStateMenu"), { sting: null, music: "menuMusic" });
  assert.deepEqual(plan("gameStatePlaying"), { sting: null, music: "arenaMusic" });
  assert.deepEqual(plan("gameStateVictory"), { sting: "victory", music: "menuMusic" });
  assert.deepEqual(plan("gameStateDefeat"), { sting: "defeat", music: "menuMusic" });
});

test("D-41e: a state change sends its plan to the output", () => {
  const world = loadScripts();
  const record = recordAudio(world);
  world("playMusicForState")(world("gameStateDefeat"));
  assert.deepEqual(record.plans, [{ sting: "defeat", music: "menuMusic" }]);
});

test("D-41f: the dot product with plane pans right positive, ahead 0 and left negative", () => {
  const getSoundPan = getGlobal("getSoundPan");
  // Facing east (+x); y grows downward, so plane (0, 0.66) points right
  const listener = { posX: 5, posY: 5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66 };
  assertClose(getSoundPan(listener, 9, 5), 0);
  assertClose(getSoundPan(listener, 5, 8), 1);
  assertClose(getSoundPan(listener, 5, 2), -1);
  // Behind is centered too: the radar used dir to tell front from back
  assertClose(getSoundPan(listener, 1, 5), 0);
  // Ahead and to the right at 45 degrees: cos(45 degrees)
  assertClose(getSoundPan(listener, 7, 7), Math.SQRT1_2);
  // On top of the player there is no side
  assert.equal(getSoundPan(listener, 5, 5), 0);
});

test("D-41f: the volume falls with the inverse of the distance", () => {
  const getDistanceGain = getGlobal("getDistanceGain");
  assert.equal(getDistanceGain(1), 1);
  assert.equal(getDistanceGain(2), 1);
  assertClose(getDistanceGain(4), 0.5);
  assertClose(getDistanceGain(8), 0.25);
  assert.ok(getDistanceGain(24) < getDistanceGain(12));
});

test("D-41f: a sound at a position carries its pan and distance volume", () => {
  const world = loadScripts();
  const record = recordAudio(world);
  const listener = { posX: 5, posY: 5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66 };
  world("playSoundAt")("enemyHit", 5, 13, listener, { rate: 0.7 });
  const played = record.sounds[0];
  assert.equal(played.name, "enemyHit");
  assertClose(played.options.pan, 1);
  assertClose(played.options.volume, 0.25);
  assert.equal(played.options.rate, 0.7);
});

test("D-41a: every sound has a level, and its data URI holds the file in assets/sounds", () => {
  const soundDataUris = getGlobal("soundDataUris");
  const soundLevels = getGlobal("soundLevels");
  const soundsDir = path.join(__dirname, "..", "assets", "sounds");
  assert.deepEqual(Object.keys(soundDataUris).sort(), Object.keys(soundLevels).sort());
  for (const name of Object.keys(soundDataUris)) {
    const dataUri = soundDataUris[name];
    assert.ok(dataUri.startsWith("data:audio/mp4;base64,"), `${name} is not an M4A data URI`);
    const file = fs.readFileSync(path.join(soundsDir, `${name}.m4a`));
    assert.equal(dataUri.slice(dataUri.indexOf(",") + 1), file.toString("base64"), `${name} differs from its file`);
  }
});
