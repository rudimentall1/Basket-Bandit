/**
 * items.js
 * Basket Bandit
 *
 * Eggs (and now bonuses/hazards/power-ups) fall from four hen lanes;
 * the player catches them with a wide "basket" hitbox. A hen always
 * "tells" you it's about to lay - ITEM_VISUAL.warningMs of lead time -
 * before anything actually falls, exactly like the classic wolf game
 * where you watch the hens to know where to stand.
 */

import { LANES, laneCenterX, DESIGN_HEIGHT, ITEM_TYPES, ITEM_VISUAL } from './config.js';

const TOTAL_WEIGHT = ITEM_TYPES.reduce((sum, t) => sum + t.weight, 0);

function pickItemType() {
  let roll = Math.random() * TOTAL_WEIGHT;
  for (const type of ITEM_TYPES) {
    roll -= type.weight;
    if (roll <= 0) return type;
  }
  return ITEM_TYPES[0];
}

export class ItemSpawner {
  constructor(itemImages, chickenImages, chickenAlertImage) {
    this.itemImages = itemImages || {};
    this.chickens = chickenImages || [];
    this.chickenAlert = chickenAlertImage || null;

    this.items = [];
    this.nextId = 1;
    this.idleTimer = 0;
    this.slowFactor = 1;

    // A lane can be "armed" (hen about to lay) before anything spawns.
    this.pendingLane = null;
    this.pendingTimer = 0;
    this.pendingType = null;
    this.pendingFallSpeed = 0;
  }

  reset() {
    this.items = [];
    this.nextId = 1;
    this.idleTimer = 0;
    this.slowFactor = 1;
    this.pendingLane = null;
    this.pendingTimer = 0;
    this.pendingType = null;
  }

  /** Called on the engine's spawn cadence - arms a lane, doesn't drop yet. */
  queueSpawn(fallSpeed, lane = null) {
    if (this.pendingLane !== null) return; // one warning at a time

    this.pendingLane = lane === null ? Math.floor(Math.random() * LANES.count) : lane;
    this.pendingType = pickItemType();
    this.pendingFallSpeed = fallSpeed;
    this.pendingTimer = ITEM_VISUAL.warningMs;
  }

  update(dt) {
    this.idleTimer += dt;

    if (this.pendingLane !== null) {
      this.pendingTimer -= dt * 1000;
      if (this.pendingTimer <= 0) {
        this.items.push({
          id: this.nextId++,
          lane: this.pendingLane,
          x: laneCenterX(this.pendingLane),
          y: 170,
          speed: this.pendingFallSpeed,
          type: this.pendingType,
          caught: false,
          missed: false,
          spawnTime: this.idleTimer
        });
        this.pendingLane = null;
        this.pendingType = null;
      }
    }

    const missed = [];
    for (const egg of this.items) {
      if (egg.caught) continue;

      egg.y += egg.speed * this.slowFactor * dt;

      if (egg.y - ITEM_VISUAL.radius > DESIGN_HEIGHT) {
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
    for (let i = 0; i < LANES.count; i++) {
      if (!this.chickens.length) break;

      const isAlert = this.pendingLane === i;
      const bob = Math.sin(this.idleTimer * 2 + i * 0.7) * 4;
      const cx = laneCenterX(i);
      const cy = 100 + (isAlert ? 0 : bob);

      if (isAlert) {
        // Soft pulsing glow behind the hen that's about to lay.
        const pulse = 0.5 + 0.5 * Math.sin(this.idleTimer * 14);
        const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 90);
        grad.addColorStop(0, `rgba(255, 216, 90, ${0.55 * pulse})`);
        grad.addColorStop(1, 'rgba(255, 216, 90, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, 90, 0, Math.PI * 2);
        ctx.fill();
      }

      const sprite = isAlert && this.chickenAlert ? this.chickenAlert : this.chickens[i % this.chickens.length];
      const scale = isAlert ? 1.12 : 1;
      const size = 120 * scale;

      if (sprite && sprite.complete) {
        ctx.drawImage(sprite, cx - size / 2, cy - size / 2 + 60 - (size - 120) / 2, size, size);
      }
    }

    for (const egg of this.items) {
      const img = this.itemImages[egg.type.id];
      if (!img || !img.complete) continue;

      const age = this.idleTimer - egg.spawnTime;
      const wobble = 1 + Math.sin(age * ITEM_VISUAL.wobbleSpeed) * ITEM_VISUAL.wobbleAmount;
      const size = 60 * wobble;

      ctx.drawImage(img, egg.x - size / 2, egg.y - size / 2, size, size);
    }
  }
}
