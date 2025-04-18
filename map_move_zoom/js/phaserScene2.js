import {ini} from "https://fear11332.github.io/project-gore/map_move_zoom/js/threeScene2.js";
import {OpenRingPopUp } from "https://fear11332.github.io/project-gore/map_move_zoom/js/popup.js";

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    scale: {
        mode: Phaser.Scale.RESIZE,  // Автоматическая подстройка канваса под размер экрана
        autoCenter: Phaser.Scale.CENTER_BOTH,  // Центрирование канваса на экране
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        update: update,
        clearScene: clearScene,  // Добавляем функцию очистки в сцену
    },
};

let redSquare;
let scaleMap = 0.6;
const originalSize = 2048*scaleMap;  // Исходный размер квадрата 2048x2048
let isDown = false;
const game = new Phaser.Game(config);
let isAnimating = false; // Флаг состояния анимации
let isDragging = false;
let previousX = 0;
let previousY = 0;
let greenDotX = 450*scaleMap;
let greenDotY = 630*scaleMap;
// Вычисляем коэффициент масштабирования
const scaleFactor = (Math.min(window.innerWidth , window.innerHeight ) / originalSize);
let mapImage;
const minZoom = 1; // Минимальный зум равен начальному
const maxZoom = 1.48; // Максимальный зум — 3x начального
let greeDotPositionOfsset = { x: greenDotX, y: greenDotY};
let zoomInFlag = true;
let markerZone;
let setTime=2000;
let layout='map';
let popUpWindowOpen=false;
let isPoint = false;
let background;

let greenDot;
let startX = null;
let startY = null;
const DRAG_THRESHOLD = 0; // Порог для определения перемещения
let deltaX = null;
let deltaY = null;
let isStopping = false;

let bgLayer;       // задний слой (фон)
let frontLayer;    // передний слой (основная карта)
let bgImage;

// Функция для асинхронной загрузки ресурсов
async function preload() {
    // Отображаем текст "Загрузка..." в центре экрана
    this.loadingText = this.add.text(window.innerWidth / 2, window.innerHeight / 2, 'Loading', {
        fontSize: '32px',
        fill: '#5DE100',
        align: 'center'
    }).setOrigin(0.5);
     // Создаем анимацию с точками для загрузки
    animateLoading.call(this);

    // Загружаем ресурсы асинхронно
    const loadPromise = loadAllImages.call(this);
    // Дожидаемся завершения загрузки
    await loadPromise;
    // После завершения загрузки, добавляем искусственную задержку
    //await delay(500); // Задержка в 1 секунду после завершения загрузки

    // После задержки скрываем текст "Загрузка"
    this.loadingText.setVisible(false);

    ini();

    create.call(this);
    // Здесь можно продолжать работу с картой
}
// Функция для анимации текста "Загрузка..." с точками
function animateLoading() {
    let dotCount = 0; // Количество точек
    const maxDots = 3; // Максимум точек (например, 3 точки)

    // Устанавливаем интервал, чтобы добавлять точки
    this.loadingInterval = setInterval(() => {
        dotCount++;
        if (dotCount > maxDots) {
            dotCount = 1; // Сбросить точек до одной, если достигли максимума
        }
        this.loadingText.setText(`Loading${'.'.repeat(dotCount)}`);
    }, 500); // Интервал в 500 мс для циклического добавления точек
}

// Функция загрузки всех изображений
function loadAllImages() {
    return new Promise((resolve, reject) => {
        this.load.image('map', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_st2_parallax_1_09.webp');
        this.load.image('bg', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_st2_parallax_0_10.webp');
        // Когда все ресурсы загружены, resolve проми
        this.load.once('complete', resolve);
        this.load.start();
    });
}

// Функция для создания сцены
function create() {
        // Создаем черный фон, который занимает весь экран
        background = this.add.rectangle(0, 0, window.innerWidth, window.innerHeight, 0x000000).setOrigin(0, 0);

        bgLayer = this.add.container(0, 0);       // Слой фона
        frontLayer = this.add.container(0, 0);

        bgImage = this.add.image(0, 0, 'bg').setOrigin(0.5, 0.5);
        bgImage.setDisplaySize(originalSize, originalSize);
        bgLayer.add(bgImage);

        mapImage = this.add.image(0, 0, 'map').setOrigin(0.5, 0.5);
        //mapImage.setPosition(window.innerWidth / 2, window.innerHeight / 2);
        mapImage.setDisplaySize(originalSize,originalSize);

        frontLayer.add(mapImage); 
        
        redSquare = this.add.rectangle(0, 0, originalSize, originalSize, 0xff0000,0);  // Квадрат 2048x2048px красного цвета
        redSquare.setOrigin(0.5, 0.5);  // Центр квадрата в его середину
        //redSquare.setPosition(window.innerWidth / 2, window.innerHeight / 2);
        // Пересчитываем размер квадрата с учетом коэффициента масштабирования
        redSquare.setSize(originalSize , originalSize);

        frontLayer.add(redSquare);
        
        
        // Создаем точку, которая будет находиться в 
        greenDot = this.add.circle(0, 0, 10, 0x00ff00);  // Синяя точка радиусом 10px
        greenDot.setOrigin(0.5, 0.5);  // Центр точки в его середину
        greenDot.setVisible(false);

         frontLayer.add(greenDot);

         // Создаём интерактивную зону для маркера
        markerZone = this.add.zone(0, 0, 20, 20)
        .setOrigin(0.5, 0.5)
        .setInteractive();

        frontLayer.add(markerZone);

        objestPositionRebuild(this);  // Сразу вызываем resize, чтобы канвас занимал весь экран

        // Добавляем обработчик события изменения размера окна
        window.addEventListener('resize', () => {
            // Обновляем размеры игры
            requestAnimationFrame(() => {
                game.scale.resize(window.innerWidth, window.innerHeight);
                if (layout === 'zoom') {
                    moveSquareToGreenDot(this, 1);
                } else {
                    objestPositionRebuild(this);
                }
            });
        });

        // Добавляем обработчик события поворота устройства
        window.addEventListener('orientationchange', () => {
            // Обновляем размеры игры
            requestAnimationFrame(() => {
                game.scale.resize(window.innerWidth, window.innerHeight);
                if (layout === 'zoom') {
                    moveSquareToGreenDot(this, 1);
                } else {
                    objestPositionRebuild(this);
                }
            });
        });

        // Обработчик события "тап" по зоне маркера
        markerZone.on('pointerdown', (pointer) => {
            if (!zoomInFlag && !popUpWindowOpen) {
                        layout = 'zoom';
                        popUpWindowOpen = true; 
                        if(!isPoint){
                            moveSquareToGreenDot(this,0);
                            isPoint = true;
                            setTimeout(() => {
                                showPopup(); // Показываем окно после перемещения
                            }, setTime); // Даем время завершиться анимации  
                        }else{
                            showPopup();
                        }        
                    }
        });

        this.input.on('pointerdown', (pointer)=> {
            if(layout==='map'){
                // Преобразуем координаты указателя в мировые
                const worldPointer = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                // Проверяем, что пользователь кликнул на квадрат с учетом масштаба
                if (redSquare.getBounds().contains(worldPointer.x, worldPointer.y)) {
                    isDragging = false;
                    isDown = true;
                    isPoint = false;
                    previousX = pointer.x;
                    previousY = pointer.y;
                    startX = pointer.x;
                    startY = pointer.y;
                }
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (isDown){
             deltaX = Math.abs(pointer.x - startX);
             deltaY = Math.abs(pointer.y - startY);

    // Если сдвиг больше порога -> считаем это перемещением
            if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
                    isDragging = true;
                    isPoint = false;
                    moveMap(pointer);
                    this.tweens.add({
                        targets: bgLayer,
                        x: frontLayer.x ,
                        y: frontLayer.y,
                        duration: 200,
                        ease: 'Quad.easeOut'
                    });
                }
            }
        });

        this.input.on('pointerup', (pointer) => {
            // Отпускаем квадрат, когда пользователь отпускает кнопку мыши или палец

            deltaX = Math.abs(pointer.x - startX);
            deltaY = Math.abs(pointer.y - startY);

            if (!isDragging && deltaX == DRAG_THRESHOLD && deltaY == DRAG_THRESHOLD) {
                
                moveSquareToTap(this, pointer);
            }

            isDown = false;
            isDragging = false;
           // console.log("eee");
                      // Когда отпустили — фон плавно догоняет основной слой
            
        });

        // Глобальный обработчик завершения ввода (для мыши, сенсорных экранов и других устройств)
        window.addEventListener('pointerup', () => {
            isDown = false;
            isDragging = false;
        });
}

function moveSquareToGreenDot(scene, flag) {
    let duration = flag ? 1 : 1400;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Координаты greenDot в мировых координатах
    const worldGreenDotX = frontLayer.x + greenDot.x;
    const worldGreenDotY = frontLayer.y + greenDot.y;

    const offsetX = centerX - worldGreenDotX;
    const offsetY = centerY - worldGreenDotY;

    const targetX = frontLayer.x + offsetX;
    const targetY = frontLayer.y + offsetY;

      // Двигаем оба слоя одновременно, но с разной амплитудой
        scene.tweens.add({
            targets: frontLayer,
            x: targetX,
            y: targetY,
            duration: duration,
            ease: 'Quad.easeInOut',
            onUpdate:()=>{
                    scene.tweens.add({
                            targets: bgLayer,
                            x: frontLayer.x ,
                            y: frontLayer.y,
                            duration: 600,
                            ease: 'Quad.easeOut'
                        });
            }
        });
}


function showPopup() {
    OpenRingPopUp();
}

function switchingState(){
    popUpWindowOpen = false;
    layout  = 'map';
    isAnimating = false;
    isStopping = false;
}

// Функция для перемещения карты и объектов, чтобы точка тапа стала в центре экрана
function moveSquareToTap(scene, pointer) {
    if (!isAnimating) {
        isAnimating = true;

        const tapX = pointer.x;
        const tapY = pointer.y;

        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        const zoom = scene.cameras.main.zoom;

        const offsetX = (centerX - tapX) / zoom;
        const offsetY = (centerY - tapY) / zoom;

        const frontTargetX = frontLayer.x + offsetX;
        const frontTargetY = frontLayer.y + offsetY;

        // Двигаем оба слоя одновременно, но с разной амплитудой
        scene.tweens.add({
            targets: frontLayer,
            x: frontTargetX,
            y: frontTargetY,
            duration: 1400,
            ease: 'Quad.easeInOut',
            onUpdate:()=>{
                    scene.tweens.add({
                            targets: bgLayer,
                            x: frontLayer.x ,
                            y: frontLayer.y,
                            duration: 600,
                            ease: 'Quad.easeOut'
                        });
            },
             onComplete: () => {
                // По завершению — можно зумить
                if (layout === 'map') {
                    if (zoomInFlag)
                        zoomIn(scene);
                    else
                        zoomOut(scene);
                }
            }
        });
    }
}


function zoomIn(scene) {
    if (isAnimating) {

        // Получаем текущий центр экрана
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Получаем текущие значения scrollX и scrollY
        const currentScrollX = scene.cameras.main.scrollX;
        const currentScrollY = scene.cameras.main.scrollY;

        // Вычисляем смещение относительно центра экрана
        const offsetX = centerX - currentScrollX;
        const offsetY = centerY - currentScrollY;

        // Анимация зума
        scene.tweens.add({
            targets: scene.cameras.main,
            zoom: maxZoom,  // Плавное увеличение
            scrollX: centerX-offsetX, // Центрирование камеры по оси X
            scrollY: centerY-offsetY, // Центрирование камеры по оси Y
            duration: 1400,  // Длительность анимации
            ease: 'Quad.easeInOut',  // Тип easing для плавности
            onComplete: () => {
                greenDot.setVisible(true);
                isAnimating = false; // Снимаем флаг анимации
                zoomInFlag = false;  // Снимаем флаг зума
            }
        });
    }
}

function zoomOut(scene) {
    if ( isAnimating) {
         // Получаем текущий центр экрана
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Получаем текущие значения scrollX и scrollY
        const currentScrollX = scene.cameras.main.scrollX;
        const currentScrollY = scene.cameras.main.scrollY;

        // Вычисляем смещение относительно центра экрана
        const offsetX = centerX - currentScrollX;
        const offsetY = centerY - currentScrollY;

        // Анимация зума
        scene.tweens.add({
            targets: scene.cameras.main,
            zoom: minZoom,  // Плавное увеличение
            scrollX: centerX-offsetX,//+ offsetX, // Плавное перемещение по оси X
            scrollY: centerY-offsetY,// + offsetY, // Плавное перемещение по оси Y
            duration: 1400,  // Длительность анимации
            ease: 'Quad.easeInOut',  // Тип easing для плавности
            onStart:()=>{
                zoomInFlag = true;  // Снимаем флаг зума
            },
            onComplete: () => {
                greenDot.setVisible(false);
                isAnimating = false; // Снимаем флаг анимации
            }
        });
    }
}

function checkSquareOutOfBoundsWithAnimation(newX, newY, square) {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let minGap = zoomInFlag?200:350;

    const squareLeft = newX - square.width / 2;
    const squareRight = newX + square.width / 2;
    const squareTop = newY - square.height / 2;
    const squareBottom = newY + square.height / 2;

    // расстояния до противоположных сторон экрана
    const gapBottomToTop = squareBottom; // нижняя сторона квадрата → верх экрана
    const gapTopToBottom = screenHeight - squareTop; // верх квадрата → низ экрана
    const gapRightToLeft = squareRight; // правая сторона квадрата → левая экрана
    const gapLeftToRight = screenWidth - squareLeft; // левая квадрата → правая экрана

    // если хоть одно из расстояний стало меньше допустимого минимума — стоп
    if (
        gapBottomToTop < minGap || 
        gapTopToBottom < minGap || 
        gapRightToLeft < minGap || 
        gapLeftToRight < minGap
    ) {
        return false;
    }

    return true;
}
   
function moveMap(pointer) {
    if (!isDragging || isAnimating) return;

    const deltaX = (pointer.x - previousX) * 0.5;
    const deltaY = (pointer.y - previousY) * 0.5;

    const newX = frontLayer.x + deltaX;
    const newY = frontLayer.y + deltaY;

    // Проверка на границы через redSquare внутри frontLayer
    if (checkSquareOutOfBoundsWithAnimation(newX, newY, redSquare)) {
        // Верхний слой двигается сразу
        frontLayer.setPosition(newX, newY);

        // Нижний — двигается чуть медленнее, например на 0.8 скорости
        const bgTargetX = bgLayer.x + deltaX * 0.5;
        const bgTargetY = bgLayer.y + deltaY * 0.5;

        bgLayer.setPosition(bgTargetX, bgTargetY);
    }

    previousX = pointer.x;
    previousY = pointer.y;
}


// Функция для обновления
function update() {
}

// Слушаем событие pageshow для перезагрузки сцены при возврате на страницу
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        // Если страница была восстановлена из кэша, перезагружаем сцену
        location.reload();  // Полная перезагрузка страницы
    }
});

function clearScene(scene) {
    // Очистка всех объектов сцены
    scene.children.removeAll(true);  // Удаляем все дочерние объекты
    scene.events.off();        // Удаляем все обработчики событий
    scene.input.removeAllListeners();  // Удаляем все слушатели ввода
    scene.time.removeAllEvents();     // Удаляем все таймеры
    scene.scene.stop();  // Останавливаем сцену*/
}

// Отключаем контекстное меню (ПКМ)
document.addEventListener('contextmenu', function(event) {
    event.preventDefault();  // Отключаем контекстное меню
});

// Отключаем выделение текста
document.body.style.userSelect = 'none';

// Функция для перерасчета размера канваса
function objestPositionRebuild(scene) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    redSquare.setPosition(0, 0);  // Центрируем относительно frontLayer
    mapImage.setPosition(0, 0);   // Центрируем относительно frontLayer
    greenDot.setPosition(greeDotPositionOfsset.x, greeDotPositionOfsset.y);
    markerZone.setPosition(greeDotPositionOfsset.x, greeDotPositionOfsset.y);
    bgImage.setPosition(0, 0);

    frontLayer.setPosition(centerX, centerY);
    bgLayer.setPosition(centerX , centerY);    
}

export {switchingState,showPopup};