 let initialTopPosition; // Сохраняем изначальную высоту

        window.addEventListener('load', () => {
            const container = document.querySelector('.render-container');
            // Запоминаем начальное положение контейнера
            initialTopPosition = container.getBoundingClientRect().top;

            // Вызываем функцию для установки корректного положения при загрузке страницы
            adjustContainerPosition();
        });

        window.addEventListener('resize', adjustContainerPosition);

        function adjustContainerPosition() {
            const container = document.querySelector('.render-container');
            const windowHeight = window.innerHeight;

            // Определяем смещение контейнера относительно начальной позиции
            const windowScaleFactor = windowHeight / initialTopPosition;

            // Вычисляем новое положение контейнера
            const newTopPosition = initialTopPosition * windowScaleFactor;

            // Устанавливаем новое положение контейнера
            container.style.top = `${newTopPosition}px`;
        }