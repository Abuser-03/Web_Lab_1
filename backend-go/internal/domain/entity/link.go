package entity

import (
	"errors"
	"net/url"
	"time"
)

// Link представляет сущность ссылки (Domain Entity)
type Link struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	URL         string    `json:"url"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// NewLink создает новую сущность Link
func NewLink(title, urlStr, description string) (*Link, error) {
	link := &Link{
		Title:       title,
		URL:         urlStr,
		Description: description,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := link.Validate(); err != nil {
		return nil, err
	}

	return link, nil
}

// Validate валидирует сущность Link
func (l *Link) Validate() error {
	if l.Title == "" {
		return errors.New("название ссылки обязательно")
	}

	if l.URL == "" {
		return errors.New("URL обязателен")
	}

	if !isValidURL(l.URL) {
		return errors.New("некорректный формат URL")
	}

	return nil
}

// Update обновляет данные ссылки
func (l *Link) Update(title, urlStr, description string) error {
	if title != "" {
		l.Title = title
	}
	if urlStr != "" {
		l.URL = urlStr
	}
	l.Description = description
	l.UpdatedAt = time.Now()

	return l.Validate()
}

// isValidURL проверяет валидность URL
func isValidURL(urlStr string) bool {
	_, err := url.ParseRequestURI(urlStr)
	return err == nil
}
