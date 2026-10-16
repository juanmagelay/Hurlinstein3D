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
// of contact costs contactDamagePerSecond.
const contactDistance = 0.6;
const contactDamagePerSecond = 10;

function getContactDamage(player, deltaTime) {
  let damage = 0;
  for (const enemies of enemiesByChunk.values()) {
    for (const enemy of enemies) {
      if (Math.hypot(enemy.posX - player.posX, enemy.posY - player.posY) < contactDistance) {
        damage += contactDamagePerSecond * deltaTime / ticksPerSecond;
      }
    }
  }
  return damage;
}

// D-05a and D-05b: idle waits, patrol walks a route and scans for the player,
// chase follows the player until it loses sight for a full second.
function updateEnemies(player, deltaTime) {
  for (const enemies of enemiesByChunk.values()) {
    for (const enemy of enemies) {
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

// D-07a: the center ray reuses the render DDA. Since dir has length 1,
// perpWallDist is the true distance to the wall along the ray. An enemy is hit
// when it is ahead of the player, within its half-width of the ray and nearer
// than the wall, so walls block the shot. One hit removes the enemy.
function shootCenterRay(player) {
  const ray = castRay(player.posX, player.posY, player.dirX, player.dirY);
  const wallDistance = ray.hit ? ray.perpWallDist : Infinity;

  let target = null;
  let targetDistance = Infinity;
  for (const enemies of enemiesByChunk.values()) {
    for (const enemy of enemies) {
      const offsetX = enemy.posX - player.posX;
      const offsetY = enemy.posY - player.posY;
      const along = offsetX * player.dirX + offsetY * player.dirY;
      if (along <= 0 || along >= wallDistance || along >= targetDistance) {
        continue;
      }
      const lateral = Math.hypot(
        offsetX - along * player.dirX,
        offsetY - along * player.dirY,
      );
      if (lateral <= enemy.width / 2) {
        target = enemy;
        targetDistance = along;
      }
    }
  }

  if (target !== null) {
    removeEnemy(target);
  }
  return target;
}

function removeEnemy(enemy) {
  removeEnemyFromCell(enemy);
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
