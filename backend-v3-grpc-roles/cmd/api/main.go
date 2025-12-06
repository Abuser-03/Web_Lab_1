package main

import (
	_ "backend-go-postgres/docs" // Swagger docs
	"backend-go-postgres/internal/application/usecase"
	"backend-go-postgres/internal/infrastructure/database/sqlite"
	grpcserver "backend-go-postgres/internal/infrastructure/grpc"
	"backend-go-postgres/internal/presentation/handler"
	"backend-go-postgres/internal/presentation/router"
	pb "backend-go-postgres/proto/pb"
	"fmt"
	"log"
	"net"

	"google.golang.org/grpc"
)

// @title Link Manager API with Auth and gRPC
// @version 3.0
// @description REST API и gRPC для управления ссылками с JWT аутентификацией и ролевой моделью (Onion Architecture) на Go + SQLite
// @contact.name API Support
// @contact.email support@linkmanager.com
// @host localhost:8082
// @BasePath /
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.
func main() {
	fmt.Println("\n🚀 Запуск Link Manager API v3.0 (REST + gRPC + Roles)...\n")

	// 1. Infrastructure Layer - подключение к SQLite
	db, err := sqlite.NewDatabase("./data/linkmanager.db")
	if err != nil {
		log.Fatalf("❌ Ошибка подключения к БД: %v", err)
	}
	defer db.Close()

	// 2. Repository Layer - создаем репозитории
	userRepo := sqlite.NewUserRepository(db.DB)
	linkRepo := sqlite.NewLinkRepository(db.DB)

	// 3. Application Layer - создаем use cases
	authUseCase := usecase.NewAuthUseCase(userRepo)
	linkUseCase := usecase.NewLinkUseCase(linkRepo)

	// 4. Presentation Layer - создаем handlers
	authHandler := handler.NewAuthHandler(authUseCase)
	linkHandler := handler.NewLinkHandler(linkUseCase)

	// 5. Настраиваем роутер REST API с защищенными маршрутами
	r := router.SetupRouter(authHandler, linkHandler)

	// 6. Создаем gRPC сервер
	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(grpcserver.AuthInterceptor),
	)

	// Регистрируем gRPC сервисы
	linkGrpcServer := grpcserver.NewLinkServer(linkUseCase)
	authGrpcServer := grpcserver.NewAuthServer(authUseCase)

	pb.RegisterLinkServiceServer(grpcServer, linkGrpcServer)
	pb.RegisterAuthServiceServer(grpcServer, authGrpcServer)

	// 7. Запускаем gRPC сервер в отдельной горутине
	go func() {
		lis, err := net.Listen("tcp", ":50051")
		if err != nil {
			log.Fatalf("❌ Ошибка создания gRPC listener: %v", err)
		}

		fmt.Println("✅ gRPC сервер запущен на localhost:50051")
		fmt.Println("📡 Протокол: gRPC\n")

		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("❌ Ошибка запуска gRPC сервера: %v", err)
		}
	}()

	// Информация о запуске
	fmt.Println("✅ REST API сервер запущен на http://localhost:8082")
	fmt.Println("📚 Swagger документация: http://localhost:8082/api-docs/index.html")
	fmt.Println("🌐 Фронтенд: http://localhost:8082\n")
	fmt.Println("📦 Архитектура: Onion Architecture (Clean Architecture)")
	fmt.Println("💾 Хранилище: SQLite + GORM (персистентное)")
	fmt.Println("🔐 Аутентификация: JWT (Bearer Token)")
	fmt.Println("👥 Роли: anonymous, user, admin")
	fmt.Println("🔧 Язык: Go (Golang)\n")
	fmt.Println("🔑 REST API - Публичные endpoints:")
	fmt.Println("   POST /api/auth/register - Регистрация")
	fmt.Println("   POST /api/auth/login    - Вход\n")
	fmt.Println("🔒 REST API - Защищенные endpoints (требуют токен + роль user/admin):")
	fmt.Println("   GET  /api/auth/profile  - Профиль")
	fmt.Println("   GET  /api/links         - Все ссылки")
	fmt.Println("   POST /api/links         - Создать ссылку")
	fmt.Println("   GET  /api/links/:id     - Получить ссылку")
	fmt.Println("   PUT  /api/links/:id     - Обновить ссылку")
	fmt.Println("   DELETE /api/links/:id   - Удалить ссылку")
	fmt.Println("   GET  /api/links/stats   - Статистика\n")
	fmt.Println("📡 gRPC Services:")
	fmt.Println("   linkmanager.LinkService - Управление ссылками")
	fmt.Println("   linkmanager.AuthService - Аутентификация\n")

	// 8. Запуск REST API сервера
	if err := r.Run(":8082"); err != nil {
		log.Fatalf("❌ Ошибка запуска REST сервера: %v", err)
	}
}
