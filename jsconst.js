const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = 200;
const maxBarHeight = 300; // Максимальная высота столбиков
const minDistanceBetweenPoints = 20; // Минимальное расстояние между точками

let bars = []; // To store bar data: {angle: angle, height: height}
let points = []; // To store points coordinates
let draggingBarIndex = null;
let draggingPointIndex = null;
let isDragging = false;

function drawCircle() {
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = isCircleCovered() ? 'green' : 'red';
  ctx.stroke();
}

function drawPoint(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, 2 * Math.PI);
  ctx.fill();
}

function drawBar(angle, height) {
  const baseX = centerX + radius * Math.cos(angle);
  const baseY = centerY + radius * Math.sin(angle);

  // Draw the point
  drawPoint(baseX, baseY);

  if (height > 0) {
    height = Math.min(height, maxBarHeight);

    const barEndX = centerX + (radius + height) * Math.cos(angle);
    const barEndY = centerY + (radius + height) * Math.sin(angle);

    // Draw the needle (line) at the top of the bar
    ctx.beginPath();
    ctx.moveTo(baseX, baseY); // Base of the needle
    ctx.lineTo(barEndX, barEndY); // Peak of the needle
    ctx.strokeStyle = 'black';
    ctx.stroke();
  }
}

function drawBars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCircle();
  
  // Draw bars and connections
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    drawBar(bar.angle, bar.height);

    if (i > 0) {
      const prevBar = bars[i - 1];
      const prevEndX = centerX + (radius + prevBar.height) * Math.cos(prevBar.angle);
      const prevEndY = centerY + (radius + prevBar.height) * Math.sin(prevBar.angle);

      const curEndX = centerX + (radius + bar.height) * Math.cos(bar.angle);
      const curEndY = centerY + (radius + bar.height) * Math.sin(bar.angle);

      // Draw line connecting the previous bar end to the current bar end
      ctx.beginPath();
      ctx.moveTo(prevEndX, prevEndY);
      ctx.lineTo(curEndX, curEndY);
      ctx.strokeStyle = 'black';
      ctx.stroke();
    }
  }

  // Connect the last bar to the first bar only if the figure covers the circle
  if (bars.length > 1 && isCircleCovered()) {
    const firstBar = bars[0];
    const lastBar = bars[bars.length - 1];

    const firstEndX = centerX + (radius + firstBar.height) * Math.cos(firstBar.angle);
    const firstEndY = centerY + (radius + firstBar.height) * Math.sin(firstBar.angle);
    const lastEndX = centerX + (radius + lastBar.height) * Math.cos(lastBar.angle);
    const lastEndY = centerY + (radius + lastBar.height) * Math.sin(lastBar.angle);

    // Draw line connecting the last bar end to the first bar end
    ctx.beginPath();
    ctx.moveTo(lastEndX, lastEndY);
    ctx.lineTo(firstEndX, firstEndY);
    ctx.strokeStyle = 'black';
    ctx.stroke();
  }
}

function isPointNearPoint(px, py, x, y, threshold) {
  return getDistance(px, py, x, y) < threshold;
}

function getDistance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function getAngle(x, y) {
  const dx = x - centerX;
  const dy = y - centerY;
  return Math.atan2(dy, dx);
}

function getClosestBarIndex(x, y) {
  let closestIndex = null;
  let minDistance = Infinity;

  bars.forEach((bar, index) => {
    const baseX = centerX + radius * Math.cos(bar.angle);
    const baseY = centerY + radius * Math.sin(bar.angle);
    const peakX = centerX + (radius + bar.height) * Math.cos(bar.angle);
    const peakY = centerY + (radius + bar.height) * Math.sin(bar.angle);

    const distanceToBase = getDistance(x, y, baseX, baseY);
    const distanceToPeak = getDistance(x, y, peakX, peakY);

    if (distanceToBase < 10 || distanceToPeak < 10) {
      minDistance = Math.min(minDistance, Math.min(distanceToBase, distanceToPeak));
      closestIndex = index;
    }
  });

  return minDistance < 10 ? closestIndex : null; // Change threshold if needed
}

function getClosestPointIndex(x, y) {
  let closestIndex = null;
  let minDistance = Infinity;

  points.forEach((point, index) => {
    const distance = getDistance(x, y, point.x, point.y);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });

  return minDistance < 10 ? closestIndex : null; // Change threshold if needed
}

function isCircleCovered() {
  const len = bars.length;
  if (len < 3) return false;

  let totalAngle = 0;
  for (let i = 0; i < len; i++) {
    const bar1 = bars[i];
    const bar2 = bars[(i + 1) % len];
    const angleDiff = (bar2.angle - bar1.angle + 2 * Math.PI) % (2 * Math.PI);
    totalAngle += angleDiff;
  }

  return Math.abs(totalAngle - 2 * Math.PI) < 0.01; // Точность проверки
}

function isPointUnique(x, y) {
  return !points.some(point => getDistance(x, y, point.x, point.y) < minDistanceBetweenPoints);
}

function updatePoints() {
  points = bars.map((bar, index) => {
    const x = centerX + radius * Math.cos(bar.angle);
    const y = centerY + radius * Math.sin(bar.angle);
    return { x, y };
  });
}

function isPointInCircle(x, y, cx, cy, radius) {
  return getDistance(x, y, cx, cy) < radius;
}

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const angle = getAngle(x, y);
  const distance = getDistance(centerX, centerY, x, y);

  if (distance < radius + 10 && distance > radius - 10) {
    if (isPointUnique(x, y)) {
      points.push({ x, y });
      bars.push({ angle, height: 0 });
      bars.sort((a, b) => a.angle - b.angle); // Сортировка по углу для упрощения проверки
      updatePoints(); // Обновляем список точек
      drawBars();
    }
  }
});

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const indexToRemove = getClosestBarIndex(x, y);

  if (indexToRemove !== null) {
    bars.splice(indexToRemove, 1);
    points.splice(indexToRemove, 1);
    updatePoints(); // Обновляем список точек после удаления
    drawBars();
  }
});

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  draggingBarIndex = getClosestBarIndex(x, y);
  draggingPointIndex = getClosestPointIndex(x, y);
  isDragging = draggingBarIndex !== null || draggingPointIndex !== null;
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const angle = getAngle(x, y);
  const distance = getDistance(centerX, centerY, x, y);

  if (draggingBarIndex !== null) {
    bars[draggingBarIndex].angle = angle;
    if (distance > radius) {
      bars[draggingBarIndex].height = Math.min(distance - radius, maxBarHeight);
    }
    drawBars();
  }

  if (draggingPointIndex !== null) {
    const point = points[draggingPointIndex];
    const newAngle = getAngle(x, y);
    const newDistance = Math.min(getDistance(centerX, centerY, x, y), radius);
    point.x = centerX + newDistance * Math.cos(newAngle);
    point.y = centerY + newDistance * Math.sin(newAngle);
    bars[draggingPointIndex].angle = newAngle;
    drawBars();
  }
});

canvas.addEventListener('mouseup', () => {
  isDragging = false;
  draggingBarIndex = null;
  draggingPointIndex = null;
});

drawBars(); // Изначально рисуем







































