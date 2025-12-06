package grpc

import (
	"backend-go-postgres/internal/application/usecase"
	"backend-go-postgres/internal/domain/entity"
	pb "backend-go-postgres/proto/pb"
	"context"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// AuthServer реализует gRPC сервер для аутентификации
type AuthServer struct {
	pb.UnimplementedAuthServiceServer
	authUseCase *usecase.AuthUseCase
}

// NewAuthServer создает новый gRPC сервер для аутентификации
func NewAuthServer(authUseCase *usecase.AuthUseCase) *AuthServer {
	return &AuthServer{
		authUseCase: authUseCase,
	}
}

// Register регистрирует нового пользователя
func (s *AuthServer) Register(ctx context.Context, req *pb.RegisterRequest) (*pb.AuthResponse, error) {
	// Регистрируем пользователя и получаем токен
	user, token, err := s.authUseCase.Register(req.Username, req.Email, req.Password)
	if err != nil {
		return nil, status.Error(codes.AlreadyExists, err.Error())
	}

	return &pb.AuthResponse{
		Success: true,
		User:    entityToProtoUser(user),
		Token:   token,
		Message: "User registered successfully",
	}, nil
}

// Login выполняет вход пользователя
func (s *AuthServer) Login(ctx context.Context, req *pb.LoginRequest) (*pb.AuthResponse, error) {
	user, token, err := s.authUseCase.Login(req.Username, req.Password)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "Invalid credentials")
	}

	return &pb.AuthResponse{
		Success: true,
		User:    entityToProtoUser(user),
		Token:   token,
		Message: "Login successful",
	}, nil
}

// GetProfile получает профиль пользователя
func (s *AuthServer) GetProfile(ctx context.Context, req *pb.GetProfileRequest) (*pb.UserResponse, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	user, err := s.authUseCase.GetUserByID(userID)
	if err != nil {
		return nil, status.Error(codes.NotFound, "User not found")
	}

	return &pb.UserResponse{
		Success: true,
		User:    entityToProtoUser(user),
		Message: "Profile retrieved successfully",
	}, nil
}

// entityToProtoUser конвертирует entity.User в pb.User
func entityToProtoUser(user *entity.User) *pb.User {
	return &pb.User{
		Id:        uint32(user.ID),
		Username:  user.Username,
		Email:     user.Email,
		Role:      string(user.Role),
		CreatedAt: user.CreatedAt.Format(time.RFC3339),
		UpdatedAt: user.UpdatedAt.Format(time.RFC3339),
	}
}
