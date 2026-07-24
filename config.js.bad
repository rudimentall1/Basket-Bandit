/**
 * config.js
 * Basket Bandit
 * Classic 4 lane catcher game
 */

export const GAME_TITLE = 'Basket Bandit';


// -----------------------------------------------------
// DESIGN
// -----------------------------------------------------

export const DESIGN_WIDTH = 720;
export const DESIGN_HEIGHT = 1280;



// -----------------------------------------------------
// LANES
// -----------------------------------------------------

export const LANES = {
  count: 4
};


export function laneWidth(){
  return DESIGN_WIDTH / LANES.count;
}


export function laneCenterX(index){

  return (
    laneWidth() * index +
    laneWidth() / 2
  );

}



// -----------------------------------------------------
// ASSETS
// -----------------------------------------------------

export const ASSETS = {


  background:
    'assets/background.png',



  menuPortrait:
    'assets/player/idle_0.png',



  player:{


    idle:{
      dir:'assets/player',
      prefix:'idle',
      count:4
    },


    run:{
      dir:'assets/player',
      prefix:'run',
      count:6
    },


    catch:{
      dir:'assets/player',
      prefix:'catch',
      count:4
    },


    victory:{
      dir:'assets/player',
      prefix:'victory',
      count:4
    },


    lose:{
      dir:'assets/player',
      prefix:'lose',
      count:4
    }

  },



  chickens:[

    'assets/chickens/chicken_1.png',
    'assets/chickens/chicken_2.png',
    'assets/chickens/chicken_3.png',
    'assets/chickens/chicken_4.png'

  ],



  egg:{

    dir:'assets/items/egg',

    prefix:'egg',

    count:2

  }


};




// -----------------------------------------------------
// EGG
// -----------------------------------------------------

export const EGG = {

  radius:30,

  score:10,

  wobbleFps:6

};




// -----------------------------------------------------
// PLAYER
// -----------------------------------------------------

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




// -----------------------------------------------------
// DIFFICULTY
// -----------------------------------------------------

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




// -----------------------------------------------------
// COMBO
// -----------------------------------------------------

export const COMBO = {

 stepSize:5,

 multiplierStep:0.5,

 maxMultiplier:3

};




// -----------------------------------------------------
// ACHIEVEMENTS
// -----------------------------------------------------

export const ACHIEVEMENTS=[


{
id:'first_catch',
title:'First Catch',
desc:'Catch your first egg.',
check:s=>s.totalCatches>=1
},


{
id:'combo_10',
title:'Combo Master',
desc:'Reach combo 10.',
check:s=>s.bestCombo>=10
},


{
id:'score_1000',
title:'Egg Hunter',
desc:'Score 1000 points.',
check:s=>s.runScore>=1000
},


{
id:'score_5000',
title:'Legend',
desc:'Score 5000 points.',
check:s=>s.runScore>=5000
}


];




// -----------------------------------------------------
// DAILY
// -----------------------------------------------------

export const DAILY_CHALLENGES=[

{
id:'catch40',
desc:'Catch 40 eggs',
target:40
},

{
id:'combo15',
desc:'Reach combo 15',
target:15
},

{
id:'score1500',
desc:'Score 1500',
target:1500
}

];




// -----------------------------------------------------
// STORAGE
// -----------------------------------------------------

export const STORAGE_PREFIX =
'basketBandit_';
