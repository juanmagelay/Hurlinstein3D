import { castRayDDA } from '../raycast/DDA.js';

const AMBIENT_LIGHT = 0.22;
const SHADOW_RAY_EPSILON = 0.5;

export function pointLightFactor(hit, lights, map, cellSize) {
  let illumination = AMBIENT_LIGHT;

  for (const light of lights) {
    const dx = light.x - hit.hitX;
    const dy = light.y - hit.hitY;
    const distance = Math.hypot(dx, dy);
    if (distance >= light.radius || distance <= 0) continue;
    if (dx * hit.normal.x + dy * hit.normal.y <= 0) continue;

    const directionX = dx / distance;
    const directionY = dy / distance;
    const shadowOrigin = {
      x: hit.hitX + directionX * SHADOW_RAY_EPSILON,
      y: hit.hitY + directionY * SHADOW_RAY_EPSILON,
    };
    const blocker = castRayDDA(shadowOrigin, directionX, directionY, map, cellSize);
    if (blocker && blocker.distance < distance - SHADOW_RAY_EPSILON) continue;

    illumination += light.intensity * (1 - distance / light.radius);
  }

  return Math.min(1, illumination);
}

export function multiplyColor(color, factor) {
  const red = Math.floor(((color >> 16) & 0xff) * factor);
  const green = Math.floor(((color >> 8) & 0xff) * factor);
  const blue = Math.floor((color & 0xff) * factor);
  return (red << 16) | (green << 8) | blue;
}
