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
    this.load.image('map', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_stage1_4_01.webp');
}

function create() {
     this.bg = this.add.image(this.scale.width / 2, this.scale.height / 2, 'map')
        .setOrigin(0.5)
        .setScrollFactor(0); // Не двигается вместе с камерой

    // 2. Сохраняем оригинальные размеры изображения
    const originalWidth = this.textures.get('map').getSourceImage().width;
    const originalHeight = this.textures.get('map').getSourceImage().height;

    const screenW = this.scale.width;
    const screenH = this.scale.height;

    const scaleX = screenW / originalWidth;
    const scaleY = screenH / originalHeight;
    const scale = Math.min(scaleX, scaleY); // сохраняет пропорции

    this.bg.setDisplaySize(originalWidth * scale, originalHeight * scale);

    // 3. Центрируем при старте
    this.bg.setPosition(this.scale.width / 2, this.scale.height / 2);

    // 4. Центрируем при изменении размера окна
    this.scale.on('resize', (gameSize) => {
        const screenW = gameSize.width;
        const screenH = gameSize.height;

        const scaleX = screenW / originalWidth;
        const scaleY = screenH / originalHeight;
        const scale = Math.min(scaleX, scaleY);

        this.bg.setDisplaySize(originalWidth * scale, originalHeight * scale);
        this.bg.setPosition(screenW / 2, screenH / 2);
    });

    // 2. Слушаем клик
    this.input.on('pointerdown', (pointer) => {
        const canvasBounds = this.game.canvas.getBoundingClientRect();
        const x = canvasBounds.left + pointer.x;
        const y = canvasBounds.top + pointer.y;
        if (!isFinite(x) || !isFinite(y)) return;

        const clickedElement = document.elementFromPoint(x, y);

        if (
            clickedElement?.closest('#mute-toggle') || 
            clickedElement?.closest('#phaser') || 
            clickedElement?.closest('#controls')
        ) return;

        const inTarget = isInTargetArea.call(this, pointer);

        if (inTarget) {
            openStage2();
        } else {
            if (!stageThreeIsOpen && !constructorIsOpen) {
                closeStage2();
            }
        }
    });
}

function isInTargetArea(pointer) {
    const targetX = this.scale.width / 2;    // центр
    const targetY = this.scale.height / 2;   // центр
    const radius = 50;                       // радиус чувствительной зоны

    const dx = pointer.x - targetX;
    const dy = pointer.y - targetY;

    return dx * dx + dy * dy <= radius * radius;
}
