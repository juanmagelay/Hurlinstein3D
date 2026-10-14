// TDD 5.1 and 7.1 (phase 1): hand written map behind getCell.
// H-08 swaps it for generated chunks without touching the callers.

// 15 by 15 map from the demo, read as fixedMap[y][x]: 1 wall, 0 air
const fixedMap = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1],
  [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 1],
  [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const fixedMapWidth = fixedMap[0].length;
const fixedMapHeight = fixedMap.length;

// TDD 5.2: getCell answers any coordinate; outside the map everything is wall.
// x and y are cell integers: callers convert world positions with Math.floor.
function getCell(x, y) {
  const isInsideMap = x >= 0 && x < fixedMapWidth && y >= 0 && y < fixedMapHeight;
  if (!isInsideMap) {
    return 1;
  }
  return fixedMap[y][x];
}
