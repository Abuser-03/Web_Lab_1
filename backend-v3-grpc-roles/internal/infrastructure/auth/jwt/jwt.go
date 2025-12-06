package jwt

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	// SecretKey - секретный ключ для подписи JWT (в продакшене использовать из .env)
	SecretKey = []byte("your-secret-key-change-in-production")

	// ErrInvalidToken - ошибка невалидного токена
	ErrInvalidToken = errors.New("invalid token")
)

// Claims представляет полезную нагрузку JWT токена
type Claims struct {
	UserID   uint   `json:"userId"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Role     string `json:"role"` // admin или user
	jwt.RegisteredClaims
}

// GenerateToken генерирует новый JWT токен для пользователя
func GenerateToken(userID uint, username, email, role string) (string, error) {
	// Токен действителен 24 часа
	expirationTime := time.Now().Add(24 * time.Hour)

	claims := &Claims{
		UserID:   userID,
		Username: username,
		Email:    email,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(SecretKey)
}

// ValidateToken проверяет и парсит JWT токен
func ValidateToken(tokenString string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return SecretKey, nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}
