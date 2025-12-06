package middleware

import (
	"backend-go-postgres/internal/domain/entity"
	"net/http"

	"github.com/gin-gonic/gin"
)

// RequireRole middleware проверяет наличие определенной роли у пользователя
func RequireRole(allowedRoles ...entity.UserRole) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Получаем роль из контекста (должна быть установлена в AuthMiddleware)
		roleValue, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "Access denied: no role found",
			})
			c.Abort()
			return
		}

		userRole := entity.UserRole(roleValue.(string))

		// Проверяем, есть ли роль пользователя в списке разрешенных
		for _, allowedRole := range allowedRoles {
			if userRole == allowedRole {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "Access denied: insufficient permissions",
		})
		c.Abort()
	}
}

// RequireAdmin middleware проверяет, является ли пользователь админом
func RequireAdmin() gin.HandlerFunc {
	return RequireRole(entity.RoleAdmin)
}

// RequireUserOrAdmin middleware требует роль пользователя или админа
func RequireUserOrAdmin() gin.HandlerFunc {
	return RequireRole(entity.RoleUser, entity.RoleAdmin)
}
