//1
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

let isZoomed = false;  // Флаг, показывающий, зуммирована ли камера
let lastTapX = 0;  // Сохранение позиции последнего тапа по оси X
let lastTapY = 0;  // Сохранение позиции последнего тапа по оси Y

function handleTap(scene, pointer) {
    // Преобразуем координаты указателя в мировые координаты
    const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

    // Определяем координаты точки, на которую пользователь нажал
    const tapX = worldPoint.x;
    const tapY = worldPoint.y;

    console.log(`World Point: (${worldPoint.x}, ${worldPoint.y})`);
    console.log(`Calculated Tap Point: (${tapX}, ${tapY})`);

    if (isZoomed) {
        // Если камера уже зуммирована, возвращаемся к исходному зуму в точке второго тапа
        scene.tweens.add({
            targets: scene.cameras.main,
            zoom: 0.6,  // Возвращаем исходный зум
            scrollX: tapX - scene.cameras.main.width / 2,  
            scrollY: tapY - scene.cameras.main.height / 2,
            duration: 2000, // Время анимации возврата
            ease: 'Quad.easeInOut',
            onComplete: function() {
                isZoomed = false;  // Сброс флага зума
            }
        });
    } else {
        // Сохранение позиции первого тапа
        lastTapX = tapX;
        lastTapY = tapY;

        // Плавное перемещение и зуммирование в одно действие
        scene.tweens.add({
            targets: scene.cameras.main,
            zoom: 2,  // Уровень зума
            scrollX: tapX - scene.cameras.main.width / 2,
            scrollY: tapY - scene.cameras.main.height / 2,
            duration: 1600,  // Время анимации
            ease: 'Quad.easeInOut',
            onComplete: function () {
                isZoomed = true;  // Устанавливаем флаг зума
            }
        });
    }
}

function update() {
    // Логика обновления (если потребуется)
}

// Обработка изменения размеров окна
window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});
