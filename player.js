/**
 * player.js
 * Basket Bandit
 * Classic four-position wolf controller
 */

import {
  PLAYER,
  LANES,
  laneCenterX
} from './config.js';



const ANIM_FPS = {

  idle: 6,

  run: 12,

  catch: 20,

  victory: 8,

  lose: 8

};



const START_LANE = 1;



export class Player {


constructor(images){


this.images = images;



this.laneIndex = START_LANE;


this.x =
laneCenterX(this.laneIndex);


this.targetX =
this.x;



this.y =
PLAYER.groundY;



this.width =
PLAYER.width;


this.height =
PLAYER.height;



this.anim =
'idle';


this.frame = 0;


this.animTime = 0;



this.moving=false;



this.oneShot=false;


this.onOneShotDone=null;



this.invulnerableTimer=0;



}




reset(){


this.laneIndex=START_LANE;


this.x =
laneCenterX(this.laneIndex);


this.targetX =
this.x;


this.anim='idle';


this.frame=0;


this.animTime=0;


this.moving=false;


this.oneShot=false;


this.invulnerableTimer=0;



}





/**
 * Move wolf to one of four classic positions
 */

moveByLane(delta){


let next =
this.laneIndex + delta;


next =
Math.max(
0,
Math.min(
LANES.count-1,
next
));


if(next===this.laneIndex)
return;



this.laneIndex=next;


this.targetX =
laneCenterX(next);



this.anim='run';


}





goToLaneIndex(index){


index =
Math.max(
0,
Math.min(
LANES.count-1,
index
));


if(index===this.laneIndex)
return;



this.laneIndex=index;


this.targetX =
laneCenterX(index);



this.anim='run';


}




update(dt){



// smooth movement

let dx =
this.targetX-this.x;


if(Math.abs(dx)>1){


let speed =
PLAYER.laneMoveSpeed*dt;


this.x +=
Math.sign(dx)*
Math.min(
speed,
Math.abs(dx)
);


this.moving=true;


}
else{


this.x=this.targetX;


this.moving=false;


}




if(this.invulnerableTimer>0)

this.invulnerableTimer -= dt*1000;




if(!this.oneShot){


if(this.moving)

this.setAnimation('run');


else

this.setAnimation('idle');


}



this.advanceAnimation(dt);



}




setAnimation(name){


if(this.anim===name)
return;


if(!this.images[name])
return;


this.anim=name;


this.frame=0;


this.animTime=0;



}




playCatch(){


this.anim='catch';


this.frame=0;


this.animTime=0;


this.oneShot=true;



}





advanceAnimation(dt){


let frames =
this.images[this.anim];


if(!frames || !frames.length)
return;



this.animTime += dt;



let speed =
1/(ANIM_FPS[this.anim]||10);



while(this.animTime>=speed){


this.animTime-=speed;


this.frame++;



if(this.frame>=frames.length){



if(this.oneShot){


this.oneShot=false;


this.frame=0;


this.anim='idle';



}


else{


this.frame=0;


}


}



}



}




/**
 * Basket catch zone
 * Not whole body
 */

getCatchBox(){


return {

x:this.x-90,


y:this.y-80,


w:180,


h:100


};


}





hit(){


this.invulnerableTimer =
PLAYER.invulnerableMs;


}





isInvulnerable(){


return this.invulnerableTimer>0;


}




draw(ctx){


let frames =
this.images[this.anim];


if(!frames || !frames.length)
return;



let img =
frames[
Math.min(
this.frame,
frames.length-1
)
];



if(!img.complete)
return;



ctx.save();



if(this.invulnerableTimer>0)

ctx.globalAlpha =
0.4;



ctx.drawImage(

img,

this.x-this.width/2,

this.y-this.height,

this.width,

this.height

);



ctx.restore();



}


}
