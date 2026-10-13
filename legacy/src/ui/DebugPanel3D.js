export class DebugPanel3D {
    element = document.createElement('aside');
    controls = { speed: 200, rotationSpeed: 3, fov: 60, showMinimap: true, showGrid: true, showRays: true, shadeWalls: true };
    values = new Map();
    changed = () => undefined;

    constructor() {
      this.element.className = 'panel';
      this.element.innerHTML = [
        '<div class="brand"><span class="eyebrow">RAYCAST LAB / 02</span><h1>Raycast <i>3D</i></h1><p>Renderer estilo Wolfenstein con DDA, corrección de pecera y distancia euclídea.</p></div>',
        '<section><h2>Movimiento</h2>',
        '<label><span class="field-name">Velocidad <button class="info" type="button" data-tip="Velocidad de desplazamiento en píxeles por segundo.">!</button><output data-out="speed"></output></span><input data-key="speed" type="range" min="50" max="600" step="10" value="200"></label>',
        '<label><span class="field-name">Rotación <button class="info" type="button" data-tip="Velocidad de giro de la cámara en radianes por segundo.">!</button><output data-out="rotationSpeed"></output></span><input data-key="rotationSpeed" type="range" min="0.5" max="8" step="0.5" value="3"></label>',
        '</section>',
        '<section><h2>Rendering</h2>',
        '<label><span class="field-name">FOV <button class="info" type="button" data-tip="Campo de visión de la cámara 3D en grados.">!</button><output data-out="fov"></output></span><input data-key="fov" type="range" min="30" max="120" step="5" value="60"></label>',
        '<label class="switch"><span>Sombras de distancia <button class="info" type="button" data-tip="Atenúa el color de las paredes según la distancia al jugador.">!</button></span><input data-key="shadeWalls" type="checkbox" checked><b></b></label>',
        '</section>',
        '<section><h2>Minimapa</h2>',
        '<label class="switch"><span>Mostrar minimapa <button class="info" type="button" data-tip="Activa o desactiva la vista superior del laberinto.">!</button></span><input data-key="showMinimap" type="checkbox" checked><b></b></label>',
        '<label class="switch"><span>Grilla <button class="info" type="button" data-tip="Muestra las líneas de la grilla del minimapa.">!</button></span><input data-key="showGrid" type="checkbox" checked><b></b></label>',
        '<label class="switch"><span>Rayos <button class="info" type="button" data-tip="Dibuja los rayos trazados desde el jugador en el minimapa.">!</button></span><input data-key="showRays" type="checkbox" checked><b></b></label>',
        '</section>',
        '<section><div class="section-title"><h2>Datos en vivo</h2></div>',
        '<div class="readout">',
        '<div class="readout-heading">JUGADOR</div>',
        '<p>X <strong data-read="playerX">0.0</strong></p>',
        '<p>Y <strong data-read="playerY">0.0</strong></p>',
        '<p>Ángulo <strong data-read="playerAngle">0.0°</strong></p>',
        '<div class="readout-heading">RAYCAST</div>',
        '<p>Celdas recorridas <strong data-read="cellsCrossed">0</strong></p>',
        '<p>Distancia <strong data-read="rayDist">0 px</strong></p>',
        '<p>Lado impacto <strong data-read="hitSide">—</strong></p>',
        '</div></section>',
        '<footer><span class="dot"></span> W/S mover · A/D rotar · ↑↓ mover · ←→ rotar</footer>'
      ].join('');
      this.bind();
    }

    show(container) { container.appendChild(this.element); }

    onChange(callback) { this.changed = callback; }

    update(state) {
      this.setRead('playerX', state.playerX.toFixed(1));
      this.setRead('playerY', state.playerY.toFixed(1));
      this.setRead('playerAngle', (state.playerAngle * 180 / Math.PI).toFixed(1) + '°');
      this.setRead('cellsCrossed', state.cellsCrossed ?? '—');
      this.setRead('rayDist', state.rayDist != null ? state.rayDist.toFixed(1) + ' px' : '—');
      this.setRead('hitSide', state.hitSide ?? '—');
    }

    bind() {
      this.element.querySelectorAll('[data-key]').forEach(input => {
        const key = input.dataset.key;
        this.values.set(key, this.element.querySelector('[data-out="' + key + '"]'));
        const sync = () => {
          this.controls[key] = input.type === 'checkbox' ? input.checked : Number(input.value);
          this.refreshOutputs();
          this.changed();
        };
        input.addEventListener(input.type === 'checkbox' ? 'change' : 'input', sync);
        if (input.type === 'checkbox') {
          input.parentElement?.querySelector('b')?.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            input.click();
          });
        }
      });
      this.refreshOutputs();
    }

    refreshOutputs() {
      for (const [key, output] of this.values) {
        if (output) output.textContent = this.controls[key] + (key === 'speed' ? ' px/s' : key === 'rotationSpeed' ? ' rad/s' : key === 'fov' ? '°' : '');
      }
    }

    setRead(key, value) {
      const element = this.element.querySelector('[data-read="' + key + '"]');
      if (element) element.textContent = value;
    }
  }
