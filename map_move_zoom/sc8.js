// sc.js
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
        create: create,
        update: update
    },
};

let redSquare;
const originalSize = 2048;  // Исходный размер квадрата 2048x2048
let blueDot;
let isDown = false;
//const eps =0.001; // Порог, когда считаем, что движение остановилось
const game = new Phaser.Game(config);
let isAnimating = false; // Флаг состояния анимации
let isDragging = false;
let previousX = 0;
let previousY = 0;
let greenDotX = 550;
let greenDotY = 770;
// Вычисляем коэффициент масштабирования
const scaleFactor = (Math.min(window.innerWidth , window.innerHeight ) / originalSize)*1.5;
let mapImage;
const mapScaleFactor = 1.3;
const  squareScaleFactor = 1.05;
let currentZoom = scaleFactor * mapScaleFactor*originalSize; // Начальный уровень зума
const minZoom = 1; // Минимальный зум равен начальному
const maxZoom = 2; // Максимальный зум — 3x начального
let greeDotPositionOfsset = { x: greenDotX*scaleFactor*squareScaleFactor, y: greenDotY*scaleFactor*squareScaleFactor};
let zoomInFlag = true;
let markerZone;
let setTime=2000;
let layout='map';
let popUpWindowOpen=false;
let isPoint = false;
let background;

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
    await delay(2000); // Задержка в 1 секунду после завершения загрузки

    // После задержки скрываем текст "Загрузка"
    this.loadingText.setVisible(false);

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
        this.load.image('map', 'images/map.png');
        this.load.image('popupImage1', 'images/1.png');
        this.load.image('popupImage2', 'images/2.png');
        this.load.image('popupImage3', 'images/3.png');
        this.load.image('popupImage4', 'images/4.png');
        this.load.image('popupImage5', 'images/5.png');

        // Когда все ресурсы загружены, resolve промис
        this.load.once('complete', resolve);
        this.load.start();
    });
}

// Функция задержки (например, 1 секунда)
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Функция для создания сцены
function create() {
        // Создаем черный фон, который занимает весь экран
        background = this.add.rectangle(0, 0, window.innerWidth, window.innerHeight, 0x000000).setOrigin(0, 0);

        mapImage = this.add.image(0, 0, 'map').setOrigin(0.5, 0.5);
        mapImage.setPosition(window.innerWidth / 2, window.innerHeight / 2);
        mapImage.setDisplaySize(currentZoom,currentZoom); 
        
        // Создаем квадрат
        /*tapCoordinatesText = this.add.text(10, 10, '', {
            fontSize: '16px',
            fill: '#ffffff'
        });*/

        redSquare = this.add.rectangle(0, 0, originalSize, originalSize, 0xff0000,0);  // Квадрат 2048x2048px красного цвета
        redSquare.setOrigin(0.5, 0.5);  // Центр квадрата в его середину
        redSquare.setPosition(window.innerWidth / 2, window.innerHeight / 2);
        // Пересчитываем размер квадрата с учетом коэффициента масштабирования
        redSquare.setSize(originalSize * scaleFactor*squareScaleFactor, originalSize * scaleFactor*squareScaleFactor);
        
        // Создаем точку, которая будет находиться в центре квадрата
        //blueDot = this.add.circle(0, 0, 10, 0x0000ff);  // Синяя точка радиусом 10px
        //blueDot.setOrigin(0.5, 0.5);  // Центр точки в его середину
        
        // Создаем точку, которая будет находиться в 
        greenDot = this.add.circle(0, 0, 10, 0x00ff00);  // Синяя точка радиусом 10px
        greenDot.setOrigin(0.5, 0.5);  // Центр точки в его середину
        greenDot.setVisible(false);

         // Создаём интерактивную зону для маркера
        markerZone = this.add.zone(0, 0, 20, 20)
        .setOrigin(0.5, 0.5)
        .setInteractive();

        objestPositionRebuild(this);  // Сразу вызываем resize, чтобы канвас занимал весь экран
        let pointerDownTime = 0;
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
                                showPopup(this); // Показываем окно после перемещения
                            }, setTime); // Даем время завершиться анимации  
                        }else{
                            showPopup(this);
                        }        
                    }
        });

        this.input.on('pointerdown', (pointer)=> {
            if(layout==='map'){
                // Преобразуем координаты указателя в мировые
                const worldPointer = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                // Проверяем, что пользователь кликнул на квадрат с учетом масштаба
                if (redSquare.getBounds().contains(worldPointer.x, worldPointer.y)) {
                    pointerDownTime = this.time.now;
                    isDragging = false;
                    isDown = true;
                    isPoint = false;
                    previousX = pointer.x;
                    previousY = pointer.y;
                }
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (isDown) {
                const timeSinceDown = this.time.now - pointerDownTime;
                if (timeSinceDown > 156) { // Долгое нажатие — начало перемещения
                    isDragging = true;
                    isPoint = false;
                    moveMap(pointer);
                }
            }
        });

        this.input.on('pointerup', (pointer) => {
            // Отпускаем квадрат, когда пользователь отпускает кнопку мыши или палец
            const timeSinceDown = this.time.now - pointerDownTime;
            if (!isDragging && timeSinceDown <= 156) {
                moveSquareToTap(this, pointer);
            }

            isDown = false;
            isDragging = false;
            pointerDownTime = 0;
        });

        // Глобальный обработчик завершения ввода (для мыши, сенсорных экранов и других устройств)
        window.addEventListener('pointerup', () => {
            isDown = false;
            isDragging = false;
        });
}

function moveSquareToGreenDot(scene, flag) {
    let duration = 2000;
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

                // Перемещаем синюю точку
                //blueDot.setPosition(redSquare.x, redSquare.y);

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

                // Обновляем текст с координатами
                /*tapCoordinatesText.setText(
                    `Green Dot - X: ${greenDot.x.toFixed(2)}, Y: ${greenDot.y.toFixed(2)}`
                );*/
            }
        });
}

function showPopup(scene) {
    // Массив с изображениями для попапа
    const imageKeys = ['popupImage1', 'popupImage2', 'popupImage3',
        'popupImage4', 'popupImage5'
    ]; // Пример с тремя изображениями
    let currentImageIndex = 0; // Индекс текущего изображения
    // Создаем контейнер для слоя попапа
    popupLayer = scene.add.container(window.innerWidth / 2, window.innerHeight / 2)
        .setScale(0); // Начальный масштаб для анимации появления

    // Создаем фон попапа
    const popupBackground = scene.add.rectangle(0, 0, 0, 0, 0x000000, 1) // Черный цвет
        .setOrigin(0.5)
        .setAlpha(0); // Начальная прозрачность фона (полностью невидимый)
    popupLayer.add(popupBackground);

    // Картинка внутри окна
    let popupImage = scene.add.image(0, 0, imageKeys[currentImageIndex])
        .setOrigin(0.5)
        .setAlpha(0); // Начальная прозрачность картинки
    popupLayer.add(popupImage);

    // Кнопка для закрытия попапа
    const closeButton = scene.add.text(0, 0, 'X', {
        fontSize: '70px',
        fontFamily: 'Arial',
        color: '#ECFD9A',
        align: 'center'
    }).setOrigin(0.5).setInteractive()
        .setAlpha(0); // Начальная прозрачность кнопки

    /*closeButton.setPosition(
        popupImage.x, // Горизонтальное смещение
        popupImage.y  // Вертикальное смещение
    );*/
    popupLayer.add(closeButton);

    // Масштабируем контент
    scalePopupContent(scene, popupBackground, popupImage, closeButton);

    // Анимация появления окна
    scene.tweens.add({
        targets: popupLayer,
        scaleX: 1,
        scaleY: 1,
        ease: 'Power2',
        duration: 2000 // Длительность анимации
    });

    // Анимация прозрачности фона
    scene.tweens.add({
        targets: popupBackground,
        alpha: 0.2, // Полупрозрачный фон
        ease: 'Quad.easeInOut',
        duration: 2000 // Длительность анимации
    });

    // Анимация прозрачности содержимого (картинка + кнопка)
    scene.tweens.add({
        targets: [popupImage, closeButton],
        alpha: 1, // Полностью видимые
        ease: 'Linear',
        duration: 2000 // Длительность анимации
    });

    // Обработчик закрытия попапа
    const onClose = () => {
        // Анимация удаления окна
        scene.tweens.add({
            targets: popupBackground,
            alpha: 0, // Полностью прозрачный фон
            ease: 'Quad.easeInOut',
            duration: 1000, // Длительность анимации
        });

         // Анимация удаления кнопки
        scene.tweens.add({
            targets: closeButton,
            x: 0,
            y: 0,
            scaleX: 0,
            scaleY: 0,
            alpha: 0, // Полностью прозрачный фон
            ease: 'Quad.easeInOut',
            duration: 1000, // Длительность анимации
        });

        scene.tweens.add({
            targets:popupImage,
            scaleX: 0,
            scaleY: 0,
            alpha: 0, // Исчезновение
            ease: 'Quad.easeInOut',
            duration: 1000, // Длительность анимации

            onComplete: () => {
                scene.scale.off('resize', onResize); // Удаляем обработчик изменения размера
                scene.scale.off('orientationchange', onResize);
                if (popupLayer) {
                    popupLayer.destroy(); // Удалить весь слой попапа
                    popupLayer = null; // Сбрасываем ссылку на контейнер
                }
                popUpWindowOpen = false;
                layout  = 'map';
                isAnimating = false;
            }
        });
    };
    closeButton.on('pointerdown', onClose);

    // Следим за изменением размера экрана
    const onResize = () => {
        if (layout === 'zoom' && popupLayer) {
            popupLayer.setPosition(window.innerWidth/ 2, window.innerHeight / 2); // Исправлено значение ширины/высоты, height / 2);
            scalePopupContent(scene, popupBackground, popupImage, closeButton);
        }
    };
    scene.scale.on('resize', onResize);
    scene.scale.on('orientationchange', onResize);

     // Сделаем картинку интерактивной для переключения изображений
    popupImage.setInteractive();
    popupImage.on('pointerdown', () => {
        // Переключаем изображение
        currentImageIndex = (currentImageIndex + 1) % imageKeys.length; // Переход к следующему изображению
        popupImage.setTexture(imageKeys[currentImageIndex]); // Обновляем текстуру изображения
    });
}

function scalePopupContent(scene, popupBackground, popupImage, closeButton) {
    if (!popupBackground || !popupImage || !closeButton) {
        return; // Если какой-либо из элементов попапа не существует, выходим из функции
    }

    const { width, height } = scene.scale.gameSize;

    if (popupBackground) {
        popupBackground.setSize(window.innerWidth ,window.innerHeight); // Исправлено значение ширины/высоты
    }

    if (popupImage) {
        popupImage.setDisplaySize(Math.min(width, height)/3, Math.min(width, height)/3);
    }

    if (closeButton) {
        closeButton.setPosition(
            popupImage.x+popupImage.displayWidth/2,
            popupImage.y-popupImage.displayHeight/2
        );
        closeButton.setScale(popupImage.width * 0.0001, popupImage.height * 0.0001);
    }
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
            duration: 2000, // Длительность анимации
            ease: 'Quad.easeInOut',
            onUpdate: (tween, targets) => {
                // Обновляем позицию карты
                mapImage.setPosition(targets.x, targets.y);

                // Перемещаем квадрат с картой
                redSquare.setPosition(targets.x, targets.y);

                // Перемещаем синюю точку
                //blueDot.setPosition(redSquare.x, redSquare.y);

                // Перемещаем зеленую точку
                greenDot.setPosition(redSquare.x+greeDotPositionOfsset.x, 
                    redSquare.y+greeDotPositionOfsset.y);
                
                markerZone.setPosition(redSquare.x+greeDotPositionOfsset.x,
                    redSquare.y+greeDotPositionOfsset.y
                );

                // Обновляем текст с координатами
                /*tapCoordinatesText.setText(
                    `Red Square - X: ${redSquare.x.toFixed(2)}, Y: ${redSquare.y.toFixed(2)}`
                );*/
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
            duration: 2000,  // Длительность анимации
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
            duration: 2000,  // Длительность анимации
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

            // Вычисляем расстояния от центра квадрата до границ экрана
            /*const distanceLeft = newX;
            const distanceRight = window.innerWidth - newX;
            const distanceTop = newY;
            const distanceBottom = window.innerHeight - newY;

            // Проверяем, если расстояние до любой границы экрана меньше порога
            /*if(!(distanceLeft < eps ||
                distanceRight < eps ||
                distanceTop < eps ||
                distanceBottom < eps)){*/
                // Если расстояния достаточны, перемещаем квадрат
            if(checkSquareOutOfBoundsWithAnimation(newX , newY, redSquare)){
                redSquare.x = newX;
                redSquare.y = newY;
                mapImage.setPosition(redSquare.x, redSquare.y);

                // Перемещаем точку в центр квадрата
                //blueDot.setPosition(redSquare.x, redSquare.y);

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

// Функция для перерасчета размера канваса
function objestPositionRebuild(scene) {
    redSquare.setPosition(window.innerWidth / 2, window.innerHeight / 2);
    mapImage.setPosition(redSquare.x, redSquare.y);

    // Перемещаем точку в центр квадрата
    //blueDot.setPosition(redSquare.x, redSquare.y);

    greenDot.setPosition(redSquare.x+greeDotPositionOfsset.x,
        redSquare.y+greeDotPositionOfsset.y
    );

    markerZone.setPosition(redSquare.x+greeDotPositionOfsset.x,
        redSquare.y+greeDotPositionOfsset.y
    );
}