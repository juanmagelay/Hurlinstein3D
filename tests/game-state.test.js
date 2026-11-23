const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

test("the game starts in playing (D-17b)", () => {
  const getGlobal = loadScripts();

  assert.equal(getGlobal("getGameState")(), getGlobal("gameStatePlaying"));
});

test("the transition map holds the edges the screens use", () => {
  const getGlobal = loadScripts();
  const transitions = getGlobal("gameStateTransitions");
  const menu = getGlobal("gameStateMenu");
  const playing = getGlobal("gameStatePlaying");
  const victory = getGlobal("gameStateVictory");
  const defeat = getGlobal("gameStateDefeat");

  assert.deepEqual([...transitions[menu]], [playing]);
  assert.deepEqual([...transitions[playing]], [victory, defeat]);
  assert.deepEqual([...transitions[victory]], [playing, menu]);
  assert.deepEqual([...transitions[defeat]], [playing, menu]);
});

test("setGameState accepts an allowed transition and changes the state", () => {
  const getGlobal = loadScripts();
  const setGameState = getGlobal("setGameState");
  const getGameState = getGlobal("getGameState");
  const defeat = getGlobal("gameStateDefeat");
  const playing = getGlobal("gameStatePlaying");

  assert.equal(setGameState(defeat), true);
  assert.equal(getGameState(), defeat);
  assert.equal(setGameState(playing), true);
  assert.equal(getGameState(), playing);
});

test("setGameState rejects a disallowed transition and keeps the state", () => {
  const getGlobal = loadScripts();
  const setGameState = getGlobal("setGameState");
  const getGameState = getGlobal("getGameState");
  const menu = getGlobal("gameStateMenu");
  const playing = getGlobal("gameStatePlaying");
  const victory = getGlobal("gameStateVictory");
  const defeat = getGlobal("gameStateDefeat");

  // From playing there is no edge to menu
  assert.equal(setGameState(menu), false);
  assert.equal(getGameState(), playing);

  // From defeat there is no edge to victory
  assert.equal(setGameState(defeat), true);
  assert.equal(setGameState(victory), false);
  assert.equal(getGameState(), defeat);
});
