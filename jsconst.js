document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    let radius;
    const radiusSlider = document.getElementById('radiusSlider');

    // Минимальное изменение радиуса для добавления нового сектора
    const sectorIncrementStep = 5; // Шаг изменения радиуса, при котором увеличивается количество секторов

    // Начальное и максимальное количество секторов
    const minSectors = 14;
    const maxSectors = 24;

    function drawCircle() {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'white';
        ctx.stroke();
    }

    function drawPoint(x, y) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = 'black';
        ctx.fill();
    }

    function degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    function drawSectors() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Очистка канваса перед отрисовкой

        drawCircle(); // Отрисовка круга с обновленным радиусом

        // Определяем количество секторов на основе радиуса
        let numSectors = minSectors;

        // Увеличиваем количество секторов по мере увеличения радиуса
        if (radius > 90) {
            const radiusStep = Math.max(1, Math.floor((radius - 90) / sectorIncrementStep));
            numSectors = Math.min(minSectors + radiusStep, maxSectors);
        }
        
        console.log(numSectors);
        const sectorAngle = 360 / numSectors;

        // Отрисовка секторов и точек на границах секторов
        for (let i = 0; i < numSectors; i++) {
            const startAngle = i * sectorAngle;
            const endAngle = (i + 1) * sectorAngle;

            const startX = centerX + radius * Math.cos(degreesToRadians(startAngle));
            const startY = centerY + radius * Math.sin(degreesToRadians(startAngle));
            const endX = centerX + radius * Math.cos(degreesToRadians(endAngle));
            const endY = centerY + radius * Math.sin(degreesToRadians(endAngle));

            // Отрисовка точек на границах сектора
            drawPoint(startX, startY);
            drawPoint(endX, endY);
        }
    }

    function updateRadius() {
        radius = 2 * parseFloat(radiusSlider.value);
        drawSectors(); // Обновляем сектора
    }

    radiusSlider.addEventListener('input', updateRadius);

    // Инициализация отрисовки
    updateRadius();
});































