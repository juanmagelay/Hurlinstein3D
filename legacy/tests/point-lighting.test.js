import { describe, expect, it } from 'vitest';
import { pointLightFactor } from '../src/rendering/PointLighting.js';

describe('pointLightFactor', () => {
  it('attenuates visible lights by distance', () => {
    const hit = { hitX: 0, hitY: 5, normal: { x: 1, y: 0 } };
    const lights = [{ x: 50, y: 5, radius: 100, intensity: 0.8 }];
    expect(pointLightFactor(hit, lights, [[0, 0], [0, 0]], 10)).toBeCloseTo(0.62);
  });

  it('does not add light blocked by an occupied cell', () => {
    const hit = { hitX: 0, hitY: 5, normal: { x: 1, y: 0 } };
    const lights = [{ x: 25, y: 5, radius: 100, intensity: 0.8 }];
    expect(pointLightFactor(hit, lights, [[0, 1, 0]], 10)).toBeCloseTo(0.22);
  });

  it('clamps accumulated light to one', () => {
    const hit = { hitX: 0, hitY: 5, normal: { x: 1, y: 0 } };
    const lights = [
      { x: 1, y: 5, radius: 100, intensity: 1 },
      { x: 2, y: 5, radius: 100, intensity: 1 },
    ];
    expect(pointLightFactor(hit, lights, [[0, 0]], 10)).toBe(1);
  });
});
