package repository

import "backend-go-postgres/internal/domain/entity"

// UserRepository определяет интерфейс для работы с пользователями
type UserRepository interface {
	// Create создает нового пользователя
	Create(user *entity.User) error

	// GetByID находит пользователя по ID
	GetByID(id uint) (*entity.User, error)

	// GetByUsername находит пользователя по username
	GetByUsername(username string) (*entity.User, error)

	// GetByEmail находит пользователя по email
	GetByEmail(email string) (*entity.User, error)

	// Update обновляет данные пользователя
	Update(user *entity.User) error

	// Delete удаляет пользователя
	Delete(id uint) error

	// GetAll возвращает всех пользователей
	GetAll() ([]*entity.User, error)
}
