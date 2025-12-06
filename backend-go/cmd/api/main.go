package main

import (
	_ "backend-go/docs" // Swagger docs
	"backend-go/internal/application/usecase"
	"backend-go/internal/infrastructure/repository/memory"
	"backend-go/internal/presentation/handler"
	"backend-go/internal/presentation/router"
	"fmt"
	"log"
)

// @title Link Manager API
// @version 1.0
// @description REST API для управления ссылками (Onion Architecture) на Go
// @contact.name API Support
// @contact.email support@linkmanager.com
// @host localhost:8081
// @BasePath /
func main() {
	fmt.Println("\n🚀 Запуск Link Manager API (Go version)...\n")

	// Dependency Injection (Onion Architecture)
	// 1. Infrastructure Layer - создаем репозиторий
	linkRepo := memory.NewInMemoryLinkRepository()

	// 2. Application Layer - создаем use case
	linkUseCase := usecase.NewLinkUseCase(linkRepo)

	// 3. Presentation Layer - создаем handler
	linkHandler := handler.NewLinkHandler(linkUseCase)

	// 4. Настраиваем роутер
	r := router.SetupRouter(linkHandler)

	// Информация о запуске
	fmt.Println("🚀 Сервер запущен на http://localhost:8081")
	fmt.Println("📚 Swagger документация: http://localhost:8081/api-docs/index.html")
	fmt.Println("🌐 Фронтенд: http://localhost:8081\n")
	fmt.Println("📦 Архитектура: Onion Architecture (Clean Architecture)")
	fmt.Println("💾 Хранилище: In-Memory (максимум 50 записей)")
	fmt.Println("🔧 Язык: Go (Golang)\n")

	// Запуск сервера
	if err := r.Run(":8081"); err != nil {
		log.Fatalf("Ошибка запуска сервера: %v", err)
	}
}
