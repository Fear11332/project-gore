//2
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
let zoomLevel = 0.6; // Начальный уровень зума
const maxZoom = 2;   // Максимальный уровень зума
const minZoom = 0.6; // Минимальный уровень зума
const gridSize = 100; // Размер ячейки сетки
let isDragging = false; // Состояние перетаскивания
let isPointerDown = false; // Флаг нажатия указателя

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
            // Сохранение позиции для перетаскивания
            dragStartX = pointer.x;
            dragStartY = pointer.y;
            isDragging = false; // Сбрасываем флаг перетаскивания
            isPointerDown = true; // Устанавливаем флаг нажатия
        }.bind(this));

        this.input.on('pointermove', function (pointer) {
            if (isPointerDown) {
                const dx = dragStartX - pointer.x;
                const dy = dragStartY - pointer.y;

                // Проверяем, перемещает ли пользователь
                if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                    isDragging = true; // Устанавливаем состояние перетаскивания
                }

                // Перемещаем камеру с учётом ограничений по границам карты
                if (isDragging) {
                    this.cameras.main.scrollX = Phaser.Math.Clamp(this.cameras.main.scrollX + dx, this.cameras.main.scrollX + dx, 3000 - this.cameras.main.width / this.cameras.main.zoom);
                    this.cameras.main.scrollY = Phaser.Math.Clamp(this.cameras.main.scrollY + dy, this.cameras.main.scrollY + dy, 3000 - this.cameras.main.height / this.cameras.main.zoom);
                    dragStartX = pointer.x;
                    dragStartY = pointer.y; // Обновляем начальные координаты
                }
            }
        }.bind(this));

        // Сбрасываем состояние перетаскивания при отпускании кнопки мыши или касания
        this.input.on('pointerup', function (pointer) {
            isPointerDown = false; // Устанавливаем флаг нажатия в false

            // Если не было перетаскивания, обрабатываем тап
            if (!isDragging) {
                handleTap(this, pointer);
            }

            // Сбрасываем состояние перетаскивания
            isDragging = false; 
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
    // Преобразуем координаты указателя в мировые координаты
    const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

    // Определяем квадрат сетки, на который пользователь нажал
    const gridX = Math.floor(worldPoint.x / gridSize) * gridSize + gridSize / 2;
    const gridY = Math.floor(worldPoint.y / gridSize) * gridSize + gridSize / 2;

    console.log(`World Point: (${worldPoint.x}, ${worldPoint.y})`);
    console.log(`Calculated Grid Point: (${gridX}, ${gridY})`);
    console.log(`Zoom Level: ${zoomLevel}`);
    console.log(`Max Zoom: ${maxZoom}, Min Zoom: ${minZoom}`);
    console.log(`Scene Camera Center: (${scene.cameras.main.scrollX + scene.cameras.main.width / 2}, ${scene.cameras.main.scrollY + scene.cameras.main.height / 2})`);

    // Сначала анимируем перемещение камеры к целевой точке
    scene.tweens.add({
        targets: scene.cameras.main,
        scrollX: gridX - scene.cameras.main.width / 2,
        scrollY: gridY - scene.cameras.main.height / 2,
        duration: 900, // Время анимации перемещения камеры
        ease: 'Quadratic',
        onComplete: function() {
            // После перемещения камеры начинаем анимацию зуммирования
            const targetZoom = (zoomLevel < maxZoom) ? maxZoom : minZoom;

            // Плавная анимация зуммирования
            scene.tweens.add({
                targets: scene.cameras.main,
                zoom: targetZoom,
                duration: 900, // Время анимации зуммирования
                ease: 'Quadratic', // Тип анимации
                onUpdate: () => {
                    // Центрируем камеру на центр квадрата сетки, в который пользователь тапнул
                    scene.cameras.main.centerOn(gridX, gridY);
                }
            });

            // Обновляем текущий уровень зума
            zoomLevel = targetZoom;
        }
    });
}

function update() {
    // Логика обновления (если потребуется)
}

// Обработка изменения размеров окна
window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});

