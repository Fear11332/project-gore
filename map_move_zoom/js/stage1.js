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

function preload() { 
    this.load.image('cross','https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_stage1_cross_1_02.webp');
    this.load.image('a2', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_stage1_tile_A2_1_02.webp');
    this.load.image('a1', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_stage1_tile_A1_1_01.webp');
    this.load.image('a3', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_stage1_tile_A3_1_02.webp');
    this.load.image('a4', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_stage1_tile_A4_1_02.webp');
}

function create() {
    const texture = this.textures.get('cross').getSourceImage();
    const originalWidth = texture.width;
    const originalHeight = texture.height;

    const screenW = this.scale.width;
    const screenH = this.scale.height;

    const scaleX = screenW / originalWidth;
    const scaleY = screenH / originalHeight;
    const scale = Math.max(scaleX, scaleY);

    // Добавляем одно изображение
    this.cross = this.add.image(screenW / 2, screenH / 2, 'cross')
        .setOrigin(0.5)
        .setScale(scale)
        .setScrollFactor(0);
    const imageKeys = ['a1', 'a2', 'a3', 'a4'];
    const hoveredImages = {};

    // начинаем с индекса 1 (если это важно)
    imageKeys.forEach((key, index) => {
        hoveredImages[index + 1] = this.add.image(screenW / 2, screenH / 2, key)
            .setOrigin(0.5)
            .setScale(scale)
            .setScrollFactor(0);
    });

    // Затемнённый оверлей
    /*this.overlayDark = this.add.graphics();
    this.overlayDark.fillStyle(0x000000, 0.5);
    this.overlayDark.fillRect(0, 0, screenW, screenH);

    // Маска (вырезы)
    this.maskShape = this.make.graphics();
    const geometryMask = this.maskShape.createGeometryMask();
    geometryMask.invertAlpha = true;
    this.overlayDark.setMask(geometryMask);*/

    // 4. Маска по умолчанию — скрыта
    let maskVisible = false;

    let initialScaleX = hoveredImages[1].scaleX;
    let initialScaleY = hoveredImages[1].scaleY;
    let currentImage = null;

    //updateMask();

   const showMask = (image) => {
        if (!maskVisible) {
            maskVisible = true;

            if (!initialScaleX) initialScaleX = image.scaleX;
            if (!initialScaleY) initialScaleY = image.scaleY;
        }

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

    const hideMask = () => {
        if (!maskVisible || !currentImage) return;

        // Возвращаем текущему изображению начальный масштаб сразу
        currentImage.scaleX = initialScaleX;
        currentImage.scaleY = initialScaleY;

        maskVisible = false;
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
        const key = getHoveredImageKey(pointer);
        if (!key) {
            hideMask();
            return;
        }

        const image = hoveredImages[Number(key.slice(1))];

        const localX = pointer.x - (image.x - image.displayWidth / 2);
        const localY = pointer.y - (image.y - image.displayHeight / 2);
        const frame = this.textures.get(image.texture.key).getSourceImage();
        const pixelX = Math.floor(localX * (frame.width / image.displayWidth));
        const pixelY = Math.floor(localY * (frame.height / image.displayHeight));

        const alpha = this.textures.getPixelAlpha(pixelX, pixelY, image.texture.key);
        if (alpha > 0) {
            showMask.call(this, image);
        } else {
            hideMask.call(this);
        }
    });


    // 7. Скрываем маску при выходе курсора за пределы канваса
    /*this.input.on('pointerout', () => {
        //hideMask();
        console.log('Pointer out of canvas');
    });*/
        
    
    // 4. Центрируем при изменении размера окна
    this.scale.on('resize', (gameSize) => {
        const screenW = gameSize.width;
        const screenH = gameSize.height;

        const scaleX = screenW / originalWidth;
        const scaleY = screenH / originalHeight;
        const scale = Math.max(scaleX, scaleY);

        this.cross.setDisplaySize(originalWidth * scale, originalHeight * scale);
        this.cross.setPosition(screenW / 2, screenH / 2);

        imageKeys.forEach((key, index) => {
            hoveredImages[index + 1].setDisplaySize(originalWidth * scale, originalHeight * scale);
            hoveredImages[index + 1].setPosition(screenW / 2, screenH / 2);
        });
        
         // Обновляем размеры оверлея
        /*this.overlayDark.clear();
        this.overlayDark.fillStyle(0x000000, 0.5);
        this.overlayDark.fillRect(0, 0, screenW, screenH);*/
        initialScaleX = hoveredImages[1].scaleX;
        initialScaleY = hoveredImages[1].scaleY;
         // Если маска сейчас видна, перерисовываем вырез в новых координатах
        if (maskVisible && currentImage) {
            currentImage.setScale(initialScaleX * 1.1, initialScaleY * 1.1);
        }
    });

    // Иногда полезно также слушать pointercancel (отмена события)
    /*this.input.on('pointercancel', () => {
        hideMask();
    });*/

    // 2. Слушаем клик
    this.input.on('pointerdown', (pointer) => {
        const key = getHoveredImageKey(pointer);
        if (!key) return;

        const image = hoveredImages[Number(key.slice(1))];

        const localX = pointer.x - (image.x - image.displayWidth / 2);
        const localY = pointer.y - (image.y - image.displayHeight / 2);
        const frame = this.textures.get(image.texture.key).getSourceImage();
        const pixelX = Math.floor(localX * (frame.width / image.displayWidth));
        const pixelY = Math.floor(localY * (frame.height / image.displayHeight));

        const alpha = this.textures.getPixelAlpha(pixelX, pixelY, image.texture.key);

        if (alpha > 0 && key === 'a2') {
            showMask(image);
            openStage2();
        } else {
            if (!stageThreeIsOpen && !constructorIsOpen) {
                closeStage2();
            }
        }
    });
}