package usecase

import (
	"backend-go-postgres/internal/domain/entity"
	"backend-go-postgres/internal/domain/repository"
	"errors"
	"time"
)

var (
	ErrLinkNotFound = errors.New("link not found")
	ErrUnauthorized = errors.New("unauthorized to access this link")
)

// LinkUseCase содержит бизнес-логику для работы со ссылками
type LinkUseCase struct {
	linkRepo repository.LinkRepository
}

// NewLinkUseCase создает новый use case для ссылок
func NewLinkUseCase(linkRepo repository.LinkRepository) *LinkUseCase {
	return &LinkUseCase{
		linkRepo: linkRepo,
	}
}

// CreateLink создает новую ссылку
func (uc *LinkUseCase) CreateLink(userID uint, title, url, description string) (*entity.Link, error) {
	link := &entity.Link{
		UserID:      userID,
		Title:       title,
		URL:         url,
		Description: description,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := link.Validate(); err != nil {
		return nil, err
	}

	if err := uc.linkRepo.Create(link); err != nil {
		return nil, err
	}

	return link, nil
}

// GetLinkByID получает ссылку по ID
func (uc *LinkUseCase) GetLinkByID(userID, linkID uint) (*entity.Link, error) {
	link, err := uc.linkRepo.GetByID(linkID)
	if err != nil {
		return nil, err
	}
	if link == nil {
		return nil, ErrLinkNotFound
	}

	// Проверяем, что пользователь является владельцем ссылки
	if link.UserID != userID {
		return nil, ErrUnauthorized
	}

	return link, nil
}

// GetAllLinks возвращает все ссылки пользователя или все ссылки для админа
func (uc *LinkUseCase) GetAllLinks(userID uint, role string) ([]*entity.Link, error) {
	// Если пользователь администратор, возвращаем все ссылки
	if role == "admin" {
		return uc.linkRepo.GetAll()
	}
	// Иначе возвращаем только ссылки пользователя
	return uc.linkRepo.GetByUserID(userID)
}

// UpdateLink обновляет ссылку
func (uc *LinkUseCase) UpdateLink(userID, linkID uint, title, url, description string) (*entity.Link, error) {
	link, err := uc.linkRepo.GetByID(linkID)
	if err != nil {
		return nil, err
	}
	if link == nil {
		return nil, ErrLinkNotFound
	}

	// Проверяем, что пользователь является владельцем ссылки
	if link.UserID != userID {
		return nil, ErrUnauthorized
	}

	if err := link.Update(title, url, description); err != nil {
		return nil, err
	}

	if err := uc.linkRepo.Update(link); err != nil {
		return nil, err
	}

	return link, nil
}

// DeleteLink удаляет ссылку
func (uc *LinkUseCase) DeleteLink(userID, linkID uint) error {
	link, err := uc.linkRepo.GetByID(linkID)
	if err != nil {
		return err
	}
	if link == nil {
		return ErrLinkNotFound
	}

	// Проверяем, что пользователь является владельцем ссылки
	if link.UserID != userID {
		return ErrUnauthorized
	}

	return uc.linkRepo.Delete(linkID)
}

// GetStatistics возвращает статистику пользователя или всей системы для админа
func (uc *LinkUseCase) GetStatistics(userID uint, role string) (map[string]interface{}, error) {
	var count int64
	var err error

	// Если пользователь администратор, возвращаем статистику по всем ссылкам
	if role == "admin" {
		count, err = uc.linkRepo.Count()
	} else {
		// Иначе возвращаем статистику только для пользователя
		count, err = uc.linkRepo.CountByUserID(userID)
	}

	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"totalLinks": count,
	}, nil
}
