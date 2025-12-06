package handler

import (
	"backend-go-postgres/internal/application/usecase"
	"backend-go-postgres/internal/presentation/dto"
	"backend-go-postgres/internal/presentation/middleware"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// LinkHandler обрабатывает запросы для работы со ссылками
type LinkHandler struct {
	linkUseCase *usecase.LinkUseCase
}

// NewLinkHandler создает новый handler для ссылок
func NewLinkHandler(linkUseCase *usecase.LinkUseCase) *LinkHandler {
	return &LinkHandler{
		linkUseCase: linkUseCase,
	}
}

// Create godoc
// @Summary Создать новую ссылку
// @Tags Links
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body dto.CreateLinkRequest true "Данные ссылки"
// @Success 201 {object} dto.Response
// @Failure 400 {object} dto.Response
// @Failure 401 {object} dto.Response
// @Router /api/links [post]
func (h *LinkHandler) Create(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.Response{
			Success: false,
			Message: "User not authenticated",
		})
		return
	}

	var req dto.CreateLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Response{
			Success: false,
			Message: "Invalid request data: " + err.Error(),
		})
		return
	}

	link, err := h.linkUseCase.CreateLink(userID, req.Title, req.URL, req.Description)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Response{
			Success: false,
			Message: "Failed to create link: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, dto.Response{
		Success: true,
		Data:    link,
		Message: "Ссылка успешно создана",
	})
}

// GetAll godoc
// @Summary Получить все ссылки пользователя (или все ссылки для админа)
// @Tags Links
// @Security BearerAuth
// @Produce json
// @Success 200 {object} dto.Response
// @Failure 401 {object} dto.Response
// @Router /api/links [get]
func (h *LinkHandler) GetAll(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.Response{
			Success: false,
			Message: "User not authenticated",
		})
		return
	}

	// Получаем роль пользователя
	role, _ := middleware.GetUserRole(c)

	links, err := h.linkUseCase.GetAllLinks(userID, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Response{
			Success: false,
			Message: "Failed to get links",
		})
		return
	}

	count := len(links)
	c.JSON(http.StatusOK, dto.Response{
		Success: true,
		Data:    links,
		Count:   &count,
	})
}

// GetByID godoc
// @Summary Получить ссылку по ID
// @Tags Links
// @Security BearerAuth
// @Produce json
// @Param id path int true "Link ID"
// @Success 200 {object} dto.Response
// @Failure 401 {object} dto.Response
// @Failure 404 {object} dto.Response
// @Router /api/links/{id} [get]
func (h *LinkHandler) GetByID(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.Response{
			Success: false,
			Message: "User not authenticated",
		})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.Response{
			Success: false,
			Message: "Invalid link ID",
		})
		return
	}

	link, err := h.linkUseCase.GetLinkByID(userID, uint(id))
	if err != nil {
		if err == usecase.ErrLinkNotFound {
			c.JSON(http.StatusNotFound, dto.Response{
				Success: false,
				Message: "Link not found",
			})
			return
		}
		if err == usecase.ErrUnauthorized {
			c.JSON(http.StatusForbidden, dto.Response{
				Success: false,
				Message: "You are not authorized to access this link",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.Response{
			Success: false,
			Message: "Failed to get link",
		})
		return
	}

	c.JSON(http.StatusOK, dto.Response{
		Success: true,
		Data:    link,
	})
}

// Update godoc
// @Summary Обновить ссылку
// @Tags Links
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "Link ID"
// @Param request body dto.UpdateLinkRequest true "Обновленные данные"
// @Success 200 {object} dto.Response
// @Failure 400 {object} dto.Response
// @Failure 401 {object} dto.Response
// @Failure 404 {object} dto.Response
// @Router /api/links/{id} [put]
func (h *LinkHandler) Update(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.Response{
			Success: false,
			Message: "User not authenticated",
		})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.Response{
			Success: false,
			Message: "Invalid link ID",
		})
		return
	}

	var req dto.UpdateLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Response{
			Success: false,
			Message: "Invalid request data: " + err.Error(),
		})
		return
	}

	link, err := h.linkUseCase.UpdateLink(userID, uint(id), req.Title, req.URL, req.Description)
	if err != nil {
		if err == usecase.ErrLinkNotFound {
			c.JSON(http.StatusNotFound, dto.Response{
				Success: false,
				Message: "Link not found",
			})
			return
		}
		if err == usecase.ErrUnauthorized {
			c.JSON(http.StatusForbidden, dto.Response{
				Success: false,
				Message: "You are not authorized to update this link",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.Response{
			Success: false,
			Message: "Failed to update link",
		})
		return
	}

	c.JSON(http.StatusOK, dto.Response{
		Success: true,
		Data:    link,
		Message: "Ссылка успешно обновлена",
	})
}

// Delete godoc
// @Summary Удалить ссылку
// @Tags Links
// @Security BearerAuth
// @Produce json
// @Param id path int true "Link ID"
// @Success 200 {object} dto.Response
// @Failure 401 {object} dto.Response
// @Failure 404 {object} dto.Response
// @Router /api/links/{id} [delete]
func (h *LinkHandler) Delete(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.Response{
			Success: false,
			Message: "User not authenticated",
		})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.Response{
			Success: false,
			Message: "Invalid link ID",
		})
		return
	}

	err = h.linkUseCase.DeleteLink(userID, uint(id))
	if err != nil {
		if err == usecase.ErrLinkNotFound {
			c.JSON(http.StatusNotFound, dto.Response{
				Success: false,
				Message: "Link not found",
			})
			return
		}
		if err == usecase.ErrUnauthorized {
			c.JSON(http.StatusForbidden, dto.Response{
				Success: false,
				Message: "You are not authorized to delete this link",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.Response{
			Success: false,
			Message: "Failed to delete link",
		})
		return
	}

	c.JSON(http.StatusOK, dto.Response{
		Success: true,
		Message: "Ссылка успешно удалена",
	})
}

// GetStatistics godoc
// @Summary Получить статистику пользователя (или всей системы для админа)
// @Tags Links
// @Security BearerAuth
// @Produce json
// @Success 200 {object} dto.Response
// @Failure 401 {object} dto.Response
// @Router /api/links/stats [get]
func (h *LinkHandler) GetStatistics(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.Response{
			Success: false,
			Message: "User not authenticated",
		})
		return
	}

	// Получаем роль пользователя
	role, _ := middleware.GetUserRole(c)

	stats, err := h.linkUseCase.GetStatistics(userID, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Response{
			Success: false,
			Message: "Failed to get statistics",
		})
		return
	}

	c.JSON(http.StatusOK, dto.Response{
		Success: true,
		Data:    stats,
	})
}
