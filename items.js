/**
 * items.js
 * Basket Bandit
 *
 * Classic Nu Pogodi style eggs.
 * Four lanes.
 * Chicken drops egg straight down.
 */

import {
  EGG,
  LANES,
  laneCenterX,
  DESIGN_HEIGHT
} from './config.js';



export class ItemSpawner {


constructor(eggFrames){


this.eggFrames = eggFrames || [];


this.items=[];


this.nextId=1;


this.animTimer=0;


this.animFrame=0;



}




reset(){


this.items=[];


this.nextId=1;


this.animTimer=0;


this.animFrame=0;


}




/**
 * Spawn egg from chicken position
 */

spawn(fallSpeed){



const lane =
Math.floor(
Math.random()*LANES.count
);



this.items.push({


id:this.nextId++,


lane,


x:laneCenterX(lane),


/*
 * chicken area
 */

y:120,


speed:
fallSpeed,


caught:false,


missed:false,


broken:false



});



}




update(dt){



// egg animation

this.animTimer += dt;


if(this.animTimer > 1/EGG.wobbleFps){


this.animTimer=0;


if(this.eggFrames.length)

this.animFrame =
(this.animFrame+1)
%
this.eggFrames.length;


}



const missed=[];



for(const egg of this.items){



if(egg.caught)
continue;



egg.y += egg.speed*dt;



// bottom reached

if(
egg.y-EGG.radius >
DESIGN_HEIGHT
){


egg.missed=true;


missed.push(egg);


}


}



this.items =
this.items.filter(
e=>
!e.caught &&
!e.missed
);



return missed;



}





/**
 * Basket collision
 */

checkCatches(box){



const caught=[];



for(const egg of this.items){



if(egg.caught)
continue;



const hit =

egg.x > box.x &&

egg.x < box.x+box.w &&

egg.y > box.y &&

egg.y < box.y+box.h;



if(hit){


egg.caught=true;


caught.push(egg);


}



}



return caught;


}





draw(ctx){



const img =
this.eggFrames[this.animFrame]
||
this.eggFrames[0];



for(const egg of this.items){



if(img && img.complete){


ctx.drawImage(

img,

egg.x-EGG.radius,

egg.y-EGG.radius,

EGG.radius*2,

EGG.radius*2

);


}

else{


ctx.fillStyle='#fff4cc';


ctx.beginPath();


ctx.arc(

egg.x,

egg.y,

EGG.radius,

0,

Math.PI*2

);


ctx.fill();


}



}



}



}
