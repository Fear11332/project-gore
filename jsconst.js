const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = 200;
const maxBarHeight = 300; // Максимальная высота столбиков
const minDistanceBetweenBars = 0.1; // Минимальное расстояние между столбиками в радианах

let bars = []; // To store bar data: {angle: angle, height: height, isInitial: boolean}
let draggingBarIndex = null;
let isDragging = false;

// Draw the circle
function drawCircle() {
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = 'red';
  ctx.stroke();
}

// Draw a point
function drawPoint(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, 2 * Math.PI);
  ctx.fill();
}

// Draw a bar
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

// Draw all bars
function drawBars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCircle();

  // Draw bars
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    drawBar(bar.angle, bar.height);
  }
}

// Calculate distance between two points
function getDistance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Calculate the angle from the center of the circle
function getAngle(x, y) {
  const dx = x - centerX;
  const dy = y - centerY;
  return Math.atan2(dy, dx);
}

// Get the index of the closest bar to the given point
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

  return minDistance < 11 ? closestIndex : null; // Change threshold if needed
}

// Check if the angle is unique (no bars too close)
function isAngleUnique(angle) {
  return !bars.some(bar => Math.abs(bar.angle - angle) < minDistanceBetweenBars);
}

// Add initial bars at 12, 3, 6, and 9 o'clock
function addInitialBars() {
  const initialAngles = [
    -Math.PI / 2, // 12 o'clock
    0,           // 3 o'clock
    Math.PI / 2,  // 6 o'clock
    Math.PI       // 9 o'clock
  ];

  initialAngles.forEach(angle => {
    bars.push({ angle, height: 0, isInitial: true });
  });
}

// Event handler for mouse down
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const angle = getAngle(x, y);
  const distance = getDistance(centerX, centerY, x, y);

  if (e.button === 0) { // Left mouse button
    // Check if click is on the edge of the circle
    if (distance < radius + 10 && distance > radius - 10) {
      // Check if there is an existing bar to drag
      draggingBarIndex = getClosestBarIndex(x, y);

      // If a bar was clicked and it's not an initial bar, start dragging
      if (draggingBarIndex !== null && !bars[draggingBarIndex].isInitial) {
        isDragging = true;
      }
      // If not, add a new bar if it is not an initial bar
      else if (draggingBarIndex === null && isAngleUnique(angle)) {
        bars.push({ angle, height: 0, isInitial: false });
        draggingBarIndex = bars.length - 1; // Set the new bar as dragging
        isDragging = true;
      }
    }
  } else if (e.button === 2) { // Right mouse button
    const indexToRemove = getClosestBarIndex(x, y);
    if (indexToRemove !== null && !bars[indexToRemove].isInitial) {
      bars.splice(indexToRemove, 1);
      drawBars();
      return;
    }
  }
});

// Event handler for mouse move
canvas.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const angle = getAngle(x, y);
  const distance = getDistance(centerX, centerY, x, y);

  if (draggingBarIndex !== null && !bars[draggingBarIndex].isInitial) {
    bars[draggingBarIndex].angle = angle;
    if (distance > radius) {
      bars[draggingBarIndex].height = Math.min(distance - radius, maxBarHeight);
    }
    drawBars();
  }
});

// Event handler for mouse up
canvas.addEventListener('mouseup', () => {
  isDragging = false;
  draggingBarIndex = null;

  // Sort bars by angle after dragging is complete
  bars.sort((a, b) => a.angle - b.angle);
});

// Initialize with initial bars
addInitialBars();
drawBars(); // Изначально рисуем

// Prevent default context menu on right-click
canvas.addEventListener('contextmenu', (e) => e.preventDefault());





































