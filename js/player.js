// TDD 3.2: the camera is six numbers. dir has length 1 and plane is perpendicular
// to dir. The field of view is implicit, 2 * atan(|plane|), and never stored.

// TDD 6.6: the camera keeps a small radius, so it never sits flush against a
// wall face and does not clip a corner. Under 0.5, so a one-cell door still fits.
const playerRadius = 0.2;
// Seconds (D-08c). D-08d: the ten reload frames share it, about 0.096 s each.
const reloadDuration = 0.96;

// TDD 5.2: spawn at the center of the generated room in chunk (0, 0).
// y grows downward on the map, so facing east (+x) the right hand side is +y:
// plane points there and the image is not mirrored.
// TDD 2.3.1 / D-16c1: health is in hit points, and the magazine and the reload
// allowance come from the admin settings (js/settings.js).
const spawnPosition = getSpawnPosition();
const player = {
  posX: spawnPosition.x,
  posY: spawnPosition.y,
  dirX: 1,
  dirY: 0,
  planeX: 0,
  planeY: getCameraPlaneLength(),
  health: gameSettings.playerHitPoints,
  maxHealth: gameSettings.playerHitPoints,
  ammo: gameSettings.magazineSize,
  reloadsLeft: getReloadAllowance(gameSettings),
  reloading: false,
  reloadTime: 0,
};

// H-10c / TDD 3.2: a wall is drawn screenHeight / perpWallDist pixels tall, so
// one cell across must also cover screenHeight / perpWallDist pixels for a wall
// face to look square. A cell spans screenWidth / (2 * |plane|) pixels across, so
// |plane| = screenWidth / screenHeight / 2. On a 4:3 screen that is Lode's 0.66
// (about 67 degrees); a wider screen sees more to the sides (83 degrees at 16:9)
// with the same vertical view. One division, only when the canvas size changes.
function getCameraPlaneLength() {
  return screenWidth / screenHeight / 2;
}

// Keeps plane perpendicular to dir, turned right (x' = -y, y' = x), with a new length
function setCameraPlaneLength(player, length) {
  player.planeX = -player.dirY * length;
  player.planeY = player.dirX * length;
}

// D-06b: health never goes below zero, and zero health means defeat.
// D-16c1: god mode, from the admin panel, ignores every damage.
function damagePlayer(player, amount) {
  if (gameSettings.godMode) {
    return;
  }
  player.health = Math.max(0, player.health - amount);
}

function isPlayerDefeated(player) {
  return player.health <= 0;
}

// D-08: firing spends one round and is blocked while reloading or empty
function canFireShot(player) {
  return !player.reloading && player.ammo > 0;
}

function tryFire(player) {
  if (!canFireShot(player)) {
    return false;
  }
  player.ammo -= 1;
  return true;
}

// D-08: reload only tops up an incomplete magazine. D-16c1: it spends one
// reload of the allowance, which is Infinity unless the admin panel limits it.
function startReload(player) {
  if (player.reloading || player.ammo >= gameSettings.magazineSize || player.reloadsLeft <= 0) {
    return false;
  }
  player.reloadsLeft -= 1;
  player.reloading = true;
  player.reloadTime = 0;
  return true;
}

// Returns true on the frame the reload finishes
function updateReload(player, deltaTime) {
  if (!player.reloading) {
    return false;
  }
  player.reloadTime += deltaTime / 60;
  if (player.reloadTime < reloadDuration) {
    return false;
  }
  player.reloading = false;
  player.reloadTime = 0;
  player.ammo = gameSettings.magazineSize;
  return true;
}

// D-16c1: a new number of hit points restores full health with that maximum
function applyPlayerHitPoints(player, hitPoints) {
  player.maxHealth = hitPoints;
  player.health = hitPoints;
}

// D-16c1: a smaller magazine drops the extra rounds; a bigger one fills on the
// next reload
function applyMagazineSize(player, size) {
  player.ammo = Math.min(player.ammo, size);
}

function applyReloadAllowance(player, settings) {
  player.reloadsLeft = getReloadAllowance(settings);
}

// D-16c1: the admin panel's refill fills the magazine and the reload allowance
function refillAmmo(player, settings) {
  player.ammo = settings.magazineSize;
  applyReloadAllowance(player, settings);
}

// D-16c1: keys typed into an admin panel field never reach the game
function isTypingInField(event) {
  const target = event.target;
  if (!target || !target.tagName) {
    return false;
  }
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || Boolean(target.isContentEditable);
}

// TDD 6.6: only the four controls from TDD 2.2 affect the player
const movementKeys = new Set(["w", "a", "s", "d"]);

function createKeyboardInput(target) {
  const pressedKeys = new Set();

  target.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (movementKeys.has(key) && !isTypingInField(event)) {
      pressedKeys.add(key);
    }
  });

  target.addEventListener("keyup", (event) => {
    pressedKeys.delete(event.key.toLowerCase());
  });

  return pressedKeys;
}

// D-07: firing is one shot per key press. The browser repeats keydown while a
// key is held, so event.repeat is ignored and consumeShot() drains one shot.
function createFireInput(target) {
  let pendingShot = false;
  target.addEventListener("keydown", (event) => {
    if (event.key === " " && !event.repeat && !isTypingInField(event)) {
      event.preventDefault();
      pendingShot = true;
    }
  });
  return {
    consumeShot() {
      if (!pendingShot) {
        return false;
      }
      pendingShot = false;
      return true;
    },
  };
}

// D-08: R reloads, one press at a time, ignoring the browser key repeat
function createReloadInput(target) {
  let pendingReload = false;
  target.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "r" && !event.repeat && !isTypingInField(event)) {
      pendingReload = true;
    }
  });
  return {
    consumeReload() {
      if (!pendingReload) {
        return false;
      }
      pendingReload = false;
      return true;
    },
  };
}

// TDD 6.6: rotate the camera, move along dir and slide along walls by axis.
// D-16c1: the turn speed is the admin setting, in degrees per second.
function updatePlayer(player, pressedKeys, deltaTime) {
  const turn = Number(pressedKeys.has("d")) - Number(pressedKeys.has("a"));
  const rotation = turn * getRotationPerTick(gameSettings.turnSpeed) * deltaTime;

  if (rotation !== 0) {
    const cosRotation = Math.cos(rotation);
    const sinRotation = Math.sin(rotation);
    const oldDirX = player.dirX;
    const oldDirY = player.dirY;
    const oldPlaneX = player.planeX;
    const oldPlaneY = player.planeY;

    player.dirX = oldDirX * cosRotation - oldDirY * sinRotation;
    player.dirY = oldDirX * sinRotation + oldDirY * cosRotation;
    player.planeX = oldPlaneX * cosRotation - oldPlaneY * sinRotation;
    player.planeY = oldPlaneX * sinRotation + oldPlaneY * cosRotation;
  }

  const moveDirection = Number(pressedKeys.has("w")) - Number(pressedKeys.has("s"));
  const moveX = player.dirX * moveDirection * moveSpeed * deltaTime;
  const moveY = player.dirY * moveDirection * moveSpeed * deltaTime;

  // Each axis moves on its own, so a blocked axis still lets the other slide.
  if (moveX !== 0 && canStandAt(player.posX + moveX, player.posY)) {
    player.posX += moveX;
  }
  if (moveY !== 0 && canStandAt(player.posX, player.posY + moveY)) {
    player.posY += moveY;
  }
}

// TDD 6.6: a position is free when the player's square footprint, side
// 2 * playerRadius, does not touch any wall cell. This is what keeps the camera
// a radius away from a wall and stops it from cutting a corner.
function canStandAt(posX, posY) {
  const minX = Math.floor(posX - playerRadius);
  const maxX = Math.floor(posX + playerRadius);
  const minY = Math.floor(posY - playerRadius);
  const maxY = Math.floor(posY + playerRadius);

  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      if (getCell(x, y) !== 0) {
        return false;
      }
    }
  }
  return true;
}
