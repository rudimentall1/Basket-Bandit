/**
 * config.js
 * Basket Bandit
 * Classic Nu Pogodi lane catcher
 */

export const GAME_TITLE = 'Basket Bandit';


export const DESIGN_WIDTH = 720;
export const DESIGN_HEIGHT = 1280;



// ----------------------------------------------------
// 4 classic lanes
// ----------------------------------------------------

export const LANES = {

  count:4

};



export function laneWidth(){

  return DESIGN_WIDTH / LANES.count;

}



export function laneCenterX(index){

  return (
    laneWidth() * index
    +
    laneWidth()/2
  );

}



// ----------------------------------------------------
// Assets
// ----------------------------------------------------

export const ASSETS = {


background:
'assets/background.png',



player:{


idle:{
dir:'assets/player/idle',
prefix:'idle',
count:4
},



run:{
dir:'assets/player/running',
prefix:'run',
count:7
},



catch:{
dir:'assets/player/catch',
prefix:'catch',
count:8
},



victory:{
dir:'assets/player/victory',
prefix:'victory',
count:6
},



lose:{
dir:'assets/player/lose',
prefix:'lose',
count:7
}


},




chickens:[

'assets/chickens/chicken_0.png',

'assets/chickens/chicken_1.png',

'assets/chickens/chicken_2.png',

'assets/chickens/chicken_3.png'

],




egg:{


dir:
'assets/items/egg',


prefix:
'egg_white',


count:
1


}



};



// ----------------------------------------------------
// Egg
// ----------------------------------------------------

export const EGG = {


radius:30,


score:10,


wobbleFps:6


};



// ----------------------------------------------------
// Player
// ----------------------------------------------------

export const PLAYER = {


width:160,


height:210,


groundY:
DESIGN_HEIGHT-170,


laneMoveSpeed:
2200,


startLives:
3,


maxLives:
5,


invulnerableMs:
700


};



// ----------------------------------------------------
// Difficulty
// ----------------------------------------------------

export const LEVELS=[


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
}


];



export const MAX_FALL_SPEED=700;


export const MAX_SPAWN_RATE_MS=380;



// ----------------------------------------------------
// Combo
// ----------------------------------------------------

export const COMBO={


stepSize:5,


multiplierStep:0.5,


maxMultiplier:3


};



// ----------------------------------------------------
// Achievements
// ----------------------------------------------------

export const ACHIEVEMENTS=[


{
id:'first_catch',
title:'First Catch',
desc:'Catch first egg',
check:s=>s.totalCatches>=1
},


{
id:'combo_10',
title:'Combo Master',
desc:'Reach combo 10',
check:s=>s.bestCombo>=10
},


{
id:'score_1000',
title:'Egg Hunter',
desc:'Score 1000',
check:s=>s.runScore>=1000
}


];



// ----------------------------------------------------

export const DAILY_CHALLENGES=[

{
id:'catch40',
desc:'Catch 40 eggs',
target:40
},

{
id:'score1500',
desc:'Score 1500',
target:1500
}

];



export const STORAGE_PREFIX='basketBandit_';
