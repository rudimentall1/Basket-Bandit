/**
 * ui.js
 * Basket Bandit
 * Classic arcade UI
 */

import { GAME_TITLE, PLAYER } from './config.js';
import { STATE } from './engine.js';
import { getState, recordRunResult, isStorageAvailable } from './storage.js';
import { unlockAudio, setMuted, isMuted, playUiClick } from './audio.js';


export function initUI(engine, root) {

    engine.getBestScore = () => getState().bestScore || 0;


    const el = buildDOM(root);

    wireButtons(engine, el);
    wireEvents(engine, el);


    engine.goToMenu();

    return el;

}





function create(tag, cls, text='') {

    const e=document.createElement(tag);

    if(cls)
        e.className=cls;

    e.textContent=text;

    return e;

}





function buildDOM(root){


    root.innerHTML='';



    /*
        HUD
    */

    const hud=create('div','hud');


    const row=create('div','hud-row');


    const lives=create('div','hud-lives');


    const lifeIcons=[];


    for(let i=0;i<PLAYER.maxLives;i++){

        const h=create('span','life','❤');

        lives.appendChild(h);

        lifeIcons.push(h);

    }



    const score=create('div','hud-score','0');


    const level=create('div','hud-level','Level 1');


    score.appendChild(level);



    const pause=create('button','icon-btn','Ⅱ');


    const mute=create('button','icon-btn','🔊');



    row.appendChild(lives);
    row.appendChild(score);
    row.appendChild(mute);
    row.appendChild(pause);



    const combo=create('div','hud-combo');


    hud.appendChild(row);
    hud.appendChild(combo);





    /*
       MENU
    */


    const menu=create('div','screen');


    const card=create('div','menu-card');


    const title=create(
        'div',
        'game-title',
        GAME_TITLE
    );


    const subtitle=create(
        'div',
        'game-sub',
        'Catch falling eggs!'
    );


    const best=create(
        'div',
        'menu-stat'
    );


    const start=create(
        'button',
        'btn btn--primary',
        'START GAME'
    );


    card.appendChild(title);
    card.appendChild(subtitle);
    card.appendChild(best);
    card.appendChild(start);


    menu.appendChild(card);





    /*
       PAUSE
    */


    const pauseScreen=create('div','screen');


    const pauseCard=create('div','menu-card');


    pauseCard.appendChild(
        create(
            'div',
            'game-title',
            'PAUSED'
        )
    );


    const resume=create(
        'button',
        'btn btn--primary',
        'RESUME'
    );


    const restartPause=create(
        'button',
        'btn btn--ghost',
        'RESTART'
    );


    pauseCard.appendChild(resume);
    pauseCard.appendChild(restartPause);


    pauseScreen.appendChild(pauseCard);





    /*
       GAME OVER
    */


    const over=create('div','screen');


    const overCard=create('div','menu-card');


    const overTitle=create(
        'div',
        'game-title',
        'GAME OVER'
    );


    const result=create(
        'div',
        'gameover-score'
    );


    const restart=create(
        'button',
        'btn btn--primary',
        'PLAY AGAIN'
    );


    const menuBtn=create(
        'button',
        'btn btn--ghost',
        'MENU'
    );


    overCard.appendChild(overTitle);
    overCard.appendChild(result);
    overCard.appendChild(restart);
    overCard.appendChild(menuBtn);


    over.appendChild(overCard);



    root.appendChild(hud);
    root.appendChild(menu);
    root.appendChild(pauseScreen);
    root.appendChild(over);



    return {

        hud,

        lifeIcons,

        score,

        level,

        combo,

        pause,

        mute,


        menu,

        best,

        start,


        pauseScreen,

        resume,

        restartPause,


        over,

        result,

        restart,

        menuBtn

    };

}







function wireButtons(engine,el){


    const click=(fn)=>(e)=>{

        unlockAudio();

        playUiClick();

        fn();

    };



    el.start.onclick =
        click(()=>engine.startRun());


    el.restart.onclick =
        click(()=>engine.startRun());


    el.restartPause.onclick =
        click(()=>engine.startRun());


    el.resume.onclick =
        click(()=>engine.resume());


    el.menuBtn.onclick =
        click(()=>engine.goToMenu());



    el.pause.onclick =
        click(()=>engine.pause());



    el.mute.onclick=()=>{

        setMuted(!isMuted());

        el.mute.textContent =
            isMuted()?'🔇':'🔊';

    };

}






function wireEvents(engine,el){


    engine.events.on(
        'stateChange',
        state=>render(state,el)
    );



    engine.events.on(
        'scoreUpdate',
        data=>updateHUD(data,el)
    );



    engine.events.on(
        'runEnded',
        data=>showGameOver(data,el)
    );


}





function render(state,el){


    el.menu.style.display =
        state===STATE.MENU?'flex':'none';


    el.pauseScreen.style.display =
        state===STATE.PAUSED?'flex':'none';


    el.over.style.display =
        state===STATE.GAMEOVER?'flex':'none';



    el.hud.style.display =
        state===STATE.MENU?'none':'block';



    if(state===STATE.MENU){

        const best=getState().bestScore||0;

        el.best.textContent =
            best?
            `Best: ${best}`:
            'No record yet';

    }


}





function updateHUD(s,el){


    el.score.firstChild.textContent=s.score;


    el.level.textContent=
        `Level ${s.level}`;



    el.lifeIcons.forEach(
        (x,i)=>
        x.style.opacity =
        i<s.lives?'1':'0.25'
    );



    if(s.combo>1){

        el.combo.textContent =
        `COMBO x${s.combo}`;

        el.combo.classList.add(
            'hud-combo--active'
        );

    }
    else{

        el.combo.classList.remove(
            'hud-combo--active'
        );

    }


}







function showGameOver(result,el){


    recordRunResult({

        runScore:result.score,

        runLevel:result.level,

        catchesThisRun:
        result.catchesThisRun,

        bestComboThisRun:
        result.bestComboThisRun,

        missesThisRun:
        result.missesThisRun

    });



    el.result.textContent =
        `Score ${result.score}`;


}
