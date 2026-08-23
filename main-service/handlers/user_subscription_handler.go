package handlers

import (
	"context"
	"main-service/infrastructure/grpc"
	"main-service/pb"
	"main-service/usecases"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type UserSubscriptionHandler struct {
	usecase    *usecases.UserSubscriptionUseCase
	authClient *grpc.AuthClient
}

func NewUserSubscriptionHandler(usecase *usecases.UserSubscriptionUseCase, authClient *grpc.AuthClient) *UserSubscriptionHandler {
	return &UserSubscriptionHandler{
		usecase:    usecase,
		authClient: authClient,
	}
}

type SubscribeRequest struct {
	PlanID string `json:"plan_id"`
}

func (h *UserSubscriptionHandler) Subscribe(c fiber.Ctx) error {
	userStr := c.Locals("user_id")
	if userStr == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}
	userID := userStr.(string)

	var req SubscribeRequest
	if err := c.Bind().JSON(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	planID, err := uuid.Parse(req.PlanID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid plan ID"})
	}

	// 1. Create subscription in DB
	sub, err := h.usecase.SubscribeUser(userID, planID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	// 2. Call auth-service via gRPC to update role to Member
	// Normally we would use a payment gateway, but since this is just DB/backend restructuring,
	// we will directly update the role.
	_, grpcErr := h.authClient.GetClient().UpdateUserRole(context.Background(), &pb.UpdateUserRoleRequest{
		UserId: userID,
		Role:   "Member",
	})

	if grpcErr != nil {
		// Log error, maybe rollback subscription?
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Subscription created but failed to update role: " + grpcErr.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(sub)
}
