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

  // Four hens sit still, one per lane. chicken_left/right are the
  // "heads up!" pose shown for ~0.4s before a hen actually lays -
  // that's the classic "Nu, Pogodi!" tell that lets you get in
  // position before anything falls.
  chickens: [
    'assets/chickens/chicken_0.png',
    'assets/chickens/chicken_1.png',
    'assets/chickens/chicken_2.png',
    'assets/chickens/chicken_3.png'
  ],
  chickenAlert: 'assets/chickens/chicken_left.png'
};

// -----------------------------
// FALLING ITEMS
// -----------------------------
// Every falling item is one of these, chosen by weighted random each
// time a hen lays. "kind" drives what happens on catch/miss in engine.js:
//   normal / bonus -> points, catching is good, missing costs a life
//   hazard         -> catching costs a life, missing is a successful dodge
//   life           -> +1 life (or +20pts if already at max lives)
//   shield/wide/slow/gift -> temporary power-ups (see POWERUPS below)
//
// egg_golden, egg_cracked, bomb, coin, heart, star, magnet, clock and
// gift all shipped as unused art in the original project - this table
// is what actually puts them to use.

export const ITEM_TYPES = [
  { id: 'egg_white',   kind: 'normal', points: 10, weight: 30, image: 'assets/items/egg/egg_white.png' },
  { id: 'egg_brown',   kind: 'normal', points: 10, weight: 30, image: 'assets/items/egg/egg_brown.png' },
  { id: 'egg_golden',  kind: 'bonus',  points: 40, weight: 8,  image: 'assets/items/egg/egg_golden.png' },
  { id: 'coin',        kind: 'bonus',  points: 20, weight: 8,  image: 'assets/items/coin.png' },
  { id: 'egg_cracked', kind: 'hazard', points: 0,  weight: 8,  image: 'assets/items/egg/egg_cracked.png' },
  { id: 'bomb',        kind: 'hazard', points: 0,  weight: 6,  image: 'assets/items/bomb.png' },
  { id: 'heart',       kind: 'life',   points: 0,  weight: 4,  image: 'assets/items/heart.png' },
  { id: 'star',        kind: 'shield', points: 0,  weight: 3,  image: 'assets/items/star.png' },
  { id: 'magnet',      kind: 'wide',   points: 0,  weight: 3,  image: 'assets/items/magnet.png' },
  { id: 'clock',       kind: 'slow',   points: 0,  weight: 3,  image: 'assets/items/clock.png' },
  { id: 'gift',        kind: 'gift',   points: 0,  weight: 4,  image: 'assets/items/gift.png' }
];

export const ITEM_VISUAL = {
  radius: 30,
  wobbleSpeed: 6,
  wobbleAmount: 0.08,
  warningMs: 450 // how long a hen "tells" you before it lays
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
  maxLives: 5,
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
// POWER-UPS
// -----------------------------

export const POWERUPS = {
  shieldMs: 4000,   // star: hazards can't hurt you
  wideMs: 6000,     // magnet: wider basket
  wideScale: 1.6,
  slowMs: 5000,     // clock: everything falls slower
  slowFactor: 0.5
};

// -----------------------------
// MILESTONE BONUS LIFE
// -----------------------------
// Every time your score crosses another multiple of this, you get a
// free life (up to PLAYER.maxLives) - a classic arcade "keep going"
// reward that also gives the golden egg / coin bonuses real weight.

export const BONUS_LIFE_SCORE_STEP = 400;

// -----------------------------
// Reserved for future features (safe no-ops today)
// -----------------------------

export const ACHIEVEMENTS = [];
export const DAILY_CHALLENGES = [];

export const STORAGE_PREFIX = 'basketBandit_';
