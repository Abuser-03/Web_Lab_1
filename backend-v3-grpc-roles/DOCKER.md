# 🐳 Docker Setup

## Созданные файлы

- `Dockerfile` - Multi-stage образ для Go приложения
- `docker-compose.yml` - Оркестрация контейнера
- `.dockerignore` - Исключения при сборке
- `.env.example` - Пример переменных окружения

## Быстрый старт

### 1. Создайте .env файл
```bash
cp .env.example .env
```

### 2. Отредактируйте JWT_SECRET в .env
```env
JWT_SECRET=ваш-уникальный-секретный-ключ-минимум-32-символа
```

### 3. Запустите с Docker Compose
```bash
docker-compose up -d
```

### 4. Проверьте работу
```bash
# Логи
docker-compose logs -f

# Статус
docker-compose ps
```

Приложение доступно на: http://localhost:8082

## Остановка

```bash
# Остановить
docker-compose down

# Остановить и удалить данные
docker-compose down -v
```

## Сборка без compose

```bash
# Сборка
docker build -t linkmanager:latest .

# Запуск
docker run -d \
  --name linkmanager \
  -p 8082:8082 \
  -v $(pwd)/data:/root/data \
  -e JWT_SECRET=your-secret \
  linkmanager:latest
```

## Особенности

- **Multi-stage build** - минимальный размер образа (~20MB)
- **SQLite volume** - данные сохраняются между перезапусками
- **Health check** - автоматическая проверка работоспособности
- **Auto-restart** - автоматический перезапуск при сбое

## Переменные окружения

| Переменная | Описание | По умолчанию |
|-----------|----------|--------------|
| JWT_SECRET | Секретный ключ для JWT | your-secret-key-change-this |
| GIN_MODE | Режим Gin (release/debug) | release |
| PORT | Порт приложения | 8082 |
