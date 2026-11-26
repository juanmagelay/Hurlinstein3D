const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

const getGlobal = loadScripts();

// D-07e: a PNG stores its width and height in the IHDR chunk, at bytes 16 and 20
function readPngSize(dataUri) {
  const base64 = dataUri.slice("data:image/png;base64,".length);
  const header = Buffer.from(base64.slice(0, 32), "base64");
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}

test("D-21a: the front frame is 33 by 57 px", () => {
  const size = readPngSize(getGlobal("enemySpriteDataUri"));

  assert.equal(size.width, getGlobal("enemyTextureWidth"));
  assert.equal(size.height, getGlobal("enemyTextureHeight"));
});

test("D-39b: the death strip is five frames of 51 by 60 px", () => {
  const size = readPngSize(getGlobal("enemyDeathSheetDataUri"));

  assert.equal(getGlobal("enemyDeathFrameCount"), 5);
  assert.equal(size.width, getGlobal("enemyDeathFrameCount") * getGlobal("enemyDeathFrameWidth"));
  assert.equal(size.height, getGlobal("enemyDeathFrameHeight"));
});
