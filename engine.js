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
  COMBO,
  POWERUPS,
  BONUS_LIFE_SCORE_STEP
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
    this.spawner = new ItemSpawner(images.items, images.chickens, images.chickenAlert);

    this.state = STATE.LOADING;
    this.lastTime = 0;
    this.spawnTimer = 0;
    this.shakeOffset = { x: 0, y: 0 };
    this.buffs = { shieldMs: 0, wideMs: 0, slowMs: 0 };

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
      bestComboThisRun: 0,
      nextBonusLifeAt: BONUS_LIFE_SCORE_STEP
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
    this.buffs = { shieldMs: 0, wideMs: 0, slowMs: 0 };

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
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (this.state === STATE.PLAYING) this.pause();
        else if (this.state === STATE.PAUSED) this.resume();
        return;
      }
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

    this.buffs.shieldMs = Math.max(0, this.buffs.shieldMs - dt * 1000);
    this.buffs.wideMs = Math.max(0, this.buffs.wideMs - dt * 1000);
    this.buffs.slowMs = Math.max(0, this.buffs.slowMs - dt * 1000);
    this.spawner.slowFactor = this.buffs.slowMs > 0 ? POWERUPS.slowFactor : 1;

    this.spawnTimer -= dt * 1000;
    if (this.spawnTimer <= 0) {
      this.spawner.queueSpawn(diff.fallSpeed);
      this.spawnTimer = diff.spawnInterval;
    }

    this.player.update(dt);

    const missed = this.spawner.update(dt);
    missed.forEach(item => this.handleMissed(item));

    const catchBox = this.player.getCatchBox(this.buffs.wideMs > 0 ? POWERUPS.wideScale : 1);
    const caught = this.spawner.checkCatches(catchBox);
    caught.forEach(item => this.catch(item));

    if (s.lives <= 0) {
      this.gameOver();
    }

    this.events.emit('scoreUpdate', this.hud());
  }

  /** Shared "you lost a life" path, used by both a missed egg and an
   *  unshielded hazard catch. */
  loseLife() {
    const s = this.scoreState;
    s.lives--;
    s.missesThisRun++;
    s.combo = 0;

    this.player.hit();
    effects.triggerShake();
    audio.playMiss();
  }

  handleMissed(item) {
    if (item.type.kind === 'hazard') {
      // Letting a bomb/rotten egg fall past you is the correct play.
      effects.spawnScorePopup(item.x, DESIGN_HEIGHT - 90, 'Уклонился!', '#8fd3ff');
      return;
    }
    this.loseLife();
  }

  addScore(points) {
    const s = this.scoreState;
    s.score += points;

    while (s.score >= s.nextBonusLifeAt) {
      s.nextBonusLifeAt += BONUS_LIFE_SCORE_STEP;
      if (s.lives < PLAYER.maxLives) {
        s.lives++;
        effects.spawnScorePopup(this.player.x, this.player.y - 220, '+1 ❤ Бонус!', '#ff6675');
        audio.playPowerUp();
      }
    }
  }

  catch(item) {
    const s = this.scoreState;
    const type = item.type;

    switch (type.kind) {
      case 'normal':
      case 'bonus': {
        s.combo++;
        if (s.combo > s.bestComboThisRun) s.bestComboThisRun = s.combo;

        const multiplier = this.currentMultiplier();
        const points = Math.round(type.points * multiplier);
        this.addScore(points);
        s.catchesThisRun++;

        this.player.playCatch();
        effects.spawnBurst(item.x, item.y, type.kind === 'bonus' ? '#ffd85a' : '#ffe9a8');
        effects.spawnScorePopup(item.x, item.y, `+${points}`, type.kind === 'bonus' ? '#ffd85a' : '#ffffff');
        audio.playCatch();

        if (s.combo > 0 && s.combo % COMBO.stepSize === 0) {
          audio.playCombo(s.combo / COMBO.stepSize);
        }
        break;
      }

      case 'life': {
        this.player.playCatch();
        if (s.lives < PLAYER.maxLives) {
          s.lives++;
          effects.spawnScorePopup(item.x, item.y, '+1 ❤', '#ff6675');
        } else {
          this.addScore(20);
          effects.spawnScorePopup(item.x, item.y, '+20', '#ffffff');
        }
        audio.playPowerUp();
        break;
      }

      case 'shield': {
        this.buffs.shieldMs = POWERUPS.shieldMs;
        this.player.playCatch();
        effects.spawnScorePopup(item.x, item.y, 'ЩИТ!', '#7ec8ff');
        audio.playPowerUp();
        break;
      }

      case 'wide': {
        this.buffs.wideMs = POWERUPS.wideMs;
        this.player.playCatch();
        effects.spawnScorePopup(item.x, item.y, 'ШИРЕ!', '#63e37c');
        audio.playPowerUp();
        break;
      }

      case 'slow': {
        this.buffs.slowMs = POWERUPS.slowMs;
        this.player.playCatch();
        effects.spawnScorePopup(item.x, item.y, 'СЛОУ-МО!', '#b8c5d6');
        audio.playPowerUp();
        break;
      }

      case 'gift': {
        this.player.playCatch();
        const roll = Math.random();
        if (roll < 0.34) {
          this.addScore(50);
          effects.spawnScorePopup(item.x, item.y, '+50', '#ffd85a');
        } else if (roll < 0.67 && s.lives < PLAYER.maxLives) {
          s.lives++;
          effects.spawnScorePopup(item.x, item.y, '+1 ❤', '#ff6675');
        } else {
          this.buffs.shieldMs = POWERUPS.shieldMs;
          effects.spawnScorePopup(item.x, item.y, 'ЩИТ!', '#7ec8ff');
        }
        audio.playPowerUp();
        break;
      }

      case 'hazard': {
        if (this.buffs.shieldMs > 0) {
          effects.spawnScorePopup(item.x, item.y, 'БЛОК!', '#7ec8ff');
          audio.playShieldBlock();
        } else {
          this.loseLife();
          audio.playHazardHit();
        }
        break;
      }
    }
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
      multiplier: this.currentMultiplier(),
      shieldMs: this.buffs.shieldMs,
      wideMs: this.buffs.wideMs,
      slowMs: this.buffs.slowMs
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

      if (this.buffs.shieldMs > 0) this.drawShield(ctx);

      this.player.draw(ctx);
      effects.drawEffects(ctx);
    }

    ctx.restore();
  }

  drawShield(ctx) {
    const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 120);
    ctx.save();
    ctx.strokeStyle = `rgba(126, 200, 255, ${pulse})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(this.player.x, this.player.y - 90, 110, 130, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawBackground() {
    const bg = this.images.background;
    if (!bg || !bg.complete) return;

    const scale = Math.max(DESIGN_WIDTH / bg.width, DESIGN_HEIGHT / bg.height);
    this.ctx.drawImage(bg, 0, 0, bg.width * scale, bg.height * scale);
  }
}
