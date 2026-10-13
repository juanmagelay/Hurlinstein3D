export class KeyboardInput {
  constructor(target) {
    this.target = target;
    this.keys = new Set();
    this.keyDownListeners = new Set();
    this.handleKeyDown = event => {
      const key = event.key.toLowerCase();
      this.keys.add(key);
      for (const listener of this.keyDownListeners) listener(key, event);
    };
    this.handleKeyUp = event => this.keys.delete(event.key.toLowerCase());
    target.addEventListener('keydown', this.handleKeyDown);
    target.addEventListener('keyup', this.handleKeyUp);
  }

  isDown(...keys) {
    return keys.some(key => this.keys.has(key.toLowerCase()));
  }

  onKeyDown(listener) {
    this.keyDownListeners.add(listener);
    return () => this.keyDownListeners.delete(listener);
  }

  dispose() {
    this.target.removeEventListener('keydown', this.handleKeyDown);
    this.target.removeEventListener('keyup', this.handleKeyUp);
    this.keyDownListeners.clear();
    this.keys.clear();
  }
}
