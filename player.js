/**
 * player.js
 * -----------------------------------------------------------------------
 * The wolf character. Movement is strictly lane-based: the wolf always
 * occupies one of LANES.count discrete lanes and hops to the neighbouring
 * lane on input - there is no free horizontal roaming. The visual slide
 * between lane centers is a short tween purely for readability/game-feel;
 * it does not add intermediate "positions" the player can stop at.
 *
 * Sprite animation is a small state machine over five real frame sets
 * (idle / run / catch / victory / lose), each advanced at its own frame
 * rate and swapped based on what the wolf is currently doing.
 * -----------------------------------------------------------------------
 */
import { PLAYER, LANES, laneCenterX } from './config.js';

const ANIM_FPS = {
  idle: 6,
  run: 14,
  catch: 24,
  victory: 10,
  lose: 8
};

const START_LANE = Math.floor((LANES.count - 1) / 2);

export class Player {
  constructor(images) {
    this.images = images; // { idle:[Image,...], run:[...], catch:[...], victory:[...], lose:[...] }

    this.laneIndex = START_LANE;
    this.x = laneCenterX(this.laneIndex);
    this.targetX = this.x;
    this.y = PLAYER.groundY;
    this.width = PLAYER.width;
    this.height = PLAYER.height;
    this.facing = 1; // 1 = right, -1 = left
    this.moving = false; // true while sliding between lane centers

    this.anim = 'idle';
    this.frame = 0;
    this.animTime = 0;
    this.oneShot = false;   // true while playing catch/victory/lose to completion
    this.onOneShotDone = null;

    this.invulnerableTimer = 0;
  }

  reset() {
    this.laneIndex = START_LANE;
    this.x = laneCenterX(this.laneIndex);
    this.targetX = this.x;
    this.facing = 1;
    this.moving = false;
    this.anim = 'idle';
    this.frame = 0;
    this.animTime = 0;
    this.oneShot = false;
    this.onOneShotDone = null;
    this.invulnerableTimer = 0;
  }

  /** Move by +1 / -1 lanes (clamped to the lane range). Used by keyboard input. */
  moveByLane(delta) {
    this._goToLane(this.laneIndex + delta);
  }

  /** Jump straight to an absolute lane index. Used by tap/click-on-lane input. */
  goToLaneIndex(index) {
    this._goToLane(index);
  }

  _goToLane(rawIndex) {
    const next = Math.max(0, Math.min(LANES.count - 1, rawIndex));
    if (next === this.laneIndex) return;
    this.facing = next > this.laneIndex ? 1 : -1;
    this.laneIndex = next;
    this.targetX = laneCenterX(next);
    // A lane switch is a deliberate, immediate player action - it should
    // never be blocked by a catch flourish still playing out.
    this._cancelOneShot();
  }

  _cancelOneShot() {
    if (!this.oneShot) return;
    this.oneShot = false;
    this.onOneShotDone = null;
  }

  /** Plays a frame set once, then returns to idle/run and calls onDone(). */
  playOneShot(name, onDone) {
    if (!this.images[name] || !this.images[name].length) return;
    this.anim = name;
    this.frame = 0;
    this.animTime = 0;
    this.oneShot = true;
    this.onOneShotDone = onDone || null;
  }

  update(dt) {
    // -------- lane-to-lane slide (visual only, still discrete lanes) --------
    const dx = this.targetX - this.x;
    const dist = Math.abs(dx);
    if (dist > 0.5) {
      const step = Math.sign(dx) * Math.min(PLAYER.laneMoveSpeed * dt, dist);
      this.x += step;
      this.moving = true;
    } else {
      this.x = this.targetX;
      this.moving = false;
    }

    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt * 1000;

    // -------- animation state selection --------
    if (!this.oneShot) {
      const wantAnim = this.moving ? 'run' : 'idle';
      if (wantAnim !== this.anim) {
        this.anim = wantAnim;
        this.frame = 0;
        this.animTime = 0;
      }
    }

    this._advanceFrame(dt);
  }

  _advanceFrame(dt) {
    const frames = this.images[this.anim];
    if (!frames || !frames.length) return;
    const fps = ANIM_FPS[this.anim] || 10;
    this.animTime += dt;
    const frameDur = 1 / fps;
    while (this.animTime >= frameDur) {
      this.animTime -= frameDur;
      this.frame++;
      if (this.frame >= frames.length) {
        if (this.oneShot) {
          this.oneShot = false;
          const cb = this.onOneShotDone;
          this.onOneShotDone = null;
          this.frame = frames.length - 1;
          if (cb) cb();
        } else {
          this.frame = 0;
        }
      }
    }
  }

  isInvulnerable() {
    return this.invulnerableTimer > 0;
  }

  hit() {
    this.invulnerableTimer = PLAYER.invulnerableMs;
  }

  /** Catch hitbox: a generous vertical band in the wolf's current lane. */
  getCatchBox() {
    const w = this.width * 0.7;
    const h = this.height * 0.55;
    return {
      x: this.x - w / 2,
      y: this.y - h * 0.65,
      w, h
    };
  }

  draw(ctx) {
    const frames = this.images[this.anim];
    if (!frames || !frames.length) return;
    const img = frames[Math.min(this.frame, frames.length - 1)];
    if (!img || !img.complete) return;

    const drawW = this.width;
    const drawH = this.height;

    ctx.save();
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 80) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }
    ctx.translate(this.x, this.y);
    if (this.facing < 0) ctx.scale(-1, 1);
    ctx.drawImage(img, -drawW / 2, -drawH, drawW, drawH);
    ctx.restore();
  }
}
