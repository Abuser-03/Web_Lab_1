package dto

import "time"

// CreateLinkRequest представляет запрос на создание ссылки
type CreateLinkRequest struct {
	Title       string `json:"title" binding:"required" example:"Google"`
	URL         string `json:"url" binding:"required,url" example:"https://google.com"`
	Description string `json:"description" example:"Search engine"`
}

// UpdateLinkRequest представляет запрос на обновление ссылки
type UpdateLinkRequest struct {
	Title       string `json:"title" example:"Updated Title"`
	URL         string `json:"url" example:"https://example.com"`
	Description string `json:"description" example:"Updated description"`
}

// LinkResponse представляет данные ссылки
type LinkResponse struct {
	ID          uint      `json:"id" example:"1"`
	UserID      uint      `json:"userId" example:"1"`
	Title       string    `json:"title" example:"Google"`
	URL         string    `json:"url" example:"https://google.com"`
	Description string    `json:"description" example:"Search engine"`
	CreatedAt   time.Time `json:"createdAt" example:"2025-01-15T10:00:00Z"`
	UpdatedAt   time.Time `json:"updatedAt" example:"2025-01-15T10:00:00Z"`
}

// Response представляет стандартный ответ API
type Response struct {
	Success bool        `json:"success" example:"true"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty" example:"Operation successful"`
	Count   *int        `json:"count,omitempty" example:"10"`
}
