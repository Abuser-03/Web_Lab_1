@echo off
echo Генерация gRPC кода...

REM Создаем директорию
if not exist proto\pb mkdir proto\pb

REM Используем локальный protoc
set PROTOC=%cd%\protoc\bin\protoc.exe

REM Проверяем наличие Go плагинов
where protoc-gen-go >nul 2>&1
if %errorlevel% neq 0 (
    echo Установка protoc-gen-go...
    go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
)

where protoc-gen-go-grpc >nul 2>&1
if %errorlevel% neq 0 (
    echo Установка protoc-gen-go-grpc...
    go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
)

REM Генерируем код
%PROTOC% --go_out=. --go_opt=paths=source_relative --go-grpc_out=. --go-grpc_opt=paths=source_relative proto\link_service.proto

if %errorlevel% equ 0 (
    echo ✅ Генерация завершена!
    echo ✅ Файлы созданы в proto\pb\
) else (
    echo ❌ Ошибка генерации!
)

pause
