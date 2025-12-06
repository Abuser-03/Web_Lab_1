package repository

import "backend-go-postgres/internal/domain/entity"

// LinkRepository определяет интерфейс для работы со ссылками
type LinkRepository interface {
	// Create создает новую ссылку
	Create(link *entity.Link) error

	// GetByID находит ссылку по ID
	GetByID(id uint) (*entity.Link, error)

	// GetAll возвращает все ссылки
	GetAll() ([]*entity.Link, error)

	// GetByUserID возвращает все ссылки пользователя
	GetByUserID(userID uint) ([]*entity.Link, error)

	// Update обновляет ссылку
	Update(link *entity.Link) error

	// Delete удаляет ссылку
	Delete(id uint) error

	// Count возвращает общее количество ссылок
	Count() (int64, error)

	// CountByUserID возвращает количество ссылок пользователя
	CountByUserID(userID uint) (int64, error)
}
