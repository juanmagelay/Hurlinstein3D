const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-scripts.js");

const getGlobal = loadScripts();
const getScore = getGlobal("getScore");
const normalizeInitials = getGlobal("normalizeInitials");
const formatScoreDate = getGlobal("formatScoreDate");

test("the score is 100 per regular enemy plus 1000 for the boss (D-32)", () => {
  assert.equal(getScore(0, false), 0);
  assert.equal(getScore(3, false), 300);
  assert.equal(getScore(3, true), 1300);
});

test("the initials are uppercased, letters only and cut to three (D-32)", () => {
  assert.equal(normalizeInitials("abc"), "ABC");
  assert.equal(normalizeInitials(" a b "), "AB");
  assert.equal(normalizeInitials("abcdef"), "ABC");
  assert.equal(normalizeInitials(""), "");
});

test("the score date reads year-month-day (D-32)", () => {
  assert.equal(formatScoreDate("2026-11-23T12:34:56.000Z"), "2026-11-23");
});
