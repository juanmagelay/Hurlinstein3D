// TDD 3.2: the camera is six numbers. dir has length 1 and plane is perpendicular
// to dir with length 0.66, which gives a field of view of about 66 degrees.

// TDD 5.2: spawn at the center of the generated room in chunk (0, 0).
// y grows downward on the map, so facing east (+x) the right hand side is +y:
// plane points there and the image is not mirrored.
const playerMaxHealth = 100;
const spawnPosition = getSpawnPosition();
const player = {
  posX: spawnPosition.x,
  posY: spawnPosition.y,
  dirX: 1,
  dirY: 0,
  planeX: 0,
  planeY: 0.66,
  health: playerMaxHealth,
  maxHealth: playerMaxHealth,
};

// D-06b: health never goes below zero, and zero health means defeat.
function damagePlayer(player, amount) {
  player.health = Math.max(0, player.health - amount);
}

function isPlayerDefeated(player) {
  return player.health <= 0;
}

// TDD 6.6: only the four controls from TDD 2.2 affect the player
const movementKeys = new Set(["w", "a", "s", "d"]);

function createKeyboardInput(target) {
  const pressedKeys = new Set();

  target.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (movementKeys.has(key)) {
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
    if (event.key === " " && !event.repeat) {
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

// TDD 6.6: rotate the camera, move along dir and slide along walls by axis
function updatePlayer(player, pressedKeys, deltaTime) {
  const turn = Number(pressedKeys.has("d")) - Number(pressedKeys.has("a"));
  const rotation = turn * rotationSpeed * deltaTime;

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

  const nextMapX = Math.floor(player.posX + moveX);
  const currentMapY = Math.floor(player.posY);
  if (getCell(nextMapX, currentMapY) === 0) {
    player.posX += moveX;
  }

  const currentMapX = Math.floor(player.posX);
  const nextMapY = Math.floor(player.posY + moveY);
  if (getCell(currentMapX, nextMapY) === 0) {
    player.posY += moveY;
  }
}
