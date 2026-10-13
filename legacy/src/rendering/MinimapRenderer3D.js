import { Draw } from './Draw.js';
import { castRayDDA } from '../raycast/DDA.js';

export class MinimapRenderer3D {
    draw(ctx, player, map, cellSize, ox, oy, width, height, controls, lights = []) {
      const showGrid = controls?.showGrid !== false;
      const showRays = controls?.showRays !== false;
      const mapW = map[0].length;
      const mapH = map.length;
      const cellW = width / mapW;
      const cellH = height / mapH;

      Draw.fillRect(ctx, ox, oy, width, height, 0x0d1117);

      for (let row = 0; row < mapH; row++) {
        for (let col = 0; col < mapW; col++) {
          if (map[row][col] === 1) {
            Draw.fillRect(ctx, ox + col * cellW, oy + row * cellH, cellW, cellH, 0x2c4a7c);
          }
        }
      }

      if (showGrid) {
        for (let col = 0; col <= mapW; col++) {
          Draw.line(ctx, ox + col * cellW, oy, ox + col * cellW, oy + height, { color: 0x1a2d44, width: 0.5 });
        }
        for (let row = 0; row <= mapH; row++) {
          Draw.line(ctx, ox, oy + row * cellH, ox + width, oy + row * cellH, { color: 0x1a2d44, width: 0.5 });
        }
      }

      const dirX = Math.cos(player.angle);
      const dirY = Math.sin(player.angle);
      const px = ox + (player.position.x / cellSize) * cellW;
      const py = oy + (player.position.y / cellSize) * cellH;

      if (showRays) {
        const fov = (controls?.fov ?? 60) * Math.PI / 180;
        const planeLen = Math.tan(fov / 2);
        const planeX = -dirY * planeLen;
        const planeY = dirX * planeLen;

        for (let col = 0; col < width; col += 3) {
          const cameraX = 2 * col / width - 1;
          const rayDirX = dirX + planeX * cameraX;
          const rayDirY = dirY + planeY * cameraX;
          const hit = castRayDDA(player.position, rayDirX, rayDirY, map, cellSize);

          if (hit) {
            const hx = ox + (hit.hitX / cellSize) * cellW;
            const hy = oy + (hit.hitY / cellSize) * cellH;
            Draw.line(ctx, px, py, hx, hy, { color: 0xffc857, width: 0.5, alpha: 0.25 });
          } else {
            const rayLen = 40;
            Draw.line(ctx, px, py, px + rayDirX * rayLen, py + rayDirY * rayLen, { color: 0xffc857, width: 0.5, alpha: 0.15 });
          }
        }
      }

      for (const light of lights) {
        const lightX = ox + (light.x / cellSize) * cellW;
        const lightY = oy + (light.y / cellSize) * cellH;
        Draw.circle(ctx, lightX, lightY, 5, 0xffdf5d, { color: 0xffffff, width: 1 });
      }

      const fov = (controls?.fov ?? 60) * Math.PI / 180;
      const coneLen = 60;
      Draw.line(ctx, px, py, px + Math.cos(player.angle - fov / 2) * coneLen, py + Math.sin(player.angle - fov / 2) * coneLen, { color: 0x4de1bd, width: 1, alpha: 0.5 });
      Draw.line(ctx, px, py, px + Math.cos(player.angle) * coneLen, py + Math.sin(player.angle) * coneLen, { color: 0x4de1bd, width: 1, alpha: 0.7 });
      Draw.line(ctx, px, py, px + Math.cos(player.angle + fov / 2) * coneLen, py + Math.sin(player.angle + fov / 2) * coneLen, { color: 0x4de1bd, width: 1, alpha: 0.5 });

      Draw.circle(ctx, px, py, 4, 0x4de1bd, { color: 0xffffff, width: 1 });
    }
  }
