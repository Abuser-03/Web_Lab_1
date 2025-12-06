package entity

import (
	"errors"
	"regexp"
	"time"
)

// Link представляет сущность ссылки
type Link struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	UserID      uint      `json:"userId" gorm:"not null;index"` // Владелец ссылки
	Title       string    `json:"title" gorm:"not null"`
	URL         string    `json:"url" gorm:"not null"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// Validate проверяет корректность данных ссылки
func (l *Link) Validate() error {
	if l.Title == "" {
		return errors.New("title is required")
	}

	if l.URL == "" {
		return errors.New("url is required")
	}

	// Валидация URL
	urlRegex := regexp.MustCompile(`^https?://[^\s]+$`)
	if !urlRegex.MatchString(l.URL) {
		return errors.New("invalid URL format")
	}

	return nil
}

// Update обновляет поля ссылки
func (l *Link) Update(title, url, description string) error {
	if title != "" {
		l.Title = title
	}
	if url != "" {
		l.URL = url
	}
	l.Description = description
	l.UpdatedAt = time.Now()

	return l.Validate()
}
