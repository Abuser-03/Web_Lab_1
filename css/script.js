document.addEventListener('DOMContentLoaded', () => {
    const draggables = document.querySelectorAll('.kanban-card');
    const droppables = document.querySelectorAll('.kanban-cards'); // Это контейнеры для карточек

    let draggedItem = null; // Переменная для хранения перетаскиваемого элемента

    // --- Обработчики для перетаскиваемых элементов (карточек) ---

    draggables.forEach(draggable => {
        // Начало перетаскивания
        draggable.addEventListener('dragstart', () => {
            draggedItem = draggable; // Запоминаем элемент, который тащим
            setTimeout(() => {
                draggable.classList.add('dragging'); // Добавляем класс для стилизации
            }, 0); // Небольшая задержка, чтобы стиль применился после начала drag'а
            // Можно передать ID элемента для бэкенда в будущем
            // event.dataTransfer.setData('text/plain', draggable.dataset.id);
        });

        // Конец перетаскивания (независимо от того, удачно или нет)
        draggable.addEventListener('dragend', () => {
            if (draggedItem) { // Проверяем, что элемент еще существует
                draggedItem.classList.remove('dragging'); // Убираем стиль перетаскивания
            }
            draggedItem = null; // Сбрасываем перетаскиваемый элемент
        });
    });

    // --- Обработчики для зон, куда можно бросить (контейнеры колонок) ---

    droppables.forEach(zone => {
        // Когда перетаскиваемый элемент находится над зоной
        zone.addEventListener('dragover', (event) => {
            event.preventDefault(); // Необходимо, чтобы событие 'drop' сработало
            zone.classList.add('drag-over'); // Добавляем класс для подсветки зоны
        });

        // Когда перетаскиваемый элемент покидает зону
        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over'); // Убираем подсветку
        });

        // Когда элемент брошен в зону
        zone.addEventListener('drop', (event) => {
            event.preventDefault(); // Предотвращаем стандартное поведение (например, открытие ссылки)
            zone.classList.remove('drag-over'); // Убираем подсветку

            if (draggedItem && zone !== draggedItem.parentNode) { // Убедимся, что элемент существует и его бросили в другую зону
                zone.appendChild(draggedItem); // Перемещаем элемент в новую зону

                // --- !!! ВАЖНО ДЛЯ БУДУЩЕГО !!! ---
                // Здесь нужно будет добавить логику для отправки данных на бэкенд:
                // const cardId = draggedItem.dataset.id;
                // const newColumnId = zone.id;
                // console.log(`Карточка ${cardId} перемещена в колонку ${newColumnId}`);
                // Тут будет fetch запрос к вашему Node.js API для обновления статуса клиента в БД (PostgreSQL)
                // Например: updateClientStatus(cardId, newColumnId);
                // ------------------------------------
            }
        });
    });
});

// Пример функции для отправки данных (закомментировано, т.к. бэкенда пока нет)
/*
async function updateClientStatus(cardId, newColumnId) {
    try {
        const response = await fetch('/api/clients/update-status', { // Замените на ваш реальный эндпоинт
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cardId: cardId, status: newColumnId }) // newColumnId будет типа 'new-clients', 'in-progress-clients' и т.д.
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Статус обновлен:', result);
        // Можно добавить визуальное подтверждение или обработку ошибок с сервера

    } catch (error) {
        console.error('Ошибка при обновлении статуса карточки:', error);
        // Тут можно показать сообщение об ошибке пользователю
        // и, возможно, откатить перемещение карточки визуально, если обновление не удалось
    }
}
*/