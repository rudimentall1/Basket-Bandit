/**
 * ui.js
 * Basket Bandit
 *
 * HUD + menus
 */


import {
  GAME_TITLE,
  PLAYER
} from './config.js';

import {
  STATE
} from './engine.js';

import {
  getState,
  recordRunResult
} from './storage.js';

import {
  unlockAudio,
  setMuted,
  isMuted,
  playUiClick
} from './audio.js';





export function initUI(engine,root){



const el=createUI(root);



engine.events.on(
'stateChange',
state=>renderState(state,el)
);



engine.events.on(
'scoreUpdate',
data=>updateHUD(data,el)
);



engine.events.on(
'runEnded',
result=>showGameOver(result,el)
);



wireButtons(
engine,
el
);



renderState(
STATE.MENU,
el
);



engine.goToMenu();


}







function create(tag,cls,text=''){


let e=document.createElement(tag);


if(cls)
e.className=cls;


e.innerHTML=text;


return e;


}







function createUI(root){



root.innerHTML='';




const hud=create(
'div',
'hud'
);



const lives=create(
'div',
'hud-lives'
);



let hearts=[];



for(
let i=0;i<PLAYER.maxLives;i++
){


let h=create(
'span',
'life',
'❤'
);


lives.appendChild(h);


hearts.push(h);


}





const score=create(
'div',
'hud-score',
'0'
);



const level=create(
'div',
'hud-level',
'Level 1'
);



score.appendChild(level);



const mute=create(
'button',
'icon-btn',
'🔊'
);



const pause=create(
'button',
'icon-btn',
'Ⅱ'
);



hud.appendChild(lives);

hud.appendChild(score);

hud.appendChild(mute);

hud.appendChild(pause);





const menu=create(
'div',
'screen'
);



const card=create(
'div',
'menu-card'
);



card.innerHTML=
`
<div class="game-title">
${GAME_TITLE}
</div>

<div class="game-sub">
Catch falling eggs!
</div>

<div class="menu-stat"></div>

<button class="btn btn--primary">
START GAME
</button>
`;



menu.appendChild(card);






const start=
card.querySelector(
'button'
);



const best=
card.querySelector(
'.menu-stat'
);






const pauseScreen=create(
'div',
'screen'
);



pauseScreen.innerHTML=
`
<div class="menu-card">

<div class="game-title">
PAUSED
</div>

<button class="btn btn--primary">
RESUME
</button>

<button class="btn btn--ghost">
RESTART
</button>

</div>
`;







const gameOver=create(
'div',
'screen'
);



gameOver.innerHTML=
`
<div class="menu-card">

<div class="game-title">
GAME OVER
</div>

<div class="gameover-score"></div>

<button class="btn btn--primary">
PLAY AGAIN
</button>

<button class="btn btn--ghost">
MENU
</button>

</div>
`;






root.appendChild(hud);

root.appendChild(menu);

root.appendChild(pauseScreen);

root.appendChild(gameOver);





return {


hud,

hearts,

score,

level,

mute,

pause,


menu,

start,

best,


pauseScreen,


resume:
pauseScreen.querySelector('.btn--primary'),


restartPause:
pauseScreen.querySelector('.btn--ghost'),


overScreen:gameOver,


playAgain:
gameOver.querySelector('.btn--primary'),


menuButton:
gameOver.querySelector('.btn--ghost'),


overScore:
gameOver.querySelector('.gameover-score')


};


}







function wireButtons(engine,el){



function click(fn){


return ()=>{

unlockAudio();

playUiClick();

fn();

};


}




el.start.onclick=
click(
()=>engine.startRun()
);



el.playAgain.onclick=
click(
()=>engine.startRun()
);



el.pause.onclick=
click(
()=>engine.pause()
);



el.resume.onclick=
click(
()=>engine.resume()
);



el.restartPause.onclick=
click(
()=>engine.startRun()
);



el.menuButton.onclick=
click(
()=>engine.goToMenu()
);





el.mute.onclick=
()=>{

setMuted(
!isMuted()
);


el.mute.innerHTML=
isMuted()?'🔇':'🔊';


};



}








function renderState(state,el){



el.menu.style.display=
state===STATE.MENU?
'flex':'none';



el.pauseScreen.style.display=
state===STATE.PAUSED?
'flex':'none';



el.overScreen.style.display=
state===STATE.GAMEOVER?
'flex':'none';



el.hud.style.display=
state===STATE.MENU?
'none':'flex';




if(state===STATE.MENU){


let s=getState();


el.best.textContent=
s.bestScore?
`Best: ${s.bestScore}`:
'Best: 0';


}


}








function updateHUD(data,el){



el.score.firstChild.nodeValue=
data.score;



el.level.textContent=
`Level ${data.level}`;





el.hearts.forEach(
(h,i)=>{


h.style.opacity=
i<data.lives?
'1':
'0.25';


}
);



}








function showGameOver(result,el){



let saved=
recordRunResult({

runScore:result.score,

runLevel:result.level,

catchesThisRun:result.catchesThisRun,

missesThisRun:result.missesThisRun,

bestComboThisRun:0

});



el.overScore.textContent=
`Score: ${result.score} | Best: ${saved.state.bestScore}`;


}
