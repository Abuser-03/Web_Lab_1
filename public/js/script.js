document.addEventListener('DOMContentLoaded', () => {
    const kanbanBoard = document.getElementById('kanbanBoard');
    const addClientForm = document.getElementById('addClientForm');
    const editClientForm = document.getElementById('editClientForm');
    const addClientModalElement = document.getElementById('addClientModal');
    const editClientModalElement = document.getElementById('editClientModal');
    const clientDetailsModalElement = document.getElementById('clientDetailsModal');
    const manageStatusesModalElement = document.getElementById('manageStatusesModal');
    const editStatusModalElement = document.getElementById('editStatusModal');
    const confirmDeleteModalElement = document.getElementById('confirmDeleteModal');
    
    const addClientModal = bootstrap.Modal.getOrCreateInstance(addClientModalElement);
    const editClientModal = bootstrap.Modal.getOrCreateInstance(editClientModalElement);
    const clientDetailsModal = bootstrap.Modal.getOrCreateInstance(clientDetailsModalElement);
    const manageStatusesModal = bootstrap.Modal.getOrCreateInstance(manageStatusesModalElement);
    const editStatusModal = bootstrap.Modal.getOrCreateInstance(editStatusModalElement);
    const confirmDeleteModal = bootstrap.Modal.getOrCreateInstance(confirmDeleteModalElement);
    
    const notificationToast = bootstrap.Toast.getOrCreateInstance(document.getElementById('notificationToast'));
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');

    const API_BASE_URL = '/api'; // Используем относительный путь, т.к. статика раздается тем же сервером

    let draggedItem = null;
    let columnElements = {}; // Объект для хранения ссылок на DOM-элементы колонок { status_id: element }
    let currentViewingClientId = null; // ID клиента, чьи детали сейчас просматриваются
    let currentDeletingItemType = null; // Тип элемента для удаления (client, status, note)
    let currentStatuses = []; // Текущий список статусов
    let statusSortable = null; // Экземпляр Sortable для списка статусов

    // --- Утилиты ---

    // Функция для экранирования HTML
    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    // Функция для форматирования даты
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('ru-RU', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Функция для форматирования только даты (без времени)
    function formatDateOnly(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('ru-RU', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        });
    }

    // Функция для показа уведомления
    function showNotification(title, message, delay = 3000) {
        toastTitle.textContent = title;
        toastMessage.textContent = message;
        
        const toastInstance = document.getElementById('notificationToast');
        const toast = bootstrap.Toast.getOrCreateInstance(toastInstance, { delay: delay });
        toast.show();
    }

    // Функция подтверждения удаления с общим модальным окном
    function confirmDelete(id, type, message, callback) {
        document.getElementById('deleteItemId').value = id;
        document.getElementById('deleteItemType').value = type;
        document.getElementById('confirmDeleteText').textContent = message || 'Вы уверены, что хотите удалить этот элемент?';
        
        // Удаляем предыдущий обработчик, если есть
        const confirmButton = document.getElementById('confirmDeleteButton');
        const newConfirmButton = confirmButton.cloneNode(true);
        confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
        
        // Добавляем новый обработчик
        newConfirmButton.addEventListener('click', () => {
            const id = document.getElementById('deleteItemId').value;
            const type = document.getElementById('deleteItemType').value;
            
            callback(id, type);
            confirmDeleteModal.hide();
        });
        
        confirmDeleteModal.show();
    }

    // --- Функции ---

    // Функция создания DOM-элемента колонки
    function createColumnElement(status) {
        const columnDiv = document.createElement('div');
        // Используем col-md-4 для начального вида в 3 колонки, если больше - будут переноситься
        columnDiv.className = 'col-md-4 kanban-column mb-3'; // Добавил mb-3 для отступа при переносе
        columnDiv.dataset.statusId = status.id; // Сохраняем ID статуса

        const cardElement = document.createElement('div');
        cardElement.className = 'card bg-light shadow-sm h-100'; // h-100 для одинаковой высоты

        const cardHeader = document.createElement('div');
        cardHeader.className = 'card-header text-center fw-bold';
        cardHeader.textContent = escapeHTML(status.name); // Имя статуса из БД

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body kanban-cards';
        cardBody.id = `status-${status.id}`; // Уникальный ID для зоны сброса
        cardBody.dataset.statusId = status.id; // Дублируем ID для легкого доступа в drop
        cardBody.innerHTML = `<div class="text-center p-3 text-muted placeholder-card">Нет клиентов</div>`; // Placeholder

        // Добавляем обработчики для зоны сброса
        addDropZoneHandlers(cardBody);

        cardElement.appendChild(cardHeader);
        cardElement.appendChild(cardBody);
        columnDiv.appendChild(cardElement);

        return { columnDiv, cardBody };
    }

    // Функция для создания HTML-элемента карточки клиента
    function createClientCardElement(client) {
        const card = document.createElement('div');
        card.className = 'card kanban-card mb-2';
        card.draggable = true;
        card.dataset.id = client.id;
        card.dataset.statusId = client.status_id; // Храним текущий статус ID

        const badgeColor = client.badge_color || 'secondary';
        
        // Проверяем дату следующего контакта для индикатора
        let deadlineIndicator = '';
        if (client.next_contact_date) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const nextContactDate = new Date(client.next_contact_date);
            nextContactDate.setHours(0, 0, 0, 0);
            
            const timeDiff = nextContactDate.getTime() - today.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            if (daysDiff < 0) {
                deadlineIndicator = `<span class="deadline-indicator deadline-overdue" title="Просрочено"></span>`;
            } else if (daysDiff === 0) {
                deadlineIndicator = `<span class="deadline-indicator deadline-today" title="Сегодня"></span>`;
            } else if (daysDiff <= 3) {
                deadlineIndicator = `<span class="deadline-indicator deadline-upcoming" title="Скоро"></span>`;
            }
        }

        // Создаем контактную информацию
        let contactInfo = '';
        if (client.phone || client.email) {
            contactInfo = '<div class="contact-info small text-muted mt-1">';
            if (client.phone) {
                contactInfo += `<div><i class="bi bi-telephone"></i> ${escapeHTML(client.phone)}</div>`;
            }
            if (client.email) {
                contactInfo += `<div><i class="bi bi-envelope"></i> ${escapeHTML(client.email)}</div>`;
            }
            contactInfo += '</div>';
        }

        card.innerHTML = `
            <div class="card-body">
                <h5 class="card-title d-flex align-items-center">
                    ${deadlineIndicator}
                    ${escapeHTML(client.title)}
                </h5>
                ${client.details ? `<p class="card-text">${escapeHTML(client.details)}</p>` : ''}
                ${contactInfo}
                ${client.badge ? `<span class="badge bg-${badgeColor}">${escapeHTML(client.badge)}</span>` : ''}
                ${client.next_contact_date ? `<div class="small text-muted mt-1"><i class="bi bi-calendar"></i> ${formatDateOnly(client.next_contact_date)}</div>` : ''}
                <small class="text-muted d-block mt-2">ID: ${client.id}</small>
            </div>
        `;
        
        // Добавляем обработчик клика для открытия деталей
        card.addEventListener('click', (event) => {
            // Проверяем, что это не начало перетаскивания
            if (!event.target.closest('.card-body')) return;
            
            // Открываем модальное окно с деталями
            openClientDetails(client.id);
        });
        
        addDragAndDropHandlers(card);
        return card;
    }

    // Функция для рендеринга клиентов по колонкам
    function renderClients(clients) {
        // Сначала очистим все карточки и вернем плейсхолдеры
        Object.values(columnElements).forEach(colBody => {
            colBody.innerHTML = `<div class="text-center p-3 text-muted placeholder-card">Нет клиентов</div>`;
        });

        if (!clients || clients.length === 0) {
            console.log("Нет клиентов для отображения.");
            return; // Плейсхолдеры уже на месте
        }

        clients.forEach(client => {
            // Находим нужную колонку по status_id клиента
            const columnElement = columnElements[client.status_id];
            if (columnElement) {
                // Если в колонке только плейсхолдер, удаляем его перед добавлением первой карточки
                const placeholder = columnElement.querySelector('.placeholder-card');
                if(placeholder) placeholder.remove();

                const cardElement = createClientCardElement(client);
                columnElement.appendChild(cardElement);
            } else {
                console.warn(`Колонка для status_id "${client.status_id}" не найдена.`);
                // Возможно, стоит добавить карточку в колонку по умолчанию?
            }
        });
    }

    // --- Drag and Drop Handlers ---

    function addDragAndDropHandlers(draggable) {
        draggable.addEventListener('dragstart', (event) => {
            // Используем closest, чтобы убедиться, что начали тащить именно карточку
            draggedItem = event.target.closest('.kanban-card');
            if (!draggedItem) return;

            setTimeout(() => {
                draggedItem.classList.add('dragging');
            }, 0);
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', draggedItem.dataset.id);
            console.log(`Start dragging card ID: ${draggedItem.dataset.id}`);
        });

        draggable.addEventListener('dragend', () => {
            if (!draggedItem) return;
            draggedItem.classList.remove('dragging');
            console.log(`End dragging card ID: ${draggedItem.dataset.id}`);
            draggedItem = null;
        });
    }

    function addDropZoneHandlers(zone) {
        zone.addEventListener('dragover', (event) => {
            event.preventDefault();
            zone.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });

        zone.addEventListener('drop', async (event) => {
            event.preventDefault();
            zone.classList.remove('drag-over');

            if (!draggedItem) {
                console.log("Drop event without draggedItem");
                return;
            }

            const targetZone = event.target.closest('.kanban-cards'); // Убедимся, что цель - зона карточек
            if (!targetZone) {
                console.log("Drop target is not a valid zone");
                return;
            }

            const clientId = draggedItem.dataset.id;
            const newStatusId = parseInt(targetZone.dataset.statusId, 10); // ID статуса из data-атрибута зоны
            const originalStatusId = parseInt(draggedItem.dataset.statusId, 10);
            const originalParent = columnElements[originalStatusId];

            console.log(`Attempting to drop card ID: ${clientId} into zone status ID: ${newStatusId}`);


            // Не делаем ничего, если бросили в ту же колонку
            if (newStatusId === originalStatusId) {
                console.log("Dropped in the same column.");
                return;
            }

            // Оптимистичное перемещение DOM-элемента
            // Удаляем плейсхолдер, если он есть в целевой колонке
            const placeholder = targetZone.querySelector('.placeholder-card');
            if (placeholder) placeholder.remove();
            targetZone.appendChild(draggedItem);
            draggedItem.dataset.statusId = newStatusId; // Обновляем статус в data-атрибуте

            // Добавляем плейсхолдер обратно в исходную колонку, если она стала пустой
            if (originalParent && originalParent.children.length === 0) {
                originalParent.innerHTML = `<div class="text-center p-3 text-muted placeholder-card">Нет клиентов</div>`;
            }

            // Отправка изменений на бэкенд
            const success = await updateClientStatus(clientId, newStatusId);

            if (!success) {
                // Откат изменений на фронтенде при ошибке сервера
                console.warn(`Server error. Reverting move for card ID: ${clientId}`);
                if (originalParent) {
                    const originalPlaceholder = originalParent.querySelector('.placeholder-card');
                    if (originalPlaceholder) originalPlaceholder.remove();
                    originalParent.appendChild(draggedItem); // Возвращаем карточку
                    draggedItem.dataset.statusId = originalStatusId; // Возвращаем старый статус в data

                    // Если целевая колонка стала пустой после отката, возвращаем плейсхолдер
                    if (targetZone.children.length === 0) {
                        targetZone.innerHTML = `<div class="text-center p-3 text-muted placeholder-card">Нет клиентов</div>`;
                    }
                }
                alert('Не удалось обновить статус на сервере. Изменения отменены.');
            } else {
                console.log(`Successfully updated status for card ID: ${clientId} to ${newStatusId}`);
            }
        });
    }

    // --- API Interaction ---

    async function updateClientStatus(clientId, newStatusId) {
        try {
            const response = await fetch(`${API_BASE_URL}/clients/${clientId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status_id: newStatusId }) // Отправляем ID статуса
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }
            await response.json(); // Получаем обновленного клиента (можно использовать)
            showNotification('Статус обновлен', 'Клиент успешно перемещен');
            return true;
        } catch (error) {
            console.error('Ошибка при обновлении статуса клиента:', error);
            showNotification('Ошибка', 'Не удалось обновить статус клиента', 5000);
            return false;
        }
    }

    // --- Функции для управления статусами ---

    // Загрузка статусов
    async function loadStatuses() {
        try {
            const response = await fetch(`${API_BASE_URL}/statuses`);
            if (!response.ok) throw new Error('Не удалось загрузить статусы');
            
            const statuses = await response.json();
            currentStatuses = statuses; // Сохраняем статусы глобально
            
            return statuses;
        } catch (error) {
            console.error('Ошибка при загрузке статусов:', error);
            showNotification('Ошибка', 'Не удалось загрузить статусы', 5000);
            return [];
        }
    }

    // Создание нового статуса
    async function createStatus(name) {
        try {
            const response = await fetch(`${API_BASE_URL}/statuses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }
            
            const newStatus = await response.json();
            showNotification('Успех', `Статус "${name}" успешно создан`);
            
            return newStatus;
        } catch (error) {
            console.error('Ошибка при создании статуса:', error);
            showNotification('Ошибка', 'Не удалось создать статус', 5000);
            return null;
        }
    }

    // Обновление статуса
    async function updateStatus(id, name) {
        try {
            const response = await fetch(`${API_BASE_URL}/statuses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }
            
            const updatedStatus = await response.json();
            showNotification('Успех', `Статус успешно обновлен на "${name}"`);
            
            return updatedStatus;
        } catch (error) {
            console.error('Ошибка при обновлении статуса:', error);
            showNotification('Ошибка', 'Не удалось обновить статус', 5000);
            return null;
        }
    }

    // Удаление статуса
    async function deleteStatus(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/statuses/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }
            
            const result = await response.json();
            showNotification('Успех', 'Статус успешно удален');
            
            return result;
        } catch (error) {
            console.error('Ошибка при удалении статуса:', error);
            showNotification('Ошибка', 'Не удалось удалить статус', 5000);
            return null;
        }
    }

    // Изменение порядка статусов
    async function reorderStatuses(orderedIds) {
        try {
            const response = await fetch(`${API_BASE_URL}/statuses/reorder`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderedIds })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }
            
            const updatedStatuses = await response.json();
            showNotification('Успех', 'Порядок статусов обновлен');
            
            return updatedStatuses;
        } catch (error) {
            console.error('Ошибка при изменении порядка статусов:', error);
            showNotification('Ошибка', 'Не удалось изменить порядок статусов', 5000);
            return null;
        }
    }

    // Отрисовка списка статусов для управления
    function renderStatusesList(statuses) {
        const statusesList = document.getElementById('statusesList');
        statusesList.innerHTML = '';
        
        statuses.forEach(status => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.dataset.id = status.id;
            
            li.innerHTML = `
                <span class="status-name">${escapeHTML(status.name)}</span>
                <button class="btn btn-sm btn-outline-primary edit-status-btn">
                    <i class="bi bi-pencil"></i>
                </button>
            `;
            
            // Добавляем обработчик для редактирования
            li.querySelector('.edit-status-btn').addEventListener('click', () => {
                openEditStatusModal(status);
            });
            
            statusesList.appendChild(li);
        });
        
        // Инициализация Sortable для перетаскивания статусов
        if (statusSortable) {
            statusSortable.destroy();
        }
        
        statusSortable = new Sortable(statusesList, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: function() {
                // Сохраняем порядок только после перетаскивания, не автоматически
            }
        });
    }

    // Открытие модального окна редактирования статуса
    function openEditStatusModal(status) {
        document.getElementById('editStatusId').value = status.id;
        document.getElementById('editStatusName').value = status.name;
        
        editStatusModal.show();
    }

    // --- Функции для работы с клиентами ---

    // Создание нового клиента
    async function createClient(clientData) {
        try {
            const response = await fetch(`${API_BASE_URL}/clients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }
            
            const newClient = await response.json();
            showNotification('Успех', `Клиент "${clientData.title}" успешно создан`);
            
            return newClient;
        } catch (error) {
            console.error('Ошибка при создании клиента:', error);
            showNotification('Ошибка', 'Не удалось создать клиента', 5000);
            return null;
        }
    }

    // Обновление клиента
    async function updateClient(id, clientData) {
        try {
            const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }
            
            const updatedClient = await response.json();
            showNotification('Успех', `Клиент "${clientData.title}" успешно обновлен`);
            
            return updatedClient;
        } catch (error) {
            console.error('Ошибка при обновлении клиента:', error);
            showNotification('Ошибка', 'Не удалось обновить клиента', 5000);
            return null;
        }
    }

    // Удаление клиента
    async function deleteClient(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }
            
            const result = await response.json();
            showNotification('Успех', 'Клиент успешно удален');
            
            return result;
        } catch (error) {
            console.error('Ошибка при удалении клиента:', error);
            showNotification('Ошибка', 'Не удалось удалить клиента', 5000);
            return null;
        }
    }

    // Получение клиента по ID
    async function getClientById(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/clients/${id}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    return null; // Клиент не найден
                }
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Ошибка при получении клиента с ID ${id}:`, error);
            showNotification('Ошибка', 'Не удалось получить данные клиента', 5000);
            return null;
        }
    }

    // Поиск клиентов
    async function searchClients(term) {
        try {
            const response = await fetch(`${API_BASE_URL}/clients/search?term=${encodeURIComponent(term)}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Ошибка при поиске клиентов:', error);
            showNotification('Ошибка', 'Не удалось выполнить поиск', 5000);
            return [];
        }
    }

    // Отображение результатов поиска
    function displaySearchResults(clients) {
        const searchResults = document.getElementById('searchResults');
        const searchResultsBody = document.getElementById('searchResultsBody');
        
        if (!clients || clients.length === 0) {
            searchResultsBody.innerHTML = '<div class="text-center text-muted py-3">Ничего не найдено</div>';
            searchResults.classList.remove('d-none');
            return;
        }
        
        searchResultsBody.innerHTML = '';
        
        clients.forEach(client => {
            const resultCard = document.createElement('div');
            resultCard.className = 'search-result-card';
            resultCard.dataset.id = client.id;
            resultCard.dataset.statusId = client.status_id;
            
            // Строим краткое представление клиента
            resultCard.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <h5 class="mb-1">${escapeHTML(client.title)}</h5>
                    <span class="badge bg-${client.badge_color || 'secondary'}">${client.status_name || 'Нет статуса'}</span>
                </div>
                ${client.details ? `<p class="mb-1 text-truncate">${escapeHTML(client.details)}</p>` : ''}
                <div class="d-flex justify-content-between align-items-end">
                    <div>
                        ${client.phone ? `<small class="text-muted"><i class="bi bi-telephone"></i> ${escapeHTML(client.phone)}</small><br>` : ''}
                        ${client.email ? `<small class="text-muted"><i class="bi bi-envelope"></i> ${escapeHTML(client.email)}</small>` : ''}
                    </div>
                    <small class="text-muted">ID: ${client.id}</small>
                </div>
            `;
            
            // Добавляем обработчик клика для открытия деталей
            resultCard.addEventListener('click', () => {
                openClientDetails(client.id);
            });
            
            searchResultsBody.appendChild(resultCard);
        });
        
        searchResults.classList.remove('d-none');
    }

    // Открытие модального окна с деталями клиента
    async function openClientDetails(clientId) {
        currentViewingClientId = clientId;
        
        try {
            // Т.к. у нас нет отдельного эндпоинта для получения одного клиента, 
            // находим его в текущих клиентах или через поиск
            let clients = await fetch(`${API_BASE_URL}/clients`).then(r => r.json());
            const client = clients.find(c => c.id === parseInt(clientId, 10));
            
            if (!client) {
                showNotification('Ошибка', 'Клиент не найден', 5000);
                return;
            }
            
            // Заполняем информацию о клиенте
            const clientInfoContent = document.getElementById('clientInfoContent');
            clientInfoContent.innerHTML = `
                <div class="client-info">
                    <h3>${escapeHTML(client.title)}</h3>
                    <dl>
                        <dt>Статус:</dt>
                        <dd><span class="badge bg-primary">${client.status_name || 'Не указан'}</span></dd>
                        
                        <dt>Детали:</dt>
                        <dd>${client.details ? escapeHTML(client.details) : 'Не указаны'}</dd>
                        
                        <dt>Телефон:</dt>
                        <dd>${client.phone ? escapeHTML(client.phone) : 'Не указан'}</dd>
                        
                        <dt>Email:</dt>
                        <dd>${client.email ? escapeHTML(client.email) : 'Не указан'}</dd>
                        
                        <dt>Тег:</dt>
                        <dd>${client.badge ? `<span class="badge bg-${client.badge_color || 'secondary'}">${escapeHTML(client.badge)}</span>` : 'Не указан'}</dd>
                        
                        <dt>След. контакт:</dt>
                        <dd>${client.next_contact_date ? formatDateOnly(client.next_contact_date) : 'Не указан'}</dd>
                        
                        <dt>Создан:</dt>
                        <dd>${formatDate(client.created_at)}</dd>
                        
                        <dt>Обновлен:</dt>
                        <dd>${formatDate(client.updated_at)}</dd>
                    </dl>
                </div>
            `;
            
            // Настраиваем кнопку редактирования
            document.getElementById('editClientButton').onclick = () => {
                clientDetailsModal.hide();
                openEditClientModal(client);
            };
            
            // Загружаем заметки и историю при первом открытии таба
            const noteTab = document.getElementById('notes-tab');
            const historyTab = document.getElementById('history-tab');
            
            noteTab.addEventListener('shown.bs.tab', function (e) {
                loadClientNotes(clientId);
            });
            
            historyTab.addEventListener('shown.bs.tab', function (e) {
                loadClientHistory(clientId);
            });
            
            // Показываем модальное окно
            clientDetailsModal.show();
            
        } catch (error) {
            console.error('Ошибка при открытии деталей клиента:', error);
            showNotification('Ошибка', 'Не удалось загрузить детали клиента', 5000);
        }
    }

    // Открытие модального окна редактирования клиента
    function openEditClientModal(client) {
        document.getElementById('editClientId').value = client.id;
        document.getElementById('editClientTitle').value = client.title;
        document.getElementById('editClientDetails').value = client.details || '';
        document.getElementById('editClientPhone').value = client.phone || '';
        document.getElementById('editClientEmail').value = client.email || '';
        document.getElementById('editClientBadge').value = client.badge || '';
        document.getElementById('editClientNextContact').value = client.next_contact_date ? client.next_contact_date.split('T')[0] : '';
        
        editClientModal.show();
    }

    // --- Функции для работы с заметками ---

    // Загрузка заметок клиента
    async function loadClientNotes(clientId) {
        try {
            const response = await fetch(`${API_BASE_URL}/clients/${clientId}/notes`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }
            
            const notes = await response.json();
            displayClientNotes(notes);
            
            return notes;
        } catch (error) {
            console.error('Ошибка при загрузке заметок клиента:', error);
            showNotification('Ошибка', 'Не удалось загрузить заметки', 5000);
            return [];
        }
    }

    // Отображение заметок клиента
    function displayClientNotes(notes) {
        const notesContainer = document.getElementById('notesContainer');
        
        if (!notes || notes.length === 0) {
            notesContainer.innerHTML = '<div class="text-center text-muted py-3">Нет заметок</div>';
            return;
        }
        
        notesContainer.innerHTML = '';
        
        notes.forEach(note => {
            const noteCard = document.createElement('div');
            noteCard.className = 'card note-card';
            noteCard.dataset.id = note.id;
            
            noteCard.innerHTML = `
                <div class="card-body">
                    <button type="button" class="btn btn-sm btn-outline-danger delete-note" title="Удалить заметку">
                        <i class="bi bi-trash"></i>
                    </button>
                    <p class="card-text">${escapeHTML(note.note_text)}</p>
                    <small class="text-muted note-time">${formatDate(note.created_at)}</small>
                </div>
            `;
            
            // Добавляем обработчик для удаления заметки
            noteCard.querySelector('.delete-note').addEventListener('click', () => {
                confirmDelete(note.id, 'note', 'Вы уверены, что хотите удалить эту заметку?', async (id) => {
                    const success = await deleteNote(id);
                    if (success) {
                        loadClientNotes(currentViewingClientId);
                    }
                });
            });
            
            notesContainer.appendChild(noteCard);
        });
    }

    // Создание новой заметки
    async function createNote(clientId, noteText) {
        try {
            const response = await fetch(`${API_BASE_URL}/clients/${clientId}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note_text: noteText })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }
            
            const newNote = await response.json();
            showNotification('Успех', 'Заметка успешно добавлена');
            
            return newNote;
        } catch (error) {
            console.error('Ошибка при создании заметки:', error);
            showNotification('Ошибка', 'Не удалось создать заметку', 5000);
            return null;
        }
    }

    // Удаление заметки
    async function deleteNote(noteId) {
        try {
            const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }
            
            const result = await response.json();
            showNotification('Успех', 'Заметка успешно удалена');
            
            return true;
        } catch (error) {
            console.error('Ошибка при удалении заметки:', error);
            showNotification('Ошибка', 'Не удалось удалить заметку', 5000);
            return false;
        }
    }

    // --- Функции для работы с историей ---

    // Загрузка истории клиента
    async function loadClientHistory(clientId) {
        try {
            const response = await fetch(`${API_BASE_URL}/clients/${clientId}/history`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }
            
            const history = await response.json();
            displayClientHistory(history);
            
            return history;
        } catch (error) {
            console.error('Ошибка при загрузке истории клиента:', error);
            showNotification('Ошибка', 'Не удалось загрузить историю', 5000);
            return [];
        }
    }

    // Отображение истории клиента
    function displayClientHistory(historyItems) {
        const historyContainer = document.getElementById('historyContainer');
        
        if (!historyItems || historyItems.length === 0) {
            historyContainer.innerHTML = '<div class="text-center text-muted py-3">Нет истории</div>';
            return;
        }
        
        historyContainer.innerHTML = '';
        
        historyItems.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = `history-item ${item.action_type.replace('_', '-')}`;
            
            historyItem.innerHTML = `
                <p>${escapeHTML(item.description)}</p>
                <small>${formatDate(item.created_at)}</small>
            `;
            
            historyContainer.appendChild(historyItem);
        });
    }

    // --- Инициализация доски ---
    async function initializeBoard() {
        try {
            // 1. Загружаем статусы (колонки)
            const statuses = await loadStatuses();

            // Очищаем контейнер доски
            kanbanBoard.innerHTML = '';
            columnElements = {}; // Сбрасываем ссылки на колонки

            if (statuses.length === 0) {
                kanbanBoard.innerHTML = '<div class="col-12 alert alert-warning">Не найдены статусы для отображения. Добавьте их в базе данных.</div>';
                return;
            }

            // 2. Создаем колонки динамически
            statuses.forEach(status => {
                const { columnDiv, cardBody } = createColumnElement(status);
                kanbanBoard.appendChild(columnDiv);
                columnElements[status.id] = cardBody; // Сохраняем ссылку на тело колонки по ID статуса
            });

            // 3. Загружаем клиентов
            const clientsResponse = await fetch(`${API_BASE_URL}/clients`);
            if (!clientsResponse.ok) throw new Error('Не удалось загрузить клиентов');
            const clients = await clientsResponse.json();

            // 4. Отрисовываем клиентов по колонкам
            renderClients(clients);

        } catch (error) {
            console.error('Ошибка при инициализации доски:', error);
            kanbanBoard.innerHTML = `
                <div class="col-12 alert alert-danger">
                    <p>Произошла ошибка при инициализации доски:</p>
                    <p>${error.message}</p>
                    <button class="btn btn-outline-danger" onClick="location.reload()">Перезагрузить страницу</button>
                </div>
            `;
        }
    }

    // --- Event Listeners ---

    // Обработчик отправки формы добавления клиента
    addClientForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const clientData = {
            title: document.getElementById('clientTitle').value.trim(),
            details: document.getElementById('clientDetails').value.trim(),
            badge: document.getElementById('clientBadge').value.trim(),
            badgeColor: 'secondary', // По умолчанию
            phone: document.getElementById('clientPhone').value.trim(),
            email: document.getElementById('clientEmail').value.trim(),
            nextContactDate: document.getElementById('clientNextContact').value || null
        };
        
        // Если добавили бейдж, определяем его цвет по ключевым словам
        if (clientData.badge) {
            const badge = clientData.badge.toLowerCase();
            if (badge.includes('важн') || badge.includes('срочн')) {
                clientData.badgeColor = 'danger';
            } else if (badge.includes('нов')) {
                clientData.badgeColor = 'primary';
            } else if (badge.includes('ожид')) {
                clientData.badgeColor = 'warning';
            } else if (badge.includes('заверш') || badge.includes('готов')) {
                clientData.badgeColor = 'success';
            }
        }
        
        const newClient = await createClient(clientData);
        
        if (newClient) {
            // Очищаем форму
            addClientForm.reset();
            addClientModal.hide();
            
            // Обновляем доску
            initializeBoard();
        }
    });

    // Обработчик отправки формы редактирования клиента
    editClientForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const clientId = document.getElementById('editClientId').value;
        const clientData = {
            title: document.getElementById('editClientTitle').value.trim(),
            details: document.getElementById('editClientDetails').value.trim(),
            badge: document.getElementById('editClientBadge').value.trim(),
            badgeColor: 'secondary', // По умолчанию
            phone: document.getElementById('editClientPhone').value.trim(),
            email: document.getElementById('editClientEmail').value.trim(),
            nextContactDate: document.getElementById('editClientNextContact').value || null
        };
        
        // Если добавили бейдж, определяем его цвет по ключевым словам
        if (clientData.badge) {
            const badge = clientData.badge.toLowerCase();
            if (badge.includes('важн') || badge.includes('срочн')) {
                clientData.badgeColor = 'danger';
            } else if (badge.includes('нов')) {
                clientData.badgeColor = 'primary';
            } else if (badge.includes('ожид')) {
                clientData.badgeColor = 'warning';
            } else if (badge.includes('заверш') || badge.includes('готов')) {
                clientData.badgeColor = 'success';
            }
        }
        
        const updatedClient = await updateClient(clientId, clientData);
        
        if (updatedClient) {
            editClientModal.hide();
            
            // Обновляем доску
            initializeBoard();
        }
    });

    // Обработчик кнопки удаления клиента
    document.getElementById('deleteClientButton').addEventListener('click', () => {
        const clientId = document.getElementById('editClientId').value;
        
        confirmDelete(clientId, 'client', 'Вы уверены, что хотите удалить этого клиента?', async (id) => {
            const success = await deleteClient(id);
            
            if (success) {
                editClientModal.hide();
                initializeBoard();
            }
        });
    });

    // Поиск клиентов
    document.getElementById('searchButton').addEventListener('click', async () => {
        const searchTerm = document.getElementById('searchInput').value.trim();
        
        if (!searchTerm) {
            showNotification('Внимание', 'Введите поисковый запрос');
            return;
        }
        
        const results = await searchClients(searchTerm);
        displaySearchResults(results);
    });
    
    // Обработка Enter в поле поиска
    document.getElementById('searchInput').addEventListener('keypress', async (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            document.getElementById('searchButton').click();
        }
    });
    
    // Очистка результатов поиска
    document.getElementById('clearSearchButton').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('searchResults').classList.add('d-none');
    });

    // --- Управление статусами ---

    // Добавление нового статуса
    document.getElementById('addStatusButton').addEventListener('click', async () => {
        const statusName = document.getElementById('newStatusName').value.trim();
        
        if (!statusName) {
            showNotification('Внимание', 'Введите название статуса');
            return;
        }
        
        const newStatus = await createStatus(statusName);
        
        if (newStatus) {
            document.getElementById('newStatusName').value = '';
            
            // Обновляем список статусов
            const statuses = await loadStatuses();
            renderStatusesList(statuses);
            
            // Обновляем доску
            initializeBoard();
        }
    });

    // Обработка Enter в поле добавления статуса
    document.getElementById('newStatusName').addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            document.getElementById('addStatusButton').click();
        }
    });

    // Сохранение порядка статусов
    document.getElementById('saveStatusOrderButton').addEventListener('click', async () => {
        const statusItems = Array.from(document.querySelectorAll('#statusesList li'));
        const orderedIds = statusItems.map(item => parseInt(item.dataset.id, 10));
        
        const updatedStatuses = await reorderStatuses(orderedIds);
        
        if (updatedStatuses) {
            // Обновляем список статусов
            renderStatusesList(updatedStatuses);
            
            // Обновляем доску
            initializeBoard();
        }
    });

    // Обработчик отправки формы редактирования статуса
    document.getElementById('editStatusForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const statusId = document.getElementById('editStatusId').value;
        const statusName = document.getElementById('editStatusName').value.trim();
        
        if (!statusName) {
            showNotification('Внимание', 'Введите название статуса');
            return;
        }
        
        const updatedStatus = await updateStatus(statusId, statusName);
        
        if (updatedStatus) {
            editStatusModal.hide();
            
            // Обновляем список статусов
            const statuses = await loadStatuses();
            renderStatusesList(statuses);
            
            // Обновляем доску
            initializeBoard();
        }
    });

    // Обработчик кнопки удаления статуса
    document.getElementById('deleteStatusButton').addEventListener('click', () => {
        const statusId = document.getElementById('editStatusId').value;
        
        confirmDelete(statusId, 'status', 'Вы уверены, что хотите удалить этот статус? Все клиенты будут перемещены в другой статус.', async (id) => {
            const success = await deleteStatus(id);
            
            if (success) {
                editStatusModal.hide();
                
                // Обновляем список статусов
                const statuses = await loadStatuses();
                renderStatusesList(statuses);
                
                // Обновляем доску
                initializeBoard();
            }
        });
    });

    // Открытие модального окна управления статусами
    document.getElementById('manageStatusesModal').addEventListener('show.bs.modal', async () => {
        // Загружаем актуальные статусы
        const statuses = await loadStatuses();
        renderStatusesList(statuses);
    });

    // --- Заметки ---

    // Добавление новой заметки
    document.getElementById('addNoteButton').addEventListener('click', async () => {
        const noteText = document.getElementById('newNoteText').value.trim();
        
        if (!noteText) {
            showNotification('Внимание', 'Введите текст заметки');
            return;
        }
        
        if (!currentViewingClientId) {
            showNotification('Ошибка', 'Невозможно определить клиента для заметки');
            return;
        }
        
        const newNote = await createNote(currentViewingClientId, noteText);
        
        if (newNote) {
            document.getElementById('newNoteText').value = '';
            loadClientNotes(currentViewingClientId);
        }
    });

    // --- Инициализация приложения ---
    initializeBoard();
});