import { describe, expect, it } from 'vitest';
import { circleCollidesWithWorld, resolveCircleAgainstWorld } from '../src/game/Collision.js';

describe('collision rules', () => {
  it('pushes a moving circle out of an obstacle and removes inward velocity', () => {
    const result = resolveCircleAgainstWorld(
      { x: 8, y: 15 },
      { x: 5, y: 0 },
      3,
      [{ position: { x: 10, y: 10 }, width: 10, height: 10 }],
      { width: 100, height: 100 },
    );

    expect(result.position).toEqual({ x: 7, y: 15 });
    expect(result.velocity).toEqual({ x: 0, y: 0 });
    expect(result.grounded).toBe(true);
  });

  it('detects obstacle and world-boundary collisions', () => {
    const obstacles = [{ position: { x: 10, y: 10 }, width: 10, height: 10 }];
    expect(circleCollidesWithWorld({ x: 9, y: 15 }, 2, obstacles, 100, 100)).toBe(true);
    expect(circleCollidesWithWorld({ x: 50, y: 50 }, 2, obstacles, 100, 100)).toBe(false);
    expect(circleCollidesWithWorld({ x: 1, y: 50 }, 2, obstacles, 100, 100)).toBe(true);
  });
});
