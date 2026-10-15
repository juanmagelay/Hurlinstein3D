// D-05: enemy state machine. States are idle, patrol and (D-05b) chase.
// Positions are in cells, like the player. Speeds are cells per 60 Hz ticker
// unit, so they are multiplied by ticker.deltaTime.

const ticksPerSecond = 60;
const enemyIdleSeconds = 2;
const enemyIdleTicks = enemyIdleSeconds * ticksPerSecond;
const enemyPatrolSpeed = 1 / ticksPerSecond;

// D-05a: idle counts down, then the enemy patrols. Later states are handled by
// their own update functions.
function updateEnemies(deltaTime) {
  for (const enemies of enemiesByChunk.values()) {
    for (const enemy of enemies) {
      enemy.stateTime += deltaTime;
      if (enemy.state === "idle") {
        if (enemy.stateTime >= enemyIdleTicks) {
          startPatrol(enemy);
        }
      } else if (enemy.state === "patrol") {
        updatePatrol(enemy, deltaTime);
      }
    }
  }
}

// A patrol route is two air cell centers: the enemy's own cell and one random
// neighbour. With no open neighbour it stays idle instead of pacing a wall.
function startPatrol(enemy) {
  const neighbour = choosePatrolNeighbour(enemy);
  if (neighbour === null) {
    enemy.state = "idle";
    enemy.stateTime = 0;
    return;
  }
  enemy.patrolA = { x: enemy.cellX + 0.5, y: enemy.cellY + 0.5 };
  enemy.patrolB = neighbour;
  enemy.patrolTargetIsB = true;
  enemy.state = "patrol";
  enemy.stateTime = 0;
}

function choosePatrolNeighbour(enemy) {
  const options = [];
  const neighbours = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const [offsetX, offsetY] of neighbours) {
    if (getCell(enemy.cellX + offsetX, enemy.cellY + offsetY) === 0) {
      options.push({ x: enemy.cellX + offsetX + 0.5, y: enemy.cellY + offsetY + 0.5 });
    }
  }
  if (options.length === 0) {
    return null;
  }
  return options[Math.floor(Math.random() * options.length)];
}

function updatePatrol(enemy, deltaTime) {
  const target = enemy.patrolTargetIsB ? enemy.patrolB : enemy.patrolA;
  moveEnemyToward(enemy, target, enemyPatrolSpeed * deltaTime);
  updateEnemyCell(enemy);
  if (Math.abs(enemy.posX - target.x) < 0.001 && Math.abs(enemy.posY - target.y) < 0.001) {
    enemy.posX = target.x;
    enemy.posY = target.y;
    enemy.patrolTargetIsB = !enemy.patrolTargetIsB;
  }
}

function moveEnemyToward(enemy, target, distance) {
  const offsetX = target.x - enemy.posX;
  const offsetY = target.y - enemy.posY;
  const length = Math.hypot(offsetX, offsetY);
  if (length === 0) {
    return;
  }
  const step = Math.min(distance, length);
  enemy.posX += offsetX / length * step;
  enemy.posY += offsetY / length * step;
}

// D-05a: the per-cell registry (minimap, D-04b) follows the enemy as it crosses
// cell boundaries. Math.floor keeps negative cells correct.
function updateEnemyCell(enemy) {
  const cellX = Math.floor(enemy.posX);
  const cellY = Math.floor(enemy.posY);
  if (cellX === enemy.cellX && cellY === enemy.cellY) {
    return;
  }
  removeEnemyFromCell(enemy);
  enemy.cellX = cellX;
  enemy.cellY = cellY;
  registerEnemyAtCell(enemy);
}

function removeEnemyFromCell(enemy) {
  const cellKey = getChunkKey(enemy.cellX, enemy.cellY);
  const list = enemiesByCell.get(cellKey);
  if (list === undefined) {
    return;
  }
  const index = list.indexOf(enemy);
  if (index !== -1) {
    list.splice(index, 1);
  }
}
