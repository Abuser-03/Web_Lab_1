# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Копируем go.mod и go.sum
COPY go.mod go.sum ./

# Скачиваем зависимости
RUN go mod download

# Копируем исходный код
COPY . .

# Компилируем приложение
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/api

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates sqlite

WORKDIR /root/

# Копируем скомпилированное приложение
COPY --from=builder /app/main .

# Копируем публичные файлы
COPY --from=builder /app/public ./public

# Создаем директорию для БД
RUN mkdir -p /root/data

# Открываем порт
EXPOSE 8082

# Запускаем приложение
CMD ["./main"]
