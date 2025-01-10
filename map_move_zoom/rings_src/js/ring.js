import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

// Создание сцены, камеры и рендерера
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
scene.background = null;

const container = document.getElementById('canvas-container');
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// Освещение
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0x2E3E67, 10);
directionalLight.position.set(1, 3, 3);
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0x994141, 5, 1);
pointLight.position.set(0, 1, 0);
pointLight.castShadow = true;
scene.add(pointLight);

// Плоскость для визуализации теней
const planeGeometry = new THREE.PlaneGeometry(5, 5);
const planeMaterial = new THREE.ShadowMaterial({ color: 'white', opacity: 0.3 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -1;
plane.receiveShadow = true;
scene.add(plane);

// Загрузка FBX модели
const loader = new FBXLoader();
let object = null;
loader.load('../fbx/ring.fbx', (loadedObject) => {
    object = loadedObject;
    object.scale.set(0.068, 0.068, 0.068);
    object.position.set(0, 0, 0);
    object.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
                color: 'white',
                metalness: 1,
                roughness: 0.6,
                emissive: 0x111111,
                emissiveIntensity: 0
            });
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    scene.add(object);
}, undefined, (error) => {
    console.error(error);
});

camera.position.z = 5;

// Управление касанием и мышью с обработкой кликов на объекте
let isTouching = false;
let isMouseDown = false;
let previousTouchPosition = { x: 0, y: 0 };
let previousMousePosition = { x: 0, y: 0 };

// Raycaster для обнаружения кликов на объекте
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Обработчики для касания
const handleTouchStart = (event) => {
    isTouching = true;
    previousTouchPosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
};

const handleTouchMove = (event) => {
    if (!isTouching || !object) return;

    event.preventDefault(); // Предотвращаем прокрутку

    const deltaMove = {
        x: event.touches[0].clientX - previousTouchPosition.x,
        y: event.touches[0].clientY - previousTouchPosition.y
    };

    // Вращение модели на основе перемещения касания
    object.rotation.y += deltaMove.x * 0.01;
    object.rotation.x += deltaMove.y * 0.01;

    previousTouchPosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
};

const handleTouchEnd = (event) => {
    if (isTouching && event.touches.length === 0) {
        checkInteraction(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
    }
    isTouching = false;
};

// Обработчики для мыши
const handleMouseDown = (event) => {
    isMouseDown = true;
    previousMousePosition = { x: event.clientX, y: event.clientY };
};

const handleMouseMove = (event) => {
    if (!isMouseDown || !object) return;

    const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y
    };

    // Вращение модели на основе перемещения мыши
    object.rotation.y += deltaMove.x * 0.01;
    object.rotation.x += deltaMove.y * 0.01;

    previousMousePosition = { x: event.clientX, y: event.clientY };
};

const handleMouseUp = (event) => {
    if (isMouseDown) {
        checkInteraction(event.clientX, event.clientY);
    }
    isMouseDown = false;
};

// Функция проверки взаимодействия с объектом
const checkInteraction = (clientX, clientY) => {
    // Преобразование координат экрана в нормализованные координаты для Raycaster
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(object);

    if (intersects.length > 0) {
        // Если объект нажат, выполняем редирект
        window.parent.postMessage({ action: 'ringClicked', data: { message: 'Ring was clicked' } }, '*');
    }
};

// Добавляем обработчики касания
window.addEventListener('touchstart', handleTouchStart, { passive: false });
window.addEventListener('touchmove', handleTouchMove, { passive: false });
window.addEventListener('touchend', handleTouchEnd, { passive: false });

// Добавляем обработчики для мыши
window.addEventListener('mousedown', handleMouseDown, { passive: false });
window.addEventListener('mousemove', handleMouseMove, { passive: false });
window.addEventListener('mouseup', handleMouseUp, { passive: false });


// Анимация
const animate = () => {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
};
animate();

// Обработка изменения размера окна
const handleResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
};

window.addEventListener('resize', handleResize);

// Функция закрытия
function onClose() {
    scene.dispose();
    renderer.dispose();
    container.innerHTML = ''; // Очистить контейнер
}
