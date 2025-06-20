const audio = document.getElementById('bg-music');
  const toggleBtn = document.getElementById('mute-toggle');

  // Стартуем с muted
  audio.muted = true;

  toggleBtn.addEventListener('click', () => {
    // Если первый запуск — включаем звук и запускаем музыку
    if (audio.paused) {
      audio.muted = false;
      audio.play();
      toggleBtn.textContent = '🔊';
    } else {
      // Переключаем mute
      audio.muted = !audio.muted;
      toggleBtn.textContent = audio.muted ? '🔇' : '🔊';
    }
  });