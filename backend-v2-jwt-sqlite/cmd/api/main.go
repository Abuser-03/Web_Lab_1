package main

import (
	_ "backend-go-postgres/docs" // Swagger docs
	"backend-go-postgres/internal/application/usecase"
	"backend-go-postgres/internal/infrastructure/database/sqlite"
	"backend-go-postgres/internal/presentation/handler"
	"backend-go-postgres/internal/presentation/router"
	"fmt"
	"log"
)

// @title Link Manager API with Auth
// @version 2.0
// @description REST API для управления ссылками с JWT аутентификацией (Onion Architecture) на Go + SQLite
// @contact.name API Support
// @contact.email support@linkmanager.com
// @host localhost:8082
// @BasePath /
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.
func main() {
	fmt.Println("\n🚀 Запуск Link Manager API (Go + SQLite + JWT)...\n")

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

	// 5. Настраиваем роутер с защищенными маршрутами
	r := router.SetupRouter(authHandler, linkHandler)

	// Информация о запуске
	fmt.Println("✅ Сервер запущен на http://localhost:8082")
	fmt.Println("📚 Swagger документация: http://localhost:8082/api-docs/index.html")
	fmt.Println("🌐 Фронтенд: http://localhost:8082\n")
	fmt.Println("📦 Архитектура: Onion Architecture (Clean Architecture)")
	fmt.Println("💾 Хранилище: SQLite + GORM (персистентное)")
	fmt.Println("🔐 Аутентификация: JWT (Bearer Token)")
	fmt.Println("🔧 Язык: Go (Golang)\n")
	fmt.Println("🔑 Публичные endpoints:")
	fmt.Println("   POST /api/auth/register - Регистрация")
	fmt.Println("   POST /api/auth/login    - Вход\n")
	fmt.Println("🔒 Защищенные endpoints (требуют токен):")
	fmt.Println("   GET  /api/auth/profile  - Профиль")
	fmt.Println("   GET  /api/links         - Все ссылки")
	fmt.Println("   POST /api/links         - Создать ссылку")
	fmt.Println("   GET  /api/links/:id     - Получить ссылку")
	fmt.Println("   PUT  /api/links/:id     - Обновить ссылку")
	fmt.Println("   DELETE /api/links/:id   - Удалить ссылку")
	fmt.Println("   GET  /api/links/stats   - Статистика\n")

	// Запуск сервера
	if err := r.Run(":8082"); err != nil {
		log.Fatalf("❌ Ошибка запуска сервера: %v", err)
	}
}
