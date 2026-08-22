package grpc

import (
	"context"
	"strings"

	"main-service/domain/entities"
	"main-service/pb"
	"main-service/usecases"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

type ProductCategoryGrpcServer struct {
	pb.UnimplementedProductCategoryServiceServer
	useCase    *usecases.ProductCategoryUseCase
	authClient *AuthClient
}

func NewProductCategoryGrpcServer(useCase *usecases.ProductCategoryUseCase, authClient *AuthClient) *ProductCategoryGrpcServer {
	return &ProductCategoryGrpcServer{
		useCase:    useCase,
		authClient: authClient,
	}
}

func (s *ProductCategoryGrpcServer) CreateProductCategory(ctx context.Context, req *pb.CreateProductCategoryRequest) (*pb.CreateProductCategoryResponse, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, status.Errorf(codes.Unauthenticated, "metadata is not provided")
	}

	authHeader, ok := md["authorization"]
	if !ok || len(authHeader) == 0 {
		return nil, status.Errorf(codes.Unauthenticated, "authorization token is not provided")
	}

	token := strings.TrimPrefix(authHeader[0], "Bearer ")

	authRes, err := s.authClient.ValidateToken(ctx, token)
	if err != nil || !authRes.IsValid {
		return nil, status.Errorf(codes.Unauthenticated, "invalid token")
	}

	userRole := strings.Trim(authRes.Role, `"`)
	if userRole != "Maintainer" {
		return nil, status.Errorf(codes.PermissionDenied, "access denied: insufficient permissions")
	}
	category := &entities.ProductCategory{
		Name:        req.GetName(),
		Slug:        strings.ReplaceAll(strings.ToLower(req.GetName()), " ", "-"),
		Description: req.GetDescription(),
	}

	if err := s.useCase.CreateCategory(category); err != nil {
		return nil, err
	}

	return &pb.CreateProductCategoryResponse{
		Data: &pb.ProductCategory{
			Id:          category.ID.String(),
			Name:        category.Name,
			Slug:        category.Slug,
			Description: category.Description,
		},
		Message: "Product Category created successfully",
	}, nil
}

func (s *ProductCategoryGrpcServer) GetProductCategories(ctx context.Context, req *pb.GetProductCategoriesRequest) (*pb.GetProductCategoriesResponse, error) {
	categories, err := s.useCase.GetAllCategories()
	if err != nil {
		return nil, err
	}

	var pbCategories []*pb.ProductCategory
	for _, c := range categories {
		pbCategories = append(pbCategories, &pb.ProductCategory{
			Id:          c.ID.String(),
			Name:        c.Name,
			Slug:        c.Slug,
			Description: c.Description,
		})
	}

	return &pb.GetProductCategoriesResponse{
		Data:    pbCategories,
		Message: "Success",
	}, nil
}
