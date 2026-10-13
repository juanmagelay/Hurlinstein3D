import { Draw } from './Draw.js';

  const LABEL_STYLE = { fill: 0x9bb9d7, fontFamily: 'Arial', fontSize: 12, fontWeight: 'bold' };

export class ObstacleRenderer {
    draw(ctx, obstacles, showBounds) {
      for (const obstacle of obstacles) {
        const { x, y } = obstacle.position;
        Draw.roundRect(ctx, x, y, obstacle.width, obstacle.height, 8, 0x273b59, { color: 0x4d709d, width: 2 });
        if (showBounds) Draw.rect(ctx, x, y, obstacle.width, obstacle.height, null, { color: 0x73a8d8, width: 1, alpha: 0.65 });
      }
      // Las etiquetas van encima de todas las formas (como los hijos Text en pixi).
      for (const obstacle of obstacles) {
        Draw.text(ctx, `#${obstacle.id}`, obstacle.position.x + 9, obstacle.position.y + 8, LABEL_STYLE);
      }
    }
  }
