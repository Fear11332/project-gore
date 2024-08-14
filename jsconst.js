const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
let radius = 150;
const maxBarHeight = 300; // Максимальная высота столбиков
const boundaryMargin = 6; // Допустимый маргин для углов в градусах
const heightThreshold = 10;

let bars = [
  { angle: 270, height: 0, isInitial: true }, // 12 o'clock
  { angle: 0, height: 0, isInitial: true },   // 3 o'clock
  { angle: 90, height: 0, isInitial: true },  // 6 o'clock
  { angle: 180, height: 0, isInitial: true }  // 9 o'clock
];

let draggingBarIndex = null;
let isDragging = false;

const radiusSlider = document.getElementById('radiusSlider');
radiusSlider.addEventListener('input', (e) => {
  const newRadiusMultiplier = parseFloat(e.target.value);
  radius = 150 * newRadiusMultiplier / 16; // Обновляем радиус в зависимости от ползунка
  drawBars();
});

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

function drawBar(angle, height) {
  const angleInRadians = degreesToRadians(angle);
  const baseX = centerX + radius * Math.cos(angleInRadians);
  const baseY = centerY + radius * Math.sin(angleInRadians);

  // Draw the point
  drawPoint(baseX, baseY);

  if (height > 0) {
    height = Math.min(height, maxBarHeight);

    const barEndX = centerX + (radius + height) * Math.cos(angleInRadians);
    const barEndY = centerY + (radius + height) * Math.sin(angleInRadians);

    // Draw the needle (line) at the top of the bar
    ctx.beginPath();
    ctx.moveTo(baseX, baseY); // Base of the needle
    ctx.lineTo(barEndX, barEndY); // Peak of the needle
    ctx.strokeStyle = 'white';
    ctx.stroke();
  }
}

function drawBars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCircle();

  // Draw bars
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    drawBar(bar.angle, bar.height);
  }
  drawConnections();
}

function drawConnections() {
  // Filter out the initial bars and connect only user-added bars
  const userBars = bars.filter(bar => !bar.isInitial);

  if (userBars.length < 2) return; // No need to draw connections if fewer than 2 bars

  // Sort bars by angle
  userBars.sort((a, b) => a.angle - b.angle);

  ctx.beginPath();
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1;

  // Draw connections between adjacent user-added bars
  for (let i = 0; i < userBars.length - 1; i++) {
    const currentBar = userBars[i];
    const nextBar = userBars[i + 1];

    const currentAngleInRadians = degreesToRadians(currentBar.angle);
    const nextAngleInRadians = degreesToRadians(nextBar.angle);

    const currentX = centerX + (radius + currentBar.height) * Math.cos(currentAngleInRadians);
    const currentY = centerY + (radius + currentBar.height) * Math.sin(currentAngleInRadians);

    const nextX = centerX + (radius + nextBar.height) * Math.cos(nextAngleInRadians);
    const nextY = centerY + (radius + nextBar.height) * Math.sin(nextAngleInRadians);

    ctx.moveTo(currentX, currentY);
    ctx.lineTo(nextX, nextY);
    
  }

  // Draw connection from last to first if needed
   const lastBar = userBars[userBars.length - 1];
   const firstBar = userBars[0];
   const lastAngleInRadians = degreesToRadians(lastBar.angle);
   const firstAngleInRadians = degreesToRadians(firstBar.angle);
   const lastX = centerX + (radius + lastBar.height) * Math.cos(lastAngleInRadians);
   const lastY = centerY + (radius + lastBar.height) * Math.sin(lastAngleInRadians);
   const firstX = centerX + (radius + firstBar.height) * Math.cos(firstAngleInRadians);
 const firstY = centerY + (radius + firstBar.height) * Math.sin(firstAngleInRadians);
   ctx.moveTo(lastX, lastY);
  ctx.lineTo(firstX, firstY);

  ctx.stroke();
}


function getDistance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function getAngle(x, y) {
  const dx = x - centerX;
  const dy = y - centerY;
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Normalize angle to be in [0, 360)
  angle = (angle + 360) % 360;

  return angle;
}

function getClosestBarIndex(x, y) {
  let closestIndex = null;
  let minDistance = Infinity;

  bars.forEach((bar, index) => {
    const angleInRadians = degreesToRadians(bar.angle);
    const baseX = centerX + radius * Math.cos(angleInRadians);
    const baseY = centerY + radius * Math.sin(angleInRadians);
    const peakX = centerX + (radius + bar.height) * Math.cos(angleInRadians);
    const peakY = centerY + (radius + bar.height) * Math.sin(angleInRadians);

    const distanceToBase = getDistance(x, y, baseX, baseY);
    const distanceToPeak = getDistance(x, y, peakX, peakY);

    if (distanceToBase < 10 || distanceToPeak < 10) {
      minDistance = Math.min(minDistance, Math.min(distanceToBase, distanceToPeak));
      closestIndex = index;
    }
  });

  return minDistance < 11 ? closestIndex : null; // Change threshold if needed
}

function getNextFixedPointAngle(angle) {
  const fixedAngles = [0, 90, 180, 270]; // 3, 6, 9, 12 o'clock
  for (let i = 0; i < fixedAngles.length; i++) {
    if (fixedAngles[i] > angle) {
      return fixedAngles[i];
    }
  }
  return fixedAngles[0] + 360; // Wrap around to the first fixed point and add 360 to maintain order
}

function getPreviousFixedPointAngle(angle) {
  const fixedAngles = [0, 90, 180, 270]; // 3, 6, 9, 12 o'clock
  for (let i = fixedAngles.length - 1; i >= 0; i--) {
    if (fixedAngles[i] < angle) {
      return fixedAngles[i];
    }
  }
  return fixedAngles[fixedAngles.length - 1] - 360; // Wrap around to the last fixed point and subtract 360 to maintain order
}

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const angle = getAngle(x, y);
  const distance = getDistance(centerX, centerY, x, y);

  if (e.button === 0) { // Левая кнопка мыши
    // Проверяем, находится ли клик на краю окружности
    if (distance < radius + 10 && distance > radius - 10) {
      // Проверяем, есть ли существующий столбец для перетаскивания
      draggingBarIndex = getClosestBarIndex(x, y);

      // Если перетаскивается существующий столбец, продолжаем перетаскивание
      if (draggingBarIndex !== null && !bars[draggingBarIndex].isInitial) {
        isDragging = true;
      } else if (draggingBarIndex === null) {
        const nextFixedPointAngle = getNextFixedPointAngle(angle);
        const previousFixedPointAngle = getPreviousFixedPointAngle(angle);

        // Проверяем, что новая точка добавляется в пределах границ фиксированных точек
        if ((angle >= (previousFixedPointAngle + boundaryMargin) % 360) && (angle <= (nextFixedPointAngle - boundaryMargin) % 360)) {
          bars.push({ angle, height: 0, isInitial: false });
          draggingBarIndex = bars.length - 1; // Устанавливаем новую точку как перетаскиваемую
          isDragging = true;
        }
      }
    }
  } else if (e.button === 2) { // Правая кнопка мыши
    const closestIndex = getClosestBarIndex(x, y);
    if (closestIndex !== null && !bars[closestIndex].isInitial) {
      bars.splice(closestIndex, 1);
      drawBars();
    }
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const angle = getAngle(x, y);
  const distance = getDistance(centerX, centerY, x, y);

  if (draggingBarIndex !== null) {
    const bar = bars[draggingBarIndex];

    // Ограничиваем перемещение столбца в пределах его сектора
    const nextFixedPointAngle = getNextFixedPointAngle(bar.angle);
    const previousFixedPointAngle = getPreviousFixedPointAngle(bar.angle);

    if ((angle < (previousFixedPointAngle + boundaryMargin) % 360) || (angle > (nextFixedPointAngle - boundaryMargin) % 360)) {
      isDragging = false; // Остановить перетаскивание при достижении границы
    } else {
      bar.angle = angle; // Обновляем угол столбца
    }

    if (distance > radius) {
      bar.height = Math.min(distance - radius, maxBarHeight);
    }

    drawBars();
  }
});

canvas.addEventListener('mouseup', () => {
  if(draggingBarIndex!==null){
    const bar = bars[draggingBarIndex];
    if(!bar.isInitial){
      if (bar.height < heightThreshold) {
          bars.splice(draggingBarIndex, 1);
          drawBars();
        }
    }
  }
    isDragging = false;
  draggingBarIndex = null;

  // Сортируем столбцы по углу после завершения перетаскивания
  bars.sort((a, b) => a.angle - b.angle);
});

drawBars(); // Изначально рисуем

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault(); // Предотвращает появление контекстного меню
});


























