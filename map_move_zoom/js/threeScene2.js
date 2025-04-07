import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { CloseRingPopUp , OpenConstructorPopUp} from "https://fear11332.github.io/project-gore/map_move_zoom/js/popup.js";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';


const backgroundImages = [
    'https://fear11332.github.io/project-gore//map_move_zoom/images/1.webp',
    'https://fear11332.github.io/project-gore//map_move_zoom/images/2.webp',
    'https://fear11332.github.io/project-gore//map_move_zoom/images/3.webp',
    'https://fear11332.github.io/project-gore//map_move_zoom/images/4.webp',
    'https://fear11332.github.io/project-gore//map_move_zoom/images/5.webp'
];
let canvas = document.getElementById('ring'), renderer, scene, camera, animationFrameId;
let overlay = document.getElementById('overlay');
let object, ambientLight,directionalLight,pointLight,planeGeometry,planeMaterial,plane;
let stageImageIsOpen = true;
let currentImageIndex = 0;
let backgroundMesh = null;
const loadedTextures = []; // Массив для хранения загруженных текстур
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
let initialQuaternion = new THREE.Quaternion();
const textureLoader = new THREE.TextureLoader();
const animationDuration = 1.2; 
const clock = new THREE.Clock();
let meshSize;
let isPaused = null;
const scaleFactor = 0.060;
let distance = null;
let composer;

const animateReturnToInitialPosition = () => {
    if (!object) return;

    clock.elapsedTime = 0;
    clock.start();

    const startQuaternion = object.quaternion.clone(); // Запоминаем начальное положение
    const endQuaternion = initialQuaternion.clone();  // Финальное положение

    const animate = () => {
        const elapsedTime = clock.getElapsedTime();
        const alpha = Math.min(elapsedTime / animationDuration, 1);

        // Используем slerpQuaternions вместо slerp, чтобы избежать проблем с промежуточным состоянием
        object.quaternion.slerpQuaternions(startQuaternion, endQuaternion, alpha);

        if (alpha < 1) {
            requestAnimationFrame(animate);
        } else {
            object.quaternion.copy(initialQuaternion); // Убеждаемся, что выставили финальное значение
            clock.stop();
        }
    };

    requestAnimationFrame(animate);
};

function updateBackground(index) {
    if (backgroundMesh) {
        scene.remove(backgroundMesh);
        backgroundMesh.material.dispose();
        backgroundMesh.geometry.dispose();
    }
    
    // 2. Создаем плоскость правильного размера
    backgroundMesh = new THREE.Mesh(new THREE.PlaneGeometry(meshSize,meshSize)
    , new THREE.MeshBasicMaterial({
        map: loadedTextures[index],
        transparent: true,
    }));

    const fov = camera.fov * Math.PI / 180; // Переводим угол в радианы
    distance = meshSize / (2 * Math.tan(fov / 2));

    // Устанавливаем позицию камеры относительно расстояния
    // 3. Устанавливаем фоновый меш за камеру
    backgroundMesh.position.set(0, 0, -distance);
    scene.add(backgroundMesh);
}

function initThreeScene() {
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer({canvas: canvas , alpha: true, antialias:true });

    // Ограничиваем диапазон размеров, например, 200 - 600
    // Получаем реальные размеры экрана без учета полосы прокрутки
    const width = window.outerWidth;
    const height = window.outerHeight;  
    
    meshSize = Math.min(Math.max(Math.max(width,height)*0.35, 360),440);
    camera = new THREE.PerspectiveCamera(75,1, 1, 10000); // aspect = 1     
    renderer.setSize(meshSize,meshSize);
    renderer.setPixelRatio(window.devicePixelRatio);

     // 👉 FXAA: создаём composer после renderer
    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.material.uniforms['resolution'].value.set(
        1 / (meshSize * window.devicePixelRatio),
        1 / (meshSize * window.devicePixelRatio)
    );
    composer.addPass(fxaaPass);

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

    updateBackground(currentImageIndex);
    // Загружаем FBX модель
    const loader = new FBXLoader();
    loader.load('https://fear11332.github.io/project-gore/map_move_zoom/fbx/ring.fbx', (loadedObject) => {
        object = loadedObject;      
       object.scale.set(scaleFactor,scaleFactor,scaleFactor);
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
        object.visible=false; // Скрываем модель сразу после загрузки
        scene.add(object);
    }, undefined, (error) => {
        console.error(error);
    });

    camera.position.z = 5; // Коррекция под aspect;
    currentImageIndex++;
}

const checkInteraction = (clientX, clientY) => {
    if(!stageImageIsOpen){
        // Преобразование координат экрана в нормализованные координаты для Raycaster
        mouse.x = (clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(clientY / window.innerHeight) * 2 + 1;       

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(backgroundMesh);

        if (intersects.length >= 0) {
            // Если кольцо уже в начальной позиции, сразу закрываем
            overlay.style.pointerEvents = 'none'; // Разрешаем взаимодействие 
            removeEventListeners();
            if (object.quaternion.equals(initialQuaternion)) {
                cancelAnimationFrame(animationFrameId);
                OpenConstructorPopUp();
            } else {
                // Запускаем анимацию, если она еще не началась
                   animateReturnToInitialPosition();
                   setTimeout(() => {
                        cancelAnimationFrame(animationFrameId);
                        OpenConstructorPopUp();
                    }, animationDuration+1900);  // Устанавливаем время для анимации
            }
        }
    }
};

function ini(){
    preloadTextures(backgroundImages)
    .then((textures) => {
        // Сохраняем загруженные текстуры
        loadedTextures.push(...textures);
    })
    .then((loadedObject) => {
        object = loadedObject;
        initThreeScene();
    })
    .catch((error) => {
        console.error('Ошибка при загрузке ресурсов:', error);
    });
         
}
       
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
        if (!isTouching || !object ) return;

        event.preventDefault(); // Предотвращаем прокрутку
        const touch = event.touches[0];

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
        const rect = canvas.getBoundingClientRect();
        if (
            touch.clientX < rect.left ||
            touch.clientX > rect.right ||
            touch.clientY < rect.top ||
            touch.clientY > rect.bottom        
        ) {
            handleTouchEnd(event); // Завершаем обработку
        }
    }
};


const handleTouchEnd = (event) => {
    event.preventDefault(); // Предотвращаем прокрутку
    if(!stageImageIsOpen){
        if (isTouching) {
            if(!isMoved){
                checkInteraction(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
            }
        }
        isTouching = false;
        isMoved = false;
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
    event.preventDefault(); // Предотвращаем прокрутку
    if(!stageImageIsOpen){
        if (!isMouseDown || !object ) return;

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
    event.preventDefault(); // Предотвращаем прокрутку
    if(!stageImageIsOpen){
        if (isMouseDown) {
            if(!isMoved){
                checkInteraction(event.clientX, event.clientY);
            }
        }
        isMouseDown = false;
        isMoved = false;
    }
};

const handleMouseLeave = (event) => {
     event.preventDefault();
    if (isMouseDown) {
        handleMouseUp(event); // Если мышь зажата и вышла за пределы canvas — сбросить состояние
    }
};

const handleRightClick = (event) => {
    event.preventDefault();  // Отменяет появление контекстного меню
};

const handleCloseRing = (event)=>{
    event.preventDefault();
    cancelAnimationFrame(animationFrameId);
    CloseRingPopUp();
};

function registerEventListers(){
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    overlay.addEventListener('click',handleCloseRing,{passive:false});
    // Добавляем обработчики для мыши
    canvas.addEventListener('mousedown', handleMouseDown, { passive: false });
    canvas.addEventListener('mousemove', handleMouseMove, { passive: false });
    canvas.addEventListener('mouseup', handleMouseUp, { passive: false });
    canvas.addEventListener('mouseleave', handleMouseLeave, { passive: false }); 
    window.addEventListener('contextmenu', handleRightClick);  
}

function removeEventListeners() {
    overlay.removeEventListener('click',handleCloseRing);
    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchmove', handleTouchMove);
    canvas.removeEventListener('touchend', handleTouchEnd);

    canvas.removeEventListener('mousedown', handleMouseDown);
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mouseup', handleMouseUp);
    canvas.removeEventListener('mouseleave', handleMouseLeave, { passive: false });
    window.removeEventListener('contextmenu', handleRightClick);
}

function animate() {
    if (scene && camera && renderer && !isPaused) {
        animationFrameId = requestAnimationFrame(animate);
        composer.render();
    }
}

export {ini,registerEventListers, animate,removeEventListeners};
