  const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    const iframeContainer = document.getElementById('iframeContainer');
    const marker = document.getElementById('marker');

    let currentX = 0, currentY = 0;
    let scale = 1;  
    const minScale = 1;
    const maxZoomSteps = 3; 
    let zoomStep = 0; 

    const image = new Image(); 
    image.src = '../images/map.png'; 

    let isDragging = false;
    let startX, startY;

    // Переменные для хранения состояния
    let bodyOverflow = '';
    let canvasPointerEvents = '';
    let isIframeOpen = false; // Флаг для отслеживания состояния iframe

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        draw(); 
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
        ctx.save();
        ctx.translate(currentX, currentY);
        ctx.scale(scale, scale);
        ctx.drawImage(image, 0, 0);
        ctx.restore();
    }

    function clampTranslation(x, y) {
        const maxX = (image.width * scale - canvas.width);
        const maxY = (image.height * scale - canvas.height);

        const clampedX = Math.max(Math.min(0, x), -maxX);
        const clampedY = Math.max(Math.min(0, y), -maxY);

        return { x: clampedX, y: clampedY };
    }

    canvas.addEventListener('mousedown', (e) => {
        if (!isIframeOpen) { // Проверка, открыто ли окно
            isDragging = true;
            startX = e.clientX - currentX;
            startY = e.clientY - currentY;
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            currentX = e.clientX - startX;
            currentY = e.clientY - startY;

            const { x, y } = clampTranslation(currentX, currentY);
            currentX = x;
            currentY = y;

            draw(); 
            positionMarker();
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });

    canvas.addEventListener('mouseleave', () => {
        isDragging = false;
    });

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();

        const delta = e.deltaY > 0 ? -1 : 1;
        let newZoomStep = zoomStep + delta;

        if (newZoomStep > maxZoomSteps || newZoomStep < 0) {
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const mouseXCanvas = e.clientX - rect.left;
        const mouseYCanvas = e.clientY - rect.top;

        const imageMouseX = (mouseXCanvas - currentX) / scale;
        const imageMouseY = (mouseYCanvas - currentY) / scale;

        scale = Math.pow(1.5, newZoomStep);
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

    image.onload = function() {
        resizeCanvas();
        positionMarker();
    };

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