/**
 * items.js
 * -----------------------------------------------------------------------
 * Falling eggs - the only collectible in Basket Bandit. Each egg is locked
 * to one of the 4 fixed lanes for its entire fall (no drift, no free x) -
 * this is what makes the catch skill purely about *which lane* the wolf
 * is in and *when*, matching the classic lane-catch genre this is built
 * around. Visual variety comes from a real 2-frame wobble animation
 * (two small egg crops taken from the character sheets), not motion.
 * -----------------------------------------------------------------------
 */
import { EGG, LANES, laneCenterX, DESIGN_HEIGHT } from './config.js';

export class ItemSpawner {
  constructor(eggFrames) {
    this.eggFrames = eggFrames; // [Image, Image]
    this.items = [];
    this.nextId = 1;
    this.animTimer = 0;
    this.animFrame = 0;
  }

  reset() {
    this.items = [];
    this.animTimer = 0;
    this.animFrame = 0;
  }

  /** Drops one egg from a random lane. */
  spawn(fallSpeed) {
    const lane = Math.floor(Math.random() * LANES.count);
    this.items.push({
      id: this.nextId++,
      lane,
      x: laneCenterX(lane),
      y: -EGG.radius - 10,
      vy: fallSpeed * (0.95 + Math.random() * 0.1),
      caught: false,
      missed: false
    });
  }

  /** Advances the shared wobble frame and moves every egg straight down. */
  update(dt) {
    this.animTimer += dt;
    const frameDur = 1 / EGG.wobbleFps;
    if (this.animTimer >= frameDur) {
      this.animTimer -= frameDur;
      this.animFrame = this.eggFrames.length ? (this.animFrame + 1) % this.eggFrames.length : 0;
    }

    const missed = [];
    for (const item of this.items) {
      item.y += item.vy * dt;
      if (!item.caught && item.y - EGG.radius > DESIGN_HEIGHT) {
        item.missed = true;
        missed.push(item);
      }
    }
    this.items = this.items.filter(i => !i.caught && !i.missed);
    return missed;
  }

  /** Circle-vs-rect collision against the wolf's catch box. Returns caught eggs. */
  checkCatches(catchBox) {
    const caught = [];
    for (const item of this.items) {
      if (item.caught) continue;
      const cx = Math.max(catchBox.x, Math.min(item.x, catchBox.x + catchBox.w));
      const cy = Math.max(catchBox.y, Math.min(item.y, catchBox.y + catchBox.h));
      const dist = Math.hypot(item.x - cx, item.y - cy);
      if (dist < EGG.radius * 0.85) {
        item.caught = true;
        caught.push(item);
      }
    }
    return caught;
  }

  draw(ctx) {
    const img = this.eggFrames[this.animFrame] || this.eggFrames[0];
    const r = EGG.radius;
    for (const item of this.items) {
      if (img && img.complete) {
        ctx.drawImage(img, item.x - r, item.y - r, r * 2, r * 2);
      } else {
        // Defensive fallback if an image failed to load - never render a
        // blank hole. Still just a primitive shape, not new/external art.
        ctx.fillStyle = '#f4e4bd';
        ctx.beginPath();
        ctx.arc(item.x, item.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
