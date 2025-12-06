package sqlite

import (
	"backend-go-postgres/internal/domain/entity"
	"errors"

	"gorm.io/gorm"
)

// LinkRepository реализует repository.LinkRepository для SQLite
type LinkRepository struct {
	db *gorm.DB
}

// NewLinkRepository создает новый репозиторий ссылок
func NewLinkRepository(db *gorm.DB) *LinkRepository {
	return &LinkRepository{db: db}
}

// Create создает новую ссылку
func (r *LinkRepository) Create(link *entity.Link) error {
	return r.db.Create(link).Error
}

// GetByID находит ссылку по ID
func (r *LinkRepository) GetByID(id uint) (*entity.Link, error) {
	var link entity.Link
	err := r.db.First(&link, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &link, nil
}

// GetAll возвращает все ссылки
func (r *LinkRepository) GetAll() ([]*entity.Link, error) {
	var links []*entity.Link
	err := r.db.Order("created_at DESC").Find(&links).Error
	return links, err
}

// GetByUserID возвращает все ссылки пользователя
func (r *LinkRepository) GetByUserID(userID uint) ([]*entity.Link, error) {
	var links []*entity.Link
	err := r.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&links).Error
	return links, err
}

// Update обновляет ссылку
func (r *LinkRepository) Update(link *entity.Link) error {
	return r.db.Save(link).Error
}

// Delete удаляет ссылку
func (r *LinkRepository) Delete(id uint) error {
	return r.db.Delete(&entity.Link{}, id).Error
}

// Count возвращает общее количество ссылок
func (r *LinkRepository) Count() (int64, error) {
	var count int64
	err := r.db.Model(&entity.Link{}).Count(&count).Error
	return count, err
}

// CountByUserID возвращает количество ссылок пользователя
func (r *LinkRepository) CountByUserID(userID uint) (int64, error) {
	var count int64
	err := r.db.Model(&entity.Link{}).Where("user_id = ?", userID).Count(&count).Error
	return count, err
}
