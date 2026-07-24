/**
 * config.js
 * -----------------------------------------------------------------------
 * Basket Bandit
 *
 * Data only:
 * - screen size
 * - lanes
 * - assets
 * - gameplay tuning
 * - achievements
 *
 * Architecture stays compatible with:
 * engine.js
 * player.js
 * items.js
 * ui.js
 * -----------------------------------------------------------------------
 */

export const GAME_TITLE = 'Basket Bandit';


// ---------------------------------------------------------------------------
// DESIGN RESOLUTION
// ---------------------------------------------------------------------------

export const DESIGN_WIDTH = 720;
export const DESIGN_HEIGHT = 1280;


// ---------------------------------------------------------------------------
// LANES
//
// Four fixed catching positions.
// Inspired by "Nu, Pogodi!" style:
// chickens above -> egg falls -> wolf catches below
// ---------------------------------------------------------------------------

export const LANES = {
  count: 4,

  positions: [
    {
      x: 90,
      chickenX: 90
    },
    {
      x: 250,
      chickenX: 250
    },
    {
      x: 470,
      chickenX: 470
    },
    {
      x: 630,
      chickenX: 630
    }
  ]
};


export function laneCenterX(index) {
  return LANES.positions[index].x;
}


export function laneWidth() {
  return DESIGN_WIDTH / LANES.count;
}


// ---------------------------------------------------------------------------
// ASSETS
//
// Matches real files:
//
// assets/background/background.png
// assets/player/run/run_0.png
// assets/items/egg/...
// ---------------------------------------------------------------------------

export const ASSETS = {


  background:
    'assets/background/background.png',


  player: {

    idle: {
      dir: 'assets/player/idle',
      prefix: 'idle',
      count: 4
    },


    run: {
      dir: 'assets/player/run',
      prefix: 'run',
      count: 7
    },


    catch: {
      dir: 'assets/player/catch',
      prefix: 'catch',
      count: 8
    },


    victory: {
      dir: 'assets/player/victory',
      prefix: 'victory',
      count: 6
    },


    lose: {
      dir: 'assets/player/lose',
      prefix: 'lose',
      count: 7
    }

  },


  chickens: [

    'assets/chickens/chicken_1.png',
    'assets/chickens/chicken_2.png',
    'assets/chickens/chicken_3.png',
    'assets/chickens/chicken_4.png'

  ],


  egg: {

    dir:
      'assets/items/egg',

    prefix:
      'egg',

    count:
      4

  }

};



// ---------------------------------------------------------------------------
// EGG
// ---------------------------------------------------------------------------

export const EGG = {

  radius: 30,

  score: 10,

  wobbleFps: 6

};



// ---------------------------------------------------------------------------
// PLAYER
// ---------------------------------------------------------------------------

export const PLAYER = {


  width:160,

  height:210,


  groundY:
    DESIGN_HEIGHT - 170,


  laneMoveSpeed:
    2200,


  startLives:
    3,


  maxLives:
    5,


  invulnerableMs:
    700

};



// ---------------------------------------------------------------------------
// LEVEL DIFFICULTY
// ---------------------------------------------------------------------------

export const LEVELS = [

  {
    level:1,
    scoreToReach:0,
    fallSpeed:300,
    spawnInterval:900
  },


  {
    level:2,
    scoreToReach:250,
    fallSpeed:340,
    spawnInterval:820
  },


  {
    level:3,
    scoreToReach:600,
    fallSpeed:380,
    spawnInterval:740
  },


  {
    level:4,
    scoreToReach:1100,
    fallSpeed:420,
    spawnInterval:670
  },


  {
    level:5,
    scoreToReach:1800,
    fallSpeed:460,
    spawnInterval:610
  },


  {
    level:6,
    scoreToReach:2700,
    fallSpeed:500,
    spawnInterval:560
  },


  {
    level:7,
    scoreToReach:3800,
    fallSpeed:540,
    spawnInterval:520
  }

];


export const MAX_FALL_SPEED = 700;

export const MAX_SPAWN_RATE_MS = 380;



// ---------------------------------------------------------------------------
// COMBO
// ---------------------------------------------------------------------------

export const COMBO = {

  stepSize:5,

  multiplierStep:0.5,

  maxMultiplier:3.0

};



// ---------------------------------------------------------------------------
// ACHIEVEMENTS
// ---------------------------------------------------------------------------

export const ACHIEVEMENTS = [

  {
    id:'first_catch',
    title:'First Catch',
    desc:'Catch your first egg.',
    check:s => s.totalCatches >= 1
  },


  {
    id:'combo_10',
    title:'On a Roll',
    desc:'Reach combo 10.',
    check:s => s.bestCombo >= 10
  },


  {
    id:'score_1000',
    title:'Egg Hunter',
    desc:'Score 1000 points.',
    check:s => s.runScore >= 1000
  },


  {
    id:'score_5000',
    title:'Master Collector',
    desc:'Score 5000 points.',
    check:s => s.runScore >= 5000
  },


  {
    id:'level_5',
    title:'Speed Demon',
    desc:'Reach level 5.',
    check:s => s.runLevel >= 5
  },


  {
    id:'no_miss_500',
    title:'Steady Hands',
    desc:'Score 500 without missing.',
    check:s =>
      s.runScore >= 500 &&
      s.missesThisRun === 0
  }

];



// ---------------------------------------------------------------------------
// DAILY CHALLENGES
// ---------------------------------------------------------------------------

export const DAILY_CHALLENGES = [

  {
    id:'catch_40_total',
    desc:'Catch 40 eggs in one run.',
    target:40
  },


  {
    id:'reach_combo_15',
    desc:'Reach combo 15.',
    target:15
  },


  {
    id:'score_1500',
    desc:'Score 1500 points.',
    target:1500
  },


  {
    id:'catch_20_no_miss',
    desc:'Catch 20 eggs without missing.',
    target:20
  }

];



// ---------------------------------------------------------------------------
// STORAGE
// ---------------------------------------------------------------------------

export const STORAGE_PREFIX =
  'basketBandit_';
