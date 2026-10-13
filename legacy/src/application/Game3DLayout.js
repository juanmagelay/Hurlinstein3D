export const MINIMAP_RATIO = 0.35;
export const VIEW_GAP = 2;

export function getGame3DLayout(width, showMinimap) {
  const minimapWidth = showMinimap ? Math.floor(width * MINIMAP_RATIO) : 0;
  const rayX = minimapWidth + VIEW_GAP;
  return { minimapWidth, rayX, rayWidth: width - rayX };
}

export function minimapPointToWorld(point, width, height, world) {
  const { minimapWidth } = getGame3DLayout(width, true);
  if (point.x < 0 || point.x >= minimapWidth || point.y < 0 || point.y >= height) return null;

  const x = (point.x / minimapWidth) * world.mapWidth * world.cellSize;
  const y = (point.y / height) * world.mapHeight * world.cellSize;
  const col = Math.floor(x / world.cellSize);
  const row = Math.floor(y / world.cellSize);
  if (world.getMap()[row]?.[col] !== 0) return null;

  return { x, y };
}
