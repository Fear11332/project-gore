import {freezeScene,unfreezeScene,current_seed,disposeThreeScene} from "https://fear11332.github.io/project-gore/map_move_zoom/js/threeScene2.js";
import  { switchingState,cleanUpPhaserScene} from "https://fear11332.github.io/project-gore/map_move_zoom/js/phaserScene2.js";
import { addConstructEventListeners,removeConstructEventListeners} from "https://fear11332.github.io/project-gore/map_move_zoom/js/jsconst.js";

let backToStage1 = document.getElementById('back-to-stage1');
let ring = document.getElementById('ring');
let overlay = document.getElementById('overlay');
let construct = document.getElementById('construct');
let controls = document.getElementById('controls');
let radiusSlider = document.getElementById('radiusSlider');
let stage3Open = false;

backToStage1.addEventListener('click', () => {
    controls.style.opacity = '0';
    radiusSlider.style.pointerEvents = 'none';
    ring.style.pointerEvents = 'none';
    overlay.style.pointerEvents = 'none'; // Разрешаем взаимодействие 
    removeConstructEventListeners();
    disposeThreeScene();
    cleanUpPhaserScene();

    location.href = 'https://fear11332.github.io/project-gore/index.html'; // Переход на страницу stage1
});

function OpenRingPopUp(){
    stage3Open = true;
    overlay.style.transition = 'background 1.9s ease-in-out'; // Плавное затемнение
    overlay.style.background = 'rgba(0, 0, 0, 0.5)'; // Затемняем фон
    ring.style.transition = 'opacity 1.9s ease-in-out';
    ring.style.opacity = '1';
    controls.style.transition = 'background 1.9s ease-in-out'; // Плавное затемнение
    controls.style.opacity = '1';
    
    radiusSlider.min = '1';
    radiusSlider.max = '4';
    radiusSlider.value = current_seed+1;
    unfreezeScene();
    setTimeout(() => {
        ring.style.pointerEvents = 'auto';
        overlay.style.pointerEvents = 'auto'; // Разрешаем взаимодействи
        radiusSlider.style.pointerEvents = 'auto';
    }, 1900);
}

function OpenConstructorPopUp(){
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
    freezeScene();
    overlay.style.transition = 'background 1.9s ease-in-out'; // Плавное затемнение
    overlay.style.background = 'rgba(0, 0, 0, 0)'; // Затемняем фон
    ring.style.transition = 'opacity 1.9s ease-in-out';
    ring.style.opacity = '0';
    controls.style.transition = 'opacity 1.9s ease-in-out';
    controls.style.opacity = '0';
    setTimeout(() => {
        switchingState();
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
    }, 1900);
}

export {OpenRingPopUp,OpenConstructorPopUp,CloseRingPopUp,CloseConstructorPopUp};