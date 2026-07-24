/**
 * config.js
 * -----------------------------------------------------------------------
 * Single source of truth for tunable numbers, asset paths and data-driven
 * definitions (lanes, levels, achievements). No game logic lives here -
 * only data - so balancing the game means editing this file only.
 *
 * BASKET BANDIT - architecture v2
 * Redesigned around a fixed 4-lane layout in the style of classic
 * "Nu, Pogodi!"-style catch games: the wolf hops between discrete lanes,
 * hens sit above each lane and drop eggs straight down it. No free-roam
 * movement, no powerups, no shop/currency - just clean lane-catching
 * gameplay. (Those systems were stubbed in an earlier draft; see README.md
 * "History" section for what changed and why.)
 * -----------------------------------------------------------------------
 */

export const GAME_TITLE = 'Basket Bandit';

// ---------------------------------------------------------------------------
// Design resolution. The engine scales this to fit any real screen size.
// Portrait oriented because the game is primarily aimed at mobile play.
// ---------------------------------------------------------------------------
export const DESIGN_WIDTH = 720;
export const DESIGN_HEIGHT = 1280;

// ---------------------------------------------------------------------------
// Lanes. Everything - hens, falling eggs, the wolf - snaps to one of these
// fixed columns. laneCenterX(i) is the single place that maps a lane index
// to a design-space x coordinate; nothing else should compute lane x.
// ---------------------------------------------------------------------------
export const LANES = {
  count: 4
};

export function laneCenterX(index) {
  const w = DESIGN_WIDTH / LANES.count;
  return w * (index + 0.5);
}

export function laneWidth() {
  return DESIGN_WIDTH / LANES.count;
}

// ---------------------------------------------------------------------------
// Asset manifest. Every image the game needs, grouped by role. main.js walks
// this object to preload everything before the menu is shown.
// Frame counts reflect exactly what was extracted from the supplied
// reference sheets (see README.md "Asset notes" for details on each sheet).
// Only the animation sets actually used by player.js are listed here -
// two extracted-but-unused sets (a second run cycle and a powerup flourish,
// left over from an earlier non-lane design) live in assets/_extras/ and
// are not preloaded, keeping load time and code paths lean.
// ---------------------------------------------------------------------------
export const ASSETS = {
  background: 'assets/bg/background.jpg',
  menuPortrait: 'assets/ui/portrait_default.png',

  player: {
    idle:    { dir: 'assets/player/idle',    count: 4  },
    run:     { dir: 'assets/player/run',     count: 8  },
    catch:   { dir: 'assets/player/catch',   count: 13 },
    victory: { dir: 'assets/player/victory', count: 4  },
    lose:    { dir: 'assets/player/lose',    count: 5  }
  },

  // One hen per lane, each a distinct extracted character for visual variety.
  chickens: [
    'assets/chickens/chicken_1.png',
    'assets/chickens/chicken_2.png',
    'assets/chickens/chicken_3.png',
    'assets/chickens/chicken_4.png'
  ],

  // The only falling item. Two real frames (small props cropped from the
  // character sheets, upscaled) give it a gentle wobble instead of a
  // perfectly static image - see items.js.
  egg: { dir: 'assets/items/egg', count: 2 }
};

// ---------------------------------------------------------------------------
// The egg - the only collectible in the game.
// ---------------------------------------------------------------------------
export const EGG = {
  radius: 30,
  score: 10,
  wobbleFps: 6
};

// ---------------------------------------------------------------------------
// Player / lane-hop tuning
// ---------------------------------------------------------------------------
export const PLAYER = {
  width: 160,
  height: 210,
  groundY: DESIGN_HEIGHT - 170,
  laneMoveSpeed: 2200,   // px/s - how fast the wolf slides between lane centers
  startLives: 3,
  maxLives: 5,
  invulnerableMs: 700    // brief i-frames / visual grace after losing a life
};

// ---------------------------------------------------------------------------
// Difficulty curve. Level N is active once score >= threshold[N].
// fallSpeed is in design-pixels/second, spawnInterval in milliseconds.
// ---------------------------------------------------------------------------
export const LEVELS = [
  { level: 1, scoreToReach: 0,    fallSpeed: 300, spawnInterval: 900 },
  { level: 2, scoreToReach: 250,  fallSpeed: 340, spawnInterval: 820 },
  { level: 3, scoreToReach: 600,  fallSpeed: 380, spawnInterval: 740 },
  { level: 4, scoreToReach: 1100, fallSpeed: 420, spawnInterval: 670 },
  { level: 5, scoreToReach: 1800, fallSpeed: 460, spawnInterval: 610 },
  { level: 6, scoreToReach: 2700, fallSpeed: 500, spawnInterval: 560 },
  { level: 7, scoreToReach: 3800, fallSpeed: 540, spawnInterval: 520 }
];
export const MAX_FALL_SPEED = 700;
export const MAX_SPAWN_RATE_MS = 380; // hard floor so it never becomes unfair

// ---------------------------------------------------------------------------
// Combo scoring - consecutive catches without a miss raise a score
// multiplier. Missing an egg (any lane) resets it. This is simple scoring
// depth, not a "system", so it stayed through the simplification pass.
// ---------------------------------------------------------------------------
export const COMBO = {
  stepSize: 5,          // every N consecutive catches...
  multiplierStep: 0.5,  // ...adds this much to the multiplier...
  maxMultiplier: 3.0     // ...up to this cap
};

// ---------------------------------------------------------------------------
// Achievements (id must be stable - used as a storage key)
// ---------------------------------------------------------------------------
export const ACHIEVEMENTS = [
  { id: 'first_catch',  title: 'First Catch',      desc: 'Catch your very first egg.',              check: s => s.totalCatches >= 1 },
  { id: 'combo_10',     title: 'On a Roll',        desc: 'Reach a combo of 10.',                     check: s => s.bestCombo >= 10 },
  { id: 'score_1000',   title: 'Egg Hunter',       desc: 'Score 1000 points in one run.',            check: s => s.runScore >= 1000 },
  { id: 'score_5000',   title: 'Master Collector', desc: 'Score 5000 points in one run.',            check: s => s.runScore >= 5000 },
  { id: 'level_5',      title: 'Speed Demon',      desc: 'Reach level 5.',                           check: s => s.runLevel >= 5 },
  { id: 'no_miss_500',  title: 'Steady Hands',     desc: 'Score 500 points without missing an egg.', check: s => s.runScore >= 500 && s.missesThisRun === 0 }
];

// ---------------------------------------------------------------------------
// Daily challenge templates - one is deterministically picked per calendar
// day (see levels.js -> getDailyChallenge). Kept intentionally simple.
// ---------------------------------------------------------------------------
export const DAILY_CHALLENGES = [
  { id: 'catch_40_total',    desc: 'Catch 40 eggs in a single run.',                    target: 40 },
  { id: 'reach_combo_15',    desc: 'Reach a combo of 15 in a single run.',              target: 15 },
  { id: 'score_1500',        desc: 'Score at least 1500 points in a single run.',       target: 1500 },
  { id: 'catch_20_no_miss',  desc: 'Catch 20 eggs in a row without missing one.',       target: 20 }
];

// ---------------------------------------------------------------------------
// LocalStorage namespace - see storage.js
// ---------------------------------------------------------------------------
export const STORAGE_PREFIX = 'basketBandit_';
