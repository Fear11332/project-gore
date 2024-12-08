//2 исправить проблему с ошибкой при первом закрытии окна и сразу же открытием его и началом изменения размеров 
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

let markerZone;
let markerPosition = { x: 1150, y: 1290 };
let marker;
let mapImage;
let frame;
let cameraMargin = 3; // Отступы для камеры
let mapWidth = 1600; // Размеры карты (большая карта)
let mapHeight = 1600;
let cameraWidth, cameraHeight; // Видимая ширина и высота (рамка)
let offsetX = 0; // Смещение карты по оси X
let offsetY = 0; // Смещение карты по оси Y
let currentZoom = 1; // Текущий уровень зума
let zoomFactor = 1.7; // Множитель для зума
let minZoom = 1; // Минимальный зум
let maxZoom = 1.7; // Максимальный зум
let tapX = 0; // Координата X точки тапа
let tapY = 0; // Координата Y точки тапа
let isDown = false; // Флаг для отслеживания нажатия
let isDragging = false; // Флаг для отслеживания перетаскивания
let grid;
let activeLayer = 'map'; // Изначально активен слой карты
let moveToMark = false;
let animateMarkCenter =true;
let windowOpen = false;
let setTime = 1500;

// Инициализация игры
const game = new Phaser.Game(config);

function preload() {
    // Загрузка изображения карты
    this.load.image('map', 'images/map.png');
    this.load.image('popupImage', 'images/1.png');
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

      // Создаём маркер
    marker = this.add.graphics();
    drawMarker(markerPosition.x, markerPosition.y); // Отрисовка маркера
    marker.setVisible(false);

    // Создаём интерактивную зону для маркера
    markerZone = this.add.zone(markerPosition.x, markerPosition.y, 50, 50)
        .setOrigin(0.5, 0.5)
        .setInteractive();

    // Обработчик события "тап" по зоне маркера
    markerZone.on('pointerdown', () => {
          if (currentZoom === maxZoom ) {
            moveToMark = true;
            centerMapOnMarker(this, markerPosition); // Центрируем карту на маркере
            setTimeout(() => {
                animateMarkCenter = false;
                windowOpen = true;
                showPopup(this); // Показываем окно после перемещения
            }, setTime); // Даем время завершиться анимации
        }
    });

    // Рисуем черную рамку (фон)
    frame = this.add.graphics();
    frame.lineStyle(50, 0x221C25, 1); // Черная рамка с отступом
    updateLayout(this); // Первоначальный расчет
    
    let pointerDownTime = 0; // Время начала нажатия
    
    // Обработчик нажатия пальца
    this.input.on('pointerdown', (pointer) => {
    if (activeLayer === 'map' && !moveToMark) {
        isDragging = false;
        isDown = true;
        pointerDownTime = this.time.now;
            tapX = pointer.x;
            tapY = pointer.y;
    }
});


    // Обработчик движения карты
    this.input.on('pointermove', (pointer) => {
    if (activeLayer === 'map' && isDown) {
        const timeSinceDown = this.time.now - pointerDownTime;
        if (timeSinceDown > 200) { // Долгое нажатие — начало перемещения
            isDragging = true;
            moveMap(pointer);
        }
    }
});


    // Обработчик отпускания пальца (заканчиваем действие)
    this.input.on('pointerup', (pointer) => {
    if (activeLayer === 'map') {
        const timeSinceDown = this.time.now - pointerDownTime;
        if (!isDragging && timeSinceDown <= 200) {
            if (currentZoom === maxZoom) {
                resetZoom(this);
            } else{
                zoomIn(this);
            }
        }

        isDown = false;
        isDragging = false;
    }
});


// Обработчик выхода указателя за пределы окна
this.input.on('pointerout', () => {
    isDown = false; // Сбрасываем флаг нажатия
    isDragging = false; // Сбрасываем флаг перетаскивания
});

// Глобальный обработчик завершения ввода (для мыши, сенсорных экранов и других устройств)
window.addEventListener('pointerup', () => {
    isDown = false;
    isDragging = false;
});
    // Обработчики изменения размера экрана и ориентации
    window.addEventListener('resize', () => {
        game.scale.resize(window.innerWidth, window.innerHeight); // Обновляем размеры экрана
        updateLayout(this); // Перерасчитываем размеры и позици
        if(windowOpen)
            centerMapOnMarker(this, markerPosition);
        drawGrid(this);
    });

    window.addEventListener('orientationchange', () => {
        game.scale.resize(window.innerWidth, window.innerHeight); // Обновляем размеры экрана при изменении ориентации
        updateLayout(this); // Перерасчитываем размеры и позиции
        if(windowOpen)
            centerMapOnMarker(this, markerPosition);
        drawGrid(this);
    });
}

function centerMapOnMarker(scene, markerPosition) {
    // Центр экрана
    const centerX = cameraWidth / 2;
    const centerY = cameraHeight / 2;

    // Рассчитываем целевые смещения для карты
    const targetOffsetX = centerX - markerPosition.x * currentZoom;
    const targetOffsetY = centerY - markerPosition.y * currentZoom;

    // Ограничиваем смещения в пределах карты
    const clampedOffsetX = Phaser.Math.Clamp(targetOffsetX, -(mapWidth * currentZoom - cameraWidth), 0);
    const clampedOffsetY = Phaser.Math.Clamp(targetOffsetY, -(mapHeight * currentZoom - cameraHeight), 0);
    if(offsetX === clampedOffsetX && offsetY === clampedOffsetY){
        setTime = 0;
        return;
    }else{
        setTime = 1500;
    }
    if(animateMarkCenter){
        // Анимация перемещения карты
        scene.tweens.add({
            targets: { offsetX: offsetX, offsetY: offsetY },
            offsetX: clampedOffsetX,
            offsetY: clampedOffsetY,
            duration: 1500, // Длительность анимации
            ease: 'Quad.easeInOut',
            onUpdate: (tween, targets) => {
                // Обновляем текущие смещения карты
                offsetX = targets.offsetX;
                offsetY = targets.offsetY;

                // Применяем смещения к карте
                mapImage.setPosition(offsetX, offsetY);
                updateMarkerPosition(); // Обновляем положение маркера
            }
        });
    }else{
        // Устанавливаем новые смещения без анимации
        offsetX = clampedOffsetX;
        offsetY = clampedOffsetY;

        // Применяем изменения
        mapImage.setPosition(offsetX, offsetY);
        updateMarkerPosition(); // Обновляем положение маркера
    }
}


function showPopup(scene) {
    if (activeLayer === 'popup') return; // Если попап уже открыт, ничего не делаем

    activeLayer = 'popup'; // Сменить активный слой на попап
    // Создаем контейнер для слоя попапа
    popupLayer = scene.add.container(scene.scale.width / 2, scene.scale.height / 2)
        .setScale(0) // Начальный масштаб для анимации появления
        .setAlpha(0); // Начальная прозрачность

    // Создаем фон попапа
    const popupBackground = scene.add.rectangle(0, 0, 0, 0, 0xffffff, 1)
        .setOrigin(0.5);
    popupLayer.add(popupBackground);

    // Картинка внутри окна
    const popupImage = scene.add.image(0, 0, 'popupImage').setOrigin(0.5);
    popupLayer.add(popupImage);

    // Кнопка для закрытия попапа
    const closeButton = scene.add.text(0, 0, 'X', {
        fontSize: '70px', // Размер шрифта
        fontFamily: 'Arial', // Шрифт
        color: '#ECFD9A', // Серебряный цвет для имитации металла
        align: 'center'
    }).setOrigin(0.5).setInteractive();

    // Добавляем прозрачность
    closeButton.setAlpha(0.8);
    closeButton.setPosition(popupImage.x + popupBackground.width / 2 - 20, popupImage.y - popupBackground.height / 2 + 20);
    popupLayer.add(closeButton);

    // Масштабируем контент
    scalePopupContent(scene, popupBackground, popupImage, closeButton);

    // Анимация появления окна
    scene.tweens.add({
        targets: popupLayer,
        scaleX: 1,
        scaleY: 1,
        alpha: 1, // Окончательная прозрачность
        ease: 'Power2',
        duration: 1400 // Длительность анимации
    });

    // Обработчик закрытия попапа
    const onClose = () => {
        // Анимация удаления окна
        scene.tweens.add({
            targets: popupLayer,
            scaleX: 0,
            scaleY: 0,
            alpha: 0, // Исчезновение
            ease: 'Power2',
            duration: 1600, // Длительность анимации
            onComplete: () => {
                if (popupLayer) {
                    popupLayer.destroy(); // Удалить весь слой попапа
                    popupLayer = null; // Сбрасываем ссылку на контейнер
                }
                moveToMark = false;
                animateMarkCenter = true;
                windowOpen = false;
                scene.scale.off('resize', onResize); // Удаляем обработчик изменения размера
                activeLayer = 'map'; // Сменить активный слой на карту
            }
        });
    };
    closeButton.on('pointerdown', onClose);

    // Следим за изменением размера экрана
    const onResize = () => {
        if (activeLayer === 'popup' && popupLayer) {
            const { width, height } = scene.scale.gameSize;
            popupLayer.setPosition(width / 2, height / 2);
            //scalePopupContent(scene, popupBackground, popupImage, closeButton);
        }
    };
    scene.scale.on('resize', onResize);
}


function scalePopupContent(scene, popupBackground, popupImage, closeButton) {
    if (!popupBackground || !popupImage || !closeButton) {
        return; // Если какой-либо из элементов попапа не существует, выходим из функции
    }

    const { width, height } = scene.scale.gameSize;

    if (popupBackground) {
        popupBackground.setSize((width+height)*0.2 ,(width+height)*0.2); // Исправлено значение ширины/высоты
    }

    if (popupImage) {
        popupImage.setScale(
            popupBackground.width / popupImage.width,
            popupBackground.height / popupImage.height
        );
    }

    if (closeButton) {
        closeButton.setPosition(
            popupImage.x + popupBackground.width / 2 ,
            popupImage.y - popupBackground.height / 2
        );
        closeButton.setScale(popupBackground.width * 0.001, popupBackground.height * 0.001);
    }
}

function drawGrid(scene) {
    // Очищаем старую сетку
    grid.clear();

    grid.lineStyle(1, 0xECFD9A, 0.3); // Зеленая линия для сетки
    
    // Размер квадрата сетки
    const squareSize = 70;

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

function drawMarker(x, y) {
    marker.clear();
    marker.fillStyle(0xFF0000, 1); // Красный цвет
    marker.fillCircle(0, 0, 10); // Рисуем круг радиусом 10
    marker.setPosition(x, y); // Устанавливаем позицию маркера
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
                updateMarkerPosition();
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
            updateMarkerPosition();

            // Управление видимостью маркера
            if (currentZoom === maxZoom) {
                marker.setVisible(true); // Показываем маркер
            } else if (currentZoom === minZoom) {
                marker.setVisible(false); // Скрываем маркер
            }
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
                updateMarkerPosition();
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
    updateMarkerPosition();
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

    updateMarkerPosition();
}

function updateMarkerPosition() {
    const x = markerPosition.x * currentZoom + offsetX;
    const y = markerPosition.y * currentZoom + offsetY;
    marker.setPosition(x, y); // Ставим маркер в нужное место

    // Обновляем положение интерактивной зоны для маркера
    
    if (markerZone) {
        markerZone.setPosition(x, y);
    }
}

function update() {
    // Логика обновления, если требуется
}







