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

const game = new Phaser.Game(config);
let redSquare;
let scaleMap = 0.6;
const originalSize = 2048*scaleMap;  // Исходный размер квадрата 2048x2048
let isDown = false;
let isAnimating = false; // Флаг состояния анимации
let isDragging = false;
let previousX = 0;
let previousY = 0;
let greenDotX = 450*scaleMap;
let greenDotY = 630*scaleMap;
// Вычисляем коэффициент масштабирования
const scaleFactor = (Math.min(window.innerWidth , window.innerHeight ) / originalSize);
const minZoom = 1; // Минимальный зум равен начальному
const maxZoom = 1.48; // Максимальный зум — 3x начального
let greeDotPositionOfsset = { x: greenDotX, y: greenDotY};
let zoomInFlag = true;
let markerZone;
let setTime=2000;
let layout='map';
let popUpWindowOpen=false;
let isPoint = false;

let greenDot;
let startX = null;
let startY = null;
const DRAG_THRESHOLD = 0; // Порог для определения перемещения
let deltaX = null;
let deltaY = null;
let isStopping = false;

let lvl0;       // задний слой (фон)
let lvl1;    // передний слой (основная карта)
let lvl2;
let lvl3;
let lvl4;
let lvl5;
let lvl6;
let lvl7;
let lvlPoint;
let shadowBox,shadowBox2, shadowBox3;

// Функция для асинхронной загрузки ресурсов
async function preload() {
      // 1. Добавляем текст сразу, чтобы он был на экране как можно раньше
    this.loadingText = this.add.text(window.innerWidth / 2, window.innerHeight / 2, 'Loading', {
        fontSize: '32px',
        fill: '#5DE100',
        align: 'center'
    }).setOrigin(0.5);

    animateLoading.call(this);

    // 2. Даем 1 кадр на отрисовку текста
    await new Promise((resolve) => this.time.delayedCall(0, resolve));

    // 3. Запускаем загрузку ассетов
    await loadAllImages.call(this);

    // 4. Ждем, пока браузер загрузит всё (включая шрифты и т.д.)
    await waitForWindowLoad();

    // 5. Прячем текст
    this.loadingText.setVisible(false);

    // 6. Запускаем остальную логику
    ini();
    create.call(this);
}

function waitForWindowLoad() {
    return new Promise((resolve) => {
        if (document.readyState === 'complete') {
            resolve(); // Уже загружено
        } else {
            window.addEventListener('load', () => resolve(), { once: true });
        }
    });
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
        this.load.image('lvl1', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_st2_parallax_1_09.webp');
        this.load.image('lvl0', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_st2_parallax_0_10.webp');
        this.load.image('lvl2', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_st2_parallax_2_03.webp');
        this.load.image('lvl3', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_st2_parallax_3_06.webp');
        this.load.image('lvl4', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_st2_parallax_4_03.webp');
        this.load.image('lvl5', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_st2_parallax_5_06.webp');
        this.load.image('lvl6', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_st2_parallax_6_04.webp');
        this.load.image('lvl7', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_st2_parallax_7_03.webp');
        this.load.image('lvlPoint', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_st2_parallax_mark_1_01.webp');
        // Когда все ресурсы загружены, resolve проми
        this.load.once('complete', resolve);
        this.load.start();
    });
}

function createSoftShadow(scene, x, y, w, h, maxAlpha) {
    const g = scene.add.graphics({ x, y });

    const steps = 10;  // Чем больше, тем мягче размытие
    const blur = 20;   // Радиус размытия

    // Предварительные вычисления для всех шагов
    const stepAlphaFactor = 1 / steps;
    const stepExpandFactor = blur / steps;

    // Используем заранее подготовленные значения
    let alpha, expand;
    
    for (let i = 0; i < steps; i++) {
        alpha = maxAlpha * (1 - stepAlphaFactor * i);  // Прозрачность на каждом шаге
        expand = stepExpandFactor * i;  // Увеличение радиуса размытия

        g.fillStyle(0x000000, alpha);
        g.fillRect(
            -w / 2 - expand,
            -h / 2 - expand,
            w + expand * 2,
            h + expand * 2
        );
    }

    return g;
}


// Функция для создания сцены
function create() {
        //this.renderer.pipelines.add('blurFX', new BlurPostFX(this.game));
        // Создаем черный фон, который занимает весь экран
        this.add.rectangle(0, 0, window.innerWidth, window.innerHeight, 0x000000).setOrigin(0, 0);
        
        lvl0=this.add.container(0,0);
        lvl1 = this.add.container(0,0);
        lvl2 = this.add.container(0,0);
        lvl3 = this.add.container(0,0);
        lvl4 = this.add.container(0,0);
        lvl5 = this.add.container(0,0);
        lvl6 = this.add.container(0,0);
        lvl7 = this.add.container(0,0);
        lvlPoint = this.add.container(0,0);

        lvl0.add(this.add.image(0, 0, 'lvl0').setOrigin(0.5, 0.5).setDisplaySize(originalSize, originalSize));
        lvl1.add(this.add.image(0, 0, 'lvl1').setOrigin(0.5, 0.5).setDisplaySize(originalSize, originalSize)); 
        lvl2.add(this.add.image(0, 0, 'lvl2').setOrigin(0.5, 0.5).setDisplaySize(originalSize, originalSize));
        lvl3.add(this.add.image(0, 0, 'lvl3').setOrigin(0.5, 0.5).setDisplaySize(originalSize, originalSize));
        lvl4.add(this.add.image(0, 0, 'lvl4').setOrigin(0.5, 0.5).setDisplaySize(originalSize, originalSize));
        lvl5.add(this.add.image(0, 0, 'lvl5').setOrigin(0.5, 0.5).setDisplaySize(originalSize, originalSize));
        lvl6.add(this.add.image(0, 0, 'lvl6').setOrigin(0.5, 0.5).setDisplaySize(originalSize, originalSize));
        lvl7.add(this.add.image(0, 0, 'lvl7').setOrigin(0.5, 0.5).setDisplaySize(originalSize, originalSize));
        
        lvlPoint.add(this.add.image(0, 0, 'lvlPoint').setOrigin(0.5, 0.5).setDisplaySize(originalSize, originalSize));

        shadowBox = createSoftShadow(this, 0, 0, 200, 350,0.2);
        //this.add.rectangle(0,0, 200, 350, 0x000000, 0.7)
        //.setOrigin(0.5,0.5)
        shadowBox.setAlpha(0);      // Изначально невидим
        shadowBox2 =createSoftShadow(this, 0, 0, 150, 250,0.3);
        // this.add.rectangle(0,0, 150, 250, 0x000000, 0.5)
        //.setOrigin(0.5,0.5)
        shadowBox2.setAlpha(0);  
        shadowBox3 = createSoftShadow(this, 0, 0, 200, 300,0.2);
        //this.add.rectangle(0,0, 220, 330, 0x000000, 0.5)
        //.setOrigin(0.5,0.5)
        shadowBox3.setAlpha(0); 
        
        shadowBox.setDepth(12);
        shadowBox2.setDepth(10);
        shadowBox3.setDepth(10);
        lvl6.setDepth(11);
        lvl2.setDepth(13);
        lvl5.setDepth(14);
        lvl4.setDepth(15);
        //lvl1.add(shadowBox);
        
        redSquare = this.add.rectangle(0, 0, originalSize, originalSize, 0xff0000,0);  // Квадрат 2048x2048px красного цвета
        redSquare.setOrigin(0.5, 0.5);  // Центр квадрата в его середину
        // Пересчитываем размер квадрата с учетом коэффициента масштабирования
        redSquare.setSize(originalSize , originalSize);

        lvl1.add(redSquare);
        
        // Создаем точку, которая будет находиться в 
        greenDot = this.add.circle(0, 0, 10, 0x00ff00);  // Синяя точка радиусом 10px
        greenDot.setOrigin(0.5, 0.5);  // Центр точки в его середину
        greenDot.setVisible(false);

        lvl1.add(greenDot);

         // Создаём интерактивную зону для маркера
        markerZone = this.add.zone(0, 0, 20, 20)
        .setOrigin(0.5, 0.5)
        .setInteractive();

        lvl1.add(markerZone);

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
            if (!zoomInFlag && !popUpWindowOpen && !isAnimating) {
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
            if(layout==='map' && !isAnimating){
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
                    isPoint = false
                    moveMap(pointer,this);
                    const tweenData = [
                    { target: lvl2, duration: 70 },
                    { target: lvl4, duration: 70 },
                    { target: lvl7, duration: 70 },
                    { target: lvl6, duration: 100 },
                    { target: lvl5, duration: 200 },
                    { target: lvl3, duration: 200 },
                    {
                        target: lvl1,
                        duration: 300,
                        onUpdate: () => {
                            const shadowTweens = [
                                {
                                    target: shadowBox,
                                    x: lvl2.x - 290,
                                    y: lvl2.y + 70,
                                    duration: 100
                                },
                                {
                                    target: shadowBox2,
                                    x: lvl5.x + 350,
                                    y: lvl5.y - 50,
                                    duration: 150
                                },
                                {
                                    target: shadowBox3,
                                    x: lvl6.x - 175,
                                    y: lvl6.y - 170,
                                    duration: 200
                                }
                            ];

                            shadowTweens.forEach(({ target, x, y, duration }) => {
                                this.tweens.add({
                                    targets: target,
                                    x,
                                    y,
                                    duration,
                                    ease: 'Quad.easeOut'
                                });
                            });
                        }
                    },
                    { target: lvl0, duration: 600 }
                ];

                // Запускаем все анимации
                tweenData.forEach(({ target, duration, onUpdate }) => {
                    this.tweens.add({
                        targets: target,
                        x: lvlPoint.x,
                        y: lvlPoint.y,
                        duration,
                        ease: 'Quad.easeOut',
                        onUpdate: onUpdate || undefined
                    });
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
            
        });

        // Глобальный обработчик завершения ввода (для мыши, сенсорных экранов и других устройств)
        window.addEventListener('pointerup', () => {
            isDown = false;
            isDragging = false;
        });
}

function moveSquareToGreenDot(scene, flag) {
    let duration = flag ? 1 : 1750;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Координаты greenDot в мировых координатах
    const worldGreenDotX = lvlPoint.x + greenDot.x;
    const worldGreenDotY = lvlPoint.y + greenDot.y;

    const offsetX = centerX - worldGreenDotX;
    const offsetY = centerY - worldGreenDotY;

    const targetX = lvlPoint.x + offsetX;
    const targetY = lvlPoint.y + offsetY;

      // Двигаем оба слоя одновременно, но с разной амплитудой
     scene.tweens.add({
            targets: lvlPoint,
            x: targetX,
            y: targetY,
            duration: duration,
            ease: 'Quad.easeInOut',
            onUpdate: () => {
                // Двигаем слои вручную с инерцией (линейно или easing через формулу)
                const follow = (target, speed = 2.7) => {
                    target.x += (lvlPoint.x - target.x) * speed;
                    target.y += (lvlPoint.y - target.y) * speed;
                };

                follow(lvl2, 1.8);   // Быстро
                follow(lvl4, 1.8);
                follow(lvl7, 1.8);
                follow(lvl6, 1.3);   // Чуть медленнее
                follow(lvl5, 0.6);
                follow(lvl3, 0.6);
                follow(lvl1, 0.4);   // Самый медленный
                follow(lvl0, 0.2);  // Очень медленно, как фон

                const followShadow = (shadow, target, offsetX, offsetY, speed) => {
                    shadow.x += ((target.x + offsetX) - shadow.x) * speed;
                    shadow.y += ((target.y + offsetY) - shadow.y) * speed;
                };

                followShadow(shadowBox, lvl2, -290, 70, 1.3);
                followShadow(shadowBox2, lvl5, 350, -50, 0.4);
                followShadow(shadowBox3, lvl6, -175, -170, 1.1);
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

        const frontTargetX = lvlPoint.x + offsetX;
        const frontTargetY = lvlPoint.y + offsetY;

        // Двигаем оба слоя одновременно, но с разной амплитудой
        scene.tweens.add({
            targets: lvlPoint,
            x: frontTargetX,
            y: frontTargetY,
            duration: 1750,
            ease: 'Quad.easeInOut',
            onUpdate: () => {
                // Двигаем слои вручную с инерцией (линейно или easing через формулу)
                const follow = (target, speed = 2.7) => {
                    target.x += (lvlPoint.x - target.x) * speed;
                    target.y += (lvlPoint.y - target.y) * speed;
                };

                follow(lvl2, 1.8);   // Быстро
                follow(lvl4, 1.8);
                follow(lvl7, 1.8);
                follow(lvl6, 1.3);   // Чуть медленнее
                follow(lvl5, 0.6);
                follow(lvl3, 0.6);
                follow(lvl1, 0.4);   // Самый медленный
                follow(lvl0, 0.2);  // Очень медленно, как фон

                const followShadow = (shadow, target, offsetX, offsetY, speed) => {
                    shadow.x += ((target.x + offsetX) - shadow.x) * speed;
                    shadow.y += ((target.y + offsetY) - shadow.y) * speed;
                };

                followShadow(shadowBox, lvl2, -290, 70, 1.3);
                followShadow(shadowBox2, lvl5, 350, -50, 0.4);
                followShadow(shadowBox3, lvl6, -175, -170, 1.1);
                },
            onComplete: () => {
                if (layout === 'map') {
                    zoomInFlag ? zoomIn(scene) : zoomOut(scene);
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

        scene.tweens.add({
            targets: lvl2,
            //depth: 200,        // Ближе к пользователю
            scaleX: 1.1,       // Увеличение по оси X
            scaleY: 1.1,       // Увеличение по оси Y
           // alpha: 1,          // Полная видимость
            duration: 1400,
            ease: 'Quad.easeInOut',
            onStart: () => {
                scene.tweens.add({
                    targets: shadowBox,
                    //depth: 200,        // Ближе к пользователю
                    scaleX: 1,       // Увеличение по оси X
                    scaleY: 1,       // Увеличение по оси Y
                    alpha: 1,          // Полная видимость
                    duration: 1400,
                    ease: 'Quad.easeInOut',
                });
            }
        });

        scene.tweens.add({
            targets: lvl5,
            //depth: 200,        // Ближе к пользователю
            scaleX: 1.05,       // Увеличение по оси X
            scaleY: 1.05,       // Увеличение по оси Y
           // alpha: 1,          // Полная видимость
            duration: 1400,
            ease: 'Quad.easeInOut',
             onStart: () => {
                scene.tweens.add({
                    targets: shadowBox2,
                    //depth: 200,        // Ближе к пользователю
                    scaleX: 1,       // Увеличение по оси X
                    scaleY: 1,       // Увеличение по оси Y
                    alpha: 1,          // Полная видимость
                    duration: 1400,
                    ease: 'Quad.easeInOut',
                });
            }
        });


        scene.tweens.add({
            targets: lvl6,
            //depth: 200,        // Ближе к пользователю
            scaleX: 1.1,       // Увеличение по оси X
            scaleY: 1.1,       // Увеличение по оси Y
           // alpha: 1,          // Полная видимость
            duration: 1400,
            ease: 'Quad.easeInOut',

              onStart: () => {
                scene.tweens.add({
                    targets: shadowBox3,
                    //depth: 200,        // Ближе к пользователю
                    scaleX: 1,       // Увеличение по оси X
                    scaleY: 1,       // Увеличение по оси Y
                    alpha: 1,          // Полная видимость
                    duration: 1400,
                    ease: 'Quad.easeInOut',
                });
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

        scene.tweens.add({
            targets: lvl2,
            //depth: 200,        // Ближе к пользователю
            scaleX: 1,       // Увеличение по оси X
            scaleY: 1,       // Увеличение по оси Y
           // alpha: 1,          // Полная видимость
            duration: 1400,
            ease: 'Quad.easeInOut',
              onStart: () => {
                scene.tweens.add({
                    targets: shadowBox,
                    //depth: 200,        // Ближе к пользователю
                    scaleX: 1,       // Увеличение по оси X
                    scaleY: 1,       // Увеличение по оси Y
                    alpha: 0,          // Полная видимость
                    duration: 1400,
                    ease: 'Quad.easeInOut',
                })
            }
        });

        scene.tweens.add({
            targets: lvl5,
            //depth: 200,        // Ближе к пользователю
            scaleX: 1,       // Увеличение по оси X
            scaleY: 1,       // Увеличение по оси Y
           // alpha: 1,          // Полная видимость
            duration: 1400,
            ease: 'Quad.easeInOut',
            onStart: () => {
                scene.tweens.add({
                    targets: shadowBox2,
                    //depth: 200,        // Ближе к пользователю
                    scaleX: 1,       // Увеличение по оси X
                    scaleY: 1,       // Увеличение по оси Y
                    alpha: 0,          // Полная видимость
                    duration: 1400,
                    ease: 'Quad.easeInOut',
                })
            }
        });


        scene.tweens.add({
            targets: lvl6,
            //depth: 200,        // Ближе к пользователю
            scaleX: 1,       // Увеличение по оси X
            scaleY: 1,       // Увеличение по оси Y
           // alpha: 1,          // Полная видимость
            duration: 1400,
            ease: 'Quad.easeInOut',

              onStart: () => {
                scene.tweens.add({
                    targets: shadowBox3,
                    //depth: 200,        // Ближе к пользователю
                    scaleX: 1,       // Увеличение по оси X
                    scaleY: 1,       // Увеличение по оси Y
                    alpha: 0,          // Полная видимость
                    duration: 1400,
                    ease: 'Quad.easeInOut',
                });
            }
        });

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
   
function moveMap(pointer,scene) {
    if (!isDragging || isAnimating) return;

    const deltaX = (pointer.x - previousX);
    const deltaY = (pointer.y - previousY);

    // lvl2 двигается быстрее — например, в 1.2 раза
    const lvlPointSpeed = 1.2;

    const newX_lvlPoint = lvlPoint.x + deltaX * lvlPointSpeed;
    const newY_lvlPoint = lvlPoint.y + deltaY * lvlPointSpeed;


    // Проверка — только по lvl1, например
    if (checkSquareOutOfBoundsWithAnimation(newX_lvlPoint, newY_lvlPoint, redSquare)) {
        lvlPoint.setPosition(newX_lvlPoint,newY_lvlPoint);
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
    greenDot.setPosition(greeDotPositionOfsset.x, greeDotPositionOfsset.y);
    markerZone.setPosition(greeDotPositionOfsset.x, greeDotPositionOfsset.y);

    lvl0.setPosition(centerX , centerY);
    lvl1.setPosition(centerX , centerY);    
    lvl2.setPosition(centerX , centerY);
    lvl3.setPosition(centerX , centerY);
    lvl4.setPosition(centerX , centerY);
    lvl5.setPosition(centerX , centerY);
    lvl6.setPosition(centerX , centerY);
    lvl7.setPosition(centerX , centerY);
    lvlPoint.setPosition(centerX , centerY);
    shadowBox.setPosition(lvl2.x-290, lvl2.y+70);
    shadowBox2.setPosition(lvl5.x+350, lvl5.y-50);
    shadowBox3.setPosition(lvl6.x-175, lvl6.y-170);
}

export {switchingState,showPopup};