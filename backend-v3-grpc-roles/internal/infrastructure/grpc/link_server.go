package grpc

import (
	"backend-go-postgres/internal/application/usecase"
	"backend-go-postgres/internal/domain/entity"
	pb "backend-go-postgres/proto/pb"
	"context"
	"fmt"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

// LinkServer реализует gRPC сервер для управления ссылками
type LinkServer struct {
	pb.UnimplementedLinkServiceServer
	linkUseCase *usecase.LinkUseCase
}

// NewLinkServer создает новый gRPC сервер для ссылок
func NewLinkServer(linkUseCase *usecase.LinkUseCase) *LinkServer {
	return &LinkServer{
		linkUseCase: linkUseCase,
	}
}

// getUserIDFromContext извлекает userID из метаданных gRPC
func getUserIDFromContext(ctx context.Context) (uint, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return 0, status.Error(codes.Unauthenticated, "metadata not found")
	}

	userIDs := md.Get("user-id")
	if len(userIDs) == 0 {
		return 0, status.Error(codes.Unauthenticated, "user-id not found in metadata")
	}

	var userID uint
	if _, err := fmt.Sscanf(userIDs[0], "%d", &userID); err != nil {
		return 0, status.Error(codes.Unauthenticated, "invalid user-id")
	}

	return userID, nil
}

// getRoleFromContext извлекает role из метаданных gRPC
func getRoleFromContext(ctx context.Context) string {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return "user" // По умолчанию user
	}

	roles := md.Get("role")
	if len(roles) == 0 {
		return "user" // По умолчанию user
	}

	return roles[0]
}

// CreateLink создает новую ссылку
func (s *LinkServer) CreateLink(ctx context.Context, req *pb.CreateLinkRequest) (*pb.LinkResponse, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	link, err := s.linkUseCase.CreateLink(userID, req.Title, req.Url, req.Description)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &pb.LinkResponse{
		Success: true,
		Link:    entityToProtoLink(link),
		Message: "Link created successfully",
	}, nil
}

// GetLinks получает все ссылки пользователя
func (s *LinkServer) GetLinks(ctx context.Context, req *pb.GetLinksRequest) (*pb.GetLinksResponse, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	role := getRoleFromContext(ctx)

	links, err := s.linkUseCase.GetAllLinks(userID, role)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	pbLinks := make([]*pb.Link, len(links))
	for i, link := range links {
		pbLinks[i] = entityToProtoLink(link)
	}

	return &pb.GetLinksResponse{
		Links: pbLinks,
		Count: int32(len(links)),
	}, nil
}

// GetLink получает ссылку по ID
func (s *LinkServer) GetLink(ctx context.Context, req *pb.GetLinkRequest) (*pb.LinkResponse, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	link, err := s.linkUseCase.GetLinkByID(userID, uint(req.Id))
	if err != nil {
		return nil, status.Error(codes.NotFound, "Link not found")
	}

	return &pb.LinkResponse{
		Success: true,
		Link:    entityToProtoLink(link),
		Message: "Link retrieved successfully",
	}, nil
}

// UpdateLink обновляет ссылку
func (s *LinkServer) UpdateLink(ctx context.Context, req *pb.UpdateLinkRequest) (*pb.LinkResponse, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	link, err := s.linkUseCase.UpdateLink(userID, uint(req.Id), req.Title, req.Url, req.Description)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &pb.LinkResponse{
		Success: true,
		Link:    entityToProtoLink(link),
		Message: "Link updated successfully",
	}, nil
}

// DeleteLink удаляет ссылку
func (s *LinkServer) DeleteLink(ctx context.Context, req *pb.DeleteLinkRequest) (*pb.DeleteLinkResponse, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	if err := s.linkUseCase.DeleteLink(userID, uint(req.Id)); err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &pb.DeleteLinkResponse{
		Success: true,
		Message: "Link deleted successfully",
	}, nil
}

// GetStatistics получает статистику пользователя
func (s *LinkServer) GetStatistics(ctx context.Context, req *pb.GetStatisticsRequest) (*pb.StatisticsResponse, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	role := getRoleFromContext(ctx)

	stats, err := s.linkUseCase.GetStatistics(userID, role)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	totalLinks, ok := stats["totalLinks"].(int64)
	if !ok {
		totalLinks = 0
	}

	return &pb.StatisticsResponse{
		TotalLinks: int32(totalLinks),
	}, nil
}

// entityToProtoLink конвертирует entity.Link в pb.Link
func entityToProtoLink(link *entity.Link) *pb.Link {
	return &pb.Link{
		Id:          uint32(link.ID),
		UserId:      uint32(link.UserID),
		Title:       link.Title,
		Url:         link.URL,
		Description: link.Description,
		CreatedAt:   link.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   link.UpdatedAt.Format(time.RFC3339),
	}
}
