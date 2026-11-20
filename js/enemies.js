// D-05: enemy state machine. States are idle, patrol and (D-05b) chase.
// Positions are in cells, like the player. Speeds are cells per 60 Hz ticker
// unit, so they are multiplied by ticker.deltaTime.

const ticksPerSecond = 60;
const enemyIdleSeconds = 2;
const enemyIdleTicks = enemyIdleSeconds * ticksPerSecond;
const enemyPatrolSpeed = 1 / ticksPerSecond;
const enemyChaseSpeed = 2 / ticksPerSecond;
const enemySightDistance = maxRayDistance;
const enemyLoseSightTicks = ticksPerSecond;
// TDD 6.6: the enemy keeps half its width away from walls, so its body never
// crosses a wall even when it cuts a corner
const enemyCollisionRadius = enemyWidth / 2;

// D-06b: an enemy touching the player deals damage every tick, so a full second
// of contact costs contactDamagePerSecond. TDD 2.3.1 / D-16c1: health is in hit
// points, so a second of contact takes one.
const contactDistance = 0.6;
const contactDamagePerSecond = 1;

// D-23 / TDD 3.6: only the chunks this close to the player's chunk are active.
// Two chunks (32 cells) cover maxRayDistance (24 cells) from anywhere in the
// player's chunk, so every enemy the player can see or touch is inside the
// 5 by 5 block. The rest stay frozen in place until the player comes back.
const activeChunkRadius = Math.ceil(maxRayDistance / chunkSize);

// D-23: the enemy lists to update and draw this frame, at most 25 lists read
// from the Map, so the cost does not grow with the explored world. With the
// admin toggle off it is every loaded chunk, as before D-23, to compare FPS.
function getActiveEnemyLists(player) {
  if (!gameSettings.activeAreaOnly) {
    return enemiesByChunk.values();
  }
  const playerChunkX = Math.floor(player.posX / chunkSize);
  const playerChunkY = Math.floor(player.posY / chunkSize);
  const lists = [];
  for (let cy = playerChunkY - activeChunkRadius; cy <= playerChunkY + activeChunkRadius; cy += 1) {
    for (let cx = playerChunkX - activeChunkRadius; cx <= playerChunkX + activeChunkRadius; cx += 1) {
      const enemies = enemiesByChunk.get(getChunkKey(cx, cy));
      if (enemies !== undefined) {
        lists.push(enemies);
      }
    }
  }
  return lists;
}

function getContactDamage(player, deltaTime) {
  let damage = 0;
  for (const enemies of getActiveEnemyLists(player)) {
    for (const enemy of enemies) {
      if (Math.hypot(enemy.posX - player.posX, enemy.posY - player.posY) < contactDistance) {
        damage += contactDamagePerSecond * deltaTime / ticksPerSecond;
      }
    }
  }
  return damage;
}

// D-23: only the active enemies move. An enemy that crossed into another chunk
// changes lists after the loop, so no list changes while it is being walked.
function updateEnemies(player, deltaTime) {
  const changedChunk = [];
  for (const enemies of getActiveEnemyLists(player)) {
    for (const enemy of enemies) {
      updateEnemyState(enemy, player, deltaTime);
      if (hasLeftItsChunk(enemy)) {
        changedChunk.push(enemy);
      }
    }
  }
  for (const enemy of changedChunk) {
    moveEnemyToItsChunk(enemy);
  }
}

// D-05a and D-05b: idle waits, patrol walks a route and scans for the player,
// chase follows the player until it loses sight for a full second.
function updateEnemyState(enemy, player, deltaTime) {
  if (enemy.state === "idle") {
    enemy.stateTime += deltaTime;
    if (enemy.stateTime >= enemyIdleTicks) {
      startPatrol(enemy);
    }
  } else if (enemy.state === "patrol") {
    updatePatrol(enemy, player, deltaTime);
  } else if (enemy.state === "chase") {
    updateChase(enemy, player, deltaTime);
  }
}

// D-05b: 360 degree line of sight. The ray direction points straight at the
// player, so the player sits at parameter 1 of the ray. A wall closer than that
// (perpWallDist < 1) blocks the view. Same DDA used for rendering and shooting.
function hasLineOfSight(enemy, player) {
  const rayDirX = player.posX - enemy.posX;
  const rayDirY = player.posY - enemy.posY;
  if (Math.hypot(rayDirX, rayDirY) > enemySightDistance) {
    return false;
  }
  const ray = castRay(enemy.posX, enemy.posY, rayDirX, rayDirY);
  return !ray.hit || ray.perpWallDist >= 1;
}

function updateChase(enemy, player, deltaTime) {
  if (hasLineOfSight(enemy, player)) {
    enemy.stateTime = 0;
    moveEnemyToward(enemy, { x: player.posX, y: player.posY }, enemyChaseSpeed * deltaTime);
    updateEnemyCell(enemy);
    return;
  }
  enemy.stateTime += deltaTime;
  if (enemy.stateTime >= enemyLoseSightTicks) {
    startPatrol(enemy);
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

function updatePatrol(enemy, player, deltaTime) {
  if (hasLineOfSight(enemy, player)) {
    enemy.state = "chase";
    enemy.stateTime = 0;
    return;
  }
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
  const moveX = offsetX / length * step;
  const moveY = offsetY / length * step;

  // Slide by axis against the walls, like the player, so the enemy never walks
  // into a wall it is chasing past
  if (canEnemyStandAt(enemy.posX + moveX, enemy.posY)) {
    enemy.posX += moveX;
  }
  if (canEnemyStandAt(enemy.posX, enemy.posY + moveY)) {
    enemy.posY += moveY;
  }
}

// TDD 6.6: a square footprint, side 2 * enemyCollisionRadius, must not touch a
// wall cell
function canEnemyStandAt(posX, posY) {
  const minX = Math.floor(posX - enemyCollisionRadius);
  const maxX = Math.floor(posX + enemyCollisionRadius);
  const minY = Math.floor(posY - enemyCollisionRadius);
  const maxY = Math.floor(posY + enemyCollisionRadius);

  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      if (getCell(x, y) !== 0) {
        return false;
      }
    }
  }
  return true;
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

// D-23: an enemy is listed in the chunk it stands in, so the active area finds
// an enemy that chased the player far from the chunk where it was created.
// Math.floor keeps negative chunks correct.
function hasLeftItsChunk(enemy) {
  const chunkX = Math.floor(enemy.cellX / chunkSize);
  const chunkY = Math.floor(enemy.cellY / chunkSize);
  return chunkX !== enemy.chunkX || chunkY !== enemy.chunkY;
}

function moveEnemyToItsChunk(enemy) {
  removeEnemyFromChunk(enemy);
  enemy.chunkX = Math.floor(enemy.cellX / chunkSize);
  enemy.chunkY = Math.floor(enemy.cellY / chunkSize);
  const chunkKey = getChunkKey(enemy.chunkX, enemy.chunkY);
  if (!enemiesByChunk.has(chunkKey)) {
    enemiesByChunk.set(chunkKey, []);
  }
  enemiesByChunk.get(chunkKey).push(enemy);
}

function removeEnemyFromChunk(enemy) {
  const chunkKey = getChunkKey(enemy.chunkX, enemy.chunkY);
  const list = enemiesByChunk.get(chunkKey);
  if (list === undefined) {
    return;
  }
  const index = list.indexOf(enemy);
  if (index !== -1) {
    list.splice(index, 1);
  }
}

// D-13b: a projectile that reaches an enemy removes it from its cell and its
// chunk. D-13d retired the instant center ray shot of D-07a that used to live here.
function removeEnemy(enemy) {
  removeEnemyFromCell(enemy);
  removeEnemyFromChunk(enemy);
}
