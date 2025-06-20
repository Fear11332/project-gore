import {
  freezeScene,
  unfreezeScene,
  current_seed,
  disposeThreeScene,
} from "https://github.com/Fear11332/project-gore/blob/main/map_move_zoom/js/threeScene2.js";
import {
  switchingState,
  cleanUpPhaserScene,
} from "https://github.com/Fear11332/project-gore/blob/main/map_move_zoom/js/phaserScene2.js";
import {
  addConstructEventListeners,
  removeConstructEventListeners,
} from "https://github.com/Fear11332/project-gore/blob/main/map_move_zoom/js/jsconst.js";

const backToStage1 = document.getElementById("back-to-stage1");
const ring = document.getElementById("ring");
const overlay = document.getElementById("overlay");
const construct = document.getElementById("construct");
const controls = document.getElementById("controls");
const radiusSlider = document.getElementById("radiusSlider");

backToStage1.addEventListener("click", () => {
  controls.classList.remove("active");
  overlay.classList.remove("active");
  ring.classList.remove("active");
  construct.classList.remove("active");
  radiusSlider.classList.remove("active");

  removeConstructEventListeners();
  disposeThreeScene();
  cleanUpPhaserScene();

  location.href = "https://github.com/Fear11332/project-gore/blob/main/map_move_zoom/index.html";
});

function OpenRingPopUp() {
  overlay.classList.add("active");
  ring.classList.add("active");
  controls.classList.add("active");
  radiusSlider.min = "1";
  radiusSlider.max = "4";
  radiusSlider.value = current_seed + 1;

  unfreezeScene();
}

function OpenConstructorPopUp() {
  overlay.classList.add("active");
  construct.classList.add("active");
  ring.classList.remove("active");
  radiusSlider.min = "45";
  radiusSlider.max = "70";
  radiusSlider.value = "45";
  addConstructEventListeners();
}

function CloseRingPopUp() {
  overlay.classList.remove("active");
  ring.classList.remove("active");
  controls.classList.remove("active");

  freezeScene();

  function onTransitionEnd(event) {
    // Проверяем, что это именно окончание анимации opacity
    if (event.propertyName === "opacity") {
      switchingState();
      // Удаляем обработчик после срабатывания, чтобы не вызывался повторно
      overlay.removeEventListener("transitionend", onTransitionEnd);
    }
  }

  overlay.addEventListener("transitionend", onTransitionEnd);
}

function CloseConstructorPopUp() {
  overlay.classList.remove("active");
  construct.classList.remove("active");
  controls.classList.remove("active");

  removeConstructEventListeners();

  function onTransitionEnd(event) {
    if (event.propertyName === "opacity") {
      switchingState();
      overlay.removeEventListener("transitionend", onTransitionEnd);
    }
  }

  overlay.addEventListener("transitionend", onTransitionEnd);
}

export {
  OpenRingPopUp,
  OpenConstructorPopUp,
  CloseRingPopUp,
  CloseConstructorPopUp,
};
