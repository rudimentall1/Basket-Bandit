/**
 * config.js
 * Basket Bandit
 * Classic "Nu, Pogodi!" style egg catching game
 */

export const GAME_TITLE = 'Basket Bandit';


// -----------------------------------------------------
// Virtual screen
// -----------------------------------------------------

export const DESIGN_WIDTH = 720;
export const DESIGN_HEIGHT = 1280;


// -----------------------------------------------------
// 4 classic lanes
// -----------------------------------------------------

export const LANES = {
  count: 4
};


export function laneCenterX(index) {
  return (DESIGN_WIDTH / LANES.count) * (index + 0.5);
}


export function laneWidth() {
  return DESIGN_WIDTH / LANES.count;
}



// -----------------------------------------------------
// Assets
// -----------------------------------------------------

export const ASSETS = {

  background:
    'assets/bg/background.jpg',

  menuPortrait:
    'assets/ui/portrait_default.png',


  player: {

    idle: {
      dir: 'assets/player/idle',
      count: 4
    },

    run: {
      dir: 'assets/player/run',
      count: 8
    },

    catch: {
      dir: 'assets/player/catch',
      count: 13
    },

    victory: {
      dir: 'assets/player/victory',
      count: 4
    },

    lose: {
      dir: 'assets/player/lose',
      count: 5
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

    count: 2

  }

};




// -----------------------------------------------------
// Egg
// -----------------------------------------------------

export const EGG = {

  radius: 28,

  score: 10,

  wobbleFps: 6

};




// -----------------------------------------------------
// Wolf player
// -----------------------------------------------------

export const PLAYER = {


  width: 170,

  height: 220,


  // bottom of screen
  groundY:
    DESIGN_HEIGHT - 120,


  // fast lane switching
  laneMoveSpeed:
    2600,


  startLives:
    3,


  maxLives:
    3,


  invulnerableMs:
    700

};




// -----------------------------------------------------
// Difficulty
// Similar to original arcade timing
// -----------------------------------------------------

export const LEVELS = [


  {
    level:1,
    scoreToReach:0,
    fallSpeed:300,
    spawnInterval:1200
  },


  {
    level:2,
    scoreToReach:300,
    fallSpeed:340,
    spawnInterval:1050
  },


  {
    level:3,
    scoreToReach:700,
    fallSpeed:390,
    spawnInterval:900
  },


  {
    level:4,
    scoreToReach:1500,
    fallSpeed:450,
    spawnInterval:750
  },


  {
    level:5,
    scoreToReach:3000,
    fallSpeed:520,
    spawnInterval:650
  }

];


export const MAX_FALL_SPEED = 650;

export const MAX_SPAWN_RATE_MS = 600;




// -----------------------------------------------------
// Simple score combo
// -----------------------------------------------------

export const COMBO = {

  stepSize:5,

  multiplierStep:0.5,

  maxMultiplier:3

};




// -----------------------------------------------------
// Achievements
// -----------------------------------------------------

export const ACHIEVEMENTS = [

{
id:'first_catch',
title:'First Egg',
desc:'Catch first egg',
check:s=>s.totalCatches>=1
},


{
id:'combo_10',
title:'Perfect Catch',
desc:'10 eggs combo',
check:s=>s.bestCombo>=10
},


{
id:'score_1000',
title:'Egg Hunter',
desc:'1000 points',
check:s=>s.runScore>=1000
}

];




// -----------------------------------------------------
// Daily
// -----------------------------------------------------

export const DAILY_CHALLENGES = [

{
id:'catch_40',
desc:'Catch 40 eggs',
target:40
},


{
id:'combo_15',
desc:'Combo 15',
target:15
}

];




// -----------------------------------------------------
// Storage
// -----------------------------------------------------

export const STORAGE_PREFIX =
'basketBandit_';
