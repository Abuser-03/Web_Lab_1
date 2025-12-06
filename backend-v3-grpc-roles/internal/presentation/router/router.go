package router

import (
	"backend-go-postgres/internal/presentation/handler"
	"backend-go-postgres/internal/presentation/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// SetupRouter настраивает маршруты приложения с аутентификацией
func SetupRouter(authHandler *handler.AuthHandler, linkHandler *handler.LinkHandler) *gin.Engine {
	router := gin.Default()

	// CORS
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	router.Use(cors.New(config))

	// Swagger documentation
	router.GET("/api-docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// API routes
	api := router.Group("/api")
	{
		// Публичные маршруты аутентификации (доступны anonymous)
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		// Защищенные маршруты для user и admin (требуют JWT токен + роль)
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		protected.Use(middleware.RequireUserOrAdmin()) // Требуется роль user или admin
		{
			// Профиль пользователя
			protected.GET("/auth/profile", authHandler.GetProfile)

			// Маршруты для ссылок (пользователь видит только свои)
			protected.GET("/links/stats", linkHandler.GetStatistics)
			protected.GET("/links", linkHandler.GetAll)
			protected.GET("/links/:id", linkHandler.GetByID)
			protected.POST("/links", linkHandler.Create)
			protected.PUT("/links/:id", linkHandler.Update)
			protected.DELETE("/links/:id", linkHandler.Delete)
		}
	}

	// Serve static files (фронтенд)
	router.Static("/css", "public/css")
	router.Static("/js", "public/js")
	router.StaticFile("/", "public/index.html")
	router.StaticFile("/index.html", "public/index.html")
	router.NoRoute(func(c *gin.Context) {
		c.File("public/index.html")
	})

	return router
}
