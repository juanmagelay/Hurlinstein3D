import { castRayDDA } from '../raycast/DDA.js';
import { Draw } from './Draw.js';
import { multiplyColor, pointLightFactor } from './PointLighting.js';

const COLUMN_OVERLAP = 0.5;

export class RaycasterRenderer3D {
  draw(ctx, player, map, cellSize, ox, oy, width, height, controls, lights = []) {
    const fov = (controls?.fov ?? 60) * Math.PI / 180;
    const shadeWalls = controls?.shadeWalls !== false;
    const halfHeight = height / 2;

    const dirX = Math.cos(player.angle);
    const dirY = Math.sin(player.angle);
    const planeLength = Math.tan(fov / 2);
    const planeX = -dirY * planeLength;
    const planeY = dirX * planeLength;

    Draw.fillRect(ctx, ox, oy, width, halfHeight, 0x1a1a2e);
    Draw.fillRect(ctx, ox, oy + halfHeight, width, halfHeight, 0x2d2d44);

    for (let col = 0; col < width; col++) {
      const cameraX = 2 * col / width - 1;
      const rayDirX = dirX + planeX * cameraX;
      const rayDirY = dirY + planeY * cameraX;
      const hit = castRayDDA(player.position, rayDirX, rayDirY, map, cellSize);

      const perpDist = hit ? hit.perpDist / cellSize : 100;
      const wallHeight = perpDist > 0 ? height / perpDist : height;
      const wallTop = oy + halfHeight - wallHeight / 2;

      let color = 0x5a6e8a;
      if (hit) {
        if (hit.side === 0) {
          color = rayDirX > 0 ? 0x3b5998 : 0x2c4a7c;
        } else {
          color = rayDirY > 0 ? 0x4a6fa5 : 0x3a5f95;
        }

        if (shadeWalls) {
          const shade = Math.max(0.3, 1 - hit.distance / (100 * cellSize));
          color = multiplyColor(color, shade);
        }
        color = multiplyColor(color, pointLightFactor(hit, lights, map, cellSize));
      }

      const columnWidth = col + 1 < width ? 1 + COLUMN_OVERLAP : 1;
      Draw.fillRect(ctx, ox + col, wallTop, columnWidth, wallHeight, color);
    }
  }
}
