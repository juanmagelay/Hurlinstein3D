import { Game2D } from './game/Game2D.js';
import { Game3D } from './game/Game3D.js';
import { KeyboardInput } from './input/KeyboardInput.js';
import { PointerInput } from './input/PointerInput.js';
import { CanvasApp } from './rendering/CanvasApp.js';
import { Game2DRenderer } from './rendering/Game2DRenderer.js';
import { Game3DRenderer } from './rendering/Game3DRenderer.js';
import { DebugPanel } from './ui/DebugPanel2D.js';
import { DebugPanel3D } from './ui/DebugPanel3D.js';
import { Menu } from './ui/Menu.js';

function createStage(container, wide) {
  const stage = document.createElement('main');
  stage.className = wide ? 'stage stage-wide' : 'stage';
  stage.id = 'stage';
  container.prepend(stage);
  return stage;
}

function start() {
  const appElement = document.querySelector('#app');
  const app = new CanvasApp({ background: 0x0d1726 });
  const menu = new Menu();
  menu.show(appElement);

  menu.onSelect(demo => {
    const is3D = demo === '3d';
    const stage = createStage(appElement, is3D);
    app.mount(stage);

    const keyboard = new KeyboardInput(window);
    const pointer = new PointerInput(app.canvas, event => app.toLocal(event), window);
    let game;
    let renderer;
    let panel;

    if (is3D) {
      game = new Game3D({ keyboard, pointer });
      renderer = new Game3DRenderer();
      panel = new DebugPanel3D();
      panel.show(appElement);
      panel.onChange(() => game.setControls(panel.controls));
      game.setControls(panel.controls);
    } else {
      game = new Game2D({ keyboard, pointer });
      renderer = new Game2DRenderer();
      panel = new DebugPanel();
      panel.show(appElement, stage);
      game.onWeaponChange(weapon => panel.setWeapon(weapon));
      panel.setWeapon(1);
    }

    const removeTicker = app.addTicker((deltaSeconds, ctx) => {
      game.setViewport(app.width, app.height);
      const state = game.update(deltaSeconds, panel.controls);
      if (is3D) {
        renderer.draw(ctx, state, panel.controls, app.width, app.height);
      } else {
        renderer.draw(ctx, state, panel.controls);
      }
      panel.update(state.debug);
    });

    const dispose = () => {
      removeTicker();
      game.dispose();
      keyboard.dispose();
      pointer.dispose();
      panel.element.remove();
      app.destroy();
      stage.remove();
    };
    window.addEventListener('pagehide', dispose, { once: true });
  });
}

start();
