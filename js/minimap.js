// TDD 6.7: a fixed-size top-down window over the player's current cell
const minimapCellsPerSide = 21;
const minimapCellSize = 10;
const minimapX = 10;
const minimapY = 10;
const minimapBackgroundColor = 0x0d1117;
const minimapWallColor = 0x2c4a7c;
const minimapPlayerColor = 0x4de1bd;

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

  for (let y = 0; y < minimapCellsPerSide; y += 1) {
    for (let x = 0; x < minimapCellsPerSide; x += 1) {
      if (getCell(firstMapX + x, firstMapY + y) === 1) {
        graphics.rect(
          minimapX + x * minimapCellSize,
          minimapY + y * minimapCellSize,
          minimapCellSize,
          minimapCellSize,
        );
      }
    }
  }
  graphics.fill(minimapWallColor);

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
