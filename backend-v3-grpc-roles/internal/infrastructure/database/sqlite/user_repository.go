package sqlite

import (
	"backend-go-postgres/internal/domain/entity"
	"errors"

	"gorm.io/gorm"
)

// UserRepository реализует repository.UserRepository для SQLite
type UserRepository struct {
	db *gorm.DB
}

// NewUserRepository создает новый репозиторий пользователей
func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

// Create создает нового пользователя
func (r *UserRepository) Create(user *entity.User) error {
	return r.db.Create(user).Error
}

// GetByID находит пользователя по ID
func (r *UserRepository) GetByID(id uint) (*entity.User, error) {
	var user entity.User
	err := r.db.First(&user, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

// GetByUsername находит пользователя по username
func (r *UserRepository) GetByUsername(username string) (*entity.User, error) {
	var user entity.User
	err := r.db.Where("username = ?", username).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

// GetByEmail находит пользователя по email
func (r *UserRepository) GetByEmail(email string) (*entity.User, error) {
	var user entity.User
	err := r.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

// Update обновляет данные пользователя
func (r *UserRepository) Update(user *entity.User) error {
	return r.db.Save(user).Error
}

// Delete удаляет пользователя
func (r *UserRepository) Delete(id uint) error {
	return r.db.Delete(&entity.User{}, id).Error
}

// GetAll возвращает всех пользователей
func (r *UserRepository) GetAll() ([]*entity.User, error) {
	var users []*entity.User
	err := r.db.Find(&users).Error
	return users, err
}
