package usecase

import (
	"backend-go-postgres/internal/domain/entity"
	"backend-go-postgres/internal/domain/repository"
	"backend-go-postgres/internal/infrastructure/auth/jwt"
	"errors"
)

var (
	ErrUserAlreadyExists = errors.New("user already exists")
	ErrInvalidCredentials = errors.New("invalid credentials")
)

// AuthUseCase содержит бизнес-логику аутентификации
type AuthUseCase struct {
	userRepo repository.UserRepository
}

// NewAuthUseCase создает новый use case для аутентификации
func NewAuthUseCase(userRepo repository.UserRepository) *AuthUseCase {
	return &AuthUseCase{
		userRepo: userRepo,
	}
}

// Register регистрирует нового пользователя
func (uc *AuthUseCase) Register(username, email, password string) (*entity.User, string, error) {
	// Проверяем, существует ли пользователь с таким username
	existingUser, err := uc.userRepo.GetByUsername(username)
	if err != nil {
		return nil, "", err
	}
	if existingUser != nil {
		return nil, "", ErrUserAlreadyExists
	}

	// Проверяем, существует ли пользователь с таким email
	existingUser, err = uc.userRepo.GetByEmail(email)
	if err != nil {
		return nil, "", err
	}
	if existingUser != nil {
		return nil, "", ErrUserAlreadyExists
	}

	// Создаем нового пользователя
	user := &entity.User{
		Username: username,
		Email:    email,
		Role:     "user", // По умолчанию обычный пользователь
	}

	// Хешируем пароль
	if err := user.HashPassword(password); err != nil {
		return nil, "", err
	}

	// Валидируем
	if err := user.Validate(); err != nil {
		return nil, "", err
	}

	// Сохраняем в БД
	if err := uc.userRepo.Create(user); err != nil {
		return nil, "", err
	}

	// Генерируем JWT токен с ролью
	token, err := jwt.GenerateToken(user.ID, user.Username, user.Email, user.Role)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

// Login выполняет вход пользователя
func (uc *AuthUseCase) Login(username, password string) (*entity.User, string, error) {
	// Находим пользователя по username
	user, err := uc.userRepo.GetByUsername(username)
	if err != nil {
		return nil, "", err
	}
	if user == nil {
		return nil, "", ErrInvalidCredentials
	}

	// Проверяем пароль
	if err := user.CheckPassword(password); err != nil {
		return nil, "", ErrInvalidCredentials
	}

	// Генерируем JWT токен с ролью
	token, err := jwt.GenerateToken(user.ID, user.Username, user.Email, user.Role)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

// GetUserByID получает пользователя по ID
func (uc *AuthUseCase) GetUserByID(id uint) (*entity.User, error) {
	return uc.userRepo.GetByID(id)
}
