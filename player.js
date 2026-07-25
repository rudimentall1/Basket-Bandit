/**
 * player.js
 * Basket Bandit
 *
 * The wolf: moves between four fixed lanes and catches falling eggs
 * with a wide basket hitbox. Sprite-sheet driven animation state
 * machine (idle / run / catch / victory / lose).
 */

import { PLAYER, LANES, laneCenterX } from './config.js';

const ANIM_FPS = { idle: 6, run: 12, catch: 20, victory: 8, lose: 8 };
const START_LANE = 1;

export class Player {
  constructor(images) {
    this.images = images;

    this.laneIndex = START_LANE;
    this.x = laneCenterX(this.laneIndex);
    this.targetX = this.x;
    this.y = PLAYER.groundY;

    this.width = PLAYER.width;
    this.height = PLAYER.height;

    this.anim = 'idle';
    this.frame = 0;
    this.animTime = 0;
    this.moving = false;
    this.oneShot = false;

    this.invulnerableTimer = 0;
    this.catchFlash = 0;
  }

  reset() {
    this.laneIndex = START_LANE;
    this.x = laneCenterX(this.laneIndex);
    this.targetX = this.x;

    this.anim = 'idle';
    this.frame = 0;
    this.animTime = 0;
    this.moving = false;
    this.oneShot = false;

    this.invulnerableTimer = 0;
    this.catchFlash = 0;
  }

  /** Move wolf left/right like classic arcade. */
  moveByLane(delta) {
    const next = Math.max(0, Math.min(LANES.count - 1, this.laneIndex + delta));
    if (next === this.laneIndex) return;

    this.laneIndex = next;
    this.targetX = laneCenterX(next);
    this.setAnimation('run');
  }

  /** Tap directly on a lane. */
  goToLaneIndex(index) {
    index = Math.max(0, Math.min(LANES.count - 1, index));
    if (index === this.laneIndex) return;

    this.laneIndex = index;
    this.targetX = laneCenterX(index);
    this.setAnimation('run');
  }

  update(dt) {
    // Smooth movement between the four lane positions.
    const dx = this.targetX - this.x;

    if (Math.abs(dx) > 1) {
      const speed = PLAYER.laneMoveSpeed * dt;
      this.x += Math.sign(dx) * Math.min(speed, Math.abs(dx));
      this.moving = true;
    } else {
      this.x = this.targetX;
      this.moving = false;
    }

    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt * 1000;
    if (this.catchFlash > 0) this.catchFlash -= dt;

    // Don't interrupt the catch animation once it has started.
    if (!this.oneShot) {
      this.setAnimation(this.moving ? 'run' : 'idle');
    }

    this.advanceAnimation(dt);
  }

  setAnimation(name) {
    if (this.anim === name || !this.images[name]) return;
    this.anim = name;
    this.frame = 0;
    this.animTime = 0;
  }

  /** Compatibility with engine.js */
  playOneShot(name) {
    if (!this.images[name]) return;
    this.anim = name;
    this.frame = 0;
    this.animTime = 0;
    this.oneShot = true;
    if (name === 'catch') this.catchFlash = 0.12;
  }

  playCatch() {
    this.playOneShot('catch');
  }

  advanceAnimation(dt) {
    const frames = this.images[this.anim];
    if (!frames || !frames.length) return;

    this.animTime += dt;
    const frameTime = 1 / (ANIM_FPS[this.anim] || 10);

    while (this.animTime >= frameTime) {
      this.animTime -= frameTime;
      this.frame++;

      if (this.frame >= frames.length) {
        if (this.oneShot) {
          this.oneShot = false;
          this.anim = 'idle';
        }
        this.frame = 0;
      }
    }
  }

  /** Wide basket area - classic catch-game forgiveness. */
  getCatchBox() {
    return { x: this.x - 130, y: this.y - 100, w: 260, h: 140 };
  }

  hit() {
    this.invulnerableTimer = PLAYER.invulnerableMs;
  }

  isInvulnerable() {
    return this.invulnerableTimer > 0;
  }

  draw(ctx) {
    const frames = this.images[this.anim];
    if (!frames || !frames.length) return;

    const img = frames[Math.min(this.frame, frames.length - 1)];
    if (!img.complete) return;

    ctx.save();
    if (this.invulnerableTimer > 0) ctx.globalAlpha = 0.45;

    const offsetY = this.catchFlash > 0 ? -8 : 0;
    ctx.drawImage(img, this.x - this.width / 2, this.y - this.height + offsetY, this.width, this.height);

    ctx.restore();
  }
}
