const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
let isAddingBar = false;
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
let radius;
const maxBarHeight = 300;
const boundaryMargin = 4; // Допустимый маргин для углов в градусах
const heightThreshold = 10;
const minBarHeight = 11;
const radiusSlider = document.getElementById('radiusSlider');
const sectorIncrementStep = 5;
const minSectors = 14;
const maxSectors = 24;
let radiusChanged = false;

let fixedPoint =[];

let draggingBarIndex = null;
let isDragging = false;
let sectors=[];
let sectorAngles = [];

function updateRadius() {
  radius = 2 * parseFloat(radiusSlider.value);
  radiusChanged = true;
  draw(); // Обновляем весь холст
}

function drawCircle() {
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = 'white';
  ctx.stroke();
}


function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function drawSectors() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Очистка канваса перед отрисовкой
  drawCircle(); // Отрисовка круга с обновленным радиусом

  // Определяем количество секторов в зависимости от радиуса
  let numSectors = minSectors;
  if (radius > 90) {
    const radiusStep = Math.max(1, Math.floor((radius - 90) / sectorIncrementStep));
    numSectors = Math.min(minSectors + radiusStep, maxSectors);
  }

  const totalAngle = 360;
  const sectorAngle = totalAngle / numSectors;

  sectorAngles = [];
  const newSectors = [];

  // Очистить существующие точки с флагом isInitial
  fixedPoint = fixedPoint.filter((bar) => !bar.isInitial);

  for (let i = 0; i < numSectors; i++) {
    const startAngle = i * sectorAngle;
    let endAngle = (startAngle + sectorAngle) % 360;
    // Если это последний сектор, корректируем его конец
    if (i === numSectors - 1) {
      endAngle = 360; // Устанавливаем конец последнего сектора в 360 градусов
    }

    sectorAngles.push(startAngle);

    // Проверяем, есть ли существующий сектор с такими углами
    let sector =  sectors.find(
      (sec) => sec.secIndex===i
    );
    const midAngle = (startAngle + endAngle) / 2;
  if (!sector) {
    // Создайте новый сектор и добавьте его в массив
    sector = {
      startAngle: startAngle,
      endAngle: endAngle,
      pointInside: false,
      bar: { angle: null, height: -1, isInitial: false },
      secIndex: i
    };
    sectors.push(sector);
  } else {
    // Обновите существующий сектор
    sector.startAngle = startAngle;
    sector.endAngle = endAngle;
  }
  
    newSectors.push(sector);

    // Добавляем точки для углов с флагом isInitial: true
    fixedPoint.push({ angle: startAngle, height: 0, isInitial: true });

    // Определяем координаты точки для отрисовки
    const startX = centerX + radius * Math.cos(degreesToRadians(startAngle));
    const startY = centerY + radius * Math.sin(degreesToRadians(startAngle));

    drawPoint(startX, startY);
  }

  if(radiusChanged){
    radiusChanged = false;
    for (let i = 0; i < numSectors; i++) {
    const startAngle = i * sectorAngle;
    let endAngle = (startAngle + sectorAngle) % 360;
    // Если это последний сектор, корректируем его конец
    if (i === numSectors - 1) {
      endAngle = 360; // Устанавливаем конец последнего сектора в 360 градусов
    }
    const midAngle = (startAngle + endAngle) / 2;
    if(sectors[i].bar.changed){
         sectors[i].bar.startX = centerX + radius * Math.cos(degreesToRadians(midAngle));
    sectors[i].bar.startY = centerY + radius * Math.sin(degreesToRadians(midAngle));
    sectors[i].bar.angle = midAngle;
    }

  }
  }
  // Обновляем массив секторов на новый
  sectors = newSectors;
}


function drawPoint(x, y, color = 'black') {
  ctx.fillStyle = color; // Цвет точки
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, 2 * Math.PI); // Радиус точки 5
  ctx.fill();
}

// Функция проверки попадания угла в сектор
function isAngleInSector(angle, sector) {
  const normalizedAngle = (angle + 360) % 360;
  const normalizedStart = (sector.startAngle + 360) % 360;
  const normalizedEnd = (sector.endAngle + 360) % 360;

  if (normalizedStart < normalizedEnd) {
    return normalizedAngle >= normalizedStart && normalizedAngle < normalizedEnd;
  } else {
    return normalizedAngle >= normalizedStart || normalizedAngle < normalizedEnd;
  }
}


function drawBar(angle, height, barStartX,barStartY) {
  const angleInRadians = degreesToRadians(angle);

    height = Math.min(height, maxBarHeight);

    const barEndX = centerX + (radius + height) * Math.cos(angleInRadians);
    const barEndY = centerY + (radius + height) * Math.sin(angleInRadians);

    ctx.beginPath();
    ctx.moveTo(barStartX, barStartY);
    ctx.lineTo(barEndX, barEndY);
    ctx.strokeStyle = 'white';
    ctx.stroke();
}

function drawBars() {
  for (let i = 0; i < sectors.length; i++) {
    if(sectors[i].pointInside){
      const bar = sectors[i].bar;
      drawBar(bar.angle, bar.height, bar.startX, bar.startY);
    }
  }
 drawConnections();
}

function drawConnections() {
  let tmpBars = [];

  // Добавляем бары в tmpBars
  sectors.forEach(sec => {
    if (sec.pointInside) {
      tmpBars.push(sec.bar);
    }
  });

  const userBars = [...tmpBars];

  if (userBars.length < 2) return;

  userBars.sort((a, b) => a.angle - b.angle);

  ctx.beginPath();
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1;

  for (let i = 0; i < userBars.length - 1; i++) {
    const currentBar = userBars[i];
    const nextBar = userBars[i + 1];

    const currentAngleInRadians = degreesToRadians(currentBar.angle);
    const nextAngleInRadians = degreesToRadians(nextBar.angle);

    const currentX =
      centerX + (radius + currentBar.height) * Math.cos(currentAngleInRadians);
    const currentY =
      centerY + (radius + currentBar.height) * Math.sin(currentAngleInRadians);

    const nextX =
      centerX + (radius + nextBar.height) * Math.cos(nextAngleInRadians);
    const nextY =
      centerY + (radius + nextBar.height) * Math.sin(nextAngleInRadians);

    // Вычисляем среднюю точку между текущей и следующей вершинами
    const midX = (currentX + nextX) / 2;
    const midY = (currentY + nextY) / 2;

    // Вычисляем вектор от центра к средней точке
    const vecX = midX - centerX;
    const vecY = midY - centerY;

    // Сдвигаем контрольную точку внутрь круга, чтобы все кривые были впуклыми
    const controlX = midX - vecX * 0.3; // 0.3 - коэффициент сдвига (можно настроить)
    const controlY = midY - vecY * 0.3; // 0.3 - коэффициент сдвига (можно настроить)

    // Рисуем квадратичную кривую Безье
    ctx.moveTo(currentX, currentY);
    ctx.quadraticCurveTo(controlX, controlY, nextX, nextY);
  }

  // Соединяем последний бар с первым
  const lastBar = userBars[userBars.length - 1];
  const firstBar = userBars[0];
  const lastAngleInRadians = degreesToRadians(lastBar.angle);
  const firstAngleInRadians = degreesToRadians(firstBar.angle);
  const lastX =
    centerX + (radius + lastBar.height) * Math.cos(lastAngleInRadians);
  const lastY =
    centerY + (radius + lastBar.height) * Math.sin(lastAngleInRadians);
  const firstX =
    centerX + (radius + firstBar.height) * Math.cos(firstAngleInRadians);
  const firstY =
    centerY + (radius + firstBar.height) * Math.sin(firstAngleInRadians);

  // Средняя точка для замыкающей кривой
  const midX = (lastX + firstX) / 2;
  const midY = (lastY + firstY) / 2;

  // Вектор от центра к средней точке
  const vecX = midX - centerX;
  const vecY = midY - centerY;

  // Сдвигаем контрольную точку внутрь
  const controlX = midX - vecX * 0.3;
  const controlY = midY - vecY * 0.3;

  // Рисуем замыкающую квадратичную кривую Безье
  ctx.moveTo(lastX, lastY);
  ctx.quadraticCurveTo(controlX, controlY, firstX, firstY);

  ctx.stroke();
}

function getDistance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function getAngle(x, y) {
  const dx = x - centerX;
  const dy = y - centerY;
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);

  angle = (angle + 360) % 360;

  return angle;
}

function getClosestBarIndex(x, y) {
  let closestIndex = null;
  let minDistance = Infinity;

  sectors.forEach((item, index) => {
    if(item.pointInside){
      const angleInRadians = degreesToRadians(item.bar.angle);
      const baseX = centerX + radius * Math.cos(angleInRadians);
      const baseY = centerY + radius * Math.sin(angleInRadians);
      const peakX = centerX + (radius + item.bar.height) * Math.cos(angleInRadians);
      const peakY = centerY + (radius + item.bar.height) * Math.sin(angleInRadians);

      const distanceToBase = getDistance(x, y, baseX, baseY);
      const distanceToPeak = getDistance(x, y, peakX, peakY);

      if (distanceToBase < 10 || distanceToPeak < 10) {
        minDistance = Math.min(
          minDistance,
          Math.min(distanceToBase, distanceToPeak)
        );
        closestIndex = index;
      }
    }
  });

  return minDistance < 11 ? closestIndex : null;
}

function getNextFixedPointAngle(angle) {
  for (let i = 0; i < sectorAngles.length; i++) {
    if (sectorAngles[i] > angle) {
      return sectorAngles[i];
    }
  }
  return sectorAngles[0] + 360;
}

function getPreviousFixedPointAngle(angle) {
  for (let i = sectorAngles.length - 1; i >= 0; i--) {
    if (sectorAngles[i] < angle) {
      return sectorAngles[i];
    }
  }
  return sectorAngles[sectorAngles.length - 1] - 360;
}

function canPlaceBarAtAngle(angle) {
  // Проверяем, пересекается ли новый угол с уже существующими служебными точками
  for (let fixed of fixedPoint) {
    if (fixed.isInitial) {
      // Проверяем, что угол отличается от служебных точек на заданное расстояние
      const angleDiff = Math.abs(angle - fixed.angle);
      const minAngleDistance = 360 / fixedPoint.length; // Минимальное расстояние между углами
      if (angleDiff < minAngleDistance || angleDiff > (360 - minAngleDistance)) {
        return false; // Угол слишком близко к служебной точке
      }
    }
  }
  // Проверяем, пересекается ли угол с пользовательскими точками
  let userBars;
  forEach(sectors in sec)
    if(sec.pointInside)
      userBars.push(sec.bar);
  return !userBars.some((bar) => bar.angle === angle && !bar.isInitial);
}

function isPointNearLine(px, py, x1, y1, x2, y2, threshold) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  const param = lenSq === 0 ? -1 : dot / lenSq;

  let closestX, closestY;

  if (param < 0) {
    closestX = x1;
    closestY = y1;
  } else if (param > 1) {
    closestX = x2;
    closestY = y2;
  } else {
    closestX = x1 + param * C;
    closestY = y1 + param * D;
  }

  const dx = px - closestX;
  const dy = py - closestY;
  return dx * dx + dy * dy <= threshold * threshold;
}

function isAngleInSector(angle, sector, index){
  if (sector.startAngle < sector.endAngle) {
    return angle >= sector.startAngle && angle < sector.endAngle;
  } else {
    return angle >= sector.startAngle || angle < sector.endAngle;
  }
}

let lastTouchTime = 0;

function handleTouchStart(e) {
  e.preventDefault();

  const { x, y } = getTouchPosition(e); // Получаем координаты касания
  const angle = getAngle(x, y);
  const distance = getDistance(centerX, centerY, x, y);

  const currentTime = new Date().getTime(); // Текущее время

  if (currentTime - lastTouchTime < 300) { // Проверяем, произошло ли двойное касание
    const barIndex = sectors.findIndex(item => item.pointInside && isCursorNearBar(item.bar, x, y)); // Передаем x и y
    if (barIndex !== -1) {
      sectors[barIndex].pointInside = false;
      sectors[barIndex].bar.changed = false;
      draw(); // Обновляем отображение после удаления бара
    }
    lastTouchTime = 0; // Сбрасываем время для предотвращения повторных удалений
    return;
  }

  lastTouchTime = currentTime; // Запоминаем время текущего касания

  // Проверяем, есть ли уже бар в зоне взаимодействия
  draggingBarIndex = sectors.findIndex(item => item.pointInside && isCursorNearBar(item.bar, x, y));
  if (draggingBarIndex !== -1) {
    isDragging = true;
    draw();
    return; // Прерываем добавление нового бара, если уже выбрали существующий
  }

  if (e.touches.length === 1 && draggingBarIndex === -1) { // Одно касание и бара еще нет
    const nextFixedPointAngle = getNextFixedPointAngle(angle);
    const previousFixedPointAngle = getPreviousFixedPointAngle(angle);
      
    let index = null;
    for (let sec of sectors) {
      if (isAngleInSector(angle, sec, sec.secIndex)) {
        index = sec.secIndex;
      }
    }

    if ((angle >= (previousFixedPointAngle + boundaryMargin) % 360) && 
        (angle <= (nextFixedPointAngle - boundaryMargin) % 360) && 
        !sectors[index].pointInside) {
      const startX = centerX + radius * Math.cos(degreesToRadians(angle));
      const startY = centerY + radius * Math.sin(degreesToRadians(angle));
      
      sectors[index].bar.angle = angle;
      sectors[index].bar.height = 0;
      sectors[index].bar.isInitial = false;
      sectors[index].bar.startX = startX;
      sectors[index].bar.startY = startY;
      draggingBarIndex = index;
      
      sectors[index].pointInside = true;
      sectors[index].bar.changed = true;
      isDragging = true;
    }
    draw();
  }
}

function isCursorNearBar(bar, x, y) {
  const angleInRadians = degreesToRadians(bar.angle);

  const baseX = centerX + radius * Math.cos(angleInRadians);
  const baseY = centerY + radius * Math.sin(angleInRadians);

  const peakX = centerX + (radius + bar.height) * Math.cos(angleInRadians);
  const peakY = centerY + (radius + bar.height) * Math.sin(angleInRadians);

  return isPointNearLine(x, y, baseX, baseY, peakX, peakY, 10);
}

function getTouchPosition(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.touches[0].clientX - rect.left;
  const y = e.touches[0].clientY - rect.top;
  return { x, y };
}

function handleTouchMove(e) {
  e.preventDefault();
  if (!isDragging || draggingBarIndex === null) return; // Перетаскивание возможно только при удержании

  const { x, y } = getTouchPosition(e);
  const angle = getAngle(x, y);
  const distance = getDistance(centerX, centerY, x, y);

  const bar = sectors[draggingBarIndex].bar;

  const nextFixedPointAngle = getNextFixedPointAngle(bar.angle);
  const previousFixedPointAngle = getPreviousFixedPointAngle(bar.angle);

  if (angle < (previousFixedPointAngle + boundaryMargin) % 360 ||
      angle > (nextFixedPointAngle - boundaryMargin) % 360) {
    isDragging = false;
  } else {
    bar.angle = angle;
    bar.changed = true;
  }

  if (distance > radius) {
    bar.height = Math.min(distance - radius, maxBarHeight);
    bar.startX = centerX + radius * Math.cos(degreesToRadians(bar.angle));
    bar.startY = centerY + radius * Math.sin(degreesToRadians(bar.angle));
  }
  draw();
}

function handleTouchEnd(e) {
  e.preventDefault();
  // Завершаем перетаскивание
 if (sectors[draggingBarIndex].bar.height < minBarHeight) {
      sectors[draggingBarIndex].pointInside = false; // Убираем бар
      sectors[draggingBarIndex].bar.changed = false;
    }
  isDragging = false;
  draggingBarIndex = null;
  if (isAddingBar) isAddingBar = false;
  draw();
}

canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
// Ползунок для изменения радиуса
radiusSlider.addEventListener('input', updateRadius);

updateRadius();

draw();

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Очистка холста
  drawCircle(); // Отрисовка круга
  drawSectors(); // Отрисовка секторов
  drawBars(); // Отрисовка столбиков
  drawConnections(); // О
}

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault(); // Предотвращает появление контекстного меню
})