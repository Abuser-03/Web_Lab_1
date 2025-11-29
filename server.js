// server.js
require('dotenv').config(); // Загружаем .env переменные в самом начале
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db'); // Импортируем наш модуль для работы с БД

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Инициализация базы данных перед запуском сервера
db.initDb().catch(err => {
    console.error('Ошибка при инициализации базы данных:', err);
    process.exit(1);
});

// --- API Routes ---

// --- Статусы ---

// GET /api/statuses - Получить все статусы (колонки)
app.get('/api/statuses', async (req, res) => {
    try {
        const result = await db.query('SELECT id, name, color, column_order FROM statuses ORDER BY column_order ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при получении статусов:', err);
        res.status(500).json({ message: 'Ошибка сервера при получении статусов' });
    }
});

// POST /api/statuses - Создать новый статус
app.post('/api/statuses', async (req, res) => {
    const { name, color } = req.body;
    
    if (!name) {
        return res.status(400).json({ message: 'Имя статуса обязательно' });
    }
    
    try {
        // Получаем текущий максимальный порядок
        const maxOrderResult = await db.query('SELECT MAX(column_order) as max FROM statuses');
        const maxOrder = maxOrderResult.rows[0].max || -1;
        const newOrder = maxOrder + 1;
        
        // Добавляем новый статус
        const result = await db.query(
            'INSERT INTO statuses (name, color, column_order) VALUES (?, ?, ?)',
            [name, color || '#808080', newOrder]
        );
        
        // Получаем созданный статус
        const newStatus = await db.query('SELECT * FROM statuses WHERE id = ?', [result.rows[0].id]);
        res.status(201).json(newStatus.rows[0]);
    } catch (err) {
        console.error('Ошибка при создании статуса:', err);
        res.status(500).json({ message: 'Ошибка сервера при создании статуса' });
    }
});

// PUT /api/statuses/:id - Обновить статус
app.put('/api/statuses/:id', async (req, res) => {
    const statusId = parseInt(req.params.id, 10);
    const { name, color } = req.body;
    
    if (isNaN(statusId) || !name) {
        return res.status(400).json({ message: 'ID статуса и имя обязательны' });
    }
    
    try {
        await db.query(
            'UPDATE statuses SET name = ?, color = ? WHERE id = ?',
            [name, color || '#808080', statusId]
        );
        
        // Проверяем, был ли обновлен статус
        const result = await db.query('SELECT * FROM statuses WHERE id = ?', [statusId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Статус не найден' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при обновлении статуса:', err);
        res.status(500).json({ message: 'Ошибка сервера при обновлении статуса' });
    }
});

// DELETE /api/statuses/:id - Удалить статус
app.delete('/api/statuses/:id', async (req, res) => {
    const statusId = parseInt(req.params.id, 10);
    
    if (isNaN(statusId)) {
        return res.status(400).json({ message: 'ID статуса обязателен' });
    }
    
    try {
        // Находим статус с наименьшим порядком для перемещения клиентов
        const defaultStatusResult = await db.query(
            'SELECT id FROM statuses WHERE id != ? ORDER BY column_order ASC LIMIT 1',
            [statusId]
        );
        
        // Начинаем транзакцию (SQLite не поддерживает реальные транзакции, но попробуем имитировать)
        // Сохраняем удаляемый статус для ответа
        const deleteStatusResult = await db.query('SELECT * FROM statuses WHERE id = ?', [statusId]);
        
        if (deleteStatusResult.rows.length === 0) {
            return res.status(404).json({ message: 'Статус не найден' });
        }
        
        const deletedStatus = deleteStatusResult.rows[0];
        
        // Если есть другой статус, перемещаем клиентов
        if (defaultStatusResult.rows.length > 0) {
            const defaultStatusId = defaultStatusResult.rows[0].id;
            await db.query(
                'UPDATE clients SET status_id = ? WHERE status_id = ?',
                [defaultStatusId, statusId]
            );
        }
        
        // Удаляем статус
        await db.query('DELETE FROM statuses WHERE id = ?', [statusId]);
        
        // Перенумеровываем оставшиеся статусы
        const remainingStatuses = await db.query('SELECT id FROM statuses ORDER BY column_order');
        
        for (let i = 0; i < remainingStatuses.rows.length; i++) {
            await db.query(
                'UPDATE statuses SET column_order = ? WHERE id = ?',
                [i, remainingStatuses.rows[i].id]
            );
        }
        
        res.json({ message: 'Статус успешно удален', deletedStatus });
    } catch (err) {
        console.error('Ошибка при удалении статуса:', err);
        res.status(500).json({ message: 'Ошибка сервера при удалении статуса' });
    }
});

// PUT /api/statuses/reorder - Изменить порядок статусов
app.put('/api/statuses/reorder', async (req, res) => {
    const { orderedIds } = req.body;
    
    if (!Array.isArray(orderedIds)) {
        return res.status(400).json({ message: 'orderedIds должен быть массивом ID статусов' });
    }
    
    try {
        // Обновляем column_order для каждого статуса
        for (let i = 0; i < orderedIds.length; i++) {
            await db.query(
                'UPDATE statuses SET column_order = ? WHERE id = ?',
                [i, orderedIds[i]]
            );
        }
        
        const updatedStatuses = await db.query(
            'SELECT id, name, column_order FROM statuses ORDER BY column_order ASC'
        );
        
        res.json(updatedStatuses.rows);
    } catch (err) {
        console.error('Ошибка при изменении порядка статусов:', err);
        res.status(500).json({ message: 'Ошибка сервера при изменении порядка статусов' });
    }
});

// --- Клиенты ---

// GET /api/clients - Получить всех клиентов (с информацией о статусе)
app.get('/api/clients', async (req, res) => {
    try {
        // Джойним с таблицей статусов, чтобы сразу получить имя статуса
        const query = `
            SELECT
                c.id, c.title, c.details, c.badge, c.badge_color, c.status_id,
                c.phone, c.email, c.next_contact_date,
                s.name as status_name,
                c.created_at, c.updated_at
            FROM clients c
            LEFT JOIN statuses s ON c.status_id = s.id
            ORDER BY c.created_at DESC
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при получении клиентов:', err);
        res.status(500).json({ message: 'Ошибка сервера при получении клиентов' });
    }
});

// GET /api/clients/search - Поиск клиентов
app.get('/api/clients/search', async (req, res) => {
    const { term } = req.query;
    
    if (!term) {
        return res.status(400).json({ message: 'Поисковый запрос обязателен' });
    }
    
    try {
        const query = `
            SELECT
                c.id, c.title, c.details, c.badge, c.badge_color, c.status_id,
                c.phone, c.email, c.next_contact_date,
                s.name as status_name,
                c.created_at, c.updated_at
            FROM clients c
            LEFT JOIN statuses s ON c.status_id = s.id
            WHERE 
                c.title LIKE ? OR 
                c.details LIKE ? OR 
                c.badge LIKE ? OR
                c.phone LIKE ? OR
                c.email LIKE ?
            ORDER BY c.created_at DESC
        `;
        const searchTerm = `%${term}%`;
        const result = await db.query(query, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при поиске клиентов:', err);
        res.status(500).json({ message: 'Ошибка сервера при поиске клиентов' });
    }
});

// POST /api/clients - Создать нового клиента
app.post('/api/clients', async (req, res) => {
    const { title, details, badge, badgeColor, phone, email, nextContactDate } = req.body;

    if (!title) { // Детали теперь могут быть пустыми
        return res.status(400).json({ message: 'Title is required' });
    }

    try {
        // 1. Найти ID статуса по умолчанию (с наименьшим column_order)
        const defaultStatusResult = await db.query(
            'SELECT id FROM statuses ORDER BY column_order ASC LIMIT 1'
        );
        if (defaultStatusResult.rows.length === 0) {
            return res.status(500).json({ message: 'Не найден статус по умолчанию для нового клиента' });
        }
        const defaultStatusId = defaultStatusResult.rows[0].id;

        // 2. Вставить нового клиента
        const insertQuery = `
            INSERT INTO clients (
                title, details, badge, badge_color, status_id, phone, email, next_contact_date
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            title, 
            details || null, 
            badge || null, 
            badgeColor || 'secondary', 
            defaultStatusId,
            phone || null,
            email || null,
            nextContactDate || null
        ];
        
        const result = await db.query(insertQuery, values);
        const clientId = result.rows[0].id;

        // 3. Получаем созданного клиента с информацией о статусе
        const newClientQuery = `
            SELECT
                c.id, c.title, c.details, c.badge, c.badge_color, c.status_id,
                c.phone, c.email, c.next_contact_date,
                s.name as status_name,
                c.created_at, c.updated_at
            FROM clients c
            LEFT JOIN statuses s ON c.status_id = s.id
            WHERE c.id = ?
        `;
        const newClientResult = await db.query(newClientQuery, [clientId]);
        const newClient = newClientResult.rows[0];

        // 4. Добавляем запись в историю
        await db.query(
            'INSERT INTO client_history (client_id, action_type, description) VALUES (?, ?, ?)',
            [clientId, 'create', 'Клиент создан']
        );

        console.log('Создан клиент:', newClient);
        res.status(201).json(newClient);

    } catch (err) {
        console.error('Ошибка при создании клиента:', err);
        res.status(500).json({ message: 'Ошибка сервера при создании клиента' });
    }
});

// PUT /api/clients/:id - Обновить клиента
app.put('/api/clients/:id', async (req, res) => {
    const clientId = parseInt(req.params.id, 10);
    const { title, details, badge, badgeColor, phone, email, nextContactDate } = req.body;
    
    if (isNaN(clientId) || !title) {
        return res.status(400).json({ message: 'ID клиента и название обязательны' });
    }
    
    try {
        // Проверяем существование клиента
        const clientCheck = await db.query('SELECT * FROM clients WHERE id = ?', [clientId]);
        
        if (clientCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Клиент не найден' });
        }
        
        // Обновляем клиента
        const updateQuery = `
            UPDATE clients
            SET 
                title = ?,
                details = ?,
                badge = ?,
                badge_color = ?,
                phone = ?,
                email = ?,
                next_contact_date = ?
            WHERE id = ?
        `;
        const values = [
            title,
            details || null,
            badge || null,
            badgeColor || 'secondary',
            phone || null,
            email || null,
            nextContactDate || null,
            clientId
        ];
        
        await db.query(updateQuery, values);
        
        // Получаем обновленного клиента
        const updatedClientQuery = `
            SELECT
                c.id, c.title, c.details, c.badge, c.badge_color, c.status_id,
                c.phone, c.email, c.next_contact_date,
                s.name as status_name,
                c.created_at, c.updated_at
            FROM clients c
            LEFT JOIN statuses s ON c.status_id = s.id
            WHERE c.id = ?
        `;
        const updatedClientResult = await db.query(updatedClientQuery, [clientId]);
        const updatedClient = updatedClientResult.rows[0];
        
        // Добавляем запись в историю
        await db.query(
            'INSERT INTO client_history (client_id, action_type, description) VALUES (?, ?, ?)',
            [clientId, 'edit', 'Данные клиента изменены']
        );
        
        res.json(updatedClient);
    } catch (err) {
        console.error(`Ошибка при обновлении клиента ${clientId}:`, err);
        res.status(500).json({ message: 'Ошибка сервера при обновлении клиента' });
    }
});

// DELETE /api/clients/:id - Удалить клиента
app.delete('/api/clients/:id', async (req, res) => {
    const clientId = parseInt(req.params.id, 10);
    
    if (isNaN(clientId)) {
        return res.status(400).json({ message: 'ID клиента обязателен' });
    }
    
    try {
        // Получаем информацию о клиенте перед удалением
        const clientResult = await db.query('SELECT * FROM clients WHERE id = ?', [clientId]);
        
        if (clientResult.rows.length === 0) {
            return res.status(404).json({ message: 'Клиент не найден' });
        }
        
        const deletedClient = clientResult.rows[0];
        
        // Удаляем клиента
        await db.query('DELETE FROM clients WHERE id = ?', [clientId]);
        
        res.json({ message: 'Клиент успешно удален', deletedClient });
    } catch (err) {
        console.error(`Ошибка при удалении клиента ${clientId}:`, err);
        res.status(500).json({ message: 'Ошибка сервера при удалении клиента' });
    }
});

// PATCH /api/clients/:id/status - Обновить статус клиента
app.patch('/api/clients/:id/status', async (req, res) => {
    const clientId = parseInt(req.params.id, 10);
    const { status_id } = req.body; // Теперь ожидаем ID статуса

    if (isNaN(clientId) || status_id === undefined || status_id === null) {
        return res.status(400).json({ message: 'Client ID and new status ID are required' });
    }

    try {
        // Проверим, существует ли такой статус
        const statusCheck = await db.query('SELECT id, name FROM statuses WHERE id = ?', [status_id]);
        if (statusCheck.rows.length === 0) {
            return res.status(400).json({ message: 'Указанный статус не существует' });
        }
        
        // Получаем старый статус для истории
        const oldStatusQuery = `
            SELECT s.name 
            FROM clients c 
            JOIN statuses s ON c.status_id = s.id 
            WHERE c.id = ?
        `;
        const oldStatusResult = await db.query(oldStatusQuery, [clientId]);
        const oldStatusName = oldStatusResult.rows.length > 0 ? oldStatusResult.rows[0].name : 'неизвестно';
        const newStatusName = statusCheck.rows[0].name;

        // Обновляем клиента
        await db.query(
            'UPDATE clients SET status_id = ? WHERE id = ?',
            [status_id, clientId]
        );

        // Проверяем, был ли обновлен клиент
        const clientCheck = await db.query('SELECT * FROM clients WHERE id = ?', [clientId]);
        
        if (clientCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Client not found' });
        }

        const updatedClient = clientCheck.rows[0];
        updatedClient.status_name = newStatusName;
        
        // Добавляем запись в историю
        await db.query(
            'INSERT INTO client_history (client_id, action_type, description) VALUES (?, ?, ?)',
            [clientId, 'status_change', `Статус изменен с "${oldStatusName}" на "${newStatusName}"`]
        );

        console.log(`Обновлен статус клиента ${clientId} на ${status_id}`);
        res.json(updatedClient);

    } catch (err) {
        console.error(`Ошибка при обновлении статуса клиента ${clientId}:`, err);
        res.status(500).json({ message: 'Ошибка сервера при обновлении статуса клиента' });
    }
});

// --- Заметки ---

// GET /api/clients/:id/notes - Получить заметки клиента
app.get('/api/clients/:id/notes', async (req, res) => {
    const clientId = parseInt(req.params.id, 10);
    
    if (isNaN(clientId)) {
        return res.status(400).json({ message: 'ID клиента обязателен' });
    }
    
    try {
        const query = `
            SELECT * FROM client_notes
            WHERE client_id = ?
            ORDER BY created_at DESC
        `;
        const result = await db.query(query, [clientId]);
        res.json(result.rows);
    } catch (err) {
        console.error(`Ошибка при получении заметок клиента ${clientId}:`, err);
        res.status(500).json({ message: 'Ошибка сервера при получении заметок клиента' });
    }
});

// POST /api/clients/:id/notes - Добавить заметку клиенту
app.post('/api/clients/:id/notes', async (req, res) => {
    const clientId = parseInt(req.params.id, 10);
    const { note_text } = req.body;
    
    if (isNaN(clientId) || !note_text) {
        return res.status(400).json({ message: 'ID клиента и текст заметки обязательны' });
    }
    
    try {
        // Проверяем существование клиента
        const clientCheck = await db.query('SELECT id FROM clients WHERE id = ?', [clientId]);
        if (clientCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Клиент не найден' });
        }
        
        // Добавляем заметку
        const insertResult = await db.query(
            'INSERT INTO client_notes (client_id, note_text) VALUES (?, ?)',
            [clientId, note_text]
        );
        
        const noteId = insertResult.rows[0].id;
        
        // Получаем созданную заметку
        const noteResult = await db.query('SELECT * FROM client_notes WHERE id = ?', [noteId]);
        
        // Добавляем запись в историю
        await db.query(
            'INSERT INTO client_history (client_id, action_type, description) VALUES (?, ?, ?)',
            [clientId, 'note_added', 'Добавлена новая заметка']
        );
        
        res.status(201).json(noteResult.rows[0]);
    } catch (err) {
        console.error(`Ошибка при добавлении заметки клиенту ${clientId}:`, err);
        res.status(500).json({ message: 'Ошибка сервера при добавлении заметки клиенту' });
    }
});

// DELETE /api/notes/:id - Удалить заметку
app.delete('/api/notes/:id', async (req, res) => {
    const noteId = parseInt(req.params.id, 10);
    
    if (isNaN(noteId)) {
        return res.status(400).json({ message: 'ID заметки обязателен' });
    }
    
    try {
        // Находим clientId для истории
        const noteResult = await db.query('SELECT * FROM client_notes WHERE id = ?', [noteId]);
        if (noteResult.rows.length === 0) {
            return res.status(404).json({ message: 'Заметка не найдена' });
        }
        
        const note = noteResult.rows[0];
        const clientId = note.client_id;
        
        // Удаляем заметку
        await db.query('DELETE FROM client_notes WHERE id = ?', [noteId]);
        
        // Добавляем запись в историю
        await db.query(
            'INSERT INTO client_history (client_id, action_type, description) VALUES (?, ?, ?)',
            [clientId, 'note_deleted', 'Заметка удалена']
        );
        
        res.json({ message: 'Заметка успешно удалена', deletedNote: note });
    } catch (err) {
        console.error(`Ошибка при удалении заметки ${noteId}:`, err);
        res.status(500).json({ message: 'Ошибка сервера при удалении заметки' });
    }
});

// --- История ---

// GET /api/clients/:id/history - Получить историю действий с клиентом
app.get('/api/clients/:id/history', async (req, res) => {
    const clientId = parseInt(req.params.id, 10);
    
    if (isNaN(clientId)) {
        return res.status(400).json({ message: 'ID клиента обязателен' });
    }
    
    try {
        const query = `
            SELECT * FROM client_history
            WHERE client_id = ?
            ORDER BY created_at DESC
        `;
        const result = await db.query(query, [clientId]);
        res.json(result.rows);
    } catch (err) {
        console.error(`Ошибка при получении истории клиента ${clientId}:`, err);
        res.status(500).json({ message: 'Ошибка сервера при получении истории клиента' });
    }
});

// --- Запуск сервера ---
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log(`Фронтенд доступен по адресу http://localhost:${PORT}/`);
});