package handler

import (
	"backend-go/internal/application/usecase"
	"backend-go/internal/presentation/dto"
	"net/http"

	"github.com/gin-gonic/gin"
)

// LinkHandler обработчик HTTP запросов для ссылок (Presentation Layer)
type LinkHandler struct {
	useCase *usecase.LinkUseCase
}

// NewLinkHandler создает новый handler
func NewLinkHandler(useCase *usecase.LinkUseCase) *LinkHandler {
	return &LinkHandler{
		useCase: useCase,
	}
}

// GetAll godoc
// @Summary Получить все ссылки
// @Tags Links
// @Produce json
// @Success 200 {object} dto.Response
// @Router /api/links [get]
func (h *LinkHandler) GetAll(c *gin.Context) {
	links, err := h.useCase.GetAllLinks()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.NewErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.NewSuccessResponseWithCount(links, len(links)))
}

// GetByID godoc
// @Summary Получить ссылку по ID
// @Tags Links
// @Produce json
// @Param id path string true "Link ID"
// @Success 200 {object} dto.Response
// @Failure 404 {object} dto.Response
// @Router /api/links/{id} [get]
func (h *LinkHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	link, err := h.useCase.GetLinkByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.NewErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.NewSuccessResponse(link))
}

// Create godoc
// @Summary Создать новую ссылку
// @Tags Links
// @Accept json
// @Produce json
// @Param link body dto.CreateLinkRequest true "Link data"
// @Success 201 {object} dto.Response
// @Failure 400 {object} dto.Response
// @Router /api/links [post]
func (h *LinkHandler) Create(c *gin.Context) {
	var req dto.CreateLinkRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.NewErrorResponse("Поля title и url обязательны"))
		return
	}

	link, err := h.useCase.CreateLink(req.Title, req.URL, req.Description)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.NewErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusCreated, dto.NewSuccessResponseWithMessage(link, "Ссылка успешно создана"))
}

// Update godoc
// @Summary Обновить ссылку
// @Tags Links
// @Accept json
// @Produce json
// @Param id path string true "Link ID"
// @Param link body dto.UpdateLinkRequest true "Link data"
// @Success 200 {object} dto.Response
// @Failure 400 {object} dto.Response
// @Failure 404 {object} dto.Response
// @Router /api/links/{id} [put]
func (h *LinkHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var req dto.UpdateLinkRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.NewErrorResponse("Поля title и url обязательны"))
		return
	}

	link, err := h.useCase.UpdateLink(id, req.Title, req.URL, req.Description)
	if err != nil {
		if err.Error() == "ссылка не найдена" {
			c.JSON(http.StatusNotFound, dto.NewErrorResponse(err.Error()))
		} else {
			c.JSON(http.StatusBadRequest, dto.NewErrorResponse(err.Error()))
		}
		return
	}

	c.JSON(http.StatusOK, dto.NewSuccessResponseWithMessage(link, "Ссылка успешно обновлена"))
}

// Delete godoc
// @Summary Удалить ссылку
// @Tags Links
// @Produce json
// @Param id path string true "Link ID"
// @Success 200 {object} dto.Response
// @Failure 404 {object} dto.Response
// @Router /api/links/{id} [delete]
func (h *LinkHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	if err := h.useCase.DeleteLink(id); err != nil {
		c.JSON(http.StatusNotFound, dto.NewErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.NewSuccessResponseWithMessage(nil, "Ссылка успешно удалена"))
}

// GetStatistics godoc
// @Summary Получить статистику
// @Tags Links
// @Produce json
// @Success 200 {object} dto.Response
// @Router /api/links/stats [get]
func (h *LinkHandler) GetStatistics(c *gin.Context) {
	stats, err := h.useCase.GetStatistics()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.NewErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.NewSuccessResponse(stats))
}
