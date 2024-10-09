import * as THREE from 'three';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.156.0/examples/jsm/loaders/FBXLoader.js';

function isWebGL2Available() {
    const canvas = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
}

if (isWebGL2Available()) {
    // Настройка сцены, камеры и рендерера
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    // Установка размера рендерера
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // Обеспечивает высокое качество отображения
    document.getElementById('container').appendChild(renderer.domElement);

    // Освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Мягкий свет
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x2E3E67, 10); // Направленный свет
    directionalLight.position.set(1, 3, 3); // Позиция света
    directionalLight.castShadow = false; // Включаем отбрасывание теней для направленного света
    directionalLight.receiveShadow = true;
    directionalLight.shadow.mapSize.width = 48; // Увеличение разрешения карты теней
    directionalLight.shadow.mapSize.height = 48;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);

    // Дополнительный точечный свет для лучшего освещения
    const pointLight = new THREE.PointLight(0x994141, 5, 1);
    pointLight.position.set(0, 1, 0);
    pointLight.castShadow = true;  // Включаем отбрасывание теней для точечного света
    scene.add(pointLight);

    // Плоскость для визуализации теней
    const planeGeometry = new THREE.PlaneGeometry(5, 5);
    const planeMaterial = new THREE.ShadowMaterial({ color: 'white', opacity: 0.3 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -1;
    plane.receiveShadow = true;  // Плоскость будет получать тени
    scene.add(plane);

    // Загрузка FBX модели  
    const loader = new FBXLoader();
    let object;
    loader.load('ring.fbx', function (loadedObject) {
        object = loadedObject;
        object.scale.set(0.058, 0.058, 0.058); // Установка масштаба модели
        object.position.set(0, 1, 0);    // Позиция объекта
        object.traverse(function (child) {
            if (child.isMesh) {
                // Создание материала для объекта
                child.material = new THREE.MeshStandardMaterial({
                    color: 'white',      // Цвет объекта
                    metalness: 1,        // Металличность (блеск)
                    roughness: 0.6,      // Шероховатость (гладкость/матовость)
                    emissive: 0x111111,  // Эмиссия (легкое свечение)
                    emissiveIntensity: 0  // Интенсивность эмиссии
                });

                child.castShadow = true;    // Объект будет отбрасывать тени
                child.receiveShadow = true; // Объект будет получать тени
            }
        });

        scene.add(object);
    }, undefined, function (error) {
        console.error(error);
    });

    camera.position.z = 5;

    // Управление касанием для мобильных устройств
    let isTouching = false;
    let previousTouchPosition = { x: 0, y: 0 };

    window.addEventListener('touchstart', (event) => {
        isTouching = true;
        previousTouchPosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    });

    window.addEventListener('touchmove', (event) => {
        if (!isTouching || !object) return;

        const deltaMove = {
            x: event.touches[0].clientX - previousTouchPosition.x,
            y: event.touches[0].clientY - previousTouchPosition.y
        };

        // Вращение модели на основе перемещения касания
        object.rotation.y += deltaMove.x * 0.01;
        object.rotation.x += deltaMove.y * 0.01;

        previousTouchPosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    });

    window.addEventListener('touchend', () => {
        isTouching = false;
    });

    // Анимация
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        const container = document.getElementById('container');
        const width = container.clientWidth;
        const height = container.clientHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });
} else {
    const warning = document.createElement('div');
    warning.textContent = "WebGL 2 не поддерживается вашим браузером или устройством.";
    document.getElementById('container').appendChild(warning);
}
