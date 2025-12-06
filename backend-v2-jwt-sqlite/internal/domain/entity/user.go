package entity

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

// User представляет пользователя системы
type User struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Username  string    `json:"username" gorm:"unique;not null"`
	Email     string    `json:"email" gorm:"unique;not null"`
	Password  string    `json:"-" gorm:"not null"` // Не возвращать в JSON
	Role      string    `json:"role" gorm:"default:'user';not null"` // admin или user
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// IsAdmin проверяет, является ли пользователь администратором
func (u *User) IsAdmin() bool {
	return u.Role == "admin"
}

// HashPassword хеширует пароль пользователя
func (u *User) HashPassword(password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedPassword)
	return nil
}

// CheckPassword проверяет соответствие пароля
func (u *User) CheckPassword(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
}

// Validate валидирует данные пользователя
func (u *User) Validate() error {
	if u.Username == "" {
		return ErrUsernameRequired
	}
	if u.Email == "" {
		return ErrEmailRequired
	}
	if len(u.Password) < 6 {
		return ErrPasswordTooShort
	}
	return nil
}

// Ошибки валидации
var (
	ErrUsernameRequired = &ValidationError{Field: "username", Message: "Username is required"}
	ErrEmailRequired    = &ValidationError{Field: "email", Message: "Email is required"}
	ErrPasswordTooShort = &ValidationError{Field: "password", Message: "Password must be at least 6 characters"}
)

// ValidationError представляет ошибку валидации
type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}
