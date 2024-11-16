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

let mapImage;
let frame;
let cameraMargin = 3; // Отступы для камеры
let mapWidth = 1900; // Размеры карты (большая карта)
let mapHeight = 1900;
let cameraWidth, cameraHeight; // Видимая ширина и высота (рамка)
let offsetX = 0; // Смещение карты по оси X
let offsetY = 0; // Смещение карты по оси Y
let currentZoom = 1; // Текущий уровень зума
let zoomFactor = 3; // Множитель для зума
let minZoom = 1; // Минимальный зум
let maxZoom = 3; // Максимальный зум
let tapX = 0; // Координата X точки тапа
let tapY = 0; // Координата Y точки тапа
let isDown = false; // Флаг для отслеживания нажатия
let isDragging = false; // Флаг для отслеживания перетаскивания
let grid;

// Инициализация игры
const game = new Phaser.Game(config);

function preload() {
    // Загрузка изображения карты
    this.load.image('map', 'map.png');
}

function create() {
    // Загружаем карту
    mapImage = this.add.image(0, 0, 'map').setOrigin(0, 0); // Начальная позиция карты в левом верхнем углу
    mapImage.setDisplaySize(mapWidth, mapHeight); // Устанавливаем полный размер карты

    // Рассчитываем начальные смещения для центра карты
    cameraWidth = this.cameras.main.width; // Видимая ширина камеры
    cameraHeight = this.cameras.main.height; // Видимая высота камеры

    offsetX = -(mapWidth * currentZoom - cameraWidth) / 2;
    offsetY = -(mapHeight * currentZoom - cameraHeight) / 2;

    // Устанавливаем начальное положение карты
    mapImage.setPosition(offsetX, offsetY);

    //рисуем сетку
    grid = this.add.graphics();
    grid.lineStyle(1, 0xECFD9A, 0.3);// Зеленая линия для сетки
    drawGrid(this);

    // Рисуем черную рамку (фон)
    frame = this.add.graphics();
    frame.lineStyle(50, 0x221C25, 1); // Черная рамка с отступом
    updateLayout(this); // Первоначальный расчет
    
    let pointerDownTime = 0; // Время начала нажатия

    // Обработчик начала нажатия
    this.input.on('pointerdown', (pointer) => {
        isDragging = false;
        isDown = true;
        pointerDownTime = this.time.now; // Сохраняем время нажатия
        tapX = pointer.x;
        tapY = pointer.y;
    });

    // Обработчик движения карты
    this.input.on('pointermove', (pointer) => {
        if (isDown) {
            const timeSinceDown = this.time.now - pointerDownTime;

            if (timeSinceDown > 200) { // Если нажатие длительное, активируем перемещение
                isDragging = true;
                moveMap(pointer);
            }
        }
    });

    // Обработчик отпускания пальца (заканчиваем действие)
    this.input.on('pointerup', (pointer) => {
        const timeSinceDown = this.time.now - pointerDownTime;

        if (!isDragging && timeSinceDown <= 200) {
            // Если действие было коротким (тап), выполняем зуммирование
            if (currentZoom === maxZoom) {
                resetZoom(this);
            } else {
                zoomIn(this);
            }
        }

        // Сбрасываем флаги
        isDown = false;
        isDragging = false;
    });

    // Обработчики изменения размера экрана и ориентации
    window.addEventListener('resize', () => {
        game.scale.resize(window.innerWidth, window.innerHeight); // Обновляем размеры экрана
        updateLayout(this); // Перерасчитываем размеры и позиции
        drawGrid(this);
    });

    window.addEventListener('orientationchange', () => {
        game.scale.resize(window.innerWidth, window.innerHeight); // Обновляем размеры экрана при изменении ориентации
        updateLayout(this); // Перерасчитываем размеры и позиции
        drawGrid(this);
    });
}

function drawGrid(scene) {
    // Очищаем старую сетку
    grid.clear();

    grid.lineStyle(1, 0xECFD9A, 0.3); // Зеленая линия для сетки
    
    // Размер квадрата сетки
    const squareSize = 75;

    // Количество квадратов по X и Y внутри рамки
    const rows = Math.ceil((cameraWidth) / squareSize);
    const cols = Math.ceil((cameraHeight) / squareSize);

    // Рисуем сетку внутри рамки
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            grid.strokeRect(i * squareSize,  j * squareSize, squareSize, squareSize);
        }
    }
}



let isZooming = false; // Флаг для блокировки ввода во время зума

function zoomIn(scene) {
    if (currentZoom < maxZoom && !isZooming) {
        const targetZoom = Phaser.Math.Clamp(currentZoom * zoomFactor, minZoom, maxZoom);

        // Центр экрана
        const centerX = cameraWidth / 2;
        const centerY = cameraHeight / 2;

        // Рассчитываем целевые смещения для перемещения точки тапа в центр
        const targetOffsetX = offsetX - (tapX - centerX);
        const targetOffsetY = offsetY - (tapY - centerY);

        isZooming = true; // Устанавливаем флаг зума

        // Перемещаем карту так, чтобы точка тапа стала в центре экрана
        scene.tweens.add({
            targets: { offsetX: offsetX, offsetY: offsetY },
            offsetX: targetOffsetX,
            offsetY: targetOffsetY,
            duration: 1100, // Время перемещения к центру
            ease: 'Quad.easeInOut',
            onUpdate: (tween, targets) => {
                // Обновляем позицию карты
                offsetX = targets.offsetX;
                offsetY = targets.offsetY;

                // Применяем изменения к карте
                mapImage.setPosition(offsetX, offsetY);
            },
            onComplete: () => {
                // После перемещения, начинаем зуммирование относительно центра экрана
                performZoom(scene, targetZoom, centerX, centerY);
            }
        });
    }
}

function performZoom(scene, targetZoom, centerX, centerY) {
    // Рассчитываем смещения для зума относительно нового центра экрана
    const scaleFactor = targetZoom / currentZoom;

    // Мы вычисляем смещение так, чтобы зум происходил относительно центра экрана
    let targetOffsetX = offsetX - (centerX - offsetX) * (scaleFactor - 1);
    let targetOffsetY = offsetY - (centerY - offsetY) * (scaleFactor - 1);

    // Ограничиваем смещения для предотвращения выхода карты за границы
    targetOffsetX = Phaser.Math.Clamp(targetOffsetX, -(mapWidth * targetZoom - cameraWidth), 0);
    targetOffsetY = Phaser.Math.Clamp(targetOffsetY, -(mapHeight * targetZoom - cameraHeight), 0);

    // Анимация зума
    scene.tweens.add({
        targets: { zoom: currentZoom, offsetX: offsetX, offsetY: offsetY },
        zoom: targetZoom,
        offsetX: targetOffsetX,
        offsetY: targetOffsetY,
        duration: 2000, // Время зуммирования
        ease: 'Quad.easeInOut',
        onUpdate: (tween, targets) => {
            // Обновляем текущий зум и позицию карты
            currentZoom = targets.zoom;
            offsetX = targets.offsetX;
            offsetY = targets.offsetY;

            // Применяем изменения к карте
            mapImage.setDisplaySize(mapWidth * currentZoom, mapHeight * currentZoom);
            mapImage.setPosition(offsetX, offsetY);
        },
        onComplete: () => {
            isZooming = false; // Сбрасываем флаг по завершению анимации
        }
    });
}

function resetZoom(scene) {
    if (currentZoom > minZoom && !isZooming) {
        const targetZoom = minZoom; // Устанавливаем минимальный зум

        // Получаем точку тапа как центр
        const centerX = cameraWidth / 2;
        const centerY = cameraHeight / 2;

        // Рассчитываем целевые смещения для перемещения точки тапа в центр
        const targetOffsetX = offsetX - (tapX - centerX);
        const targetOffsetY = offsetY - (tapY - centerY);

        isZooming = true; // Устанавливаем флаг зума

        // Перемещаем карту так, чтобы точка тапа стала в центре экрана
        scene.tweens.add({
            targets: { offsetX: offsetX, offsetY: offsetY },
            offsetX: targetOffsetX,
            offsetY: targetOffsetY,
            duration: 1100, // Время перемещения к центру
            ease: 'Quad.easeInOut',
            onUpdate: (tween, targets) => {
                // Обновляем позицию карты
                offsetX = targets.offsetX;
                offsetY = targets.offsetY;

                // Применяем изменения к карте
                mapImage.setPosition(offsetX, offsetY);
            },
            onComplete: () => {
                // После перемещения, начинаем зуммирование относительно центра экрана
                performZoom(scene, targetZoom, centerX, centerY);
            }
        });
    }
}


function moveMap(pointer) {
    // Вычисляем, сколько нужно сместить карту на основе движения мыши
    let dx = pointer.x - pointer.prevPosition.x;
    let dy = pointer.y - pointer.prevPosition.y;

    // Обновляем смещение карты с учетом границ
    offsetX = Phaser.Math.Clamp(offsetX + dx, -(mapWidth * currentZoom - cameraWidth), 0);
    offsetY = Phaser.Math.Clamp(offsetY + dy, -(mapHeight * currentZoom - cameraHeight), 0);

    // Применяем смещение к карте
    mapImage.setPosition(offsetX, offsetY);
}

function updateLayout(scene) {
    // Пересчитываем размеры камеры (рамки)
    cameraWidth = window.innerWidth - 2 * cameraMargin;
    cameraHeight = window.innerHeight - 2 * cameraMargin;

    // Рисуем черную рамку (фон)
    frame.clear(); // Очищаем старую рамку
    frame.lineStyle(50, 0x221C25, 1); // Черная рамка
    frame.strokeRect(cameraMargin, cameraMargin, cameraWidth, cameraHeight); // Рисуем новую рамку с отступом

    // Обновляем размеры карты
    mapImage.setDisplaySize(mapWidth * currentZoom, mapHeight * currentZoom); // Обновляем размер карты с учетом зума

    // Обновляем положение карты, чтобы она оставалась в пределах рамки
    offsetX = Phaser.Math.Clamp(offsetX, -(mapWidth * currentZoom - cameraWidth), 0);
    offsetY = Phaser.Math.Clamp(offsetY, -(mapHeight * currentZoom - cameraHeight), 0);

    // Применяем новое положение карты
    mapImage.setPosition(offsetX, offsetY);
}

function update() {
    // Логика обновления, если требуется
}







