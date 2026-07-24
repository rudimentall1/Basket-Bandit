/**
 * engine.js
 * Basket Bandit
 * Classic "Nu, Pogodi!" style gameplay engine
 *
 * Wolf moves between 4 fixed lanes.
 * Eggs fall vertically from chickens.
 * Catch with basket.
 */

import {
  DESIGN_WIDTH,
  DESIGN_HEIGHT,
  PLAYER,
  EGG,
  LANES,
  laneCenterX,
  laneWidth
} from './config.js';

import { Player } from './player.js';
import { ItemSpawner } from './items.js';
import * as effects from './effects.js';
import { getDifficultyForScore } from './levels.js';
import * as audio from './audio.js';


class EventEmitter {

  constructor(){
    this.listeners={};
  }

  on(name,fn){
    (this.listeners[name] ||= []).push(fn);
  }

  emit(name,data){
    (this.listeners[name]||[]).forEach(fn=>{
      try{
        fn(data);
      }catch(e){
        console.error(e);
      }
    });
  }
}


export const STATE = Object.freeze({

  LOADING:'loading',
  MENU:'menu',
  PLAYING:'playing',
  PAUSED:'paused',
  GAMEOVER:'gameover'

});


const SWIPE_DISTANCE = 40;



export class GameEngine {


constructor(canvas,images){

  this.canvas=canvas;

  this.ctx=canvas.getContext(
    '2d',
    {alpha:false}
  );

  this.images=images;

  this.events=new EventEmitter();


  this.player=new Player(
    images.player
  );


  this.spawner=new ItemSpawner(
    images.egg
  );


  this.state=STATE.LOADING;


  this.lastTime=0;

  this.spawnTimer=0;


  // последовательность куриц
  this.nextEggLane=0;


  this.scoreState=this.newGame();


  this.chickenBob=0;


  this._resizeHandler=()=>this.resize();


  window.addEventListener(
    'resize',
    this._resizeHandler
  );


  this.bindInput();

  this.resize();

}



newGame(){

return {

score:0,

lives:PLAYER.startLives,

catchesThisRun:0,

missesThisRun:0,

level:1,

fallSpeed:220,

spawnInterval:1400

};

}




goToMenu(){

this.state=STATE.MENU;

this.events.emit(
'stateChange',
this.state
);

}



startRun(){


this.scoreState=this.newGame();


this.player.reset();

this.spawner.reset();


this.spawnTimer=700;


this.nextEggLane=
Math.floor(
Math.random()*LANES.count
);



effects.resetEffects();


this.state=STATE.PLAYING;


this.events.emit(
'stateChange',
this.state
);


this.events.emit(
'scoreUpdate',
this.hud()
);


}




pause(){

if(this.state!==STATE.PLAYING)
return;


this.state=STATE.PAUSED;


this.events.emit(
'stateChange',
this.state
);


}



resume(){

if(this.state!==STATE.PAUSED)
return;


this.state=STATE.PLAYING;


this.lastTime=performance.now();

}



bindInput(){


window.addEventListener(
'keydown',
e=>{


if(this.state!==STATE.PLAYING)
return;


if(
e.key==='ArrowLeft' ||
e.key==='a'
){

this.player.moveByLane(-1);

}


if(
e.key==='ArrowRight' ||
e.key==='d'
){

this.player.moveByLane(1);

}


});


let start=null;



this.canvas.addEventListener(
'pointerdown',
e=>{

if(this.state!==STATE.PLAYING)
return;


audio.unlockAudio();


start=e.clientX;


});



window.addEventListener(
'pointerup',
e=>{


if(start===null)
return;


let dx=e.clientX-start;


if(Math.abs(dx)>SWIPE_DISTANCE){

this.player.moveByLane(
dx>0?1:-1
);

}


start=null;


});


}



resize(){

const stage=this.canvas.parentElement;
const wrap=stage.parentElement;


let w=wrap.clientWidth;
let h=wrap.clientHeight;


let ratio=
DESIGN_WIDTH/DESIGN_HEIGHT;


let cw=w;
let ch=w/ratio;


if(ch>h){

ch=h;
cw=h*ratio;

}


stage.style.width=cw+'px';
stage.style.height=ch+'px';


let dpr=Math.min(
window.devicePixelRatio||1,
2.5
);


this.canvas.width=
DESIGN_WIDTH*dpr;


this.canvas.height=
DESIGN_HEIGHT*dpr;


this.ctx.setTransform(
dpr,0,0,dpr,0,0
);


}





start(){

this.lastTime=performance.now();

requestAnimationFrame(
t=>this.loop(t)
);

}





loop(t){

let dt=
(t-this.lastTime)/1000;


this.lastTime=t;


dt=Math.min(dt,0.05);



if(this.state===STATE.PLAYING){

this.update(dt);

}


this.draw(dt);



requestAnimationFrame(
x=>this.loop(x)
);


}




update(dt){


let s=this.scoreState;



let diff=
getDifficultyForScore(
s.score
);


s.level=diff.level;

s.fallSpeed=diff.fallSpeed;

s.spawnInterval=diff.spawnInterval;



this.spawnTimer-=dt*1000;



if(this.spawnTimer<=0){



this.spawner.spawn(

s.fallSpeed,

this.nextEggLane

);



this.nextEggLane++;


if(
this.nextEggLane>=LANES.count
)
this.nextEggLane=0;



this.spawnTimer=
s.spawnInterval;


}



this.player.update(dt);



let missed=
this.spawner.update(dt);



missed.forEach(
x=>this.miss(x)
);



let caught=
this.spawner.checkCatches(
this.player.getCatchBox()
);



caught.forEach(
x=>this.catch(x)
);



if(s.lives<=0){

this.gameOver();

}


this.events.emit(
'scoreUpdate',
this.hud()
);


}





catch(item){


let s=this.scoreState;


s.catchesThisRun++;


s.score+=EGG.score;



effects.spawnScorePopup(
item.x,
item.y,
'+'+EGG.score,
'#fff6cf'
);



effects.spawnBurst(
item.x,
item.y,
'#fff1c4',
10
);



this.player.playOneShot(
'catch'
);


audio.playCatch();


}





miss(){


let s=this.scoreState;


s.missesThisRun++;


s.lives--;


this.player.hit();


audio.playMiss();


}



hud(){

let s=this.scoreState;


return {

score:s.score,

lives:s.lives,

level:s.level,

combo:0,

multiplier:1

};


}



gameOver(){

this.state=STATE.GAMEOVER;


this.events.emit(
'stateChange',
this.state
);


this.events.emit(
'runEnded',
this.scoreState
);


}



draw(dt){

let ctx=this.ctx;


ctx.clearRect(
0,
0,
DESIGN_WIDTH,
DESIGN_HEIGHT
);



this.drawBackground(dt);


if(
this.state===STATE.PLAYING ||
this.state===STATE.GAMEOVER
){

this.spawner.draw(ctx);

this.player.draw(ctx);

effects.drawEffects(ctx);

}


}



drawBackground(dt){


let ctx=this.ctx;


let bg=this.images.background;


if(bg && bg.complete){


let scale=Math.max(
DESIGN_WIDTH/bg.width,
DESIGN_HEIGHT/bg.height
);


ctx.drawImage(
bg,
0,
0,
bg.width*scale,
bg.height*scale
);


}


}

destroy(){

window.removeEventListener(
'resize',
this._resizeHandler
);

}


}
