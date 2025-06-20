export function initGame(Phaser) {
const config = {
    type: Phaser.AUTO,
    parent:"stage1",
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: {
        preload: preload
    }
};

const game = new Phaser.Game(config);
let showStage2 = false;
const stage1 = document.getElementById('stage1');
let stage  = 'stage0';
let initialScaleX = null;
let initialScaleY = null;
let currentImage = null;
let isTransitioning = false;
let gameScene = null;
const frozenQueue = [];
let isSceneFrozen = false; // Флаг для заморозки сцены

async function preload() {
    // 1. Добавляем текст сразу, чтобы он был на экране как можно раньше
    this.loadingText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Loading', {
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
        this.load.image('cross','https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_stage1_cross_1_02.webp');
        this.load.image('a2', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_stage1_tile_A2_1_02.webp');
        this.load.image('a1', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_stage1_tile_A1_1_01.webp');
        this.load.image('a3', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_stage1_tile_A3_1_02.webp');
        this.load.image('a4', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_stage1_tile_A4_1_02.webp');
        this.load.image('cloud1', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_st0_clouds_1_02.webp');
        this.load.image('cloud2', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_st0_clouds_2_02.webp');
        this.load.image('cloud3', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_st0_clouds_3_02.webp');
        this.load.image('cloud4', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_st0_clouds_4_02.webp');
        this.load.image('enter_to_stage1', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_stage1_text_1_02.webp');
        // Когда все ресурсы загружены, resolve проми
        this.load.once('complete', resolve);
        this.load.start();
    });
}

function create() {
    gameScene = this;
    this.cloudDragStart = null;
    this.cloudInitialPositions = [];
    const texture = this.textures.get('cross').getSourceImage();
    const originalWidth = texture.width;
    const originalHeight = texture.height;

    const screenW = this.scale.width;
    const screenH = this.scale.height;

    const scaleX = screenW / originalWidth;
    const scaleY = screenH / originalHeight;
    const scale = Math.max(scaleX, scaleY);

    this.cloud1 = this.add.image(screenW/2, screenH/2, 'cloud1')
            .setOrigin(0.5)
            .setScale(scale)
            .setDepth(101);  // повыше облаков (у них 100)

        this.cloud2 = this.add.image(screenW/2, screenH/2, 'cloud2')
            .setOrigin(0.5)
            .setScale(scale)
            .setDepth(102);  // повыше облаков (у них 100)

        this.cloud3 = this.add.image(screenW/2, screenH/2, 'cloud3')
            .setOrigin(0.5)
            .setScale(scale)
            .setDepth(103);  // повыше облаков (у них 100)

    this.cloud4 = this.add.image(screenW/2, screenH/2, 'cloud4')
            .setOrigin(0.5)
            .setScale(scale)
            .setDepth(104);  // повыше облаков (у них 100)


    this.enterToStage1 = this.add.image(screenW / 2, screenH / 2, 'enter_to_stage1')
            .setOrigin(0.5)
            .setScale(scale)
            .setDepth(200);  // повыше облаков (у них 100)

    // Скорости для каждого слоя (чем дальше — тем медленнее)
    this.cloudSpeeds = [0.04, 0.07, 0.1, 0.2];
     
    // Добавляем одно изображение
    this.cross = this.add.image(screenW / 2, screenH / 2, 'cross')
        .setOrigin(0.5)
        .setScale(scale)
        .setScrollFactor(0);
    
    this.a1 = this.add.image(screenW / 2, screenH / 2, 'a1')
        .setOrigin(0.5)
        .setScale(scale)
        .setScrollFactor(0);
    
    this.a2 = this.add.image(screenW / 2, screenH / 2, 'a2')
        .setOrigin(0.5)
        .setScale(scale)
        .setScrollFactor(0);
    
    this.a3 = this.add.image(screenW / 2, screenH / 2, 'a3')
        .setOrigin(0.5)
        .setScale(scale)
        .setScrollFactor(0);

    this.a4 = this.add.image(screenW / 2, screenH / 2, 'a4')
        .setOrigin(0.5)
        .setScale(scale)
        .setScrollFactor(0);

    this.enterZone = this.add.zone(
        this.scale.width / 2,
        this.scale.height / 2,
        this.enterToStage1.displayWidth*0.14,
        this.enterToStage1.displayWidth*0.14
    ).setOrigin(0.5).setInteractive();
    

    initialScaleX = this.a1.scaleX;
    initialScaleY = this.a1.scaleY ;

    const toogleZoomIn = (image) => {
        if (!initialScaleX) initialScaleX = image.scaleX;
        if (!initialScaleY) initialScaleY = image.scaleY;

        if (currentImage && currentImage !== image) {
            // Возвращаем предыдущему изображению начальный масштаб сразу
            currentImage.scaleX = initialScaleX;
            currentImage.scaleY = initialScaleY;
        }

        currentImage = image;

        // Увеличиваем масштаб сразу без анимации
        image.scaleX = initialScaleX * 1.1;
        image.scaleY = initialScaleY * 1.1;
    };

    const toogleZoomOut = () => {
        if (!currentImage) return;
        // Возвращаем текущему изображению начальный масштаб сразу
        currentImage.scaleX = initialScaleX;
        currentImage.scaleY = initialScaleY;
        currentImage = null;
    };

    const getHoveredImageKeyByGrid = (pointer, image, scaleFactor = 0.47) => {
        // Размер сеточной области
        const gridWidth = image.displayWidth * scaleFactor;
        const gridHeight = image.displayHeight * scaleFactor;

        // Отступ сетки от краёв картинки
        const offsetX = (image.displayWidth - gridWidth) / 2;
        const offsetY = (image.displayHeight - gridHeight) / 2;

        // Локальные координаты указателя относительно сетки
        const localX = pointer.x - (image.x - image.displayWidth / 2) - offsetX;
        const localY = pointer.y - (image.y - image.displayHeight / 2) - offsetY;

        // Проверка попадания в сетку
        if (localX < 0 || localX > gridWidth || localY < 0 || localY > gridHeight) return null;

        const cellWidth = gridWidth / 2;
        const cellHeight = gridHeight / 2;

        const isLeft = localX < cellWidth;
        const isTop = localY < cellHeight;

        if (isTop && isLeft) return 'a1';
        if (isTop && !isLeft) return 'a2';
        if (!isTop && isLeft) return 'a3';
        return 'a4';
    };

    this.input.on('pointermove', (pointer) => {
        if (isTransitioning) return;
        if(stage === 'stage0'  && this.cloudDragStart && pointer.isDown){
            const mapCenterX = this.cameras.main.centerX;
            const mapCenterY = this.cameras.main.centerY;
            const mapWidth = this.cameras.main.width;
            const mapHeight = this.cameras.main.height;

            const dx = pointer.x - this.cloudDragStart.x;
            const dy = pointer.y - this.cloudDragStart.y;

            const boundaryFactor = 0.5;

            const leftBound = mapCenterX - (mapWidth / 2) * boundaryFactor;
            const rightBound = mapCenterX + (mapWidth / 2) * boundaryFactor;
            const topBound = mapCenterY - (mapHeight / 2) * boundaryFactor;
            const bottomBound = mapCenterY + (mapHeight / 2) * boundaryFactor;

            for (let i = 1; i <= 4; i++) {
                const cloud = this[`cloud${i}`];
                const baseX = this.cloudInitialPositions[i - 1].x;
                const baseY = this.cloudInitialPositions[i - 1].y;

                let targetX = baseX + dx * this.cloudSpeeds[i - 1];
                let targetY = baseY + dy * this.cloudSpeeds[i - 1];

                targetX = Phaser.Math.Clamp(targetX, leftBound, rightBound);
                targetY = Phaser.Math.Clamp(targetY, topBound, bottomBound);

                // Плавное приближение к целевой позиции
                const lerpFactor = 0.15; // Чем меньше — тем плавнее

                const newX = Phaser.Math.Linear(cloud.x, targetX, lerpFactor);
                const newY = Phaser.Math.Linear(cloud.y, targetY, lerpFactor);

                cloud.setPosition(newX, newY);
            }
        }else if (stage === 'stage1' && !showStage2) {
            const key = getHoveredImageKeyByGrid(pointer, this.a1); // берем базовую картинку для сетки
            if (key) {
                toogleZoomIn.call(this, this[key]);
            } else {
                toogleZoomOut.call(this);
            }
        }
    });
           
    // 4. Центрируем при изменении размера окна
    this.scale.on('resize', (gameSize) => {
        const screenW = gameSize.width;
        const screenH = gameSize.height;

        const scaleX = screenW / originalWidth;
        const scaleY = screenH / originalHeight;
        const scale = Math.max(scaleX, scaleY);

        this.cross.setDisplaySize(originalWidth * scale, originalHeight * scale);
        this.cross.setPosition(screenW / 2, screenH / 2);
        
       this.cloud1.setDisplaySize(originalWidth*scale, originalHeight*scale);
       this.cloud1.setPosition(screenW/2,screenH/2);

        this.cloud2.setDisplaySize(originalWidth*scale, originalHeight*scale);
       this.cloud2.setPosition(screenW/2,screenH/2);

        this.cloud3.setDisplaySize(originalWidth*scale, originalHeight*scale);
       this.cloud3.setPosition(screenW/2,screenH/2);

        this.cloud4.setDisplaySize(originalWidth*scale, originalHeight*scale);
         this.cloud4.setPosition(screenW/2,screenH/2);

        this.enterToStage1.setDisplaySize(originalWidth * scale, originalHeight * scale);
        this.enterToStage1.setPosition(screenW / 2, screenH / 2);

        this.a1.setDisplaySize(originalWidth * scale, originalHeight * scale);
        this.a1.setPosition(screenW / 2, screenH / 2);

        this.a2.setDisplaySize(originalWidth * scale, originalHeight * scale);
        this.a2.setPosition(screenW / 2, screenH / 2);

        this.a3.setDisplaySize(originalWidth * scale, originalHeight * scale);
        this.a3.setPosition(screenW / 2, screenH / 2);

        this.a4.setDisplaySize(originalWidth * scale, originalHeight * scale);
        this.a4.setPosition(screenW / 2, screenH / 2);

        if (this.enterZone) {
            this.enterZone.setSize(this.enterToStage1.displayWidth*0.14, this.enterToStage1.displayHeight*0.14);
            this.enterZone.setPosition(screenW / 2, screenH / 2);
        }
        
        initialScaleX = this.a1.scaleX;
        initialScaleY = this.a1.scaleY;
         // Если маска сейчас видна, перерисовываем вырез в новых координатах
        if (currentImage) {
            currentImage.setScale(initialScaleX * 1.1, initialScaleY * 1.1);
        }
    });

    // 2. Слушаем клик
    this.input.on('pointerdown', (pointer) => {
        if (isTransitioning) return;
        if (stage === 'stage1') {
            const key = getHoveredImageKeyByGrid(pointer, this.a1);
            if (key) {
                toogleZoomIn.call(this, this[key]);
                if (key === 'a2') {
                    destroyScene();
                    setTimeout(() => location.href = 'https://fear11332.github.io/project-gore/map_move_zoom/index2.html', 0);
                }
            }
        } else if (stage === 'stage0') {
            if (this.enterZone.input && this.enterZone.getBounds().contains(pointer.x, pointer.y)) {
                isTransitioning = true;
                this.enterZone.disableInteractive();
                diveThroughCloudsAnimation.call(this);
            } else {
                this.cloudDragStart = { x: pointer.x, y: pointer.y };
                this.cloudInitialPositions = [];
                for (let i = 1; i <= 4; i++) {
                    const cloud = this[`cloud${i}`];
                    this.cloudInitialPositions.push({ x: cloud.x, y: cloud.y });
                }
            }
        }   
    });

    this.input.on('pointerup', (pointer) => {
        if (isTransitioning) return;
        if(stage==='stage1'){
            toogleZoomOut();
        }
        else{
            this.cloudDragStart = null;
            this.cloudInitialPositions = [];
        }
    });
}

function diveThroughCloudsAnimation() {
    const duration = 2900;
    isTransitioning = true;

    const easing = 'Sine.easeInOut';

    // Текст
    this.tweens.add({
        targets: this.enterToStage1,
        scaleX: this.enterToStage1.scaleX * 2,
        scaleY: this.enterToStage1.scaleY * 2,
        alpha: 0,
        ease: easing,
        duration: duration*0.5,
        delay: 0,
    });

    // Облака (отдельно для каждого — с небольшим отличием в тайминге)
    this.tweens.add({
        targets: this.cloud1,
        scaleX: this.cloud1.scaleX * 2,
        scaleY: this.cloud1.scaleY * 2,
        alpha: 0,
        ease: easing,
        delay: 50,
        duration: duration*0.6,
    });

    this.tweens.add({
        targets: this.cloud2,
        scaleX: this.cloud2.scaleX * 2,
        scaleY: this.cloud2.scaleY * 2,
        alpha: 0,
        ease: easing,
        delay: 100,
        duration: duration*0.7,
    });

    this.tweens.add({
        targets: this.cloud3,
        scaleX: this.cloud3.scaleX * 2,
        scaleY: this.cloud3.scaleY * 2,
        alpha: 0,
        ease: easing,
        delay: 250,
        duration: duration*0.8,
    });

    this.tweens.add({
        targets: this.cloud4,
        scaleX: this.cloud4.scaleX * 2,
        scaleY: this.cloud4.scaleY * 2,
        alpha: 0,
        ease: easing,
        delay: 250,
        duration: duration*0.7,
        onComplete: () => {
            stage = 'stage1';
            isTransitioning = false;
        }
    });
}

function destroyScene() {
    if (!gameScene) return;

    // Удаляем изображения, если они существуют
    const imagesToDestroy = [
        gameScene.cross,
        gameScene.cloud1,
        gameScene.cloud2,
        gameScene.cloud3,
        gameScene.cloud4,
        gameScene.enterToStage1,
        gameScene.a1,
        gameScene.a2,
        gameScene.a3,
        gameScene.a4
    ];

    imagesToDestroy.forEach(img => {
        if (img && img.destroy) {
            img.destroy(true);
        }
    });

    // Удаляем интерактивные зоны
    if (gameScene.enterZone) {
        gameScene.enterZone.removeAllListeners();
        gameScene.enterZone.destroy();
        gameScene.enterZone = null;
    }

    // Удаляем текстуры
    const textureKeys = ['cross', 'a1', 'a2', 'a3', 'a4', 'cloud1', 'cloud2', 'cloud3', 'cloud4', 'enter_to_stage1'];
    textureKeys.forEach(key => {
        if (gameScene.textures.exists(key)) {
            gameScene.textures.remove(key);
        }
    });

    // Очистка переменных
    gameScene.cloud1 = null;
    gameScene.cloud2 = null;
    gameScene.cloud3 = null;
    gameScene.cloud4 = null;
    gameScene.cross = null;
    gameScene.enterToStage1 = null;
    gameScene.a1 = null;
    gameScene.a2 = null;
    gameScene.a3 = null;
    gameScene.a4 = null;

    // Очистка input и событий
    gameScene.input?.removeAllListeners?.();
    gameScene.events?.removeAllListeners?.();

    gameScene = null;

    // Останавливаем сцену
    game.scene.stop();
    game.scene.remove('default');

    isTransitioning = false;
    stage = false;

    // Уничтожаем всю игру и канвас, если переходишь на другую страницу
    game.destroy(true);
}
}




