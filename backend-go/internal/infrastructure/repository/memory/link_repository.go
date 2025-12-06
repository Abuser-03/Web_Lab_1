package memory

import (
	"backend-go/internal/domain/entity"
	"backend-go/internal/domain/repository"
	"errors"
	"fmt"
	"strconv"
	"sync"
)

// InMemoryLinkRepository реализация in-memory репозитория (Infrastructure Layer)
type InMemoryLinkRepository struct {
	mu        sync.RWMutex
	links     map[string]*entity.Link
	currentID int
}

// NewInMemoryLinkRepository создает новый in-memory репозиторий
func NewInMemoryLinkRepository() repository.LinkRepository {
	return &InMemoryLinkRepository{
		links:     make(map[string]*entity.Link),
		currentID: 1,
	}
}

// GetAll получить все ссылки
func (r *InMemoryLinkRepository) GetAll() ([]*entity.Link, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	links := make([]*entity.Link, 0, len(r.links))
	for _, link := range r.links {
		links = append(links, link)
	}

	return links, nil
}

// GetByID получить ссылку по ID
func (r *InMemoryLinkRepository) GetByID(id string) (*entity.Link, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	link, exists := r.links[id]
	if !exists {
		return nil, nil
	}

	return link, nil
}

// Create создать новую ссылку
func (r *InMemoryLinkRepository) Create(link *entity.Link) (*entity.Link, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if len(r.links) >= 50 {
		return nil, errors.New("достигнут лимит записей (50)")
	}

	id := strconv.Itoa(r.currentID)
	link.ID = id
	r.currentID++

	r.links[id] = link

	return link, nil
}

// Update обновить ссылку
func (r *InMemoryLinkRepository) Update(id string, link *entity.Link) (*entity.Link, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.links[id]; !exists {
		return nil, fmt.Errorf("ссылка с ID %s не найдена", id)
	}

	link.ID = id
	r.links[id] = link

	return link, nil
}

// Delete удалить ссылку
func (r *InMemoryLinkRepository) Delete(id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.links[id]; !exists {
		return fmt.Errorf("ссылка с ID %s не найдена", id)
	}

	delete(r.links, id)
	return nil
}

// Count получить количество ссылок
func (r *InMemoryLinkRepository) Count() (int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return len(r.links), nil
}
