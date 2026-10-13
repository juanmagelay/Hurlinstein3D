export function castRayDDA(playerPos, rayDirX, rayDirY, map, cellSize) {
    const mapW = map[0].length;
    const mapH = map.length;

    let mapX = Math.floor(playerPos.x / cellSize);
    let mapY = Math.floor(playerPos.y / cellSize);

    const deltaDistX = Math.abs(1 / rayDirX);
    const deltaDistY = Math.abs(1 / rayDirY);

    let stepX, stepY;
    let sideDistX, sideDistY;

    if (rayDirX < 0) {
      stepX = -1;
      sideDistX = (playerPos.x / cellSize - mapX) * deltaDistX;
    } else {
      stepX = 1;
      sideDistX = (mapX + 1 - playerPos.x / cellSize) * deltaDistX;
    }

    if (rayDirY < 0) {
      stepY = -1;
      sideDistY = (playerPos.y / cellSize - mapY) * deltaDistY;
    } else {
      stepY = 1;
      sideDistY = (mapY + 1 - playerPos.y / cellSize) * deltaDistY;
    }

    let hit = false;
    let side = 0;

    while (!hit) {
      if (sideDistX < sideDistY) {
        sideDistX += deltaDistX;
        mapX += stepX;
        side = 0;
      } else {
        sideDistY += deltaDistY;
        mapY += stepY;
        side = 1;
      }
      if (mapX < 0 || mapX >= mapW || mapY < 0 || mapY >= mapH) break;
      if (map[mapY][mapX] === 1) hit = true;
    }

    if (!hit) return null;

    let perpWallDist;
    if (side === 0) {
      perpWallDist = (mapX - playerPos.x / cellSize + (1 - stepX) / 2) / rayDirX;
    } else {
      perpWallDist = (mapY - playerPos.y / cellSize + (1 - stepY) / 2) / rayDirY;
    }

    const euclideanDist = perpWallDist * cellSize;

    let normal;
    if (side === 0) {
      normal = stepX > 0 ? { x: -1, y: 0 } : { x: 1, y: 0 };
    } else {
      normal = stepY > 0 ? { x: 0, y: -1 } : { x: 0, y: 1 };
    }

    let hitX, hitY;
    if (side === 0) {
      hitX = mapX * cellSize + (stepX < 0 ? cellSize : 0);
      hitY = playerPos.y + ((hitX - playerPos.x) * rayDirY / rayDirX);
    } else {
      hitY = mapY * cellSize + (stepY < 0 ? cellSize : 0);
      hitX = playerPos.x + ((hitY - playerPos.y) * rayDirX / rayDirY);
    }

    return { distance: euclideanDist, perpDist: perpWallDist * cellSize, side, normal, mapX, mapY, hitX, hitY };
}
