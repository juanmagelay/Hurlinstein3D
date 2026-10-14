// TDD 3.4 and 6.5: ceiling and floor drawn once, wall strips drawn every frame.

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

  const side0Strips = [];
  const side1Strips = [];
  const missedStrips = [];

  for (let x = 0; x < screenWidth; x += stripWidth) {
    const ray = castRayForColumn(player, x);
    if (!ray.hit) {
      // TDD 5.2: nothing within maxRayDistance. The background color takes the
      // place a wall at maxRayDistance would have, so it reads as darkness.
      missedStrips.push(getWallStrip(x, maxRayDistance));
    } else if (ray.side === 0) {
      side0Strips.push(getWallStrip(x, ray.perpWallDist));
    } else {
      side1Strips.push(getWallStrip(x, ray.perpWallDist));
    }
  }

  fillStrips(graphics, side0Strips, wallColorSide0);
  fillStrips(graphics, side1Strips, wallColorSide1);
  fillStrips(graphics, missedStrips, backgroundColor);
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
