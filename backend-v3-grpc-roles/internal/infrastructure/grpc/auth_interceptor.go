package grpc

import (
	"backend-go-postgres/internal/infrastructure/auth/jwt"
	"context"
	"fmt"
	"strings"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

// AuthInterceptor - gRPC interceptor для проверки JWT токена
func AuthInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	// Публичные методы (не требуют токена)
	publicMethods := map[string]bool{
		"/linkmanager.AuthService/Register": true,
		"/linkmanager.AuthService/Login":    true,
	}

	// Если метод публичный, пропускаем проверку токена
	if publicMethods[info.FullMethod] {
		return handler(ctx, req)
	}

	// Получаем метаданные из контекста
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "metadata not found")
	}

	// Извлекаем токен из заголовка authorization
	authHeaders := md.Get("authorization")
	if len(authHeaders) == 0 {
		return nil, status.Error(codes.Unauthenticated, "authorization header required")
	}

	authHeader := authHeaders[0]

	// Проверяем формат "Bearer <token>"
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" {
		return nil, status.Error(codes.Unauthenticated, "invalid authorization header format")
	}

	tokenString := parts[1]

	// Валидируем токен
	claims, err := jwt.ValidateToken(tokenString)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "invalid or expired token")
	}

	// Добавляем данные пользователя в метаданные контекста
	ctx = metadata.NewIncomingContext(ctx, metadata.Pairs(
		"user-id", fmt.Sprintf("%d", claims.UserID),
		"username", claims.Username,
		"email", claims.Email,
		"role", claims.Role,
	))

	return handler(ctx, req)
}
