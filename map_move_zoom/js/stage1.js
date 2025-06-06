import {openStage2,closeStage2,stageThreeIsOpen,constructorIsOpen} from "https://fear11332.github.io/project-gore/map_move_zoom/js/popup.js";

const config = {
    type: Phaser.AUTO,
    parent:"stage1",
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: {
        preload: preload,
        create: create
    }
};

const game = new Phaser.Game(config);
let showStage2 = false;
const stage1 = document.getElementById('stage1');
let stage  = 'stage0';
let initialScaleX = null;
let initialScaleY = null;
let currentImage = null;
const imageKeys = ['a1', 'a2', 'a3', 'a4'];
const hoveredImages = {};
let isTransitioning = false;

function preload() { 
    this.load.image('cross','https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_stage1_cross_1_02.webp');
    this.load.image('a2', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_stage1_tile_A2_1_02.webp');
    this.load.image('a1', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_stage1_tile_A1_1_01.webp');
    this.load.image('a3', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_stage1_tile_A3_1_02.webp');
    this.load.image('a4', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_stage1_tile_A4_1_02.webp');
    //this.load.image('cloud1', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_st0_clouds_1_02.webp');
    //this.load.image('cloud2', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_st0_clouds_2_02.webp');
    //this.load.image('cloud3', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_st0_clouds_3_02.webp');
    //this.load.image('cloud4', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_st0_clouds_4_02.webp');
    //this.load.image('enter_to_stage1', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_stage1_text_1_02.webp');
}


function create() {
    //this.cloudDragStart = null;
    //this.cloudInitialPositions = [];
    const texture = this.textures.get('cross').getSourceImage();
    const originalWidth = texture.width;
    const originalHeight = texture.height;

    const screenW = this.scale.width;
    const screenH = this.scale.height;

    const scaleX = screenW / originalWidth;
    const scaleY = screenH / originalHeight;
    const scale = Math.max(scaleX, scaleY);

    /*for (let i = 1; i <= 4; i++) {
        this[`cloud${i}`] = this.add.image(screenW/2,screenH/2, `cloud${i}`)
            .setOrigin(0.5)
            .setScale(scale)
            .setDepth(100);
            this.cloudInitialPositions.push({ x: this[`cloud${i}`].x, y: this[`cloud${i}`].y });
    }

    this.enterToStage1 = this.add.image(screenW / 2, screenH / 2, 'enter_to_stage1')
            .setOrigin(0.5)
            .setScale(scale)
            .setDepth(200);  // повыше облаков (у них 100)

    // Скорости для каждого слоя (чем дальше — тем медленнее)
    //this.cloudSpeeds = [0.07, 0.09, 0.1, 0.15];*/
     
    // Добавляем одно изображение
    this.cross = this.add.image(screenW / 2, screenH / 2, 'cross')
        .setOrigin(0.5)
        .setScale(scale)
        .setScrollFactor(0);

    // начинаем с индекса 1 (если это важно)
    imageKeys.forEach((key, index) => {
        hoveredImages[index + 1] = this.add.image(screenW / 2, screenH / 2, key)
            .setOrigin(0.5)
            .setScale(scale)
            .setScrollFactor(0);
    });

    initialScaleX = hoveredImages[1].scaleX;
    initialScaleY = hoveredImages[1].scaleY;

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

    const getHoveredImageKey = (pointer) => {
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        const isLeft = pointer.x < centerX;
        const isTop = pointer.y < centerY;

        if (isTop && isLeft) return 'a1'; // верх-лево
        if (isTop && !isLeft) return 'a2'; // верх-право
        if (!isTop && isLeft) return 'a3'; // низ-лево
        if (!isTop && !isLeft) return 'a4'; // низ-право

        return null;
    };

    this.input.on('pointermove', (pointer) => {
        if (isTransitioning) return;
        /*if(stage === 'stage0'  && this.cloudDragStart && pointer.isDown){
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
                const baseX = this.cloudInitialPositions[i - 1].x;
                const baseY = this.cloudInitialPositions[i - 1].y;

                let newX = baseX + dx * this.cloudSpeeds[i - 1];
                let newY = baseY + dy * this.cloudSpeeds[i - 1];

                newX = Phaser.Math.Clamp(newX, leftBound, rightBound);
                newY = Phaser.Math.Clamp(newY, topBound, bottomBound);

                this[`cloud${i}`].setPosition(newX, newY);
            }
        }else{*/
           // if(stage==='stage0') return;
                const key = getHoveredImageKey(pointer);
                if (!key) {
                    toogleZoomOut();
                    return;
                }

                const image = hoveredImages[Number(key.slice(1))];

                const localX = pointer.x - (image.x - image.displayWidth / 2);
                const localY = pointer.y - (image.y - image.displayHeight / 2);
                const frame = this.textures.get(image.texture.key).getSourceImage();
                const pixelX = Math.floor(localX * (frame.width / image.displayWidth));
                const pixelY = Math.floor(localY * (frame.height / image.displayHeight));

                const alpha = this.textures.getPixelAlpha(pixelX, pixelY, image.texture.key);
                if(!showStage2){
                    if (alpha > 0 ) {
                        toogleZoomIn.call(this, image);
                    } else {
                        toogleZoomOut.call(this);
                    }
                }
         // }
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

        /*for (let i = 1; i <= 4; i++) {
            const cloud = this[`cloud${i}`];
            if (!cloud) continue;

            cloud.setDisplaySize(originalWidth * scale, originalHeight * scale);

            this.tweens.add({
                targets: cloud,
                x: screenW / 2,
                y: screenH / 2,
                ease: 'Power2',
                duration: 1000,
                delay: (i - 1) * 50
            });

            // Обновляем начальные позиции для логики перемещения
            if (this.cloudInitialPositions && this.cloudInitialPositions[i - 1]) {
                this.cloudInitialPositions[i - 1] = { x: screenW / 2, y: screenH / 2 };
            }
        }*/

        //this.enterToStage1.setDisplaySize(originalWidth * scale, originalHeight * scale);
        //this.enterToStage1.setPosition(screenW / 2, screenH / 2);

        imageKeys.forEach((key, index) => {
            hoveredImages[index + 1].setDisplaySize(originalWidth * scale, originalHeight * scale);
            hoveredImages[index + 1].setPosition(screenW / 2, screenH / 2);

        });
        
        initialScaleX = hoveredImages[1].scaleX;
        initialScaleY = hoveredImages[1].scaleY;
         // Если маска сейчас видна, перерисовываем вырез в новых координатах
        if (currentImage) {
            currentImage.setScale(initialScaleX * 1.1, initialScaleY * 1.1);
        }
    });


    // 2. Слушаем клик
    this.input.on('pointerdown', (pointer) => {
        if (isTransitioning) return;
        //if(stage==='stage1'){
            if(showStage2){
                if (!stageThreeIsOpen && !constructorIsOpen) {
                    closeStage2();
                    showStage2 = false;
                }
                return;
            }

            const key = getHoveredImageKey(pointer);
            if (!key) return;

            const image = hoveredImages[Number(key.slice(1))];

            const localX = pointer.x - (image.x - image.displayWidth / 2);
            const localY = pointer.y - (image.y - image.displayHeight / 2);
            const frame = this.textures.get(image.texture.key).getSourceImage();
            const pixelX = Math.floor(localX * (frame.width / image.displayWidth));
            const pixelY = Math.floor(localY * (frame.height / image.displayHeight));

            const alpha = this.textures.getPixelAlpha(pixelX, pixelY, image.texture.key);

            if (alpha > 0) {
                if(!showStage2){
                    toogleZoomIn.call(this, image);
                    if(key==='a2'){
                        showStage2 = true;
                        openStage2();
                    }
                }
            }
       /* }else{
             // Рассчитываем локальные координаты клика внутри картинки
            const localX = pointer.x - (this.enterToStage1.x - this.enterToStage1.displayWidth / 2);
            const localY = pointer.y - (this.enterToStage1.y - this.enterToStage1.displayHeight / 2);

            // Получаем исходное изображение для получения пикселя
            const frame = this.textures.get(this.enterToStage1.texture.key).getSourceImage();

            // Преобразуем координаты в пиксели исходного изображения
            const pixelX = Math.floor(localX * (frame.width / this.enterToStage1.displayWidth));
            const pixelY = Math.floor(localY * (frame.height / this.enterToStage1.displayHeight));

            // Проверяем альфа-канал пикселя
            const alpha = this.textures.getPixelAlpha(pixelX, pixelY, this.enterToStage1.texture.key);

            if(alpha > 0){
                // Запускаем анимацию облаков
                isTransitioning = true;
                //diveThroughCloudsAnimation.call(this);
            }else{
                 /*this.cloudDragStart = { x: pointer.x, y: pointer.y };
                // Записываем начальные позиции облаков из переменных cloud1..cloud4
                this.cloudInitialPositions = [];
                for(let i = 1; i <= 4; i++){
                    const cloud = this[`cloud${i}`];
                    if(cloud){
                        this.cloudInitialPositions.push({ x: cloud.x, y: cloud.y });
                    }
                }
            }
        }*/
    });

    this.input.on('pointerup', (pointer) => {
        if (isTransitioning) return;
        //if(stage==='stage1'){
            toogleZoomOut();
        //}else{
            //this.cloudDragStart = null;
            //this.cloudInitialPositions = [];
        //}
    });
}

function diveThroughCloudsAnimation() {
    const duration = 1800;
    const currentTextScale = this.enterToStage1.scaleX;
    const targetTextScale = currentTextScale * 2;

    /*const cloud1CurrentScale = this.cloud1.scaleX;
    const cloud2CurrentScale = this.cloud2.scaleX;
    const cloud3CurrentScale = this.cloud3.scaleX;
    const cloud4CurrentScale = this.cloud4.scaleX;

    const cloud1TargetScale = cloud1CurrentScale * 2;
    const cloud2TargetScale = cloud2CurrentScale * 2;
    const cloud3TargetScale = cloud3CurrentScale * 2;
    const cloud4TargetScale = cloud4CurrentScale * 2;*/

    this.tweens.addCounter({
        from: 0,
        to: 1,
        duration,
        ease: 'Power1.easeInOut',
        onUpdate: tween => {
            const progress = tween.getValue();
            const textProgress = Math.min(1, progress * 1.56);

            // Текст
            this.enterToStage1.setScale(
                Phaser.Math.Linear(currentTextScale, targetTextScale, textProgress)
            );
            this.enterToStage1.setAlpha(1 - textProgress);

            // Облака
            /*this.cloud1.setScale(Phaser.Math.Linear(cloud1CurrentScale, cloud1TargetScale, textProgress));
            this.cloud1.setAlpha(1 - textProgress);

            this.cloud2.setScale(Phaser.Math.Linear(cloud2CurrentScale, cloud2TargetScale, textProgress));
            this.cloud2.setAlpha(1 - textProgress);

            this.cloud3.setScale(Phaser.Math.Linear(cloud3CurrentScale, cloud3TargetScale, textProgress));
            this.cloud3.setAlpha(1 - textProgress);

            this.cloud4.setScale(Phaser.Math.Linear(cloud4CurrentScale, cloud4TargetScale, textProgress));
            this.cloud4.setAlpha(1 - textProgress);*/
        },
        onComplete: () => {
            stage = 'stage1';
            isTransitioning = false;
        }
    });
}





