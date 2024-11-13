const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let mapImage;
let dragStartX, dragStartY;
let lastPointerX, lastPointerY; // Переменные для хранения последней позиции указателя
let zoomLevel = 0.6; // Начальный уровень зума
const maxZoom = 2;   // Максимальный уровень зума
const minZoom = 0.6; // Минимальный уровень зума
const gridSize = 100; // Размер ячейки сетки

function preload() {
    // Загрузка изображения карты
    this.load.image('map', '../map.png'); // Используйте ваше изображение карты
}

function create() {
    // Подписываемся на событие завершения загрузки
    this.load.once('complete', () => {
        // Добавляем карту после полной загрузки
        mapImage = this.add.image(0, 0, 'map').setOrigin(0).setDisplaySize(2048, 2048); // Устанавливаем оригинальные размеры

        // Устанавливаем границы камеры по размеру оригинального изображения карты
        this.cameras.main.setBounds(0, 0, 2048, 2048); // Устанавливаем границы по оригинальным размерам

        // Задаем изначальный зум камеры
        this.cameras.main.setZoom(zoomLevel); // Настройте уровень приближения

        drawGrid(this); // Рисуем сетку на карте

        // Включаем перетаскивание мыши или касания для перемещения камеры
        this.input.on('pointerdown', function (pointer) {
            if (!pointer.rightButtonReleased()) { // Проверка, что не был использован правый клик
                // Сохранение стартовой позиции для перемещения
                dragStartX = pointer.x;
                dragStartY = pointer.y;
            } else {
                handleTap(this, pointer);
            }
        }.bind(this));

        this.input.on('pointermove', function (pointer) {
            if (pointer.isDown && !pointer.rightButtonReleased()) { // Проверка, что не был использован правый клик
                // Вычисляем смещение и двигаем камеру
                const dx = dragStartX - pointer.x;
                const dy = dragStartY - pointer.y;

                // Перемещаем камеру с учётом ограничений по границам карты
                this.cameras.main.scrollX = Phaser.Math.Clamp(this.cameras.main.scrollX + dx, 0,4000 - this.cameras.main.width / this.cameras.main.zoom);
                this.cameras.main.scrollY = Phaser.Math.Clamp(this.cameras.main.scrollY + dy, 0,4000 - this.cameras.main.height / this.cameras.main.zoom);

                dragStartX = pointer.x;
                dragStartY = pointer.y;
            }
        }.bind(this));
    });

    // Запускаем загрузку
    this.load.start();
}

function drawGrid(scene) {
    const graphics = scene.add.graphics();
    graphics.lineStyle(1, 0x00ff00, 1); // Зеленый цвет для сетки

    for (let x = 0; x < 2048; x += gridSize) {
        graphics.moveTo(x, 0);
        graphics.lineTo(x, 2048);
    }

    for (let y = 0; y < 2048; y += gridSize) {
        graphics.moveTo(0, y);
        graphics.lineTo(2048, y);
    }

    graphics.strokePath();
}

function handleTap(scene, pointer) {
    const gridX = Math.floor(pointer.x / gridSize) * gridSize;
    const gridY = Math.floor(pointer.y / gridSize) * gridSize;

    // Увеличиваем или сбрасываем уровень зума
    if (zoomLevel < maxZoom) {
        // Увеличиваем зум
        zoomLevel = maxZoom;
    } else {
        // Возвращаемся к начальному уровню зума
        zoomLevel = minZoom;
    }

    scene.cameras.main.setZoom(zoomLevel);
    scene.cameras.main.setScroll(gridX - pointer.x / zoomLevel, gridY - pointer.y / zoomLevel);
}

function update() {
    // Логика обновления (если потребуется)
}

// Обработка изменения размеров окна
window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});
