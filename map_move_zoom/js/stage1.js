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
    this.load.image('cloud1', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_st0_clouds_1_02.webp');
    this.load.image('cloud2', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_st0_clouds_2_02.webp');
    this.load.image('cloud3', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_st0_clouds_3_02.webp');
    this.load.image('cloud4', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_st0_clouds_4_02.webp');
    this.load.image('enter_to_stage1', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_stage1_text_1_02.webp');
}


function create() {
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

    this.cloudLayers = [];

  // Создаем контейнеры для облаков
  for (let i = 0; i < 4; i++) {
    let container = this.add.container(0, 0);
    // Добавляем облако (здесь просто placeholder)
    container.add(this.add.image(0, 0, `cloud${i+1}`).setOrigin(0.5, 0.5).setScale(scale));
    container.setPosition(screenW / 2, screenH / 2); // Центрируем контейнер
    this.cloudLayers.push(container);
  }

  this.cloudLayers.forEach(layer => layer.setDepth(100));

  this.enterToStage1 = this.add.image(screenW / 2, screenH / 2, 'enter_to_stage1')
        .setOrigin(0.5)
        .setScale(scale)
        .setDepth(200);  // повыше облаков (у них 100)

  // Скорости для каждого слоя (чем дальше — тем медленнее)
  this.cloudSpeeds = [0.07, 0.09, 0.1, 0.15];

     
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

    this.input.on('pointermove', pointer => {
        if (isTransitioning) return;
        if(stage === 'stage0' && this.cloudDragStart && pointer.isDown){
             // Добавьте объявления переменных здесь, если они отсутствуют
           /* const mapCenterX = this.cameras.main.centerX; // или другое вычисление
            const mapCenterY = this.cameras.main.centerY;
            const mapWidth = this.cameras.main.width;
            const mapHeight = this.cameras.main.height;

            const dx = pointer.x - this.cloudDragStart.x;
            const dy = pointer.y - this.cloudDragStart.y;

            const boundaryFactor = 0.5; // уменьшаем зону перемещения облаков в 2 раза

            const leftBound = mapCenterX - (mapWidth / 2) * boundaryFactor;
            const rightBound = mapCenterX + (mapWidth / 2) * boundaryFactor;
            const topBound = mapCenterY - (mapHeight / 2) * boundaryFactor;
            const bottomBound = mapCenterY + (mapHeight / 2) * boundaryFactor;

            for(let i = 0; i < this.cloudLayers.length; i++){
                let newX = this.cloudInitialPositions[i].x + dx * this.cloudSpeeds[i];
                let newY = this.cloudInitialPositions[i].y + dy * this.cloudSpeeds[i];

                newX = Phaser.Math.Clamp(newX, leftBound, rightBound);
                newY = Phaser.Math.Clamp(newY, topBound, bottomBound);

                this.cloudLayers[i].x = newX;
                this.cloudLayers[i].y = newY;
            }*/
        }else{
            if(stage==='stage0') return;
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

        this.cloudLayers.forEach((layer, index) => {
        layer.list.forEach(child => {
            child.setDisplaySize(originalWidth * scale, originalHeight * scale);
        });

        // Создаем tween для плавного перемещения контейнера в центр
        this.tweens.add({
                targets: layer,
                x: screenW / 2,
                y: screenH / 2,
                ease: 'Power2',
                duration: 1000,
                delay: index *50 // можно добавить небольшую задержку между слоями
            });
        });

        this.enterToStage1.setDisplaySize(originalWidth * scale, originalHeight * scale);
        this.enterToStage1.setPosition(screenW / 2, screenH / 2);

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
        if(stage==='stage1'){
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
                    //toogleZoomIn.call(this, image);
                    if(key==='a1'){
                        //showStage2 = true;
                        //openStage2();
                    }
                }
            }
        }else{
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
                this.isTransitioning = true;
                diveThroughCloudsAnimation.call(this);
            }else{
                //this.cloudDragStart = { x: pointer.x, y: pointer.y };
                //this.cloudInitialPositions = this.cloudLayers.map(layer => ({ x: layer.x, y: layer.y }));
            }
        }
    });

    this.input.on('pointerup', (pointer) => {
        if (isTransitioning) return;
        if(stage==='stage1'){
            toogleZoomOut();
        }else{
            //this.cloudDragStart = null;
            //this.cloudInitialPositions = [];
        }
    });
}

function diveThroughCloudsAnimation() {
    const duration = 1800;

    const currentScale = this.cloudLayers[0].scaleX;
    const currentTextScale = this.enterToStage1.scaleX;

    this.tweens.addCounter({
        from: currentScale,
        to: currentScale * 2,
        duration: duration,
        ease: 'Power1.easeInOut',
        onUpdate: (tween) => {
            const progress = tween.progress;

            const value = Phaser.Math.Interpolation.Linear([currentScale, currentScale * 2], progress);
            const alpha = 1 - progress;

            this.cloudLayers.forEach(layer => {
                layer.setScale(value);
                layer.setAlpha(alpha);
            });

            // Немного быстрее прогресс для текста
            const textProgress = Math.min(1, progress * 1.56);

            const textScale = Phaser.Math.Interpolation.Linear([currentTextScale, currentTextScale * 2], textProgress);
            const textAlpha = 1 - textProgress;

            this.enterToStage1.setScale(textScale);
            this.enterToStage1.setAlpha(textAlpha);
        },
        onComplete: () => {
            stage = 'stage1';
            isTransitioning = false;
        }
    });
}



