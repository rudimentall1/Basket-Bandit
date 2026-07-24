/**
 * main.js
 * -----------------------------------------------------------------------
 * Entry point.
 *
 * Loads all assets from config.js and starts the game.
 * Supports real sprite names:
 *
 * idle_0.png
 * run_0.png
 * catch_0.png
 * victory_0.png
 * lose_0.png
 *
 * -----------------------------------------------------------------------
 */

import { ASSETS } from './config.js';
import { GameEngine } from './engine.js';
import { initUI } from './ui.js';



function loadImage(src) {

  return new Promise((resolve)=>{

    const img = new Image();


    img.onload = ()=>{

      resolve(img);

    };


    img.onerror = ()=>{

      console.error(
        `[main] failed loading asset: ${src}`
      );

      resolve(img);

    };


    img.src = src;

  });

}





async function loadFrameSet(def) {


  const frames = [];


  for(let i = 0; i < def.count; i++){


    const file =
      `${def.dir}/${def.prefix}_${i}.png`;


    frames.push(
      await loadImage(file)
    );


  }


  return frames;

}





async function preloadAll(onProgress){


  let loaded = 0;


  const images = {

    player:{},

    chickens:[],

    egg:[]

  };



  const total =

    1 +

    Object.keys(ASSETS.player).length +

    ASSETS.chickens.length +

    1;



  function progress(){

    loaded++;

    onProgress(
      loaded / total
    );

  }




  //
  // background
  //

  images.background =
    await loadImage(
      ASSETS.background
    );

  progress();




  //
  // player animations
  //

  for(
    const [name,def]
    of Object.entries(ASSETS.player)
  ){

    images.player[name] =
      await loadFrameSet(def);


    progress();

  }





  //
  // chickens
  //

  for(
    const src
    of ASSETS.chickens
  ){

    images.chickens.push(
      await loadImage(src)
    );


    progress();

  }





  //
  // eggs
  //

  images.egg =
    await loadFrameSet(
      ASSETS.egg
    );


  progress();



  onProgress(1);



  return images;

}





function setLoadingProgress(value){

  const bar =
    document.getElementById(
      'loading-bar-fill'
    );


  if(bar){

    bar.style.width =
      `${Math.round(value*100)}%`;

  }

}





async function bootstrap(){


  const canvas =
    document.getElementById(
      'game-canvas'
    );


  const uiRoot =
    document.getElementById(
      'ui-root'
    );


  const loading =
    document.getElementById(
      'loading-screen'
    );



  try{


    const images =
      await preloadAll(
        setLoadingProgress
      );



    const engine =
      new GameEngine(
        canvas,
        images
      );



    initUI(
      engine,
      uiRoot
    );



    engine.start();




    if(loading){

      loading.classList.add(
        'loading-screen--done'
      );


      setTimeout(
        ()=>loading.remove(),
        400
      );

    }



  }

  catch(err){


    console.error(
      '[main] bootstrap failed',
      err
    );


    const label =
      document.getElementById(
        'loading-label'
      );


    if(label){

      label.textContent =
        'Failed loading game assets';

    }


  }


}





window.addEventListener(
  'unhandledrejection',
  e=>{

    console.error(
      '[main] Promise error:',
      e.reason
    );

  }
);



bootstrap();
