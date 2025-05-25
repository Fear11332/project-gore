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
    // 1. Отрисовываем фон
    this.bg = this.add.image(this.scale.width / 2, this.scale.height / 2, 'map')
        .setOrigin(0.5)
        .setDisplaySize(this.scale.width, this.scale.height)
        .setInteractive();

    // 2. Слушаем клик
    this.bg.on('pointerdown', (pointer) => {
        const canvasBounds = this.game.canvas.getBoundingClientRect();
        const x = canvasBounds.left + pointer.x;
        const y = canvasBounds.top + pointer.y;

        // Проверка безопасности
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


    // 3. При ресайзе обновляем размеры
    this.scale.on('resize', (gameSize) => {
        this.bg.setDisplaySize(gameSize.width, gameSize.height);
        this.bg.setPosition(gameSize.width / 2, gameSize.height / 2);
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
