import { add, normalize, rotate, scale, subtract } from '../math/Vector2.js';
import { raycast } from '../raycast/Raycast.js';
import { resolveCircleAgainstWorld } from './Collision.js';
import { Player } from './Player2D.js';
import { World } from './World2D.js';

export class Game2D {
  constructor({ keyboard, pointer, world = new World(), player = new Player() }) {
    this.keyboard = keyboard;
    this.pointerInput = pointer;
    this.world = world;
    this.player = player;
    this.pointer = { x: 600, y: 300 };
    this.shotHit = null;
    this.anchor = null;
    this.connection = null;
    this.currentControls = null;
    this.activeWeapon = 1;
    this.ropeLength = 0;
    this.jumpWasDown = false;
    this.jumpReady = true;
    this.mouseFireDown = false;
    this.width = 900;
    this.height = 700;
    this.weaponChangeListeners = new Set();
    this.unsubscribe = [
      keyboard.onKeyDown(key => this.handleKeyDown(key)),
      pointer.on('move', ({ point }) => { this.pointer = point; }),
      pointer.on('down', ({ button }) => {
        if (button === 0) {
          this.mouseFireDown = true;
          this.fire();
        }
      }),
      pointer.on('up', ({ button }) => {
        if (button === 0) this.mouseFireDown = false;
      }),
      pointer.on('contextmenu', () => this.cancelAnchor()),
    ];
  }

  setViewport(width, height) {
    this.width = width;
    this.height = height;
  }

  onWeaponChange(listener) {
    this.weaponChangeListeners.add(listener);
    return () => this.weaponChangeListeners.delete(listener);
  }

  handleKeyDown(key) {
    if (key !== '1' && key !== '2') return;
    this.activeWeapon = Number(key);
    if (this.activeWeapon === 1) this.cancelAnchor();
    for (const listener of this.weaponChangeListeners) listener(this.activeWeapon);
  }

  update(deltaSeconds, controls) {
    this.currentControls = controls;
    let movement = { x: 0, y: 0 };
    if (this.keyboard.isDown('w', 'arrowup')) movement.y -= 1;
    if (this.keyboard.isDown('s', 'arrowdown')) movement.y += 1;
    if (this.keyboard.isDown('a', 'arrowleft')) movement.x -= 1;
    if (this.keyboard.isDown('d', 'arrowright')) movement.x += 1;

    const jumpDown = this.keyboard.isDown(' ');
    if (this.anchor && this.mouseFireDown) {
      this.ropeLength = Math.max(34, this.ropeLength - 170 * deltaSeconds);
    } else if (this.anchor && jumpDown) {
      this.ropeLength = Math.min(controls.distance, this.ropeLength + 220 * deltaSeconds);
    } else if (!this.anchor && jumpDown && !this.jumpWasDown && this.jumpReady) {
      this.player.velocity.y = -this.player.jumpSpeed;
      this.jumpReady = false;
    }
    this.jumpWasDown = jumpDown;

    const physicsResponse = controls.physics / 100;
    const targetVelocityX = movement.x * this.player.speed;
    if (!this.anchor) {
      this.player.velocity.x += (targetVelocityX - this.player.velocity.x)
        * Math.min(1, (4 + physicsResponse * 20) * deltaSeconds);
    }
    this.player.velocity.y += controls.gravity * deltaSeconds;

    if (this.anchor) {
      const ropeOffset = subtract(this.player.position, this.anchor.point);
      const ropeDistance = Math.hypot(ropeOffset.x, ropeOffset.y);
      if (ropeDistance > 0) {
        this.player.velocity = add(this.player.velocity,
          scale({ x: movement.x, y: 0 }, 1100 * physicsResponse * deltaSeconds));
        this.player.velocity = scale(this.player.velocity, Math.pow(0.9985, deltaSeconds * 60));
      }
    }

    this.player.position = add(this.player.position, scale(this.player.velocity, deltaSeconds));
    if (this.anchor) this.applyRopeConstraint();
    this.resolveWorldCollisions();
    this.player.direction = normalize(subtract(this.pointer, this.player.position));

    const centerDirection = rotate(this.player.direction, controls.angle * Math.PI / 180);
    const count = controls.multiple ? Math.max(1, Math.round(controls.rays)) : 1;
    const fov = controls.multiple ? controls.fov * Math.PI / 180 : 0;
    const rays = [];
    for (let index = 0; index < count; index++) {
      const ratio = count === 1 ? 0 : index / (count - 1) - 0.5;
      const direction = normalize(rotate(centerDirection, ratio * fov));
      const hit = raycast(this.player.position, direction, controls.distance, this.world.obstacles);
      rays.push({ direction, distance: hit?.distance ?? controls.distance, hit });
    }

    const primaryHit = rays[0]?.hit ?? null;
    return {
      world: this.world,
      player: this.player,
      rays,
      shotHit: this.shotHit,
      anchor: this.anchor,
      connection: this.connection,
      activeWeapon: this.activeWeapon,
      debug: {
        playerX: this.player.position.x,
        playerY: this.player.position.y,
        directionX: this.player.direction.x,
        directionY: this.player.direction.y,
        hit: primaryHit ? {
          id: primaryHit.obstacle.id,
          distance: primaryHit.distance,
          x: primaryHit.point.x,
          y: primaryHit.point.y,
        } : null,
      },
    };
  }

  fire() {
    const angle = (this.currentControls?.angle ?? 0) * Math.PI / 180;
    const distance = this.currentControls?.distance ?? 500;
    const direction = normalize(rotate(this.player.direction, angle));
    const hit = raycast(this.player.position, direction, distance, this.world.obstacles);
    if (this.activeWeapon === 1) {
      this.shotHit = hit;
      this.cancelAnchor();
      return;
    }

    this.shotHit = null;
    if (this.anchor || !hit) return;
    this.anchor = hit;
    this.ropeLength = Math.hypot(hit.point.x - this.player.position.x, hit.point.y - this.player.position.y);
    const rope = normalize(subtract(this.player.position, hit.point));
    this.player.velocity = add(this.player.velocity, scale({ x: -rope.y, y: rope.x }, 150));
  }

  cancelAnchor() {
    this.anchor = null;
    this.connection = null;
  }

  applyRopeConstraint() {
    if (!this.anchor) return;
    const offset = subtract(this.player.position, this.anchor.point);
    const distance = Math.hypot(offset.x, offset.y);
    if (distance <= this.ropeLength || distance === 0) return;
    const normal = scale(offset, 1 / distance);
    this.player.position = add(this.anchor.point, scale(normal, this.ropeLength));
    const radialSpeed = this.player.velocity.x * normal.x + this.player.velocity.y * normal.y;
    if (radialSpeed > 0) this.player.velocity = subtract(this.player.velocity, scale(normal, radialSpeed));
  }

  resolveWorldCollisions() {
    const result = resolveCircleAgainstWorld(
      this.player.position,
      this.player.velocity,
      this.player.radius,
      this.world.obstacles,
      { width: this.width, height: this.height },
    );
    this.player.position = result.position;
    this.player.velocity = result.velocity;
    if (result.grounded) this.jumpReady = true;
  }

  dispose() {
    for (const unsubscribe of this.unsubscribe) unsubscribe?.();
    this.weaponChangeListeners.clear();
  }
}
