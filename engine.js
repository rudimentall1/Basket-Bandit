/**
 * engine.js
 * Basket Bandit
 *
 * Core game loop: owns game state, wires the player + item spawner +
 * effects + audio together, and drives update/draw each frame.
 */

import {
  DESIGN_WIDTH,
  DESIGN_HEIGHT,
  PLAYER,
  LANES,
  EGG,
  COMBO
} from './config.js';

import { Player } from './player.js';
import { ItemSpawner } from './items.js';
import * as effects from './effects.js';
import { getDifficultyForScore } from './levels.js';
import * as audio from './audio.js';

class EventEmitter {
  constructor() {
    this.listeners = {};
  }
  on(name, fn) {
    (this.listeners[name] ||= []).push(fn);
  }
  emit(name, data) {
    (this.listeners[name] || []).forEach(fn => {
      try {
        fn(data);
      } catch (e) {
        console.error(e);
      }
    });
  }
}

export const STATE = Object.freeze({
  LOADING: 'loading',
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAMEOVER: 'gameover'
});

const SWIPE_DISTANCE = 40;

export class GameEngine {
  constructor(canvas, images) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.images = images;

    this.events = new EventEmitter();

    this.player = new Player(images.player);
    this.spawner = new ItemSpawner(images.egg, images.chickens);

    this.state = STATE.LOADING;
    this.lastTime = 0;
    this.spawnTimer = 0;
    this.shakeOffset = { x: 0, y: 0 };

    this.scoreState = this.newGame();

    this.resizeHandler = () => this.resize();
    window.addEventListener('resize', this.resizeHandler);

    this.bindInput();
    this.resize();
  }

  newGame() {
    return {
      score: 0,
      lives: PLAYER.startLives,
      level: 1,
      combo: 0,
      catchesThisRun: 0,
      missesThisRun: 0,
      bestComboThisRun: 0
    };
  }

  goToMenu() {
    this.state = STATE.MENU;
    this.events.emit('stateChange', this.state);
  }

  startRun() {
    this.scoreState = this.newGame();
    this.player.reset();
    this.spawner.reset();
    effects.resetEffects();

    this.spawnTimer = 500;
    this.state = STATE.PLAYING;

    this.events.emit('stateChange', this.state);
    this.events.emit('scoreUpdate', this.hud());
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
  }

  bindInput() {
    window.addEventListener('keydown', e => {
      if (this.state !== STATE.PLAYING) return;
      if (e.key === 'ArrowLeft' || e.key === 'a') this.player.moveByLane(-1);
      if (e.key === 'ArrowRight' || e.key === 'd') this.player.moveByLane(1);
    });

    let startX = null;

    this.canvas.addEventListener('pointerdown', e => {
      if (this.state !== STATE.PLAYING) return;
      audio.unlockAudio();
      startX = e.clientX;
    });

    window.addEventListener('pointerup', e => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > SWIPE_DISTANCE) {
        this.player.moveByLane(dx > 0 ? 1 : -1);
      }
      startX = null;
    });
  }

  resize() {
    const stage = this.canvas.parentElement;
    const wrap = stage.parentElement;

    const w = wrap.clientWidth;
    const h = wrap.clientHeight;

    const ratio = DESIGN_WIDTH / DESIGN_HEIGHT;
    let cw = w;
    let ch = w / ratio;

    if (ch > h) {
      ch = h;
      cw = h * ratio;
    }

    stage.style.width = `${cw}px`;
    stage.style.height = `${ch}px`;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = DESIGN_WIDTH * dpr;
    this.canvas.height = DESIGN_HEIGHT * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame(t => this.loop(t));
  }

  loop(t) {
    let dt = (t - this.lastTime) / 1000;
    this.lastTime = t;
    dt = Math.min(dt, 0.05);

    if (this.state === STATE.PLAYING) {
      this.update(dt);
    }

    // Effects (score popups, particle bursts, screen shake) keep animating
    // through PLAYING and the GAMEOVER freeze-frame, but properly freeze
    // while paused.
    if (this.state === STATE.PLAYING || this.state === STATE.GAMEOVER) {
      effects.updateEffects(dt);
      this.shakeOffset = effects.getShakeOffset(dt);
    }

    this.draw();

    requestAnimationFrame(x => this.loop(x));
  }

  update(dt) {
    const s = this.scoreState;

    const diff = getDifficultyForScore(s.score);
    s.level = diff.level;

    this.spawnTimer -= dt * 1000;
    if (this.spawnTimer <= 0) {
      this.spawner.spawn(diff.fallSpeed);
      this.spawnTimer = diff.spawnInterval;
    }

    this.player.update(dt);

    const missed = this.spawner.update(dt);
    missed.forEach(() => this.miss());

    const caught = this.spawner.checkCatches(this.player.getCatchBox());
    caught.forEach(egg => this.catch(egg));

    if (s.lives <= 0) {
      this.gameOver();
    }

    this.events.emit('scoreUpdate', this.hud());
  }

  catch(item) {
    const s = this.scoreState;

    s.combo++;
    if (s.combo > s.bestComboThisRun) s.bestComboThisRun = s.combo;

    const multiplier = this.currentMultiplier();
    const points = Math.round(EGG.score * multiplier);
    s.score += points;
    s.catchesThisRun++;

    this.player.playCatch();
    effects.spawnBurst(item.x, item.y);
    effects.spawnScorePopup(item.x, item.y, `+${points}`, multiplier > 1 ? '#ffd85a' : '#ffffff');
    audio.playCatch();

    if (s.combo > 0 && s.combo % COMBO.stepSize === 0) {
      audio.playCombo(s.combo / COMBO.stepSize);
    }
  }

  miss() {
    const s = this.scoreState;
    s.lives--;
    s.missesThisRun++;
    s.combo = 0;

    this.player.hit();
    effects.triggerShake();
    audio.playMiss();
  }

  currentMultiplier() {
    const s = this.scoreState;
    return Math.min(
      COMBO.maxMultiplier,
      1 + Math.floor(s.combo / COMBO.stepSize) * COMBO.multiplierStep
    );
  }

  hud() {
    const s = this.scoreState;
    return {
      score: s.score,
      lives: s.lives,
      level: s.level,
      combo: s.combo,
      multiplier: this.currentMultiplier()
    };
  }

  gameOver() {
    this.state = STATE.GAMEOVER;
    audio.playGameOver();

    this.events.emit('stateChange', this.state);
    this.events.emit('runEnded', this.scoreState);
  }

  draw() {
    const ctx = this.ctx;

    ctx.clearRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

    ctx.save();
    ctx.translate(this.shakeOffset.x, this.shakeOffset.y);

    this.drawBackground();

    if (this.state === STATE.PLAYING || this.state === STATE.GAMEOVER) {
      this.spawner.draw(ctx);
      this.player.draw(ctx);
      effects.drawEffects(ctx);
    }

    ctx.restore();
  }

  drawBackground() {
    const bg = this.images.background;
    if (!bg || !bg.complete) return;

    const scale = Math.max(DESIGN_WIDTH / bg.width, DESIGN_HEIGHT / bg.height);
    this.ctx.drawImage(bg, 0, 0, bg.width * scale, bg.height * scale);
  }
}
