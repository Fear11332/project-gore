window.addEventListener('DOMContentLoaded', async () => {
  // Проверим, что Phaser успешно подгрузился
  if (!window.Phaser) {
    return;
  }

  const Phaser = window.Phaser;

  // Импортируем модули
  const [audioModule, stage1Module] = await Promise.all([
    import('https://cdn.jsdelivr.net/gh/Fear11332/project-gore@main/map_move_zoom/js/audio.js'),
    import('https://cdn.jsdelivr.net/gh/Fear11332/project-gore@main/map_move_zoom/js/stage1.js'),
  ]);

  // Инициализация Phaser
  if (stage1Module?.initGame) {
    stage1Module.initGame(Phaser);
  }
  
  // Дополнительно можно инициализировать аудио
  if (audioModule?.initAudio) {
    audioModule.initAudio();
  }
});
