import {registerEventListers,animate,removeEventListeners,animationFrameId} from "https://fear11332.github.io/project-gore/map_move_zoom/js/threeScene2.js";
import { switchingState } from "https://fear11332.github.io/project-gore/map_move_zoom/js/phaserScene2.js";
import { addConstructEventListeners,removeConstructEventListeners} from "https://fear11332.github.io/project-gore/map_move_zoom/js/jsconst.js";

let ring = document.getElementById('ring');
let overlay = document.getElementById('overlay');
let construct = document.getElementById('construct');
let controls = document.getElementById('controls');

function OpenRingPopUp(){
    overlay.style.transition = 'background 1.9s ease-in-out'; // Плавное затемнение
    overlay.style.background = 'rgba(0, 0, 0, 0.5)'; // Затемняем фон
    ring.style.transition = 'opacity 1.9s ease-in-out';
    ring.style.opacity = '1';
    animate();
    setTimeout(() => {
        ring.style.pointerEvents = 'auto';
        overlay.style.pointerEvents = 'auto'; // Разрешаем взаимодействие 
        registerEventListers();
    }, 1400);
}

function OpenConstructorPopUp(){
    ring.style.pointerEvents = 'none';
    ring.style.transition = 'opacity 1.9s ease-in-out';
    ring.style.opacity = '0';
    construct.style.transition = 'opacity 1.9s ease-in-out';
    construct.style.opacity = '1';
    controls.style.transition = 'opacity 1.9s ease-in-out';
    controls.style.opacity = '1';
    setTimeout(() => {
        controls.style.pointerEvents = 'auto';
        construct.style.pointerEvents = 'auto';
        overlay.style.pointerEvents = 'auto'; // Разрешаем взаимодействие 
        addConstructEventListeners();
    }, 1400); 
}

function CloseRingPopUp(){
    ring.style.pointerEvents = 'none';
    overlay.style.pointerEvents = 'none'; // Разрешаем взаимодействие 
    removeEventListeners();
    overlay.style.transition = 'background 1.9s ease-in-out'; // Плавное затемнение
    overlay.style.background = 'rgba(0, 0, 0, 0)'; // Затемняем фон
    ring.style.transition = 'opacity 1.9s ease-in-out';
    ring.style.opacity = '0';
    setTimeout(() => {
        switchingState();
    }, 1400);
}

function CloseConstructorPopUp(){
    controls.style.pointerEvents = 'none';
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
    }, 1400);
}

export {OpenRingPopUp,OpenConstructorPopUp,CloseRingPopUp,CloseConstructorPopUp};