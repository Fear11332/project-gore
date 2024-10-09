const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const iframeContainer = document.getElementById('iframeContainer');
const marker = document.getElementById('marker');

let currentX = 0, currentY = 0;
let scale = 1;
const minScale = 1; // Минимальный масштаб
const maxScale = 3; // Максимальный масштаб
const zoomFactor = 1.5; // Коэффициент увеличения
let zoomStep = 0; // Текущий уровень масштабирования

const image = new Image();
image.src = '../images/map.png';

let isDragging = false;
let startX, startY;

// Переменные для хранения состояния
let bodyOverflow = '';
let canvasPointerEvents = '';
let isIframeOpen = false; // Флаг для отслеживания состояния iframe
let lastTouchEnd = 0;
let prevDistance = 0;
let isZooming = false;

// Функция для изменения размера канваса
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
}

// Функция для отрисовки изображения
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(currentX, currentY);
    ctx.scale(scale, scale);
    ctx.drawImage(image, 0, 0);
    ctx.restore();
}

// Функция для ограничения перемещения
function clampTranslation(x, y) {
    const maxX = (image.width * scale - canvas.width);
    const maxY = (image.height * scale - canvas.height);

    const clampedX = Math.max(Math.min(0, x), -maxX);
    const clampedY = Math.max(Math.min(0, y), -maxY);

    return { x: clampedX, y: clampedY };
}

// Обработка событий масштабирования с колесом мыши
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();

    const delta = e.deltaY > 0 ? -1 : 1;
    let newZoomStep = zoomStep + delta;

    // Проверяем, не превышаем ли пределы масштабирования
    if (newZoomStep > 3 || newZoomStep < 0) {
        return; // Не изменяем масштаб, если уже достигнут предел
    }

    const rect = canvas.getBoundingClientRect();
    const mouseXCanvas = e.clientX - rect.left;
    const mouseYCanvas = e.clientY - rect.top;

    const imageMouseX = (mouseXCanvas - currentX) / scale;
    const imageMouseY = (mouseYCanvas - currentY) / scale;

    scale = minScale * Math.pow(zoomFactor, newZoomStep);
    zoomStep = newZoomStep;

    const newImageMouseX = imageMouseX * scale;
    const newImageMouseY = imageMouseY * scale;
    currentX = mouseXCanvas - newImageMouseX;
    currentY = mouseYCanvas - newImageMouseY;

    const { x, y } = clampTranslation(currentX, currentY);
    currentX = x;
    currentY = y;

    draw();
    positionMarker();
});

// Обработка начала касания
canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        prevDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        isZooming = true;
    } else if (e.touches.length === 1) {
        isDragging = true; // Начинаем перетаскивание
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }
});

// Обработка перемещения касания
canvas.addEventListener('touchmove', (e) => {
    if (isZooming && e.touches.length === 2) {
        e.preventDefault(); // Предотвращаем прокрутку страницы

        const currentDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );

        const delta = currentDistance - prevDistance;
        const zoomDirection = delta > 0 ? 1 : -1;

        let newZoomStep = zoomStep + zoomDirection;

        if (newZoomStep > 3 || newZoomStep < 0) {
            return; // Не изменяем масштаб, если уже достигнут предел
        }

        const rect = canvas.getBoundingClientRect();
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

        const imageMouseX = (midX - currentX) / scale;
        const imageMouseY = (midY - currentY) / scale;

        scale = Math.pow(1.5, newZoomStep);
        zoomStep = newZoomStep;

        const newImageMouseX = imageMouseX * scale;
        const newImageMouseY = imageMouseY * scale;
        currentX = midX - newImageMouseX;
        currentY = midY - newImageMouseY;

        const { x, y } = clampTranslation(currentX, currentY);
        currentX = x;
        currentY = y;

        draw();
        positionMarker();

        prevDistance = currentDistance; // Обновляем предыдущее расстояние
    } else if (isDragging && e.touches.length === 1) {
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        currentX += dx;
        currentY += dy;

        const { x, y } = clampTranslation(currentX, currentY);
        currentX = x;
        currentY = y;

        draw();
        positionMarker();

        startX = e.touches[0].clientX; // Обновляем начальные координаты
        startY = e.touches[0].clientY;
    }
});

// Обработка окончания касания
canvas.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
        isZooming = false; // Завершаем режим масштабирования
    }
    if (e.touches.length === 0) {
        isDragging = false; // Завершаем перетаскивание
    }
});

// Отрисовка изображения при загрузке
image.onload = function() {
    resizeCanvas();
    positionMarker();
};

// Изменение размера канваса при изменении размера окна
window.addEventListener('resize', resizeCanvas);

// Позиционируем маркер
function positionMarker() {
    const markerX = 100; // Координаты маркера
    const markerY = 200;

    const canvasMarkerX = markerX * scale + currentX;
    const canvasMarkerY = markerY * scale + currentY;

    marker.style.left = `${canvasMarkerX}px`;
    marker.style.top = `${canvasMarkerY}px`;

    // Если зум меньше 2, маркер скрывается
    if (scale < 2) {
        marker.style.display = 'none';
        marker.classList.add('disabled'); // Делаем маркер неактивным
    } else {
        marker.style.display = 'block';
        marker.classList.remove('disabled'); // Возвращаем маркер к активному состоянию
    }
}

// Маркер для открытия iframe
marker.addEventListener('dblclick', () => {
    iframeContainer.style.display = 'flex'; // Показываем iframe
    bodyOverflow = document.body.style.overflow; // Сохраняем текущее состояние прокрутки
    document.body.style.overflow = 'hidden'; // Запретить прокрутку
    canvasPointerEvents = canvas.style.pointerEvents; // Сохраняем текущее состояние canvas
    canvas.style.pointerEvents = 'none'; // Запретить взаимодействие с канвасом
    marker.classList.add('disabled'); // Делаем маркер неактивным
    isIframeOpen = true; // Устанавливаем флаг открытого iframe
    isDragging = false; // Сбрасываем состояние перетаскивания
});

// Закрытие iframe при клике вне его
window.addEventListener('click', (event) => {
    if (isIframeOpen && !iframeContainer.contains(event.target) && !marker.contains(event.target)) {
        iframeContainer.style.display = 'none';
        document.body.style.overflow = bodyOverflow; // Восстанавливаем состояние прокрутки
        canvas.style.pointerEvents = canvasPointerEvents; // Восстанавливаем состояние canvas
        marker.classList.remove('disabled'); // Возвращаем маркер к активному состоянию
        isIframeOpen = false; // Сбрасываем флаг открытого iframe
    }
});
