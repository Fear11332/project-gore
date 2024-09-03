const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
let isAddingBar = false;
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
let radius;
const maxBarHeight = 300;
const boundaryMargin = 4; // Допустимый маргин для углов в градусах
const heightThreshold = 10;
const radiusSlider = document.getElementById('radiusSlider');
const sectorIncrementStep = 5;
const minSectors = 14;
const maxSectors = 24;

let fixedPoint =[];

let draggingBarIndex = null;
let isDragging = false;
let sectors=[];
let sectorAngles = [];

function updateRadius() {
  radius = 2 * parseFloat(radiusSlider.value);
  draw(); // Обновляем весь холст
}

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

  if (radius > 90) {
    const radiusStep = Math.max(
      1,
      Math.floor((radius - 90) / sectorIncrementStep)
    );
    numSectors = Math.min(minSectors + radiusStep, maxSectors);
  }

  const sectorAngle = 360 / numSectors;
  sectorAngles = [];
  const newSectors = [];

  // Очистить существующие isInitial точки
  fixedPoint = fixedPoint.filter((bar) => !bar.isInitial);

  for (let i = 0; i < numSectors; i++) {
    const angle = i * sectorAngle;
    const startAngle = angle;
    const endAngle = (angle + sectorAngle) % 360;

    sectorAngles.push(startAngle);

    // Проверяем, есть ли существующий сектор с такими углами
    const existingSector = sectors.find(
      (sec) => sec.startAngle === startAngle && sec.endAngle === endAngle
    );

    if (existingSector) {
      // Если сектор уже существует, добавляем его в новый массив
      newSectors.push(existingSector);
    } else {
      // Иначе создаем новый сектор
      const previousSector = sectors.find(sec => isAngleInSector((startAngle + endAngle) / 2, sec));
      
      newSectors.push({
        startAngle: startAngle,
        endAngle: endAngle,
        pointInside: previousSector ? previousSector.pointInside : false,
        bar: previousSector ? { ...previousSector.bar } : { angle: null, height: -1, isInitial: false }
      });
    }

    // Добавляем точки для углов с флагом isInitial: true
    fixedPoint.push({ angle: startAngle, height: 0, isInitial: true });

    // Определяем координаты точки для отрисовки
    const startX = centerX + radius * Math.cos(degreesToRadians(angle));
    const startY = centerY + radius * Math.sin(degreesToRadians(angle));
    drawPoint(startX, startY);
  }

  // Обновляем массив секторов на новый
  sectors = newSectors;
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


function drawBar(angle, height) {
  const angleInRadians = degreesToRadians(angle);
  const baseX = centerX + radius * Math.cos(angleInRadians);
  const baseY = centerY + radius * Math.sin(angleInRadians);

  drawPoint(baseX, baseY);

    height = Math.min(height, maxBarHeight);

    const barEndX = centerX + (radius + height) * Math.cos(angleInRadians);
    const barEndY = centerY + (radius + height) * Math.sin(angleInRadians);

    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.lineTo(barEndX, barEndY);
    ctx.strokeStyle = 'white';
    ctx.stroke();
}

function drawBars() {
  for (let i = 0; i < sectors.length; i++) {
    if(sectors[i].pointInside){
      const bar = sectors[i].bar;
      drawBar(bar.angle, bar.height);
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

    ctx.moveTo(currentX, currentY);
    ctx.lineTo(nextX, nextY);
  }

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

function isAngleInSector(angle, sector) {
  // Корректировка углов для сектора, который охватывает 360°
  if (sector.startAngle < sector.endAngle) {
    return angle >= sector.startAngle && angle < sector.endAngle;
  } else {
    return angle >= sector.startAngle || angle < sector.endAngle;
  }
}

function handleMouseDown(e) {
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
      //console.log(draggingBarIndex);
      // Если перетаскивается существующий столбец, продолжаем перетаскивание
      if (draggingBarIndex !== null) {
        isDragging = true;
      } else if (draggingBarIndex === null) {
       // console.log("hello");
        const nextFixedPointAngle = getNextFixedPointAngle(angle);
        const previousFixedPointAngle = getPreviousFixedPointAngle(angle);
      console.log(angle);
      console.log(previousFixedPointAngle);
      console.log(nextFixedPointAngle);
        // Проверяем, что новая точка добавляется в пределах границ фиксированных точек
        //let sector = sectors.find()
      let index = sectors.findIndex(sec => isAngleInSector(angle,sec));
        if ((angle >= (previousFixedPointAngle + boundaryMargin) % 360) && (angle <= (nextFixedPointAngle - boundaryMargin) % 360) && !sectors[index].pointInside) {
          //console.log("hello2");
          //console.log(bars.length);
          sectors[index].bar.angle =angle;sectors[index].bar.height=0, sectors[index].bar.isInitial=false;
          draggingBarIndex = index; // Устанавливаем новую точку как перетаскиваемую
          //console.log(bars.length - 1);
          sectors[index].pointInside = true;
          isDragging = true;
        }
      }
      draw();
    }
  }else if (e.button === 2) { // Правая кнопка мыши
  // Функция для проверки близости курсора к бару
  const isCursorNearBar = (bar) => {
    const angleInRadians = degreesToRadians(bar.angle);

    // Координаты основания бара
    const baseX = centerX + radius * Math.cos(angleInRadians);
    const baseY = centerY + radius * Math.sin(angleInRadians);

    // Координаты вершины бара
    const peakX = centerX + (radius + bar.height) * Math.cos(angleInRadians);
    const peakY = centerY + (radius + bar.height) * Math.sin(angleInRadians);

    // Проверяем, находится ли курсор рядом с линией бара
    return isPointNearLine(x, y, baseX, baseY, peakX, peakY, 10);
  };

  // Находим индекс первого бара, который удовлетворяет условию
  const barIndex = sectors.findIndex(item => item.pointInside && isCursorNearBar(item.bar));

  // Если найден подходящий бар, удаляем его
  if (barIndex !== -1) {
    sectors[barIndex].pointInside = false;
    draw(); // Обновляем отображение после удаления бара
  }
}
}

function handleMouseMove(e) {
  if (!isDragging) return;
  //console.log("hell3");
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const angle = getAngle(x, y);
  const distance = getDistance(centerX, centerY, x, y);

  if (draggingBarIndex !== null) {
    const bar = sectors[draggingBarIndex].bar;
    //console.log(draggingBarIndex);

    // Ограничиваем перемещение столбца в пределах его сектора
    const nextFixedPointAngle = getNextFixedPointAngle(bar.angle);
    const previousFixedPointAngle = getPreviousFixedPointAngle(bar.angle);

    if (
      angle < (previousFixedPointAngle + boundaryMargin) % 360 ||
      angle > (nextFixedPointAngle - boundaryMargin) % 360
    ) {
      isDragging = false; // Остановить перетаскивание при достижении границы
    } else {
      bar.angle = angle; // Обновляем угол столбца
    }

    if (distance > radius) {
      bar.height = Math.min(distance - radius, maxBarHeight);
    }
    draw();
  }
}

function handleMouseUp() {
  isDragging = false;
  draggingBarIndex = null;
  if (isAddingBar) isAddingBar = false;
}

canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', handleMouseUp);
radiusSlider.addEventListener('input', updateRadius);

updateRadius();

draw();

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Очистка холста
  drawCircle(); // Отрисовка круга
  drawSectors(); // Отрисовка секторов
  drawBars(); // Отрисовка столбиков
  //drawConnections(); // О
}

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault(); // Предотвращает появление контекстного меню
});
