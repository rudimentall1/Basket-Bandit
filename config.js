/**
 * config.js
 * Basket Bandit
 *
 * Central tuning + asset-path config. Nothing here has side effects,
 * so every other module can safely import from it in any order.
 */

export const GAME_TITLE = 'Basket Bandit';

export const DESIGN_WIDTH = 720;
export const DESIGN_HEIGHT = 1280;

// -----------------------------
// LANES
// -----------------------------

export const LANES = {
  count: 4
};

export function laneWidth() {
  return DESIGN_WIDTH / LANES.count;
}

export function laneCenterX(index) {
  return laneWidth() * index + laneWidth() / 2;
}

// -----------------------------
// ASSETS
// -----------------------------

export const ASSETS = {
  background: 'assets/background/background.png',

  player: {
    idle:    { dir: 'assets/player/idle',    prefix: 'idle',    count: 4 },
    run:     { dir: 'assets/player/run',     prefix: 'run',     count: 7 },
    catch:   { dir: 'assets/player/catch',   prefix: 'catch',   count: 8 },
    victory: { dir: 'assets/player/victory', prefix: 'victory', count: 6 },
    lose:    { dir: 'assets/player/lose',    prefix: 'lose',    count: 7 }
  },

  chickens: [
    'assets/chickens/chicken_0.png',
    'assets/chickens/chicken_1.png',
    'assets/chickens/chicken_2.png',
    'assets/chickens/chicken_3.png'
  ],

  egg: {
    frames: [
      'assets/items/egg/egg_white.png',
      'assets/items/egg/egg_brown.png',
      'assets/items/egg/egg_golden.png',
      'assets/items/egg/egg_cracked.png'
    ]
  }
};

// -----------------------------
// EGG
// -----------------------------

export const EGG = {
  radius: 30,
  score: 10,
  wobbleFps: 6
};

// -----------------------------
// PLAYER
// -----------------------------

export const PLAYER = {
  width: 160,
  height: 210,
  groundY: DESIGN_HEIGHT - 170,
  laneMoveSpeed: 2200,
  startLives: 3,
  maxLives: 3,
  invulnerableMs: 700
};

// -----------------------------
// COMBO
// -----------------------------

export const COMBO = {
  stepSize: 5,          // catches per combo "step"
  multiplierStep: 0.5,  // multiplier gained per step
  maxMultiplier: 3
};

// -----------------------------
// Reserved for future features (safe no-ops today)
// -----------------------------

export const ACHIEVEMENTS = [];
export const DAILY_CHALLENGES = [];

export const STORAGE_PREFIX = 'basketBandit_';
