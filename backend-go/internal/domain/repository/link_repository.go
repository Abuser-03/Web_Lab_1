package repository

import "backend-go/internal/domain/entity"

// LinkRepository интерфейс репозитория для работы со ссылками (Domain Interface)
type LinkRepository interface {
	// GetAll получить все ссылки
	GetAll() ([]*entity.Link, error)

	// GetByID получить ссылку по ID
	GetByID(id string) (*entity.Link, error)

	// Create создать новую ссылку
	Create(link *entity.Link) (*entity.Link, error)

	// Update обновить ссылку
	Update(id string, link *entity.Link) (*entity.Link, error)

	// Delete удалить ссылку
	Delete(id string) error

	// Count получить количество ссылок
	Count() (int, error)
}
