import { describe, expect, it } from 'vitest';
import { castRayDDA } from '../src/raycast/DDA.js';

describe('castRayDDA', () => {
  it('finds the nearest occupied cell and its face', () => {
    const map = [
      [0, 0, 0],
      [0, 0, 1],
      [0, 0, 0],
    ];
    const hit = castRayDDA({ x: 5, y: 15 }, 1, 0, map, 10);

    expect(hit?.mapX).toBe(2);
    expect(hit?.mapY).toBe(1);
    expect(hit?.hitX).toBe(20);
    expect(hit?.distance).toBe(15);
    expect(hit?.normal).toEqual({ x: -1, y: 0 });
  });

  it('returns null when the ray exits the map without hitting a wall', () => {
    expect(castRayDDA({ x: 5, y: 5 }, 1, 0, [[0, 0], [0, 0]], 10)).toBeNull();
  });
});
