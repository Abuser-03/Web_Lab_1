# Генерация gRPC кода

## Перед запуском сервера нужно сгенерировать Go код из proto файлов.

### Windows:
```bash
# Из корня проекта backend-v3-grpc-roles
generate_proto.bat
```

### Linux/Mac:
```bash
chmod +x generate_proto.sh
./generate_proto.sh
```

## Установка protoc (если не установлен)

### Windows:
1. Скачать: https://github.com/protocolbuffers/protobuf/releases
2. Распаковать в `C:\protoc`
3. Добавить в PATH: `C:\protoc\bin`

### Linux:
```bash
sudo apt install protobuf-compiler
```

### Mac:
```bash
brew install protobuf
```

## Установка Go плагинов:
```bash
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
```

После генерации в этой директории появятся файлы:
- `link_service.pb.go` - сгенерированные типы
- `link_service_grpc.pb.go` - gRPC клиент и сервер
