package handler

import (
	"backend-go-postgres/internal/application/usecase"
	"backend-go-postgres/internal/presentation/dto"
	"net/http"

	"github.com/gin-gonic/gin"
)

// AuthHandler обрабатывает запросы аутентификации
type AuthHandler struct {
	authUseCase *usecase.AuthUseCase
}

// NewAuthHandler создает новый handler для аутентификации
func NewAuthHandler(authUseCase *usecase.AuthUseCase) *AuthHandler {
	return &AuthHandler{
		authUseCase: authUseCase,
	}
}

// Register godoc
// @Summary Регистрация нового пользователя
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body dto.RegisterRequest true "Данные для регистрации"
// @Success 201 {object} dto.AuthResponse
// @Failure 400 {object} dto.Response
// @Router /api/auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Response{
			Success: false,
			Message: "Invalid request data: " + err.Error(),
		})
		return
	}

	user, token, err := h.authUseCase.Register(req.Username, req.Email, req.Password)
	if err != nil {
		if err == usecase.ErrUserAlreadyExists {
			c.JSON(http.StatusConflict, dto.Response{
				Success: false,
				Message: "User with this username or email already exists",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.Response{
			Success: false,
			Message: "Failed to register user: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, dto.AuthResponse{
		Success: true,
		Data: &dto.UserData{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
		},
		Token:   token,
		Message: "User registered successfully",
	})
}

// Login godoc
// @Summary Вход пользователя
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body dto.LoginRequest true "Данные для входа"
// @Success 200 {object} dto.AuthResponse
// @Failure 400 {object} dto.Response
// @Failure 401 {object} dto.Response
// @Router /api/auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Response{
			Success: false,
			Message: "Invalid request data: " + err.Error(),
		})
		return
	}

	user, token, err := h.authUseCase.Login(req.Username, req.Password)
	if err != nil {
		if err == usecase.ErrInvalidCredentials {
			c.JSON(http.StatusUnauthorized, dto.Response{
				Success: false,
				Message: "Invalid username or password",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.Response{
			Success: false,
			Message: "Failed to login: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.AuthResponse{
		Success: true,
		Data: &dto.UserData{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
		},
		Token:   token,
		Message: "Login successful",
	})
}

// GetProfile godoc
// @Summary Получить профиль текущего пользователя
// @Tags Auth
// @Security BearerAuth
// @Produce json
// @Success 200 {object} dto.AuthResponse
// @Failure 401 {object} dto.Response
// @Router /api/auth/profile [get]
func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.Response{
			Success: false,
			Message: "User not authenticated",
		})
		return
	}

	user, err := h.authUseCase.GetUserByID(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Response{
			Success: false,
			Message: "Failed to get user profile",
		})
		return
	}

	c.JSON(http.StatusOK, dto.AuthResponse{
		Success: true,
		Data: &dto.UserData{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
		},
		Message: "Profile retrieved successfully",
	})
}
