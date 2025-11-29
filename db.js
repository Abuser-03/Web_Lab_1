// db.js - Версия для SQLite
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Путь к файлу БД
const DB_PATH = path.join(__dirname, 'database.sqlite');

// Путь к SQL-скрипту инициализации
const INIT_SQL_PATH = path.join(__dirname, 'database.sql');

// Соединение с базой данных
let db = null;

// Инициализация базы данных
async function initDb() {
  try {
    // Создание директории для БД, если её нет
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Открытие соединения с базой данных
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database,
    });

    // Включаем поддержку внешних ключей
    await db.run('PRAGMA foreign_keys = ON');

    /// Проверяем, существует ли уже файл базы данных (не пустой ли он)
    const tableCheck = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='statuses'");
    
    // Если таблиц нет, инициализируем базу данных
    if (!tableCheck) {
      console.log('Создаем новую базу данных...');
      
      // Читаем SQL-скрипт инициализации
      let initSql = fs.readFileSync(INIT_SQL_PATH, 'utf8');
      
      try {
        // Выполняем весь скрипт целиком
        await db.exec(initSql);
        console.log('База данных SQLite успешно инициализирована');
      } catch (sqlError) {
        console.error('Ошибка при выполнении SQL-скрипта:', sqlError);
        
        // Альтернативный подход: выполняем каждую команду отдельно
        console.log('Пробуем выполнить команды по отдельности...');
        
        // Разбиваем SQL на отдельные выражения
        const commands = initSql.split(';').map(cmd => cmd.trim()).filter(cmd => cmd);
        
        for (const cmd of commands) {
          try {
            if (cmd.includes('CREATE TRIGGER')) {
              // Для триггеров добавляем недостающий END
              await db.exec(cmd + ';');
            } else {
              await db.exec(cmd + ';');
            }
          } catch (cmdError) {
            console.error('Ошибка при выполнении команды:', cmd);
            console.error(cmdError);
            throw cmdError;
          }
        }
        
        console.log('База данных SQLite успешно инициализирована (по командам)');
      }
    } else {
      console.log('База данных уже существует, пропускаем инициализацию');
    }
    
    return true;
  } catch (error) {
    console.error('Ошибка при инициализации БД:', error);
    throw error;
  }
}

// Метод query для совместимости с server.js
async function query(sql, params = []) {
  try {
    let result;
    if (sql.trim().toLowerCase().startsWith('select')) {
      result = await db.all(sql, params);
      return { rows: result };
    } else if (sql.trim().toLowerCase().startsWith('insert')) {
      result = await db.run(sql, params);
      return { rows: [{ id: result.lastID }] };
    } else {
      result = await db.run(sql, params);
      return { rows: [], changes: result.changes };
    }
  } catch (error) {
    console.error('Ошибка при выполнении запроса:', error);
    throw error;
  }
}

// Получение всех статусов
async function getStatuses() {
  return await db.all('SELECT * FROM statuses ORDER BY column_order');
}

// Создание нового статуса
async function createStatus(name, columnOrder) {
  const result = await db.run(
    'INSERT INTO statuses (name, column_order) VALUES (?, ?)',
    [name, columnOrder]
  );
  if (result.lastID) {
    return { id: result.lastID, name, column_order: columnOrder };
  }
  throw new Error('Не удалось создать статус');
}

// Обновление статуса
async function updateStatus(id, name, columnOrder) {
  const result = await db.run(
    'UPDATE statuses SET name = ?, column_order = ? WHERE id = ?',
    [name, columnOrder, id]
  );
  if (result.changes > 0) {
    return { id, name, column_order: columnOrder };
  }
  throw new Error('Статус не найден');
}

// Удаление статуса
async function deleteStatus(id) {
  // Проверка, есть ли клиенты с данным статусом
  const clients = await db.all('SELECT id FROM clients WHERE status_id = ?', [id]);
  if (clients.length > 0) {
    throw new Error('Нельзя удалить статус, к которому привязаны клиенты');
  }
  
  const result = await db.run('DELETE FROM statuses WHERE id = ?', [id]);
  if (result.changes > 0) {
    return true;
  }
  throw new Error('Статус не найден');
}

// Получение всех клиентов
async function getClients() {
  return await db.all(`
    SELECT c.*, s.name as status_name 
    FROM clients c
    JOIN statuses s ON c.status_id = s.id
    ORDER BY c.updated_at DESC
  `);
}

// Получение клиентов по статусу
async function getClientsByStatus(statusId) {
  return await db.all(`
    SELECT c.*, s.name as status_name 
    FROM clients c
    JOIN statuses s ON c.status_id = s.id
    WHERE c.status_id = ?
    ORDER BY c.updated_at DESC
  `, [statusId]);
}

// Получение клиента по ID
async function getClientById(id) {
  const client = await db.get(`
    SELECT c.*, s.name as status_name 
    FROM clients c
    JOIN statuses s ON c.status_id = s.id
    WHERE c.id = ?
  `, [id]);
  
  if (!client) {
    throw new Error('Клиент не найден');
  }
  
  // Получаем заметки к клиенту
  const notes = await db.all(
    'SELECT * FROM client_notes WHERE client_id = ? ORDER BY created_at DESC',
    [id]
  );
  
  // Получаем историю клиента
  const history = await db.all(
    'SELECT * FROM client_history WHERE client_id = ? ORDER BY created_at DESC',
    [id]
  );
  
  return { ...client, notes, history };
}

// Создание нового клиента
async function createClient(clientData) {
  try {
    // Проверяем существование статуса
    const status = await db.get('SELECT id FROM statuses WHERE id = ?', [clientData.status_id]);
    if (!status) {
      throw new Error('Указанный статус не существует');
    }

    const result = await db.run(`
      INSERT INTO clients (
        title, details, badge, badge_color, status_id, 
        phone, email, next_contact_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      clientData.title,
      clientData.details || null,
      clientData.badge || null,
      clientData.badge_color || 'secondary',
      clientData.status_id,
      clientData.phone || null,
      clientData.email || null,
      clientData.next_contact_date || null
    ]);

    if (result.lastID) {
      // Добавляем запись в историю
      await db.run(`
        INSERT INTO client_history (client_id, action_type, description)
        VALUES (?, ?, ?)
      `, [result.lastID, 'create', 'Клиент создан']);

      // Возвращаем созданного клиента
      return await getClientById(result.lastID);
    } else {
      throw new Error('Не удалось создать клиента');
    }
  } catch (error) {
    console.error('Ошибка при создании клиента:', error);
    throw error;
  }
}

// Обновление клиента
async function updateClient(id, clientData) {
  try {
    // Проверяем существование клиента
    const client = await db.get('SELECT * FROM clients WHERE id = ?', [id]);
    if (!client) {
      throw new Error('Клиент не найден');
    }

    // Проверяем существование статуса, если он меняется
    if (clientData.status_id) {
      const status = await db.get('SELECT id FROM statuses WHERE id = ?', [clientData.status_id]);
      if (!status) {
        throw new Error('Указанный статус не существует');
      }
    }

    // Строим запрос динамически на основе переданных полей
    const fields = [];
    const values = [];
    
    if (clientData.title !== undefined) {
      fields.push('title = ?');
      values.push(clientData.title);
    }
    
    if (clientData.details !== undefined) {
      fields.push('details = ?');
      values.push(clientData.details);
    }
    
    if (clientData.badge !== undefined) {
      fields.push('badge = ?');
      values.push(clientData.badge);
    }
    
    if (clientData.badge_color !== undefined) {
      fields.push('badge_color = ?');
      values.push(clientData.badge_color);
    }
    
    if (clientData.status_id !== undefined) {
      fields.push('status_id = ?');
      values.push(clientData.status_id);
    }
    
    if (clientData.phone !== undefined) {
      fields.push('phone = ?');
      values.push(clientData.phone);
    }
    
    if (clientData.email !== undefined) {
      fields.push('email = ?');
      values.push(clientData.email);
    }
    
    if (clientData.next_contact_date !== undefined) {
      fields.push('next_contact_date = ?');
      values.push(clientData.next_contact_date);
    }
    
    if (fields.length === 0) {
      throw new Error('Не указаны поля для обновления');
    }

    // Добавляем id в массив значений
    values.push(id);

    // Выполняем запрос обновления
    const result = await db.run(
      `UPDATE clients SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    if (result.changes > 0) {
      // Проверяем, изменился ли статус
      if (clientData.status_id !== undefined && clientData.status_id !== client.status_id) {
        const oldStatus = await db.get('SELECT name FROM statuses WHERE id = ?', [client.status_id]);
        const newStatus = await db.get('SELECT name FROM statuses WHERE id = ?', [clientData.status_id]);
        
        // Добавляем запись в историю об изменении статуса
        await db.run(`
          INSERT INTO client_history (client_id, action_type, description)
          VALUES (?, ?, ?)
        `, [
          id, 
          'status_change', 
          `Статус изменён с "${oldStatus.name}" на "${newStatus.name}"`
        ]);
      }

      // Добавляем запись в историю об обновлении клиента
      await db.run(`
        INSERT INTO client_history (client_id, action_type, description)
        VALUES (?, ?, ?)
      `, [id, 'edit', 'Информация о клиенте обновлена']);

      // Возвращаем обновленного клиента
      return await getClientById(id);
    } else {
      throw new Error('Клиент не обновлен');
    }
  } catch (error) {
    console.error('Ошибка при обновлении клиента:', error);
    throw error;
  }
}

// Удаление клиента
async function deleteClient(id) {
  try {
    // Проверяем существование клиента
    const client = await db.get('SELECT id FROM clients WHERE id = ?', [id]);
    if (!client) {
      throw new Error('Клиент не найден');
    }

    // Удаляем записи из связанных таблиц
    await db.run('DELETE FROM client_notes WHERE client_id = ?', [id]);
    await db.run('DELETE FROM client_history WHERE client_id = ?', [id]);

    // Удаляем клиента
    const result = await db.run('DELETE FROM clients WHERE id = ?', [id]);
    if (result.changes > 0) {
      return true;
    } else {
      throw new Error('Не удалось удалить клиента');
    }
  } catch (error) {
    console.error('Ошибка при удалении клиента:', error);
    throw error;
  }
}

// Добавление заметки к клиенту
async function addClientNote(clientId, noteText) {
  try {
    // Проверяем существование клиента
    const client = await db.get('SELECT id FROM clients WHERE id = ?', [clientId]);
    if (!client) {
      throw new Error('Клиент не найден');
    }

    // Добавляем заметку
    const result = await db.run(`
      INSERT INTO client_notes (client_id, note_text)
      VALUES (?, ?)
    `, [clientId, noteText]);

    if (result.lastID) {
      // Добавляем запись в историю
      await db.run(`
        INSERT INTO client_history (client_id, action_type, description)
        VALUES (?, ?, ?)
      `, [clientId, 'note_added', 'Добавлена новая заметка']);

      // Возвращаем созданную заметку
      return await db.get('SELECT * FROM client_notes WHERE id = ?', [result.lastID]);
    } else {
      throw new Error('Не удалось создать заметку');
    }
  } catch (error) {
    console.error('Ошибка при добавлении заметки:', error);
    throw error;
  }
}

// Удаление заметки
async function deleteClientNote(noteId) {
  try {
    // Получаем информацию о заметке перед удалением
    const note = await db.get('SELECT id, client_id FROM client_notes WHERE id = ?', [noteId]);
    if (!note) {
      throw new Error('Заметка не найдена');
    }

    // Удаляем заметку
    const result = await db.run('DELETE FROM client_notes WHERE id = ?', [noteId]);
    if (result.changes > 0) {
      // Добавляем запись в историю
      await db.run(`
        INSERT INTO client_history (client_id, action_type, description)
        VALUES (?, ?, ?)
      `, [note.client_id, 'note_deleted', 'Заметка удалена']);

      return true;
    } else {
      throw new Error('Не удалось удалить заметку');
    }
  } catch (error) {
    console.error('Ошибка при удалении заметки:', error);
    throw error;
  }
}

module.exports = {
  initDb,
  query,
  getStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
  getClients,
  getClientsByStatus,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  addClientNote,
  deleteClientNote
};