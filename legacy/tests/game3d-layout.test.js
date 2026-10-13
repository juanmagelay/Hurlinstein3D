import { describe, expect, it } from 'vitest';
import { getGame3DLayout, minimapPointToWorld } from '../src/application/Game3DLayout.js';

const world = {
  mapWidth: 2,
  mapHeight: 2,
  cellSize: 10,
  getMap: () => [[0, 1], [0, 0]],
};

describe('Game3D minimap layout', () => {
  it('computes the same minimap and view split used by rendering', () => {
    expect(getGame3DLayout(200, true)).toEqual({ minimapWidth: 70, rayX: 72, rayWidth: 128 });
    expect(getGame3DLayout(200, false)).toEqual({ minimapWidth: 0, rayX: 2, rayWidth: 198 });
  });

  it('maps clicks to continuous world coordinates only on empty cells', () => {
    expect(minimapPointToWorld({ x: 17.5, y: 25 }, 200, 100, world)).toEqual({ x: 5, y: 5 });
    expect(minimapPointToWorld({ x: 52.5, y: 25 }, 200, 100, world)).toBeNull();
    expect(minimapPointToWorld({ x: 71, y: 25 }, 200, 100, world)).toBeNull();
  });
});
