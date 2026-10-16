const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

// An air world with a single, movable wall cell so shots can be blocked.
const getGlobal = loadScripts();
getGlobal("wallX = -1");
getGlobal("getCell = function (x, y) { return (x === wallX) ? 1 : 0; }");
const shootCenterRay = getGlobal("shootCenterRay");
const createFireInput = getGlobal("createFireInput");
const enemiesByChunk = getGlobal("enemiesByChunk");
const enemiesByCell = getGlobal("enemiesByCell");
const getChunkKey = getGlobal("getChunkKey");
const getEnemiesAtCell = getGlobal("getEnemiesAtCell");
const registerEnemyAtCell = getGlobal("registerEnemyAtCell");
const setWall = (x) => getGlobal(`wallX = ${x}`);
const player = { posX: 3.5, posY: 5.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66 };

function reset() {
  enemiesByChunk.clear();
  enemiesByCell.clear();
}

function addEnemy(posX, posY) {
  const enemy = {
    id: 7,
    posX,
    posY,
    cellX: Math.floor(posX),
    cellY: Math.floor(posY),
    chunkX: Math.floor(posX / 16),
    chunkY: Math.floor(posY / 16),
    width: 0.3,
    height: 0.6,
    state: "idle",
    stateTime: 0,
  };
  const chunkKey = getChunkKey(0, 0);
  if (!enemiesByChunk.has(chunkKey)) {
    enemiesByChunk.set(chunkKey, []);
  }
  enemiesByChunk.get(chunkKey).push(enemy);
  registerEnemyAtCell(enemy);
  return enemy;
}

test("a shot hits the enemy straight ahead and removes it", () => {
  reset();
  const enemy = addEnemy(5.5, 5.5);
  setWall(-1);

  const victim = shootCenterRay(player);

  assert.equal(victim, enemy);
  assert.equal(getEnemiesAtCell(5, 5).length, 0);
  assert.equal(enemiesByChunk.get(getChunkKey(0, 0)).length, 0);
});

test("a wall in the way blocks the shot", () => {
  reset();
  const enemy = addEnemy(7.5, 5.5);
  setWall(5);

  const victim = shootCenterRay(player);

  assert.equal(victim, null);
  assert.equal(getEnemiesAtCell(7, 5).length, 1);
});

test("an enemy off to the side is not hit", () => {
  reset();
  const enemy = addEnemy(5.5, 6.5);
  setWall(-1);

  assert.equal(shootCenterRay(player), null);
  assert.equal(getEnemiesAtCell(5, 6).length, 1);
});

test("an enemy behind the player is not hit", () => {
  reset();
  addEnemy(1.5, 5.5);
  setWall(-1);

  assert.equal(shootCenterRay(player), null);
});

test("only the nearest enemy in the line of the shot is hit", () => {
  reset();
  const farEnemy = addEnemy(8.5, 5.5);
  const nearEnemy = addEnemy(5.5, 5.5);
  setWall(-1);

  const victim = shootCenterRay(player);

  assert.equal(victim, nearEnemy);
  assert.equal(getEnemiesAtCell(5, 5).length, 0);
  assert.equal(getEnemiesAtCell(8, 5).length, 1);
  assert.equal(farEnemy.id, 7);
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

test("space fires once per press and ignores key repeat", () => {
  const target = createFakeTarget();
  const fireInput = createFireInput(target);
  const spaceDown = { key: " ", repeat: false, preventDefault() {} };
  const spaceRepeat = { key: " ", repeat: true, preventDefault() {} };

  assert.equal(fireInput.consumeShot(), false);

  target.dispatch("keydown", spaceDown);
  assert.equal(fireInput.consumeShot(), true);
  assert.equal(fireInput.consumeShot(), false);

  target.dispatch("keydown", spaceRepeat);
  assert.equal(fireInput.consumeShot(), false);
});
