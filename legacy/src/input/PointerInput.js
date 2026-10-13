export class PointerInput {
  constructor(canvas, toLocal, pointerUpTarget) {
    this.canvas = canvas;
    this.toLocal = toLocal;
    this.pointerUpTarget = pointerUpTarget;
    this.listeners = new Map();

    this.handleMove = event => this.emit('move', event);
    this.handleDown = event => this.emit('down', event);
    this.handleUp = event => this.emit('up', event);
    this.handleClick = event => this.emit('click', event);
    this.handleContextMenu = event => {
      if (this.listeners.has('contextmenu')) event.preventDefault();
      this.emit('contextmenu', event);
    };

    canvas.addEventListener('pointermove', this.handleMove);
    canvas.addEventListener('pointerdown', this.handleDown);
    canvas.addEventListener('click', this.handleClick);
    canvas.addEventListener('contextmenu', this.handleContextMenu);
    pointerUpTarget.addEventListener('pointerup', this.handleUp);
  }

  on(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
    return () => this.listeners.get(type)?.delete(listener);
  }

  emit(type, event) {
    const payload = { point: this.toLocal(event), button: event.button, event };
    for (const listener of this.listeners.get(type) ?? []) listener(payload);
  }

  dispose() {
    this.canvas.removeEventListener('pointermove', this.handleMove);
    this.canvas.removeEventListener('pointerdown', this.handleDown);
    this.canvas.removeEventListener('click', this.handleClick);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
    this.pointerUpTarget.removeEventListener('pointerup', this.handleUp);
    this.listeners.clear();
  }
}
