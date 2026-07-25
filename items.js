/**
 * items.js
 * Basket Bandit
 *
 * Eggs fall from four chicken lanes; the player catches them with a
 * wide "basket" hitbox. This module only tracks positions/state - all
 * drawing is plain canvas primitives using the preloaded sprites.
 */

import { EGG, LANES, laneCenterX, DESIGN_HEIGHT } from './config.js';

export class ItemSpawner {
  constructor(eggFrames, chickens = []) {
    this.eggFrames = eggFrames || [];
    this.chickens = chickens || [];
    this.items = [];
    this.nextId = 1;
    this.animTimer = 0;
    this.animFrame = 0;
    this.chickenFrame = 0;
    this.chickenTimer = 0;
  }

  reset() {
    this.items = [];
    this.nextId = 1;
    this.animTimer = 0;
    this.animFrame = 0;
    this.chickenFrame = 0;
    this.chickenTimer = 0;
  }

  spawn(fallSpeed, lane = null) {
    if (lane === null) {
      lane = Math.floor(Math.random() * LANES.count);
    }

    this.items.push({
      id: this.nextId++,
      lane,
      x: laneCenterX(lane),
      y: 170,
      speed: fallSpeed,
      caught: false,
      missed: false
    });
  }

  update(dt) {
    this.animTimer += dt;
    if (this.animTimer > 1 / EGG.wobbleFps) {
      this.animTimer = 0;
      if (this.eggFrames.length) {
        this.animFrame = (this.animFrame + 1) % this.eggFrames.length;
      }
    }

    const missed = [];
    for (const egg of this.items) {
      if (egg.caught) continue;

      egg.y += egg.speed * dt;

      if (egg.y - EGG.radius > DESIGN_HEIGHT) {
        egg.missed = true;
        missed.push(egg);
      }
    }

    this.items = this.items.filter(e => !e.caught && !e.missed);

    return missed;
  }

  checkCatches(box) {
    const caught = [];

    for (const egg of this.items) {
      if (egg.caught) continue;

      const inside =
        egg.x > box.x && egg.x < box.x + box.w &&
        egg.y > box.y && egg.y < box.y + box.h;

      if (inside) {
        egg.caught = true;
        caught.push(egg);
      }
    }

    return caught;
  }

  draw(ctx) {
    // Slow chicken idle animation.
    this.chickenTimer += 0.05;
    if (this.chickenTimer > 8) {
      this.chickenTimer = 0;
      if (this.chickens.length) {
        this.chickenFrame = (this.chickenFrame + 1) % this.chickens.length;
      }
    }

    for (let i = 0; i < LANES.count; i++) {
      if (!this.chickens.length) break;
      const chicken = this.chickens[i % this.chickens.length];
      if (chicken && chicken.complete) {
        ctx.drawImage(chicken, laneCenterX(i) - 60, 40, 120, 120);
      }
    }

    for (const egg of this.items) {
      let img = null;
      if (this.eggFrames.length) {
        img = this.eggFrames[this.animFrame % this.eggFrames.length];
      }
      if (img && img.complete) {
        ctx.drawImage(img, egg.x - 30, egg.y - 30, 60, 60);
      }
    }
  }
}
