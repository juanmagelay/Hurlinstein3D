import { Draw } from './Draw.js';

  // Reemplazo mínimo de PIXI.Application: un <canvas> con contexto 2D,
  // un bucle con requestAnimationFrame y resize nítido en pantallas retina.
export class CanvasApp {
    constructor({ background = 0x000000 } = {}) {
      this.background = background;
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.width = 800;
      this.height = 600;
      this.pixelRatio = 1;
      this.tickers = [];
      this.lastTime = null;
      this.frameId = null;
      this.running = false;
      this.resizeObserver = null;
      this.resize(this.width, this.height);
    }

    mount(container) {
      container.appendChild(this.canvas);
      this.resizeObserver?.disconnect();
      this.resizeObserver = new ResizeObserver(() => {
        const rect = container.getBoundingClientRect();
        this.resize(rect.width, rect.height);
      });
      this.resizeObserver.observe(container);
      const rect = container.getBoundingClientRect();
      this.resize(rect.width, rect.height);
    }

    // width/height en píxeles CSS; el buffer interno se escala por devicePixelRatio.
    resize(width, height) {
      this.width = width;
      this.height = height;
      this.pixelRatio = window.devicePixelRatio || 1;
      this.canvas.width = Math.max(1, Math.round(width * this.pixelRatio));
      this.canvas.height = Math.max(1, Math.round(height * this.pixelRatio));
    }

    // Posición de un evento de puntero en coordenadas del juego.
    toLocal(event) {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = rect.width ? this.width / rect.width : 1;
      const scaleY = rect.height ? this.height / rect.height : 1;
      return { x: (event.clientX - rect.left) * scaleX, y: (event.clientY - rect.top) * scaleY };
    }

    // Registra una función que se llama en cada frame con (deltaSeconds, ctx).
    addTicker(callback) {
      this.tickers.push(callback);
      if (!this.running) {
        this.running = true;
        this.lastTime = null;
        this.frameId = requestAnimationFrame(time => this.frame(time));
      }
      return () => this.removeTicker(callback);
    }

    removeTicker(callback) {
      this.tickers = this.tickers.filter(tick => tick !== callback);
      if (this.tickers.length === 0) {
        this.running = false;
        if (this.frameId !== null) cancelAnimationFrame(this.frameId);
        this.frameId = null;
      }
    }

    destroy() {
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;
      this.tickers = [];
      this.running = false;
      if (this.frameId !== null) cancelAnimationFrame(this.frameId);
      this.frameId = null;
      this.canvas.remove();
    }

    frame(time) {
      if (!this.running || this.tickers.length === 0) return;
      // Igual que el ticker de pixi: el delta se limita a 100 ms para evitar saltos.
      const deltaSeconds = this.lastTime === null ? 0 : Math.min(0.1, Math.max(0, (time - this.lastTime) / 1000));
      this.lastTime = time;

      const ctx = this.ctx;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      Draw.fillRect(ctx, 0, 0, this.canvas.width, this.canvas.height, this.background);
      ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);

      for (const tick of this.tickers) tick(deltaSeconds, ctx);
      if (this.running && this.tickers.length > 0) {
        this.frameId = requestAnimationFrame(next => this.frame(next));
      } else {
        this.running = false;
        this.frameId = null;
      }
    }
  }
