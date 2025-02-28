import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const backgroundImages = [
    'https://fear11332.github.io/project-gore//map_move_zoom/images/1.webp',
    'https://fear11332.github.io/project-gore//map_move_zoom/images/2.webp',
    'https://fear11332.github.io/project-gore//map_move_zoom/images/3.webp',
    'https://fear11332.github.io/project-gore//map_move_zoom/images/4.webp',
    'https://fear11332.github.io/project-gore//map_move_zoom/images/5.webp'
];

// Управление касанием и мышью с обработкой кликов на объекте
const moveThreshold = 0; // Порог для перемещения в пикселях
let isMoved = false; // Флаг для отслеживания перемещения
let isTouching = false;
let isMouseDown = false;
let previousTouchPosition = { x: 0, y: 0 };
let previousMousePosition = { x: 0, y: 0 };
// Raycaster для обнаружения кликов на объекте
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let currentImageIndex = 0;
const textureLoader = new THREE.TextureLoader();
const loadedTextures = []; // Массив для хранения загруженных текстур
let scene = null;
let camera = null;
let ambientLight = null;
let directionalLight = null;
let pointLight = null;
let planeGeometry = null;
let planeMaterial = null;
let plane = null;
let renderer = null;
let object = null;
let stageImageIsOpen = true;
let container = document.getElementById('canvas-container');
let backgroundMesh = null;
let animationFrameId = null;

preloadTextures(backgroundImages)
                .then((textures) => {
                    // Сохраняем загруженные текстуры
                    loadedTextures.push(...textures);
                    initScene();
                    animate();
                })
                .catch((error) => {
                    console.error('Ошибка при загрузке текстур:', error);
                });
                
// Функция предзагрузки всех текстур
function preloadTextures(images) {
    return Promise.all(
        images.map((imagePath) => {
            return new Promise((resolve, reject) => {
                textureLoader.load(
                    imagePath,
                    (texture) => resolve(texture), // Успешная загрузка
                    undefined,
                    (error) => reject(error) // Ошибка загрузки
                );
            });
        })
    );
}

function updateBackground(index) {
   if (backgroundMesh) {
        scene.remove(backgroundMesh);
        backgroundMesh.material.dispose();
        backgroundMesh.geometry.dispose();
    }

    const texture = loadedTextures[index];
    

    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
    });

    // 1. Вычисляем высоту фонового меша на основе камеры
    const distance = camera.position.z - (-1000); // Камера -> фоновый объект
    const aspect = window.innerWidth / window.innerHeight;
    const height = 2 * Math.tan((camera.fov * Math.PI) / 360) * distance; 
    const width = height * aspect;

    // 2. Создаем плоскость правильного размера
    const geometry = new THREE.PlaneGeometry(width, height);
    backgroundMesh = new THREE.Mesh(geometry, material);

    // 3. Устанавливаем фоновый меш за камеру
    backgroundMesh.position.set(0, 0, -1000);
    scene.add(backgroundMesh);
}

// Функция установки фоновой картинки
//function updateBackground(index) {
    /*if (scene.background) {
        scene.background.dispose();
    }*/
    //scene.background = loadedTextures[index];
    //container.style.backgroundImage = `url(${backgroundImages[index]})`;

//}



function initScene(){

    // Создание сцены, камеры и рендерера
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Освещение
    ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    directionalLight = new THREE.DirectionalLight(0x2E3E67, 10);
    directionalLight.position.set(1, 3, 3);
    scene.add(directionalLight);

    pointLight = new THREE.PointLight(0x994141, 5, 1);
    pointLight.position.set(0, 1, 0);
    pointLight.castShadow = true;
    scene.add(pointLight);

    // Плоскость для визуализации теней
    planeGeometry = new THREE.PlaneGeometry(5, 5);
    planeMaterial = new THREE.ShadowMaterial({ color: 'white', opacity: 0.3 });
    planeMaterial = new THREE.ShadowMaterial({ opacity: 0 }); // Прозрачная тень
    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -1;
    plane.receiveShadow = true;
    scene.add(plane);


    // Загрузка FBX модели
    const loader = new FBXLoader();
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
        object.visible = false;
        scene.add(object);
        
    }, undefined, (error) => {
        console.error(error);
    });

    camera.position.z = 5;

    updateBackground(currentImageIndex);
    currentImageIndex++;
}

function chandeBackVisiableRing(){
        if (currentImageIndex < backgroundImages.length - 1) {
            // Переключаем фон
            currentImageIndex++;
            updateBackground(currentImageIndex);
        } 
        if (currentImageIndex === backgroundImages.length - 1) {
            if (object) {
                object.visible = true; // Показываем кольцо
                stageImageIsOpen = false; // Закрываем стадию изображений
                currentImageIndex = 0; // Сбрасываем индекс
            }
        }
}

// Обработчики для касания
const handleTouchStart = (event) => {
    event.preventDefault();
    if(stageImageIsOpen){
        chandeBackVisiableRing();
    }else{
        isTouching = true;
        isMoved = false;
        previousTouchPosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
};

const handleTouchMove = (event) => {
    if(!stageImageIsOpen){
        if (!isTouching || !object) return;

        event.preventDefault(); // Предотвращаем прокрутку

          const deltaMove = {
            x: event.touches[0].clientX - previousTouchPosition.x,
            y: event.touches[0].clientY - previousTouchPosition.y
        };

        if (Math.abs(deltaMove.x) > moveThreshold || Math.abs(deltaMove.y) > moveThreshold) {
            
            isMoved = true;
            // Создаём кватернион для поворота вокруг осей
            const axisX = new THREE.Vector3(1, 0, 0); // Вращение по X
            const axisY = new THREE.Vector3(0, 1, 0); // Вращение по Y
            const angleX = deltaMove.y * 0.009; // Скорость вращения
            const angleY = deltaMove.x * 0.009;

            // Применяем вращение через кватернионы
            const quaternionX = new THREE.Quaternion();
            quaternionX.setFromAxisAngle(axisX, angleX);
            const quaternionY = new THREE.Quaternion();
            quaternionY.setFromAxisAngle(axisY, angleY);

            object.quaternion.multiplyQuaternions(quaternionY, object.quaternion);
            object.quaternion.multiplyQuaternions(quaternionX, object.quaternion);

            previousTouchPosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
        }
    }
};


const handleTouchEnd = (event) => {
    if(!stageImageIsOpen){
        if (isTouching && event.touches.length === 0) {
            if(!isMoved){
                checkInteraction(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
            }
        }
        isTouching = false;
    }
};

// Обработчики для мыши
const handleMouseDown = (event) => {
    event.preventDefault();
    if(stageImageIsOpen){
        chandeBackVisiableRing();
    }else{
            isMouseDown = true;
            isMoved = false;
            previousMousePosition = { x: event.clientX, y: event.clientY };
        }
};

const handleMouseMove = (event) => {
    if(!stageImageIsOpen){
        if (!isMouseDown || !object) return;

        const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y
        };
        
        if (Math.abs(deltaMove.x) > moveThreshold || Math.abs(deltaMove.y) > moveThreshold) {
            isMoved = true; // Отмечаем, что произошло перемещение
            const axisX = new THREE.Vector3(1, 0, 0);
            const axisY = new THREE.Vector3(0, 1, 0);
            const angleX = deltaMove.y * 0.005;
            const angleY = deltaMove.x * 0.005;

            const quaternionX = new THREE.Quaternion();
            quaternionX.setFromAxisAngle(axisX, angleX);
            const quaternionY = new THREE.Quaternion();
            quaternionY.setFromAxisAngle(axisY, angleY);

            object.quaternion.multiplyQuaternions(quaternionY, object.quaternion);
            object.quaternion.multiplyQuaternions(quaternionX, object.quaternion);

            previousMousePosition = { x: event.clientX, y: event.clientY };
        }
    }
};

const handleMouseUp = (event) => {
    if(!stageImageIsOpen){
        if (isMouseDown) {
            if(!isMoved){
                checkInteraction(event.clientX, event.clientY);
            }
        }
        isMouseDown = false;
    }
};

// Функция проверки взаимодействия с объектом
const checkInteraction = (clientX, clientY) => {
    if(!stageImageIsOpen){
        // Преобразование координат экрана в нормализованные координаты для Raycaster
        mouse.x = (clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(object);

        if (intersects.length > 0) {
            onClose();
            // Если объект нажат, выполняем редирект
            window.parent.postMessage({ action: 'ringClicked', data: { message: 'Ring was clicked' } }, '*');
        }
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
    if (scene && camera && renderer) {
        animationFrameId = requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
};
animate();

// Обработка изменения размера окна
const handleResize = () => {
    if(camera){
        const width = window.innerWidth;
        const height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }
};

window.addEventListener('resize', handleResize);

// Функция закрытия
function onClose() {
    container.style.opacity = '0';

    // Удаляем объект сцены
    if (object) {
        object.traverse((child) => {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach((mat) => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
            if (child.geometry) child.geometry.dispose();
        });
        scene.remove(object);
        object = null;
    }

    // Удаляем фон
    if (backgroundMesh) {
        scene.remove(backgroundMesh);
        if (backgroundMesh.material) backgroundMesh.material.dispose();
        if (backgroundMesh.geometry) backgroundMesh.geometry.dispose();
        backgroundMesh = null;
    }

    // Освобождаем текстуры
    if (loadedTextures.length > 0) {
        loadedTextures.forEach((texture) => {
            if (texture && texture.isTexture) texture.dispose();
        });
        loadedTextures.length = 0;
    }

    // Удаление источников света
    [ambientLight, directionalLight, pointLight].forEach((light) => {
        if (light) scene.remove(light);
    });
    ambientLight = directionalLight = pointLight = null;

    // Удаление плоскости для теней
    if (plane) {
        plane.traverse((child) => {
            if (child.material) child.material.dispose();
            if (child.geometry) child.geometry.dispose();
        });
        scene.remove(plane);
        plane = null;
    }

    // Останавливаем анимацию (если используется requestAnimationFrame)
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // Очистка рендерера
    if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        renderer = null;
    }

    // Очистка сцены
    if (scene) {
        while (scene.children.length > 0) {
            let child = scene.children[0];
            scene.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach((mat) => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        }
        scene = null;
    }

    // Очистка камеры
    if (camera) {
        camera = null;
    }

    removeEventListeners();
}

function removeEventListeners() {
    window.removeEventListener('touchstart', handleTouchStart);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
    window.removeEventListener('mousedown', handleMouseDown);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    window.removeEventListener('resize', handleResize);
}
