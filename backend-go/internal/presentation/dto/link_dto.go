package dto

// CreateLinkRequest DTO для создания ссылки
type CreateLinkRequest struct {
	Title       string `json:"title" binding:"required"`
	URL         string `json:"url" binding:"required"`
	Description string `json:"description"`
}

// UpdateLinkRequest DTO для обновления ссылки
type UpdateLinkRequest struct {
	Title       string `json:"title" binding:"required"`
	URL         string `json:"url" binding:"required"`
	Description string `json:"description"`
}

// Response стандартный ответ API
type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
	Count   int         `json:"count,omitempty"`
}

// NewSuccessResponse создает успешный ответ
func NewSuccessResponse(data interface{}) Response {
	return Response{
		Success: true,
		Data:    data,
	}
}

// NewSuccessResponseWithMessage создает успешный ответ с сообщением
func NewSuccessResponseWithMessage(data interface{}, message string) Response {
	return Response{
		Success: true,
		Data:    data,
		Message: message,
	}
}

// NewSuccessResponseWithCount создает успешный ответ с количеством
func NewSuccessResponseWithCount(data interface{}, count int) Response {
	return Response{
		Success: true,
		Data:    data,
		Count:   count,
	}
}

// NewErrorResponse создает ответ с ошибкой
func NewErrorResponse(err string) Response {
	return Response{
		Success: false,
		Error:   err,
	}
}
