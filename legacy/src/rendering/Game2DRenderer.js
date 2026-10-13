import { Draw } from './Draw.js';
import { ObstacleRenderer } from './ObstacleRenderer2D.js';
import { PlayerRenderer } from './PlayerRenderer2D.js';
import { RayRenderer } from './RayRenderer2D.js';

const HINT_STYLE = { fill: 0x5d7694, fontFamily: 'Arial', fontSize: 11, letterSpacing: 2 };
const GRID_STROKE = { color: 0x17263b, width: 1, alpha: 0.8 };
const GRID_SEGMENTS = [];
for (let x = 0; x <= 1400; x += 40) GRID_SEGMENTS.push([x, 0, x, 1000]);
for (let y = 0; y <= 1000; y += 40) GRID_SEGMENTS.push([0, y, 1400, y]);

export class Game2DRenderer {
  constructor({ rayRenderer = new RayRenderer(), obstacleRenderer = new ObstacleRenderer(), playerRenderer = new PlayerRenderer() } = {}) {
    this.rayRenderer = rayRenderer;
    this.obstacleRenderer = obstacleRenderer;
    this.playerRenderer = playerRenderer;
  }

  draw(ctx, state, controls) {
    Draw.lines(ctx, GRID_SEGMENTS, GRID_STROKE);
    const rayOptions = controls.enabled
      ? { showHit: controls.showHit, showNormal: controls.showNormal }
      : { showHit: false, showNormal: false };
    this.rayRenderer.draw(ctx, state.player.position, controls.enabled ? state.rays : [], controls.distance,
      rayOptions, state.shotHit, state.anchor, state.connection);
    this.obstacleRenderer.draw(ctx, state.world.obstacles, controls.showBounds);
    this.playerRenderer.draw(ctx, state.player, state.activeWeapon);
    Draw.text(ctx, 'MOVE  /  AIM', 24, 22, HINT_STYLE);
  }
}
