package router

import (
	"backend-go/internal/presentation/handler"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// SetupRouter настраивает маршруты приложения
func SetupRouter(linkHandler *handler.LinkHandler) *gin.Engine {
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
		// Links routes
		api.GET("/links/stats", linkHandler.GetStatistics) // Важно: этот маршрут должен быть ДО /links/:id
		api.GET("/links", linkHandler.GetAll)
		api.GET("/links/:id", linkHandler.GetByID)
		api.POST("/links", linkHandler.Create)
		api.PUT("/links/:id", linkHandler.Update)
		api.DELETE("/links/:id", linkHandler.Delete)
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
