import { Draw } from './Draw.js';
import { MinimapRenderer3D } from './MinimapRenderer3D.js';
import { RaycasterRenderer3D } from './RaycasterRenderer3D.js';
import { getGame3DLayout, VIEW_GAP } from '../application/Game3DLayout.js';

const LABEL_STYLE = { fill: 0x5d7694, fontFamily: 'Arial', fontSize: 11, fontWeight: '700', letterSpacing: 2 };

export class Game3DRenderer {
  constructor({ minimap = new MinimapRenderer3D(), raycaster = new RaycasterRenderer3D() } = {}) {
    this.minimap = minimap;
    this.raycaster = raycaster;
  }

  draw(ctx, state, controls, width, height) {
    const { player, world, lights } = state;
    const { minimapWidth, rayX, rayWidth } = getGame3DLayout(width, controls.showMinimap);
    const map = world.getMap();

    if (controls.showMinimap) {
      this.minimap.draw(ctx, player, map, world.cellSize, 0, 0, minimapWidth, height, controls, lights);
      Draw.line(ctx, minimapWidth, 0, minimapWidth, height, { color: 0x223754, width: VIEW_GAP });
      Draw.text(ctx, 'MAPA 2D', 10, 8, LABEL_STYLE);
    }

    this.raycaster.draw(ctx, player, map, world.cellSize, rayX, 0, rayWidth, height, controls, lights);
    Draw.text(ctx, 'VISTA 3D', rayX + 10, 8, LABEL_STYLE);
  }
}
