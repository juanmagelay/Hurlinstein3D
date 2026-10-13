export class DebugPanel {
    element = document.createElement('aside');
    controls = { enabled: true, distance: 500, angle: 0, rays: 21, fov: 90, gravity: 980, physics: 100, showHit: true, showNormal: false, showBounds: false, showDebug: true, multiple: false };
    values = new Map();
    changed = () => undefined;

    constructor() {
      this.element.className = 'panel';
      this.element.innerHTML = [
        '<div class="brand"><span class="eyebrow">GEOMETRY LAB / 01</span><h1>Raycast <i>2D</i></h1><p>Explorá cómo un rayo encuentra la superficie más cercana.</p></div>',
        '<section><h2>Raycast</h2>',
        '<label class="switch"><span>Mostrar rayos <button class="info" type="button" data-tip="Activa o desactiva la representación visual de los rayos y sus impactos.">!</button></span><input data-key="enabled" type="checkbox" checked><b></b></label>',
        '<label><span class="field-name">Modo <button class="info" type="button" data-tip="Single Ray emite un rayo. Multiple Rays distribuye varios rayos dentro del campo de visión.">!</button></span><select data-mode><option value="single">Single Ray</option><option value="multiple">Multiple Rays / FOV</option></select></label>',
        '<label><span class="field-name">Distancia <button class="info" type="button" data-tip="Máxima distancia que puede recorrer cada rayo. Si no encuentra un obstáculo antes, termina aquí.">!</button><output data-out="distance"></output></span><input data-key="distance" type="range" min="100" max="900" value="500"></label>',
        '<label><span class="field-name">Ángulo del rayo <button class="info" type="button" data-tip="Gira el rayo respecto de la dirección a la que apunta el jugador.">!</button><output data-out="angle"></output></span><input data-key="angle" type="range" min="-180" max="180" value="0"></label>',
        '<label data-multiple="true"><span class="field-name">Cantidad de rayos <button class="info" type="button" data-tip="Número de rayos emitidos en modo múltiple. Más rayos producen una lectura más detallada del espacio.">!</button><output data-out="rays"></output></span><input data-key="rays" type="range" min="3" max="61" step="2" value="21"></label>',
        '<label data-multiple="true"><span class="field-name">Campo de visión <button class="info" type="button" data-tip="Ángulo total del abanico. Los rayos se reparten desde el borde izquierdo hasta el borde derecho.">!</button><output data-out="fov"></output></span><input data-key="fov" type="range" min="10" max="180" value="90"></label>',
        '<label class="switch"><span>Punto de impacto <button class="info" type="button" data-tip="Muestra un marcador justo en el punto exacto donde el rayo toca un obstáculo.">!</button></span><input data-key="showHit" type="checkbox" checked><b></b></label>',
        '<label class="switch"><span>Normal de superficie <button class="info" type="button" data-tip="Dibuja una flecha perpendicular a la cara impactada. Indica hacia afuera de qué superficie chocó el rayo.">!</button></span><input data-key="showNormal" type="checkbox"><b></b></label>',
        '<label class="switch"><span>Bounds de obstáculos <button class="info" type="button" data-tip="Resalta el rectángulo límite usado por el algoritmo para calcular las intersecciones.">!</button></span><input data-key="showBounds" type="checkbox"><b></b></label>',
        '</section>',
        '<section class="debug"><div class="section-title"><h2>Debug en vivo <button class="info" type="button" data-tip="Muestra los valores numéricos actuales del jugador y del primer rayo.">!</button></h2><label class="switch compact"><input data-key="showDebug" type="checkbox" checked><b></b></label></div>',
        '<div class="readout"><div class="readout-heading">PLAYER</div><p>X <strong data-read="playerX">0.0</strong></p><p>Y <strong data-read="playerY">0.0</strong></p><div class="readout-heading">DIRECTION</div><p>X <strong data-read="directionX">0.00</strong></p><p>Y <strong data-read="directionY">0.00</strong></p><div class="readout-heading">HIT</div><p data-read="hit">None</p><div class="readout-heading">HIT POSITION</div><p>X <strong data-read="hitX">--</strong></p><p>Y <strong data-read="hitY">--</strong></p></div></section>',
        '<footer><span class="dot"></span> 1: blaster · 2: ancla · LEFT CLICK dispara/sube · SPACE salto/aleja · RIGHT CLICK cancela</footer>'
      ].join('');
      this.element.querySelector('section')?.insertAdjacentHTML('beforeend', '<label><span class="field-name">Gravedad <button class="info" type="button" data-tip="Aceleración vertical en píxeles por segundo al cuadrado. En 0 no hay caída; valores altos hacen el balanceo más fuerte.">!</button><output data-out="gravity"></output></span><input data-key="gravity" type="range" min="0" max="2000" step="50" value="980"></label><label><span class="field-name">Física <button class="info" type="button" data-tip="Respuesta del movimiento horizontal. Valores bajos se sienten más inerciales; valores altos responden más rápido al teclado.">!</button><output data-out="physics"></output></span><input data-key="physics" type="range" min="0" max="100" value="100"></label>');
      const footer = this.element.querySelector('footer');
      if (footer) footer.innerHTML = '<span class="dot"></span> 1: blaster · 2: ancla · LEFT CLICK dispara/sube · SPACE salto/aleja · RIGHT CLICK cancela';
      const weaponHud = document.createElement('div');
      weaponHud.className = 'weapon-hud';
      weaponHud.innerHTML = '<div class="weapon-slot" data-slot="1"><span class="weapon-icon blaster-icon"></span><small>1</small></div><div class="weapon-slot" data-slot="2"><span class="weapon-icon anchor-icon"></span><small>2</small></div>';
      this.weaponHud = weaponHud;
      this.bind();
    }

    show(container, stage) {
      container.appendChild(this.element);
      stage.appendChild(this.weaponHud);
    }

    onChange(callback) { this.changed = callback; }
    setWeapon(weapon) {
      this.weaponHud.querySelectorAll('.weapon-slot').forEach(slot => slot.classList.toggle('active', slot.dataset.slot === String(weapon)));
    }
    update(state) {
      this.setRead('playerX', state.playerX.toFixed(1)); this.setRead('playerY', state.playerY.toFixed(1)); this.setRead('directionX', state.directionX.toFixed(2)); this.setRead('directionY', state.directionY.toFixed(2));
      this.setRead('hit', state.hit ? 'Obstacle #' + state.hit.id + ' · ' + state.hit.distance.toFixed(1) + ' px' : 'None');
      this.setRead('hitX', state.hit?.x.toFixed(1) ?? '--'); this.setRead('hitY', state.hit?.y.toFixed(1) ?? '--');
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
      this.element.querySelector('[data-mode]')?.addEventListener('change', event => { this.controls.multiple = event.target.value === 'multiple'; this.element.querySelectorAll('[data-multiple]').forEach(el => el.hidden = !this.controls.multiple); this.changed(); });
      this.refreshOutputs(); this.element.querySelectorAll('[data-multiple]').forEach(el => el.hidden = true);
    }
    refreshOutputs() {
      for (const [key, output] of this.values) {
        if (output) output.textContent = this.controls[key] + (key === 'distance' ? ' px' : key === 'angle' || key === 'fov' ? '°' : key === 'gravity' ? ' px/s²' : key === 'physics' ? '%' : '');
      }
      this.element.querySelector('.debug')?.classList.toggle('is-hidden', !this.controls.showDebug);
    }
    setRead(key, value) { const element = this.element.querySelector('[data-read="' + key + '"]'); if (element) element.textContent = value; }
  }
