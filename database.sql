-- Удаляем существующие таблицы, если они существуют
DROP TABLE IF EXISTS client_notes;
DROP TABLE IF EXISTS client_history;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS statuses;

-- Создаем таблицу статусов
CREATE TABLE statuses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  column_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создаем таблицу клиентов
CREATE TABLE clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  details TEXT,
  badge TEXT,
  badge_color TEXT DEFAULT 'secondary',
  phone TEXT,
  email TEXT,
  status_id INTEGER,
  next_contact_date TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (status_id) REFERENCES statuses (id)
);

-- Создаем таблицу для истории изменений клиентов
CREATE TABLE client_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients (id)
);

-- Создаем таблицу для заметок клиентов
CREATE TABLE client_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  note_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients (id)
);

-- Добавляем дефолтные статусы
INSERT INTO statuses (name, color, column_order) VALUES 
  ('Новый', '#4287f5', 0),
  ('В работе', '#f5a742', 1),
  ('Завершен', '#42f560', 2),
  ('Отменен', '#f54242', 3);

-- Создаем триггер для автоматического обновления updated_at у клиентов
CREATE TRIGGER IF NOT EXISTS update_clients_timestamp
AFTER UPDATE ON clients
FOR EACH ROW
BEGIN
    UPDATE clients SET updated_at = CURRENT_TIMESTAMP WHERE id = old.id;
END;

-- Убедитесь, что пользователь БД имеет права на эти таблицы