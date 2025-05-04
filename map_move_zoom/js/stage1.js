import { overlayVisiable } from "https://fear11332.github.io/project-gore/map_move_zoom/js/popup.js";

const config = {
    type: Phaser.AUTO,
    parent:"stage2",
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
const stage2 = document.getElementById('phaser');
const overlay2 = document.getElementById('overlay2');

function preload() {
    
    this.load.image('map', 'https://fear11332.github.io/project-gore/map_move_zoom/images/goreme_site_stage1_4_01.webp');
}

function create() {
    this.mapShow = false;
    // 1. Отрисовываем фон
    this.bg = this.add.image(this.scale.width / 2, this.scale.height / 2, 'map')
        .setOrigin(0.5)
        .setDisplaySize(this.scale.width, this.scale.height)
        .setInteractive();

    // 2. Слушаем клик
    this.bg.on('pointerdown', (pointer) => {
        if (isInTargetArea.call(this, pointer)) {
            stage2.style.opacity = '1';
            
            
            overlay2.style.transition = 'background 1.9s ease-in-out'; // Плавное затемнение
            overlay2.style.background = 'rgba(0, 0, 0, 0.5)'; // Затемняем фон
            setTimeout(() => {
                stage2.style.pointerEvents = 'auto';
                overlay2.style.pointerEvents = 'auto';
                this.mapShow = true;
            }, 1900);
        }else{
            if(this.mapShow && !overlayVisiable){
                stage2.style.opacity = '0'
                overlay2.style.transition = 'background 1.9s ease-in-out'; // Плавное затемнение
                overlay2.style.background = 'rgba(0, 0, 0, 0)'; // Затемняем фон
                setTimeout(() => {
                    stage2.style.pointerEvents = 'none';
                    overlay2.style.pointerEvents = 'none';
                    this.mapShow = false;
                }, 1900);
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

