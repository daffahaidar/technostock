package grpc

import (
	"context"
	"strings"

	"main-service/domain/entities"
	"main-service/pb"
	"main-service/usecases"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

type ProductPlanGrpcServer struct {
	pb.UnimplementedProductPlanServiceServer
	useCase    *usecases.ProductPlanUseCase
	authClient *AuthClient
}

func NewProductPlanGrpcServer(useCase *usecases.ProductPlanUseCase, authClient *AuthClient) *ProductPlanGrpcServer {
	return &ProductPlanGrpcServer{
		useCase:    useCase,
		authClient: authClient,
	}
}

func (s *ProductPlanGrpcServer) CreateProductPlan(ctx context.Context, req *pb.CreateProductPlanRequest) (*pb.CreateProductPlanResponse, error) {
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
	categoryID, err := uuid.Parse(req.GetCategoryId())
	if err != nil {
		return nil, err
	}

	plan := &entities.ProductPlan{
		CategoryID:  categoryID,
		Name:        req.GetName(),
		Slug:        strings.ReplaceAll(strings.ToLower(req.GetName()), " ", "-"),
		Description: req.GetDescription(),
		Price:       req.GetPrice(),
	}

	if err := s.useCase.CreateProductPlan(plan); err != nil {
		return nil, err
	}

	return &pb.CreateProductPlanResponse{
		Data: &pb.ProductPlan{
			Id:          plan.ID.String(),
			CategoryId:  plan.CategoryID.String(),
			Name:        plan.Name,
			Slug:        plan.Slug,
			Description: plan.Description,
			Price:       plan.Price,
		},
		Message: "Product Plan created successfully",
	}, nil
}

func (s *ProductPlanGrpcServer) GetProductPlansByCategoryId(ctx context.Context, req *pb.GetProductPlansByCategoryIdRequest) (*pb.GetProductPlansResponse, error) {
	categoryID, err := uuid.Parse(req.GetCategoryId())
	if err != nil {
		return nil, err
	}

	plans, err := s.useCase.GetProductPlansByCategoryID(categoryID)
	if err != nil {
		return nil, err
	}

	var pbPlans []*pb.ProductPlan
	for _, p := range plans {
		pbPlans = append(pbPlans, &pb.ProductPlan{
			Id:          p.ID.String(),
			CategoryId:  p.CategoryID.String(),
			Name:        p.Name,
			Slug:        p.Slug,
			Description: p.Description,
			Price:       p.Price,
		})
	}

	return &pb.GetProductPlansResponse{
		Data:    pbPlans,
		Message: "Success",
	}, nil
}
