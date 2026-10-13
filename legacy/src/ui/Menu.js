export class Menu {
    element = document.createElement('div');

    constructor() {
      this.element.id = 'menu';
      this.element.innerHTML = [
        '<div class="menu-inner">',
        '<div class="menu-brand"><span class="eyebrow">RAYCAST LAB</span><h1>Elige una demo</h1><p>Select a demo to explore raycasting techniques.</p></div>',
        '<div class="menu-cards">',
        '<button class="menu-card" data-demo="2d">',
        '<span class="menu-card-icon card-2d"></span>',
        '<span class="menu-card-title">Demo 2D</span>',
        '<span class="menu-card-desc">Interactive raycast with weapons, grappling hook and physics.</span>',
        '</button>',
        '<button class="menu-card" data-demo="3d">',
        '<span class="menu-card-icon card-3d"></span>',
        '<span class="menu-card-title">Demo 3D</span>',
        '<span class="menu-card-desc">Wolfenstein-style false 3D renderer using raycasting.</span>',
        '</button>',
        '</div>',
        '</div>'
      ].join('');
    }

    show(container) {
      container.appendChild(this.element);
    }

    onSelect(callback) {
      this.element.querySelectorAll('.menu-card').forEach(card => {
        card.addEventListener('click', () => {
          const demo = card.dataset.demo;
          this.element.remove();
          callback(demo);
        });
      });
    }
  }
