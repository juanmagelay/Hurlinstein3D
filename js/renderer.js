// TDD 3.4 and 6.5: ceiling and floor drawn once, wall strips drawn every frame.

// D-04c1: perpendicular wall depth per screen strip, kept after each draw so
// enemies (D-04c2) can be hidden behind walls. Missed strips use the max
// distance, the same depth their background strip is drawn at.
const wallStripCount = screenWidth / stripWidth;
const wallDepthBuffer = new Array(wallStripCount).fill(maxRayDistance);

function getWallDepthAtColumn(columnX) {
  return wallDepthBuffer[Math.floor(columnX / stripWidth)];
}

// TDD 3.4: a strip is the rect drawn for one ray, x is its left edge in pixels.
// A wall at perpWallDist is screenHeight / perpWallDist pixels tall (similar
// triangles), centered on the horizon and clipped to the screen.
// perpWallDist 0 gives Infinity, and the clip turns it into the full column.
function getWallStrip(x, perpWallDist) {
  const lineHeight = screenHeight / perpWallDist;
  const drawStart = Math.max(0, -lineHeight / 2 + screenHeight / 2);
  const drawEnd = Math.min(screenHeight, lineHeight / 2 + screenHeight / 2);
  return { x, lineHeight, drawStart, drawEnd };
}

// TDD 6.5: quantize perpendicular distance into four brightness bands
function getDistanceBand(perpWallDist) {
  const bandWidth = maxRayDistance / distanceBrightnessBands.length;
  const band = Math.floor(perpWallDist / bandWidth);
  return Math.min(Math.max(band, 0), distanceBrightnessBands.length - 1);
}

function getDistanceBrightness(perpWallDist) {
  return distanceBrightnessBands[getDistanceBand(perpWallDist)];
}

function shadeColor(color, brightness) {
  const red = Math.floor(((color >> 16) & 0xff) * brightness);
  const green = Math.floor(((color >> 8) & 0xff) * brightness);
  const blue = Math.floor((color & 0xff) * brightness);
  return (red << 16) | (green << 8) | blue;
}

// TDD 6.8 and D-02: chunk colors follow a stable palette index from Cantor key
function getChunkWallColor(mapX, mapY) {
  const cx = Math.floor(mapX / chunkSize);
  const cy = Math.floor(mapY / chunkSize);
  const paletteIndex = getChunkKey(cx, cy) % wallPalette.length;
  return wallPalette[paletteIndex];
}

function getWallColor(mapX, mapY, side, perpWallDist) {
  const faceBrightness = side === 1 ? side1Brightness : 1;
  const distanceBrightness = getDistanceBrightness(perpWallDist);
  return shadeColor(getChunkWallColor(mapX, mapY), faceBrightness * distanceBrightness);
}

// TDD 6.4 and 6.5: runs once, outside the ticker. Ceiling above the horizon,
// floor below it.
function drawCeilingAndFloor(graphics) {
  const horizonY = screenHeight / 2;
  graphics.rect(0, 0, screenWidth, horizonY).fill(ceilingColor);
  graphics.rect(0, horizonY, screenWidth, screenHeight - horizonY).fill(floorColor);
}

// TDD 6.5: runs every frame. Casts one ray per strip, from the strip's left
// column (so column screenWidth / 2 is still cameraX 0), and sorts the strips
// into side 0 walls, side 1 walls and rays that hit nothing. Each group is
// painted with a single fill().
function drawWalls(graphics, player) {
  graphics.clear();

  const stripsByColor = new Map();
  const missedStrips = [];

  for (let x = 0; x < screenWidth; x += stripWidth) {
    const ray = castRayForColumn(player, x);
    if (!ray.hit) {
      // TDD 5.2: nothing within maxRayDistance. The background color takes the
      // place a wall at maxRayDistance would have, so it reads as darkness.
      wallDepthBuffer[x / stripWidth] = maxRayDistance;
      missedStrips.push(getWallStrip(x, maxRayDistance));
    } else {
      wallDepthBuffer[x / stripWidth] = ray.perpWallDist;
      const color = getWallColor(ray.mapX, ray.mapY, ray.side, ray.perpWallDist);
      addStripToColorGroup(stripsByColor, color, getWallStrip(x, ray.perpWallDist));
    }
  }

  fillStripColorGroups(graphics, stripsByColor);
  fillStrips(graphics, missedStrips, backgroundColor);
}

function addStripToColorGroup(stripsByColor, color, strip) {
  if (!stripsByColor.has(color)) {
    stripsByColor.set(color, []);
  }
  stripsByColor.get(color).push(strip);
}

function fillStripColorGroups(graphics, stripsByColor) {
  for (const [color, strips] of stripsByColor) {
    fillStrips(graphics, strips, color);
  }
}

// Pixi v8 keeps adding rect() calls to one shape until fill() paints them all
// at once, so a whole group costs one fill()
function fillStrips(graphics, strips, color) {
  if (strips.length === 0) {
    return;
  }
  for (const strip of strips) {
    graphics.rect(strip.x, strip.drawStart, stripWidth, strip.drawEnd - strip.drawStart);
  }
  graphics.fill(color);
}

// D-04c2: the inverse of the camera matrix turns a world offset into camera
// space. depth is the distance along dir, transformX the sideways position on
// the camera plane (both in cells). Same model as Lode's sprite projection.
function getEnemyProjection(enemy, player) {
  const offsetX = enemy.posX - player.posX;
  const offsetY = enemy.posY - player.posY;
  const inverseDet = 1 / (player.planeX * player.dirY - player.dirX * player.planeY);
  const transformX = inverseDet * (player.dirY * offsetX - player.dirX * offsetY);
  const depth = inverseDet * (-player.planeY * offsetX + player.planeX * offsetY);
  return { transformX, depth };
}

// D-04c2: draw each enemy as a 0.5-cell square centered on the horizon. A strip
// only paints where the enemy is nearer than the wall depth (D-04c1) in that
// column, so walls hide enemies behind them.
function drawEnemies(graphics, player) {
  graphics.clear();

  const enemyStrips = [];
  for (const enemies of enemiesByChunk.values()) {
    for (const enemy of enemies) {
      const { transformX, depth } = getEnemyProjection(enemy, player);
      if (depth <= 0 || depth > maxRayDistance) {
        continue;
      }

      // Square on screen: one cell tall at this depth is screenHeight / depth.
      const size = screenHeight * enemy.size / depth;
      const screenX = (screenWidth / 2) * (1 + transformX / depth);
      const top = Math.max(0, screenHeight / 2 - size / 2);
      const bottom = Math.min(screenHeight, screenHeight / 2 + size / 2);
      if (bottom <= top) {
        continue;
      }

      const firstColumn = Math.max(0, screenX - size / 2);
      const lastColumn = Math.min(screenWidth - 1, screenX + size / 2);
      for (
        let x = Math.floor(firstColumn / stripWidth) * stripWidth;
        x <= lastColumn;
        x += stripWidth
      ) {
        if (depth < wallDepthBuffer[x / stripWidth]) {
          enemyStrips.push({ x, drawStart: top, drawEnd: bottom });
        }
      }
    }
  }

  fillStrips(graphics, enemyStrips, enemyColor);
}
