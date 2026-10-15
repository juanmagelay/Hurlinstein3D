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

// D-10: the lit color. The light factor (ambient plus every light in range)
// takes the place of the distance bands, and the side face stays darker.
function getLitWallColor(mapX, mapY, side, lightFactor) {
  const faceBrightness = side === 1 ? side1Brightness : 1;
  return shadeColor(getChunkWallColor(mapX, mapY), faceBrightness * lightFactor);
}

// D-10: where the ray met the wall, in world cells, and the face normal. The
// DDA can be read as a ray of parameter perpWallDist, because dir is unit and
// plane is perpendicular, so the hit is pos + perpWallDist * rayDir.
function getWallHitPoint(player, stripX, ray) {
  const cameraX = 2 * stripX / screenWidth - 1;
  const rayDirX = player.dirX + player.planeX * cameraX;
  const rayDirY = player.dirY + player.planeY * cameraX;

  const hitX = player.posX + ray.perpWallDist * rayDirX;
  const hitY = player.posY + ray.perpWallDist * rayDirY;

  // The normal points out of the wall, toward the side the ray came from
  let normalX = 0;
  let normalY = 0;
  if (ray.side === 0) {
    normalX = rayDirX > 0 ? -1 : 1;
  } else {
    normalY = rayDirY > 0 ? -1 : 1;
  }
  return { x: hitX, y: hitY, normalX, normalY };
}

// D-10 (Lode-style point light): start at the ambient floor, then for every
// light in range that faces the wall, add intensity * (1 - distance / radius)
// unless a wall blocks the way. The shadow ray reuses the DDA.
function getWallLight(hitX, hitY, normalX, normalY, lights) {
  let illumination = ambientLight;

  for (const light of lights) {
    const dx = light.x - hitX;
    const dy = light.y - hitY;
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared <= 0 || distanceSquared >= light.radius * light.radius) {
      continue;
    }
    // The light must sit on the open side of the wall
    if (dx * normalX + dy * normalY <= 0) {
      continue;
    }

    const distance = Math.sqrt(distanceSquared);
    const directionX = dx / distance;
    const directionY = dy / distance;
    const shadow = castRay(
      hitX + directionX * shadowRayEpsilon,
      hitY + directionY * shadowRayEpsilon,
      directionX,
      directionY
    );
    if (shadow.hit && shadow.perpWallDist < distance - shadowRayEpsilon) {
      continue;
    }

    illumination += light.intensity * (1 - distance / light.radius);
  }

  return Math.min(1, illumination);
}

// D-10: color of one wall strip, lit or distance-shaded depending on the flag.
function getWallStripColor(player, stripX, ray) {
  if (!useLighting) {
    return getWallColor(ray.mapX, ray.mapY, ray.side, ray.perpWallDist);
  }

  const hit = getWallHitPoint(player, stripX, ray);
  const lights = getLightsAtCell(ray.mapX, ray.mapY);
  const lightFactor = getWallLight(hit.x, hit.y, hit.normalX, hit.normalY, lights);
  return getLitWallColor(ray.mapX, ray.mapY, ray.side, lightFactor);
}

// TDD 6.4 and 6.5: runs once, outside the ticker. Ceiling above the horizon,
// floor below it.
function drawCeilingAndFloor(graphics) {
  const horizonY = screenHeight / 2;
  graphics.rect(0, 0, screenWidth, horizonY).fill(ceilingColor);
  graphics.rect(0, horizonY, screenWidth, screenHeight - horizonY).fill(floorColor);
}

// D-09: a procedural masonry texture on a hidden canvas. It is grayscale, so
// the chunk color and the shading tint it through the sprite tint.
function createWallTextureCanvas() {
  const brickWidth = 16;
  const brickHeight = 8;
  const mortar = 2;

  const canvas = document.createElement("canvas");
  canvas.width = wallTextureSize;
  canvas.height = wallTextureSize;
  const context = canvas.getContext("2d");

  // The mortar fills the gaps left between the bricks
  context.fillStyle = "rgb(70,70,70)";
  context.fillRect(0, 0, wallTextureSize, wallTextureSize);

  const rows = wallTextureSize / brickHeight;
  const columns = wallTextureSize / brickWidth;
  for (let row = 0; row < rows; row++) {
    // Every other row is nudged half a brick, like a real bond
    const rowOffset = (row % 2) * (brickWidth / 2);
    for (let column = -1; column <= columns; column++) {
      const x = column * brickWidth + rowOffset;
      const y = row * brickHeight;
      // Deterministic shade per brick, so the same wall looks the same every run
      const shade = 190 + ((row * 31 + column * 17) % 45);
      context.fillStyle = `rgb(${shade},${shade},${shade})`;
      context.fillRect(x + mortar / 2, y + mortar / 2, brickWidth - mortar, brickHeight - mortar);
    }
  }

  return canvas;
}

// D-09: one texture per texture column, sliced out of the hidden canvas so a
// strip sprite can show the right column without redrawing the wall.
let wallTextureColumns = null;

function initWallTextures() {
  if (wallTextureColumns) {
    return;
  }

  const canvas = createWallTextureCanvas();
  wallTextureColumns = [];
  for (let x = 0; x < wallTextureSize; x++) {
    const column = document.createElement("canvas");
    column.width = 1;
    column.height = wallTextureSize;
    column.getContext("2d").drawImage(canvas, x, 0, 1, wallTextureSize, 0, 0, 1, wallTextureSize);
    const texture = PIXI.Texture.from(column);
    texture.source.scaleMode = "nearest";
    wallTextureColumns.push(texture);
  }
}

// D-09 (Lode part 2): one pre-created sprite per strip, reused every frame
// (TDD 6.4). Two objects instead of 640 makes the reuse explicit.
function createWallStripSprites() {
  const container = new PIXI.Container();
  const sprites = [];
  for (let index = 0; index < wallStripCount; index++) {
    const sprite = new PIXI.Sprite();
    sprite.visible = false;
    container.addChild(sprite);
    sprites.push(sprite);
  }
  return { container, sprites };
}

// D-09 (Lode part 2): where along the wall face the ray landed, in [0, 1).
// side 0 (a vertical line) uses the Y offset, side 1 the X offset. The flip
// keeps the texture readable while walking around the wall.
function getWallTextureX(player, stripX, ray) {
  const cameraX = 2 * stripX / screenWidth - 1;
  const rayDirX = player.dirX + player.planeX * cameraX;
  const rayDirY = player.dirY + player.planeY * cameraX;

  let wallX;
  if (ray.side === 0) {
    wallX = player.posY + ray.perpWallDist * rayDirY;
  } else {
    wallX = player.posX + ray.perpWallDist * rayDirX;
  }
  wallX -= Math.floor(wallX);

  if (ray.side === 0 && rayDirX > 0) {
    wallX = 1 - wallX;
  }
  if (ray.side === 1 && rayDirY < 0) {
    wallX = 1 - wallX;
  }

  let texX = Math.floor(wallX * wallTextureSize);
  if (texX < 0) {
    texX = 0;
  }
  if (texX >= wallTextureSize) {
    texX = wallTextureSize - 1;
  }
  return texX;
}

// TDD 6.5: runs every frame. Casts one ray per strip, from the strip's left
// column (so column screenWidth / 2 is still cameraX 0), and sorts the strips
// into side 0 walls, side 1 walls and rays that hit nothing. Each group is
// painted with a single fill(). With useWallTextures the sprites replace this
// path, but missed strips still use the background fill.
function drawWalls(graphics, player, wallStrips) {
  graphics.clear();

  if (useWallTextures && wallStrips) {
    drawTexturedWalls(graphics, player, wallStrips);
    return;
  }

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
      const color = getWallStripColor(player, x, ray);
      addStripToColorGroup(stripsByColor, color, getWallStrip(x, ray.perpWallDist));
    }
  }

  fillStripColorGroups(graphics, stripsByColor);
  fillStrips(graphics, missedStrips, backgroundColor);
}

// D-09 (Lode part 2): the textured version of drawWalls. Each strip sprite is
// stretched to the wall height and tinted with the same color the flat mode
// uses, so chunk color and shading still apply. The sprite keeps its unclipped
// height and lets the canvas edge do the clipping, which keeps the texture
// aligned when a wall is bigger than the screen.
function drawTexturedWalls(graphics, player, wallStrips) {
  const missedStrips = [];

  for (let index = 0; index < wallStripCount; index++) {
    const x = index * stripWidth;
    const sprite = wallStrips.sprites[index];
    const ray = castRayForColumn(player, x);
    if (!ray.hit) {
      wallDepthBuffer[index] = maxRayDistance;
      sprite.visible = false;
      missedStrips.push(getWallStrip(x, maxRayDistance));
      continue;
    }

    wallDepthBuffer[index] = ray.perpWallDist;
    const lineHeight = Math.min(screenHeight / ray.perpWallDist, wallSpriteMaxHeight);
    sprite.texture = wallTextureColumns[getWallTextureX(player, x, ray)];
    sprite.position.set(x, screenHeight / 2 - lineHeight / 2);
    sprite.width = stripWidth;
    sprite.height = lineHeight;
    sprite.tint = getWallStripColor(player, x, ray);
    sprite.visible = true;
  }

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
