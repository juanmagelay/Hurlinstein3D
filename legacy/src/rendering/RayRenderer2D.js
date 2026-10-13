import { Draw } from './Draw.js';

export class RayRenderer {
    draw(ctx, origin, rays, maxDistance, options, shot, anchor, connection) {
      for (const ray of rays) {
        const endDistance = ray.hit?.distance ?? maxDistance;
        const end = { x: origin.x + ray.direction.x * endDistance, y: origin.y + ray.direction.y * endDistance };
        Draw.line(ctx, origin.x, origin.y, end.x, end.y, { color: ray.hit ? 0xff5578 : 0xffc857, width: ray.hit ? 2.5 : 1.5, alpha: 0.9 });
        if (ray.hit && options.showHit) {
          Draw.circle(ctx, ray.hit.point.x, ray.hit.point.y, 6, 0xff5578, { color: 0xffffff, width: 2 });
        }
        if (ray.hit && options.showNormal) {
          Draw.line(ctx, ray.hit.point.x, ray.hit.point.y, ray.hit.point.x + ray.hit.normal.x * 28, ray.hit.point.y + ray.hit.normal.y * 28, { color: 0x8ef6ff, width: 3 });
        }
      }
      if (shot) {
        Draw.circle(ctx, shot.point.x, shot.point.y, 12, null, { color: 0xffffff, width: 2, alpha: 0.95 });
        Draw.line(ctx, shot.point.x - 7, shot.point.y, shot.point.x + 7, shot.point.y, { color: 0xffd166, width: 3 });
        Draw.line(ctx, shot.point.x, shot.point.y - 7, shot.point.x, shot.point.y + 7, { color: 0xffd166, width: 3 });
      }
      if (anchor) {
        Draw.line(ctx, origin.x, origin.y, anchor.point.x, anchor.point.y, { color: 0x9b7cff, width: 3, alpha: 0.9 });
        Draw.circle(ctx, anchor.point.x, anchor.point.y, 10, 0x9b7cff, { color: 0xf2edff, width: 2 });
        Draw.circle(ctx, anchor.point.x, anchor.point.y, 3, 0x0d1726);
      }
      if (connection) {
        Draw.line(ctx, connection.from.x, connection.from.y, connection.to.x, connection.to.y, { color: 0xf2a7ff, width: 4, alpha: 0.95 });
        Draw.circle(ctx, connection.to.x, connection.to.y, 8, 0xf2a7ff, { color: 0xffffff, width: 2 });
      }
    }
  }
