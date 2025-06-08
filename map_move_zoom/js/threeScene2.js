import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { CloseRingPopUp , OpenConstructorPopUp} from "https://fear11332.github.io/project-gore/map_move_zoom/js/popup.js";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';


let canvas = document.getElementById('ring'), renderer, camera, animationFrameId;
let scene = new THREE.Scene();
let overlay = document.getElementById('overlay');
let radiusSlider = document.getElementById('radiusSlider');
let ambientLight,directionalLight,pointLight,planeGeometry,planeMaterial,plane;
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
let isPaused = false;
const scaleFactor = 0.060;
let distance = null;
let composer;
let seeds = [];
let current_seed = 0;
const seedsCount = 4;
let inputLocked = false;

const backgroundImages = [
    'https://fear11332.github.io/project-gore//map_move_zoom/images/1.webp',
    'https://fear11332.github.io/project-gore//map_move_zoom/images/2.webp',
    'https://fear11332.github.io/project-gore//map_move_zoom/images/3.webp',
    'https://fear11332.github.io/project-gore//map_move_zoom/images/4.webp',
    'https://fear11332.github.io/project-gore//map_move_zoom/images/5.webp'
];

const animateReturnToInitialPosition = () => {
    const seed = seeds[current_seed];
    if (!seed) return;

    const startTime = performance.now();
    const startQuaternion = seed.quaternion.clone();
    const endQuaternion = initialQuaternion.clone();

    const animate = () => {
        const elapsedTime = (performance.now() - startTime) / 1000;
        const alpha = Math.min(elapsedTime / animationDuration, 1);

        if (!seeds[current_seed]) return; // на случай удаления

        seed.quaternion.slerpQuaternions(startQuaternion, endQuaternion, alpha);

        if (alpha < 1) {
            requestAnimationFrame(animate);
        } else {
            seed.quaternion.copy(initialQuaternion);
        }
    };

    requestAnimationFrame(animate);
};


function updateBackground(index) {
    const texture = loadedTextures[index];
    if (!texture) return;

    const fov = camera.fov * Math.PI / 180;
    const aspect = camera.aspect;

    const height = meshSize;
    const width = height * aspect;
    const distance = meshSize / (2 * Math.tan(fov / 2));

    if (!backgroundMesh) {
        const geometry = new THREE.PlaneGeometry(width, height);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            depthWrite: false, // не записывает в буфер глубины
        });

        backgroundMesh = new THREE.Mesh(geometry, material);
        backgroundMesh.position.set(0, 0, -distance);
        backgroundMesh.renderOrder = -1; // рисовать раньше всех
        backgroundMesh.frustumCulled = false; // чтобы не исключался из рендера

        scene.add(backgroundMesh); // добавляем в сцену, не в камеру!
    } else {
        backgroundMesh.material.map = texture;
        backgroundMesh.material.needsUpdate = true;
    }
}

function initThreeScene() {
    renderer = new THREE.WebGLRenderer({canvas: canvas , alpha: true, antialias:true });

    // Ограничиваем диапазон размеров, например, 200 - 600
    // Получаем реальные размеры экрана без учета полосы прокрутки
    const width = window.outerWidth;
    const height = window.outerHeight;  
    
    meshSize = Math.min(Math.max(Math.max(width,height)*0.35, 360),440);
    camera = new THREE.PerspectiveCamera(75,1, 1, 10000); // aspect = 1     
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(meshSize,meshSize);

     //FXAA: создаём composer после renderer
    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.material.uniforms['resolution'].value.set(
        1 / (meshSize * window.devicePixelRatio),
        1 / (meshSize * window.devicePixelRatio)
    );
    composer.addPass(fxaaPass);

    ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambientLight);

    directionalLight = new THREE.DirectionalLight(0xA1C1CA, 3);
    directionalLight.position.set(1,2.5, 7);
    scene.add(directionalLight);

    pointLight = new THREE.PointLight(0x50080D, 8, 1);
    pointLight.position.set(0, 0, 0);
    pointLight.castShadow = true;
    scene.add(pointLight);

    // Плоскость для визуализации теней
    planeGeometry = new THREE.PlaneGeometry(5, 5);
    planeMaterial = new THREE.ShadowMaterial({ color: 'white', opacity: 0.3 });
    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -1;
    plane.receiveShadow = true;
    scene.add(plane);

    updateBackground(currentImageIndex);

    camera.position.z = 5; // Коррекция под aspect;
    currentImageIndex++;
    freezeScene(); // Замораживаем сцену, чтобы предотвратить дальнейшие обновления
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
            overlay.style.pointerEvents = 'none';
            inputLocked = true; // Блокируем ввод
            if (seeds[current_seed].quaternion.equals(initialQuaternion)) {
                freezeScene(); // Замораживаем сцену после анимации
                inputLocked = false; // Разблокируем ввод
                OpenConstructorPopUp();
            } else {
                // Запускаем анимацию, если она еще не началась
                   animateReturnToInitialPosition();
                   setTimeout(() => {
                        freezeScene(); // Замораживаем сцену после анимации
                        inputLocked = false; // Разблокируем ввод
                        OpenConstructorPopUp();
                    }, animationDuration+1900);  // Устанавливаем время для анимации
            }
        }
    }
};

function ini() {
    preloadResources(backgroundImages, seedsCount)
        .then(({ materialTextures, seedModels, backgroundTextures }) => {
            // Сохраняем фоны
            loadedTextures.push(...backgroundTextures);

            // Создаем материал
            const sharedMaterial = new THREE.MeshStandardMaterial({
                map: materialTextures.diffuse,
                normalMap: materialTextures.normal,
                roughnessMap: materialTextures.roughness,
                metalnessMap: materialTextures.metalness,
                metalness: 1.0,
            });

            // Добавляем FBX-модели в сцену
            seedModels.forEach(({ i, object }) => {
                seeds[i] = object;
                seeds[i].scale.set(scaleFactor, scaleFactor, scaleFactor);
                seeds[i].position.set(0, 0, 0);

                seeds[i].traverse(child => {
                    if (child.isMesh) {
                        child.material = sharedMaterial;
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                seeds[i].visible = false;
                scene.add(seeds[i]);
            });

            // Инициализируем сцену
            initThreeScene();
        })
        .catch(error => {
            console.error('Ошибка при загрузке ресурсов:', error);
        });
}

function preloadResources(backgroundImages, seedsCount) {
    const textureLoader = new THREE.TextureLoader();
    const fbxLoader = new FBXLoader();

    const texturePaths = {
        diffuse: 'https://fear11332.github.io/project-gore/map_move_zoom/fbx/goreme_rings_dehydration_A_C_1_04.png',
        normal: 'https://fear11332.github.io/project-gore/map_move_zoom/fbx/goreme_rings_dehydration_A_N_1_01.png',
        roughness: 'https://fear11332.github.io/project-gore/map_move_zoom/fbx/goreme_rings_dehydration_A_R_1_01.png',
        metalness: 'https://fear11332.github.io/project-gore/map_move_zoom/fbx/goreme_rings_dehydration_A_M_1_01.png'
    };

    // Загружаем одну текстуру
    const loadTexture = (path) =>
        new Promise((resolve, reject) => {
            textureLoader.load(path, resolve, undefined, reject);
        });

    // Загружаем одну модель
    const loadSeed = (i) =>
        new Promise((resolve, reject) => {
            fbxLoader.load(
                `https://fear11332.github.io/project-gore/map_move_zoom/fbx/seed_${i + 1}.fbx`,
                object => resolve({ i, object }),
                undefined,
                error => reject(error)
            );
        });

    return Promise.all([
        // Загрузка всех текстур развертки
        loadTexture(texturePaths.diffuse),
        loadTexture(texturePaths.normal),
        loadTexture(texturePaths.roughness),
        loadTexture(texturePaths.metalness),
        // Загрузка всех FBX сидов
        Promise.all(Array.from({ length: seedsCount }, (_, i) => loadSeed(i))),
        // Дополнительно — если есть фоны
        Promise.all(backgroundImages.map(loadTexture)),
    ]).then(([diffuse, normal, roughness, metalness, fbxResults, backgroundTextures]) => {
        return {
            materialTextures: { diffuse, normal, roughness, metalness },
            seedModels: fbxResults,
            backgroundTextures
        };
    });
}

function animateSeedAppearance(seed, duration) {
    const startTime = performance.now();
    seed.visible = true;
    seed.scale.set(0, 0, 0);

    function animate(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const scale = scaleFactor * easeOutCubic(progress);
        seed.scale.set(scale, scale, scale);

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
}

// Кривая плавности
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}


function chandeBackVisiableRing(){
        if (currentImageIndex < backgroundImages.length - 1) {
            // Переключаем фон
            currentImageIndex++;
            updateBackground(currentImageIndex);
        } 
        if (currentImageIndex === backgroundImages.length - 1) {
            if (seeds[current_seed]) {
                animateSeedAppearance(seeds[current_seed],1500);
                seeds[current_seed].visible = true; // Показываем кольцо
                stageImageIsOpen = false; // Закрываем стадию изображений
                radiusSlider.value = current_seed + 1;
            }
        }
}

// Обработчики для касания
const handleTouchStart = (event) => {
    event.preventDefault();
    if(inputLocked) return; // Если ввод заблокирован, игнорируем касания
    if(stageImageIsOpen){
        chandeBackVisiableRing();
    }else{
        isTouching = true;
        isMoved = false;
        previousTouchPosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
};

const handleTouchMove = (event) => {
    if(inputLocked) return; // Если ввод заблокирован, игнорируем касания
    if(!stageImageIsOpen){
        if (!isTouching || !seeds[current_seed] ) return;

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

                seeds[current_seed].quaternion.multiplyQuaternions(quaternionY, seeds[current_seed].quaternion);
                seeds[current_seed].quaternion.multiplyQuaternions(quaternionX, seeds[current_seed].quaternion);

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
    if(inputLocked) return; // Если ввод заблокирован, игнорируем касания
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
    if(inputLocked) return; // Если ввод заблокирован, игнорируем касания
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
    if(inputLocked) return; // Если ввод заблокирован, игнорируем касания
    if(!stageImageIsOpen){
        if (!isMouseDown || !seeds[current_seed] ) return;

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

            seeds[current_seed].quaternion.multiplyQuaternions(quaternionY, seeds[current_seed].quaternion);
            seeds[current_seed].quaternion.multiplyQuaternions(quaternionX, seeds[current_seed].quaternion);

            previousMousePosition = { x: event.clientX, y: event.clientY };
        }
    }
};

const handleMouseUp = (event) => {
    event.preventDefault(); // Предотвращаем прокрутку
    if(inputLocked) return; // Если ввод заблокирован, игнорируем касания
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
    if(inputLocked) return; // Если ввод заблокирован, игнорируем касания
    if (isMouseDown) {
        handleMouseUp(event); // Если мышь зажата и вышла за пределы canvas — сбросить состояние
    }
};

const handleRightClick = (event) => {
    event.preventDefault();  // Отменяет появление контекстного меню
};

const handleCloseRing = (event)=>{
    if(inputLocked) return; // Если ввод заблокирован, игнорируем касания
    event.preventDefault();
    CloseRingPopUp();
};

const changeSeed = (event) => {    
    event.preventDefault();
    if(seeds && !stageImageIsOpen){
        seeds[current_seed].visible = false;
        seeds[current_seed = parseFloat(radiusSlider.value-1)].visible = true;
    }
}

function registerEventListers(){
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    overlay.addEventListener('click',handleCloseRing,{passive:false});
    radiusSlider.addEventListener('input', changeSeed, {passive:false});
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
    radiusSlider.removeEventListener('input', changeSeed);

    canvas.removeEventListener('mousedown', handleMouseDown);
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mouseup', handleMouseUp);
    canvas.removeEventListener('mouseleave', handleMouseLeave, { passive: false });
    window.removeEventListener('contextmenu', handleRightClick);
}

// Заморозить сцену и остановить обновления
function freezeScene() {
    isPaused = true;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    removeEventListeners(); // Убираем слушатели событий
}

// Возобновить сцену (если нужно)
function unfreezeScene() {
    if (!isPaused) return;
    isPaused = false;
    registerEventListers();
    animate();
}

function animate() {
    if (scene && camera && renderer && !isPaused) {
        animationFrameId = requestAnimationFrame(animate);
            // Например, вращаем точку по кругу (по часовой стрелке)
        composer.render();
    }
}

export {ini,freezeScene,unfreezeScene,current_seed};

