import {registerEventListers,animate,removeEventListeners,current_seed} from "https://fear11332.github.io/project-gore/map_move_zoom/js/threeScene2.js";
import  { switchingState,stopScene,resumeScene} from "https://fear11332.github.io/project-gore/map_move_zoom/js/phaserScene2.js";
import { addConstructEventListeners,removeConstructEventListeners} from "https://fear11332.github.io/project-gore/map_move_zoom/js/jsconst.js";

let ring = document.getElementById('ring');
let overlay = document.getElementById('overlay');
let overlay2 = document.getElementById('overlay2');
let construct = document.getElementById('construct');
let controls = document.getElementById('controls');
let radiusSlider = document.getElementById('radiusSlider');
let stage2 = document.getElementById('phaser');
let constructorIsOpen = false;
let stageThreeIsOpen = false;
let stageTwoIsOpen = false;

function openStage2(){
    if(!stageTwoIsOpen){
        resumeScene();
        overlay2.style.transition = 'background 1.9s ease-in-out'; // Плавное затемнение
        overlay2.style.background = 'rgba(0, 0, 0, 0.5)'; // Затемняем фон
        stageTwoIsOpen = true;
        stage2.style.opacity = '1';
        stage2.style.pointerEvents = 'auto';
    }
}

function closeStage2(){
    if(stageTwoIsOpen){
        stopScene();
        stageTwoIsOpen = false;
        overlay2.style.transition = 'background 1.9s ease-in-out'; // Плавное затемнение
        overlay2.style.background = 'rgba(0, 0, 0, 0)'; // Затемняем фон
        stage2.style.opacity = '0';
        stage2.style.pointerEvents = 'none';
    } 
}

function OpenRingPopUp(){
    stageThreeIsOpen = true;
    overlay.style.transition = 'background 1.9s ease-in-out'; // Плавное затемнение
    overlay.style.background = 'rgba(0, 0, 0, 0.5)'; // Затемняем фон
    ring.style.transition = 'opacity 1.9s ease-in-out';
    ring.style.opacity = '1';
    controls.style.transition = 'background 1.9s ease-in-out'; // Плавное затемнение
    controls.style.opacity = '1';
    
    radiusSlider.min = '1';
    radiusSlider.max = '4';
    radiusSlider.value = current_seed+1;
    animate();
    setTimeout(() => {
        registerEventListers();
        ring.style.pointerEvents = 'auto';
        overlay.style.pointerEvents = 'auto'; // Разрешаем взаимодействи
        radiusSlider.style.pointerEvents = 'auto';
        
        
    }, 1900);
}

function OpenConstructorPopUp(){
    stageThreeIsOpen = false;
    constructorIsOpen = true;
    radiusSlider.min = '45';
    radiusSlider.max = '70';
    radiusSlider.value = '45';
    ring.style.pointerEvents = 'none';
    ring.style.transition = 'opacity 1.9s ease-in-out';
    ring.style.opacity = '0';
    construct.style.transition = 'opacity 1.9s ease-in-out';
    construct.style.opacity = '1';
    setTimeout(() => {
        addConstructEventListeners();
        radiusSlider.style.pointerEvents = 'auto';
        construct.style.pointerEvents = 'auto';
        overlay.style.pointerEvents = 'auto'; // Разрешаем взаимодействие 
    }, 1900); 
}

function CloseRingPopUp(){
    radiusSlider.style.pointerEvents = 'none';
    ring.style.pointerEvents = 'none';
    overlay.style.pointerEvents = 'none'; // Разрешаем взаимодействие 
    removeEventListeners();
    overlay.style.transition = 'background 1.9s ease-in-out'; // Плавное затемнение
    overlay.style.background = 'rgba(0, 0, 0, 0)'; // Затемняем фон
    ring.style.transition = 'opacity 1.9s ease-in-out';
    ring.style.opacity = '0';
    controls.style.transition = 'opacity 1.9s ease-in-out';
    controls.style.opacity = '0';
    setTimeout(() => {
        switchingState();
            stageThreeIsOpen = false;
    }, 1900);
}

function CloseConstructorPopUp(){
    radiusSlider.style.pointerEvents = 'none';
    construct.style.pointerEvents = 'none';
    overlay.style.pointerEvents = 'none'; // Разрешаем взаимодействие
    removeConstructEventListeners();
    overlay.style.transition = 'background 1.9s ease-in-out'; // Плавное затемнение
    overlay.style.background = 'rgba(0, 0, 0, 0)'; // Затемняем фон 
    controls.style.transition = 'opacity 1.9s ease-in-out';
    controls.style.opacity = '0';
    construct.style.transition = 'opacity 1.9s ease-in-out';
    construct.style.opacity = '0';
    setTimeout(() => {
        switchingState();
        constructorIsOpen = false;
    }, 1900);
}

export {OpenRingPopUp,OpenConstructorPopUp,CloseRingPopUp,CloseConstructorPopUp,openStage2,closeStage2,stageThreeIsOpen,constructorIsOpen};