#!/bin/bash

# Генерация Go кода из .proto файлов

echo "🔨 Генерация gRPC кода..."

# Создаем директорию для сгенерированных файлов
mkdir -p proto/pb

# Генерируем код
protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    proto/link_service.proto

echo "✅ Генерация завершена!"
echo "📁 Файлы созданы в proto/pb/"
