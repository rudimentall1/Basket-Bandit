/**
 * engine.js
 * -----------------------------------------------------------------------
 * The game loop. Owns the canvas, the update/draw cycle, the play-state
 * machine (menu / playing / paused / gameover), input (keyboard lane-hop
 * + tap/click-a-lane + swipe), responsive scaling, and orchestrates
 * player.js + items.js + effects.js each frame.
 *
 * engine.js knows nothing about DOM menus/HUD markup - it only emits
 * events (via the tiny EventEmitter below) that ui.js subscribes to.
 * This keeps rendering/simulation cleanly separated from presentation.
 * -----------------------------------------------------------------------
 */
import { DESIGN_WIDTH, DESIGN_HEIGHT, PLAYER, COMBO, EGG, LANES, laneCenterX, laneWidth } from './config.js';
import { Player } from './player.js';
import { ItemSpawner } from './items.js';
import * as effects from './effects.js';
import { getDifficultyForScore } from './levels.js';
import * as audio from './audio.js';

class EventEmitter {
  constructor() { this.listeners = {}; }
  on(name, fn) { (this.listeners[name] ||= []).push(fn); return () => this.off(name, fn); }
  off(name, fn) { this.listeners[name] = (this.listeners[name] || []).filter(f => f !== fn); }
  emit(name, payload) { (this.listeners[name] || []).forEach(fn => { try { fn(payload); } catch (e) { console.error(`[engine] listener for "${name}" threw:`, e); } }); }
}

export const STATE = Object.freeze({
  LOADING: 'loading',
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAMEOVER: 'gameover'
});

const SWIPE_THRESHOLD_PX = 40; // design-space px for a horizontal swipe to count as a lane change

export class GameEngine {
  constructor(canvas, images) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.images = images;
    this.events = new EventEmitter();

    this.player = new Player(images.player);
    this.spawner = new ItemSpawner(images.egg);

    this.state = STATE.LOADING;
    this.lastTime = 0;
    this.spawnTimer = 0;

    this.scoreState = this._freshRunState();

    this.chickenBob = 0;
    this._resizeHandler = () => this.handleResize();
    window.addEventListener('resize', this._resizeHandler);
    window.addEventListener('orientationchange', this._resizeHandler);

    this._bindInput();
    this.handleResize();
  }

  _freshRunState() {
    return {
      score: 0,
      lives: PLAYER.startLives,
      combo: 0,
      comboMultiplier: 1,
      bestComboThisRun: 0,
      catchesThisRun: 0,
      missesThisRun: 0,
      level: 1,
      fallSpeed: 300,
      spawnInterval: 900
    };
  }

  // ---------------------------------------------------------------------
  // Public state transitions
  // ---------------------------------------------------------------------
  goToMenu() {
    this.state = STATE.MENU;
    this.events.emit('stateChange', this.state);
  }

  startRun() {
    this.scoreState = this._freshRunState();
    this.player.reset();
    this.spawner.reset();
    effects.resetEffects();
    this.spawnTimer = 0;
    this.state = STATE.PLAYING;
    this.events.emit('stateChange', this.state);
    this.events.emit('scoreUpdate', this._hudSnapshot());
  }

  pause() {
    if (this.state !== STATE.PLAYING) return;
    this.state = STATE.PAUSED;
    this.events.emit('stateChange', this.state);
  }

  resume() {
    if (this.state !== STATE.PAUSED) return;
    this.state = STATE.PLAYING;
    this.lastTime = performance.now();
    this.events.emit('stateChange', this.state);
  }

  _endRun() {
    this.state = STATE.GAMEOVER;
    const s = this.scoreState;
    const isNewBest = this._isNewBest(s.score);
    this.player.playOneShot(isNewBest ? 'victory' : 'lose');
    if (isNewBest) audio.playVictoryFanfare(); else audio.playGameOver();
    this.events.emit('runEnded', {
      isNewBest,
      score: s.score,
      level: s.level,
      catchesThisRun: s.catchesThisRun,
      bestComboThisRun: s.bestComboThisRun,
      missesThisRun: s.missesThisRun
    });
    this.events.emit('stateChange', this.state);
  }

  _isNewBest(score) {
    // engine stays decoupled from storage.js; ui.js passes the previous
    // best in via this hook if it wants victory/lose to reflect it.
    return typeof this.getBestScore === 'function' ? score > this.getBestScore() : false;
  }

  // ---------------------------------------------------------------------
  // Input - keyboard (discrete lane hop), pointer tap-a-lane, and swipe
  // ---------------------------------------------------------------------
  _bindInput() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return; // one press = one lane hop, no OS auto-repeat spam
      if (this.state === STATE.PLAYING) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.player.moveByLane(-1);
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.player.moveByLane(1);
      }
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (this.state === STATE.PLAYING) this.pause();
        else if (this.state === STATE.PAUSED) this.resume();
      }
    });

    const toDesignX = (clientX) => {
      const rect = this.canvas.getBoundingClientRect();
      const ratio = DESIGN_WIDTH / rect.width;
      return (clientX - rect.left) * ratio;
    };
    const laneAtDesignX = (x) => Math.max(0, Math.min(LANES.count - 1, Math.floor(x / laneWidth())));

    let dragStartX = null;
    let dragHandled = false;

    this.canvas.addEventListener('pointerdown', (e) => {
      audio.unlockAudio();
      if (this.state !== STATE.PLAYING) return;
      dragStartX = toDesignX(e.clientX);
      dragHandled = false;
    });

    window.addEventListener('pointermove', (e) => {
      if (dragStartX === null || dragHandled || this.state !== STATE.PLAYING) return;
      const x = toDesignX(e.clientX);
      if (Math.abs(x - dragStartX) >= SWIPE_THRESHOLD_PX) {
        this.player.moveByLane(x > dragStartX ? 1 : -1);
        dragHandled = true; // one swipe = one lane hop until release
      }
    });

    window.addEventListener('pointerup', (e) => {
      if (dragStartX !== null && !dragHandled && this.state === STATE.PLAYING) {
        // treated as a tap, not a swipe -> jump straight to the tapped lane
        this.player.goToLaneIndex(laneAtDesignX(toDesignX(e.clientX)));
      }
      dragStartX = null;
      dragHandled = false;
    });

    window.addEventListener('pointercancel', () => {
      dragStartX = null;
      dragHandled = false;
    });
  }

  // ---------------------------------------------------------------------
  // Responsive canvas scaling (design resolution -> real device pixels).
  // The canvas's immediate parent ("#stage") is resized to the letterboxed
  // CSS size; the canvas and the DOM UI overlay both fill #stage at 100%,
  // so the overlay always lines up with the canvas with no separate math.
  // ---------------------------------------------------------------------
  handleResize() {
    const stage = this.canvas.parentElement;
    const wrap = stage.parentElement;
    const availW = wrap.clientWidth;
    const availH = wrap.clientHeight;
    const designRatio = DESIGN_WIDTH / DESIGN_HEIGHT;
    let cssW = availW;
    let cssH = availW / designRatio;
    if (cssH > availH) {
      cssH = availH;
      cssW = availH * designRatio;
    }
    stage.style.width = `${cssW}px`;
    stage.style.height = `${cssH}px`;

    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.canvas.width = Math.round(DESIGN_WIDTH * dpr);
    this.canvas.height = Math.round(DESIGN_HEIGHT * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ---------------------------------------------------------------------
  // Main loop
  // ---------------------------------------------------------------------
  start() {
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this._loop(t));
  }

  _loop(time) {
    const dtRaw = (time - this.lastTime) / 1000;
    this.lastTime = time;
    const dt = Math.min(dtRaw, 1 / 20); // clamp to avoid huge steps after tab switch

    if (this.state === STATE.PLAYING) this._update(dt);
    this._draw(dt);

    requestAnimationFrame((t) => this._loop(t));
  }

  _update(dt) {
    const s = this.scoreState;
    const diff = getDifficultyForScore(s.score);
    s.level = diff.level;
    s.fallSpeed = diff.fallSpeed;
    s.spawnInterval = diff.spawnInterval;

    this.spawnTimer -= dt * 1000;
    if (this.spawnTimer <= 0) {
      this.spawner.spawn(s.fallSpeed);
      this.spawnTimer = s.spawnInterval;
    }

    this.player.update(dt);

    const missed = this.spawner.update(dt);
    for (const item of missed) this._onMiss(item);

    const caught = this.spawner.checkCatches(this.player.getCatchBox());
    for (const item of caught) this._onCatch(item);

    effects.updateEffects(dt);

    if (s.lives <= 0) {
      this._endRun();
      return;
    }

    this.events.emit('scoreUpdate', this._hudSnapshot());
  }

  _onCatch(item) {
    const s = this.scoreState;
    s.catchesThisRun++;

    s.combo++;
    s.bestComboThisRun = Math.max(s.bestComboThisRun, s.combo);
    const steps = Math.floor(s.combo / COMBO.stepSize);
    s.comboMultiplier = Math.min(COMBO.maxMultiplier, 1 + steps * COMBO.multiplierStep);
    if (s.combo > 0 && s.combo % COMBO.stepSize === 0) audio.playCombo(steps);

    const awarded = Math.round(EGG.score * s.comboMultiplier);
    s.score += awarded;

    effects.spawnScorePopup(item.x, item.y, `+${awarded}`, '#fff6cf');
    effects.spawnBurst(item.x, item.y, '#fff1c4', 10);
    this.player.playOneShot('catch');
    audio.playCatch();

    this.events.emit('catch', { awarded, combo: s.combo, multiplier: s.comboMultiplier });
  }

  _onMiss(item) {
    const s = this.scoreState;
    s.missesThisRun++;
    s.combo = 0;
    s.comboMultiplier = 1;
    if (!this.player.isInvulnerable()) {
      s.lives = Math.max(0, s.lives - 1);
      this.player.hit();
    }
    effects.triggerShake(10, 0.22);
    audio.playMiss();
    this.events.emit('miss', { livesLeft: s.lives, lane: item.lane });
  }

  _hudSnapshot() {
    const s = this.scoreState;
    return {
      score: s.score,
      lives: s.lives,
      combo: s.combo,
      multiplier: s.comboMultiplier,
      level: s.level
    };
  }

  // ---------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------
  _draw(dt) {
    const ctx = this.ctx;
    ctx.save();

    const shake = (this.state === STATE.PLAYING) ? effects.getShakeOffset(dt) : { x: 0, y: 0 };
    ctx.translate(shake.x, shake.y);

    this._drawBackground(dt);
    this._drawLaneGuides();

    if (this.state === STATE.PLAYING || this.state === STATE.PAUSED || this.state === STATE.GAMEOVER) {
      this.spawner.draw(ctx);
      this.player.draw(ctx);
      effects.drawEffects(ctx);
    }

    ctx.restore();

    if (this.state === STATE.PAUSED) {
      ctx.fillStyle = 'rgba(10,14,20,0.55)';
      ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    }
  }

  _drawBackground(dt) {
    const ctx = this.ctx;
    const bg = this.images.background;
    if (bg && bg.complete) {
      const scale = Math.max(DESIGN_WIDTH / bg.width, DESIGN_HEIGHT / bg.height);
      const w = bg.width * scale;
      const h = bg.height * scale;
      ctx.drawImage(bg, (DESIGN_WIDTH - w) / 2, (DESIGN_HEIGHT - h) / 2, w, h);
      // subtle darken/vignette so cartoon foreground sprites stay readable
      // against the more photographic background art.
      const grad = ctx.createLinearGradient(0, 0, 0, DESIGN_HEIGHT);
      grad.addColorStop(0, 'rgba(10,20,35,0.28)');
      grad.addColorStop(0.5, 'rgba(10,20,35,0.05)');
      grad.addColorStop(1, 'rgba(10,20,35,0.35)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    } else {
      ctx.fillStyle = '#bcdfff';
      ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    }

    // one hen per lane, gently bobbing
    this.chickenBob += dt;
    const chickens = this.images.chickens || [];
    for (let i = 0; i < LANES.count; i++) {
      const img = chickens[i % chickens.length];
      if (!img || !img.complete) continue;
      const cw = 108;
      const ch = cw * (img.height / img.width);
      const x = laneCenterX(i);
      const bob = Math.sin(this.chickenBob * 1.6 + i) * 5;
      ctx.drawImage(img, x - cw / 2, 20 + bob, cw, ch);
    }
  }

  /** Faint vertical separators so the 4 lanes read clearly at a glance. */
  _drawLaneGuides() {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 2;
    for (let i = 1; i < LANES.count; i++) {
      const x = laneWidth() * i;
      ctx.beginPath();
      ctx.moveTo(x, 140);
      ctx.lineTo(x, DESIGN_HEIGHT - 40);
      ctx.stroke();
    }
    ctx.restore();
  }

  destroy() {
    window.removeEventListener('resize', this._resizeHandler);
    window.removeEventListener('orientationchange', this._resizeHandler);
  }
}
