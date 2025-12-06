package usecase

import (
	"backend-go/internal/domain/entity"
	"backend-go/internal/domain/repository"
	"errors"
	"fmt"
)

const MaxLinks = 50

// LinkUseCase содержит бизнес-логику для работы со ссылками (Application Layer)
type LinkUseCase struct {
	repo repository.LinkRepository
}

// NewLinkUseCase создает новый use case
func NewLinkUseCase(repo repository.LinkRepository) *LinkUseCase {
	return &LinkUseCase{
		repo: repo,
	}
}

// GetAllLinks получить все ссылки
func (uc *LinkUseCase) GetAllLinks() ([]*entity.Link, error) {
	return uc.repo.GetAll()
}

// GetLinkByID получить ссылку по ID
func (uc *LinkUseCase) GetLinkByID(id string) (*entity.Link, error) {
	link, err := uc.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if link == nil {
		return nil, errors.New("ссылка не найдена")
	}
	return link, nil
}

// CreateLink создать новую ссылку
func (uc *LinkUseCase) CreateLink(title, url, description string) (*entity.Link, error) {
	// Проверка лимита
	count, err := uc.repo.Count()
	if err != nil {
		return nil, err
	}

	if count >= MaxLinks {
		return nil, fmt.Errorf("достигнут максимальный лимит ссылок (%d записей)", MaxLinks)
	}

	// Создание сущности
	link, err := entity.NewLink(title, url, description)
	if err != nil {
		return nil, err
	}

	// Сохранение
	return uc.repo.Create(link)
}

// UpdateLink обновить ссылку
func (uc *LinkUseCase) UpdateLink(id, title, url, description string) (*entity.Link, error) {
	// Проверка существования
	existing, err := uc.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, errors.New("ссылка не найдена")
	}

	// Обновление
	if err := existing.Update(title, url, description); err != nil {
		return nil, err
	}

	return uc.repo.Update(id, existing)
}

// DeleteLink удалить ссылку
func (uc *LinkUseCase) DeleteLink(id string) error {
	// Проверка существования
	existing, err := uc.repo.GetByID(id)
	if err != nil {
		return err
	}
	if existing == nil {
		return errors.New("ссылка не найдена")
	}

	return uc.repo.Delete(id)
}

// GetStatistics получить статистику
func (uc *LinkUseCase) GetStatistics() (map[string]interface{}, error) {
	count, err := uc.repo.Count()
	if err != nil {
		return nil, err
	}

	stats := map[string]interface{}{
		"totalLinks":     count,
		"maxLinks":       MaxLinks,
		"remainingSlots": MaxLinks - count,
		"percentageFull": float64(count) / float64(MaxLinks) * 100,
	}

	return stats, nil
}
