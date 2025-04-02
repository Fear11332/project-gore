import {  ini,registerEventListers,animate} from "./threeScene2.js";

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
const originalSize = 2048;  // Исходный размер квадрата 2048x2048
let isDown = false;
const game = new Phaser.Game(config);
let isAnimating = false; // Флаг состояния анимации
let isDragging = false;
let previousX = 0;
let previousY = 0;
let greenDotX = 450;
let greenDotY = 630;
// Вычисляем коэффициент масштабирования
const scaleFactor = (Math.min(window.innerWidth , window.innerHeight ) / originalSize)*1.5;
let mapImage;
const minZoom = 1; // Минимальный зум равен начальному
const maxZoom = 1.3; // Максимальный зум — 3x начального
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
let ring = document.getElementById('ring');
let overlay = document.getElementById('overlay');

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
        this.load.image('map', 'https://fear11332.github.io/project-gore/map_move_zoom/images/map.webp');
        // Когда все ресурсы загружены, resolve промис
        this.load.once('complete', resolve);
        this.load.start();
    });
}

// Функция для создания сцены
function create() {
        // Создаем черный фон, который занимает весь экран
        background = this.add.rectangle(0, 0, window.innerWidth, window.innerHeight, 0x000000).setOrigin(0, 0);

        mapImage = this.add.image(0, 0, 'map').setOrigin(0.5, 0.5);
        mapImage.setPosition(window.innerWidth / 2, window.innerHeight / 2);
        mapImage.setDisplaySize(originalSize,originalSize); 
        
        redSquare = this.add.rectangle(0, 0, originalSize, originalSize, 0xff0000,0);  // Квадрат 2048x2048px красного цвета
        redSquare.setOrigin(0.5, 0.5);  // Центр квадрата в его середину
        redSquare.setPosition(window.innerWidth / 2, window.innerHeight / 2);
        // Пересчитываем размер квадрата с учетом коэффициента масштабирования
        redSquare.setSize(originalSize , originalSize );
        
        
        // Создаем точку, которая будет находиться в 
        greenDot = this.add.circle(0, 0, 10, 0x00ff00);  // Синяя точка радиусом 10px
        greenDot.setOrigin(0.5, 0.5);  // Центр точки в его середину
        greenDot.setVisible(false);

         // Создаём интерактивную зону для маркера
        markerZone = this.add.zone(0, 0, 20, 20)
        .setOrigin(0.5, 0.5)
        .setInteractive();

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
            
        });

        // Глобальный обработчик завершения ввода (для мыши, сенсорных экранов и других устройств)
        window.addEventListener('pointerup', () => {
            isDown = false;
            isDragging = false;
        });
}

function moveSquareToGreenDot(scene, flag) {
    let duration = 1400;
    if(flag)
        duration = 1;
        // Центр экрана
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Смещение относительно зеленой точки
        const offsetX = centerX - greenDot.x;
        const offsetY = centerY - greenDot.y;

        // Анимация перемещения карты и объектов
        scene.tweens.add({
            targets: { x: mapImage.x, y: mapImage.y },
            x: mapImage.x + offsetX,
            y: mapImage.y + offsetY,
            duration:duration, // Длительность анимации
            ease: 'Quad.easeInOut',
            onUpdate: (tween, targets) => {
                // Перемещаем карту
                mapImage.setPosition(targets.x, targets.y);

                // Перемещаем красный квадрат
                redSquare.setPosition(targets.x, targets.y);

                // Перемещаем зеленую точку
                greenDot.setPosition(
                    redSquare.x + greeDotPositionOfsset.x,
                    redSquare.y + greeDotPositionOfsset.y
                );

                // Перемещаем зону маркера
                markerZone.setPosition(
                    redSquare.x + greeDotPositionOfsset.x,
                    redSquare.y + greeDotPositionOfsset.y
                );
            }
        });
}

function showPopup() {
            overlay.style.transition = 'background 1.9s ease-in-out'; // Плавное затемнение
            overlay.style.background = 'rgba(0, 0, 0, 0.5)'; // Затемняем фон
            overlay.style.pointerEvents = 'auto'; // Разрешаем взаимодействие 
            ring.style.transition = 'opacity 1.9s ease-in-out';
            ring.style.opacity = '1';
            ring.style.pointerEvents = 'auto';
            animate(); 
            setTimeout(() => {
                registerEventListers();
            }, 1400); 
}

function closePopUp(){
    // Обработчик закрытия попапа
                ring.style.transition = 'opacity 1.9s ease-in-out';
                ring.style.opacity = '0';
                ring.style.pointerEvents = 'none';
                overlay.style.transition = 'background 1.9s ease-in-out'; // Плавное затемнение
                overlay.style.background = 'rgba(0, 0, 0, 0)'; // Затемняем фон
                overlay.style.pointerEvents = 'none'; // Разрешаем взаимодействие 
            switchingState();
}

function switchingState(){
            setTimeout(() => {
                popUpWindowOpen = false;
                layout  = 'map';
                isAnimating = false;
                isStopping = false;
            }, 1300);
}

// Функция для перемещения карты и объектов, чтобы точка тапа стала в центре экрана
function moveSquareToTap(scene, pointer) {
    if (!isAnimating) {
        isAnimating = true;

        // Координаты тапа
        const tapX = pointer.x;
        const tapY = pointer.y;

        // Центр экрана
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Рассчитываем смещение с учетом текущего масштаба
        const offsetX = (centerX - tapX) / scene.cameras.main.zoom;
        const offsetY = (centerY - tapY) / scene.cameras.main.zoom;

        // Анимация перемещения карты и объектов
        scene.tweens.add({
            targets: { x: mapImage.x, y: mapImage.y },
            x: mapImage.x + offsetX,
            y: mapImage.y + offsetY,
            duration: 1400, // Длительность анимации
            ease: 'Quad.easeInOut',
            onUpdate: (tween, targets) => {
                // Обновляем позицию карты
                mapImage.setPosition(targets.x, targets.y);

                // Перемещаем квадрат с картой
                redSquare.setPosition(targets.x, targets.y);

                // Перемещаем зеленую точку
                greenDot.setPosition(redSquare.x+greeDotPositionOfsset.x, 
                    redSquare.y+greeDotPositionOfsset.y);
                
                markerZone.setPosition(redSquare.x+greeDotPositionOfsset.x,
                    redSquare.y+greeDotPositionOfsset.y
                );
            },
            onComplete: () => {
                if(layout==='map') {
                    if(zoomInFlag)
                        zoomIn(scene);
                    else {
                        zoomOut(scene);
                    }
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
            onComplete: () => {
                greenDot.setVisible(false);
                isAnimating = false; // Снимаем флаг анимации
                zoomInFlag = true;  // Снимаем флаг зума
            }
        });
    }
}

function checkSquareOutOfBoundsWithAnimation(newX, newY, square) {
    // Размеры экрана
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Рассчитываем "граничное" значение, которое зависит от масштаба
    const boundaryOffset = 760 * scaleFactor; // Умножаем на коэффициент масштаба

    // Границы квадрата
    const squareLeft = newX - square.width / 2;
    const squareRight = newX + square.width / 2;
    const squareTop = newY - square.height / 2;
    const squareBottom = newY + square.height / 2;

    // Проверяем, полностью ли квадрат вышел за любую границу экрана
    if (
        squareRight <= boundaryOffset ||              // Полностью за левой границей
        squareLeft >= screenWidth - boundaryOffset ||     // Полностью за правой границей
        squareBottom <= boundaryOffset ||             // Полностью за верхней границей
        squareTop >= screenHeight - boundaryOffset        // Полностью за нижней границей
    ) {
        return false;
    }
    return true;
}

function moveMap(pointer) {
    if(!isDragging || isAnimating) return;
 
    // Рассчитываем смещение квадрата с учётом масштаба
    const deltaX = (pointer.x - previousX)*0.5;
    const deltaY = (pointer.y - previousY)*0.5;

    // Новый расчет для возможных границ
    const newX = redSquare.x + deltaX;
    const newY = redSquare.y + deltaY;   

            if(checkSquareOutOfBoundsWithAnimation(newX , newY, redSquare)){
                redSquare.x = newX;
                redSquare.y = newY;
                mapImage.setPosition(redSquare.x, redSquare.y);

                greenDot.setPosition(redSquare.x+greeDotPositionOfsset.x,
                    redSquare.y+greeDotPositionOfsset.y
                );
                
                markerZone.setPosition(redSquare.x+greeDotPositionOfsset.x,
                    redSquare.y+greeDotPositionOfsset.y
                );
            }

            // Обновляем предыдущие координаты
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
    redSquare.setPosition(window.innerWidth / 2, window.innerHeight / 2);
    mapImage.setPosition(redSquare.x, redSquare.y);

    greenDot.setPosition(redSquare.x+greeDotPositionOfsset.x,
        redSquare.y+greeDotPositionOfsset.y
    );

    markerZone.setPosition(redSquare.x+greeDotPositionOfsset.x,
        redSquare.y+greeDotPositionOfsset.y
    );
}

export {closePopUp,switchingState};