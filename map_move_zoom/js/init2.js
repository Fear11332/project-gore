window.addEventListener('DOMContentLoaded', async () => {
  // Проверим, что Phaser подгружен
  if (!window.Phaser) {
    return;
  }

  const Phaser = window.Phaser;

  try {
    // Асинхронный импорт модулей
    const [sceneModule, constantsModule, popupModule, audioModule] = await Promise.all([
      import('https://fear11332.github.io/project-gore/map_move_zoom/js/phaserScene2.js'),
      import('https://fear11332.github.io/project-gore/map_move_zoom/js/jsconst.js'),
      import('https://fear11332.github.io/project-gore/map_move_zoom/js/popup.js'),
      import('https://fear11332.github.io/project-gore/map_move_zoom/js/audio.js'),
    ]);

    // Инициализация Phaser сцены
    if (sceneModule?.initGame && typeof sceneModule.initGame === 'function') {
      sceneModule.initGame(Phaser);
    }

    // Дополнительно можно вызвать init для других модулей,
    // если нужно (например, constantsModule.initSomething())
    // Но только в случае, если это действительно необходимо.
  } catch (error) {
  }
});
