// TDD 6.7: a fixed-size top-down window over the player's current cell
const minimapCellsPerSide = 21;
const minimapCellSize = 10;
const minimapX = 10;
const minimapY = 10;
const minimapBackgroundColor = 0x0d1117;
const minimapWallColor = 0x2c4a7c;
const minimapPlayerColor = 0x4de1bd;

function getEnemyMinimapMarker(enemy, firstMapX, firstMapY) {
  const markerSize = minimapCellSize * enemy.width;
  const centerX = minimapX + (enemy.posX - firstMapX) * minimapCellSize;
  const centerY = minimapY + (enemy.posY - firstMapY) * minimapCellSize;
  return {
    x: centerX - markerSize / 2,
    y: centerY - markerSize / 2,
    width: markerSize,
    height: markerSize,
  };
}

function drawMinimap(graphics, player) {
  graphics.clear();
  graphics.rect(
    minimapX,
    minimapY,
    minimapCellsPerSide * minimapCellSize,
    minimapCellsPerSide * minimapCellSize,
  ).fill(minimapBackgroundColor);

  const firstMapX = Math.floor(player.posX) - Math.floor(minimapCellsPerSide / 2);
  const firstMapY = Math.floor(player.posY) - Math.floor(minimapCellsPerSide / 2);

  const enemyMarkers = [];
  for (let y = 0; y < minimapCellsPerSide; y += 1) {
    for (let x = 0; x < minimapCellsPerSide; x += 1) {
      const mapX = firstMapX + x;
      const mapY = firstMapY + y;
      if (getCell(mapX, mapY) === 1) {
        graphics.rect(
          minimapX + x * minimapCellSize,
          minimapY + y * minimapCellSize,
          minimapCellSize,
          minimapCellSize,
        );
      }
      for (const enemy of getEnemiesAtCell(mapX, mapY)) {
        enemyMarkers.push(getEnemyMinimapMarker(enemy, firstMapX, firstMapY));
      }
    }
  }
  graphics.fill(minimapWallColor);

  for (const marker of enemyMarkers) {
    graphics.rect(marker.x, marker.y, marker.width, marker.height);
  }
  if (enemyMarkers.length > 0) {
    graphics.fill(enemyColor);
  }

  const playerX = minimapX + (player.posX - firstMapX) * minimapCellSize;
  const playerY = minimapY + (player.posY - firstMapY) * minimapCellSize;
  const directionLength = minimapCellSize * 2;

  graphics
    .moveTo(playerX, playerY)
    .lineTo(
      playerX + player.dirX * directionLength,
      playerY + player.dirY * directionLength,
    )
    .stroke({ color: minimapPlayerColor, width: 2 });
  graphics.circle(playerX, playerY, 3).fill(minimapPlayerColor);
}
