import { Draw } from './Draw.js';

export class PlayerRenderer {
    draw(ctx, player, weapon) {
      const { x, y } = player.position;
      const dir = player.direction;
      Draw.circle(ctx, x, y, 16, 0x4de1bd, { color: 0xd9fff6, width: 2 });
      Draw.line(ctx, x + dir.x * 11, y + dir.y * 11, x + dir.x * 30, y + dir.y * 30, { color: weapon === 1 ? 0xffd166 : 0x9b7cff, width: 7, cap: 'round' });
      Draw.line(ctx, x, y, x + dir.x * 31, y + dir.y * 31, { color: 0xffffff, width: 4, cap: 'round' });
      Draw.circle(ctx, x, y, 4, 0x122033);
    }
  }
