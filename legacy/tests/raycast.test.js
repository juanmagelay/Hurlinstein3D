import { describe, expect, it } from 'vitest';
import { raycast } from '../src/raycast/Raycast.js';

const box = { id: 7, position: { x: 10, y: 10 }, width: 20, height: 20 };

describe('raycast', () => {
  it('returns the closest hit, point and surface normal', () => {
    const hit = raycast({ x: 0, y: 20 }, { x: 1, y: 0 }, 100, [box]);
    expect(hit?.distance).toBe(10);
    expect(hit?.point).toEqual({ x: 10, y: 20 });
    expect(hit?.normal).toEqual({ x: -1, y: 0 });
  });

  it('ignores rectangles outside the maximum distance', () => {
    expect(raycast({ x: 0, y: 20 }, { x: 1, y: 0 }, 9, [box])).toBeNull();
  });

  it('handles parallel rays and origins inside a rectangle', () => {
    expect(raycast({ x: 0, y: 0 }, { x: 0, y: 1 }, 100, [box])).toBeNull();
    const hit = raycast({ x: 15, y: 15 }, { x: 1, y: 0 }, 100, [box]);
    expect(hit?.distance).toBe(15);
    expect(hit?.normal).toEqual({ x: -1, y: 0 });
  });
});
