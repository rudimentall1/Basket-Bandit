/**
 * main.js
 * Basket Bandit
 * Final asset loader
 */


import { ASSETS } from './config.js';
import { GameEngine } from './engine.js';
import { initUI } from './ui.js';



function loadImage(src){

    return new Promise(resolve=>{

        const img=new Image();


        img.onload=()=>{

            resolve(img);

        };


        img.onerror=()=>{

            console.error(
                'Missing asset:',
                src
            );

            resolve(img);

        };


        img.src=src;


    });

}





async function loadAnimation(def){

    const frames=[];


    for(
        let i=0;
        i<def.count;
        i++
    ){

        frames.push(

            await loadImage(
                `${def.dir}/${def.prefix}_${i}.png`
            )

        );

    }


    return frames;

}





async function loadEggs(){

    const files=[

        'assets/items/egg/egg_white.png',

        'assets/items/egg/egg_brown.png',

        'assets/items/egg/egg_golden.png',

        'assets/items/egg/egg_cracked.png'

    ];


    const result=[];


    for(const file of files){

        result.push(
            await loadImage(file)
        );

    }


    return result;

}





async function preload(){


    const images={

        player:{},

        chickens:[],

        egg:[]

    };



    images.background =
        await loadImage(
            ASSETS.background
        );




    for(
        const [name,def]
        of Object.entries(ASSETS.player)
    ){

        images.player[name]=
            await loadAnimation(def);

    }




    for(
        const chicken
        of ASSETS.chickens
    ){

        images.chickens.push(

            await loadImage(chicken)

        );

    }




    images.egg =
        await loadEggs();



    return images;

}





async function start(){


    const canvas =
        document.getElementById(
            'game-canvas'
        );


    const ui =
        document.getElementById(
            'ui-root'
        );



    const images =
        await preload();



    const engine =
        new GameEngine(
            canvas,
            images
        );



    initUI(
        engine,
        ui
    );



    engine.start();


}





start();
