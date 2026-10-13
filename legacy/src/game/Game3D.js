import { add, scale } from '../math/Vector2.js';
import { castRayDDA } from '../raycast/DDA.js';
import { minimapPointToWorld } from '../application/Game3DLayout.js';
import { circleCollidesWithWorld } from './Collision.js';
import { Player3D } from './Player3D.js';
import { World3D } from './World3D.js';

export class Game3D {
  constructor({ keyboard, pointer, world = new World3D(), player = new Player3D() }) {
    this.keyboard = keyboard;
    this.world = world;
    this.player = player;
    this.lights = [];
    this.width = 900;
    this.height = 400;
    this.controls = {
      speed: 200,
      rotationSpeed: 3,
      fov: 60,
      showMinimap: true,
      showGrid: true,
      showRays: true,
      shadeWalls: true,
    };
    this.unsubscribePointer = pointer.on('click', ({ point }) => this.addLightAt(point));
  }

  setControls(controls) {
    this.controls = controls;
  }

  setViewport(width, height) {
    this.width = width;
    this.height = height;
  }

  update(deltaSeconds) {
    this.player.speed = this.controls.speed;
    this.player.rotationSpeed = this.controls.rotationSpeed;

    let moveDir = 0;
    if (this.keyboard.isDown('w', 'arrowup')) moveDir += 1;
    if (this.keyboard.isDown('s', 'arrowdown')) moveDir -= 1;
    if (this.keyboard.isDown('a', 'arrowleft')) this.player.angle -= this.player.rotationSpeed * deltaSeconds;
    if (this.keyboard.isDown('d', 'arrowright')) this.player.angle += this.player.rotationSpeed * deltaSeconds;

    const forward = { x: Math.cos(this.player.angle), y: Math.sin(this.player.angle) };
    const move = scale(forward, moveDir * this.player.speed * deltaSeconds);
    const newPosition = add(this.player.position, move);

    if (!this.collides(newPosition)) {
      this.player.position = newPosition;
    } else if (!this.collides({ x: newPosition.x, y: this.player.position.y })) {
      this.player.position.x = newPosition.x;
    } else if (!this.collides({ x: this.player.position.x, y: newPosition.y })) {
      this.player.position.y = newPosition.y;
    }

    const fov = (this.controls.fov ?? 60) * Math.PI / 180;
    const dirX = Math.cos(this.player.angle);
    const dirY = Math.sin(this.player.angle);
    const planeLength = Math.tan(fov / 2);
    const planeX = -dirY * planeLength;
    const planeY = dirX * planeLength;
    const centerHit = castRayDDA(this.player.position, dirX + planeX * 0, dirY + planeY * 0,
      this.world.getMap(), this.world.cellSize);

    return {
      world: this.world,
      player: this.player,
      lights: this.lights,
      debug: {
        playerX: this.player.position.x,
        playerY: this.player.position.y,
        playerAngle: this.player.angle,
        cellsCrossed: centerHit ? Math.round(centerHit.perpDist / this.world.cellSize) : '—',
        rayDist: centerHit ? centerHit.distance : null,
        hitSide: centerHit ? (centerHit.side === 0 ? 'Vertical (X)' : 'Horizontal (Y)') : '—',
      },
    };
  }

  addLightAt(point) {
    if (!this.controls.showMinimap) return;
    const position = minimapPointToWorld(point, this.width, this.height, this.world);
    if (!position) return;
    this.lights.push({ ...position, radius: 240, intensity: 0.85 });
  }

  collides(position) {
    return circleCollidesWithWorld(
      position,
      this.player.radius,
      this.world.obstacles,
      this.world.mapWidth * this.world.cellSize,
      this.world.mapHeight * this.world.cellSize,
    );
  }

  dispose() {
    this.unsubscribePointer?.();
  }
}
